import type { BoardNote } from '@/components/toolbox/shared/boardNotes';
import { initialChrono, type ToolChrono } from '@/components/toolbox/shared/toolChrono';

/** Logique pure du Brainstorming (canvas libre de post-its). */

/** Accent vert de l'outil (cohérent avec sa bannière). */
export const BRAINSTORM_ACCENT = '#0d9466';

/** Durée par défaut du minuteur (10 minutes). */
export const BRAINSTORM_DEFAULT_DURATION_SEC = 10 * 60;

/** Longueur maximale d'une idée et du thème. */
export const BRAINSTORM_TEXT_MAX = 200;
export const BRAINSTORM_THEME_MAX = 120;

export type BrainstormColorKey = 'cy' | 'cb' | 'cg' | 'cp' | 'co' | 'cv';

export interface BrainstormColor {
  key: BrainstormColorKey;
  label: string;
  /** Fond du post-it. */
  bg: string;
  /** Pastille du sélecteur / liseré haut du post-it. */
  dot: string;
}

/** Palette des 6 couleurs de post-it (comme la maquette). */
export const BRAINSTORM_COLORS: BrainstormColor[] = [
  { key: 'cy', label: 'Jaune', bg: '#fff9c4', dot: '#f5e35a' },
  { key: 'cb', label: 'Bleu', bg: '#dbeafe', dot: '#93c5fd' },
  { key: 'cg', label: 'Vert', bg: '#dcfce7', dot: '#86efac' },
  { key: 'cp', label: 'Rose', bg: '#fce7f3', dot: '#f9a8d4' },
  { key: 'co', label: 'Orange', bg: '#ffedd5', dot: '#fdba74' },
  { key: 'cv', label: 'Violet', bg: '#ede9fe', dot: '#c4b5fd' },
];

export function getBrainstormColor(key: string): BrainstormColor {
  return BRAINSTORM_COLORS.find((c) => c.key === key) ?? BRAINSTORM_COLORS[0];
}

/** Position d'un post-it sur le canvas : fractions (0–1) + rotation en degrés. */
export interface PostitPosition {
  x: number;
  y: number;
  rot: number;
  /**
   * Heure (ms) du dernier placement : si deux personnes déplacent le même
   * post-it en même temps, le déplacement le plus récent l'emporte partout.
   */
  at?: number;
}

/** Bornes des positions : le post-it reste entièrement sur le canvas. */
export const POS_MAX = { x: 0.9, y: 0.9 };

export interface BrainstormState {
  /** Le champ `category` de chaque note stocke la clé de couleur du post-it. */
  notes: BoardNote[];
  /** Positions des post-its révélés, indexées par id de note. */
  positions: Record<string, PostitPosition>;
  /** Thème de la session, fixé par l'animateur. */
  theme: string;
  chrono: ToolChrono;
  /** Idées anonymes : l'auteur n'est pas affiché. */
  anonymous: boolean;
  /**
   * Numéro de séance, augmenté à chaque « Réinitialiser » : une idée envoyée
   * juste avant la remise à zéro est ignorée au lieu de réapparaître.
   */
  round: number;
  /**
   * Post-its supprimés pendant la séance : un message en retard (ajout,
   * révélation) ne peut pas les faire revenir.
   */
  deleted: string[];
}

export const INITIAL_BRAINSTORM_STATE: BrainstormState = {
  notes: [],
  positions: {},
  theme: '',
  chrono: initialChrono(BRAINSTORM_DEFAULT_DURATION_SEC),
  anonymous: false,
  round: 0,
  deleted: [],
};

const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));
const round3 = (v: number) => Math.round(v * 1000) / 1000;
const texte = (v: unknown, max: number) => (typeof v === 'string' ? v.trim().slice(0, max) : '');

/** Un post-it reçu du réseau, nettoyé ; null s'il est inutilisable. */
export function sanitizeNote(raw: unknown): BoardNote | null {
  if (!raw || typeof raw !== 'object') return null;
  const n = raw as Record<string, unknown>;
  const id = texte(n.id, 60);
  const authorId = texte(n.authorId, 80);
  const text = texte(n.text, BRAINSTORM_TEXT_MAX);
  if (!id || !authorId || !text) return null;
  const revealed = n.revealed === true;
  const likedBy = Array.isArray(n.likedBy) ? [...new Set(n.likedBy.filter((x): x is string => typeof x === 'string'))] : [];
  return {
    id,
    authorId,
    authorName: texte(n.authorName, 40) || 'Participant',
    authorColor: texte(n.authorColor, 20) || '#94a3b8',
    category: getBrainstormColor(texte(n.category, 4)).key,
    text,
    revealed,
    likedBy: revealed ? likedBy : [],
    retained: revealed && n.retained === true,
  };
}

/** Une position reçue du réseau, bornée ; null si elle est inutilisable. */
export function sanitizePosition(raw: unknown): PostitPosition | null {
  if (!raw || typeof raw !== 'object') return null;
  const p = raw as Record<string, unknown>;
  if (typeof p.x !== 'number' || typeof p.y !== 'number' || !Number.isFinite(p.x) || !Number.isFinite(p.y)) return null;
  const rot = typeof p.rot === 'number' && Number.isFinite(p.rot) ? clamp(p.rot, -6, 6) : 0;
  const at = typeof p.at === 'number' && Number.isFinite(p.at) ? p.at : 0;
  return { x: round3(clamp(p.x, 0, POS_MAX.x)), y: round3(clamp(p.y, 0, POS_MAX.y)), rot, at };
}

/** Complète un état enregistré avant l'ajout d'un champ (sessions déjà ouvertes). */
export function normalizeBrainstormState(raw: Partial<BrainstormState> | null | undefined): BrainstormState {
  const s = raw ?? {};
  const notes = Array.isArray(s.notes)
    ? s.notes.map(sanitizeNote).filter((n): n is BoardNote => n !== null)
    : [];
  const positions: Record<string, PostitPosition> = {};
  if (s.positions && typeof s.positions === 'object') {
    notes.forEach((n) => {
      const p = n.revealed ? sanitizePosition((s.positions as Record<string, unknown>)[n.id]) : null;
      if (p) positions[n.id] = p;
    });
  }
  return {
    ...INITIAL_BRAINSTORM_STATE,
    ...s,
    notes,
    positions,
    theme: typeof s.theme === 'string' ? s.theme.slice(0, BRAINSTORM_THEME_MAX) : '',
    chrono: s.chrono ?? INITIAL_BRAINSTORM_STATE.chrono,
    anonymous: !!s.anonymous,
    round: typeof s.round === 'number' ? s.round : 0,
    deleted: Array.isArray(s.deleted) ? s.deleted.filter((x): x is string => typeof x === 'string') : [],
  };
}

/**
 * Place un nouveau post-it là où il y a de la place : parmi plusieurs
 * emplacements tirés au hasard, celui qui est le plus loin des post-its déjà
 * posés. La rotation (−3° à +3°) donne l'aspect « tableau de liège ».
 */
export function freePosition(taken: PostitPosition[], at = 0, rand: () => number = Math.random): PostitPosition {
  let best = { x: 0.4, y: 0.4 };
  let bestScore = -1;
  for (let i = 0; i < 30; i++) {
    const c = { x: 0.03 + rand() * 0.8, y: 0.06 + rand() * 0.76 };
    // Le canvas est plus large que haut : on pondère l'écart horizontal.
    const score = taken.length ? Math.min(...taken.map((p) => Math.hypot((p.x - c.x) * 1.6, p.y - c.y))) : 1;
    if (score > bestScore) { bestScore = score; best = c; }
  }
  return { x: round3(best.x), y: round3(best.y), rot: Math.round((rand() - 0.5) * 60) / 10, at };
}

/**
 * « Ranger par couleur » : grille lisible, couleur par couleur (dans l'ordre
 * de la palette), les plus aimés d'abord. `cols` dépend de la largeur du canvas.
 */
export function arrangeByColor(notes: BoardNote[], cols: number, at: number): Record<string, PostitPosition> {
  const order = BRAINSTORM_COLORS.map((c) => c.key as string);
  const list = notes
    .filter((n) => n.revealed)
    .sort((a, b) => order.indexOf(a.category) - order.indexOf(b.category)
      || b.likedBy.length - a.likedBy.length
      || (a.id < b.id ? -1 : 1));
  const c = Math.max(1, Math.round(cols));
  const rows = Math.max(1, Math.ceil(list.length / c));
  const w = 0.94 / c;
  const h = Math.min(0.2, 0.86 / rows);
  const out: Record<string, PostitPosition> = {};
  list.forEach((n, i) => {
    out[n.id] = { x: round3(0.02 + (i % c) * w), y: round3(0.06 + Math.floor(i / c) * h), rot: 0, at };
  });
  return out;
}

/** Le placement `next` doit-il remplacer `cur` ? Le plus récent gagne, départage stable sinon. */
function newerPosition(next: PostitPosition, cur: PostitPosition | undefined): boolean {
  if (!cur) return true;
  const a = next.at ?? 0;
  const b = cur.at ?? 0;
  if (a !== b) return a > b;
  return next.x !== cur.x ? next.x > cur.x : next.y > cur.y;
}

/** Insère en gardant l'ordre des identifiants (horodatés) : même ordre partout. */
function insertById(list: BoardNote[], item: BoardNote): BoardNote[] {
  if (list.some((x) => x.id === item.id)) return list;
  const i = list.findIndex((x) => x.id > item.id);
  return i < 0 ? [...list, item] : [...list.slice(0, i), item, ...list.slice(i)];
}

/* ── Opérations partagées ─────────────────────────────────────────────────── */

/**
 * Opérations du Brainstorming, diffusées à tous les participants qui les
 * appliquent avec `brainstormReducer` : toute l'équipe peut poser, déplacer
 * et aimer des post-its en même temps sans rien écraser. Toutes sont
 * idempotentes (les rejouer ne change rien), condition du socle `useToolSession`.
 */
export type BrainstormOp =
  /** Nouvelle idée, en préparation (visible par son auteur seulement). */
  | { t: 'add'; round: number; note: BoardNote }
  /**
   * Révélation d'idées d'un auteur, chacune avec sa place sur le canvas. Le
   * post-it voyage avec : si son « add » arrive après (messages dans le
   * désordre), il est quand même révélé.
   */
  | { t: 'reveal'; authorId: string; round?: number; items: { id: string; pos: PostitPosition; note?: BoardNote }[] }
  /** Retour en préparation de toutes les idées révélées d'un auteur. */
  | { t: 'unreveal'; authorId: string }
  /** Suppression : ses propres idées, ou n'importe laquelle par l'animateur. */
  | { t: 'delete'; id: string; by: string; moderator?: boolean }
  | { t: 'move'; id: string; x: number; y: number; at: number }
  /** « Ranger par couleur » : nouvelles places de plusieurs post-its. */
  | { t: 'arrange'; positions: Record<string, PostitPosition> }
  | { t: 'like'; id: string; voterId: string; liked: boolean }
  | { t: 'retain'; id: string; retained: boolean }
  | { t: 'theme'; theme: string }
  | { t: 'anonymous'; value: boolean }
  | { t: 'chrono'; chrono: ToolChrono }
  /** Nouvelle séance (`round` = séance courante + 1) : post-its effacés, thème gardé. */
  | { t: 'reset'; round: number; chrono?: ToolChrono };

export function brainstormReducer(raw: BrainstormState, op: BrainstormOp): BrainstormState {
  const s = normalizeBrainstormState(raw);
  switch (op.t) {
    case 'add': {
      if (op.round !== s.round || s.deleted.includes(op.note?.id)) return s;
      const note = sanitizeNote({ ...op.note, revealed: false, likedBy: [], retained: false });
      return note ? { ...s, notes: insertById(s.notes, note) } : s;
    }
    case 'reveal': {
      // Révélation d'une séance effacée depuis : ignorée.
      if (op.round !== undefined && op.round !== s.round) return s;
      const places = new Map<string, PostitPosition>();
      let notes = s.notes;
      op.items.forEach((it) => {
        const pos = sanitizePosition(it.pos);
        if (!pos) return;
        let note = notes.find((n) => n.id === it.id);
        if (!note && it.note && !s.deleted.includes(it.id)) {
          // Le post-it n'est pas encore arrivé : on l'ajoute depuis la révélation.
          const recu = sanitizeNote({ ...it.note, id: it.id, revealed: false, likedBy: [], retained: false });
          if (recu && recu.authorId === op.authorId) { notes = insertById(notes, recu); note = recu; }
        }
        if (note && note.authorId === op.authorId && !note.revealed) places.set(it.id, pos);
      });
      if (places.size === 0) return s;
      const positions = { ...s.positions };
      places.forEach((p, id) => { positions[id] = p; });
      return { ...s, notes: notes.map((n) => (places.has(n.id) ? { ...n, revealed: true } : n)), positions };
    }
    case 'unreveal': {
      if (!s.notes.some((n) => n.authorId === op.authorId && n.revealed)) return s;
      const positions = { ...s.positions };
      const notes = s.notes.map((n) => {
        if (n.authorId !== op.authorId || !n.revealed) return n;
        delete positions[n.id];
        return { ...n, revealed: false, likedBy: [], retained: false };
      });
      return { ...s, notes, positions };
    }
    case 'delete': {
      const note = s.notes.find((n) => n.id === op.id);
      if (note && !(op.moderator || note.authorId === op.by)) return s;
      const deleted = s.deleted.includes(op.id) ? s.deleted : [...s.deleted, op.id];
      // Pas encore arrivé ici : on retient seulement qu'il est supprimé.
      if (!note) return deleted === s.deleted ? s : { ...s, deleted };
      const positions = { ...s.positions };
      delete positions[op.id];
      return { ...s, notes: s.notes.filter((n) => n.id !== op.id), positions, deleted };
    }
    case 'move': {
      const cur = s.positions[op.id];
      const next = sanitizePosition({ x: op.x, y: op.y, rot: cur?.rot ?? 0, at: op.at });
      if (!cur || !next || !newerPosition(next, cur)) return s;
      return { ...s, positions: { ...s.positions, [op.id]: next } };
    }
    case 'arrange': {
      let changed = false;
      const positions = { ...s.positions };
      Object.entries(op.positions ?? {}).forEach(([id, raw]) => {
        const next = sanitizePosition(raw);
        if (next && positions[id] && newerPosition(next, positions[id])) { positions[id] = next; changed = true; }
      });
      return changed ? { ...s, positions } : s;
    }
    case 'like': {
      const note = s.notes.find((n) => n.id === op.id);
      if (!note || !note.revealed || !op.voterId || op.liked === note.likedBy.includes(op.voterId)) return s;
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
    case 'theme': {
      const theme = String(op.theme ?? '').slice(0, BRAINSTORM_THEME_MAX);
      return s.theme === theme ? s : { ...s, theme };
    }
    case 'anonymous':
      return s.anonymous === !!op.value ? s : { ...s, anonymous: !!op.value };
    case 'chrono':
      return { ...s, chrono: op.chrono };
    case 'reset':
      if (op.round <= s.round) return s;
      return { ...s, round: op.round, notes: [], positions: {}, deleted: [], chrono: op.chrono ?? s.chrono };
    default:
      return s;
  }
}

/* ── Export ──────────────────────────────────────────────────────────────── */

/** Résumé texte de la séance (export .txt) : idées retenues d'abord, puis les autres. */
export function buildBrainstormSummary(state: BrainstormState, date: Date = new Date()): string {
  let txt = `BRAINSTORMING OSKAR — ${date.toLocaleDateString('fr-FR')}\n${'='.repeat(44)}\n`;
  if (state.theme.trim()) txt += `Thème : ${state.theme.trim()}\n`;
  const revealed = state.notes
    .filter((n) => n.revealed && n.text.trim())
    .sort((a, b) => b.likedBy.length - a.likedBy.length);
  const votes = revealed.reduce((sum, n) => sum + n.likedBy.length, 0);
  txt += `Idées : ${revealed.length} · votes : ${votes}\n`;
  if (state.anonymous) txt += 'Séance anonyme : auteurs non indiqués.\n';
  txt += '\n';

  const line = (n: BoardNote) => {
    const v = n.likedBy.length;
    const auteur = state.anonymous ? '' : ` — ${n.authorName}`;
    return `- [${getBrainstormColor(n.category).label}] ${n.text.trim()}  (${v} vote${v > 1 ? 's' : ''}${auteur})\n`;
  };
  const retained = revealed.filter((n) => n.retained);
  if (retained.length) {
    txt += `IDÉES RETENUES\n${'-'.repeat(28)}\n`;
    retained.forEach((n) => { txt += line(n); });
    txt += '\n';
  }
  txt += `${retained.length ? 'AUTRES IDÉES' : 'IDÉES'}\n${'-'.repeat(28)}\n`;
  const others = revealed.filter((n) => !n.retained);
  if (others.length === 0) txt += '(aucune idée)\n';
  others.forEach((n) => { txt += line(n); });
  return txt;
}
