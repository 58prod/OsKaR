import { initialChrono, type ToolChrono } from '@/components/toolbox/shared/toolChrono';

export { chronoRemaining, formatTime } from '@/components/toolbox/shared/toolChrono';

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

/** Catalogue d'émojis pour les réactions (repris des maquettes). */
export const EMOJI_CATALOG = [
  '🔥', '👏', '❤️', '👍', '🎉', '😂', '🚀', '💯', '😍', '⭐',
  '🙌', '💪', '😎', '🤔', '😅', '🥳', '🤩', '👀', '🎯', '✅',
  '⚡', '💡', '🤝', '🙏', '🤯', '🐛', '🦄', '🍕', '☕', '🏆',
];
