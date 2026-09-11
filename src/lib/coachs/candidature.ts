/*
 * Candidature à l'annuaire des coachs — formulaire de `plateforme/coachs.html`.
 * Règles pures, sans React ni Supabase, pour être testées à part.
 */

export type PilierCoach = 'vision' | 'fit' | 'finance' | 'okr' | 'team';

/** Les cases « Piliers sur lesquels vous accompagnez », dans l'ordre de la maquette. */
export const PILIERS_COACH: { id: PilierCoach; libelle: string }[] = [
  { id: 'vision', libelle: 'Vision' },
  { id: 'fit', libelle: 'Fit' },
  { id: 'finance', libelle: 'Finance' },
  { id: 'okr', libelle: 'OKR' },
  { id: 'team', libelle: 'Team' },
];

export interface Candidature {
  prenom: string;
  nom: string;
  email: string;
  zone: string;
  structure: string;
  site: string;
  piliers: PilierCoach[];
  labelRpr: boolean;
  approche: string;
}

export const CANDIDATURE_VIDE: Candidature = {
  prenom: '',
  nom: '',
  email: '',
  zone: '',
  structure: '',
  site: '',
  piliers: [],
  labelRpr: false,
  approche: '',
};

/** Longueurs maximales, identiques aux contraintes de la table `candidatures_coachs`. */
export const LONGUEURS_MAX = {
  prenom: 100,
  nom: 100,
  email: 254,
  zone: 200,
  structure: 200,
  site: 300,
  approche: 3000,
} as const;

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Premier problème rencontré, formulé pour la personne, ou null si la
 * candidature peut partir. Prénom, nom et email suffisent : le reste se
 * complète lors de l'échange de validation de la fiche.
 */
export function problemeCandidature(c: Candidature): string | null {
  if (!c.prenom.trim()) return 'Indiquez votre prénom.';
  if (!c.nom.trim()) return 'Indiquez votre nom.';
  if (!c.email.trim()) return 'Indiquez votre email professionnel.';
  if (!EMAIL.test(c.email.trim())) return 'Cette adresse email ne semble pas valide.';
  for (const [champ, max] of Object.entries(LONGUEURS_MAX) as [keyof typeof LONGUEURS_MAX, number][]) {
    if (c[champ].trim().length > max) return `Le champ est trop long (${max} caractères au plus).`;
  }
  return null;
}

/** Bascule un pilier dans la liste, en gardant l'ordre de la maquette. */
export function basculerPilier(piliers: PilierCoach[], pilier: PilierCoach): PilierCoach[] {
  const suivants = piliers.includes(pilier) ? piliers.filter((p) => p !== pilier) : [...piliers, pilier];
  return PILIERS_COACH.map((p) => p.id).filter((id) => suivants.includes(id));
}
