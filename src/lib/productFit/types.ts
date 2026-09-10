/**
 * Types du bilan « Potentiel Produit » (pilier OSKAR Market Fit).
 *
 * On décrit trois personnes à qui le produit pourrait servir, on note à quel
 * point chacune est gênée par le problème, et on retient la plus gênée : c'est
 * elle qui achètera la première.
 */

export interface PersonaEvaluation {
  id: string;
  name: string;
  role: string;
  description: string;

  // Les trois questions, notées de 1 à 10
  problemIntensity: number; // Le problème la gêne-t-il un peu, ou énormément ?
  urgency: number;          // Doit-elle le régler tout de suite, ou cela peut-il attendre ?
  frequency: number;        // Le rencontre-t-elle rarement, ou tous les jours ?

  // Pour aller plus loin (facultatif)
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
  rawScore: number;        // les trois notes multipliées (de 1 à 1000)
  normalizedScore: number; // la même chose ramenée sur 100
  scoreOn10: number;       // et sur 10, à une décimale — c'est ce qui s'affiche
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
    category: 'Par où commencer' | 'Votre message' | 'Prochaine étape';
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
