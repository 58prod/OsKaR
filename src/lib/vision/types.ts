/*
 * Atelier Vision — transposition de `Oskar/plateforme/vision-atelier.html`.
 *
 * Sept étapes, puis une synthèse :
 *   1. Le sens        — pourquoi, comment, quoi
 *   2. Cibles & acteurs
 *   3. Le problème
 *   4. Vision à 1 an  — quatre repères d'entreprise, quatre personnels
 *   5. Valeurs        — trois au plus, avec leur traduction concrète
 *   6. Votre vision   — assemblée à partir de l'étape 1, réécrivable
 *   7. Objectifs      — trois au plus, chacun d'entreprise ou personnel
 */

export const ETAPES_VISION = [
  'sens',
  'cibles',
  'probleme',
  'projection',
  'valeurs',
  'vision',
  'objectifs',
  'synthese',
] as const;

export type EtapeVision = (typeof ETAPES_VISION)[number];

/** Étapes numérotées dans la maquette : la synthèse n'en fait pas partie. */
export const NB_ETAPES_VISION = 7;

/* ── Étape 2 ── */

export const TYPES_CIBLE = ['B2B', 'B2C', 'B2B2C', 'Interne', 'Institutionnel'] as const;
export const ROLES_ACTEUR = [
  'Décideur',
  'Financeur',
  'Utilisateur',
  'Prescripteur',
  'Partenaire',
  'Régulateur',
  'Concurrent',
  'Équipe',
  'Fournisseur',
  'Autre',
] as const;
export const NIVEAUX = ['Élevé', 'Moyen', 'Faible'] as const;
export const PRIORITES = ['+', '++', '+++'] as const;

export interface Cible {
  id: string;
  nom: string;
  type: string;
  segment: string;
  priorite: string;
  notes: string;
}

export interface Acteur {
  id: string;
  nom: string;
  /** « Interne » ou « Externe ». */
  portee: string;
  role: string;
  pouvoir: string;
  interet: string;
  notes: string;
}

/* ── Étapes 4, 5, 7 ── */

export interface Projection {
  /** Côté entreprise : chiffre d'affaires, clients, offre, organisation. */
  ca: string;
  clients: string;
  offre: string;
  organisation: string;
  /** Côté personnel : rythme, énergie, vie privée, limites. */
  rythme: string;
  energie: string;
  viePerso: string;
  limites: string;
}

export interface Valeur {
  nom: string;
  traduction: string;
}

export type TypeObjectif = 'Business' | 'Personnel';

export interface ObjectifVision {
  intitule: string;
  pourquoi: string;
  mesure: string;
  type: TypeObjectif;
}

/** L'ensemble de ce qu'un atelier Vision produit. */
export interface AtelierVision {
  /* Étape 1 — le sens */
  pourquoi: string;
  comment: string;
  quoi: string;
  /* Étape 2 */
  cibles: Cible[];
  acteurs: Acteur[];
  /* Étape 3 */
  probleme: string;
  /* Étape 4 */
  projection: Projection;
  /* Étape 5 */
  valeurs: Valeur[];
  /* Étape 6 — vide tant que la personne n'a pas repris le texte assemblé */
  vision: string;
  /* Étape 7 */
  objectifs: ObjectifVision[];
}

export const PROJECTION_VIDE: Projection = {
  ca: '',
  clients: '',
  offre: '',
  organisation: '',
  rythme: '',
  energie: '',
  viePerso: '',
  limites: '',
};

export const OBJECTIF_VIDE: ObjectifVision = {
  intitule: '',
  pourquoi: '',
  mesure: '',
  type: 'Business',
};

export const ATELIER_VIDE: AtelierVision = {
  pourquoi: '',
  comment: '',
  quoi: '',
  cibles: [],
  acteurs: [],
  probleme: '',
  projection: PROJECTION_VIDE,
  valeurs: [
    { nom: '', traduction: '' },
    { nom: '', traduction: '' },
    { nom: '', traduction: '' },
  ],
  vision: '',
  objectifs: [{ ...OBJECTIF_VIDE }, { ...OBJECTIF_VIDE }, { ...OBJECTIF_VIDE }],
};

/**
 * Le texte de vision assemblé à partir de l'étape 1, tel que la maquette le
 * compose : pourquoi, comment et quoi mis bout à bout. La personne le reprend
 * ensuite à l'étape 6 ; sa version prime dès qu'elle existe.
 */
export function visionAssemblee(atelier: AtelierVision): string {
  return [atelier.pourquoi, atelier.comment, atelier.quoi]
    .map((p) => p.trim())
    .filter(Boolean)
    .join('. ');
}

/** Le texte à afficher : celui de la personne, sinon l'assemblage. */
export function visionAffichee(atelier: AtelierVision): string {
  return atelier.vision.trim() || visionAssemblee(atelier);
}

/** Une étape est-elle remplie ? Sert à jalonner la progression. */
export function etapeRemplie(atelier: AtelierVision, etape: EtapeVision): boolean {
  switch (etape) {
    case 'sens':
      return Boolean(atelier.pourquoi.trim() || atelier.comment.trim() || atelier.quoi.trim());
    case 'cibles':
      return atelier.cibles.length > 0 || atelier.acteurs.length > 0;
    case 'probleme':
      return Boolean(atelier.probleme.trim());
    case 'projection':
      return Object.values(atelier.projection).some((v) => v.trim());
    case 'valeurs':
      return atelier.valeurs.some((v) => v.nom.trim());
    case 'vision':
      return Boolean(visionAffichee(atelier).trim());
    case 'objectifs':
      return atelier.objectifs.some((o) => o.intitule.trim());
    default:
      return false;
  }
}
