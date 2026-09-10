import type {
  PersonaEvaluation,
  PersonaScoreResult,
  ProductFitAnalysis,
  ProductFitProject,
} from './types';

/*
 * Paliers de lecture, sur l'échelle de 10 des réponses. Exportés pour que la
 * légende affichée à l'écran et le verdict calculé ici ne puissent pas diverger.
 */
/** À partir de 7/10 : les trois facteurs sont élevés, le besoin est net. */
export const SEUIL_FORT = 7;
/** À partir de 5/10 : le besoin existe mais un facteur reste faible. */
export const SEUIL_REEL = 5;
/** En dessous de 3/10 : personne n'est vraiment gêné. */
export const SEUIL_FAIBLE = 3;

/**
 * Note d'un profil de client : à quel point cette personne est gênée.
 *
 * Trois questions notées de 1 à 10 — le problème la gêne-t-il, doit-elle le
 * régler vite, le rencontre-t-elle souvent. On les multiplie, conformément à
 * l'esprit de la méthode : un besoin ne tient que si les trois sont réunis,
 * donc un facteur faible doit faire chuter le résultat, ce qu'une moyenne
 * ordinaire ne ferait pas.
 *
 * La note affichée est la **moyenne géométrique** de ces trois notes, c'est-à-
 * dire la racine cubique de leur produit. C'est la façon usuelle de combiner
 * des critères multiplicatifs sans quitter leur échelle d'origine : trois
 * réponses à 5 donnent 5/10, trois réponses à 9 donnent 9/10, et un « 1 »
 * quelque part plombe l'ensemble (10, 10 et 1 donnent 4,6/10).
 *
 * Le produit brut, lui, n'était pas affichable : divisé par 100 pour tenir sur
 * 10, il donnait 1,2/10 à quelqu'un qui avait répondu 5 partout, et classait
 * 70 % des réponses possibles en « besoin à trouver ».
 *
 * `rawScore` (1 à 1000) reste le critère de classement entre profils : il est
 * strictement équivalent à la moyenne géométrique pour comparer, et se lit
 * mieux dans les explications.
 */
export function calculatePersonaScore(
  persona: PersonaEvaluation,
  isPriority: boolean = false
): PersonaScoreResult {
  const p = Math.max(1, Math.min(10, persona.problemIntensity || 1));
  const u = Math.max(1, Math.min(10, persona.urgency || 1));
  const f = Math.max(1, Math.min(10, persona.frequency || 1));

  const rawScore = p * u * f;
  // Moyenne géométrique : on revient sur l'échelle 1-10 des réponses.
  const scoreOn10 = Math.round(Math.cbrt(rawScore) * 10) / 10;
  const normalizedScore = Math.round(scoreOn10 * 100) / 10; // même note, sur 100

  let maturityState: PersonaScoreResult['maturityState'] = 'modere';
  if (scoreOn10 >= SEUIL_FORT) maturityState = 'champion';
  else if (scoreOn10 >= SEUIL_REEL) maturityState = 'prometteur';
  else if (scoreOn10 >= SEUIL_FAIBLE) maturityState = 'modere';
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

  if (globalScoreOn10 >= SEUIL_FORT) {
    verdictLabel = 'Le besoin est fort';
    verdictDescription =
      `${priorityPersona.personaName} a un problème important, urgent et fréquent. ` +
      `C'est très bon signe : allez lui parler pour le confirmer sur le terrain.`;
    verdictTone = 'success';
  } else if (globalScoreOn10 >= SEUIL_REEL) {
    verdictLabel = 'Le besoin est réel';
    verdictDescription =
      `Le besoin existe, mais il n'est pas encore assez fort pour qu'on achète sans hésiter. ` +
      `Cherchez le moment précis où le problème devient vraiment pénible.`;
    verdictTone = 'info';
  } else if (globalScoreOn10 >= SEUIL_FAIBLE) {
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

  if (priorityPersona.scoreOn10 >= SEUIL_FORT) {
    strengths.push(
      `${priorityPersona.personaName} est nettement la plus gênée des trois. Vous savez par qui commencer.`
    );
  }
  if (activePersonas.length > 1) {
    const secondBest = personasResults.filter((p) => !p.isPriorityTarget).sort((a, b) => b.rawScore - a.rawScore)[0];
    if (secondBest && secondBest.scoreOn10 >= SEUIL_REEL) {
      strengths.push(
        `${secondBest.personaName} pourrait devenir votre second marché, une fois le premier convaincu.`
      );
    }
  }
  if (activePersonas.some((p) => (p.urgency || 1) >= 8)) {
    strengths.push(`Au moins une personne veut régler ce problème tout de suite. C'est ce qui déclenche un achat rapide.`);
  }

  if (personasResults.every((p) => p.scoreOn10 < SEUIL_FAIBLE)) {
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
