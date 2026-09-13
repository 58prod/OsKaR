import { initialChrono, type ToolChrono } from '@/components/toolbox/shared/toolChrono';

export { chronoRemaining, formatTime } from '@/components/toolbox/shared/toolChrono';

/** Logique pure du ROTI (Return On Time Invested). */

/** Couleur de l'outil (celle de sa carte dans la boîte à outils). */
export const ROTI_ACCENT = '#b45309';

/** Longueur maximale d'un commentaire et de l'intitulé de la séance. */
export const ROTI_COMMENT_MAX = 200;
export const ROTI_SESSION_MAX = 80;

export interface RotiVote {
  star: number; // 1..5
  comment: string;
}

export interface RotiState {
  /** Intitulé de la séance évaluée. */
  session: string;
  /** Votes par identifiant participant. */
  votes: Record<string, RotiVote>;
  /**
   * Prénom et couleur de chaque votant : une personne dont la connexion
   * décroche reste affichée avec sa note au lieu de disparaître.
   */
  voterNames: Record<string, { name: string; color: string }>;
  revealed: boolean;
  chrono: ToolChrono;
  /**
   * Numéro du tour de vote, augmenté à chaque « Réinitialiser ». Un vote
   * parti avant une remise à zéro porte l'ancien numéro : il est ignoré.
   */
  round: number;
}

export const INITIAL_ROTI_STATE: RotiState = {
  session: '',
  votes: {},
  voterNames: {},
  revealed: false,
  chrono: initialChrono(60),
  round: 0,
};

/** Un vote reçu du réseau : note entière de 1 à 5, commentaire borné. Sinon null. */
export function sanitizeVote(raw: unknown): RotiVote | null {
  if (!raw || typeof raw !== 'object') return null;
  const { star, comment } = raw as { star?: unknown; comment?: unknown };
  if (typeof star !== 'number' || !Number.isInteger(star) || star < 1 || star > 5) return null;
  return { star, comment: typeof comment === 'string' ? comment.trim().slice(0, ROTI_COMMENT_MAX) : '' };
}

function sanitizeVotes(raw: unknown): Record<string, RotiVote> {
  if (!raw || typeof raw !== 'object') return {};
  const out: Record<string, RotiVote> = {};
  Object.entries(raw as Record<string, unknown>).forEach(([id, v]) => {
    const vote = sanitizeVote(v);
    if (vote) out[id] = vote;
  });
  return out;
}

/** Complète un état enregistré avant l'ajout d'un champ (sessions déjà ouvertes). */
export function normalizeRotiState(raw: Partial<RotiState> | null | undefined): RotiState {
  const s = raw ?? {};
  return {
    ...INITIAL_ROTI_STATE,
    ...s,
    session: typeof s.session === 'string' ? s.session : '',
    votes: sanitizeVotes(s.votes),
    voterNames: s.voterNames && typeof s.voterNames === 'object' ? s.voterNames : {},
    revealed: !!s.revealed,
    chrono: s.chrono ?? INITIAL_ROTI_STATE.chrono,
    round: typeof s.round === 'number' ? s.round : 0,
  };
}

/* ── Opérations partagées ─────────────────────────────────────────────────── */

/**
 * Opérations du ROTI, diffusées à tous les participants qui les appliquent
 * avec `rotiReducer` : toute l'équipe peut noter dans la même seconde sans
 * qu'aucun vote n'en efface un autre. Toutes sont idempotentes (les rejouer
 * ne change rien), condition du socle `useToolSession`.
 */
export type RotiOp =
  | { t: 'vote'; round: number; voterId: string; star: number; comment: string; name?: string; color?: string }
  | { t: 'session'; session: string }
  /** Nouveau tour (`round` = tour courant + 1) : votes effacés. */
  | { t: 'newRound'; round: number; chrono?: ToolChrono }
  /** Révélation : fige les votes vus par celui qui révèle, identiques pour tous. */
  | { t: 'reveal'; round: number; votes: Record<string, RotiVote>; chrono: ToolChrono }
  | { t: 'chrono'; chrono: ToolChrono };

export function rotiReducer(raw: RotiState, op: RotiOp): RotiState {
  const state = normalizeRotiState(raw);
  switch (op.t) {
    case 'vote': {
      if (op.round !== state.round || state.revealed || !op.voterId) return state;
      const vote = sanitizeVote(op);
      if (!vote) return state;
      const current = state.votes[op.voterId];
      if (current && current.star === vote.star && current.comment === vote.comment) return state;
      return {
        ...state,
        votes: { ...state.votes, [op.voterId]: vote },
        voterNames: op.name
          ? { ...state.voterNames, [op.voterId]: { name: op.name, color: op.color ?? '#1e2d7d' } }
          : state.voterNames,
      };
    }
    case 'session': {
      const session = String(op.session ?? '').slice(0, ROTI_SESSION_MAX);
      return state.session === session ? state : { ...state, session };
    }
    case 'newRound':
      // Déjà appliqué (rejeu) ou dépassé par une remise à zéro plus récente.
      if (op.round <= state.round) return state;
      return {
        ...state,
        round: op.round,
        votes: {},
        voterNames: {},
        revealed: false,
        chrono: op.chrono ?? state.chrono,
      };
    case 'reveal':
      if (op.round !== state.round || state.revealed) return state;
      return { ...state, votes: sanitizeVotes(op.votes), revealed: true, chrono: op.chrono };
    case 'chrono':
      return { ...state, chrono: op.chrono };
    default:
      return state;
  }
}

/* ── Résultats ───────────────────────────────────────────────────────────── */

export const STAR_LABELS = ['', 'Perte de temps', 'Peu utile', 'Correct', 'Utile', 'Indispensable'];
export const STAR_COLORS = ['', '#ef4444', '#f97316', '#f59e0b', '#22c55e', '#10b981'];

/** Moyenne à partir de laquelle la séance est jugée « Excellente » (et fêtée). */
export const EXCELLENT_MIN = 4.6;

interface Verdict {
  min: number;
  label: string;
  bg: string;
  color: string;
}

export const VERDICTS: Verdict[] = [
  { min: 0, label: 'En attente…', bg: '#f1f5f9', color: '#64748b' },
  { min: 1, label: 'À améliorer 😬', bg: '#fee2e2', color: '#b91c1c' },
  { min: 2, label: 'Perfectible 🤔', bg: '#ffedd5', color: '#c2410c' },
  { min: 3, label: 'Correct 👍', bg: '#fef9c3', color: '#a16207' },
  { min: 4, label: 'Très bien ! 🎉', bg: '#dcfce7', color: '#15803d' },
  { min: EXCELLENT_MIN, label: 'Excellent ! 🔥', bg: '#d1fae5', color: '#047857' },
];

export interface RotiResults {
  count: number;
  avg: number;
  avgRounded: number;
  /** Indice de couleur/étoile (1..5) basé sur l'arrondi de la moyenne. */
  starIndex: number;
  verdict: Verdict;
  distribution: { star: number; count: number; pct: number }[];
}

/** Calcule moyenne, verdict et distribution à partir des votes. */
export function computeRoti(votes: Record<string, RotiVote>): RotiResults {
  const values = Object.values(votes).map((v) => v.star).filter((s) => s >= 1 && s <= 5);
  const count = values.length;
  const avg = count > 0 ? values.reduce((s, x) => s + x, 0) / count : 0;
  const avgRounded = Math.round(avg * 10) / 10;
  const starIndex = Math.min(5, Math.max(0, Math.round(avg)));
  const verdict =
    [...VERDICTS].reverse().find((v) => avgRounded >= v.min) ?? VERDICTS[0];

  const distribution = [5, 4, 3, 2, 1].map((star) => {
    const c = values.filter((s) => s === star).length;
    return { star, count: c, pct: count ? Math.round((c / count) * 100) : 0 };
  });

  return { count, avg, avgRounded, starIndex, verdict, distribution };
}
