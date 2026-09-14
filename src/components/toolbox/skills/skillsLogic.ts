import { initialChrono, type ToolChrono } from '@/components/toolbox/shared/toolChrono';

/** Logique pure de « Compétences de l'équipe » (auto-évaluation 1–10 + radars). */

/** Accent bleu de l'outil (cohérent avec sa bannière). */
export const SKILLS_ACCENT = '#0369a1';

export const MIN_SKILLS = 3;
export const MAX_SKILLS = 10;
export const SKILL_NAME_MAX = 36;

/** Compétences proposées par défaut à l'ouverture d'une session. */
export const DEFAULT_SKILL_NAMES = [
  'Communication',
  'Autonomie',
  'Entraide',
  "Prise d'initiative",
  'Gestion du stress',
  'Clarté des rôles',
  'Adaptabilité',
];

export interface Skill {
  id: string;
  name: string;
}

/** Fiche d'un participant : identité figée + notes par compétence (1–10). */
export interface SkillsPerson {
  id: string;
  name: string;
  color: string;
  scores: Record<string, number>;
}

export interface SkillsState {
  skills: Skill[];
  /** Fiches par participant (persistent même si la personne se déconnecte). */
  people: Record<string, SkillsPerson>;
  /**
   * Numéro de séance, augmenté à chaque « Réinitialiser » : une note envoyée
   * juste avant la remise à zéro est ignorée au lieu de réapparaître.
   */
  round: number;
  chrono: ToolChrono;
}

/** Identifiant horodaté : les compétences ajoutées gardent le même ordre partout. */
export function skillId(): string {
  return `sk${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

export function buildDefaultSkills(): Skill[] {
  return DEFAULT_SKILL_NAMES.map((name, i) => ({ id: `def-${i}`, name }));
}

export const INITIAL_SKILLS_STATE: SkillsState = {
  skills: buildDefaultSkills(),
  people: {},
  round: 0,
  chrono: initialChrono(300),
};

const texte = (v: unknown, max: number) => (typeof v === 'string' ? v.trim().slice(0, max) : '');
const note = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) ? Math.max(1, Math.min(10, Math.round(v))) : 0);

function sanitizePerson(raw: unknown): SkillsPerson | null {
  if (!raw || typeof raw !== 'object') return null;
  const p = raw as Record<string, unknown>;
  const id = texte(p.id, 80);
  if (!id) return null;
  const scores: Record<string, number> = {};
  if (p.scores && typeof p.scores === 'object') {
    Object.entries(p.scores as Record<string, unknown>).forEach(([k, v]) => { const n = note(v); if (n) scores[k] = n; });
  }
  return { id, name: texte(p.name, 40) || 'Participant', color: texte(p.color, 20) || '#94a3b8', scores };
}

/** Complète un état enregistré avant l'ajout d'un champ (sessions déjà ouvertes). */
export function normalizeSkillsState(raw: Partial<SkillsState> | null | undefined): SkillsState {
  const s = raw ?? {};
  const skills = Array.isArray(s.skills)
    ? s.skills
      .map((k) => ({ id: texte(k?.id, 60), name: texte(k?.name, SKILL_NAME_MAX) }))
      .filter((k) => k.id && k.name)
    : [];
  const people: Record<string, SkillsPerson> = {};
  if (s.people && typeof s.people === 'object') {
    Object.values(s.people).forEach((raw) => { const p = sanitizePerson(raw); if (p) people[p.id] = p; });
  }
  return {
    ...INITIAL_SKILLS_STATE,
    ...s,
    skills: skills.length ? skills : buildDefaultSkills(),
    people,
    round: typeof s.round === 'number' ? s.round : 0,
    chrono: s.chrono ?? INITIAL_SKILLS_STATE.chrono,
  };
}

/* ── Opérations partagées ─────────────────────────────────────────────────── */

interface Identite { id: string; name: string; color: string }

/**
 * Opérations de « Compétences de l'équipe », diffusées à tous les
 * participants qui les appliquent avec `skillsReducer` : dix personnes
 * peuvent se noter dans la même seconde sans qu'aucune note ne se perde.
 * Toutes sont idempotentes (les rejouer ne change rien).
 */
export type SkillsOp =
  /** Arrivée : crée sa fiche si elle n'existe pas encore. */
  | { t: 'join'; round: number; person: Identite }
  /**
   * Une note. La fiche voyage avec : si le « join » arrive après (messages
   * dans le désordre), la fiche est créée par la note elle-même.
   */
  | { t: 'score'; round: number; person: Identite; skillId: string; value: number }
  | { t: 'skillAdd'; skill: Skill }
  | { t: 'skillRename'; id: string; name: string }
  | { t: 'skillDelete'; id: string }
  | { t: 'chrono'; chrono: ToolChrono }
  /** Nouvelle séance (`round` = séance courante + 1) : notes effacées, liste fournie par l'animateur. */
  | { t: 'reset'; round: number; skills: Skill[]; chrono?: ToolChrono };

function withPerson(s: SkillsState, who: Identite): Record<string, SkillsPerson> | null {
  const p = sanitizePerson({ ...who, scores: {} });
  if (!p) return null;
  return s.people[p.id] ? s.people : { ...s.people, [p.id]: p };
}

export function skillsReducer(raw: SkillsState, op: SkillsOp): SkillsState {
  const s = normalizeSkillsState(raw);
  switch (op.t) {
    case 'join': {
      if (op.round !== s.round) return s;
      const people = withPerson(s, op.person);
      return people && people !== s.people ? { ...s, people } : s;
    }
    case 'score': {
      if (op.round !== s.round || !s.skills.some((k) => k.id === op.skillId)) return s;
      const value = note(op.value);
      const people = withPerson(s, op.person);
      if (!people || !value) return s;
      const person = people[op.person.id];
      if (person.scores[op.skillId] === value && people === s.people) return s;
      return { ...s, people: { ...people, [person.id]: { ...person, scores: { ...person.scores, [op.skillId]: value } } } };
    }
    case 'skillAdd': {
      const id = texte(op.skill?.id, 60);
      const name = texte(op.skill?.name, SKILL_NAME_MAX);
      if (!id || !name || s.skills.length >= MAX_SKILLS) return s;
      if (s.skills.some((k) => k.id === id || k.name.toLowerCase() === name.toLowerCase())) return s;
      return { ...s, skills: [...s.skills, { id, name }] };
    }
    case 'skillRename': {
      const name = texte(op.name, SKILL_NAME_MAX);
      const cur = s.skills.find((k) => k.id === op.id);
      if (!cur || !name || cur.name === name) return s;
      if (s.skills.some((k) => k.id !== op.id && k.name.toLowerCase() === name.toLowerCase())) return s;
      return { ...s, skills: s.skills.map((k) => (k.id === op.id ? { ...k, name } : k)) };
    }
    case 'skillDelete': {
      if (!s.skills.some((k) => k.id === op.id) || s.skills.length <= MIN_SKILLS) return s;
      const people: Record<string, SkillsPerson> = {};
      Object.values(s.people).forEach((p) => {
        const scores = { ...p.scores };
        delete scores[op.id];
        people[p.id] = { ...p, scores };
      });
      return { ...s, skills: s.skills.filter((k) => k.id !== op.id), people };
    }
    case 'chrono':
      return { ...s, chrono: op.chrono };
    case 'reset': {
      if (op.round <= s.round) return s;
      const skills = (op.skills ?? [])
        .map((k) => ({ id: texte(k?.id, 60), name: texte(k?.name, SKILL_NAME_MAX) }))
        .filter((k) => k.id && k.name)
        .slice(0, MAX_SKILLS);
      return {
        ...s,
        round: op.round,
        skills: skills.length >= MIN_SKILLS ? skills : buildDefaultSkills(),
        people: {},
        chrono: op.chrono ?? s.chrono,
      };
    }
    default:
      return s;
  }
}

/* ── Résultats ───────────────────────────────────────────────────────────── */

/** Fiches par ordre alphabétique : même ordre sur tous les écrans. */
export function peopleOf(state: SkillsState): SkillsPerson[] {
  return Object.values(state.people).sort((a, b) => a.name.localeCompare(b.name, 'fr') || (a.id < b.id ? -1 : 1));
}

/** Nombre de compétences notées par une fiche (parmi celles encore listées). */
export function countScored(person: SkillsPerson, skills: Skill[]): number {
  return skills.filter((s) => (person.scores[s.id] ?? 0) > 0).length;
}

/** Vrai si la fiche a noté toutes les compétences listées. */
export function isComplete(person: SkillsPerson, skills: Skill[]): boolean {
  return skills.length > 0 && countScored(person, skills) === skills.length;
}

/** Moyenne d'équipe pour une compétence (0 si personne ne l'a notée). */
export function skillAverage(state: SkillsState, skillId: string): number {
  const vals = peopleOf(state)
    .map((p) => p.scores[skillId] ?? 0)
    .filter((v) => v > 0);
  if (vals.length === 0) return 0;
  return Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 10) / 10;
}

export interface SkillsRadarPoint {
  label: string;
  value: number;
}

/** Points radar d'une fiche individuelle (0 pour les compétences non notées). */
export function personRadarData(person: SkillsPerson, skills: Skill[]): SkillsRadarPoint[] {
  return skills.map((s) => ({ label: s.name, value: person.scores[s.id] ?? 0 }));
}

/** Points radar de la moyenne d'équipe. */
export function teamRadarData(state: SkillsState): SkillsRadarPoint[] {
  return state.skills.map((s) => ({ label: s.name, value: skillAverage(state, s.id) }));
}

/** Couleur sémantique d'un score (vert ≥ 8, ambre ≥ 5, rouge sinon). */
export function scoreColor(val: number): string {
  if (val >= 8) return '#22c55e';
  if (val >= 5) return '#f59e0b';
  return '#ef4444';
}

export interface SkillHighlight {
  skill: Skill;
  average: number;
  min: number;
  max: number;
}

export interface SkillsHighlights {
  /** Les deux compétences les mieux notées (moyenne ≥ 7). */
  forces: SkillHighlight[];
  /** Les deux moins bien notées (moyenne < 6). */
  progres: SkillHighlight[];
  /** Avis très partagés : 5 points ou plus entre la note la plus basse et la plus haute. */
  heterogenes: SkillHighlight[];
}

/** Points clés de la séance : forces, axes de progrès, compétences hétérogènes. */
export function skillsHighlights(state: SkillsState): SkillsHighlights {
  const people = peopleOf(state);
  const rows: SkillHighlight[] = state.skills
    .map((skill) => {
      const vals = people.map((p) => p.scores[skill.id] ?? 0).filter((v) => v > 0);
      return {
        skill,
        average: skillAverage(state, skill.id),
        min: vals.length ? Math.min(...vals) : 0,
        max: vals.length ? Math.max(...vals) : 0,
        count: vals.length,
      };
    })
    .filter((r) => r.count > 0)
    .map(({ count, ...r }) => ({ ...r, count } as SkillHighlight & { count: number }));
  const byAvg = [...rows].sort((a, b) => b.average - a.average);
  return {
    forces: byAvg.filter((r) => r.average >= 7).slice(0, 2),
    progres: [...byAvg].reverse().filter((r) => r.average < 6).slice(0, 2),
    heterogenes: rows.filter((r) => (r as SkillHighlight & { count: number }).count > 1 && r.max - r.min >= 5),
  };
}

/** Note au format français (« 6,5 »). */
export function formatScore(n: number): string {
  return n.toLocaleString('fr-FR', { maximumFractionDigits: 1 });
}

/** Résumé texte de la séance (export .txt). */
export function buildSkillsSummary(state: SkillsState, date: Date = new Date()): string {
  const people = peopleOf(state);

  let txt = `COMPÉTENCES DE L'ÉQUIPE — OSKAR — ${date.toLocaleDateString('fr-FR')}\n${'='.repeat(48)}\n\n`;
  txt += `Participants : ${people.length}\n`;
  txt += `Compétences : ${state.skills.length}\n`;
  txt += `Fiches complètes : ${people.filter((p) => isComplete(p, state.skills)).length}\n\n`;

  const h = skillsHighlights(state);
  const liste = (rows: SkillHighlight[]) => rows.map((r) => `${r.skill.name} (${formatScore(r.average)})`).join(', ') || '—';
  txt += `POINTS CLÉS\n${'-'.repeat(30)}\n`;
  txt += `Forces : ${liste(h.forces)}\n`;
  txt += `Axes de progrès : ${liste(h.progres)}\n`;
  txt += `Avis très partagés : ${h.heterogenes.map((r) => `${r.skill.name} (de ${r.min} à ${r.max})`).join(', ') || '—'}\n\n`;

  state.skills.forEach((s) => {
    txt += `${s.name.toUpperCase()}\n`;
    people.forEach((p) => {
      const v = p.scores[s.id];
      txt += `  ${p.name.padEnd(16)} ${v ? `${v}/10` : '—'}\n`;
    });
    const avg = skillAverage(state, s.id);
    if (avg > 0) txt += `  ${'Moyenne'.padEnd(16)} ${formatScore(avg)}/10\n`;
    txt += '\n';
  });

  return txt;
}
