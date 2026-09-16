import { AN_PILIER, AN_RULES, PILLARS, PILLAR_SHORT_LABEL } from '@/lib/diagnostic';
import type { CrossRule, PillarId, StateKey } from '@/lib/diagnostic';

/*
 * Calcul du Diagnostic 2 (version d'essai) :
 * - note d'un pilier = points des 3 réponses ÷ 9 × 10, une décimale ;
 * - niveaux sans trou : moins de 4 Fragile, moins de 7 En construction, sinon Solide ;
 * - le ressenti n'entre pas dans la note : il sert à montrer l'écart ;
 * - pas de note globale tant que tous les piliers ne sont pas remplis, et
 *   un pilier fragile empêche la note globale d'être « Solide ».
 */

export interface Saisie2 {
  /** Réponse choisie (0 à 3) pour chacune des 3 questions, null tant que rien n'est choisi. */
  reponses: [number | null, number | null, number | null];
  /** Ressenti de 0 à 10, null tant que le curseur n'a pas été bougé. */
  ressenti: number | null;
}

export interface Etat2 {
  piliers: Record<PillarId, Saisie2>;
  /** Dirigeant sans équipe : le pilier Team est laissé de côté. */
  seul: boolean;
}

export function etatInitial2(): Etat2 {
  const piliers = {} as Record<PillarId, Saisie2>;
  PILLARS.forEach((p) => { piliers[p.id] = { reponses: [null, null, null], ressenti: null }; });
  return { piliers, seul: false };
}

export function niveau2(note: number): StateKey {
  return note < 4 ? 'f' : note < 7 ? 'c' : 's';
}

/** Piliers attendus : Team sort du calcul pour qui travaille seul. */
export function piliersAttendus(etat: Etat2): PillarId[] {
  return PILLARS.map((p) => p.id).filter((id) => !(etat.seul && id === 'team'));
}

/** Note du pilier (0–10), ou null tant que les 3 questions n'ont pas de réponse. */
export function note2(saisie: Saisie2): number | null {
  if (saisie.reponses.some((r) => r === null)) return null;
  const total = saisie.reponses.reduce<number>((a, r) => a + (r ?? 0), 0);
  return Math.round((total / 9) * 100) / 10;
}

export function nbReponses(etat: Etat2): { faites: number; attendues: number } {
  const ids = piliersAttendus(etat);
  const faites = ids.reduce((n, id) => n + etat.piliers[id].reponses.filter((r) => r !== null).length, 0);
  return { faites, attendues: ids.length * 3 };
}

/** Atelier ouvert par la recommandation, pour chaque pilier. */
export const ATELIER_PILIER: Record<PillarId, { href: string; libelle: string }> = {
  vision: { href: '/app/vision', libelle: 'Ouvrir l’atelier OSKAR Vision' },
  fit: { href: '/app/fit', libelle: 'Ouvrir l’atelier OSKAR Market Fit' },
  finance: { href: '/app/finance', libelle: 'Ouvrir l’atelier OSKAR Finance' },
  okr: { href: '/app/okr', libelle: 'Construire mes OKR' },
  team: { href: '/app/outils', libelle: 'Découvrir les outils OSKAR Team' },
};

export interface NotePilier2 { id: PillarId; label: string; note: number; niveau: StateKey }
export interface Ecart2 { id: PillarId; label: string; ressenti: number; note: number }

export interface Analyse2 {
  complet: boolean;
  notes: NotePilier2[];
  moyenne: number | null;
  niveauGlobal: StateKey | null;
  message: string;
  priorite: (NotePilier2 & { prio: string; detail: string }) | null;
  autresChantiers: (NotePilier2 & { prio: string })[];
  appuis: (NotePilier2 & { detail: string })[];
  croisements: (CrossRule & { labelA: string; labelB: string })[];
  ecarts: Ecart2[];
}

const ORDRE_GRAVITE: Record<string, number> = { ff: 0, fc: 1, cf: 1, fs: 2, sf: 2, cc: 3, cs: 4, sc: 4, ss: 5 };
/** Écart ressenti / réponses à partir duquel on le signale. */
export const SEUIL_ECART = 2.5;

export function analyser2(etat: Etat2): Analyse2 {
  const ids = piliersAttendus(etat);
  const notes: NotePilier2[] = [];
  ids.forEach((id) => {
    const n = note2(etat.piliers[id]);
    if (n !== null) notes.push({ id, label: PILLAR_SHORT_LABEL[id], note: n, niveau: niveau2(n) });
  });
  const complet = notes.length === ids.length;

  let moyenne: number | null = null;
  let niveauGlobal: StateKey | null = null;
  if (complet) {
    moyenne = notes.reduce((a, n) => a + n.note, 0) / notes.length;
    niveauGlobal = niveau2(moyenne);
    if (niveauGlobal === 's' && notes.some((n) => n.niveau === 'f')) niveauGlobal = 'c';
  }

  const aTravailler = notes.filter((n) => n.niveau !== 's').sort((a, b) => a.note - b.note);
  const [premier, ...suite] = aTravailler;
  const priorite = premier ? { ...premier, ...AN_PILIER[premier.id][premier.niveau] } : null;
  const autresChantiers = suite.map((n) => ({ ...n, prio: AN_PILIER[n.id][n.niveau].prio }));
  const appuis = notes
    .filter((n) => n.niveau === 's')
    .sort((a, b) => b.note - a.note)
    .map((n) => ({ ...n, detail: AN_PILIER[n.id].s.detail }));

  // Croisements : seulement ceux qui touchent le pilier le plus faible, 2 au plus.
  const niveauDe = (id: PillarId) => notes.find((n) => n.id === id)?.niveau;
  const plusFaible = [...notes].sort((a, b) => a.note - b.note)[0];
  const croisements = plusFaible
    ? AN_RULES.filter((r) => (r.a === plusFaible.id || r.b === plusFaible.id) && niveauDe(r.a) === r.sa && niveauDe(r.b) === r.sb)
        .sort((a, b) => (ORDRE_GRAVITE[a.sa + a.sb] ?? 9) - (ORDRE_GRAVITE[b.sa + b.sb] ?? 9))
        .slice(0, 2)
        .map((r) => ({ ...r, labelA: PILLAR_SHORT_LABEL[r.a], labelB: PILLAR_SHORT_LABEL[r.b] }))
    : [];

  const ecarts: Ecart2[] = notes
    .map((n) => ({ id: n.id, label: n.label, ressenti: etat.piliers[n.id].ressenti, note: n.note }))
    .filter((e): e is Ecart2 => e.ressenti !== null && Math.abs(e.ressenti - e.note) >= SEUIL_ECART)
    .sort((a, b) => Math.abs(b.ressenti - b.note) - Math.abs(a.ressenti - a.note));

  let message = '';
  if (complet && priorite) {
    message = niveauGlobal === 'f'
      ? `Plusieurs piliers sont fragiles. Le plus urgent : ${priorite.label}, qui freine tout le reste.`
      : `Votre entreprise a des bases, mais ${priorite.label} est le pilier qui limite votre prochain palier.`;
  } else if (complet) {
    message = 'Tous vos piliers sont solides. L’enjeu est désormais de tenir ce niveau dans la durée.';
  }

  return { complet, notes, moyenne, niveauGlobal, message, priorite, autresChantiers, appuis, croisements, ecarts };
}
