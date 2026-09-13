/** Logique pure du Daily Stand-up (tour de table minuté). */

/** Couleur de l'outil (celle de sa carte dans la boîte à outils). */
export const DAILY_ACCENT = '#0369a1';

/** Principe du daily, affiché sur la carte de l'outil et dans la page. */
export const DAILY_PRINCIPE =
  "Un tour de table structuré en 3 questions : ce que j'ai fait, ce que je fais, mes éventuels blocages et autres infos pertinentes.";

/** Les points que chacun aborde pendant son tour (rappel à l'écran). */
export const DAILY_QUESTIONS: { emoji: string; label: string; extra?: boolean }[] = [
  { emoji: '✅', label: "Ce que j'ai fait" },
  { emoji: '🛠️', label: 'Ce que je fais' },
  { emoji: '🚧', label: 'Mes éventuels blocages' },
  { emoji: '💬', label: 'Autres infos pertinentes', extra: true },
];

export type DailyPhase = 'idle' | 'next' | 'running' | 'paused' | 'done';

export interface DailyPerson {
  name: string;
  color: string;
}

export interface DailyState {
  phase: DailyPhase;
  /** Ordre de passage : identifiants de participants. */
  order: string[];
  /** Nombre de personnes présentes au démarrage (les suivantes sont arrivées en retard). */
  baseCount: number;
  /**
   * Index courant dans `order` (-1 hors séance). En phase « next », c'est la
   * personne qui vient de terminer ; la suivante est à `currentIdx + 1`.
   */
  currentIdx: number;
  /** Temps de parole par personne, en secondes. */
  durationSec: number;
  /** Horodatage (ms) de fin du tour courant quand `running`. */
  endsAt: number | null;
  /** Temps restant figé (pause / avant départ), en secondes. */
  remainingSec: number;
  /** Horodatage (ms) de début et de fin de séance, pour la durée totale. */
  startedAt: number | null;
  endedAt: number | null;
  /**
   * Prénom et couleur de chaque personne du tour : quelqu'un dont la
   * connexion décroche reste dans la liste au lieu de disparaître.
   */
  names: Record<string, DailyPerson>;
  /** Personnes dont le tour a été passé (absentes, pas de point). */
  skipped: string[];
  /** L'ordre de passage est-il tiré au sort au démarrage ? */
  randomOrder: boolean;
  /**
   * Numéro de séance, augmenté à chaque démarrage et à chaque arrêt, avec un
   * jeton pour départager deux animateurs qui démarrent en même temps. Un
   * geste d'une séance précédente est ignoré.
   */
  run: number;
  runToken: string;
}

export const DAILY_DURATIONS = [
  { value: 30, label: '30 s' },
  { value: 60, label: '1 min' },
  { value: 90, label: '1 min 30' },
  { value: 120, label: '2 min' },
  { value: 180, label: '3 min' },
  { value: 300, label: '5 min' },
];

/** Messages taquins affichés quand on dépasse le double du temps imparti (rotation par tour). */
export const OVERTIME_TAUNTS: { emoji: string; text: string }[] = [
  { emoji: '🐢', text: 'On a tout notre temps, hein ?' },
  { emoji: '🍿', text: 'On sort le pop-corn ?' },
  { emoji: '⌛', text: 'Le sablier a rendu l\'âme…' },
  { emoji: '📖', text: 'C\'est devenu un roman ?' },
  { emoji: '☕', text: 'Le café a eu le temps de refroidir.' },
];

export const INITIAL_DAILY_STATE: DailyState = {
  phase: 'idle',
  order: [],
  baseCount: 0,
  currentIdx: -1,
  durationSec: 120,
  endsAt: null,
  remainingSec: 120,
  startedAt: null,
  endedAt: null,
  names: {},
  skipped: [],
  randomOrder: false,
  run: 0,
  runToken: '',
};

const PHASES: DailyPhase[] = ['idle', 'next', 'running', 'paused', 'done'];

/** Complète un état enregistré avant l'ajout d'un champ (sessions déjà ouvertes). */
export function normalizeDailyState(raw: Partial<DailyState> | null | undefined): DailyState {
  const s = raw ?? {};
  const order = Array.isArray(s.order) ? s.order.filter((id) => typeof id === 'string') : [];
  return {
    ...INITIAL_DAILY_STATE,
    ...s,
    phase: s.phase && PHASES.includes(s.phase) ? s.phase : 'idle',
    order,
    baseCount: typeof s.baseCount === 'number' ? s.baseCount : order.length,
    currentIdx: typeof s.currentIdx === 'number' ? s.currentIdx : -1,
    durationSec: typeof s.durationSec === 'number' ? s.durationSec : INITIAL_DAILY_STATE.durationSec,
    names: s.names && typeof s.names === 'object' ? s.names : {},
    skipped: Array.isArray(s.skipped) ? s.skipped : [],
    randomOrder: !!s.randomOrder,
    run: typeof s.run === 'number' ? s.run : 0,
    runToken: typeof s.runToken === 'string' ? s.runToken : '',
  };
}

/** Durée par personne acceptée : de 15 s à 10 min. */
export function clampDuration(sec: number): number {
  return Math.max(15, Math.min(600, Math.round(sec)));
}

/** La séance est-elle en cours (quelqu'un parle, est annoncé ou en pause) ? */
export function isActive(phase: DailyPhase): boolean {
  return phase === 'running' || phase === 'paused' || phase === 'next';
}

/** Mélange de Fisher-Yates (copie). */
export function shuffled<T>(list: T[], rand: () => number = Math.random): T[] {
  const a = [...list];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/* ── Opérations partagées ─────────────────────────────────────────────────── */

/**
 * Opérations du Daily, diffusées à tous les participants qui les appliquent
 * avec `dailyReducer`. Chaque geste sur un tour porte la séance (`run`) et
 * l'index de la personne concernée : un « Suivant » cliqué deux fois, ou par
 * deux animateurs à la fois, ne fait avancer que d'une personne. Toutes sont
 * idempotentes (les rejouer ne change rien), condition du socle `useToolSession`.
 */
export type DailyOp =
  | { t: 'start'; run: number; token: string; order: string[]; names: Record<string, DailyPerson>; at: number }
  | { t: 'stop'; run: number; token: string }
  | { t: 'pause'; run: number; idx: number; remainingSec: number }
  | { t: 'resume'; run: number; idx: number; endsAt: number }
  /** Fin du tour de la personne `idx`. */
  | { t: 'next'; run: number; idx: number; at: number }
  /** La personne `idx` (annoncée) commence à parler. */
  | { t: 'go'; run: number; idx: number; endsAt: number }
  /** La personne `idx` (annoncée) est passée. */
  | { t: 'skip'; run: number; idx: number; at: number }
  /** Arrivée en retard : ajout en fin de tour. */
  | { t: 'join'; run: number; id: string; person: DailyPerson }
  | { t: 'duration'; durationSec: number }
  | { t: 'randomOrder'; value: boolean };

/** Une nouvelle séance l'emporte-t-elle sur la séance courante ? */
function newerRun(run: number, token: string, s: DailyState): boolean {
  return run > s.run || (run === s.run && token > s.runToken);
}

function finish(s: DailyState, at: number): DailyState {
  return { ...s, phase: 'done', endsAt: null, remainingSec: 0, endedAt: at };
}

export function dailyReducer(raw: DailyState, op: DailyOp): DailyState {
  const s = normalizeDailyState(raw);
  switch (op.t) {
    case 'start': {
      if (!newerRun(op.run, op.token, s) || op.order.length === 0) return s;
      return {
        ...s,
        run: op.run,
        runToken: op.token,
        phase: 'running',
        order: [...op.order],
        baseCount: op.order.length,
        names: { ...op.names },
        skipped: [],
        currentIdx: 0,
        endsAt: op.at + s.durationSec * 1000,
        remainingSec: s.durationSec,
        startedAt: op.at,
        endedAt: null,
      };
    }
    case 'stop':
      if (!newerRun(op.run, op.token, s)) return s;
      return {
        ...INITIAL_DAILY_STATE,
        durationSec: s.durationSec,
        remainingSec: s.durationSec,
        randomOrder: s.randomOrder,
        run: op.run,
        runToken: op.token,
      };
    case 'pause':
      if (op.run !== s.run || s.phase !== 'running' || op.idx !== s.currentIdx) return s;
      return { ...s, phase: 'paused', endsAt: null, remainingSec: op.remainingSec };
    case 'resume':
      if (op.run !== s.run || s.phase !== 'paused' || op.idx !== s.currentIdx) return s;
      return { ...s, phase: 'running', endsAt: op.endsAt };
    case 'next':
      if (op.run !== s.run || op.idx !== s.currentIdx || (s.phase !== 'running' && s.phase !== 'paused')) return s;
      if (op.idx >= s.order.length - 1) return finish(s, op.at);
      return { ...s, phase: 'next', endsAt: null, remainingSec: s.durationSec };
    case 'go':
      if (op.run !== s.run || s.phase !== 'next' || op.idx !== s.currentIdx + 1 || op.idx >= s.order.length) return s;
      return { ...s, phase: 'running', currentIdx: op.idx, endsAt: op.endsAt, remainingSec: s.durationSec };
    case 'skip': {
      if (op.run !== s.run || s.phase !== 'next' || op.idx !== s.currentIdx + 1 || op.idx >= s.order.length) return s;
      const skipped = [...s.skipped, s.order[op.idx]];
      if (op.idx >= s.order.length - 1) return finish({ ...s, skipped, currentIdx: op.idx }, op.at);
      return { ...s, skipped, currentIdx: op.idx };
    }
    case 'join': {
      if (op.run !== s.run || !isActive(s.phase) || !op.id || s.order.includes(op.id)) return s;
      // Les retardataires qui n'ont pas encore été annoncés sont rangés par
      // identifiant : deux arrivées simultanées donnent le même ordre partout.
      const keep = Math.max(s.baseCount, s.currentIdx + 2);
      const order = [...s.order.slice(0, keep), ...[...s.order.slice(keep), op.id].sort()];
      return { ...s, order, names: { ...s.names, [op.id]: op.person } };
    }
    case 'duration': {
      const durationSec = clampDuration(op.durationSec);
      if (durationSec === s.durationSec) return s;
      // Le tour en cours garde son temps ; la nouvelle durée vaut pour les suivants.
      const keepsTurn = s.phase === 'running' || s.phase === 'paused';
      return { ...s, durationSec, remainingSec: keepsTurn ? s.remainingSec : durationSec };
    }
    case 'randomOrder':
      return s.randomOrder === op.value ? s : { ...s, randomOrder: op.value };
    default:
      return s;
  }
}

/* ── Affichage ───────────────────────────────────────────────────────────── */

/** Temps restant du tour courant (négatif = dépassement). */
export function turnRemaining(state: DailyState, now: number = Date.now()): number {
  if (state.phase === 'running' && state.endsAt) {
    return Math.ceil((state.endsAt - now) / 1000);
  }
  return state.remainingSec;
}

/** Durée de la séance en secondes (jusqu'à la fin si elle est terminée). */
export function totalElapsed(state: DailyState, now: number = Date.now()): number {
  if (!state.startedAt) return 0;
  return Math.max(0, Math.floor(((state.endedAt ?? now) - state.startedAt) / 1000));
}

/** Formate un nombre de secondes en MM:SS (préfixe « + » en dépassement). */
export function formatTime(s: number): string {
  const abs = Math.abs(s);
  const m = Math.floor(abs / 60).toString().padStart(2, '0');
  const sec = (abs % 60).toString().padStart(2, '0');
  return (s < 0 ? '+' : '') + m + ':' + sec;
}
