import { initialChrono, type ToolChrono } from '@/components/toolbox/shared/toolChrono';

/**
 * Logique pure de la Résolution collective, atelier d'intelligence
 * collective en six étapes : les problèmes rencontrés sur un thème, le choix
 * des plus importants (3 au plus), les solutions, l'échange, le vote et le
 * premier pas.
 */

/** Accent orange de l'outil (cohérent avec sa bannière). */
export const RESOLUTION_ACCENT = '#c2410c';

export const THEME_MAX = 120;
export const PROBLEME_MAX = 280;
export const SOLUTION_MAX = 280;
export const COMMENTAIRE_MAX = 200;
export const QUESTION_MAX = 200;
export const SYNTHESE_MAX = 800;
export const PLAN_MAX = 200;

/** Nombre maximal de problèmes traités dans un atelier. */
export const MAX_RETENUS = 3;

/** Identifiant de la synthèse du rapporteur parmi les solutions soumises au vote. */
export const SYNTHESE = 'synthese';

/* ── Étapes ──────────────────────────────────────────────────────────────── */

export type ResolutionPhase = 'problemes' | 'choix' | 'solutions' | 'echange' | 'vote' | 'plan';

export interface PhaseInfo {
  key: ResolutionPhase;
  label: string;
  consigne: string;
  /** Durée proposée au minuteur en arrivant sur l'étape. */
  dureeSec: number;
}

export const PHASES: PhaseInfo[] = [
  {
    key: 'problemes',
    label: 'Problèmes',
    consigne: 'Chacun note seul les problèmes rencontrés sur ce thème. Personne ne voit ceux des autres avant l’étape suivante.',
    dureeSec: 300,
  },
  {
    key: 'choix',
    label: 'Choix',
    consigne: 'On découvre tous les problèmes, on regroupe les doublons et on vote avec ses cœurs. L’animateur retient 3 problèmes au plus.',
    dureeSec: 300,
  },
  {
    key: 'solutions',
    label: 'Solutions',
    consigne: 'Pour chaque problème retenu, chacun propose seul ses solutions : ce qu’il a déjà testé, ou une idée nouvelle.',
    dureeSec: 420,
  },
  {
    key: 'echange',
    label: 'Échange',
    consigne: 'On découvre les solutions et on les commente. Le rapporteur de chaque problème rédige la solution du groupe.',
    dureeSec: 600,
  },
  {
    key: 'vote',
    label: 'Vote',
    consigne: 'Une voix par problème : choisissez la solution à retenir. Les résultats s’affichent quand l’animateur les dévoile.',
    dureeSec: 180,
  },
  {
    key: 'plan',
    label: 'Premier pas',
    consigne: 'Pour chaque solution validée : la première action, la personne qui la porte et l’échéance.',
    dureeSec: 300,
  },
];

export function phaseIndex(phase: ResolutionPhase): number {
  return Math.max(0, PHASES.findIndex((p) => p.key === phase));
}

export function phaseInfo(phase: ResolutionPhase): PhaseInfo {
  return PHASES[phaseIndex(phase)];
}

const estPhase = (v: unknown): v is ResolutionPhase => PHASES.some((p) => p.key === v);

/** Les problèmes restent cachés tant qu'on est à l'étape où on les écrit. */
export const problemesVisibles = (phase: ResolutionPhase) => phase !== 'problemes';
/** Les solutions restent cachées jusqu'à l'échange. */
export const solutionsVisibles = (phase: ResolutionPhase) => phaseIndex(phase) >= phaseIndex('echange');

/* ── Contenus ────────────────────────────────────────────────────────────── */

/** Texte partagé où le plus récent l'emporte (thème, reformulation, synthèse…). */
export interface Horodate {
  text: string;
  at: number;
}

interface Auteur {
  authorId: string;
  authorName: string;
  authorColor: string;
}

export interface Probleme extends Auteur {
  id: string;
  text: string;
}

export type SolutionKind = 'teste' | 'idee';

export const SOLUTION_KINDS: { key: SolutionKind; label: string; color: string; bg: string }[] = [
  { key: 'teste', label: 'Déjà testé', color: '#0f766e', bg: '#ccfbf1' },
  { key: 'idee', label: 'Idée', color: '#6d28d9', bg: '#ede9fe' },
];

export function getSolutionKind(key: string) {
  return SOLUTION_KINDS.find((k) => k.key === key) ?? SOLUTION_KINDS[1];
}

export interface Solution extends Auteur {
  id: string;
  /** Problème visé (un problème regroupé renvoie à celui qui l'accueille). */
  problemId: string;
  kind: SolutionKind;
  text: string;
}

export type CommentKind = 'plus' | 'question' | 'risque';

export const COMMENT_KINDS: { key: CommentKind; signe: string; label: string; color: string }[] = [
  { key: 'plus', signe: '+', label: 'J’ajoute', color: '#15803d' },
  { key: 'question', signe: '?', label: 'Je m’interroge', color: '#0369a1' },
  { key: 'risque', signe: '!', label: 'Attention', color: '#b91c1c' },
];

export function getCommentKind(key: string) {
  return COMMENT_KINDS.find((k) => k.key === key) ?? COMMENT_KINDS[0];
}

export interface Commentaire extends Auteur {
  id: string;
  solutionId: string;
  kind: CommentKind;
  text: string;
}

export interface Rapporteur {
  /** null = personne ne rédige pour l'instant. */
  id: string | null;
  name: string;
  color: string;
  at: number;
}

/** Un choix daté (vote, solution validée, problème retenu, regroupement). */
export interface Choix {
  c: string | null;
  at: number;
}

export interface PlanAction {
  premierPas: Horodate;
  porteur: Horodate;
  /** Date ISO « 2026-10-03 », ou vide. */
  echeance: Horodate;
}

export type PlanField = keyof PlanAction;

export interface ResolutionState {
  theme: Horodate;
  phase: ResolutionPhase;
  phaseAt: number;
  problems: Probleme[];
  solutions: Solution[];
  comments: Commentaire[];
  /**
   * Cœurs datés par problème puis par votant (c = 'oui' ou null). Seuls les
   * premiers cœurs de chacun comptent, dans la limite fixée : voir `coeursParProbleme`.
   */
  coeurs: Record<string, Record<string, Choix>>;
  /** Problèmes retenus : c = 'oui' ou null, par identifiant de problème. */
  retenus: Record<string, Choix>;
  /** Reformulation « Comment pourrions-nous… ? » d'un problème retenu. */
  questions: Record<string, Horodate>;
  /** Regroupement d'un problème dans un autre : c = problème qui l'accueille. */
  regroupements: Record<string, Choix>;
  rapporteurs: Record<string, Rapporteur>;
  syntheses: Record<string, Horodate>;
  /** Votes par problème puis par votant : c = solution choisie. */
  votes: Record<string, Record<string, Choix>>;
  votesRevealed: Choix;
  /** Solution validée par problème. */
  validated: Record<string, Choix>;
  plans: Record<string, PlanAction>;
  /** Contributions affichées sans le nom de leur auteur. */
  anonymous: boolean;
  /** Cœurs par personne à l'étape « Choix », 0 = illimité. */
  voteLimit: number;
  /** Numéro de séance, augmenté à chaque « Nouvel atelier ». */
  round: number;
  chrono: ToolChrono;
  /** Contributions supprimées : un message en retard ne peut pas les faire revenir. */
  deleted: string[];
}

const VIDE: Horodate = { text: '', at: 0 };
const AUCUN: Choix = { c: null, at: 0 };
const PLAN_VIDE: PlanAction = { premierPas: VIDE, porteur: VIDE, echeance: VIDE };

export const INITIAL_RESOLUTION_STATE: ResolutionState = {
  theme: VIDE,
  phase: 'problemes',
  phaseAt: 0,
  problems: [],
  solutions: [],
  comments: [],
  coeurs: {},
  retenus: {},
  questions: {},
  regroupements: {},
  rapporteurs: {},
  syntheses: {},
  votes: {},
  votesRevealed: AUCUN,
  validated: {},
  plans: {},
  anonymous: false,
  voteLimit: 3,
  round: 0,
  chrono: initialChrono(PHASES[0].dureeSec),
  deleted: [],
};

/** Nombre de cœurs par personne proposés à l'animateur (0 = illimité). */
export const VOTE_LIMITS = [
  { value: 0, label: 'Cœurs illimités' },
  { value: 3, label: '3 cœurs par personne' },
  { value: 5, label: '5 cœurs par personne' },
  { value: 10, label: '10 cœurs par personne' },
];

/* ── Nettoyage des données reçues ───────────────────────────────────────── */

const texte = (v: unknown, max: number) => (typeof v === 'string' ? v.trim().slice(0, max) : '');
const nombre = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) && v > 0 ? v : 0);
const estObjet = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object' && !Array.isArray(v);

function auteur(n: Record<string, unknown>): Auteur | null {
  const authorId = texte(n.authorId, 80);
  if (!authorId) return null;
  return {
    authorId,
    authorName: texte(n.authorName, 40) || 'Participant',
    authorColor: texte(n.authorColor, 20) || '#94a3b8',
  };
}

export function sanitizeProbleme(raw: unknown): Probleme | null {
  if (!estObjet(raw)) return null;
  const a = auteur(raw);
  const id = texte(raw.id, 60);
  const text = texte(raw.text, PROBLEME_MAX);
  if (!a || !id || !text) return null;
  return { id, ...a, text };
}

export function sanitizeSolution(raw: unknown): Solution | null {
  if (!estObjet(raw)) return null;
  const a = auteur(raw);
  const id = texte(raw.id, 60);
  const problemId = texte(raw.problemId, 60);
  const text = texte(raw.text, SOLUTION_MAX);
  if (!a || !id || !problemId || !text) return null;
  return { id, ...a, problemId, kind: getSolutionKind(texte(raw.kind, 10)).key, text };
}

export function sanitizeCommentaire(raw: unknown): Commentaire | null {
  if (!estObjet(raw)) return null;
  const a = auteur(raw);
  const id = texte(raw.id, 60);
  const solutionId = texte(raw.solutionId, 60);
  const text = texte(raw.text, COMMENTAIRE_MAX);
  if (!a || !id || !solutionId || !text) return null;
  return { id, ...a, solutionId, kind: getCommentKind(texte(raw.kind, 10)).key, text };
}

const horodate = (v: unknown, max: number): Horodate =>
  (estObjet(v) ? { text: texte(v.text, max), at: nombre(v.at) } : VIDE);

const choix = (v: unknown): Choix =>
  (estObjet(v) ? { c: typeof v.c === 'string' && v.c ? v.c.slice(0, 60) : null, at: nombre(v.at) } : AUCUN);

function dico<T>(v: unknown, fn: (x: unknown) => T): Record<string, T> {
  if (!estObjet(v)) return {};
  return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, fn(x)]));
}

const liste = <T>(v: unknown, fn: (x: unknown) => T | null): T[] =>
  (Array.isArray(v) ? v.map(fn).filter((x): x is T => x !== null) : []);

const rapporteur = (v: unknown): Rapporteur => {
  if (!estObjet(v)) return { id: null, name: '', color: '', at: 0 };
  const id = texte(v.id, 80) || null;
  return { id, name: id ? texte(v.name, 40) : '', color: id ? texte(v.color, 20) : '', at: nombre(v.at) };
};

const plan = (v: unknown): PlanAction => (estObjet(v)
  ? { premierPas: horodate(v.premierPas, PLAN_MAX), porteur: horodate(v.porteur, 60), echeance: horodate(v.echeance, 10) }
  : PLAN_VIDE);

/** Complète et nettoie un état enregistré ou reçu (anciennes sessions, données abîmées). */
export function normalizeResolutionState(raw: Partial<ResolutionState> | null | undefined): ResolutionState {
  const s = (raw ?? {}) as Record<string, unknown>;
  return {
    theme: horodate(s.theme, THEME_MAX),
    phase: estPhase(s.phase) ? s.phase : 'problemes',
    phaseAt: nombre(s.phaseAt),
    problems: liste(s.problems, sanitizeProbleme),
    solutions: liste(s.solutions, sanitizeSolution),
    comments: liste(s.comments, sanitizeCommentaire),
    coeurs: dico(s.coeurs, (x) => dico(x, choix)),
    retenus: dico(s.retenus, choix),
    questions: dico(s.questions, (x) => horodate(x, QUESTION_MAX)),
    regroupements: dico(s.regroupements, choix),
    rapporteurs: dico(s.rapporteurs, rapporteur),
    syntheses: dico(s.syntheses, (x) => horodate(x, SYNTHESE_MAX)),
    votes: dico(s.votes, (x) => dico(x, choix)),
    votesRevealed: choix(s.votesRevealed),
    validated: dico(s.validated, choix),
    plans: dico(s.plans, plan),
    anonymous: s.anonymous === true,
    voteLimit: typeof s.voteLimit === 'number' ? Math.max(0, Math.min(50, Math.round(s.voteLimit))) : 3,
    round: nombre(s.round),
    chrono: (s.chrono as ToolChrono) ?? INITIAL_RESOLUTION_STATE.chrono,
    deleted: Array.isArray(s.deleted) ? s.deleted.filter((x): x is string => typeof x === 'string') : [],
  };
}

/* ── Opérations partagées ───────────────────────────────────────────────── */

/**
 * Le plus récent l'emporte ; à égalité d'horodatage, une règle fixe départage
 * (même résultat sur tous les écrans, quel que soit l'ordre d'arrivée).
 */
function gagne(at: number, cle: string, actuel: { at: number }, cleActuelle: string): boolean {
  return at > actuel.at || (at === actuel.at && cle > cleActuelle);
}

/**
 * Horodatage d'un nouveau geste : toujours après la valeur qu'on remplace,
 * même si l'horloge de cet ordinateur retarde sur celle d'un autre.
 */
export function apres(at: number, now: number = Date.now()): number {
  return Math.max(now, at + 1);
}

/** Insère en gardant l'ordre des identifiants (horodatés) : même ordre partout. */
function insertById<T extends { id: string }>(list: T[], item: T): T[] {
  if (list.some((x) => x.id === item.id)) return list;
  const i = list.findIndex((x) => x.id > item.id);
  return i < 0 ? [...list, item] : [...list.slice(0, i), item, ...list.slice(i)];
}

/** Remplace une entrée d'un dictionnaire daté si la nouvelle valeur est plus récente. */
function majChoix(dict: Record<string, Choix>, key: string, next: Choix): Record<string, Choix> {
  const cur = dict[key] ?? AUCUN;
  return gagne(next.at, next.c ?? '', cur, cur.c ?? '') ? { ...dict, [key]: next } : dict;
}

function majTexte(dict: Record<string, Horodate>, key: string, next: Horodate): Record<string, Horodate> {
  const cur = dict[key] ?? VIDE;
  return gagne(next.at, next.text, cur, cur.text) ? { ...dict, [key]: next } : dict;
}

/**
 * Opérations de la Résolution collective, diffusées à tous les participants
 * qui les appliquent avec `resolutionReducer`. Toutes sont idempotentes et ne
 * dépendent pas de l'ordre d'arrivée : les ajouts sont rangés par identifiant,
 * les réglages et textes partagés gardent le plus récent.
 */
export type ResolutionOp =
  | { t: 'theme'; text: string; at: number }
  | { t: 'phase'; phase: ResolutionPhase; at: number; chrono?: ToolChrono }
  | { t: 'addProblem'; round: number; problem: Probleme }
  | { t: 'addSolution'; round: number; solution: Solution }
  | { t: 'comment'; round: number; comment: Commentaire }
  /** Suppression par son auteur, ou par l'animateur (modération). */
  | { t: 'delete'; id: string; by: string; moderator?: boolean }
  /** Cœur donné (ou retiré) à un problème, daté : la limite de cœurs se calcule à l'affichage. */
  | { t: 'like'; id: string; voterId: string; liked: boolean; at: number }
  | { t: 'retain'; id: string; on: boolean; at: number }
  | { t: 'question'; id: string; text: string; at: number }
  /** Regroupe le problème `id` dans `into` (null = le détacher). */
  | { t: 'merge'; id: string; into: string | null; at: number }
  | { t: 'rapporteur'; problemId: string; id: string | null; name?: string; color?: string; at: number }
  | { t: 'synthese'; problemId: string; text: string; at: number }
  | { t: 'vote'; problemId: string; voterId: string; c: string | null; at: number }
  | { t: 'revealVotes'; on: boolean; at: number }
  | { t: 'validate'; problemId: string; c: string | null; at: number }
  | { t: 'plan'; problemId: string; field: PlanField; text: string; at: number }
  | { t: 'anonymous'; value: boolean }
  | { t: 'voteLimit'; value: number }
  | { t: 'chrono'; chrono: ToolChrono }
  /** Nouvel atelier (`round` = séance courante + 1) : tout est effacé sauf le thème et les réglages. */
  | { t: 'reset'; round: number; at: number; chrono?: ToolChrono };

const PLAN_MAX_PAR_CHAMP: Record<PlanField, number> = { premierPas: PLAN_MAX, porteur: 60, echeance: 10 };

export function resolutionReducer(raw: ResolutionState, op: ResolutionOp): ResolutionState {
  const s = normalizeResolutionState(raw);
  switch (op.t) {
    case 'theme': {
      const next = { text: texte(op.text, THEME_MAX), at: nombre(op.at) };
      return gagne(next.at, next.text, s.theme, s.theme.text) ? { ...s, theme: next } : s;
    }
    case 'phase': {
      if (!estPhase(op.phase) || !gagne(nombre(op.at), op.phase, { at: s.phaseAt }, s.phase)) return s;
      return { ...s, phase: op.phase, phaseAt: nombre(op.at), chrono: op.chrono ?? s.chrono };
    }
    case 'addProblem': {
      if (op.round !== s.round || s.deleted.includes(op.problem?.id)) return s;
      const p = sanitizeProbleme(op.problem);
      return p ? { ...s, problems: insertById(s.problems, p) } : s;
    }
    case 'addSolution': {
      if (op.round !== s.round || s.deleted.includes(op.solution?.id)) return s;
      const sol = sanitizeSolution(op.solution);
      return sol ? { ...s, solutions: insertById(s.solutions, sol) } : s;
    }
    case 'comment': {
      if (op.round !== s.round || s.deleted.includes(op.comment?.id)) return s;
      const c = sanitizeCommentaire(op.comment);
      return c ? { ...s, comments: insertById(s.comments, c) } : s;
    }
    case 'delete': {
      const item = [...s.problems, ...s.solutions, ...s.comments].find((x) => x.id === op.id);
      if (item && !(op.moderator || item.authorId === op.by)) return s;
      const deleted = s.deleted.includes(op.id) ? s.deleted : [...s.deleted, op.id];
      // Pas encore arrivée ici : on retient seulement qu'elle est supprimée.
      if (!item) return deleted === s.deleted ? s : { ...s, deleted };
      return {
        ...s,
        problems: s.problems.filter((x) => x.id !== op.id),
        solutions: s.solutions.filter((x) => x.id !== op.id),
        comments: s.comments.filter((x) => x.id !== op.id),
        deleted,
      };
    }
    case 'like': {
      // Aucun refus ici : refuser « le cœur de trop » dépendrait de l'ordre
      // d'arrivée des messages. La limite s'applique à l'affichage.
      if (!op.voterId || !op.id) return s;
      const duProbleme = s.coeurs[op.id] ?? {};
      const maj = majChoix(duProbleme, op.voterId, { c: op.liked ? 'oui' : null, at: nombre(op.at) });
      return maj === duProbleme ? s : { ...s, coeurs: { ...s.coeurs, [op.id]: maj } };
    }
    case 'retain': {
      const retenus = majChoix(s.retenus, op.id, { c: op.on ? 'oui' : null, at: nombre(op.at) });
      return retenus === s.retenus ? s : { ...s, retenus };
    }
    case 'question': {
      const questions = majTexte(s.questions, op.id, { text: texte(op.text, QUESTION_MAX), at: nombre(op.at) });
      return questions === s.questions ? s : { ...s, questions };
    }
    case 'merge': {
      if (op.into === op.id) return s;
      const regroupements = majChoix(s.regroupements, op.id, { c: op.into || null, at: nombre(op.at) });
      return regroupements === s.regroupements ? s : { ...s, regroupements };
    }
    case 'rapporteur': {
      const cur = s.rapporteurs[op.problemId] ?? rapporteur(null);
      const next = rapporteur({ id: op.id, name: op.name, color: op.color, at: op.at });
      if (!gagne(next.at, next.id ?? '', cur, cur.id ?? '')) return s;
      return { ...s, rapporteurs: { ...s.rapporteurs, [op.problemId]: next } };
    }
    case 'synthese': {
      const syntheses = majTexte(s.syntheses, op.problemId, { text: texte(op.text, SYNTHESE_MAX), at: nombre(op.at) });
      return syntheses === s.syntheses ? s : { ...s, syntheses };
    }
    case 'vote': {
      if (!op.voterId) return s;
      const duProbleme = s.votes[op.problemId] ?? {};
      const maj = majChoix(duProbleme, op.voterId, { c: op.c || null, at: nombre(op.at) });
      return maj === duProbleme ? s : { ...s, votes: { ...s.votes, [op.problemId]: maj } };
    }
    case 'revealVotes': {
      const next: Choix = { c: op.on ? 'oui' : null, at: nombre(op.at) };
      return gagne(next.at, next.c ?? '', s.votesRevealed, s.votesRevealed.c ?? '') ? { ...s, votesRevealed: next } : s;
    }
    case 'validate': {
      const validated = majChoix(s.validated, op.problemId, { c: op.c || null, at: nombre(op.at) });
      return validated === s.validated ? s : { ...s, validated };
    }
    case 'plan': {
      if (!(op.field in PLAN_VIDE)) return s;
      const cur = s.plans[op.problemId] ?? PLAN_VIDE;
      const next = { text: texte(op.text, PLAN_MAX_PAR_CHAMP[op.field]), at: nombre(op.at) };
      if (!gagne(next.at, next.text, cur[op.field], cur[op.field].text)) return s;
      return { ...s, plans: { ...s.plans, [op.problemId]: { ...cur, [op.field]: next } } };
    }
    case 'anonymous':
      return s.anonymous === !!op.value ? s : { ...s, anonymous: !!op.value };
    case 'voteLimit': {
      const value = Math.max(0, Math.min(50, Math.round(Number(op.value) || 0)));
      return s.voteLimit === value ? s : { ...s, voteLimit: value };
    }
    case 'chrono':
      return { ...s, chrono: op.chrono };
    case 'reset': {
      if (op.round <= s.round) return s;
      return {
        ...INITIAL_RESOLUTION_STATE,
        theme: s.theme,
        anonymous: s.anonymous,
        voteLimit: s.voteLimit,
        round: op.round,
        // Un changement d'étape envoyé avant la remise à zéro ne doit pas la défaire.
        phaseAt: Math.max(s.phaseAt, nombre(op.at)),
        chrono: op.chrono ?? INITIAL_RESOLUTION_STATE.chrono,
      };
    }
    default:
      return s;
  }
}

/* ── Lectures dérivées ──────────────────────────────────────────────────── */

type EtatCoeurs = Pick<ResolutionState, 'problems' | 'coeurs' | 'voteLimit'>;

/**
 * Cœurs qui comptent, par problème (votants rangés par identifiant). Chacun
 * garde ses premiers cœurs, par date, dans la limite fixée par l'animateur :
 * le résultat est le même sur tous les écrans, quel que soit l'ordre
 * d'arrivée des messages. Un cœur donné à son propre problème, ou à un
 * problème supprimé, ne compte pas (et ne consomme rien).
 */
export function coeursParProbleme(state: EtatCoeurs): Map<string, string[]> {
  const auteurs = new Map(state.problems.map((p) => [p.id, p.authorId]));
  const parVotant = new Map<string, { id: string; at: number }[]>();
  Object.entries(state.coeurs).forEach(([problemId, votants]) => {
    const auteur = auteurs.get(problemId);
    if (auteur === undefined) return;
    Object.entries(votants).forEach(([voterId, { c, at }]) => {
      if (!c || voterId === auteur) return;
      parVotant.set(voterId, [...(parVotant.get(voterId) ?? []), { id: problemId, at }]);
    });
  });
  const res = new Map<string, string[]>(state.problems.map((p) => [p.id, []]));
  [...parVotant.keys()].sort().forEach((voterId) => {
    const donnes = parVotant.get(voterId)!.sort((a, b) => (a.at - b.at) || a.id.localeCompare(b.id));
    (state.voteLimit > 0 ? donnes.slice(0, state.voteLimit) : donnes).forEach(({ id }) => res.get(id)!.push(voterId));
  });
  return res;
}

/** Cœurs d'une personne qui comptent. */
export function votesUsedBy(state: EtatCoeurs, voterId: string): number {
  let n = 0;
  coeursParProbleme(state).forEach((votants) => { if (votants.includes(voterId)) n += 1; });
  return n;
}

/** La personne a-t-elle mis un cœur sur ce problème (qu'il compte ou non) ? */
export function aDonneCoeur(state: Pick<ResolutionState, 'coeurs'>, problemId: string, voterId: string): boolean {
  return !!state.coeurs[problemId]?.[voterId]?.c;
}

/**
 * Problème qui accueille `id` après regroupements (lui-même s'il n'est pas
 * regroupé). Un regroupement vers un problème absent, ou une boucle, est ignoré.
 */
export function racine(state: Pick<ResolutionState, 'problems' | 'regroupements'>, id: string): string {
  const existe = new Set(state.problems.map((p) => p.id));
  let cur = id;
  const vus = new Set([id]);
  for (let i = 0; i < 20; i += 1) {
    const into = state.regroupements[cur]?.c;
    if (!into || !existe.has(into)) return cur;
    if (vus.has(into)) return id;
    vus.add(into);
    cur = into;
  }
  return id;
}

export interface GroupeProblemes {
  racine: Probleme;
  /** Problèmes regroupés dans celui-ci. */
  membres: Probleme[];
  /** Personnes ayant donné un cœur au groupe (sans doublon). */
  voix: string[];
}

/** Les problèmes affichés : un groupe par problème non regroupé, dans l'ordre d'arrivée. */
export function groupesProblemes(state: ResolutionState): GroupeProblemes[] {
  const coeurs = coeursParProbleme(state);
  const groupes = new Map<string, GroupeProblemes>();
  state.problems.forEach((p) => {
    if (racine(state, p.id) === p.id) groupes.set(p.id, { racine: p, membres: [], voix: [...(coeurs.get(p.id) ?? [])] });
  });
  state.problems.forEach((p) => {
    const r = racine(state, p.id);
    const g = r !== p.id ? groupes.get(r) : undefined;
    if (!g) return;
    g.membres.push(p);
    (coeurs.get(p.id) ?? []).forEach((v) => { if (!g.voix.includes(v)) g.voix.push(v); });
  });
  return [...groupes.values()];
}

/** Les problèmes retenus (3 au plus), dans l'ordre où l'animateur les a retenus. */
export function problemesRetenus(state: ResolutionState): GroupeProblemes[] {
  return groupesProblemes(state)
    .filter((g) => state.retenus[g.racine.id]?.c)
    .sort((a, b) => (state.retenus[a.racine.id].at - state.retenus[b.racine.id].at) || a.racine.id.localeCompare(b.racine.id))
    .slice(0, MAX_RETENUS);
}

/** Intitulé d'un problème : sa reformulation si l'animateur en a écrit une. */
export function intituleProbleme(state: ResolutionState, p: Probleme): string {
  return state.questions[p.id]?.text || p.text;
}

/** Solutions proposées pour un problème retenu (y compris celles d'un problème regroupé dedans). */
export function solutionsDe(state: ResolutionState, problemId: string): Solution[] {
  return state.solutions.filter((sol) => racine(state, sol.problemId) === problemId);
}

export function commentairesDe(state: ResolutionState, solutionId: string): Commentaire[] {
  return state.comments.filter((c) => c.solutionId === solutionId);
}

export interface Candidat {
  id: string;
  text: string;
  /** 'synthese' pour la solution rédigée par le rapporteur. */
  kind: SolutionKind | typeof SYNTHESE;
  auteur?: Solution;
}

/** Solutions soumises au vote : la synthèse du rapporteur d'abord, puis les propositions. */
export function candidats(state: ResolutionState, problemId: string): Candidat[] {
  const synthese = state.syntheses[problemId]?.text;
  return [
    ...(synthese ? [{ id: SYNTHESE, text: synthese, kind: SYNTHESE } as Candidat] : []),
    ...solutionsDe(state, problemId).map((sol): Candidat => ({ id: sol.id, text: sol.text, kind: sol.kind, auteur: sol })),
  ];
}

export interface ResultatVote {
  /** Voix par solution (seules les solutions encore proposées comptent). */
  voix: Record<string, number>;
  votants: number;
  /** Solution(s) en tête ; plusieurs = égalité. */
  enTete: string[];
}

export function resultatVote(state: ResolutionState, problemId: string): ResultatVote {
  const ids = new Set(candidats(state, problemId).map((c) => c.id));
  const voix: Record<string, number> = {};
  let votants = 0;
  Object.values(state.votes[problemId] ?? {}).forEach(({ c }) => {
    if (!c || !ids.has(c)) return;
    voix[c] = (voix[c] ?? 0) + 1;
    votants += 1;
  });
  const max = Math.max(0, ...Object.values(voix));
  return { voix, votants, enTete: max > 0 ? Object.keys(voix).filter((k) => voix[k] === max) : [] };
}

/** Choix de vote d'une personne pour un problème (null si elle n'a pas voté). */
export function monVote(state: ResolutionState, problemId: string, voterId: string): string | null {
  return state.votes[problemId]?.[voterId]?.c ?? null;
}

/** Solution validée d'un problème, si elle est toujours proposée. */
export function solutionValidee(state: ResolutionState, problemId: string): Candidat | null {
  const c = state.validated[problemId]?.c;
  return c ? candidats(state, problemId).find((x) => x.id === c) ?? null : null;
}

export function planDe(state: ResolutionState, problemId: string): PlanAction {
  return state.plans[problemId] ?? PLAN_VIDE;
}

/** Nom affiché pour l'auteur d'une contribution. */
export function authorLabel(item: Auteur, anonymous: boolean, myId?: string): string {
  if (myId && item.authorId === myId) return 'Vous';
  return anonymous ? 'Anonyme' : item.authorName;
}

/* ── Synthèse ───────────────────────────────────────────────────────────── */

const pluriel = (n: number, mot: string) => `${n} ${mot}${n > 1 ? 's' : ''}`;

/** Date courte « 3 oct. 2026 » à partir de « 2026-10-03 ». */
export function dateCourte(iso: string): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return iso;
  return new Date(`${iso}T12:00:00`).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
}

/** Compte rendu texte de l'atelier (export .txt et « Copier la synthèse »). */
export function buildResolutionSummary(state: ResolutionState, date: Date = new Date()): string {
  const s = normalizeResolutionState(state);
  const signe = (a: Auteur) => (s.anonymous ? '' : ` — ${a.authorName}`);
  const retenus = problemesRetenus(s);
  const idsRetenus = new Set(retenus.map((g) => g.racine.id));

  let txt = `RÉSOLUTION COLLECTIVE OSKAR — ${date.toLocaleDateString('fr-FR')}\n${'='.repeat(48)}\n\n`;
  txt += `Thème : ${s.theme.text || '(non précisé)'}\n`;
  txt += `Problèmes notés : ${s.problems.length} · retenus : ${retenus.length}\n`;
  if (s.anonymous) txt += 'Atelier anonyme : auteurs non indiqués.\n';

  retenus.forEach((g, i) => {
    const id = g.racine.id;
    const question = s.questions[id]?.text;
    txt += `\nPROBLÈME ${i + 1} — ${question || g.racine.text}\n${'-'.repeat(44)}\n`;
    if (question) txt += `Problème de départ : ${g.racine.text}${signe(g.racine)}\n`;
    g.membres.forEach((m) => { txt += `Regroupé : ${m.text}${signe(m)}\n`; });
    txt += `Cœurs : ${g.voix.length}\n`;

    const sols = solutionsDe(s, id);
    txt += `\nSolutions proposées (${sols.length}) :\n`;
    if (sols.length === 0) txt += '(aucune)\n';
    sols.forEach((sol) => {
      txt += `- [${getSolutionKind(sol.kind).label}] ${sol.text}${signe(sol)}\n`;
      commentairesDe(s, sol.id).forEach((c) => {
        txt += `    ${getCommentKind(c.kind).signe} ${c.text}${signe(c)}\n`;
      });
    });

    const synthese = s.syntheses[id]?.text;
    const rap = s.rapporteurs[id];
    if (synthese) {
      txt += `\nSolution du groupe${rap?.id && !s.anonymous ? ` (rapporteur : ${rap.name})` : ''} :\n${synthese}\n`;
    }

    const res = resultatVote(s, id);
    if (res.votants > 0) {
      txt += `\nVote (${pluriel(res.votants, 'voix')}) :\n`;
      candidats(s, id)
        .filter((c) => res.voix[c.id])
        .sort((a, b) => res.voix[b.id] - res.voix[a.id])
        .forEach((c) => { txt += `- ${res.voix[c.id]} — ${c.kind === SYNTHESE ? 'Solution du groupe' : c.text}\n`; });
    }

    const validee = solutionValidee(s, id);
    txt += `\nSolution validée : ${validee ? validee.text : '(pas encore validée)'}\n`;
    const pl = planDe(s, id);
    if (pl.premierPas.text || pl.porteur.text || pl.echeance.text) {
      txt += `Premier pas : ${pl.premierPas.text || '(à définir)'}\n`;
      txt += `Porteur : ${pl.porteur.text || '(à définir)'}`;
      txt += ` · Échéance : ${pl.echeance.text ? dateCourte(pl.echeance.text) : '(à définir)'}\n`;
    }
  });

  const autres = groupesProblemes(s)
    .filter((g) => !idsRetenus.has(g.racine.id))
    .sort((a, b) => b.voix.length - a.voix.length);
  txt += `\nAUTRES PROBLÈMES NOTÉS\n${'-'.repeat(44)}\n`;
  if (autres.length === 0) txt += '(aucun)\n';
  autres.forEach((g) => {
    txt += `- ${g.racine.text}  (${pluriel(g.voix.length, 'cœur')}${signe(g.racine)})\n`;
    g.membres.forEach((m) => { txt += `    · ${m.text}${signe(m)}\n`; });
  });
  return txt;
}
