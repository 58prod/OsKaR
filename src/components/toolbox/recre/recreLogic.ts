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
  /** Proportions largeur / hauteur (absentes sur les photos d'avant la 2.72). */
  ratio?: number;
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
  /** Photo mise en avant par l'animateur sur le board (sans diaporama). */
  highlightedId: string | null;
}

export const INITIAL_RECRE_STATE: RecreState = {
  theme: '',
  photos: [],
  reveal: null,
  authorsShown: [],
  highlightedId: null,
  chrono: {
    running: false,
    endsAt: null,
    remainingSec: RECRE_DEFAULT_DURATION_SEC,
    durationSec: RECRE_DEFAULT_DURATION_SEC,
  },
};

/**
 * Nombre de colonnes du board : fixe, et non plus déduit de la largeur de
 * l'écran, pour que chacun voie les photos au même endroit. Seul un écran
 * étroit (téléphone) passe à 2 colonnes.
 */
export const RECRE_COLONNES = 5;
export const RECRE_COLONNES_ETROIT = 2;
/** Largeur du board sous laquelle on passe à 2 colonnes (px). */
export const RECRE_LARGEUR_ETROITE = 640;

/** Hauteur du cadre et de la légende d'une carte, en largeurs de colonne. */
const CADRE_RELATIF = 0.2;

/**
 * Proportions d'affichage : une photo très haute (capture de téléphone) ou
 * très large (panorama) est montrée en entier dans un cadre borné.
 */
export function ratioAffiche(ratio: number | undefined): number {
  const r = ratio && Number.isFinite(ratio) && ratio > 0 ? ratio : 1;
  return Math.min(3, Math.max(0.6, r));
}

/**
 * Répartit les photos en colonnes (mur de photos) : chacune va dans la
 * colonne la moins haute, la plus à gauche en cas d'égalité. Le calcul ne
 * dépend que de l'ordre des photos et de leurs proportions, jamais de la
 * taille de l'écran : à nombre de colonnes égal, le mur est le même partout.
 * Renvoie, pour chaque colonne, les positions (dans `photos`) qu'elle reçoit.
 */
export function placerEnColonnes(
  photos: Pick<RecrePhoto, 'ratio'>[],
  nbColonnes: number,
  ratioMesure: (index: number) => number | undefined = () => undefined,
): number[][] {
  const n = Math.max(1, nbColonnes);
  const colonnes: number[][] = Array.from({ length: n }, () => []);
  const hauteurs = new Array<number>(n).fill(0);
  photos.forEach((photo, i) => {
    const ratio = ratioAffiche(photo.ratio ?? ratioMesure(i));
    // Égalité à un millième près : évite qu'un arrondi flottant change de colonne.
    let col = 0;
    for (let c = 1; c < n; c++) if (hauteurs[c] < hauteurs[col] - 1e-3) col = c;
    colonnes[col].push(i);
    hauteurs[col] += 1 / ratio + CADRE_RELATIF;
  });
  return colonnes;
}

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
    highlightedId: raw?.highlightedId ?? null,
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
 * Photos dans l'ordre du diaporama (celles arrivées après le lancement à la
 * fin), pour les vignettes de l'animateur.
 */
export function revealOrder(state: RecreState): RecrePhoto[] {
  if (!state.reveal) return [];
  const byId = new Map(state.photos.map((p) => [p.id, p]));
  const queued = state.reveal.queue.map((id) => byId.get(id)).filter((p): p is RecrePhoto => !!p);
  const later = state.photos.filter((p) => !state.reveal!.queue.includes(p.id));
  return [...queued, ...later];
}

/** Photo précédente encore présente dans la file, ou null au début. */
export function previousRevealId(state: RecreState): string | null {
  if (!state.reveal) return null;
  for (let i = state.reveal.index - 1; i >= 0; i--) {
    const id = state.reveal.queue[i];
    if (state.photos.some((p) => p.id === id)) return id;
  }
  return null;
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
  /** L'animateur choisit la photo affichée (vignettes, « précédente »). */
  | { t: 'goToPhoto'; id: string }
  | { t: 'closeReveal' }
  /** L'animateur met une photo en avant sur le board (null : plus aucune). */
  | { t: 'highlight'; id: string | null }
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
      return {
        ...state,
        photos: state.photos.filter((p) => p.id !== op.id),
        highlightedId: state.highlightedId === op.id ? null : state.highlightedId,
      };
    case 'highlight':
      if (op.id !== null && !state.photos.some((p) => p.id === op.id)) return state;
      return { ...state, highlightedId: op.id };
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
    case 'goToPhoto': {
      if (!state.reveal || !state.photos.some((p) => p.id === op.id)) return state;
      // Photo arrivée après le lancement : elle rejoint la fin de la file.
      const queue = state.reveal.queue.includes(op.id) ? state.reveal.queue : [...state.reveal.queue, op.id];
      const index = queue.indexOf(op.id);
      if (index === state.reveal.index && queue === state.reveal.queue) return state;
      return {
        ...state,
        // Une photo déjà dévoilée garde son auteur affiché.
        reveal: { queue, index, authorShown: state.authorsShown.includes(op.id) },
      };
    }
    case 'closeReveal':
      return { ...state, reveal: null };
    case 'reset':
      return { ...INITIAL_RECRE_STATE, theme: state.theme, chrono: { ...state.chrono, running: false, endsAt: null, remainingSec: state.chrono.durationSec } };
    default:
      return state;
  }
}
