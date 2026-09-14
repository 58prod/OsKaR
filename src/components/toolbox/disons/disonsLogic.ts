import { initialChrono, type ToolChrono } from '@/components/toolbox/shared/toolChrono';
import type { BoardNote } from '@/components/toolbox/shared/boardNotes';

/** Logique pure de « Disons-nous les choses » (deux colonnes Freins / Moteurs). */

/** Accent rouge de l'outil (cohérent avec sa bannière). */
export const DISONS_ACCENT = '#be123c';

/** Longueur maximale d'une carte. */
export const DISONS_TEXT_MAX = 240;

export type DisonsKind = 'frein' | 'moteur';

export interface DisonsKindInfo {
  key: DisonsKind;
  label: string;
  /** Titre de la colonne sur le tableau partagé. */
  columnTitle: string;
  color: string;
  /** Fond pastel de la colonne. */
  bg: string;
  placeholder: string;
}

/** Les deux types de carte dans l'ordre d'affichage des colonnes. */
export const DISONS_KINDS: DisonsKindInfo[] = [
  {
    key: 'frein', label: 'Frein', columnTitle: 'Ce qui nous freine',
    color: '#e11d48', bg: '#fff1f2',
    placeholder: "Décrivez ce qui freine l'équipe…",
  },
  {
    key: 'moteur', label: 'Moteur', columnTitle: 'Ce qui nous propulse',
    color: '#16a34a', bg: '#f0fdf4',
    placeholder: "Décrivez ce qui propulse l'équipe…",
  },
];

export function getDisonsKind(key: string): DisonsKindInfo {
  return DISONS_KINDS.find((k) => k.key === key) ?? DISONS_KINDS[0];
}

/** Nombre de cœurs par personne (0 = illimité). */
export const DISONS_VOTE_LIMITS = [0, 3, 5, 10];

export interface DisonsState {
  notes: BoardNote[];
  /**
   * Cartes anonymes : l'auteur n'est pas affiché. Activé par défaut, pour
   * que chacun ose nommer les freins.
   */
  anonymous: boolean;
  /** Cœurs par personne, 0 = illimité. */
  voteLimit: number;
  /**
   * Numéro de séance, augmenté à chaque « Réinitialiser » : une carte
   * envoyée juste avant la remise à zéro est ignorée au lieu de réapparaître.
   */
  round: number;
  chrono: ToolChrono;
  /**
   * Cartes supprimées pendant la séance : un message en retard (ajout,
   * publication) ne peut pas les faire revenir.
   */
  deleted: string[];
}

export const INITIAL_DISONS_STATE: DisonsState = {
  notes: [],
  anonymous: true,
  voteLimit: 0,
  round: 0,
  chrono: initialChrono(300),
  deleted: [],
};

const texte = (v: unknown, max: number) => (typeof v === 'string' ? v.trim().slice(0, max) : '');

/** Une carte reçue du réseau, nettoyée ; null si elle est inutilisable. */
export function sanitizeCard(raw: unknown): BoardNote | null {
  if (!raw || typeof raw !== 'object') return null;
  const n = raw as Record<string, unknown>;
  const id = texte(n.id, 60);
  const authorId = texte(n.authorId, 80);
  const text = texte(n.text, DISONS_TEXT_MAX);
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
    category: getDisonsKind(texte(n.category, 10)).key,
    text,
    revealed,
    likedBy: revealed ? likedBy : [],
    retained: revealed && n.retained === true,
  };
}

/**
 * Complète un état enregistré avant l'ajout d'un champ (sessions déjà
 * ouvertes). Une ancienne séance garde son affichage nominatif.
 */
export function normalizeDisonsState(raw: Partial<DisonsState> | null | undefined): DisonsState {
  const s = raw ?? {};
  const notes = Array.isArray(s.notes)
    ? s.notes.map(sanitizeCard).filter((n): n is BoardNote => n !== null)
    : [];
  return {
    ...INITIAL_DISONS_STATE,
    ...s,
    notes,
    anonymous: typeof s.anonymous === 'boolean' ? s.anonymous : notes.length === 0,
    voteLimit: typeof s.voteLimit === 'number' ? s.voteLimit : 0,
    round: typeof s.round === 'number' ? s.round : 0,
    chrono: s.chrono ?? INITIAL_DISONS_STATE.chrono,
    deleted: Array.isArray(s.deleted) ? s.deleted.filter((x): x is string => typeof x === 'string') : [],
  };
}

/** Cœurs déjà donnés par une personne sur les cartes publiées. */
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
 * Opérations de « Disons-nous les choses », diffusées à tous les participants
 * qui les appliquent avec `disonsReducer` (même modèle que la Boîte à idées) :
 * toute l'équipe peut écrire, publier et voter dans la même seconde sans que
 * rien ne se perde. Toutes sont idempotentes, condition du socle `useToolSession`.
 */
export type DisonsOp =
  /** Nouvelle carte, en brouillon (visible par son auteur seulement). */
  | { t: 'add'; round: number; note: BoardNote }
  /**
   * Publication de brouillons d'un auteur. Les cartes voyagent avec : si leur
   * « add » arrive après (messages dans le désordre), elles sont quand même publiées.
   */
  | { t: 'publish'; authorId: string; ids: string[]; round?: number; notes?: BoardNote[] }
  /** Suppression : son propre brouillon, ou n'importe quelle carte par l'animateur. */
  | { t: 'delete'; id: string; by: string; moderator?: boolean }
  | { t: 'like'; id: string; voterId: string; liked: boolean }
  | { t: 'retain'; id: string; retained: boolean }
  | { t: 'anonymous'; value: boolean }
  | { t: 'voteLimit'; value: number }
  | { t: 'chrono'; chrono: ToolChrono }
  /** Nouvelle séance (`round` = séance courante + 1) : cartes effacées, réglages gardés. */
  | { t: 'reset'; round: number; chrono?: ToolChrono };

export function disonsReducer(raw: DisonsState, op: DisonsOp): DisonsState {
  const s = normalizeDisonsState(raw);
  switch (op.t) {
    case 'add': {
      if (op.round !== s.round || s.deleted.includes(op.note?.id)) return s;
      const note = sanitizeCard({ ...op.note, revealed: false, likedBy: [], retained: false });
      return note ? { ...s, notes: insertById(s.notes, note) } : s;
    }
    case 'publish': {
      // Publication d'une séance effacée depuis : ignorée.
      if (op.round !== undefined && op.round !== s.round) return s;
      const ids = new Set(op.ids);
      let notes = s.notes;
      (op.notes ?? []).forEach((raw) => {
        const recu = sanitizeCard({ ...raw, revealed: false, likedBy: [], retained: false });
        if (recu && ids.has(recu.id) && recu.authorId === op.authorId && !s.deleted.includes(recu.id)) {
          notes = insertById(notes, recu);
        }
      });
      if (!notes.some((n) => ids.has(n.id) && n.authorId === op.authorId && !n.revealed)) return s;
      return {
        ...s,
        notes: notes.map((n) => (ids.has(n.id) && n.authorId === op.authorId ? { ...n, revealed: true } : n)),
      };
    }
    case 'delete': {
      const note = s.notes.find((n) => n.id === op.id);
      if (note && !(op.moderator || (note.authorId === op.by && !note.revealed))) return s;
      const deleted = s.deleted.includes(op.id) ? s.deleted : [...s.deleted, op.id];
      // Pas encore arrivée ici : on retient seulement qu'elle est supprimée.
      if (!note) return deleted === s.deleted ? s : { ...s, deleted };
      return { ...s, notes: s.notes.filter((n) => n.id !== op.id), deleted };
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
      return { ...s, round: op.round, notes: [], deleted: [], chrono: op.chrono ?? s.chrono };
    default:
      return s;
  }
}

/* ── Affichage et export ─────────────────────────────────────────────────── */

/** Cartes publiées d'une colonne : retenues d'abord, puis par cœurs, puis les plus récentes. */
export function columnCards(notes: BoardNote[], kind: DisonsKind): BoardNote[] {
  return notes
    .filter((n) => n.revealed && n.category === kind)
    .reverse()
    .sort((a, b) => Number(b.retained) - Number(a.retained) || b.likedBy.length - a.likedBy.length);
}

/** Nom affiché pour l'auteur d'une carte (masqué si la séance est anonyme). */
export function cardAuthor(note: BoardNote, anonymous: boolean): string {
  return anonymous ? 'Anonyme' : note.authorName;
}

/** Résumé texte de la séance (export .txt). */
export function buildDisonsSummary(state: DisonsState, date: Date = new Date()): string {
  const published = state.notes.filter((n) => n.revealed);
  const votes = published.reduce((sum, n) => sum + n.likedBy.length, 0);
  let txt = `DISONS-NOUS LES CHOSES — OSKAR — ${date.toLocaleDateString('fr-FR')}\n${'='.repeat(48)}\n`;
  txt += `Cartes publiées : ${published.length} · votes : ${votes} · retenues : ${published.filter((n) => n.retained).length}\n`;
  if (state.anonymous) txt += 'Séance anonyme : auteurs non indiqués.\n';
  txt += '\n';
  DISONS_KINDS.forEach((kind) => {
    const pool = columnCards(state.notes, kind.key);
    txt += `${kind.columnTitle.toUpperCase()}\n${'-'.repeat(30)}\n`;
    if (pool.length === 0) txt += '  (aucune carte)\n';
    pool.forEach((n) => {
      const v = n.likedBy.length;
      const auteur = state.anonymous ? '' : ` — ${n.authorName}`;
      txt += `${n.retained ? '[✓] ' : '    '}${n.text}  (${v} vote${v > 1 ? 's' : ''}${auteur})\n`;
    });
    txt += '\n';
  });
  return txt;
}
