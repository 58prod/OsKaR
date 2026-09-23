import { PILLARS, PILLAR_SHORT_LABEL, type PillarId, type StateKey } from '@/lib/diagnostic';
import { ATELIERS4, PILIERS4, PROFILS4, type ProfilId } from './contenu';

export const REPONSES4 = [
  { valeur: 'non', libelle: 'Non' },
  { valeur: 'partiel', libelle: 'En partie' },
  { valeur: 'oui', libelle: 'Oui' },
  { valeur: 'inconnu', libelle: 'Je ne sais pas' },
  { valeur: 'na', libelle: 'Non applicable' },
] as const;
export type Reponse4 = (typeof REPONSES4)[number]['valeur'];
export const libelleReponse4 = (reponse: Reponse4) => REPONSES4.find((r) => r.valeur === reponse)!.libelle;

export interface Saisie4 {
  perception: number | null;
  reponses: [Reponse4 | null, Reponse4 | null, Reponse4 | null, Reponse4 | null];
}
export interface Etat4 { piliers: Record<PillarId, Saisie4>; seul: boolean }
export const SEUIL_ECART = 3;

export function etatInitial4(): Etat4 {
  const piliers = {} as Etat4['piliers'];
  PILLARS.forEach((p) => { piliers[p.id] = { perception: null, reponses: [null, null, null, null] }; });
  return { piliers, seul: false };
}
export function piliersAttendus4(etat: Etat4): PillarId[] {
  return PILLARS.map((p) => p.id).filter((id) => !(etat.seul && id === 'team'));
}
export function niveau4(note: number): StateKey { return note < 4 ? 'f' : note < 7 ? 'c' : 's'; }
export function nbReponses4(saisie: Saisie4): number { return saisie.reponses.filter((r) => r !== null).length; }
export function pilierComplet4(saisie: Saisie4): boolean { return saisie.perception !== null && nbReponses4(saisie) === 4; }

/** Score de pratiques uniquement : Non=0, En partie=0,5, Oui=1.
 * Les NA sortent du dénominateur. Une inconnue ou une réponse manquante
 * suspend le score, sans être assimilée à un Non ni gonfler la moyenne.
 * La perception n’intervient jamais, même pour départager des piliers.
 */
/** Variante de calcul (Diagnostic 4b) : « Je ne sais pas » compte comme une
 * pratique non en place (0) au lieu de suspendre le score, et reste signalé
 * comme à clarifier. Sans option, le comportement de la V4 est inchangé. */
export interface Options4 { inconnuCommeNon?: boolean }

export function note4(saisie: Saisie4, options: Options4 = {}): number | null {
  if (saisie.reponses.some((r) => r === null || (r === 'inconnu' && !options.inconnuCommeNon))) return null;
  const applicables = saisie.reponses.filter((r) => r !== 'na');
  if (applicables.length === 0) return null;
  const points = applicables.reduce((total, r) => total + (r === 'oui' ? 1 : r === 'partiel' ? 0.5 : 0), 0);
  return Math.round(points / applicables.length * 100) / 10;
}

export interface NotePilier4 { id: PillarId; label: string; note: number; niveau: StateKey; perception: number | null; nbApplicables: number }
export interface Ecart4 { id: PillarId; label: string; perception: number; pratiques: number; sens: 'superieure' | 'inferieure' }
export interface Pratique4 { index: number; texte: string; reponse: Reponse4; preuveAExaminer: string }
export interface Verification4 extends Pratique4 { verification: string; action: string }
export interface Levier4 extends Verification4 { id: PillarId; label: string }
export interface Verdict4 {
  id: PillarId;
  label: string;
  note: number | null;
  niveau: StateKey | null;
  perception: number;
  nbApplicables: number;
  titre: string;
  texte: string;
  constats: Pratique4[];
  aVerifier: Verification4[];
}

function restituerPilier4(id: PillarId, saisie: Saisie4, options: Options4): Verdict4 {
  const note = note4(saisie, options);
  const constats: Pratique4[] = [];
  const aVerifier: Verification4[] = [];
  PILIERS4[id].criteres.forEach((critere, index) => {
    const reponse = saisie.reponses[index];
    if (reponse === null) return;
    const constat = { index, texte: critere.texte, reponse, preuveAExaminer: critere.preuveAExaminer };
    constats.push(constat);
    if (reponse !== 'oui' && reponse !== 'na') {
      aVerifier.push({ ...constat, verification: critere.verification, action: reponse === 'inconnu'
        ? `Clarifiez cette réponse à partir d’un exemple récent ou avec la personne concernée. Élément à examiner : ${critere.preuveAExaminer}`
        : critere.action });
    }
  });
  const oui = saisie.reponses.filter((r) => r === 'oui').length;
  const partiel = saisie.reponses.filter((r) => r === 'partiel').length;
  const non = saisie.reponses.filter((r) => r === 'non').length;
  const inconnues = saisie.reponses.filter((r) => r === 'inconnu').length;
  const na = saisie.reponses.filter((r) => r === 'na').length;
  return {
    id, label: PILLAR_SHORT_LABEL[id], note, niveau: note === null ? null : niveau4(note), perception: saisie.perception!, nbApplicables: 4 - na,
    // Le décompte couvre les quatre réponses : « à clarifier » et « non applicable » apparaissent dès qu'il y en a.
    titre: [`${oui} oui`, `${partiel} en partie`, `${non} non`, ...(inconnues ? [`${inconnues} à clarifier`] : []), ...(na ? [`${na} non applicable${na > 1 ? 's' : ''}`] : [])].join(' · '),
    texte: inconnues > 0 && options.inconnuCommeNon
      ? `${inconnues} réponse(s) « Je ne sais pas », comptée(s) comme non en place jusqu’à clarification. ${na} non applicable(s), hors calcul.`
      : inconnues > 0
      ? `${inconnues} réponse(s) « Je ne sais pas » : score suspendu jusqu’à clarification. ${na} non applicable(s), hors calcul.`
      : na === 4
        ? 'Les quatre pratiques sont déclarées non applicables : aucun score pour ce pilier.'
        : `Score fondé sur ${4 - na} pratique(s) applicable(s). ${na} non applicable(s), hors calcul. Ces déclarations restent à étayer par des éléments concrets.`,
    constats, aVerifier,
  };
}

export interface Analyse4 {
  complet: boolean;
  nbComplets: number;
  nbReponses: number;
  nbAttendu: number;
  notes: NotePilier4[];
  moyenne: number | null;
  niveauGlobal: StateKey | null;
  profil: { id: ProfilId; nom: string; texte: string } | null;
  priorite: (Verdict4 & { note: number; niveau: StateKey; justification: string; atelier: (typeof ATELIERS4)[PillarId] }) | null;
  ecarts: Ecart4[];
  leviers: Levier4[];
  verdicts: Verdict4[];
}

export function analyser4(etat: Etat4, options: Options4 = {}): Analyse4 {
  const ids = piliersAttendus4(etat);
  const nbComplets = ids.filter((id) => pilierComplet4(etat.piliers[id])).length;
  const complet = nbComplets === ids.length;
  const nbReponses = ids.reduce((n, id) => n + nbReponses4(etat.piliers[id]) + (etat.piliers[id].perception === null ? 0 : 1), 0);
  const notes: NotePilier4[] = [];
  ids.forEach((id) => {
    const saisie = etat.piliers[id];
    const note = note4(saisie, options);
    if (note !== null) notes.push({ id, label: PILLAR_SHORT_LABEL[id], note, niveau: niveau4(note), perception: saisie.perception, nbApplicables: saisie.reponses.filter((r) => r !== 'na').length });
  });
  const parNote = [...notes].sort((a, b) => a.note - b.note);
  const plusFaible = parNote[0];
  let moyenne: number | null = null;
  let niveauGlobal: StateKey | null = null;
  let profil: Analyse4['profil'] = null;
  // Aucun profil global ni classement prioritaire sur une couverture incomplète.
  if (complet && notes.length === ids.length) {
    moyenne = Math.round(notes.reduce((n, p) => n + p.note, 0) / notes.length * 10) / 10;
    niveauGlobal = niveau4(moyenne);
    if (niveauGlobal === 's' && plusFaible.niveau === 'f') niveauGlobal = 'c';
    const id: ProfilId = niveauGlobal === 's'
      ? (moyenne >= 8.5 && plusFaible.niveau === 's' ? 'horloger' : 'stratege')
      : niveauGlobal === 'c' ? 'batisseur' : 'pilote';
    profil = { id, nom: PROFILS4[id].nom, texte: PROFILS4[id].texte(plusFaible.label) };
  }
  const verdicts = complet ? ids.map((id) => restituerPilier4(id, etat.piliers[id], options)) : [];
  const exAequo = parNote.filter((n) => n.note === plusFaible?.note);
  const priorite: Analyse4['priorite'] = moyenne !== null && plusFaible.niveau !== 's'
    ? {
      ...verdicts.find((v) => v.id === plusFaible.id)!, note: plusFaible.note, niveau: plusFaible.niveau,
      justification: (exAequo.length > 1
        ? `Les piliers ${exAequo.map((n) => n.label).join(', ')} partagent le score de pratiques le plus bas. ${plusFaible.label} est proposé selon l’ordre du questionnaire.`
        : `${plusFaible.label} a le score de pratiques le plus bas.`)
        + ' La perception ne participe pas au classement. Cette piste est à confirmer selon votre contexte et les critères applicables ; ce n’est pas une cause établie des difficultés de l’entreprise.',
      atelier: ATELIERS4[plusFaible.id],
    } : null;
  const ecarts: Ecart4[] = complet ? notes
    .filter((n) => n.perception !== null && Math.abs(n.perception - n.note) >= SEUIL_ECART)
    .sort((a, b) => Math.abs(b.perception! - b.note) - Math.abs(a.perception! - a.note))
    .map((n) => ({ id: n.id, label: n.label, perception: n.perception!, pratiques: n.note, sens: n.perception! > n.note ? 'superieure' : 'inferieure' })) : [];

  // Les inconnues appellent d’abord une clarification. Puis les scores les plus bas.
  const ordreActions = [...verdicts].sort((a, b) => (a.note ?? -1) - (b.note ?? -1));
  const leviers: Levier4[] = [];
  for (const v of ordreActions) {
    const points = [...v.aVerifier].sort((a, b) => Number(b.reponse === 'inconnu') - Number(a.reponse === 'inconnu'));
    for (const c of points.slice(0, 2)) {
      if (leviers.length < 3) leviers.push({ id: v.id, label: v.label, ...c });
    }
  }
  return { complet, nbComplets, nbReponses, nbAttendu: ids.length * 5, notes, moyenne, niveauGlobal, profil, priorite, ecarts, leviers, verdicts };
}
