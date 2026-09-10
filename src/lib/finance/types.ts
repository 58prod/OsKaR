/*
 * Atelier Finance — transposition de `Oskar/plateforme/finance-atelier.html`.
 *
 * Quatre étapes de saisie, puis la synthèse, qui figure dans la barre :
 *   1. Revenus      — période, flux de revenus, ce que la répartition révèle
 *   2. Coûts & marge — coûts variables et fixes, marge brute, leviers
 *   3. Rentabilité  — point mort, marge de sécurité, runway, objectif de CA
 *   4. Décisions    — trois actions à 90 jours, engagement du dirigeant
 *   5. Synthèse     — fin de l'atelier, passage au pilier OKR
 *
 * Les calculs reprennent à l'identique ceux de la maquette (`calcRevenus`,
 * `calcMarge`, `calcBreakEven`, `updateCaTarget`), en fonctions pures.
 */

export const ETAPES_FINANCE = ['revenus', 'couts', 'rentabilite', 'decisions', 'synthese'] as const;

export type EtapeFinance = (typeof ETAPES_FINANCE)[number];

export const LIBELLES_ETAPES_FINANCE: Record<EtapeFinance, string> = {
  revenus: 'Revenus',
  couts: 'Coûts & Marge',
  rentabilite: 'Rentabilité',
  decisions: 'Décisions',
  synthese: 'Synthèse',
};

/* ── Listes des menus, valeurs et libellés de la maquette ── */

export const TYPES_REVENU = [
  { valeur: 'rec', libelle: 'Récurrent' },
  { valeur: 'proj', libelle: 'Projet' },
  { valeur: 'oth', libelle: 'Autre' },
] as const;

export const TENDANCES = [
  { valeur: 'up', libelle: 'Croissance' },
  { valeur: 'stab', libelle: 'Stable' },
  { valeur: 'dn', libelle: 'Déclin' },
] as const;

export const MAITRISABLE = [
  { valeur: 'yes', libelle: 'Oui' },
  { valeur: 'no', libelle: 'Non' },
] as const;

export const CATEGORIES_FIXES = [
  { valeur: 'rh', libelle: 'RH' },
  { valeur: 'tech', libelle: 'Tech / SaaS' },
  { valeur: 'loc', libelle: 'Locaux' },
  { valeur: 'mkt', libelle: 'Marketing' },
  { valeur: 'adm', libelle: 'Admin' },
] as const;

export const COMPRESSIBLE = [
  { valeur: 'no', libelle: 'Non' },
  { valeur: 'part', libelle: 'Partiel' },
  { valeur: 'yes', libelle: 'Oui' },
] as const;

export const LEVIERS = ['Pricing', 'Volume', 'Mix offres', 'Réduction coûts', 'Modèle récurrent', 'Autre'] as const;

/* ── Données ── */

export interface Revenu {
  id: string;
  source: string;
  type: string;
  /** Montant saisi, gardé tel quel ; converti par `nombre`. */
  montant: string;
  tendance: string;
}

export interface CoutVariable {
  id: string;
  nature: string;
  montant: string;
  maitrisable: string;
}

export interface CoutFixe {
  id: string;
  nature: string;
  montant: string;
  categorie: string;
  compressible: string;
}

export interface Decision {
  action: string;
  levier: string;
  responsable: string;
  delai: string;
  impact: string;
}

export interface AtelierFinance {
  /* Étape 1 */
  periode: string;
  revenus: Revenu[];
  obsRevenus: string;
  /* Étape 2 */
  variables: CoutVariable[];
  fixes: CoutFixe[];
  leviersMarge: string;
  /* Étape 3 — coûts repris de l'étape 2, comme dans la maquette */
  beCa: string;
  beCf: string;
  beCv: string;
  beTreso: string;
  caCible: number;
  obsRentabilite: string;
  /* Étape 4 */
  decisions: [Decision, Decision, Decision];
  engagement: string;
}

const nouvelId = () =>
  typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : String(Date.now() + Math.random());

/** Nouvelles lignes, avec les valeurs par défaut de la maquette. */
export const nouveauRevenu = (): Revenu => ({ id: nouvelId(), source: '', type: 'rec', montant: '', tendance: 'up' });
export const nouveauCoutVariable = (): CoutVariable => ({ id: nouvelId(), nature: '', montant: '', maitrisable: 'yes' });
export const nouveauCoutFixe = (): CoutFixe => ({
  id: nouvelId(),
  nature: '',
  montant: '',
  categorie: 'rh',
  compressible: 'no',
});

/** L'atelier vide : deux lignes par tableau et les présélections de la maquette. */
export const ATELIER_FINANCE_VIDE: AtelierFinance = {
  periode: '',
  revenus: [
    { id: 'r1', source: '', type: 'rec', montant: '', tendance: 'up' },
    { id: 'r2', source: '', type: 'proj', montant: '', tendance: 'up' },
  ],
  obsRevenus: '',
  variables: [
    { id: 'v1', nature: '', montant: '', maitrisable: 'yes' },
    { id: 'v2', nature: '', montant: '', maitrisable: 'yes' },
  ],
  fixes: [
    { id: 'f1', nature: '', montant: '', categorie: 'rh', compressible: 'no' },
    { id: 'f2', nature: '', montant: '', categorie: 'loc', compressible: 'part' },
  ],
  leviersMarge: '',
  beCa: '',
  beCf: '',
  beCv: '',
  beTreso: '',
  caCible: 0,
  obsRentabilite: '',
  decisions: [
    { action: '', levier: 'Pricing', responsable: '', delai: '', impact: '' },
    { action: '', levier: 'Réduction coûts', responsable: '', delai: '', impact: '' },
    { action: '', levier: 'Modèle récurrent', responsable: '', delai: '', impact: '' },
  ],
  engagement: '',
};

/** Complète un contenu enregistré avec les champs que l'atelier vide définit. */
export function fusionnerFinance(contenu: unknown): AtelierFinance {
  const brut = (contenu ?? {}) as Partial<AtelierFinance>;
  const vide = ATELIER_FINANCE_VIDE;
  const decisions = vide.decisions.map((d, i) => ({ ...d, ...(brut.decisions?.[i] ?? {}) })) as AtelierFinance['decisions'];
  return {
    ...vide,
    ...brut,
    revenus: brut.revenus?.length ? brut.revenus : vide.revenus,
    variables: brut.variables?.length ? brut.variables : vide.variables,
    fixes: brut.fixes?.length ? brut.fixes : vide.fixes,
    caCible: typeof brut.caCible === 'number' ? brut.caCible : 0,
    decisions,
  };
}

/* ── Calculs ── */

/** « 450 000 » ou « 450000,5 » → nombre ; vide ou illisible → 0 (le `|| 0` de la maquette). */
export function nombre(saisie: string): number {
  const n = parseFloat(String(saisie ?? '').replace(/\s/g, '').replace(',', '.'));
  return Number.isFinite(n) ? n : 0;
}

/** Montant en euros, sans décimale, comme `fmt` dans la maquette. */
export function euros(n: number): string {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n);
}

/** Étape 1 : total, part de chaque ligne, part du récurrent, nombre de lignes. */
export function calculRevenus(a: AtelierFinance) {
  const montants = a.revenus.map((r) => nombre(r.montant));
  const total = montants.reduce((s, v) => s + v, 0);
  const recurrent = a.revenus.reduce((s, r, i) => s + (r.type === 'rec' ? montants[i] : 0), 0);
  return {
    total,
    /** Part de chaque ligne en %, null tant que le total est nul. */
    parts: montants.map((v) => (total > 0 ? Math.round((v / total) * 100) : null)),
    partRecurrente: total > 0 ? Math.round((recurrent / total) * 100) : null,
    /** La maquette compte les lignes, remplies ou non. */
    nbSources: a.revenus.length,
  };
}

/** Étape 2 : totaux, part de chaque coût variable dans le CA de l'étape 1, marge brute. */
export function calculCouts(a: AtelierFinance) {
  const ca = calculRevenus(a).total;
  const montantsCV = a.variables.map((c) => nombre(c.montant));
  const totalCV = montantsCV.reduce((s, v) => s + v, 0);
  const totalCF = a.fixes.reduce((s, c) => s + nombre(c.montant), 0);
  return {
    totalCV,
    totalCF,
    partsCV: montantsCV.map((v) => (ca > 0 ? Math.round((v / ca) * 100) : null)),
    /** CA de l'étape 1 moins les coûts variables ; null sans CA. */
    margeBrute: ca > 0 ? ca - totalCV : null,
  };
}

/**
 * Les totaux de l'étape 2 recopiés dans l'étape 3, comme `calcMarge` le fait
 * dans la maquette (le champ se vide quand le total est nul).
 */
export function reportCouts(a: AtelierFinance): Pick<AtelierFinance, 'beCv' | 'beCf'> {
  const { totalCV, totalCF } = calculCouts(a);
  return { beCv: totalCV ? String(totalCV) : '', beCf: totalCF ? String(totalCF) : '' };
}

/** Étape 3 : point mort, marge de sécurité, runway, jauge et borne du curseur. */
export function calculRentabilite(a: AtelierFinance) {
  const ca = nombre(a.beCa);
  const cf = nombre(a.beCf);
  const cv = nombre(a.beCv);
  const treso = nombre(a.beTreso);
  const tauxCV = ca > 0 ? cv / ca : 0;
  const tauxMarge = 1 - tauxCV;
  const pointMort = tauxMarge > 0 ? Math.round(cf / tauxMarge) : 0;
  const margeSecurite = ca > 0 && pointMort > 0 ? Math.round(((ca - pointMort) / ca) * 100) : 0;
  const depenseMensuelle = (cf + cv) / 12;
  const runway = depenseMensuelle > 0 ? Math.round(treso / depenseMensuelle) : 0;

  let jauge: { remplissage: number; curseur: number; max: number } | null = null;
  if (ca > 0 && pointMort > 0) {
    const max = Math.max(ca, pointMort) * 1.25;
    jauge = {
      remplissage: Math.min((ca / max) * 100, 100),
      curseur: Math.min((pointMort / max) * 100, 100),
      max: Math.round(max),
    };
  }

  return {
    ca,
    pointMort,
    margeSecurite,
    runway,
    /** Ce que la maquette affiche, « — » tant qu'il manque une donnée. */
    affiche: {
      pointMort: pointMort > 0,
      margeSecurite: ca > 0,
      runway: treso > 0 && depenseMensuelle > 0,
    },
    tonMarge: (margeSecurite >= 20 ? 'pos' : margeSecurite >= 0 ? 'warn' : 'neg') as Ton,
    tonRunway: (runway >= 6 ? 'pos' : runway >= 3 ? 'warn' : 'neg') as Ton,
    jauge,
    /** Borne du curseur « Objectif de CA » : 2 M€ par défaut, puis max(2×CA, 500 k€). */
    maxCurseur: jauge ? Math.max(ca * 2, 500000) : 2000000,
  };
}

export type Ton = 'navy' | 'pos' | 'neg' | 'warn';

/** Le commentaire sous le curseur d'objectif (`updateCaTarget`). */
export function lectureObjectif(caCible: number, pointMort: number):
  | { ton: 'attente'; texte: string }
  | { ton: 'bas'; minimum: string }
  | { ton: 'fragile'; texte: string }
  | { ton: 'bon'; ecart: number } {
  if (!caCible) return { ton: 'attente', texte: 'Définissez votre objectif de CA pour voir l’analyse.' };
  if (!pointMort) return { ton: 'attente', texte: 'Renseignez vos données pour voir l’analyse.' };
  if (caCible < pointMort) return { ton: 'bas', minimum: euros(pointMort) };
  if (caCible < pointMort * 1.2)
    return { ton: 'fragile', texte: 'Objectif légèrement au-dessus du point mort, marge de sécurité encore fragile.' };
  return { ton: 'bon', ecart: Math.round(((caCible - pointMort) / pointMort) * 100) };
}

/** Une étape est-elle entamée ? */
export function etapeFinanceRemplie(a: AtelierFinance, etape: EtapeFinance): boolean {
  switch (etape) {
    case 'revenus':
      return Boolean(a.periode.trim() || a.revenus.some((r) => r.source.trim() || r.montant.trim()));
    case 'couts':
      return [...a.variables, ...a.fixes].some((c) => c.nature.trim() || c.montant.trim());
    case 'rentabilite':
      return Boolean(a.beCa.trim() || a.beTreso.trim());
    case 'decisions':
      return a.decisions.some((d) => d.action.trim());
    default:
      return false;
  }
}
