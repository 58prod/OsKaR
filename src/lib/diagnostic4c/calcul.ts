import { PILLARS, PILLAR_SHORT_LABEL, type PillarId, type StateKey } from '@/lib/diagnostic';
import { ATELIERS4C, DOMINO4C, PILIERS4C, PROFILS4C, VERDICTS4C, type Outil4c, type ProfilId } from './contenu';

/*
 * Calcul du Diagnostic 4c.
 *
 * - Quatre réponses par pratique : Non = 0, En partie = 0,5, Oui = 1,
 *   Je ne sais pas = 0 (la pratique n'est pas visible, donc pas en place ;
 *   elle reste signalée « à vérifier »). Plus de « Non applicable ».
 * - Note du pilier = moyenne des pratiques × 10. Au fil de la saisie, la même
 *   moyenne sur les pratiques déjà répondues donne un score provisoire.
 * - La perception ne compte jamais : elle sert à repérer les écarts.
 * - Niveaux : moins de 4 Fragile, moins de 7 En construction, 7 et plus Solide.
 *   Un pilier fragile empêche un niveau global « Solide ».
 * - Qui travaille seul passe le pilier Team.
 */

export const REPONSES4C = [
  { valeur: 'non', libelle: 'Non' },
  { valeur: 'partiel', libelle: 'En partie' },
  { valeur: 'oui', libelle: 'Oui' },
  { valeur: 'inconnu', libelle: 'Je ne sais pas' },
] as const;
export type Reponse4c = (typeof REPONSES4C)[number]['valeur'];
export const libelleReponse4c = (r: Reponse4c) => REPONSES4C.find((x) => x.valeur === r)!.libelle;
const POINTS: Record<Reponse4c, number> = { non: 0, partiel: 0.5, oui: 1, inconnu: 0 };

export interface Saisie4c {
  perception: number | null;
  reponses: [Reponse4c | null, Reponse4c | null, Reponse4c | null, Reponse4c | null];
}
export interface Etat4c {
  /** null tant que la personne n'a pas dit si elle travaille seule ou avec une équipe. */
  seul: boolean | null;
  piliers: Record<PillarId, Saisie4c>;
}

/** Écart perception / pratiques à partir duquel on le signale. */
export const SEUIL_ECART = 3;

export function etatInitial4c(): Etat4c {
  const piliers = {} as Etat4c['piliers'];
  PILLARS.forEach((p) => { piliers[p.id] = { perception: null, reponses: [null, null, null, null] }; });
  return { seul: null, piliers };
}

export function piliersAttendus4c(etat: Etat4c): PillarId[] {
  return PILLARS.map((p) => p.id).filter((id) => !(etat.seul && id === 'team'));
}
export function niveau4c(note: number): StateKey { return note < 4 ? 'f' : note < 7 ? 'c' : 's'; }
export function nbReponses4c(s: Saisie4c): number { return s.reponses.filter((r) => r !== null).length; }
export function pilierComplet4c(s: Saisie4c): boolean { return s.perception !== null && nbReponses4c(s) === 4; }
/** Texte d'une pratique, adapté à qui travaille seul. */
export function textePratique(id: PillarId, index: number, seul: boolean | null): string {
  const c = PILIERS4C[id].criteres[index];
  return seul && c.texteSeul ? c.texteSeul : c.texte;
}

function moyenne(reponses: Reponse4c[]): number | null {
  if (reponses.length === 0) return null;
  return Math.round(reponses.reduce((t, r) => t + POINTS[r], 0) / reponses.length * 100) / 10;
}
/** Note définitive, quand les quatre pratiques sont répondues. */
export function note4c(s: Saisie4c): number | null {
  return nbReponses4c(s) === 4 ? moyenne(s.reponses as Reponse4c[]) : null;
}
/** Note sur les pratiques déjà répondues. */
export function noteProvisoire4c(s: Saisie4c): number | null {
  return moyenne(s.reponses.filter((r): r is Reponse4c => r !== null));
}

export interface NotePilier4c { id: PillarId; label: string; note: number; niveau: StateKey; perception: number }
export interface Ecart4c { id: PillarId; label: string; perception: number; note: number; sens: 'angle-mort' | 'sous-estime' }
export interface Action4c { id: PillarId; label: string; reponse: Reponse4c; pratique: string; action: string; verification: string; outil: Outil4c }
export interface Verdict4c extends NotePilier4c {
  titre: string;
  texte: string;
  reponses: { pratique: string; reponse: Reponse4c; preuveAExaminer: string }[];
  aVerifier: number;
}

export interface Analyse4c {
  complet: boolean;
  nbReponses: number;
  nbAttendu: number;
  notes: NotePilier4c[];
  moyenne: number | null;
  niveauGlobal: StateKey | null;
  profil: { id: ProfilId; nom: string; texte: string } | null;
  priorite: (NotePilier4c & { titre: string; texte: string; atelier: (typeof ATELIERS4C)[PillarId] }) | null;
  domino: { fort: NotePilier4c; texte: string } | null;
  ecarts: Ecart4c[];
  actions: Action4c[];
  verdicts: Verdict4c[];
}

/** Ordre des actions dans un pilier : ce qui manque d'abord, puis ce qui est à moitié fait, puis ce qui est à vérifier. */
const ORDRE_ACTION: Record<Reponse4c, number> = { non: 0, partiel: 1, inconnu: 2, oui: 9 };

export function analyser4c(etat: Etat4c): Analyse4c {
  const ids = piliersAttendus4c(etat);
  const nbAttendu = etat.seul === null ? PILLARS.length * 5 : ids.length * 5;
  const nbReponses = ids.reduce((n, id) => n + nbReponses4c(etat.piliers[id]) + (etat.piliers[id].perception === null ? 0 : 1), 0);
  const complet = etat.seul !== null && ids.every((id) => pilierComplet4c(etat.piliers[id]));

  const notes: NotePilier4c[] = [];
  ids.forEach((id) => {
    const s = etat.piliers[id];
    const note = note4c(s);
    if (note !== null && s.perception !== null) notes.push({ id, label: PILLAR_SHORT_LABEL[id], note, niveau: niveau4c(note), perception: s.perception });
  });

  const vide: Analyse4c = { complet, nbReponses, nbAttendu, notes, moyenne: null, niveauGlobal: null, profil: null, priorite: null, domino: null, ecarts: [], actions: [], verdicts: [] };
  if (!complet) return vide;

  // Du plus faible au plus solide ; à égalité, l'ordre des piliers (Vision d'abord).
  const parNote = [...notes].sort((a, b) => a.note - b.note);
  const plusFaible = parNote[0];
  const plusFort = notes.reduce<NotePilier4c | undefined>((m, n) => (!m || n.note > m.note ? n : m), undefined)!;

  const moy = Math.round(notes.reduce((t, n) => t + n.note, 0) / notes.length * 10) / 10;
  let niveauGlobal = niveau4c(moy);
  if (niveauGlobal === 's' && plusFaible.niveau === 'f') niveauGlobal = 'c';
  const idProfil: ProfilId = niveauGlobal === 's'
    ? (moy >= 8.5 && plusFaible.niveau === 's' ? 'horloger' : 'stratege')
    : niveauGlobal === 'c' ? 'batisseur' : 'pilote';

  const priorite = plusFaible.niveau !== 's'
    ? { ...plusFaible, ...VERDICTS4C[plusFaible.id][plusFaible.niveau], atelier: ATELIERS4C[plusFaible.id] }
    : null;
  const domino = priorite && plusFort.niveau === 's' && plusFort.id !== priorite.id && DOMINO4C[priorite.id][plusFort.id]
    ? { fort: plusFort, texte: DOMINO4C[priorite.id][plusFort.id]! }
    : null;

  const ecarts: Ecart4c[] = notes
    .filter((n) => Math.abs(n.perception - n.note) >= SEUIL_ECART)
    .sort((a, b) => Math.abs(b.perception - b.note) - Math.abs(a.perception - a.note))
    .map((n) => ({ id: n.id, label: n.label, perception: n.perception, note: n.note, sens: n.perception > n.note ? 'angle-mort' : 'sous-estime' }));

  // Trois actions, prises dans les piliers les plus faibles, deux au plus par pilier.
  const actions: Action4c[] = [];
  for (const n of parNote) {
    const aFaire = PILIERS4C[n.id].criteres
      .map((c, i) => ({ c, i, r: etat.piliers[n.id].reponses[i] as Reponse4c }))
      .filter(({ r }) => r !== 'oui')
      .sort((a, b) => ORDRE_ACTION[a.r] - ORDRE_ACTION[b.r])
      .slice(0, 2);
    for (const { c, i, r } of aFaire) {
      if (actions.length < 3) {
        actions.push({ id: n.id, label: n.label, reponse: r, pratique: textePratique(n.id, i, etat.seul), action: c.action, verification: c.verification, outil: c.outil });
      }
    }
  }

  const verdicts: Verdict4c[] = notes.map((n) => ({
    ...n,
    ...VERDICTS4C[n.id][n.niveau],
    reponses: PILIERS4C[n.id].criteres.map((c, i) => ({ pratique: textePratique(n.id, i, etat.seul), reponse: etat.piliers[n.id].reponses[i] as Reponse4c, preuveAExaminer: c.preuveAExaminer })),
    aVerifier: etat.piliers[n.id].reponses.filter((r) => r === 'inconnu').length,
  }));

  return {
    ...vide,
    moyenne: moy,
    niveauGlobal,
    profil: { id: idProfil, nom: PROFILS4C[idProfil].nom, texte: PROFILS4C[idProfil].texte(plusFaible.label) },
    priorite,
    domino,
    ecarts,
    actions,
    verdicts,
  };
}

/**
 * Relit, côté serveur, un état envoyé par le navigateur (route d'envoi par
 * email, publique) : champs attendus seulement, bornés. Le serveur recalcule
 * ensuite l'analyse ; rien de ce qui part par email n'est écrit par l'expéditeur.
 */
export function etat4cDuCorps(valeur: unknown): Etat4c | null {
  if (!valeur || typeof valeur !== 'object') return null;
  const brut = valeur as Record<string, unknown>;
  if (typeof brut.seul !== 'boolean') return null;
  const piliersBruts = brut.piliers as Record<string, unknown> | undefined;
  if (!piliersBruts || typeof piliersBruts !== 'object') return null;
  const valeurs = REPONSES4C.map((r) => r.valeur) as string[];
  const etat: Etat4c = { seul: brut.seul, piliers: {} as Etat4c['piliers'] };
  for (const p of PILLARS) {
    const s = piliersBruts[p.id] as Record<string, unknown> | undefined;
    if (!s || typeof s !== 'object') return null;
    const { perception, reponses } = s;
    if (perception !== null && (typeof perception !== 'number' || !Number.isInteger(perception) || perception < 0 || perception > 10)) return null;
    if (!Array.isArray(reponses) || reponses.length !== 4) return null;
    if (!reponses.every((r) => r === null || (typeof r === 'string' && valeurs.includes(r)))) return null;
    etat.piliers[p.id] = { perception: perception as number | null, reponses: reponses as Saisie4c['reponses'] };
  }
  return etat;
}
