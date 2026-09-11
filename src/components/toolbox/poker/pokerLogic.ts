import { initialChrono, type ToolChrono } from '@/components/toolbox/shared/toolChrono';

export { chronoRemaining, formatTime } from '@/components/toolbox/shared/toolChrono';

/** Couleur de l'outil (celle de sa carte dans la boîte à outils). */
export const POKER_ACCENT = '#5b21b6';

/** État partagé d'une session Planning Poker (synchronisé via Realtime). */
export type PokerChrono = ToolChrono;

export type SuiteKey = 'fibonacci' | 'tshirt' | 'custom';

export interface PokerState {
  story: string;
  suiteKey: SuiteKey;
  suite: string[];
  /** participantId -> valeur votée. */
  votes: Record<string, string>;
  /**
   * Prénom et couleur de chaque votant de la manche : une personne dont la
   * connexion décroche reste affichée avec son vote au lieu de disparaître.
   */
  voterNames: Record<string, { name: string; color: string }>;
  revealed: boolean;
  chrono: PokerChrono;
  /**
   * Numéro de la manche de vote, augmenté à chaque « Réinitialiser » et à
   * chaque changement de suite. Un vote parti avant une remise à zéro porte
   * l'ancien numéro : il est ignoré au lieu de réapparaître.
   */
  round: number;
}

export const SUITES: Record<'fibonacci' | 'tshirt', string[]> = {
  fibonacci: ['1', '2', '3', '5', '8', '13', '?'],
  tshirt: ['XS', 'S', 'M', 'L', 'XL', '?'],
};

export const INITIAL_POKER_STATE: PokerState = {
  story: '',
  suiteKey: 'fibonacci',
  suite: [...SUITES.fibonacci],
  votes: {},
  voterNames: {},
  revealed: false,
  chrono: initialChrono(120),
  round: 0,
};

/** Complète un état enregistré avant l'ajout d'un champ (sessions déjà ouvertes). */
export function normalizePokerState(raw: Partial<PokerState> | null | undefined): PokerState {
  const s = raw ?? {};
  return {
    ...INITIAL_POKER_STATE,
    ...s,
    suite: Array.isArray(s.suite) && s.suite.length ? s.suite : [...SUITES.fibonacci],
    votes: s.votes && typeof s.votes === 'object' ? s.votes : {},
    voterNames: s.voterNames && typeof s.voterNames === 'object' ? s.voterNames : {},
    chrono: s.chrono ?? INITIAL_POKER_STATE.chrono,
    round: typeof s.round === 'number' ? s.round : 0,
  };
}

/* ── Opérations partagées ─────────────────────────────────────────────────── */

/**
 * Opérations du Planning Poker, diffusées à tous les participants qui les
 * appliquent avec `pokerReducer` : dix personnes peuvent voter dans la même
 * seconde sans qu'aucun vote n'en efface un autre. Toutes sont idempotentes
 * (les rejouer ne change rien), condition du socle `useToolSession`.
 */
export type PokerOp =
  | { t: 'vote'; round: number; voterId: string; value: string; name?: string; color?: string }
  | { t: 'story'; story: string }
  /** Nouvelle manche (`round` = manche courante + 1) : votes effacés. */
  | { t: 'newRound'; round: number; suiteKey?: SuiteKey; suite?: string[]; chrono?: PokerChrono }
  /** Révélation : fige les votes vus par celui qui révèle, identiques pour tous. */
  | { t: 'reveal'; round: number; votes: Record<string, string>; chrono: PokerChrono }
  | { t: 'chrono'; chrono: PokerChrono };

export function pokerReducer(raw: PokerState, op: PokerOp): PokerState {
  const state = normalizePokerState(raw);
  switch (op.t) {
    case 'vote':
      if (op.round !== state.round || state.revealed) return state;
      if (state.votes[op.voterId] === op.value) return state;
      return {
        ...state,
        votes: { ...state.votes, [op.voterId]: op.value },
        voterNames: op.name
          ? { ...state.voterNames, [op.voterId]: { name: op.name, color: op.color ?? '#1e2d7d' } }
          : state.voterNames,
      };
    case 'story':
      return state.story === op.story ? state : { ...state, story: op.story };
    case 'newRound':
      // Déjà appliquée (rejeu) ou dépassée par une remise à zéro plus récente.
      if (op.round <= state.round) return state;
      return {
        ...state,
        round: op.round,
        votes: {},
        voterNames: {},
        revealed: false,
        suiteKey: op.suiteKey ?? state.suiteKey,
        suite: op.suite ?? state.suite,
        chrono: op.chrono ?? state.chrono,
      };
    case 'reveal':
      if (op.round !== state.round || state.revealed) return state;
      return { ...state, votes: { ...op.votes }, revealed: true, chrono: op.chrono };
    case 'chrono':
      return { ...state, chrono: op.chrono };
    default:
      return state;
  }
}

/** Une valeur est-elle un emoji (donc exclue de la moyenne) ? */
function isEmoji(str: string): boolean {
  try {
    return /\p{Emoji}/u.test(str) && !/^\d+$/.test(str.trim());
  } catch {
    return !/^[0-9.]+$/.test(str.trim());
  }
}

export type ConsensusLevel = 'perfect' | 'good' | 'diverge' | 'none';

export interface PokerResults {
  average: string;
  consensus: ConsensusLevel;
  distribution: { value: string; count: number }[];
  voteCount: number;
}

/** Calcule moyenne, consensus et distribution à partir des votes. */
export function computeResults(votes: Record<string, string>): PokerResults {
  const vals = Object.values(votes);
  const numericVals = vals.filter((v) => !isEmoji(v));
  const nums = numericVals.map((v) => parseFloat(v)).filter((v) => !isNaN(v));

  let average = '—';
  if (nums.length > 0) {
    const avg = nums.reduce((a, b) => a + b, 0) / nums.length;
    average = Number.isInteger(avg) ? String(avg) : avg.toFixed(1);
  }

  const numericSet = [...new Set(numericVals.filter((v) => !isNaN(parseFloat(v))))];
  let consensus: ConsensusLevel = 'none';
  if (numericSet.length === 1 && nums.length > 1) {
    consensus = 'perfect';
  } else if (nums.length >= 2 && Math.max(...nums) - Math.min(...nums) <= 2) {
    consensus = 'good';
  } else if (nums.length >= 2) {
    consensus = 'diverge';
  }

  const counts: Record<string, number> = {};
  vals.forEach((v) => { counts[v] = (counts[v] || 0) + 1; });
  const distribution = Object.entries(counts)
    .sort((a, b) => {
      const na = parseFloat(a[0]); const nb = parseFloat(b[0]);
      return !isNaN(na) && !isNaN(nb) ? na - nb : a[0].localeCompare(b[0]);
    })
    .map(([value, count]) => ({ value, count }));

  return { average, consensus, distribution, voteCount: vals.length };
}

/** Côté (px) de l'image envoyée pour un emoji dessiné à la main. */
export const DESSIN_TAILLE = 96;
/** Au-delà, l'image reçue est refusée (un dessin de 96 px pèse quelques Ko). */
export const DESSIN_POIDS_MAX = 60_000;

/**
 * Un dessin reçu d'un autre participant est-il bien une petite image PNG ?
 * Le signal vient du réseau : on n'affiche rien d'autre.
 */
export function estDessinValide(src: unknown): src is string {
  return typeof src === 'string'
    && src.length <= DESSIN_POIDS_MAX
    && /^data:image\/png;base64,[A-Za-z0-9+/]+={0,2}$/.test(src);
}

/**
 * Cadre carré (avec une marge) autour des pixels dessinés, pour que l'emoji
 * remplisse l'image même si on a dessiné petit dans un coin. `alpha` est le
 * canal de transparence de chaque pixel, ligne par ligne ; null si rien n'est dessiné.
 */
export function cadreDuDessin(
  alpha: ArrayLike<number>,
  cote: number,
): { x: number; y: number; taille: number } | null {
  let minX = cote; let minY = cote; let maxX = -1; let maxY = -1;
  for (let y = 0; y < cote; y++) {
    for (let x = 0; x < cote; x++) {
      if (alpha[y * cote + x] > 0) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }
  if (maxX < 0) return null;
  const taille = Math.min(cote, Math.max(maxX - minX, maxY - minY) + 1 + 16);
  const cx = (minX + maxX) / 2;
  const cy = (minY + maxY) / 2;
  const borne = (v: number) => Math.round(Math.max(0, Math.min(cote - taille, v - taille / 2)));
  return { x: borne(cx), y: borne(cy), taille };
}

/**
 * Catalogue d'émojis pour les réactions, du plus courant au plus farfelu :
 * les réactions de tous les jours en haut du panneau, puis celles qui
 * parlent d'estimation, puis tout le reste.
 */
export const EMOJI_CATALOG = [
  // Les plus utilisés
  '👍', '👏', '🔥', '😂', '❤️', '🎉', '🚀', '💯', '🤔', '😮',
  '🙌', '😍', '👀', '😅', '🥳', '💪', '😎', '🤩', '✅', '⭐',
  '🤯', '🙏', '🤝', '💡', '🎯', '😬', '🫶', '🥹', '👎', '😴',
  // Pour estimer
  '🐌', '🐢', '🐇', '⚡', '🐘', '🐭', '🧱', '🪶', '⏳', '⏰',
  '🤏', '🙉', '🤷', '❓', '♾️', '🧮', '📏', '🎲', '🃏', '♠️',
  '🐛', '🔧', '🧩', '🏗️', '🧨', '💣', '🪤', '🕳️', '🌋', '🧯',
  // Pour rire
  '🦄', '🐙', '🦖', '🥷', '🧙', '🤖', '👽', '👻', '🤡', '💩',
  '🦆', '🐸', '🦥', '🦩', '🦔', '🐳', '🐧', '🦒', '🐒', '🙈',
  '🫠', '🫡', '🤌', '🥸', '🤓', '😇', '🤪', '😵‍💫', '😱', '🥶',
  '🥵', '🤠', '🧠', '💀', '👾', '🐉', '🦸', '🧞', '🧜', '🫥',
  // Pour se motiver
  '🏆', '🥇', '💎', '🔑', '🌈', '✨', '🎊', '🪄', '🍾', '🎸',
  '🎤', '🕺', '💃', '🏄', '🧗', '🏋️', '🛼', '🪁', '🎳', '🥊',
  // Pour la pause
  '☕', '🍕', '🍩', '🧁', '🍰', '🍿', '🥐', '🧀', '🌮', '🥑',
  '🍫', '🍪', '🧃', '🍺', '🍷', '🥨', '🍜', '🌶️', '🍉', '🍦',
];
