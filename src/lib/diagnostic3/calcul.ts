import { PILLARS, PILLAR_SHORT_LABEL } from '@/lib/diagnostic';
import type { PillarId, StateKey } from '@/lib/diagnostic';
import { ATELIERS3, DOMINO3, PILIERS3, PROFILS3, VERDICTS3, type ProfilId } from './contenu';

/*
 * Calcul du Diagnostic 3.
 *
 * - Preuves : 4 cases par pilier, 2 points chacune (8 points).
 * - Ressenti : 0 à 10, compte pour 2 points. Il départage sans pouvoir
 *   masquer l'absence de preuves : sans case cochée, la note plafonne à 2.
 * - Note du pilier = preuves × 2 + ressenti × 0,2, sur 10. Le pilier est
 *   évalué dès que le ressenti est donné (aucune case cochée est une réponse).
 * - Niveaux : moins de 4 Fragile, moins de 7 En construction, 7 et plus
 *   Solide — il faut au moins 3 preuves sur 4 pour être « Solide ».
 * - Score global quand tous les piliers sont évalués ; un pilier fragile
 *   l'empêche d'être « Solide » (une entreprise vaut son maillon faible).
 * - Lucidité : écart entre le ressenti et les preuves ramenées sur 10.
 */

export interface Saisie3 {
  ressenti: number | null;
  preuves: [boolean, boolean, boolean, boolean];
}

export interface Etat3 {
  piliers: Record<PillarId, Saisie3>;
  /** Dirigeant sans équipe : Team sort du calcul. */
  seul: boolean;
}

export const POINTS_PAR_PREUVE = 2;
export const POIDS_RESSENTI = 0.2;
/** Écart ressenti / preuves (sur 10) à partir duquel on le signale. */
export const SEUIL_LUCIDITE = 3;

export function etatInitial3(): Etat3 {
  const piliers = {} as Record<PillarId, Saisie3>;
  PILLARS.forEach((p) => { piliers[p.id] = { ressenti: null, preuves: [false, false, false, false] }; });
  return { piliers, seul: false };
}

export function niveau3(note: number): StateKey {
  return note < 4 ? 'f' : note < 7 ? 'c' : 's';
}

export function piliersAttendus3(etat: Etat3): PillarId[] {
  return PILLARS.map((p) => p.id).filter((id) => !(etat.seul && id === 'team'));
}

export function nbPreuves(saisie: Saisie3): number {
  return saisie.preuves.filter(Boolean).length;
}

/** Preuves ramenées sur 10, pour les comparer au ressenti. */
export function preuvesSur10(saisie: Saisie3): number {
  return nbPreuves(saisie) * 2.5;
}

export function note3(saisie: Saisie3): number | null {
  if (saisie.ressenti === null) return null;
  return Math.round((nbPreuves(saisie) * POINTS_PAR_PREUVE + saisie.ressenti * POIDS_RESSENTI) * 10) / 10;
}

export interface NotePilier3 { id: PillarId; label: string; note: number; niveau: StateKey; ressenti: number; preuves: number }
export interface Lucidite3 { id: PillarId; label: string; ressenti: number; preuves: number; sens: 'angle-mort' | 'sous-estime' }
export interface Levier3 { id: PillarId; label: string; action: string }

export interface Analyse3 {
  complet: boolean;
  notes: NotePilier3[];
  moyenne: number | null;
  niveauGlobal: StateKey | null;
  profil: { id: ProfilId; nom: string; texte: string } | null;
  /** Pilier le plus faible s'il n'est pas solide, avec son verdict et son atelier. */
  priorite: (NotePilier3 & { titre: string; texte: string; atelier: (typeof ATELIERS3)[PillarId] }) | null;
  /** Ce que le pilier prioritaire coûte au pilier le plus solide. */
  domino: { fort: NotePilier3; texte: string } | null;
  lucidite: Lucidite3[];
  leviers: Levier3[];
  verdicts: (NotePilier3 & { titre: string; texte: string })[];
}

export function analyser3(etat: Etat3): Analyse3 {
  const ids = piliersAttendus3(etat);
  const notes: NotePilier3[] = [];
  ids.forEach((id) => {
    const saisie = etat.piliers[id];
    const note = note3(saisie);
    if (note === null || saisie.ressenti === null) return;
    notes.push({ id, label: PILLAR_SHORT_LABEL[id], note, niveau: niveau3(note), ressenti: saisie.ressenti, preuves: preuvesSur10(saisie) });
  });
  const complet = notes.length === ids.length;
  // Du plus faible au plus solide ; à égalité, l'ordre des piliers (Vision d'abord).
  const parNote = [...notes].sort((a, b) => a.note - b.note);

  let moyenne: number | null = null;
  let niveauGlobal: StateKey | null = null;
  let profil: Analyse3['profil'] = null;
  const plusFaible = parNote[0];
  // À égalité, le point fort est le premier dans l'ordre des piliers.
  const plusFort = notes.reduce<NotePilier3 | undefined>((m, n) => (!m || n.note > m.note ? n : m), undefined);

  if (complet && plusFaible) {
    moyenne = Math.round((notes.reduce((a, n) => a + n.note, 0) / notes.length) * 10) / 10;
    niveauGlobal = niveau3(moyenne);
    if (niveauGlobal === 's' && plusFaible.niveau === 'f') niveauGlobal = 'c';
    const id: ProfilId = niveauGlobal === 's'
      ? (moyenne >= 8.5 && plusFaible.niveau === 's' ? 'horloger' : 'stratege')
      : niveauGlobal === 'c' ? 'batisseur' : 'pilote';
    profil = { id, nom: PROFILS3[id].nom, texte: PROFILS3[id].texte(plusFaible.label) };
  }

  const priorite = plusFaible && plusFaible.niveau !== 's'
    ? { ...plusFaible, ...VERDICTS3[plusFaible.id][plusFaible.niveau], atelier: ATELIERS3[plusFaible.id] }
    : null;

  const domino = priorite && plusFort && plusFort.niveau === 's' && plusFort.id !== priorite.id
    ? { fort: plusFort, texte: DOMINO3[priorite.id][plusFort.id] ?? '' }
    : null;

  const lucidite: Lucidite3[] = notes
    .filter((n) => Math.abs(n.ressenti - n.preuves) >= SEUIL_LUCIDITE)
    .sort((a, b) => Math.abs(b.ressenti - b.preuves) - Math.abs(a.ressenti - a.preuves))
    .map((n) => ({ id: n.id, label: n.label, ressenti: n.ressenti, preuves: n.preuves, sens: n.ressenti > n.preuves ? 'angle-mort' : 'sous-estime' }));

  // Trois actions : les cases vides des piliers les plus faibles, deux au plus par pilier.
  const leviers: Levier3[] = [];
  for (const n of parNote) {
    const vides = PILIERS3[n.id].criteres.filter((_, i) => !etat.piliers[n.id].preuves[i]).slice(0, 2);
    for (const c of vides) {
      if (leviers.length < 3) leviers.push({ id: n.id, label: n.label, action: c.action });
    }
  }

  const verdicts = notes.map((n) => ({ ...n, ...VERDICTS3[n.id][n.niveau] }));

  return { complet, notes, moyenne, niveauGlobal, profil, priorite, domino, lucidite, leviers, verdicts };
}
