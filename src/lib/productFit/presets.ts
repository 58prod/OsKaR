import type { PresetCase } from './types';

/**
 * Exemples prêts à charger, pour comprendre l'outil sans rien saisir.
 * Chacun décrit un produit et trois personnes à qui il pourrait servir.
 */
export const PRESET_CASES: PresetCase[] = [
  {
    id: 'eternity',
    name: 'Eternity \u23F3',
    tagline: 'Garder la mémoire des grands-parents',
    description:
      "Une application pour recueillir et transmettre les récits de vie des aînés, avant qu'il ne soit trop tard.",
    project: {
      projectName: 'Eternity',
      pitch:
        "Aider les familles à garder la mémoire de leurs proches, grâce à des questions audio et un livre souvenir créé automatiquement.",
      sector: 'Famille et transmission',
      personas: [
        {
          id: 'eternity-p1',
          name: 'Claire, 45 ans',
          role: 'Mère de famille, ses parents vieillissent',
          description:
            "Elle voit ses parents décliner et craint de perdre leur histoire, faute de temps pour poser les bonnes questions.",
          problemIntensity: 9,
          urgency: 8,
          frequency: 7,
          keyPainPoint: "Le temps passe et les souvenirs s'effacent.",
          alternativeSolution: "Des messages vocaux éparpillés et des albums photo incomplets.",
        },
        {
          id: 'eternity-p2',
          name: 'Jean, 75 ans',
          role: "Grand-père à la retraite",
          description:
            "Il veut laisser une trace à ses petits-enfants, mais la page blanche et la technique le freinent.",
          problemIntensity: 7,
          urgency: 4,
          frequency: 4,
          keyPainPoint: "Il ne sait pas par où commencer.",
          alternativeSolution: "Des cahiers commencés, jamais terminés.",
        },
        {
          id: 'eternity-p3',
          name: 'Marc, 55 ans',
          role: "Passionné d'histoire familiale",
          description:
            "Il collectionne les dates et les arbres généalogiques, et cherche des anecdotes qui donnent vie à ses recherches.",
          problemIntensity: 6,
          urgency: 4,
          frequency: 8,
          keyPainPoint: "Il a des dates, mais aucune voix ni anecdote.",
          alternativeSolution: "Des logiciels de généalogie austères.",
        },
      ],
    },
  },
  {
    id: 'etape',
    name: 'ETAPE \uD83E\uDDED',
    tagline: 'Changer de métier sans se perdre',
    description:
      "Un accompagnement pas à pas pour préparer sa reconversion et trouver sa voie sereinement.",
    project: {
      projectName: 'ETAPE',
      pitch:
        "Aider ceux qui veulent changer de métier à valider leur projet, lever leurs doutes et passer à l'action.",
      sector: 'Formation et reconversion',
      personas: [
        {
          id: 'etape-p1',
          name: 'Sophie, 38 ans',
          role: 'Responsable marketing, en poste mais lassée',
          description:
            "Elle ne trouve plus de sens à son travail, mais son salaire la retient.",
          problemIntensity: 9,
          urgency: 9,
          frequency: 8,
          keyPainPoint: "Peur du vide et absence de plan clair.",
          alternativeSolution: "Des bilans de compétences trop théoriques.",
        },
        {
          id: 'etape-p2',
          name: 'David, 47 ans',
          role: 'Ancien manager, en arrêt de travail',
          description:
            "Après un épuisement professionnel, il a besoin de reprendre confiance à son rythme.",
          problemIntensity: 10,
          urgency: 6,
          frequency: 6,
          keyPainPoint: "Il a perdu confiance et craint de rechuter.",
          alternativeSolution: "Un suivi psychologique et du coaching individuel.",
        },
        {
          id: 'etape-p3',
          name: 'Lucas, 25 ans',
          role: 'Premier emploi, déjà déçu',
          description:
            "Déçu par sa première expérience, il s'interroge sur la suite.",
          problemIntensity: 6,
          urgency: 4,
          frequency: 5,
          keyPainPoint: "Il ne sait pas vers quel métier aller.",
          alternativeSolution: "Des conseils glanés en ligne et entre amis.",
        },
      ],
    },
  },
  {
    id: 'hemotion',
    name: 'Hemotion 🚑',
    tagline: 'Les gestes qui sauvent, à portée de main',
    description:
      "Kits de premiers secours ultra-compacts (format canette), application d'urgence interactive et formations pour démocratiser les gestes qui sauvent.",
    project: {
      projectName: 'Hemotion',
      pitch:
        "Rendre le secourisme accessible, compact et instinctif grâce à des kits d'urgence nomades et une application de guidage pas-à-pas.",
      sector: 'Santé et secourisme',
      personas: [
        {
          id: 'hemotion-p1',
          name: 'Thomas, 32 ans',
          role: 'Randonneur, souvent loin de tout',
          description:
            "Évolue souvent en milieu isolé où les secours mettent du temps à arriver. Angoisse d'une blessure grave (hémorragie, fracture, plaie) sans matériel adapté.",
          problemIntensity: 9, // une blessure grave loin des secours
          urgency: 9,          // il repart bientôt
          frequency: 7,        // il sort régulièrement
          keyPainPoint: "Trousses classiques trop encombrantes, mal organisées et inadaptées aux urgences vitales.",
          alternativeSolution: "Trousse à pharmacie basique bricolée ou rien par manque de place.",
        },
        {
          id: 'hemotion-p2',
          name: 'Julie, 35 ans',
          role: 'Mère de deux jeunes enfants',
          description:
            "Veut protéger son foyer contre les accidents domestiques (étouffement, brûlure, chute) mais panique sur les gestes à effectuer.",
          problemIntensity: 9,
          urgency: 7,
          frequency: 6,
          keyPainPoint: "Peur de paniquer et de ne pas savoir quoi faire en attendant le 15.",
          alternativeSolution: "Boîte à pharmacie désordonnée avec des produits souvent périmés.",
        },
        {
          id: 'hemotion-p3',
          name: 'Stéphane, 48 ans',
          role: "Responsable de la sécurité dans une PME",
          description:
            "Doit équiper les véhicules de service et former les équipes avec du matériel moderne et attrayant.",
          problemIntensity: 7,
          urgency: 5,
          frequency: 5,
          keyPainPoint: "Matériel d'entreprise austère que personne n'ouvre, formation oubliée au bout de 6 mois.",
          alternativeSolution: "Armoires à pharmacie imposantes et formations obligatoires classiques.",
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
