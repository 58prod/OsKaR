/*
 * Les formules d'Oskar et les demandes faites depuis la page Tarifs (/pricing).
 *
 * Grille arrêtée par Christophe le 2026-09-11 :
 *   - Gratuit ;
 *   - la formule payante, 39 € HT/mois ou 390 € HT/an, par entreprise ;
 *   - Sur mesure : plusieurs comptes pour une même entreprise, ou licence
 *     pour un réseau ou un groupement.
 *
 * Tant que Stripe n'est pas branché, la formule payante se demande par
 * formulaire (table `demandes_formule`) et s'active depuis /admin/comptes.
 * Règles pures, sans React ni Supabase, pour être testées à part.
 */

export const PRIX_MENSUEL_HT = 39;
export const PRIX_ANNUEL_HT = 390;
export const TAUX_TVA = 0.2;

export type Periode = 'mensuel' | 'annuel';

/** Mois offerts par le paiement à l'année : (12 × 39 − 390) / 39 = 2. */
export function moisOfferts(): number {
  return Math.round((PRIX_MENSUEL_HT * 12 - PRIX_ANNUEL_HT) / PRIX_MENSUEL_HT);
}

/** Ce que coûte un mois quand on paie à l'année : 32,50 € HT. */
export function mensuelALAnnee(): number {
  return PRIX_ANNUEL_HT / 12;
}

/** Montant TTC, arrondi au centime. */
export function ttc(ht: number): number {
  return Math.round(ht * (1 + TAUX_TVA) * 100) / 100;
}

/** 39 → « 39 € », 32.5 → « 32,50 € » (espaces insécables). */
export function euros(montant: number): string {
  const entier = Number.isInteger(montant);
  const nombre = montant.toLocaleString('fr-FR', {
    minimumFractionDigits: entier ? 0 : 2,
    maximumFractionDigits: 2,
  });
  return `${nombre} €`;
}

// ─── Demande de formule ─────────────────────────────────────────────────────

export type ObjetDemande = 'mensuel' | 'annuel' | 'plusieurs_comptes' | 'reseau';

/** Les choix du formulaire, dans l'ordre d'affichage. */
export const OBJETS_DEMANDE: { id: ObjetDemande; libelle: string; detail: string }[] = [
  { id: 'mensuel', libelle: 'Formule Dirigeant, au mois', detail: `${euros(PRIX_MENSUEL_HT)} HT/mois, sans engagement` },
  { id: 'annuel', libelle: 'Formule Dirigeant, à l’année', detail: `${euros(PRIX_ANNUEL_HT)} HT/an, ${moisOfferts()} mois offerts` },
  { id: 'plusieurs_comptes', libelle: 'Plusieurs comptes', detail: 'Associés, managers : un accès chacun' },
  { id: 'reseau', libelle: 'Réseau ou groupement', detail: 'Offrir Oskar à vos adhérents' },
];

export function estSurMesure(objet: ObjetDemande): boolean {
  return objet === 'plusieurs_comptes' || objet === 'reseau';
}

export interface DemandeFormule {
  prenom: string;
  nom: string;
  email: string;
  /** Nom de l'entreprise, ou du réseau quand l'objet est « reseau ». */
  entreprise: string;
  objet: ObjetDemande;
  /** Saisie libre du nombre de comptes (ou d'adhérents), sur mesure seulement. */
  comptes: string;
  message: string;
}

export const DEMANDE_VIDE: DemandeFormule = {
  prenom: '',
  nom: '',
  email: '',
  entreprise: '',
  objet: 'mensuel',
  comptes: '',
  message: '',
};

/** Longueurs maximales, identiques aux contraintes de la table `demandes_formule`. */
export const LONGUEURS_MAX_DEMANDE = {
  prenom: 100,
  nom: 100,
  email: 254,
  entreprise: 200,
  message: 3000,
} as const;

export const COMPTES_MAX = 100000;

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Le nombre de comptes saisi : null s'il est vide, ou s'il n'a pas de sens pour
 * cet objet (la formule Dirigeant n'a qu'un compte). `NaN` s'il est mal formé.
 */
export function comptesDeLaDemande(d: Pick<DemandeFormule, 'objet' | 'comptes'>): number | null {
  if (!estSurMesure(d.objet)) return null;
  const saisie = d.comptes.trim().replace(/\s/g, '');
  if (!saisie) return null;
  if (!/^\d+$/.test(saisie)) return NaN;
  return Number(saisie);
}

/**
 * Premier problème rencontré, formulé pour la personne, ou null si la demande
 * peut partir.
 */
export function problemeDemande(d: DemandeFormule): string | null {
  if (!d.prenom.trim()) return 'Indiquez votre prénom.';
  if (!d.nom.trim()) return 'Indiquez votre nom.';
  if (!d.email.trim()) return 'Indiquez votre email professionnel.';
  if (!EMAIL.test(d.email.trim())) return 'Cette adresse email ne semble pas valide.';
  if (!d.entreprise.trim()) {
    return d.objet === 'reseau' ? 'Indiquez le nom de votre réseau.' : 'Indiquez le nom de votre entreprise.';
  }
  if (!OBJETS_DEMANDE.some((o) => o.id === d.objet)) return 'Choisissez une formule.';
  const comptes = comptesDeLaDemande(d);
  if (comptes !== null && (Number.isNaN(comptes) || comptes < 1 || comptes > COMPTES_MAX)) {
    return 'Indiquez un nombre entier, ou laissez le champ vide.';
  }
  for (const [champ, max] of Object.entries(LONGUEURS_MAX_DEMANDE) as [keyof typeof LONGUEURS_MAX_DEMANDE, number][]) {
    if (d[champ].trim().length > max) return `Le champ est trop long (${max} caractères au plus).`;
  }
  return null;
}
