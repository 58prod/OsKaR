import { AmbitionCategory, Priority, Quarter } from '@/types';
import packageJson from '../../package.json';

// Configuration de l'application (version : source unique = package.json)
export const APP_CONFIG = {
  name: 'OsKaR',
  version: packageJson.version,
  description: 'Outil de gestion d\'objectifs pour entrepreneurs avec IA coach',
  author: 'OsKaR Team',
  maxAmbitionsPerYear: 5,
  maxKeyResultsPerAmbition: 3,
  maxOKRsPerQuarter: 10,
  maxActionsPerOKR: 5,
  maxTasksPerAction: 10,
};

/*
 * Connexion Google : le fournisseur n'est PAS activé dans le projet Supabase
 * (constaté le 2026-09-09 sur /auth/v1/settings : google=false). Tant qu'il
 * n'est pas configuré (identifiants OAuth Google Cloud + activation dans
 * Supabase > Authentication > Providers), le bouton reste masqué : sinon il
 * renvoie « Unsupported provider ».
 */
export const GOOGLE_AUTH_ENABLED = false;

// Messages de l'IA Coach
export const AI_MESSAGES = {
  WELCOME: "Bonjour ! Je suis votre coach IA. Je vais vous accompagner dans la définition et le suivi de vos objectifs. Commençons par vos ambitions pour cette année !",
  
  AMBITION_VALIDATION: {
    GOOD: "Excellente ambition ! Elle est claire et inspirante.",
    NEEDS_IMPROVEMENT: "Cette ambition pourrait être plus précise. Essayez d'être plus spécifique sur ce que vous voulez accomplir.",
    TOO_VAGUE: "Cette ambition est trop vague. Pouvez-vous la reformuler de manière plus concrète ?",
    TOO_COMPLEX: "Cette ambition semble trop complexe. Essayez de la diviser en plusieurs ambitions plus simples.",
  },
  
  KEY_RESULT_VALIDATION: {
    SMART_COMPLIANT: "Parfait ! Ce résultat clé respecte les critères SMART.",
    NOT_MEASURABLE: "Ce résultat clé n'est pas assez mesurable. Ajoutez des chiffres précis.",
    NOT_TIME_BOUND: "Ajoutez une date limite précise pour ce résultat clé.",
    NOT_ACHIEVABLE: "Cet objectif semble trop ambitieux. Êtes-vous sûr qu'il est atteignable ?",
    NOT_RELEVANT: "Ce résultat clé ne semble pas directement lié à votre ambition.",
  },
  
  OKR_VALIDATION: {
    WELL_STRUCTURED: "Excellent OKR ! L'objectif est clair et les résultats clés sont mesurables.",
    OBJECTIVE_TOO_VAGUE: "L'objectif pourrait être plus précis et inspirant.",
    TOO_MANY_KRS: "Limitez-vous à 3-5 résultats clés maximum pour rester focus.",
    KRS_NOT_ALIGNED: "Certains résultats clés ne semblent pas alignés avec l'objectif principal.",
  },
  
  PROGRESS_ENCOURAGEMENT: [
    "Excellent progrès ! Continuez sur cette lancée !",
    "Vous êtes sur la bonne voie ! Restez concentré sur vos priorités.",
    "Beau travail ! Vos efforts portent leurs fruits.",
    "Félicitations pour votre progression constante !",
    "Vous faites du très bon travail ! Gardez le cap !",
  ],
  
  PROGRESS_CONCERN: [
    "Il semble y avoir un ralentissement. Avez-vous rencontré des obstacles ?",
    "Votre progression a ralenti. Voulez-vous revoir vos priorités ?",
    "Il est temps de faire le point. Quels sont les blocages actuels ?",
    "Ne vous découragez pas ! Analysons ensemble ce qui peut être amélioré.",
  ],
};

// Options pour les formulaires
export const FORM_OPTIONS = {
  AMBITION_CATEGORIES: [
    { value: AmbitionCategory.REVENUE, label: 'Chiffre d\'affaires' },
    { value: AmbitionCategory.GROWTH, label: 'Croissance' },
    { value: AmbitionCategory.PRODUCT, label: 'Produit' },
    { value: AmbitionCategory.TEAM, label: 'Équipe' },
    { value: AmbitionCategory.MARKET, label: 'Marché' },
    { value: AmbitionCategory.OPERATIONAL, label: 'Opérationnel' },
    { value: AmbitionCategory.PERSONAL, label: 'Personnel' },
  ],
  
  PRIORITIES: [
    { value: Priority.LOW, label: 'Faible', color: 'text-gray-500' },
    { value: Priority.MEDIUM, label: 'Moyenne', color: 'text-yellow-500' },
    { value: Priority.HIGH, label: 'Élevée', color: 'text-orange-500' },
    { value: Priority.CRITICAL, label: 'Critique', color: 'text-red-500' },
  ],
  
  QUARTERS: [
    { value: Quarter.Q1, label: 'T1 (Jan-Mar)' },
    { value: Quarter.Q2, label: 'T2 (Avr-Juin)' },
    { value: Quarter.Q3, label: 'T3 (Juil-Sep)' },
    { value: Quarter.Q4, label: 'T4 (Oct-Déc)' },
  ],
  
  UNITS: [
    '€', '$', '%', 'unités', 'clients', 'utilisateurs', 'heures', 'jours',
    'semaines', 'mois', 'points', 'leads', 'ventes', 'visites', 'téléchargements'
  ],
};

// Configuration des graphiques
export const CHART_COLORS = {
  PRIMARY: '#0ea5e9',
  SUCCESS: '#22c55e',
  WARNING: '#f59e0b',
  DANGER: '#ef4444',
  INFO: '#6366f1',
  GRAY: '#6b7280',
};

// Seuils pour les alertes
export const ALERT_THRESHOLDS = {
  PROGRESS_BEHIND: 70, // En dessous de 70% du progrès attendu
  DEADLINE_WARNING: 7, // 7 jours avant l'échéance
  DEADLINE_CRITICAL: 3, // 3 jours avant l'échéance
};

// Templates d'exemples
export const EXAMPLES = {
  AMBITIONS: [
    {
      title: "Doubler le chiffre d'affaires",
      description: "Passer de 500K€ à 1M€ de CA annuel en développant de nouveaux marchés",
      category: AmbitionCategory.REVENUE,
    },
    {
      title: "Lancer un nouveau produit",
      description: "Développer et commercialiser une nouvelle gamme de produits innovants",
      category: AmbitionCategory.PRODUCT,
    },
    {
      title: "Constituer une équipe de 20 personnes",
      description: "Recruter et former une équipe talentueuse pour soutenir la croissance",
      category: AmbitionCategory.TEAM,
    },
  ],
  
  KEY_RESULTS: [
    {
      title: "Atteindre 1M€ de chiffre d'affaires",
      description: "Générer un million d'euros de revenus grâce à nos produits et services",
      target: 1000000,
      unit: "€",
    },
    {
      title: "Acquérir 500 nouveaux clients",
      description: "Développer notre base client avec 500 nouveaux comptes actifs",
      target: 500,
      unit: "clients",
    },
    {
      title: "Augmenter la satisfaction client à 95%",
      description: "Atteindre un taux de satisfaction client de 95% selon nos enquêtes",
      target: 95,
      unit: "%",
    },
    {
      title: "Réduire le temps de réponse à 2h",
      description: "Améliorer notre service client avec un temps de réponse moyen de 2 heures",
      target: 2,
      unit: "heures",
    },
  ],
};

// Configuration des notifications
export const NOTIFICATION_TYPES = {
  SUCCESS: 'success',
  WARNING: 'warning',
  ERROR: 'error',
  INFO: 'info',
};

// Durées d'animation
export const ANIMATION_DURATIONS = {
  FAST: 150,
  NORMAL: 300,
  SLOW: 500,
};

// Breakpoints responsive
export const BREAKPOINTS = {
  SM: 640,
  MD: 768,
  LG: 1024,
  XL: 1280,
  '2XL': 1536,
};
