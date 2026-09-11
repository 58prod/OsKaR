/** Logique pure de l'outil « En mode récré ! » (rétro photos partagées). */

/** Accent rose de l'outil (cohérent avec sa bannière et les « j'aime »). */
export const RECRE_ACCENT = '#ec4899';

/** Durée par défaut du minuteur de dépôt des photos (5 minutes). */
export const RECRE_DEFAULT_DURATION_SEC = 5 * 60;

export interface RecrePhoto {
  id: string;
  authorId: string;
  authorName: string;
  authorColor: string;
  /** URL publique (Storage) ou data URL (repli mode dégradé). */
  url: string;
  /** Identifiants des participants ayant aimé la photo. */
  likedBy: string[];
}

/** Minuteur partagé (mêmes mécaniques que le Planning Poker). */
export interface RecreChrono {
  running: boolean;
  /** Timestamp (ms) de fin quand le chrono tourne, sinon null. */
  endsAt: number | null;
  /** Secondes restantes quand le chrono est en pause / à l'arrêt. */
  remainingSec: number;
  /** Durée configurée (secondes) pour un reset. */
  durationSec: number;
}

/**
 * Mode révélation (maquette `recre.html`) : l'animateur montre les photos
 * une à une, en grand, à toute l'équipe, qui devine l'auteur avant qu'il ne
 * soit dévoilé.
 */
export interface RecreReveal {
  /** Ordre de passage (identifiants de photos, mélangés au lancement). */
  queue: string[];
  /** Position dans la file. */
  index: number;
  /** L'auteur de la photo en cours est-il dévoilé ? */
  authorShown: boolean;
}

export interface RecreState {
  /** Thème / consigne de la séance (saisi par l'animateur). */
  theme: string;
  photos: RecrePhoto[];
  chrono: RecreChrono;
  /** Révélation en cours (null : on est sur le board). */
  reveal: RecreReveal | null;
  /** Photos dont l'auteur a été dévoilé : leur nom s'affiche sur le board. */
  authorsShown: string[];
}

export const INITIAL_RECRE_STATE: RecreState = {
  theme: '',
  photos: [],
  reveal: null,
  authorsShown: [],
  chrono: {
    running: false,
    endsAt: null,
    remainingSec: RECRE_DEFAULT_DURATION_SEC,
    durationSec: RECRE_DEFAULT_DURATION_SEC,
  },
};

/** Légère inclinaison déterministe d'une photo (effet « polaroid »). */
export function tiltFor(index: number): number {
  const tilts = [-3.5, 2.5, -1.5, 3, -2.5, 1.5, -3, 2];
  return tilts[index % tilts.length];
}

/** Secondes restantes effectives selon l'état du chrono. */
export function chronoRemaining(chrono: RecreChrono, now: number = Date.now()): number {
  if (chrono.running && chrono.endsAt) {
    return Math.max(0, Math.round((chrono.endsAt - now) / 1000));
  }
  return chrono.remainingSec;
}

/** Format mm:ss. */
export function formatTime(totalSec: number): string {
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

/** Complète un état ancien (séances créées avant le mode révélation). */
export function normalizeRecreState(raw: Partial<RecreState> | null | undefined): RecreState {
  return {
    ...INITIAL_RECRE_STATE,
    ...(raw ?? {}),
    photos: raw?.photos ?? [],
    reveal: raw?.reveal ?? null,
    authorsShown: raw?.authorsShown ?? [],
  };
}

/** Mélange (Fisher-Yates) ; `random` injectable pour les tests. */
export function shuffle<T>(list: T[], random: () => number = Math.random): T[] {
  const a = [...list];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Photo en cours de révélation, en ignorant celles supprimées entre-temps. */
export function currentRevealPhoto(state: RecreState): { photo: RecrePhoto; position: number; total: number } | null {
  if (!state.reveal) return null;
  const queue = state.reveal.queue.filter((id) => state.photos.some((p) => p.id === id));
  const id = state.reveal.queue[state.reveal.index];
  const photo = state.photos.find((p) => p.id === id);
  if (!photo) return null;
  return { photo, position: queue.indexOf(id) + 1, total: queue.length };
}

/**
 * Opérations de la récré, diffusées à tous et appliquées par `recreReducer` :
 * deux personnes qui envoient leurs photos au même moment ne s'écrasent plus.
 */
export type RecreOp =
  | { t: 'addPhoto'; photo: RecrePhoto }
  | { t: 'removePhoto'; id: string }
  | { t: 'like'; id: string; voterId: string; liked: boolean }
  | { t: 'theme'; theme: string }
  | { t: 'chrono'; chrono: RecreChrono }
  | { t: 'startReveal'; queue: string[] }
  | { t: 'showAuthor' }
  /** `from` : position de départ, pour qu'un même clic reçu deux fois n'avance qu'une fois. */
  | { t: 'nextPhoto'; from: number }
  | { t: 'closeReveal' }
  | { t: 'reset' };

export function recreReducer(raw: RecreState, op: RecreOp): RecreState {
  const state = normalizeRecreState(raw);
  switch (op.t) {
    case 'addPhoto': {
      if (state.photos.some((p) => p.id === op.photo.id)) return state;
      // Insertion dans l'ordre des identifiants (horodatés) : même ordre partout.
      const i = state.photos.findIndex((p) => p.id > op.photo.id);
      const photos = i < 0 ? [...state.photos, op.photo]
        : [...state.photos.slice(0, i), op.photo, ...state.photos.slice(i)];
      return { ...state, photos };
    }
    case 'removePhoto':
      return { ...state, photos: state.photos.filter((p) => p.id !== op.id) };
    case 'like':
      return {
        ...state,
        photos: state.photos.map((p) => {
          if (p.id !== op.id) return p;
          // Idempotent : recevoir deux fois le même vote ne change rien.
          if (op.liked === p.likedBy.includes(op.voterId)) return p;
          const others = p.likedBy.filter((x) => x !== op.voterId);
          return { ...p, likedBy: op.liked ? [...others, op.voterId] : others };
        }),
      };
    case 'theme':
      return { ...state, theme: op.theme };
    case 'chrono':
      return { ...state, chrono: op.chrono };
    case 'startReveal':
      return {
        ...state,
        chrono: state.chrono.running
          ? { ...state.chrono, running: false, endsAt: null, remainingSec: chronoRemaining(state.chrono) }
          : state.chrono,
        reveal: op.queue.length ? { queue: op.queue, index: 0, authorShown: false } : null,
      };
    case 'showAuthor': {
      const current = currentRevealPhoto(state);
      if (!state.reveal || !current) return state;
      return {
        ...state,
        reveal: { ...state.reveal, authorShown: true },
        authorsShown: state.authorsShown.includes(current.photo.id)
          ? state.authorsShown : [...state.authorsShown, current.photo.id],
      };
    }
    case 'nextPhoto': {
      if (!state.reveal || state.reveal.index !== op.from) return state;
      // Passe les photos supprimées entre-temps ; au bout de la file, on revient au board.
      let index = state.reveal.index + 1;
      while (index < state.reveal.queue.length
        && !state.photos.some((p) => p.id === state.reveal!.queue[index])) index++;
      if (index >= state.reveal.queue.length) return { ...state, reveal: null };
      return { ...state, reveal: { ...state.reveal, index, authorShown: false } };
    }
    case 'closeReveal':
      return { ...state, reveal: null };
    case 'reset':
      return { ...INITIAL_RECRE_STATE, theme: state.theme, chrono: { ...state.chrono, running: false, endsAt: null, remainingSec: state.chrono.durationSec } };
    default:
      return state;
  }
}
