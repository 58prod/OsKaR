import { estPayante, formuleDuCompte, joursRestants, type FormuleCompte } from './formule';
import { PILIERS_ADMIN, type BilanAdmin, type CandidatureAdmin, type CompteAdmin, type PilierAdmin } from './types';

/*
 * Les chiffres du tableau de bord, calculés à partir des listes que
 * l'administration charge déjà (comptes, bilans, candidatures) : pas de
 * requête à part, et des règles vérifiables dans les tests.
 */

const UN_JOUR = 24 * 60 * 60 * 1000;

/** Numéro de semaine ISO (lundi → dimanche), celui des agendas français. */
export function semaineIso(d: Date): number {
  const t = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const jour = t.getUTCDay() || 7;
  t.setUTCDate(t.getUTCDate() + 4 - jour);
  const debutAnnee = Date.UTC(t.getUTCFullYear(), 0, 1);
  return Math.ceil(((t.getTime() - debutAnnee) / UN_JOUR + 1) / 7);
}

/** Lundi 0 h de la semaine de `d`, heure locale. */
export function lundi(d: Date): Date {
  const l = new Date(d);
  l.setHours(0, 0, 0, 0);
  l.setDate(l.getDate() - ((l.getDay() + 6) % 7));
  return l;
}

export interface Semaine {
  libelle: string;
  nombre: number;
  courante: boolean;
}

/** Nouveaux comptes par semaine, les `nb` dernières, la semaine en cours à la fin. */
export function inscriptionsParSemaine(comptes: CompteAdmin[], maintenant: Date = new Date(), nb = 8): Semaine[] {
  const courante = lundi(maintenant);
  return Array.from({ length: nb }, (_, i) => {
    const debut = new Date(courante);
    debut.setDate(debut.getDate() - 7 * (nb - 1 - i));
    const fin = new Date(debut);
    fin.setDate(fin.getDate() + 7);
    return {
      libelle: `S${semaineIso(debut)}`,
      nombre: comptes.filter((c) => c.creeLe >= debut && c.creeLe < fin).length,
      courante: i === nb - 1,
    };
  });
}

const aCommence = (c: CompteAdmin) => PILIERS_ADMIN.some((p) => c.ateliers[p.id]);

export interface ChiffresCles {
  comptes: number;
  comptesCetteSemaine: number;
  bilans: number;
  bilansSansCompte: number;
  ateliers: number;
  comptesAvecAtelier: number;
  payantes: number;
  offertes: number;
  abonnements: number;
}

/** Les 4 cartes du haut. Le compte de démo ne compte pas parmi les formules. */
export function chiffresCles(comptes: CompteAdmin[], bilans: BilanAdmin[], maintenant: Date = new Date()): ChiffresCles {
  const formules = comptes.map((c) => formuleDuCompte(c, maintenant));
  const debutSemaine = lundi(maintenant);
  return {
    comptes: comptes.length,
    comptesCetteSemaine: comptes.filter((c) => c.creeLe >= debutSemaine).length,
    bilans: bilans.length,
    bilansSansCompte: bilans.filter((b) => !b.aUnCompte).length,
    ateliers: comptes.reduce((n, c) => n + PILIERS_ADMIN.filter((p) => c.ateliers[p.id]).length, 0),
    comptesAvecAtelier: comptes.filter(aCommence).length,
    payantes: formules.filter(estPayante).length,
    offertes: formules.filter((f) => f.genre === 'offerte').length,
    abonnements: formules.filter((f) => f.genre === 'abonne').length,
  };
}

/** Nombre de comptes ayant commencé chaque atelier. */
export function ateliersParPilier(comptes: CompteAdmin[]): Record<PilierAdmin, number> {
  const r = { vision: 0, fit: 0, finance: 0, okr: 0, team: 0 } as Record<PilierAdmin, number>;
  for (const c of comptes) for (const p of PILIERS_ADMIN) if (c.ateliers[p.id]) r[p.id] += 1;
  return r;
}

export interface EtapeEntonnoir {
  nombre: number;
  libelle: string;
  /** Part de l'étape précédente, en %, absente pour la première. */
  taux: number | null;
}

/** Du bilan à la formule payante, sur les `jours` derniers jours. */
export function entonnoir(
  comptes: CompteAdmin[],
  bilans: BilanAdmin[],
  maintenant: Date = new Date(),
  jours = 30
): EtapeEntonnoir[] {
  const depuis = new Date(maintenant.getTime() - jours * UN_JOUR);
  const recents = comptes.filter((c) => !c.demo && c.creeLe >= depuis);
  const nombres = [
    bilans.filter((b) => b.creeLe >= depuis).length,
    recents.length,
    recents.filter(aCommence).length,
    recents.filter((c) => estPayante(formuleDuCompte(c, maintenant))).length,
  ];
  const libelles = ['bilans réalisés', 'comptes créés', 'ont commencé un atelier', 'formules payantes'];
  return nombres.map((nombre, i) => ({
    nombre,
    libelle: libelles[i],
    taux: i === 0 ? null : nombres[i - 1] ? Math.round((nombre / nombres[i - 1]) * 100) : null,
  }));
}

export interface ATraiter {
  candidaturesNouvelles: number;
  plusAncienneCandidature: Date | null;
  offresQuiExpirent: { compte: CompteAdmin; formule: FormuleCompte; jours: number }[];
  contactsARecontacter: number;
}

/** Ce qui attend une réponse : candidatures, offres qui finissent, contacts. */
export function aTraiter(
  comptes: CompteAdmin[],
  candidatures: CandidatureAdmin[],
  bilans: BilanAdmin[],
  maintenant: Date = new Date()
): ATraiter {
  const nouvelles = candidatures.filter((c) => c.statut === 'nouvelle');
  const plusAncienne = nouvelles.reduce<Date | null>((m, c) => (!m || c.creeLe < m ? c.creeLe : m), null);

  const offresQuiExpirent = comptes
    .map((compte) => ({ compte, formule: formuleDuCompte(compte, maintenant) }))
    .filter(({ formule }) => formule.genre === 'offerte' && formule.jusquAu)
    .map((o) => ({ ...o, jours: joursRestants(o.formule.jusquAu as Date, maintenant) }))
    .filter((o) => o.jours <= 30)
    .sort((a, b) => a.jours - b.jours);

  const depuis = new Date(maintenant.getTime() - 7 * UN_JOUR);
  return {
    candidaturesNouvelles: nouvelles.length,
    plusAncienneCandidature: plusAncienne,
    offresQuiExpirent,
    contactsARecontacter: contactsSansCompte(bilans).filter((b) => b.accepteRecontact && b.creeLe >= depuis).length,
  };
}

/** Les bilans faits sans compte, un seul par email (le plus récent). */
export function contactsSansCompte(bilans: BilanAdmin[]): BilanAdmin[] {
  const vus = new Set<string>();
  return [...bilans]
    .filter((b) => !b.aUnCompte && b.email)
    .sort((a, b) => b.creeLe.getTime() - a.creeLe.getTime())
    .filter((b) => {
      const cle = (b.email as string).toLowerCase();
      if (vus.has(cle)) return false;
      vus.add(cle);
      return true;
    });
}
