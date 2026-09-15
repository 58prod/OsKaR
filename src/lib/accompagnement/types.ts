import type { BilanDeLaFiche, PilierAdmin } from '@/lib/admin/types';

/*
 * L'accompagnement : un coach référencé suit un dirigeant (migration
 * 20260915_accompagnements). Types tels que les fonctions de la base les
 * renvoient, dates converties.
 */

export type RoleAccompagnement = 'coach' | 'dirigeant';
export type StatutAccompagnement = 'en_attente' | 'actif';

/** Ce que le coach suit : les 5 piliers et les bilans. */
export type SujetSuivi = PilierAdmin | 'bilans';

/** Dernière modification de chaque pilier (et dernier bilan) ; null si jamais. */
export type ActivitePiliers = Record<SujetSuivi, Date | null>;

/** L'autre personne du lien, vue par le compte connecté. */
export interface Correspondant {
  /** Vide tant qu'un dirigeant invité n'a pas de compte. */
  id: string | null;
  nom: string | null;
  email: string;
  entreprise: string | null;
  /** Domaine d'activité du dirigeant (côté coach). */
  activite: string | null;
  /** Structure du coach (côté dirigeant). */
  structure: string | null;
}

export interface Accompagnement {
  id: string;
  /** Mon rôle dans ce lien. */
  role: RoleAccompagnement;
  statut: StatutAccompagnement;
  initiePar: RoleAccompagnement;
  /** Une invitation en attente que je dois accepter ou refuser. */
  aMoiDeRepondre: boolean;
  autre: Correspondant;
  /** Côté coach : ce dirigeant figure dans le résumé de 8 h. */
  resumeQuotidien: boolean;
  /** Côté coach : dernière ouverture de la fiche. */
  coachVuLe: Date | null;
  creeLe: Date;
  reponduLe: Date | null;
  /** Côté coach, lien actif seulement. */
  activite: ActivitePiliers | null;
}

export interface ProfilCoach {
  disponible: boolean;
  resumeQuotidien: boolean;
  structure: string | null;
  zone: string | null;
  piliers: string[];
  referenceLe: Date;
}

export interface OkrDirigeant {
  ambitions: { id: string; titre: string; description: string | null; annee: number; cible: number | null; unite: string | null }[];
  objectifs: { id: string; ambitionId: string | null; titre: string; description: string | null; trimestre: string; annee: number }[];
  resultats: { id: string; objectifId: string; titre: string; cible: number | null; actuel: number | null; unite: string | null; echeance: Date | null }[];
  actions: { id: string; resultatId: string | null; titre: string; statut: string; echeance: Date | null }[];
}

/** Tout ce qu'un dirigeant a saisi, tel que son coach le lit. */
export interface FicheDirigeant {
  accompagnementId: string;
  depuis: Date;
  /** Visite précédente du coach : ce qui a changé depuis est signalé. */
  vuPrecedemment: Date | null;
  resumeQuotidien: boolean;
  profil: { nom: string | null; email: string; entreprise: string | null; activite: string | null };
  activite: ActivitePiliers;
  vision: unknown | null;
  fit: unknown | null;
  finance: unknown | null;
  team: unknown | null;
  okr: OkrDirigeant;
  bilans: BilanDeLaFiche[];
}

/** Ce qu'un dirigeant a fait dans la journée (résumé de 8 h). */
export interface ActiviteJour {
  vision: boolean;
  fit: boolean;
  finance: boolean;
  team: boolean;
  /** Ambitions, objectifs, résultats clés et actions créés ou modifiés. */
  okr: number;
  /** Bilans enregistrés. */
  bilans: number;
}

export interface DirigeantDuResume {
  id: string;
  nom: string | null;
  email: string;
  entreprise: string | null;
  activite: ActiviteJour;
}

export interface ResumeCoach {
  coachId: string;
  coachEmail: string;
  coachNom: string | null;
  dirigeants: DirigeantDuResume[];
}
