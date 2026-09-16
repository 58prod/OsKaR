import { PILLARS, PILLAR_SHORT_LABEL } from '@/lib/diagnostic';
import type { PillarId, StateKey } from '@/lib/diagnostic';
import { ATELIERS4, PILIERS4, PROFILS4, type ProfilId } from './contenu';

/*
 * Calcul du Diagnostic 4.
 *
 * - Preuves : 4 cases par pilier, 2 points chacune (8 points).
 * - Ressenti : 0 à 10, compte pour 2 points. Il départage sans pouvoir
 *   masquer l'absence de preuves : sans case cochée, la note plafonne à 2.
 * - Note du pilier = preuves × 2 + ressenti × 0,2, sur 10. Le pilier est
 *   évalué dès que le ressenti est donné (aucune case cochée est une réponse).
 * - Niveaux : moins de 4 Fragile, moins de 7 En construction, 7 et plus
 *   Solide — il faut au moins 3 preuves sur 4 pour être « Solide ».
 * - Score global quand tous les piliers sont évalués ; un pilier fragile
 *   l'empêche d'être « Solide » (convention de classement du questionnaire).
 * - Lucidité : écart entre le ressenti et les preuves ramenées sur 10.
 */

export interface Saisie4 {
  ressenti: number | null;
  preuves: [boolean, boolean, boolean, boolean];
}

export interface Etat4 {
  piliers: Record<PillarId, Saisie4>;
  /** Dirigeant sans équipe : Team sort du calcul. */
  seul: boolean;
}

export const POINTS_PAR_PREUVE = 2;
export const POIDS_RESSENTI = 0.2;
/** Écart ressenti / preuves (sur 10) à partir duquel on le signale. */
export const SEUIL_LUCIDITE = 3;

export function etatInitial4(): Etat4 {
  const piliers = {} as Record<PillarId, Saisie4>;
  PILLARS.forEach((p) => { piliers[p.id] = { ressenti: null, preuves: [false, false, false, false] }; });
  return { piliers, seul: false };
}

export function niveau4(note: number): StateKey {
  return note < 4 ? 'f' : note < 7 ? 'c' : 's';
}

export function piliersAttendus4(etat: Etat4): PillarId[] {
  return PILLARS.map((p) => p.id).filter((id) => !(etat.seul && id === 'team'));
}

export function nbPreuves(saisie: Saisie4): number {
  return saisie.preuves.filter(Boolean).length;
}

/** Preuves ramenées sur 10, pour les comparer au ressenti. */
export function preuvesSur10(saisie: Saisie4): number {
  return nbPreuves(saisie) * 2.5;
}

export function note4(saisie: Saisie4): number | null {
  if (saisie.ressenti === null) return null;
  return Math.round((nbPreuves(saisie) * POINTS_PAR_PREUVE + saisie.ressenti * POIDS_RESSENTI) * 10) / 10;
}

export interface NotePilier4 { id: PillarId; label: string; note: number; niveau: StateKey; ressenti: number; preuves: number }
export interface Lucidite4 { id: PillarId; label: string; ressenti: number; preuves: number; sens: 'angle-mort' | 'sous-estime' }
export interface Pratique4 { index: number; texte: string }
export interface Verification4 extends Pratique4 { verification: string; action: string }
export interface Levier4 extends Verification4 { id: PillarId; label: string }
export interface Verdict4 extends NotePilier4 {
  titre: string;
  texte: string;
  constats: Pratique4[];
  aVerifier: Verification4[];
}

/** Une case vide est une pratique non confirmée, jamais une absence avérée. */
function restituerPilier4(note: NotePilier4, saisie: Saisie4): Verdict4 {
  const constats: Pratique4[] = [];
  const aVerifier: Verification4[] = [];
  PILIERS4[note.id].criteres.forEach((critere, index) => {
    if (saisie.preuves[index]) constats.push({ index, texte: critere.texte });
    else aVerifier.push({ index, ...critere });
  });
  return {
    ...note,
    titre: `${constats.length}/4 pratiques déclarées`,
    texte: constats.length === 0
      ? 'Aucune pratique cochée : précisez vos réponses avant de conclure sur ce pilier.'
      : aVerifier.length === 0
        ? 'Vous déclarez les quatre pratiques proposées. Des exemples récents permettront de les approfondir.'
        : 'Les pratiques cochées sont reprises ci-dessous. Les autres restent à préciser avant de choisir une action.',
    constats,
    aVerifier,
  };
}

export interface Analyse4 {
  complet: boolean;
  notes: NotePilier4[];
  moyenne: number | null;
  niveauGlobal: StateKey | null;
  profil: { id: ProfilId; nom: string; texte: string } | null;
  /** Piste de discussion fondée sur le classement, sans causalité présumée. */
  priorite: (Verdict4 & { justification: string; atelier: (typeof ATELIERS4)[PillarId] }) | null;
  lucidite: Lucidite4[];
  leviers: Levier4[];
  verdicts: Verdict4[];
}

export function analyser4(etat: Etat4): Analyse4 {
  const ids = piliersAttendus4(etat);
  const notes: NotePilier4[] = [];
  ids.forEach((id) => {
    const saisie = etat.piliers[id];
    const note = note4(saisie);
    if (note === null || saisie.ressenti === null) return;
    notes.push({ id, label: PILLAR_SHORT_LABEL[id], note, niveau: niveau4(note), ressenti: saisie.ressenti, preuves: preuvesSur10(saisie) });
  });
  const complet = notes.length === ids.length;
  // Du plus faible au plus solide ; à égalité, l'ordre des piliers (Vision d'abord).
  const parNote = [...notes].sort((a, b) => a.note - b.note);

  let moyenne: number | null = null;
  let niveauGlobal: StateKey | null = null;
  let profil: Analyse4['profil'] = null;
  const plusFaible = parNote[0];

  if (complet && plusFaible) {
    moyenne = Math.round((notes.reduce((a, n) => a + n.note, 0) / notes.length) * 10) / 10;
    niveauGlobal = niveau4(moyenne);
    if (niveauGlobal === 's' && plusFaible.niveau === 'f') niveauGlobal = 'c';
    const id: ProfilId = niveauGlobal === 's'
      ? (moyenne >= 8.5 && plusFaible.niveau === 's' ? 'horloger' : 'stratege')
      : niveauGlobal === 'c' ? 'batisseur' : 'pilote';
    profil = { id, nom: PROFILS4[id].nom, texte: PROFILS4[id].texte(plusFaible.label) };
  }

  // Les conclusions attendent toutes les notes ; les scores restent disponibles en cours de saisie.
  const verdicts = complet ? notes.map((n) => restituerPilier4(n, etat.piliers[n.id])) : [];
  const exAequo = parNote.filter((n) => n.note === plusFaible?.note);
  const priorite = complet && plusFaible && plusFaible.niveau !== 's'
    ? {
      ...verdicts.find((v) => v.id === plusFaible.id)!,
      justification: exAequo.length > 1
        ? `Les piliers ${exAequo.map((n) => n.label).join(', ')} partagent la note la plus basse. ${plusFaible.label} est proposé en premier selon l’ordre du questionnaire ; choisissez le sujet le plus pertinent pour votre contexte.`
        : `${plusFaible.label} a la note la plus basse du questionnaire, calculée à partir des cases cochées et de votre ressenti. Cela en fait une piste de travail à confirmer, pas la cause établie des difficultés de l’entreprise.`,
      atelier: ATELIERS4[plusFaible.id],
    }
    : null;

  const lucidite: Lucidite4[] = (complet ? notes : [])
    .filter((n) => Math.abs(n.ressenti - n.preuves) >= SEUIL_LUCIDITE)
    .sort((a, b) => Math.abs(b.ressenti - b.preuves) - Math.abs(a.ressenti - a.preuves))
    .map((n) => ({ id: n.id, label: n.label, ressenti: n.ressenti, preuves: n.preuves, sens: n.ressenti > n.preuves ? 'angle-mort' : 'sous-estime' }));

  // Trois actions : les cases vides des piliers les plus faibles, deux au plus par pilier.
  const leviers: Levier4[] = [];
  for (const n of complet ? parNote : []) {
    const vides = verdicts.find((v) => v.id === n.id)!.aVerifier.slice(0, 2);
    for (const c of vides) {
      if (leviers.length < 3) leviers.push({ id: n.id, label: n.label, ...c });
    }
  }

  return { complet, notes, moyenne, niveauGlobal, profil, priorite, lucidite, leviers, verdicts };
}
