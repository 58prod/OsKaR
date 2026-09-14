import { initialChrono, type ToolChrono } from '@/components/toolbox/shared/toolChrono';
import type { BoardNote } from '@/components/toolbox/shared/boardNotes';
import {
  avecCoeurs, donnerCoeur, normaliserCoeurs, reprendreLikedBy, type CoeursDates,
} from '@/components/toolbox/shared/coeurs';

/** Logique pure de la Rétrospective Speedboat (voilier vers l'île au trésor). */

/** Accent de l'outil (cohérent avec sa bannière). */
export const SPEEDBOAT_ACCENT = '#0369a1';

/** Longueur maximale d'un ticket. */
export const SPEEDBOAT_TEXT_MAX = 200;

export type SpeedboatZoneKey = 'vent' | 'objectif' | 'ancre' | 'recif';

export interface SpeedboatZone {
  key: SpeedboatZoneKey;
  name: string;
  color: string;
  desc: string;
  placeholder: string;
  /** Position de la zone sur la scène, en % du conteneur. */
  left: number;
  top: number;
  width: number;
  height: number;
  /** Coin d'ancrage du libellé de zone. */
  labelCorner: 'tl' | 'tr' | 'bl' | 'br';
}

/** Zones calibrées sur l'image de fond (voilier au centre, laissé libre). */
export const SPEEDBOAT_ZONES: SpeedboatZone[] = [
  {
    key: 'vent', name: 'Le Vent', color: '#0ea5e9',
    desc: "Ce qui nous a aidés à avancer — nos forces, accélérateurs et tout ce qui a favorisé l'élan de l'équipe.",
    placeholder: 'Ce qui nous a aidés à avancer…',
    left: 0, top: 0, width: 50, height: 50, labelCorner: 'tl',
  },
  {
    key: 'objectif', name: "L'Île au trésor", color: '#00d4b4',
    desc: "Nos succès et fiertés — ce que l'équipe a accompli et dont elle est fière.",
    placeholder: 'Un succès, quelque chose dont on est fiers…',
    left: 50, top: 0, width: 50, height: 50, labelCorner: 'tr',
  },
  {
    key: 'ancre', name: 'Les Ancres', color: '#6366f1',
    desc: 'Ce qui nous ralentit ou nous retient — blocages, dettes, friction qui freinent l\'équipe.',
    placeholder: 'Ce qui nous ralentit ou nous retient…',
    left: 0, top: 50, width: 50, height: 50, labelCorner: 'bl',
  },
  {
    key: 'recif', name: 'Le Récif', color: '#ec4899',
    desc: "Les obstacles et problèmes rencontrés — ce qui a failli faire dérailler l'équipe.",
    placeholder: 'Un obstacle ou problème rencontré…',
    left: 50, top: 50, width: 50, height: 50, labelCorner: 'br',
  },
];

export function getSpeedboatZone(key: string): SpeedboatZone {
  return SPEEDBOAT_ZONES.find((z) => z.key === key) ?? SPEEDBOAT_ZONES[0];
}

/** Zone sous un point de la scène (fractions 0–1). */
export function zoneAt(x: number, y: number): SpeedboatZoneKey {
  if (y < 0.5) return x < 0.5 ? 'vent' : 'objectif';
  return x < 0.5 ? 'ancre' : 'recif';
}

/** Nombre de cœurs par personne (0 = illimité). */
export const SPEEDBOAT_VOTE_LIMITS = [0, 3, 5, 10];

/** Position d'une carte sur la scène, en fraction (0–1) du conteneur. */
export interface CardPosition {
  x: number;
  y: number;
  /** Heure (ms) du dernier placement : le déplacement le plus récent l'emporte partout. */
  at?: number;
}

/** Bornes des positions : la carte reste entièrement sur la scène. */
export const CARD_POS_MAX = { x: 0.84, y: 0.86 };

export interface SpeedboatState {
  notes: BoardNote[];
  /** Cœurs datés ; `likedBy` des tickets n'en garde que ceux qui comptent (voir `avecCoeurs`). */
  likes: CoeursDates;
  /** Positions des cartes placées, indexées par id de note. */
  positions: Record<string, CardPosition>;
  /** Tickets anonymes : l'auteur n'est pas affiché. */
  anonymous: boolean;
  /** Cœurs par personne, 0 = illimité. */
  voteLimit: number;
  /** Numéro de séance, augmenté à chaque « Réinitialiser ». */
  round: number;
  chrono: ToolChrono;
  /** Tickets supprimés pendant la séance : un message en retard ne peut pas les faire revenir. */
  deleted: string[];
}

export const INITIAL_SPEEDBOAT_STATE: SpeedboatState = {
  notes: [],
  likes: {},
  positions: {},
  anonymous: false,
  voteLimit: 0,
  round: 0,
  chrono: initialChrono(600),
  deleted: [],
};

const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));
const round3 = (v: number) => Math.round(v * 1000) / 1000;
const texte = (v: unknown, max: number) => (typeof v === 'string' ? v.trim().slice(0, max) : '');

/** Un ticket reçu du réseau, nettoyé ; null s'il est inutilisable. */
export function sanitizeTicket(raw: unknown): BoardNote | null {
  if (!raw || typeof raw !== 'object') return null;
  const n = raw as Record<string, unknown>;
  const id = texte(n.id, 60);
  const authorId = texte(n.authorId, 80);
  const text = texte(n.text, SPEEDBOAT_TEXT_MAX);
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
    category: getSpeedboatZone(texte(n.category, 10)).key,
    text,
    revealed,
    likedBy: revealed ? likedBy : [],
    retained: revealed && n.retained === true,
  };
}

/** Une position reçue du réseau, bornée ; null si elle est inutilisable. */
export function sanitizeCardPosition(raw: unknown): CardPosition | null {
  if (!raw || typeof raw !== 'object') return null;
  const p = raw as Record<string, unknown>;
  if (typeof p.x !== 'number' || typeof p.y !== 'number' || !Number.isFinite(p.x) || !Number.isFinite(p.y)) return null;
  const at = typeof p.at === 'number' && Number.isFinite(p.at) ? p.at : 0;
  return { x: round3(clamp(p.x, 0, CARD_POS_MAX.x)), y: round3(clamp(p.y, 0, CARD_POS_MAX.y)), at };
}

/** Complète un état enregistré avant l'ajout d'un champ (sessions déjà ouvertes). */
export function normalizeSpeedboatState(raw: Partial<SpeedboatState> | null | undefined): SpeedboatState {
  const s = raw ?? {};
  const notes = Array.isArray(s.notes)
    ? s.notes.map(sanitizeTicket).filter((n): n is BoardNote => n !== null)
    : [];
  const positions: Record<string, CardPosition> = {};
  if (s.positions && typeof s.positions === 'object') {
    notes.forEach((n) => {
      const p = n.revealed ? sanitizeCardPosition((s.positions as Record<string, unknown>)[n.id]) : null;
      if (p) positions[n.id] = p;
    });
  }
  const voteLimit = typeof s.voteLimit === 'number' ? s.voteLimit : 0;
  const likes = reprendreLikedBy(normaliserCoeurs(s.likes), notes);
  return {
    ...INITIAL_SPEEDBOAT_STATE,
    ...s,
    notes: avecCoeurs(notes, likes, voteLimit),
    likes,
    positions,
    anonymous: !!s.anonymous,
    voteLimit,
    round: typeof s.round === 'number' ? s.round : 0,
    chrono: s.chrono ?? INITIAL_SPEEDBOAT_STATE.chrono,
    deleted: Array.isArray(s.deleted) ? s.deleted.filter((x): x is string => typeof x === 'string') : [],
  };
}

/**
 * Place un nouveau ticket dans sa zone, là où il reste de la place : parmi
 * plusieurs emplacements tirés au hasard, celui qui est le plus loin des
 * tickets déjà posés.
 */
export function freePositionInZone(
  zone: SpeedboatZone, taken: CardPosition[], at = 0, rand: () => number = Math.random,
): CardPosition {
  const margin = 0.03;
  const cardW = 0.16;
  const cardH = 0.14;
  const x0 = zone.left / 100 + margin;
  const y0 = zone.top / 100 + margin + 0.04; // sous le libellé de la zone
  const w = Math.max(0, zone.width / 100 - cardW - margin * 2);
  const h = Math.max(0, zone.height / 100 - cardH - margin * 2 - 0.04);
  let best = { x: x0, y: y0 };
  let bestScore = -1;
  for (let i = 0; i < 24; i++) {
    const c = { x: x0 + rand() * w, y: y0 + rand() * h };
    const score = taken.length ? Math.min(...taken.map((p) => Math.hypot((p.x - c.x) * 1.5, p.y - c.y))) : 1;
    if (score > bestScore) { bestScore = score; best = c; }
  }
  return { x: round3(clamp(best.x, 0, CARD_POS_MAX.x)), y: round3(clamp(best.y, 0, CARD_POS_MAX.y)), at };
}

/** Le placement `next` doit-il remplacer `cur` ? Le plus récent gagne, départage stable sinon. */
function newerPosition(next: CardPosition, cur: CardPosition | undefined): boolean {
  if (!cur) return true;
  const a = next.at ?? 0;
  const b = cur.at ?? 0;
  if (a !== b) return a > b;
  return next.x !== cur.x ? next.x > cur.x : next.y > cur.y;
}

/** Cœurs déjà donnés par une personne sur les tickets placés. */
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
 * Opérations du Speedboat, diffusées à tous les participants qui les
 * appliquent avec `speedboatReducer` : toute l'équipe peut écrire, placer,
 * déplacer et aimer des tickets en même temps sans rien écraser. Toutes
 * sont idempotentes, condition du socle `useToolSession`.
 */
export type SpeedboatOp =
  /** Nouveau ticket, en brouillon (visible par son auteur seulement). */
  | { t: 'add'; round: number; note: BoardNote }
  /**
   * Placement de brouillons d'un auteur, chacun avec sa position. Le ticket
   * voyage avec : si son « add » arrive après, il est quand même placé.
   */
  | { t: 'publish'; authorId: string; round?: number; items: { id: string; pos: CardPosition; note?: BoardNote }[] }
  /** Suppression : son propre brouillon, ou n'importe quel ticket par l'animateur. */
  | { t: 'delete'; id: string; by: string; moderator?: boolean }
  /** Déplacement (et changement de zone) : le plus récent l'emporte. */
  | { t: 'move'; id: string; zone: SpeedboatZoneKey; x: number; y: number; at: number }
  /** Cœur donné ou retiré, daté (`at`) : la limite de cœurs se calcule ensuite, pareil partout. */
  | { t: 'like'; id: string; voterId: string; liked: boolean; at?: number }
  | { t: 'retain'; id: string; retained: boolean }
  | { t: 'anonymous'; value: boolean }
  | { t: 'voteLimit'; value: number }
  | { t: 'chrono'; chrono: ToolChrono }
  /** Nouvelle séance (`round` = séance courante + 1) : tickets effacés, réglages gardés. */
  | { t: 'reset'; round: number; chrono?: ToolChrono };

export function speedboatReducer(raw: SpeedboatState, op: SpeedboatOp): SpeedboatState {
  const s = appliquer(raw, op);
  // Cœurs qui comptent, recalculés après chaque opération (placement, suppression, limite…).
  const notes = avecCoeurs(s.notes, s.likes, s.voteLimit);
  return notes === s.notes ? s : { ...s, notes };
}

function appliquer(raw: SpeedboatState, op: SpeedboatOp): SpeedboatState {
  const s = normalizeSpeedboatState(raw);
  switch (op.t) {
    case 'add': {
      if (op.round !== s.round || s.deleted.includes(op.note?.id)) return s;
      const note = sanitizeTicket({ ...op.note, revealed: false, likedBy: [], retained: false });
      return note ? { ...s, notes: insertById(s.notes, note) } : s;
    }
    case 'publish': {
      if (op.round !== undefined && op.round !== s.round) return s;
      const places = new Map<string, CardPosition>();
      let notes = s.notes;
      (op.items ?? []).forEach((it) => {
        const pos = sanitizeCardPosition(it.pos);
        if (!pos) return;
        let note = notes.find((n) => n.id === it.id);
        if (!note && it.note && !s.deleted.includes(it.id)) {
          const recu = sanitizeTicket({ ...it.note, id: it.id, revealed: false, likedBy: [], retained: false });
          if (recu && recu.authorId === op.authorId) { notes = insertById(notes, recu); note = recu; }
        }
        if (note && note.authorId === op.authorId && !note.revealed) places.set(it.id, pos);
      });
      if (places.size === 0) return s;
      const positions = { ...s.positions };
      places.forEach((p, id) => { positions[id] = p; });
      return { ...s, notes: notes.map((n) => (places.has(n.id) ? { ...n, revealed: true } : n)), positions };
    }
    case 'delete': {
      const note = s.notes.find((n) => n.id === op.id);
      if (note && !(op.moderator || (note.authorId === op.by && !note.revealed))) return s;
      const deleted = s.deleted.includes(op.id) ? s.deleted : [...s.deleted, op.id];
      if (!note) return deleted === s.deleted ? s : { ...s, deleted };
      const positions = { ...s.positions };
      delete positions[op.id];
      return { ...s, notes: s.notes.filter((n) => n.id !== op.id), positions, deleted };
    }
    case 'move': {
      const cur = s.positions[op.id];
      const note = s.notes.find((n) => n.id === op.id);
      const next = sanitizeCardPosition({ x: op.x, y: op.y, at: op.at });
      if (!cur || !note || !note.revealed || !next || !newerPosition(next, cur)) return s;
      const zone = getSpeedboatZone(op.zone).key;
      return {
        ...s,
        positions: { ...s.positions, [op.id]: next },
        notes: note.category === zone ? s.notes : s.notes.map((n) => (n.id === op.id ? { ...n, category: zone } : n)),
      };
    }
    case 'like': {
      // Rien n'est refusé ici : refuser « le cœur de trop » dépendrait de
      // l'ordre d'arrivée des messages. La limite s'applique dans `avecCoeurs`.
      if (!op.voterId || !op.id) return s;
      const likes = donnerCoeur(s.likes, op.id, op.voterId, op.liked, op.at ?? 0);
      return likes === s.likes ? s : { ...s, likes };
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
      return { ...s, round: op.round, notes: [], likes: {}, positions: {}, deleted: [], chrono: op.chrono ?? s.chrono };
    default:
      return s;
  }
}

/* ── Export ──────────────────────────────────────────────────────────────── */

/** Résumé texte de la séance (export .txt) : zone par zone, tickets retenus d'abord. */
export function buildSpeedboatSummary(state: SpeedboatState, date: Date = new Date()): string {
  const placed = state.notes.filter((n) => n.revealed);
  const votes = placed.reduce((sum, n) => sum + n.likedBy.length, 0);
  let txt = `RÉTROSPECTIVE SPEEDBOAT — OSKAR — ${date.toLocaleDateString('fr-FR')}\n${'='.repeat(50)}\n`;
  txt += `Tickets : ${placed.length} · votes : ${votes} · retenus : ${placed.filter((n) => n.retained).length}\n`;
  if (state.anonymous) txt += 'Séance anonyme : auteurs non indiqués.\n';
  txt += '\n';
  SPEEDBOAT_ZONES.forEach((z) => {
    const pool = placed
      .filter((n) => n.category === z.key)
      .sort((a, b) => Number(b.retained) - Number(a.retained) || b.likedBy.length - a.likedBy.length);
    txt += `${z.name.toUpperCase()}\n${'-'.repeat(28)}\n`;
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
