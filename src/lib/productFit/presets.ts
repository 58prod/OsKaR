import type { PresetCase } from './types';

/**
 * Presets de demonstration - Phase 1 uniquement (P x U x F).
 * Les dimensions 3U sont volontairement absentes : elles s'evaluent
 * uniquement une fois qu'un prototype testable existe.
 */
export const PRESET_CASES: PresetCase[] = [
  {
    id: 'eternity',
    name: 'Eternity \u23F3',
    tagline: 'Transmission & Preservation de Memoire Familiale',
    description:
      "Application pour recueillir, transcrire et transmettre les recits de vie des aines avant qu'il ne soit trop tard.",
    project: {
      projectName: 'Eternity',
      pitch:
        "Aider les familles a capturer la memoire de leurs proches via des questions audio guidees et un livre souvenir genere automatiquement.",
      sector: 'FamilyTech / Silver Economy',
      personas: [
        {
          id: 'eternity-p1',
          name: 'Claire (Generation Pivot / 45 ans)',
          role: 'Fille de parents vieillissants, active et mere de famille',
          description:
            "Voit ses parents decliner, angoisse de perdre leur histoire et regrette de ne pas avoir le temps de poser les bonnes questions.",
          problemIntensity: 9,
          urgency: 8,
          frequency: 7,
          keyPainPoint: "Le temps passe trop vite et les souvenirs s'effacent avec les grands-parents.",
          alternativeSolution: "Enregistrements vocaux WhatsApp eparpilles, albums photos incomplets.",
        },
        {
          id: 'eternity-p2',
          name: 'Jean (Senior / 75 ans)',
          role: "Grand-pere a la retraite",
          description:
            "Veut laisser une trace a ses petits-enfants mais la page blanche et la technologie le freinent.",
          problemIntensity: 7,
          urgency: 4,
          frequency: 4,
          keyPainPoint: "Ne sait pas par ou commencer et craint la complexite technique.",
          alternativeSolution: "Cahiers manuscrits rarement termines.",
        },
        {
          id: 'eternity-p3',
          name: 'Marc (Genealogiste Amateur / 55 ans)',
          role: "Passionne d'histoire familiale",
          description:
            "Collectionne les arbres et les dates, cherche des anecdotes vivantes pour illustrer ses recherches.",
          problemIntensity: 6,
          urgency: 4,
          frequency: 8,
          keyPainPoint: "A des dates et des actes mais manque de matiere vivante et de voix.",
          alternativeSolution: "Logiciels de genealogie austeres (Genealogie, etc.).",
        },
      ],
    },
  },
  {
    id: 'etape',
    name: 'ETAPE \uD83E\uDDED',
    tagline: 'Methode & Pilotage de Reconversion Professionnelle',
    description:
      "Plateforme d'accompagnement pas-a-pas pour securiser sa transition de carriere et trouver sa voie sans se perdre.",
    project: {
      projectName: 'ETAPE',
      pitch:
        "Guider les actifs en quete de sens pour valider leur projet de reconversion, lever les doutes et passer a l'action avec clarte.",
      sector: 'EdTech / Career Transition',
      personas: [
        {
          id: 'etape-p1',
          name: 'Sophie (Cadre en Quete de Sens / 38 ans)',
          role: 'Responsable marketing en poste, desillusionnee',
          description:
            "Ne trouve plus de sens dans son travail, se sent bloquee par la securite financiere mais etouffe.",
          problemIntensity: 9,
          urgency: 9,
          frequency: 8,
          keyPainPoint: "Peur du vide, syndrome de l'imposteur et absence de plan structure.",
          alternativeSolution: "Bilans de competences classiques souvent theoriques et peu actionnables.",
        },
        {
          id: 'etape-p2',
          name: 'David (Salarie Post-Burnout / 47 ans)',
          role: 'Ancien manager en arret ou conge de reclassement',
          description:
            "A subi un epuisement professionnel, a besoin de reprendre confiance a son rythme avec bienveillance.",
          problemIntensity: 10,
          urgency: 6,
          frequency: 6,
          keyPainPoint: "Perte de confiance totale et crainte de rechuter dans un environnement toxique.",
          alternativeSolution: "Suivi psychologique + coaching individuel.",
        },
        {
          id: 'etape-p3',
          name: 'Lucas (Jeune Diplome Hesitant / 25 ans)',
          role: 'Premier emploi insatisfaisant',
          description:
            "Decu par sa premiere experience professionnelle, s'interroge sur sa trajectoire.",
          problemIntensity: 6,
          urgency: 4,
          frequency: 5,
          keyPainPoint: "Ne sait pas vers quel secteur s'orienter.",
          alternativeSolution: "Conseils sur LinkedIn, videos YouTube, discussions entre pairs.",
        },
      ],
    },
  },
  {
    id: 'hemotion',
    name: 'Hemotion 🚑',
    tagline: 'Kits & Écosystème Moderne de Premiers Secours',
    description:
      "Kits de premiers secours ultra-compacts (format canette), application d'urgence interactive et formations pour démocratiser les gestes qui sauvent.",
    project: {
      projectName: 'Hemotion',
      pitch:
        "Rendre le secourisme accessible, compact et instinctif grâce à des kits d'urgence nomades et une application de guidage pas-à-pas.",
      sector: 'HealthTech / Secourisme & Outdoor',
      personas: [
        {
          id: 'hemotion-p1',
          name: 'Thomas (Pratiquant Outdoor & Aventure / 32 ans)',
          role: 'Randonneur, traileur, vanlife ou sportif engagé',
          description:
            "Évolue souvent en milieu isolé où les secours mettent du temps à arriver. Angoisse d'une blessure grave (hémorragie, fracture, plaie) sans matériel adapté.",
          problemIntensity: 9, // Risque vital / douleur critique en milieu isolé
          urgency: 9,          // Besoin d'être équipé avant son prochain départ
          frequency: 7,        // Sorties régulières en extérieur
          keyPainPoint: "Trousses classiques trop encombrantes, mal organisées et inadaptées aux urgences vitales.",
          alternativeSolution: "Trousse à pharmacie basique bricolée ou rien par manque de place.",
        },
        {
          id: 'hemotion-p2',
          name: 'Julie (Jeune Parent Prévoyante / 35 ans)',
          role: 'Maman de deux jeunes enfants',
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
          name: 'Stéphane (Responsable Sécurité / QSE en PME / 48 ans)',
          role: 'En charge de la sécurité et des SST (Sauveteurs Secouristes du Travail)',
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
