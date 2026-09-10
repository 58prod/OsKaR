import type { PresetCase } from './types';

/**
 * Exemples prêts à charger, pour comprendre l'outil sans rien saisir.
 *
 * Trois produits que tout le monde connaît, choisis pour montrer trois
 * résultats différents : un besoin fort, un besoin réel mais à préciser, et un
 * produit sympathique dont personne n'a vraiment besoin. En les parcourant, on
 * comprend ce que mesure l'outil sans avoir à lire une explication.
 */
export const PRESET_CASES: PresetCase[] = [
  {
    id: 'facturation',
    name: 'Facturation 🧾',
    tagline: 'Un besoin fort',
    description:
      "Une application qui prépare les factures des indépendants en deux clics, à partir des heures travaillées.",
    project: {
      projectName: 'Ma facturation',
      pitch: 'Créer et envoyer ses factures en deux clics, sans tableur ni comptable.',
      sector: 'Outils pour indépendants',
      personas: [
        {
          id: 'facturation-p1',
          name: 'Léa, 34 ans',
          role: 'Graphiste indépendante, une dizaine de clients',
          description:
            "Elle facture chaque mois plusieurs clients et y passe ses dimanches, avec la crainte permanente d'un oubli.",
          problemIntensity: 9,
          urgency: 9,
          frequency: 9,
          keyPainPoint: 'Elle passe un dimanche par mois sur ses factures et oublie parfois des relances.',
          alternativeSolution: 'Un tableur et un modèle Word recopié à chaque fois.',
        },
        {
          id: 'facturation-p2',
          name: 'Marc, 52 ans',
          role: 'Plombier, quelques devis par semaine',
          description:
            "Il rédige ses devis à la main le soir. C'est fastidieux, mais il a ses habitudes et cela lui convient.",
          problemIntensity: 6,
          urgency: 5,
          frequency: 5,
          keyPainPoint: 'Il perd du temps le soir à recopier ses devis.',
          alternativeSolution: 'Un carnet et une calculatrice.',
        },
        {
          id: 'facturation-p3',
          name: 'Chloé, 28 ans',
          role: 'Salariée, vend ses créations le week-end',
          description:
            "Elle établit trois ou quatre factures par an. Le sujet ne l'occupe pas beaucoup.",
          problemIntensity: 4,
          urgency: 2,
          frequency: 3,
          keyPainPoint: "Elle ne sait jamais quelles mentions faire figurer sur une facture.",
          alternativeSolution: 'Un modèle trouvé en ligne.',
        },
      ],
    },
  },
  {
    id: 'covoiturage',
    name: 'Covoiturage 🚗',
    tagline: 'Un besoin réel, à préciser',
    description:
      "Une application pour partager ses trajets domicile-travail entre collègues d'une même zone d'activité.",
    project: {
      projectName: 'Trajets partagés',
      pitch: 'Partager ses trajets domicile-travail avec des collègues qui font la même route.',
      sector: 'Mobilité du quotidien',
      personas: [
        {
          id: 'covoiturage-p1',
          name: 'Julien, 29 ans',
          role: '45 minutes de route matin et soir',
          description:
            "Il fait le trajet seul chaque jour et voit le carburant peser lourd sur son budget.",
          problemIntensity: 8,
          urgency: 6,
          frequency: 6,
          keyPainPoint: 'Le carburant lui coûte 200 € par mois pour aller travailler.',
          alternativeSolution: 'Il y va seul en voiture, faute de mieux.',
        },
        {
          id: 'covoiturage-p2',
          name: 'Amina, 45 ans',
          role: 'Sans voiture, mal desservie par le bus',
          description:
            "Elle dépend des horaires de bus et arrive parfois en retard, mais elle a fini par s'organiser.",
          problemIntensity: 7,
          urgency: 5,
          frequency: 6,
          keyPainPoint: 'Deux bus et une correspondance pour vingt kilomètres.',
          alternativeSolution: 'Le bus, et un collègue qui la dépanne de temps en temps.',
        },
        {
          id: 'covoiturage-p3',
          name: 'Paul, 38 ans',
          role: 'Aime conduire seul le matin',
          description:
            "Il apprécie ce moment à lui et n'a aucune envie de le partager, même si le trajet est long.",
          problemIntensity: 3,
          urgency: 2,
          frequency: 8,
          keyPainPoint: 'Aucun, il tient à son moment de calme.',
          alternativeSolution: 'Sa voiture, et la radio.',
        },
      ],
    },
  },
  {
    id: 'recettes',
    name: 'Recettes 🥗',
    tagline: 'Sympathique, mais pas indispensable',
    description:
      "Une application qui propose des recettes à partir de ce qu'il reste dans le réfrigérateur.",
    project: {
      projectName: 'Que faire à manger ?',
      pitch: "Proposer une recette avec ce qu'il reste dans le frigo, pour éviter de jeter.",
      sector: 'Cuisine du quotidien',
      personas: [
        {
          id: 'recettes-p1',
          name: 'Camille, 31 ans',
          role: 'Cuisine tous les soirs après le travail',
          description:
            "Elle manque d'idées en fin de semaine et jette parfois des légumes oubliés, sans que cela lui gâche la vie.",
          problemIntensity: 5,
          urgency: 3,
          frequency: 6,
          keyPainPoint: "Elle ne sait pas quoi faire à manger et finit par commander.",
          alternativeSolution: 'Une recherche rapide sur internet.',
        },
        {
          id: 'recettes-p2',
          name: 'Hugo, 24 ans',
          role: 'Étudiant, petit budget',
          description:
            "Il mange souvent la même chose. Cela lui convient, même s'il aimerait varier.",
          problemIntensity: 4,
          urgency: 3,
          frequency: 5,
          keyPainPoint: 'Des pâtes, encore des pâtes.',
          alternativeSolution: 'Des vidéos de cuisine, regardées rarement.',
        },
        {
          id: 'recettes-p3',
          name: 'Martine, 60 ans',
          role: 'Cuisine depuis toujours',
          description: "Elle sait quoi faire avec un fond de frigo et n'a besoin de personne.",
          problemIntensity: 2,
          urgency: 1,
          frequency: 3,
          keyPainPoint: 'Aucun.',
          alternativeSolution: 'Son expérience et ses livres de cuisine.',
        },
      ],
    },
  },
];

export const EMPTY_PROJECT: PresetCase['project'] = {
  projectName: '',
  pitch: '',
  sector: '',
  personas: [
    {
      id: 'custom-p1',
      name: '',
      role: '',
      description: '',
      problemIntensity: 5,
      urgency: 5,
      frequency: 5,
      keyPainPoint: '',
      alternativeSolution: '',
    },
    {
      id: 'custom-p2',
      name: '',
      role: '',
      description: '',
      problemIntensity: 5,
      urgency: 5,
      frequency: 5,
      keyPainPoint: '',
      alternativeSolution: '',
    },
    {
      id: 'custom-p3',
      name: '',
      role: '',
      description: '',
      problemIntensity: 5,
      urgency: 5,
      frequency: 5,
      keyPainPoint: '',
      alternativeSolution: '',
    },
  ],
};
