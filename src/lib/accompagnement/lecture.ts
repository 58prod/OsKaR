import { fusionnerVision, visionAffichee } from '@/lib/vision/types';
import { concurrentsRenseignes, fusionnerFit, scoreFit, statutFit, type StatutFit } from '@/lib/fit/types';
import {
  CATEGORIES_FIXES,
  COMPRESSIBLE,
  MAITRISABLE,
  TENDANCES,
  TYPES_REVENU,
  calculCouts,
  calculRentabilite,
  calculRevenus,
  euros,
  fusionnerFinance,
  nombre,
} from '@/lib/finance/types';
import type { OkrDirigeant } from './types';

/*
 * Ce que le coach lit de chaque atelier : les contenus enregistrés mis en
 * rubriques, avec les libellés des écrans de saisie. Seul ce qui est rempli
 * apparaît ; les calculs (statut Market Fit, point mort, runway) sont ceux des
 * ateliers eux-mêmes.
 */

export interface Ligne {
  libelle: string;
  valeur: string;
}

export interface Tableau {
  colonnes: string[];
  lignes: string[][];
}

export interface Rubrique {
  titre: string;
  texte?: string;
  /** Lignes montrées avant le tableau (la période des revenus, par exemple). */
  avant?: Ligne[];
  tableau?: Tableau;
  lignes?: Ligne[];
}

const t = (v: unknown) => (typeof v === 'string' ? v.trim() : '');

/** Garde les lignes renseignées ; null si aucune. */
function lignes(liste: [string, unknown][]): Ligne[] | undefined {
  const l = liste.map(([libelle, v]) => ({ libelle, valeur: t(v) })).filter((x) => x.valeur);
  return l.length ? l : undefined;
}

function tableau(colonnes: string[], rangees: unknown[][]): Tableau | undefined {
  const l = rangees.map((r) => r.map(t)).filter((r) => r.some(Boolean));
  return l.length ? { colonnes, lignes: l } : undefined;
}

/** Une rubrique n'est gardée que si elle a quelque chose à montrer. */
function garder(r: Rubrique): boolean {
  return Boolean(r.texte || r.avant?.length || r.lignes?.length || r.tableau?.lignes.length);
}

const libelleDe = (liste: readonly { valeur: string; libelle: string }[], v: string) =>
  liste.find((x) => x.valeur === v)?.libelle ?? v;

const REPONSES: Record<string, string> = { oui: 'Oui', parfois: 'Parfois', non: 'Non', moyen: 'Moyennement' };
const DEMANDE: Record<string, string> = { forte: 'Forte', stable: 'Stable', faible: 'Faible' };

/* ── Vision ── */

export function lectureVision(contenu: unknown): Rubrique[] {
  const a = fusionnerVision(contenu);
  return [
    {
      titre: 'Le sens',
      lignes: lignes([
        ['Pourquoi l’entreprise existe', a.pourquoi],
        ['Comment elle agit', a.comment],
        ['Ce qu’elle fait concrètement', a.quoi],
      ]),
    },
    {
      titre: 'Cibles',
      tableau: tableau(
        ['Cible', 'Type', 'Segment', 'Priorité', 'Notes'],
        a.cibles.map((c) => [c.nom, c.type, c.segment, c.priorite, c.notes])
      ),
    },
    {
      titre: 'Acteurs',
      tableau: tableau(
        ['Acteur', 'Interne ou externe', 'Rôle', 'Pouvoir', 'Intérêt', 'Notes'],
        a.acteurs.map((x) => [x.nom, x.portee, x.role, x.pouvoir, x.interet, x.notes])
      ),
    },
    { titre: 'Le problème', texte: t(a.probleme) || undefined },
    {
      titre: 'Vision à 1 an',
      lignes: lignes([
        ['Chiffre d’affaires', a.projection.ca],
        ['Clients', a.projection.clients],
        ['Offre', a.projection.offre],
        ['Organisation', a.projection.organisation],
        ['Rythme de travail', a.projection.rythme],
        ['Énergie et santé', a.projection.energie],
        ['Vie personnelle', a.projection.viePerso],
        ['Limites', a.projection.limites],
      ]),
    },
    {
      titre: 'Valeurs',
      lignes: lignes(a.valeurs.filter((v) => t(v.nom)).map((v) => [t(v.nom), t(v.traduction) || '—'])),
    },
    { titre: 'Votre vision', texte: visionAffichee(a).trim() || undefined },
    {
      titre: 'Objectifs',
      tableau: tableau(
        ['Objectif', 'Type', 'Pourquoi', 'Mesure de succès'],
        a.objectifs.filter((o) => t(o.intitule)).map((o) => [o.intitule, o.type, o.pourquoi, o.mesure])
      ),
    },
  ].filter(garder);
}

/* ── Market Fit ── */

export function lectureFit(contenu: unknown): { statut: StatutFit; score: number; rubriques: Rubrique[] } {
  const a = fusionnerFit(contenu);
  const score = scoreFit(a);
  const rubriques: Rubrique[] = [
    {
      titre: 'L’offre',
      lignes: lignes([
        ['Nom / intitulé de l’offre', a.offreNom],
        ['Ce qu’elle permet de faire', a.offreValeur],
        ['Ce qu’elle ne fait pas', a.offreLimite],
        ['En une phrase', a.offrePitch],
        ['À l’aise pour l’expliquer en 30 secondes', REPONSES[a.lisibilite] ?? ''],
      ]),
    },
    {
      titre: 'La différenciation',
      lignes: lignes([
        ['Avantage principal', a.diffAvantage],
        ['Les clients l’expriment spontanément', REPONSES[a.diffClients] ?? ''],
        ['Ce qu’elle fait mieux ou différemment', a.diffMieux],
        ['Avantage durable', REPONSES[a.diffDurable] ?? ''],
      ]),
    },
    {
      titre: 'L’environnement concurrentiel',
      tableau: tableau(
        ['Concurrent ou alternative', 'Type', 'Ce qu’ils font bien', 'Notre avantage'],
        concurrentsRenseignes(a).map((c) => [c.nom, c.type, c.bien, c.avantage])
      ),
      lignes: lignes([
        ['Pourquoi un client nous choisit', a.concRaison],
        ['Ce que font les clients sans nous', a.concSans],
      ]),
    },
    {
      titre: 'Les signaux marché',
      lignes: lignes([
        ['Retours clients spontanés', a.sigVerbatim],
        ['Les clients recommandent spontanément', REPONSES[a.sigBouche] ?? ''],
        ['Rétention / renouvellement', a.sigRetention],
        ['Croissance organique', a.sigOrganique],
        ['NPS ou satisfaction', a.sigNps],
        ['Autre indicateur clé', a.sigAutre],
        ['Demande entrante', DEMANDE[a.sigDemande] ?? ''],
      ]),
    },
  ].filter(garder);
  return { statut: statutFit(score), score, rubriques };
}

/* ── Finance ── */

export function lectureFinance(contenu: unknown): { chiffres: Ligne[]; rubriques: Rubrique[] } {
  const a = fusionnerFinance(contenu);
  const revenus = calculRevenus(a);
  const couts = calculCouts(a);
  const r = calculRentabilite(a);
  const montant = (v: string) => (t(v) ? euros(nombre(v)) : '');

  const chiffres: Ligne[] = [
    ...(r.ca > 0 ? [{ libelle: 'CA annuel', valeur: euros(r.ca) }] : []),
    ...(r.affiche.pointMort ? [{ libelle: 'Point mort', valeur: euros(r.pointMort) }] : []),
    ...(r.affiche.margeSecurite ? [{ libelle: 'Marge de sécurité', valeur: `${r.margeSecurite} %` }] : []),
    ...(r.affiche.runway ? [{ libelle: 'Runway', valeur: `${r.runway} mois` }] : []),
    ...(a.caCible > 0 ? [{ libelle: 'Objectif de CA', valeur: euros(a.caCible) }] : []),
  ];

  const rubriques: Rubrique[] = [
    {
      titre: 'Revenus',
      avant: lignes([['Période analysée', a.periode]]),
      lignes: lignes([
        ['Total', revenus.total > 0 ? euros(revenus.total) : ''],
        ['Part récurrente', revenus.partRecurrente != null ? `${revenus.partRecurrente} %` : ''],
        ['Ce que la répartition révèle', a.obsRevenus],
      ]),
      tableau: tableau(
        ['Source ou offre', 'Type', 'CA estimé', 'Tendance'],
        a.revenus
          .filter((x) => t(x.source) || t(x.montant))
          .map((x) => [x.source, libelleDe(TYPES_REVENU, x.type), montant(x.montant), libelleDe(TENDANCES, x.tendance)])
      ),
    },
    {
      titre: 'Coûts variables',
      tableau: tableau(
        ['Nature', 'Montant annuel', 'Maîtrisable'],
        a.variables
          .filter((x) => t(x.nature) || t(x.montant))
          .map((x) => [x.nature, montant(x.montant), libelleDe(MAITRISABLE, x.maitrisable)])
      ),
    },
    {
      titre: 'Coûts fixes',
      tableau: tableau(
        ['Nature', 'Montant annuel', 'Catégorie', 'Compressible'],
        a.fixes
          .filter((x) => t(x.nature) || t(x.montant))
          .map((x) => [x.nature, montant(x.montant), libelleDe(CATEGORIES_FIXES, x.categorie), libelleDe(COMPRESSIBLE, x.compressible)])
      ),
    },
    {
      titre: 'Marge',
      lignes: lignes([
        // Sans coût variable saisi, la « marge brute » ne serait que le CA.
        ['Marge brute', couts.totalCV > 0 && couts.margeBrute != null ? euros(couts.margeBrute) : ''],
        ['Coûts à réduire sans dégrader la qualité', a.leviersMarge],
      ]),
    },
    {
      titre: 'Rentabilité',
      lignes: lignes([
        ['Trésorerie disponible', montant(a.beTreso)],
        ['Lecture des indicateurs', a.obsRentabilite],
      ]),
    },
    {
      titre: 'Décisions prioritaires',
      tableau: tableau(
        ['Décision / action', 'Levier', 'Responsable', 'Délai', 'Impact attendu'],
        a.decisions.filter((d) => t(d.action)).map((d) => [d.action, d.levier, d.responsable, d.delai, d.impact])
      ),
      lignes: lignes([['Engagement du dirigeant', a.engagement]]),
    },
  ].filter(garder);

  return { chiffres, rubriques };
}

/* ── OKR ── */

export const STATUTS_ACTION: Record<string, string> = {
  TODO: 'À faire',
  IN_PROGRESS: 'En cours',
  DONE: 'Faite',
  BLOCKED: 'Bloquée',
  CANCELLED: 'Abandonnée',
};

type Objectif = OkrDirigeant['objectifs'][number];
type Resultat = OkrDirigeant['resultats'][number];

export interface BrancheObjectif {
  objectif: Objectif;
  resultats: { resultat: Resultat; actions: OkrDirigeant['actions'] }[];
}

/** Avancement d'un résultat clé, en % borné à 0–100 ; null sans cible. */
export function avancementResultat(r: Pick<Resultat, 'cible' | 'actuel'>): number | null {
  if (!r.cible) return null;
  return Math.max(0, Math.min(100, Math.round(((r.actuel ?? 0) / r.cible) * 100)));
}

/** Ambitions → objectifs trimestriels → résultats clés → actions. */
export function arbreOkr(okr: OkrDirigeant) {
  const brancheDe = (o: Objectif): BrancheObjectif => ({
    objectif: o,
    resultats: okr.resultats
      .filter((r) => r.objectifId === o.id)
      .map((r) => ({ resultat: r, actions: okr.actions.filter((a) => a.resultatId === r.id) })),
  });
  const idsAmbitions = new Set(okr.ambitions.map((a) => a.id));
  return {
    ambitions: okr.ambitions.map((a) => ({
      ambition: a,
      objectifs: okr.objectifs.filter((o) => o.ambitionId === a.id).map(brancheDe),
    })),
    /** Objectifs sans ambition (ou dont l'ambition a été supprimée). */
    objectifsSeuls: okr.objectifs.filter((o) => !o.ambitionId || !idsAmbitions.has(o.ambitionId)).map(brancheDe),
    /** Actions rattachées à aucun résultat clé connu. */
    actionsSeules: okr.actions.filter((a) => !a.resultatId || !okr.resultats.some((r) => r.id === a.resultatId)),
  };
}

export function okrVide(okr: OkrDirigeant): boolean {
  return !okr.ambitions.length && !okr.objectifs.length && !okr.resultats.length && !okr.actions.length;
}
