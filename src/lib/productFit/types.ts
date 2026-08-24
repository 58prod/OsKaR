/**
 * Types pour le Bilan « Quel potentiel pour mon produit ? »
 * (OsKaR Fit - Potentiel Produit)
 *
 * Évaluation du problème et de la cible prioritaire selon la formule :
 *   Bon produit = max (Problème × Urgence × Fréquence)
 */

export interface PersonaEvaluation {
  id: string;
  name: string;
  role: string;
  description: string;

  // Facteurs d'intensité de la douleur / du besoin (notés de 1 à 10)
  problemIntensity: number; // Gravité : à quel point le problème est douloureux/bloquant
  urgency: number;          // Urgence : doit-il/elle résoudre ce problème maintenant ou peut-il attendre ?
  frequency: number;        // Fréquence : à quelle cadence rencontre-t-il cette difficulté ?

  // Contexte qualitatif (optionnel)
  keyPainPoint?: string;
  alternativeSolution?: string;
}

export interface ProductFitProject {
  projectName: string;
  pitch: string;
  sector?: string;
  personas: PersonaEvaluation[];
}

export interface PersonaScoreResult {
  personaId: string;
  personaName: string;
  role: string;
  rawScore: number;        // P × U × F (min 1, max 1000)
  normalizedScore: number; // rawScore / 1000 × 100 → score sur 100
  scoreOn10: number;       // score sur 10, arrondi à 1 décimale
  maturityState: 'critique' | 'modere' | 'prometteur' | 'champion';
  isPriorityTarget: boolean;
  priorityExplanation: string;
}

export interface ProductFitAnalysis {
  globalPotentialScore: number; // sur 100
  globalScoreOn10: number;      // sur 10
  verdictLabel: string;
  verdictDescription: string;
  verdictTone: 'success' | 'warning' | 'info' | 'danger';

  priorityPersona: PersonaScoreResult | null;
  personasResults: PersonaScoreResult[];

  strengths: string[];
  vulnerabilities: string[];
  actionRecommendations: {
    category: 'Cible & Positionnement' | 'Angle Marché' | 'Prochaine Étape';
    title: string;
    advice: string;
    priority: 'Haute' | 'Moyenne' | 'Conseil';
  }[];
}

export interface PresetCase {
  id: string;
  name: string;
  tagline: string;
  description: string;
  project: ProductFitProject;
}
