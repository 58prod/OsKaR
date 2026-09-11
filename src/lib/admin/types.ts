import type { PilierCoach } from '@/lib/coachs/candidature';

/*
 * Ce que l'administration manipule, tel que les fonctions `admin_*` de la
 * migration 20260911_administration le renvoient (après conversion des dates).
 */

export type PilierAdmin = 'vision' | 'fit' | 'finance' | 'okr' | 'team';

/** Les 5 piliers, dans l'ordre des pastilles de la maquette. */
export const PILIERS_ADMIN: { id: PilierAdmin; nom: string }[] = [
  { id: 'vision', nom: 'Vision' },
  { id: 'fit', nom: 'Market Fit' },
  { id: 'finance', nom: 'Finance' },
  { id: 'okr', nom: 'OKR' },
  { id: 'team', nom: 'Team' },
];

export interface CompteAdmin {
  id: string;
  email: string;
  nom: string | null;
  entreprise: string | null;
  /** Domaine d'activité choisi (profil d'entreprise). */
  activite: string | null;
  creeLe: Date;
  derniereConnexion: Date | null;
  plan: string | null;
  statut: string | null;
  /** Début du jour qui suit la fin de la formule, heure de Paris. */
  expireLe: Date | null;
  offerte: boolean;
  motif: string | null;
  stripe: boolean;
  demo: boolean;
  /** Ateliers commencés, pilier par pilier. */
  ateliers: Record<PilierAdmin, boolean>;
  nbBilans: number;
}

export type TypeBilanAdmin = 'organisation' | 'produit';

export interface BilanAdmin {
  id: string;
  creeLe: Date;
  email: string | null;
  type: TypeBilanAdmin;
  /** Note sur 10, pour les deux types de bilans. */
  note: number | null;
  accepteRecontact: boolean;
  /** Fait en étant connecté. */
  aUnCompte: boolean;
  /** Fait connecté, ou un compte existe depuis avec le même email. */
  compteExiste: boolean;
}

export type StatutCandidature = 'nouvelle' | 'contactee' | 'validee' | 'refusee';

export const STATUTS_CANDIDATURE: { id: StatutCandidature; libelle: string; pluriel: string }[] = [
  { id: 'nouvelle', libelle: 'Nouvelle', pluriel: 'Nouvelles' },
  { id: 'contactee', libelle: 'Contactée', pluriel: 'Contactées' },
  { id: 'validee', libelle: 'Validée', pluriel: 'Validées' },
  { id: 'refusee', libelle: 'Refusée', pluriel: 'Refusées' },
];

export interface CandidatureAdmin {
  id: string;
  prenom: string;
  nom: string;
  email: string;
  zone: string | null;
  structure: string | null;
  site: string | null;
  piliers: PilierCoach[];
  labelRpr: boolean;
  approche: string | null;
  statut: StatutCandidature;
  notes: string | null;
  creeLe: Date;
  traiteeLe: Date | null;
}

export interface BilanDeLaFiche {
  id: string;
  type: TypeBilanAdmin;
  creeLe: Date;
  note: number | null;
}

/** Le détail d'un compte, ouvert dans le volet latéral. */
export interface FicheCompte {
  vision: unknown | null;
  fit: unknown | null;
  finance: unknown | null;
  team: unknown | null;
  okr: { ambitions: number; objectifs: number; actions: number };
  bilans: BilanDeLaFiche[];
}
