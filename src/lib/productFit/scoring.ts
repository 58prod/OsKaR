import type {
  PersonaEvaluation,
  PersonaScoreResult,
  ProductFitAnalysis,
  ProductFitProject,
} from './types';

/**
 * Note d'un profil de client : à quel point cette personne est gênée.
 *
 * Trois questions notées de 1 à 10 — le problème la gêne-t-il, doit-elle le
 * régler vite, le rencontre-t-elle souvent — multipliées entre elles. Le
 * produit vaut par la personne la plus gênée, pas par la moyenne : c'est elle
 * qui achètera la première.
 *
 * Note brute de 1 à 1000, ramenée sur 100 puis sur 10 pour l'affichage.
 * Les textes ci-dessous s'adressent directement à l'utilisateur : pas de
 * jargon, on nomme les choses simplement.
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
    ? `C'est la personne la plus gênée des trois : le problème la gêne ${p}/10, elle doit le régler ${u}/10, elle le rencontre ${f}/10. Commencez par elle.`
    : `À garder pour plus tard, une fois votre premier client convaincu.`;

  return {
    personaId: persona.id,
    personaName: persona.name || 'Profil sans nom',
    role: persona.role || 'Situation non précisée',
    rawScore,
    normalizedScore,
    scoreOn10,
    maturityState,
    isPriorityTarget: isPriority,
    priorityExplanation,
  };
}

/**
 * Analyse complète : qui est le premier client à viser, et quoi faire ensuite.
 */
export function calculateProductFitAnalysis(project: ProductFitProject): ProductFitAnalysis {
  const activePersonas = (project.personas || []).filter((p) => p && (p.name || p.role));

  if (activePersonas.length === 0) {
    return {
      globalPotentialScore: 0,
      globalScoreOn10: 0,
      verdictLabel: 'À vous de jouer',
      verdictDescription: 'Décrivez au moins une personne à qui votre produit s\'adresse pour voir votre résultat.',
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

  // 2. La note du produit est celle de la personne la plus gênée.
  // Un produit démarre grâce à une personne très gênée, pas grâce à une moyenne.
  const globalPotentialScore = priorityPersona.normalizedScore;
  const globalScoreOn10 = priorityPersona.scoreOn10;

  // 3. Verdict
  let verdictLabel = '';
  let verdictDescription = '';
  let verdictTone: ProductFitAnalysis['verdictTone'] = 'info';

  if (globalPotentialScore >= 65) {
    verdictLabel = 'Le besoin est fort';
    verdictDescription =
      `${priorityPersona.personaName} a un problème important, urgent et fréquent. ` +
      `C'est très bon signe : allez lui parler pour le confirmer sur le terrain.`;
    verdictTone = 'success';
  } else if (globalPotentialScore >= 40) {
    verdictLabel = 'Le besoin est réel';
    verdictDescription =
      `Le besoin existe, mais il n'est pas encore assez fort pour qu'on achète sans hésiter. ` +
      `Cherchez le moment précis où le problème devient vraiment pénible.`;
    verdictTone = 'info';
  } else if (globalPotentialScore >= 20) {
    verdictLabel = 'Utile, mais pas indispensable';
    verdictDescription =
      `Personne n'est assez gêné pour changer ses habitudes. ` +
      `Le risque : un produit que l'on trouve sympathique mais que l'on n'achète pas. ` +
      `Revoyez à qui vous vous adressez.`;
    verdictTone = 'warning';
  } else {
    verdictLabel = 'Le besoin reste à trouver';
    verdictDescription =
      `Les trois profils sont peu gênés par ce problème. ` +
      `Cherchez des personnes qui en souffrent vraiment, ou reformulez le problème.`;
    verdictTone = 'danger';
  }

  // 4. Forces et vulnérabilités
  const strengths: string[] = [];
  const vulnerabilities: string[] = [];

  if (priorityPersona.normalizedScore >= 60) {
    strengths.push(
      `${priorityPersona.personaName} est nettement la plus gênée des trois. Vous savez par qui commencer.`
    );
  }
  if (activePersonas.length > 1) {
    const secondBest = personasResults.filter((p) => !p.isPriorityTarget).sort((a, b) => b.rawScore - a.rawScore)[0];
    if (secondBest && secondBest.normalizedScore >= 30) {
      strengths.push(
        `${secondBest.personaName} pourrait devenir votre second marché, une fois le premier convaincu.`
      );
    }
  }
  if (activePersonas.some((p) => (p.urgency || 1) >= 8)) {
    strengths.push(`Au moins une personne veut régler ce problème tout de suite. C'est ce qui déclenche un achat rapide.`);
  }

  if (personasResults.every((p) => p.normalizedScore < 30)) {
    vulnerabilities.push(
      `Aucun des trois profils n'est vraiment gêné. Un produit que l'on trouve sympathique se vend mal.`
    );
  }
  if (priorityPersona && (activePersonas.find((p) => p.id === priorityPersona.personaId)?.urgency || 0) < 5) {
    vulnerabilities.push(
      `${priorityPersona.personaName} peut attendre. Sans urgence, la décision d'achat traîne.`
    );
  }
  if (priorityPersona && (activePersonas.find((p) => p.id === priorityPersona.personaId)?.frequency || 0) < 4) {
    vulnerabilities.push(
      `Le problème est rare. Un produit qu'on utilise peu s'oublie vite : prévoyez une raison d'y revenir.`
    );
  }

  // 5. Quoi faire ensuite, dans l'ordre.
  const actionRecommendations: ProductFitAnalysis['actionRecommendations'] = [];

  actionRecommendations.push({
    category: 'Par où commencer',
    title: `Adressez-vous à ${priorityPersona.personaName}, et à elle seule`,
    advice: `Ne cherchez pas à plaire à tout le monde au début. Parlez d'elle, et à elle, sur votre site, dans vos messages et lors de vos premiers rendez-vous.`,
    priority: 'Haute',
  });

  const priorityPersonaData = activePersonas.find((p) => p.id === priorityPersona.personaId);
  if (priorityPersonaData && (priorityPersonaData.urgency || 1) < 7) {
    actionRecommendations.push({
      category: 'Votre message',
      title: `Trouvez ce qui rend le problème urgent`,
      advice: `L'urgence n'est que de ${priorityPersonaData.urgency}/10. Quel événement rend soudain le problème insupportable — un déménagement, une échéance, une nouvelle règle ? C'est ce déclic qui fait acheter maintenant plutôt que « plus tard ».`,
      priority: 'Haute',
    });
  }

  actionRecommendations.push({
    category: 'Prochaine étape',
    title: `Parlez à 10 personnes comme ${priorityPersona.personaName}`,
    advice: `Avant de créer quoi que ce soit, discutez avec dix personnes de ce profil. Vous saurez tout de suite si vous avez visé juste, et vous découvrirez ce que vous n'aviez pas imaginé.`,
    priority: 'Haute',
  });

  actionRecommendations.push({
    category: 'Prochaine étape',
    title: `Testez l'intérêt avec une page toute simple`,
    advice: `Une page qui explique ce que vous apportez, avec un bouton « Ça m'intéresse ». Le nombre de clics vous dira si le besoin est réel, sans avoir rien développé.`,
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
