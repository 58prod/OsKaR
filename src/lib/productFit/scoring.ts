import type {
  PersonaEvaluation,
  PersonaScoreResult,
  ProductFitAnalysis,
  ProductFitProject,
} from './types';

/**
 * Phase 1 — Scoring basé uniquement sur P × U × F (évaluation du problème)
 *
 * La formule : Bon produit = max (Problème × Urgence × Fréquence)
 * Chaque facteur est noté de 1 à 10.
 * Score brut : 1 à 1000. Normalisé sur 100.
 */
export function calculatePersonaScore(
  persona: PersonaEvaluation,
  isPriority: boolean = false
): PersonaScoreResult {
  const p = Math.max(1, Math.min(10, persona.problemIntensity || 1));
  const u = Math.max(1, Math.min(10, persona.urgency || 1));
  const f = Math.max(1, Math.min(10, persona.frequency || 1));

  const rawScore = p * u * f;
  const normalizedScore = Math.round((rawScore / 1000) * 1000) / 10; // 0.1 à 100.0
  const scoreOn10 = Math.round((normalizedScore / 10) * 10) / 10;

  let maturityState: PersonaScoreResult['maturityState'] = 'modere';
  if (normalizedScore >= 65) maturityState = 'champion';
  else if (normalizedScore >= 40) maturityState = 'prometteur';
  else if (normalizedScore >= 20) maturityState = 'modere';
  else maturityState = 'critique';

  const priorityExplanation = isPriority
    ? `Ce persona présente la douleur la plus intense (Problème ${p}/10 × Urgence ${u}/10 × Fréquence ${f}/10 = ${rawScore} pts). C'est votre cible prioritaire à interviewer et à convaincre en premier.`
    : `Segment secondaire à adresser dans un second temps, une fois la traction validée sur la cible prioritaire.`;

  return {
    personaId: persona.id,
    personaName: persona.name || 'Persona sans nom',
    role: persona.role || 'Rôle non spécifié',
    rawScore,
    normalizedScore,
    scoreOn10,
    maturityState,
    isPriorityTarget: isPriority,
    priorityExplanation,
  };
}

/**
 * Analyse complète de Phase 1 : identification de la cible prioritaire
 * et production des recommandations de ciblage & prochaines étapes.
 */
export function calculateProductFitAnalysis(project: ProductFitProject): ProductFitAnalysis {
  const activePersonas = (project.personas || []).filter((p) => p && (p.name || p.role));

  if (activePersonas.length === 0) {
    return {
      globalPotentialScore: 0,
      globalScoreOn10: 0,
      verdictLabel: 'En attente de saisie',
      verdictDescription: 'Renseignez au moins un persona pour obtenir votre indice de potentiel.',
      verdictTone: 'info',
      priorityPersona: null,
      personasResults: [],
      strengths: [],
      vulnerabilities: [],
      actionRecommendations: [],
    };
  }

  // 1. Calcul du score P × U × F pour chaque persona
  const rawScores = activePersonas.map((p) => ({
    id: p.id,
    raw: (p.problemIntensity || 1) * (p.urgency || 1) * (p.frequency || 1),
  }));

  const maxRaw = Math.max(...rawScores.map((s) => s.raw));
  const bestPersonaId = rawScores.find((s) => s.raw === maxRaw)?.id;

  const personasResults: PersonaScoreResult[] = activePersonas.map((p) =>
    calculatePersonaScore(p, p.id === bestPersonaId)
  );

  const priorityPersona = personasResults.find((r) => r.isPriorityTarget) || personasResults[0];

  // 2. Le score global = score de la meilleure cible (logique P×U×F)
  // Un bon produit n'a besoin que d'une cible avec une douleur intense pour décoller.
  const globalPotentialScore = priorityPersona.normalizedScore;
  const globalScoreOn10 = priorityPersona.scoreOn10;

  // 3. Verdict
  let verdictLabel = '';
  let verdictDescription = '';
  let verdictTone: ProductFitAnalysis['verdictTone'] = 'info';

  if (globalPotentialScore >= 65) {
    verdictLabel = 'Douleur Forte & Traction Potentielle Élevée 🚀';
    verdictDescription =
      `Votre cible prioritaire "${priorityPersona.personaName}" souffre d'un problème intense, urgent et fréquent. ` +
      `Les conditions de traction initiale sont réunies. Passez vite à la validation terrain.`;
    verdictTone = 'success';
  } else if (globalPotentialScore >= 40) {
    verdictLabel = 'Potentiel Réel mais Douleur à Préciser ⚡';
    verdictDescription =
      `Le besoin existe, mais la combinaison Problème × Urgence × Fréquence n'est pas encore assez forte pour ` +
      `déclencher une adoption spontanée. Approfondissez vos interviews pour trouver l'angle le plus douloureux.`;
    verdictTone = 'info';
  } else if (globalPotentialScore >= 20) {
    verdictLabel = 'Risque de "Nice-to-Have" ⚠️';
    verdictDescription =
      `Aucun de vos personas ne ressent une douleur suffisamment vive ou urgente. ` +
      `Vous risquez de construire quelque chose que les gens trouvent sympa mais qu'ils n'adoptent pas. ` +
      `Revoyez votre angle de ciblage ou la formulation du problème.`;
    verdictTone = 'warning';
  } else {
    verdictLabel = 'Niveau de Risque Élevé 🛑';
    verdictDescription =
      `Les scores P × U × F sont très faibles sur l'ensemble des cibles testées. ` +
      `Il est urgent de requalifier le problème ou d'explorer un segment plus en souffrance.`;
    verdictTone = 'danger';
  }

  // 4. Forces et vulnérabilités
  const strengths: string[] = [];
  const vulnerabilities: string[] = [];

  if (priorityPersona.normalizedScore >= 60) {
    strengths.push(
      `Cœur de cible très net : "${priorityPersona.personaName}" cumule une douleur forte sur les 3 facteurs (${priorityPersona.rawScore}/1000 pts).`
    );
  }
  if (activePersonas.length > 1) {
    const secondBest = personasResults.filter((p) => !p.isPriorityTarget).sort((a, b) => b.rawScore - a.rawScore)[0];
    if (secondBest && secondBest.normalizedScore >= 30) {
      strengths.push(
        `Segment de croissance identifié : "${secondBest.personaName}" offre un potentiel d'expansion à moyen terme (${secondBest.rawScore}/1000 pts).`
      );
    }
  }
  if (activePersonas.some((p) => (p.urgency || 1) >= 8)) {
    strengths.push(`Urgence forte détectée : au moins un persona ressent une pression temporelle élevée — facteur clé de conversion rapide.`);
  }

  if (personasResults.every((p) => p.normalizedScore < 30)) {
    vulnerabilities.push(
      `Douleur globale trop faible : aucune cible ne dépasse 30/100 sur la formule P × U × F. Risque fort de "nice-to-have".`
    );
  }
  if (priorityPersona && (activePersonas.find((p) => p.id === priorityPersona.personaId)?.urgency || 0) < 5) {
    vulnerabilities.push(
      `Urgence faible pour la cible prioritaire : le persona peut attendre, ce qui allonge les cycles de vente et ralentit la traction.`
    );
  }
  if (priorityPersona && (activePersonas.find((p) => p.id === priorityPersona.personaId)?.frequency || 0) < 4) {
    vulnerabilities.push(
      `Fréquence basse : le problème est rare. Un produit à usage peu fréquent est difficile à ancrer dans la routine — pensez à un modèle d'abonnement ou à un effet de réseau.`
    );
  }

  // 5. Recommandations Phase 1 : ciblage, positionnement et prochaines étapes
  const actionRecommendations: ProductFitAnalysis['actionRecommendations'] = [];

  actionRecommendations.push({
    category: 'Cible & Positionnement',
    title: `Concentrez 100% de vos efforts initiaux sur "${priorityPersona.personaName}"`,
    advice: `Ne cherchez pas à plaire à tout le monde dès le début. Adressez exclusivement ce persona dans vos messages, votre landing page et vos premières conversations commerciales.`,
    priority: 'Haute',
  });

  const priorityPersonaData = activePersonas.find((p) => p.id === priorityPersona.personaId);
  if (priorityPersonaData && (priorityPersonaData.urgency || 1) < 7) {
    actionRecommendations.push({
      category: 'Angle Marché',
      title: `Retravailler l'angle d'urgence dans votre message`,
      advice: `L'urgence perçue est modérée (${priorityPersonaData.urgency}/10). Cherchez le déclencheur d'urgence : un événement de vie, une réglementation imminente, une fenêtre de marché ? C'est lui qui provoque l'achat immédiat plutôt que "je le ferai plus tard".`,
      priority: 'Haute',
    });
  }

  actionRecommendations.push({
    category: 'Prochaine Étape',
    title: `Conduire 10 interviews de découverte avec "${priorityPersona.personaName}"`,
    advice: `Avant de coder ou de maquetter quoi que ce soit, réalisez 10 entretiens terrain avec ce persona. Objectif : valider que vous avez bien compris le problème et découvrir des nuances que vous n'avez pas anticipées.`,
    priority: 'Haute',
  });

  actionRecommendations.push({
    category: 'Prochaine Étape',
    title: `Créer une landing page "smoke test" pour mesurer l'intention réelle`,
    advice: `Une page simple décrivant le bénéfice principal et un bouton "Je suis intéressé(e)" vous donnera votre premier signal de traction réelle — sans avoir à développer le produit.`,
    priority: 'Moyenne',
  });

  return {
    globalPotentialScore,
    globalScoreOn10,
    verdictLabel,
    verdictDescription,
    verdictTone,
    priorityPersona,
    personasResults,
    strengths,
    vulnerabilities,
    actionRecommendations,
  };
}
