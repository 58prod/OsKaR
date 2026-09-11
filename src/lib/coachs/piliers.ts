/*
 * Les 5 piliers tels que l'app les propose aujourd'hui (pages de pilier et
 * ateliers), pour les documents du kit coach remis aux clients : deck de
 * présentation et fiche « les 5 piliers ». Durées, étapes et livrables sont
 * ceux des pages /vision, /fit, /finance, /okr et /team : les mettre à jour
 * ensemble.
 */

export interface PilierKit {
  id: 'vision' | 'fit' | 'finance' | 'okr' | 'team';
  numero: string;
  /** Nom complet, « OSKAR Vision ». */
  nom: string;
  /** Nom court, pour les colonnes étroites. */
  court: string;
  couleur: string;
  clair: string;
  fonce: string;
  question: string;
  /** Ce que le pilier produit, en une ligne (deck). */
  enBref: string;
  /** À quoi il sert (fiche). */
  sert: string;
  /** Ce qu'il produit (fiche). */
  produit: string[];
  duree: string;
  etapes: string[];
  /** Vrai tant que le module n'est pas ouvert dans l'app. */
  bientot?: boolean;
}

export const PILIERS_KIT: PilierKit[] = [
  {
    id: 'vision',
    numero: '01',
    nom: 'OSKAR Vision',
    court: 'Vision',
    couleur: '#0ea5e9',
    clair: '#e0f2fe',
    fonce: '#0284c7',
    question: 'Où allons-nous, et pourquoi cela vaut-il la peine ?',
    enBref: 'Un cap, des valeurs, 3 objectifs fondateurs',
    sert: 'Formaliser la vision de l’entreprise : sa raison d’être, ses cibles et ses acteurs, ses valeurs, et les 3 objectifs qui comptent vraiment.',
    produit: ['Une vision formulée et partagée', 'Des cibles et des valeurs explicites', '3 objectifs fondateurs', 'La fiche de cap en PDF'],
    duree: '~1h',
    etapes: ['Sens', 'Cibles', 'Réalité', 'Projection', 'Valeurs', 'Synthèse', 'Objectifs'],
  },
  {
    id: 'fit',
    numero: '02',
    nom: 'OSKAR Market Fit',
    court: 'Market Fit',
    couleur: '#22c55e',
    clair: '#dcfce7',
    fonce: '#16a34a',
    question: 'Notre offre répond-elle vraiment à un besoin qui paie ?',
    enBref: 'Des preuves de traction, pas des intuitions',
    sert: 'Vérifier que l’offre répond à un vrai besoin : ce que vous vendez, ce qui vous distingue, qui d’autre répond au même besoin, ce que disent les signaux terrain.',
    produit: [
      'Une offre décrite par ses bénéfices client',
      'Un positionnement face à la concurrence',
      'Les signaux terrain rassemblés',
      'Le diagnostic Market Fit en PDF',
    ],
    duree: '~1h',
    etapes: ['Offre', 'Différenciation', 'Concurrence', 'Signaux', 'Diagnostic'],
  },
  {
    id: 'finance',
    numero: '03',
    nom: 'OSKAR Finance',
    court: 'Finance',
    couleur: '#f59e0b',
    clair: '#fef3c7',
    fonce: '#d97706',
    question: 'Nos chiffres nous préviennent-ils à temps ?',
    enBref: 'Le point mort, la trésorerie, les décisions',
    sert: 'Cartographier les revenus, analyser les coûts, calculer le seuil de rentabilité, puis prendre les décisions financières structurantes.',
    produit: [
      'Le point mort et la marge de sécurité',
      'Les mois de trésorerie devant vous',
      'Les décisions financières à prendre',
      'La synthèse financière en PDF',
    ],
    duree: '~1h',
    etapes: ['Revenus', 'Coûts & Marge', 'Rentabilité', 'Décisions'],
  },
  {
    id: 'okr',
    numero: '04',
    nom: 'OSKAR OKR',
    court: 'OKR',
    couleur: '#6366f1',
    clair: '#ede9fe',
    fonce: '#4f46e5',
    question: 'Que faisons-nous ce trimestre, et comment le saurons-nous ?',
    enBref: 'Des objectifs mesurables, revus chaque trimestre',
    sert: 'Fixer les objectifs de l’année avec une cible chiffrée, les décliner en résultats clés chaque trimestre, puis piloter les actions au quotidien.',
    produit: [
      '3 objectifs annuels chiffrés',
      'Les objectifs du trimestre, 2 résultats clés au plus',
      'Un plan d’actions suivi : à faire, en cours, terminé',
    ],
    duree: '~45 min, puis chaque trimestre',
    etapes: ['Objectifs annuels', 'Trimestre et résultats clés', 'Plan d’actions'],
  },
  {
    id: 'team',
    numero: '05',
    nom: 'OSKAR Team',
    court: 'Team',
    couleur: '#ec4899',
    clair: '#fce7f3',
    fonce: '#db2777',
    question: 'L’équipe avance-t-elle dans le même sens ?',
    enBref: 'Des conseils simples et des rituels courts',
    sert: 'Garder l’équipe motivée, avancer ensemble et désamorcer les tensions : des conseils simples au dirigeant, à appliquer dès la semaine.',
    produit: [
      '13 conseils en 5 familles, 3 à appliquer tout de suite',
      '10 documents pré-remplis avec vos objectifs',
      'Les rituels de la boîte à outils : rétro, météo d’équipe, daily',
    ],
    duree: '~15 min',
    etapes: ['Cap', 'Rythme', 'Confiance', 'Lien', 'Tensions'],
    bientot: true,
  },
];
