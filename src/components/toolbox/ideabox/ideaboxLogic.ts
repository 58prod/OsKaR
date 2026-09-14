import { initialChrono, type ToolChrono } from '@/components/toolbox/shared/toolChrono';
import type { BoardNote } from '@/components/toolbox/shared/boardNotes';

/** Logique pure de la Boîte à idées (soumission, votes cœurs, sélection). */

/** Accent ambre de l'outil (cohérent avec sa bannière). */
export const IDEABOX_ACCENT = '#b45309';

/** Longueur maximale d'une idée. */
export const IDEA_MAX = 240;

export type IdeaCategoryKey = 'process' | 'tools' | 'team' | 'client' | 'other';

export interface IdeaCategory {
  key: IdeaCategoryKey;
  label: string;
  color: string;
}

/** Catégories d'idée proposées dans le composeur et les filtres. */
export const IDEA_CATEGORIES: IdeaCategory[] = [
  { key: 'process', label: 'Processus', color: '#6366f1' },
  { key: 'tools', label: 'Outils', color: '#0ea5e9' },
  { key: 'team', label: 'Équipe', color: '#ec4899' },
  { key: 'client', label: 'Client', color: '#22c55e' },
  { key: 'other', label: 'Autre', color: '#94a3b8' },
];

export function getIdeaCategory(key: string): IdeaCategory {
  return IDEA_CATEGORIES.find((c) => c.key === key) ?? IDEA_CATEGORIES[4];
}

/** Nombre de cœurs par personne (0 = illimité). */
export const VOTE_LIMITS = [
  { value: 0, label: 'Illimités' },
  { value: 3, label: '3 cœurs' },
  { value: 5, label: '5 cœurs' },
  { value: 10, label: '10 cœurs' },
];

export interface IdeaboxState {
  /** Idées rangées par identifiant horodaté (la plus ancienne en premier). */
  notes: BoardNote[];
  /** Idées anonymes : l'auteur n'est pas affiché. */
  anonymous: boolean;
  /** Cœurs par personne, 0 = illimité. */
  voteLimit: number;
  /**
   * Numéro de séance, augmenté à chaque « Réinitialiser » : une idée envoyée
   * juste avant la remise à zéro est ignorée au lieu de réapparaître.
   */
  round: number;
  chrono: ToolChrono;
}

export const INITIAL_IDEABOX_STATE: IdeaboxState = {
  notes: [],
  anonymous: false,
  voteLimit: 0,
  round: 0,
  chrono: initialChrono(300),
};

const texte = (v: unknown, max: number) => (typeof v === 'string' ? v.trim().slice(0, max) : '');

/** Une idée reçue du réseau, nettoyée ; null si elle est inutilisable. */
export function sanitizeIdea(raw: unknown): BoardNote | null {
  if (!raw || typeof raw !== 'object') return null;
  const n = raw as Record<string, unknown>;
  const id = texte(n.id, 60);
  const authorId = texte(n.authorId, 80);
  const text = texte(n.text, IDEA_MAX);
  if (!id || !authorId || !text) return null;
  const revealed = n.revealed === true;
  const likedBy = Array.isArray(n.likedBy)
    ? [...new Set(n.likedBy.filter((x): x is string => typeof x === 'string' && x !== authorId))]
    : [];
  return {
    id,
    authorId,
    authorName: texte(n.authorName, 40) || 'Participant',
    authorColor: texte(n.authorColor, 20) || '#94a3b8',
    category: getIdeaCategory(texte(n.category, 20)).key,
    text,
    revealed,
    likedBy: revealed ? likedBy : [],
    retained: revealed && n.retained === true,
  };
}

/** Complète un état enregistré avant l'ajout d'un champ (sessions déjà ouvertes). */
export function normalizeIdeaboxState(raw: Partial<IdeaboxState> | null | undefined): IdeaboxState {
  const s = raw ?? {};
  const notes = Array.isArray(s.notes)
    ? s.notes.map(sanitizeIdea).filter((n): n is BoardNote => n !== null)
    : [];
  return {
    ...INITIAL_IDEABOX_STATE,
    ...s,
    notes,
    anonymous: !!s.anonymous,
    voteLimit: typeof s.voteLimit === 'number' ? s.voteLimit : 0,
    round: typeof s.round === 'number' ? s.round : 0,
    chrono: s.chrono ?? INITIAL_IDEABOX_STATE.chrono,
  };
}

/** Cœurs déjà donnés par une personne sur les idées publiées. */
export function votesUsedBy(notes: BoardNote[], voterId: string): number {
  return notes.filter((n) => n.revealed && n.likedBy.includes(voterId)).length;
}

/** Insère en gardant l'ordre des identifiants (horodatés) : même ordre partout. */
function insertById(list: BoardNote[], item: BoardNote): BoardNote[] {
  if (list.some((x) => x.id === item.id)) return list;
  const i = list.findIndex((x) => x.id > item.id);
  return i < 0 ? [...list, item] : [...list.slice(0, i), item, ...list.slice(i)];
}

/* ── Opérations partagées ─────────────────────────────────────────────────── */

/**
 * Opérations de la Boîte à idées, diffusées à tous les participants qui les
 * appliquent avec `ideaboxReducer` : dix personnes peuvent proposer et voter
 * dans la même seconde sans que rien ne se perde. Toutes sont idempotentes
 * (les rejouer ne change rien), condition du socle `useToolSession`.
 */
export type IdeaboxOp =
  /** Nouvelle idée, en brouillon (visible par son auteur seulement). */
  | { t: 'add'; round: number; note: BoardNote }
  /** Publication de brouillons d'un auteur dans l'espace commun. */
  | { t: 'publish'; authorId: string; ids: string[] }
  /** Suppression : son propre brouillon, ou n'importe quelle idée par l'animateur. */
  | { t: 'delete'; id: string; by: string; moderator?: boolean }
  | { t: 'like'; id: string; voterId: string; liked: boolean }
  | { t: 'retain'; id: string; retained: boolean }
  | { t: 'anonymous'; value: boolean }
  | { t: 'voteLimit'; value: number }
  | { t: 'chrono'; chrono: ToolChrono }
  /** Nouvelle séance (`round` = séance courante + 1) : idées effacées, réglages gardés. */
  | { t: 'reset'; round: number; chrono?: ToolChrono };

export function ideaboxReducer(raw: IdeaboxState, op: IdeaboxOp): IdeaboxState {
  const s = normalizeIdeaboxState(raw);
  switch (op.t) {
    case 'add': {
      if (op.round !== s.round) return s;
      const note = sanitizeIdea({ ...op.note, revealed: false, likedBy: [], retained: false });
      return note ? { ...s, notes: insertById(s.notes, note) } : s;
    }
    case 'publish': {
      const ids = new Set(op.ids);
      if (!s.notes.some((n) => ids.has(n.id) && n.authorId === op.authorId && !n.revealed)) return s;
      return {
        ...s,
        notes: s.notes.map((n) => (ids.has(n.id) && n.authorId === op.authorId ? { ...n, revealed: true } : n)),
      };
    }
    case 'delete': {
      const note = s.notes.find((n) => n.id === op.id);
      if (!note) return s;
      const allowed = op.moderator || (note.authorId === op.by && !note.revealed);
      return allowed ? { ...s, notes: s.notes.filter((n) => n.id !== op.id) } : s;
    }
    case 'like': {
      const note = s.notes.find((n) => n.id === op.id);
      if (!note || !note.revealed || note.authorId === op.voterId || !op.voterId) return s;
      if (op.liked === note.likedBy.includes(op.voterId)) return s;
      if (op.liked && s.voteLimit > 0 && votesUsedBy(s.notes, op.voterId) >= s.voteLimit) return s;
      return {
        ...s,
        notes: s.notes.map((n) => (n.id !== op.id ? n : {
          ...n,
          likedBy: op.liked ? [...n.likedBy, op.voterId] : n.likedBy.filter((x) => x !== op.voterId),
        })),
      };
    }
    case 'retain': {
      const note = s.notes.find((n) => n.id === op.id);
      if (!note || !note.revealed || note.retained === op.retained) return s;
      return { ...s, notes: s.notes.map((n) => (n.id === op.id ? { ...n, retained: op.retained } : n)) };
    }
    case 'anonymous':
      return s.anonymous === !!op.value ? s : { ...s, anonymous: !!op.value };
    case 'voteLimit': {
      const value = Math.max(0, Math.min(50, Math.round(Number(op.value) || 0)));
      return s.voteLimit === value ? s : { ...s, voteLimit: value };
    }
    case 'chrono':
      return { ...s, chrono: op.chrono };
    case 'reset':
      if (op.round <= s.round) return s;
      return { ...s, round: op.round, notes: [], chrono: op.chrono ?? s.chrono };
    default:
      return s;
  }
}

/* ── Affichage et export ─────────────────────────────────────────────────── */

export type IdeaSort = 'votes' | 'date';

/**
 * Trie les idées : « votes » = votes décroissants puis récence ;
 * « date » = récence seule (les plus récentes d'abord).
 */
export function sortIdeas(notes: BoardNote[], sort: IdeaSort): BoardNote[] {
  const byRecency = [...notes].reverse();
  if (sort === 'date') return byRecency;
  return byRecency.sort((a, b) => b.likedBy.length - a.likedBy.length);
}

/** Nom affiché pour l'auteur d'une idée (masqué si la séance est anonyme). */
export function authorLabel(note: BoardNote, anonymous: boolean): string {
  return anonymous ? 'Anonyme' : note.authorName;
}

/** Résumé texte de la séance (export .txt). */
export function buildIdeaboxSummary(state: IdeaboxState, date: Date = new Date()): string {
  const published = state.notes.filter((n) => n.revealed);
  const retained = sortIdeas(published.filter((n) => n.retained), 'votes');
  const others = sortIdeas(published.filter((n) => !n.retained), 'votes');
  const totalVotes = published.reduce((sum, n) => sum + n.likedBy.length, 0);

  const line = (n: BoardNote) => {
    const v = n.likedBy.length;
    const auteur = state.anonymous ? '' : ` — ${n.authorName}`;
    return `- [${getIdeaCategory(n.category).label}] ${n.text.trim()}  (${v} vote${v > 1 ? 's' : ''}${auteur})\n`;
  };

  let txt = `BOÎTE À IDÉES OSKAR — ${date.toLocaleDateString('fr-FR')}\n${'='.repeat(44)}\n\n`;
  txt += `Idées publiées : ${published.length}\n`;
  txt += `Votes exprimés : ${totalVotes}\n`;
  txt += `Idées retenues : ${retained.length}\n`;
  if (state.anonymous) txt += 'Séance anonyme : auteurs non indiqués.\n';
  txt += '\n';

  txt += `IDÉES RETENUES\n${'-'.repeat(40)}\n`;
  if (retained.length === 0) txt += '(aucune idée retenue)\n';
  retained.forEach((n) => { txt += line(n); });
  txt += '\n';

  txt += `AUTRES IDÉES PUBLIÉES\n${'-'.repeat(40)}\n`;
  if (others.length === 0) txt += '(aucune idée)\n';
  others.forEach((n) => { txt += line(n); });

  return txt;
}
