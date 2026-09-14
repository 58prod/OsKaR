import type { PersonaEvaluation, ProductFitProject } from './types';

/*
 * Relit, côté serveur, le projet « Potentiel Produit » envoyé par le
 * navigateur. La route d'envoi de la synthèse est publique : on ne garde que
 * les champs attendus, bornés, et c'est le serveur qui recalcule l'analyse
 * avec `calculateProductFitAnalysis`.
 */

export const MAX_PROFILS = 3;

export const LONGUEURS_MAX_PROJET = {
  projectName: 120,
  pitch: 1000,
  sector: 80,
  id: 40,
  name: 120,
  role: 160,
  description: 800,
  keyPainPoint: 600,
  alternativeSolution: 600,
} as const;

function texte(v: unknown, cle: keyof typeof LONGUEURS_MAX_PROJET): string {
  return typeof v === 'string' ? v.slice(0, LONGUEURS_MAX_PROJET[cle]) : '';
}

/** Une note de 1 à 10 ; tout le reste vaut 1, comme dans le calcul. */
function note(v: unknown): number {
  return typeof v === 'number' && Number.isFinite(v) ? Math.max(1, Math.min(10, v)) : 1;
}

function profilDuCorps(brut: Record<string, unknown>, rang: number): PersonaEvaluation {
  return {
    id: texte(brut.id, 'id') || `profil-${rang + 1}`,
    name: texte(brut.name, 'name'),
    role: texte(brut.role, 'role'),
    description: texte(brut.description, 'description'),
    problemIntensity: note(brut.problemIntensity),
    urgency: note(brut.urgency),
    frequency: note(brut.frequency),
    keyPainPoint: texte(brut.keyPainPoint, 'keyPainPoint'),
    alternativeSolution: texte(brut.alternativeSolution, 'alternativeSolution'),
  };
}

export function projetDuCorps(valeur: unknown): ProductFitProject | null {
  if (!valeur || typeof valeur !== 'object') return null;
  const brut = valeur as Record<string, unknown>;
  const profils = Array.isArray(brut.personas) ? brut.personas.slice(0, MAX_PROFILS) : [];
  return {
    projectName: texte(brut.projectName, 'projectName'),
    pitch: texte(brut.pitch, 'pitch'),
    sector: texte(brut.sector, 'sector'),
    personas: profils
      .filter((p): p is Record<string, unknown> => Boolean(p) && typeof p === 'object')
      .map(profilDuCorps),
  };
}
