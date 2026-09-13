import { initialChrono, type ToolChrono } from '@/components/toolbox/shared/toolChrono';

export { chronoRemaining } from '@/components/toolbox/shared/toolChrono';

/** Logique pure du Team Mood (baromètre d'équipe sur 5 dimensions). */

/** Couleur de l'outil (celle de sa carte dans la boîte à outils). */
export const MOOD_ACCENT = '#4338ca';

export type MoodDimKey = 'energie' | 'charge' | 'sens' | 'liens' | 'epanouissement';

export interface MoodDimension {
  key: MoodDimKey;
  label: string;
  sub: string;
  color: string;
}

export const MOOD_DIMS: MoodDimension[] = [
  { key: 'epanouissement', label: 'Épanouissement', sub: 'Je progresse et j\'apprends', color: '#22c55e' },
  { key: 'sens', label: 'Sens', sub: 'Ce que je fais a du sens pour moi', color: '#0ea5e9' },
  { key: 'charge', label: 'Charge', sub: 'Ma charge est-elle soutenable ?', color: '#6366f1' },
  { key: 'energie', label: 'Énergie', sub: 'Est-ce que je me sens en forme ?', color: '#f59e0b' },
  { key: 'liens', label: 'Liens', sub: 'Je me sens bien dans l\'équipe', color: '#ec4899' },
];

export type MoodScores = Record<MoodDimKey, number>;

export interface MoodVote {
  dims: MoodScores;
}

/** Vue commune : votes individuels, puis discussion collective (après révélation). */
export type MoodPhase = 'vote' | 'discussion';

export interface MoodState {
  votes: Record<string, MoodVote>;
  /**
   * Prénom et couleur de chaque votant : une personne dont la connexion
   * décroche reste affichée avec ses notes au lieu de disparaître.
   */
  voterNames: Record<string, { name: string; color: string }>;
  revealed: boolean;
  /** Numéro du tour de vote, augmenté à chaque « Réinitialiser ». */
  round: number;
  chrono: ToolChrono;
  phase: MoodPhase;
  /** Note sur laquelle l'équipe s'accorde, par dimension (phase de discussion). */
  collective: MoodScores | null;
  /** Notes anonymes : seules les moyennes sont affichées. */
  anonymous: boolean;
}

export const INITIAL_MOOD_SCORES: MoodScores = {
  energie: 5, charge: 5, sens: 5, liens: 5, epanouissement: 5,
};

export const INITIAL_MOOD_STATE: MoodState = {
  votes: {},
  voterNames: {},
  revealed: false,
  round: 0,
  chrono: initialChrono(120),
  phase: 'vote',
  collective: null,
  anonymous: false,
};

/** Moyenne en dessous de laquelle une dimension mérite qu'on en parle. */
export const MOOD_LOW = 5;
/** Écart entre la note la plus basse et la plus haute qui signale un désaccord. */
export const MOOD_SPREAD = 5;

/**
 * Notes reçues du réseau : un nombre de 1 à 10 pour chaque dimension, arrondi
 * au pas voulu (1 pour un vote, 0,5 pour la note collective). Sinon null.
 */
export function sanitizeScores(raw: unknown, step = 1): MoodScores | null {
  if (!raw || typeof raw !== 'object') return null;
  const out = {} as MoodScores;
  for (const d of MOOD_DIMS) {
    const v = (raw as Record<string, unknown>)[d.key];
    if (typeof v !== 'number' || !Number.isFinite(v) || v < 1 || v > 10) return null;
    out[d.key] = Math.round(v / step) * step;
  }
  return out;
}

function sanitizeVotes(raw: unknown): Record<string, MoodVote> {
  if (!raw || typeof raw !== 'object') return {};
  const out: Record<string, MoodVote> = {};
  Object.entries(raw as Record<string, { dims?: unknown }>).forEach(([id, v]) => {
    const dims = sanitizeScores(v?.dims);
    if (dims) out[id] = { dims };
  });
  return out;
}

/** Complète un état enregistré avant l'ajout d'un champ (sessions déjà ouvertes). */
export function normalizeMoodState(raw: Partial<MoodState> | null | undefined): MoodState {
  const s = raw ?? {};
  return {
    ...INITIAL_MOOD_STATE,
    ...s,
    votes: sanitizeVotes(s.votes),
    voterNames: s.voterNames && typeof s.voterNames === 'object' ? s.voterNames : {},
    revealed: !!s.revealed,
    round: typeof s.round === 'number' ? s.round : 0,
    chrono: s.chrono ?? INITIAL_MOOD_STATE.chrono,
    phase: s.phase === 'discussion' && s.revealed ? 'discussion' : 'vote',
    collective: sanitizeScores(s.collective, 0.5),
    anonymous: !!s.anonymous,
  };
}

/** Point de départ de la discussion : la moyenne des votes, au demi-point. */
export function initialCollective(votes: Record<string, MoodVote>): MoodScores {
  const voters = Object.values(votes);
  const out = {} as MoodScores;
  MOOD_DIMS.forEach((d) => {
    const avg = voters.length ? voters.reduce((s, v) => s + v.dims[d.key], 0) / voters.length : 5;
    out[d.key] = Math.min(10, Math.max(1, Math.round(avg * 2) / 2));
  });
  return out;
}

/* ── Opérations partagées ─────────────────────────────────────────────────── */

/**
 * Opérations du Team Mood, diffusées à tous les participants qui les
 * appliquent avec `moodReducer` : toute l'équipe peut voter dans la même
 * seconde sans qu'aucune note ne se perde. Toutes sont idempotentes (les
 * rejouer ne change rien), condition du socle `useToolSession`.
 */
export type MoodOp =
  | { t: 'vote'; round: number; voterId: string; dims: MoodScores; name?: string; color?: string }
  /** Révélation : fige les votes vus par celui qui révèle, identiques pour tous. */
  | { t: 'reveal'; round: number; votes: Record<string, MoodVote>; chrono: ToolChrono }
  /** Nouveau tour (`round` = tour courant + 1) : votes et discussion effacés. */
  | { t: 'newRound'; round: number; chrono?: ToolChrono }
  | { t: 'phase'; round: number; phase: MoodPhase }
  /** Note collective d'une dimension (une opération par dimension). */
  | { t: 'collective'; round: number; key: MoodDimKey; value: number }
  | { t: 'anonymous'; value: boolean }
  | { t: 'chrono'; chrono: ToolChrono };

export function moodReducer(raw: MoodState, op: MoodOp): MoodState {
  const s = normalizeMoodState(raw);
  switch (op.t) {
    case 'vote': {
      if (op.round !== s.round || s.revealed || !op.voterId) return s;
      const dims = sanitizeScores(op.dims);
      if (!dims) return s;
      const cur = s.votes[op.voterId]?.dims;
      if (cur && MOOD_DIMS.every((d) => cur[d.key] === dims[d.key])) return s;
      return {
        ...s,
        votes: { ...s.votes, [op.voterId]: { dims } },
        voterNames: op.name
          ? { ...s.voterNames, [op.voterId]: { name: op.name, color: op.color ?? '#1e2d7d' } }
          : s.voterNames,
      };
    }
    case 'reveal':
      if (op.round !== s.round || s.revealed) return s;
      return { ...s, votes: sanitizeVotes(op.votes), revealed: true, chrono: op.chrono };
    case 'newRound':
      if (op.round <= s.round) return s;
      return {
        ...s,
        round: op.round,
        votes: {},
        voterNames: {},
        revealed: false,
        phase: 'vote',
        collective: null,
        chrono: op.chrono ?? s.chrono,
      };
    case 'phase': {
      if (op.round !== s.round) return s;
      if (op.phase === 'discussion') {
        if (!s.revealed) return s;
        // Les votes sont figés depuis la révélation : tout le monde part du même point.
        const collective = s.collective ?? initialCollective(s.votes);
        return s.phase === 'discussion' && s.collective ? s : { ...s, phase: 'discussion', collective };
      }
      return s.phase === 'vote' ? s : { ...s, phase: 'vote' };
    }
    case 'collective': {
      if (op.round !== s.round || s.phase !== 'discussion' || !s.collective) return s;
      if (!MOOD_DIMS.some((d) => d.key === op.key) || typeof op.value !== 'number' || !Number.isFinite(op.value)) return s;
      const value = Math.min(10, Math.max(1, Math.round(op.value * 2) / 2));
      if (s.collective[op.key] === value) return s;
      return { ...s, collective: { ...s.collective, [op.key]: value } };
    }
    case 'anonymous':
      return s.anonymous === !!op.value ? s : { ...s, anonymous: !!op.value };
    case 'chrono':
      return { ...s, chrono: op.chrono };
    default:
      return s;
  }
}

/* ── Résultats ───────────────────────────────────────────────────────────── */

export interface MoodDimStat extends MoodDimension {
  average: number;
  min: number;
  max: number;
  count: number;
}

const round1 = (n: number) => Math.round(n * 10) / 10;

/** Moyenne, note la plus basse et la plus haute par dimension (0 si aucun vote). */
export function computeMoodStats(votes: Record<string, MoodVote>): MoodDimStat[] {
  const voters = Object.values(votes);
  return MOOD_DIMS.map((d) => {
    const vals = voters.map((v) => v.dims[d.key]);
    return {
      ...d,
      average: vals.length ? round1(vals.reduce((a, b) => a + b, 0) / vals.length) : 0,
      min: vals.length ? Math.min(...vals) : 0,
      max: vals.length ? Math.max(...vals) : 0,
      count: vals.length,
    };
  });
}

/** Moyenne de plusieurs notes sur 10, au dixième. */
export function averageOf(values: number[]): number {
  return values.length ? round1(values.reduce((a, b) => a + b, 0) / values.length) : 0;
}

/** Moyenne globale toutes dimensions confondues (sur 10). */
export function computeMoodGlobal(stats: MoodDimStat[]): number {
  return averageOf(stats.map((s) => s.average));
}

export interface MoodPoint {
  stat: MoodDimStat;
  low: boolean;
  split: boolean;
}

/** Dimensions à creuser ensemble : moyenne basse ou avis très partagés, les plus basses d'abord. */
export function pointsToDiscuss(stats: MoodDimStat[]): MoodPoint[] {
  return stats
    .filter((s) => s.count > 0)
    .map((stat) => ({ stat, low: stat.average < MOOD_LOW, split: stat.count > 1 && stat.max - stat.min >= MOOD_SPREAD }))
    .filter((p) => p.low || p.split)
    .sort((a, b) => a.stat.average - b.stat.average);
}

/** Note au format français (« 6,5 »). */
export function formatNote(n: number): string {
  return n.toLocaleString('fr-FR', { maximumFractionDigits: 1 });
}

/** Synthèse texte de la séance, à coller dans un compte rendu. */
export function buildMoodSummary(
  stats: MoodDimStat[],
  collective: MoodScores | null,
  voteCount: number,
  date: Date = new Date(),
): string {
  const lines = [
    `Team Mood — ${date.toLocaleDateString('fr-FR')}`,
    `Moral global : ${formatNote(computeMoodGlobal(stats))} / 10 (${voteCount} vote${voteCount > 1 ? 's' : ''})`,
  ];
  if (collective) {
    lines.push(`Note collective : ${formatNote(averageOf(MOOD_DIMS.map((d) => collective[d.key])))} / 10`);
  }
  lines.push('');
  stats.forEach((s) => {
    const coll = collective ? ` · collectif ${formatNote(collective[s.key])}` : '';
    lines.push(`${s.label} : moyenne ${formatNote(s.average)} (de ${s.min} à ${s.max})${coll}`);
  });
  const points = pointsToDiscuss(stats);
  if (points.length) {
    lines.push('', `Points à discuter : ${points.map((p) => p.stat.label).join(', ')}`);
  }
  return lines.join('\n');
}
