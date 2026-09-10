import type { Pillar, PillarId, PillarAdviceMap } from './types';

/** Les 5 piliers OSKAR avec leurs critères objectifs (porté de bilan.html) */
export const PILLARS: Pillar[] = [
  {
    id: 'vision',
    label: 'Vision',
    module: 'OSKAR Vision',
    color: '#1e2d7d',
    desc: 'Clarté de la direction stratégique et capacité à la communiquer.',
    q: [
      'Nous savons clairement pourquoi notre entreprise existe.',
      "Notre vision à 1–3 ans est définie et comprise par l'équipe.",
      'Nos décisions stratégiques sont alignées avec cette vision.',
    ],
  },
  {
    id: 'fit',
    label: 'Market Fit',
    module: 'OSKAR Market Fit',
    color: '#2563eb',
    desc: 'Adéquation entre la solution proposée et les besoins réels du marché.',
    q: [
      'Nous avons identifié un vrai problème client important.',
      'Nos clients expriment régulièrement de la satisfaction ou recommandent notre offre.',
      'Nous savons précisément ce qui nous différencie de la concurrence.',
    ],
  },
  {
    id: 'finance',
    label: 'Finance',
    module: 'OSKAR Finance',
    color: '#00a890',
    desc: 'Solidité et lisibilité du modèle économique et de la trésorerie.',
    q: [
      'Nous connaissons clairement nos revenus, marges et coûts.',
      "Notre modèle économique est viable ou en voie claire de l'être.",
      'Nous avons une visibilité suffisante sur notre trésorerie.',
    ],
  },
  {
    id: 'okr',
    label: 'OKR',
    module: 'OSKAR OKR',
    color: '#7c3aed',
    desc: 'Alignement des objectifs et mesure des résultats clés.',
    q: [
      'Nous avons des objectifs clairs et mesurables.',
      'Les priorités sont connues de tous.',
      "Nous suivons régulièrement l'avancement des actions et résultats.",
    ],
  },
  {
    id: 'team',
    label: 'Team',
    module: 'OSKAR Team',
    color: '#0891b2',
    desc: "Engagement, cohésion et performance collective de l'équipe.",
    q: [
      'Les rôles et responsabilités sont clairement définis et bien compris.',
      'La communication et la collaboration sont bonnes.',
      "L'équipe est motivée et engagée dans le projet.",
    ],
  },
];

/** Libellés courts par pilier pour la synthèse. */
export const PILLAR_SHORT_LABEL: Record<PillarId, string> = {
  vision: 'Vision',
  fit: 'Market Fit',
  finance: 'Finance',
  okr: 'OKR',
  team: 'Team',
};

/** Messages de recommandation par pilier et par niveau (porté de AN_PILIER) */
export const AN_PILIER: Record<PillarId, PillarAdviceMap> = {
  vision: {
    f: { prio: 'Clarifier votre vision est la priorité n°1.', detail: 'Sans cap défini, toutes les décisions stratégiques restent fragiles.', module: 'vision' },
    c: { prio: "Votre vision est en cours de construction — continuez à l'affiner.", detail: 'Formaliser un cap à 1–3 ans donnera une direction claire à toutes vos actions.', module: 'vision' },
    s: { prio: "Votre vision est un vrai point d'appui.", detail: 'Cap défini, partagé et aligné avec les décisions — continuez sur cette base.', module: null },
  },
  fit: {
    f: { prio: 'Valider votre adéquation marché est urgent.', detail: 'Sans traction avérée, toute accélération reste risquée.', module: null },
    c: { prio: 'Votre Market Fit se construit — accélérez les tests.', detail: "Itérer rapidement sur l'offre permettra de trouver la bonne adéquation.", module: null },
    s: { prio: 'Votre Market Fit est un atout solide.', detail: "L'offre rencontre son marché — capitaliser sur cette traction.", module: null },
  },
  finance: {
    f: { prio: 'Stabiliser votre pilotage financier est essentiel.', detail: 'La visibilité sur les revenus, marges et trésorerie conditionne toutes les décisions.', module: null },
    c: { prio: 'Votre pilotage financier progresse — consolidez-le.', detail: 'Mettre en place des indicateurs clés réguliers renforcera la solidité du modèle.', module: null },
    s: { prio: 'Votre solidité financière est un atout majeur.', detail: 'Modèle viable et pilotage en place — vous pouvez investir sereinement.', module: null },
  },
  okr: {
    f: { prio: 'Structurer votre exécution et vos priorités est clé.', detail: "Sans OKR ni rituels d'alignement, l'énergie se disperse.", module: null },
    c: { prio: 'Votre exécution se structure — incarnez-la davantage.', detail: 'Des rituels réguliers et des objectifs mesurables renforceront l\'alignement.', module: null },
    s: { prio: 'Votre exécution est un vrai moteur.', detail: 'Objectifs clairs, priorités partagées et rituels en place — solide.', module: null },
  },
  team: {
    f: { prio: "Renforcer la cohésion et l'alignement de l'équipe est prioritaire.", detail: 'Rôles flous et engagement faible freinent tous les autres piliers.', module: null },
    c: { prio: 'Votre équipe monte en puissance — continuez à l\'investir.', detail: 'Communication et engagement progressent — maintenir la dynamique.', module: null },
    s: { prio: 'Votre équipe est un atout fort.', detail: 'Rôles clairs, bonne collaboration et équipe engagée — une base solide.', module: null },
  },
};
