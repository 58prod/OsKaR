/*
 * Exemples de l'atelier Finance, par famille de métiers.
 *
 * Même règle que le reste de `exemples.ts` : une personne qui a choisi son
 * domaine d'activité lit des exemples de son métier, les autres lisent ceux de
 * la maquette `finance-atelier.html`. Rattaché au jeu complet dans
 * `exemples.ts` (champ `finance`) ; un test vérifie qu'aucune famille n'est
 * oubliée.
 *
 * Les deux premières lignes de revenus sont pensées pour les types que la
 * maquette présélectionne (« Récurrent » puis « Projet ») ; les trois
 * décisions pour les leviers présélectionnés (« Pricing », « Réduction
 * coûts », « Modèle récurrent »). Les montants sont écrits comme dans la
 * maquette (« 450 000 »), la page ajoute « ex : ».
 */

export interface DecisionExemple {
  action: string;
  responsable: string;
  delai: string;
  impact: string;
}

export interface ExemplesFinance {
  /** Une source récurrente, puis une source au projet. */
  revenus: [string, string];
  /** Deux coûts variables. */
  variables: [string, string];
  /** Deux coûts fixes : le premier en RH, le second en locaux. */
  fixes: [string, string];
  /** Ordres de grandeur de l'étape « Rentabilité ». */
  chiffres: { ca: string; cf: string; cv: string; treso: string };
  /** Trois décisions : pricing, réduction de coûts, modèle récurrent. */
  decisions: [DecisionExemple, DecisionExemple, DecisionExemple];
}

/** Sans métier choisi : les exemples de la maquette. */
export const FINANCE_PAR_DEFAUT: ExemplesFinance = {
  revenus: ['Abonnements SaaS', 'Prestations conseil'],
  variables: ['Achats matières / sous-traitance', 'Commissions / apporteurs'],
  fixes: ['Masse salariale', 'Loyer / charges'],
  chiffres: { ca: '450 000', cf: '180 000', cv: '90 000', treso: '60 000' },
  decisions: [
    {
      action: 'Augmenter le prix de l’offre Core de 15% dès le 1er trimestre',
      responsable: 'Dirigeant',
      delai: '30 jours',
      impact: '+5 pts de marge brute, soit ~22 500€ additionnels sur l’année',
    },
    {
      action: 'Renégocier le contrat de sous-traitance principal',
      responsable: 'DAF / Dirigeant',
      delai: '45 jours',
      impact: 'Économie estimée de 8 000€/an',
    },
    {
      action: 'Créer une offre d’abonnement mensuel pour stabiliser les revenus',
      responsable: 'Dirigeant + Commercial',
      delai: '90 jours',
      impact: '+30% de revenus récurrents, stabilisation du CA mensuel',
    },
  ],
};

/* Les clés sont les intitulés exacts des familles de `secteurs.ts`. */
export const FINANCE_PAR_FAMILLE: Record<string, ExemplesFinance> = {
  'Artisanat & bâtiment': {
    revenus: ['Contrats d’entretien annuels', 'Chantiers de rénovation'],
    variables: ['Matériaux et fournitures', 'Sous-traitance (électricien, carreleur)'],
    fixes: ['Salaires et charges', 'Dépôt et véhicules'],
    chiffres: { ca: '350 000', cf: '140 000', cv: '120 000', treso: '40 000' },
    decisions: [
      {
        action: 'Revoir le taux horaire et facturer les déplacements',
        responsable: 'Gérant',
        delai: '30 jours',
        impact: '+4 pts de marge, soit ~14 000€ sur l’année',
      },
      {
        action: 'Négocier une remise annuelle avec le fournisseur de matériaux',
        responsable: 'Gérant',
        delai: '45 jours',
        impact: 'Économie estimée de 6 000€/an',
      },
      {
        action: 'Proposer un contrat d’entretien annuel à chaque client de chantier',
        responsable: 'Gérant + apprenti',
        delai: '90 jours',
        impact: '+40 contrats, soit 8 000€ de revenus récurrents',
      },
    ],
  },

  'Immobilier & habitat': {
    revenus: ['Honoraires de gestion locative', 'Honoraires de transaction'],
    variables: ['Commissions des négociateurs', 'Diffusion des annonces sur les portails'],
    fixes: ['Salaires et charges', 'Loyer de l’agence'],
    chiffres: { ca: '400 000', cf: '190 000', cv: '110 000', treso: '70 000' },
    decisions: [
      {
        action: 'Ajuster le barème d’honoraires sur les petits biens',
        responsable: 'Directeur d’agence',
        delai: '30 jours',
        impact: '+12 000€ d’honoraires sur l’année',
      },
      {
        action: 'Ne garder que les deux portails d’annonces les plus performants',
        responsable: 'Directeur d’agence',
        delai: '45 jours',
        impact: 'Économie estimée de 7 000€/an',
      },
      {
        action: 'Faire entrer 30 lots de plus en gestion locative',
        responsable: 'Responsable gestion',
        delai: '90 jours',
        impact: '+9 000€ de revenus récurrents par an',
      },
    ],
  },

  'Conseil & accompagnement': {
    revenus: ['Accompagnements au forfait mensuel', 'Missions ponctuelles'],
    variables: ['Consultants partenaires en sous-traitance', 'Frais de déplacement'],
    fixes: ['Rémunération du dirigeant', 'Bureau partagé'],
    chiffres: { ca: '180 000', cf: '70 000', cv: '30 000', treso: '35 000' },
    decisions: [
      {
        action: 'Passer le tarif journalier de 900 à 1 050€ pour les nouveaux clients',
        responsable: 'Dirigeant',
        delai: '30 jours',
        impact: '+15 000€ de CA à volume égal',
      },
      {
        action: 'Regrouper les déplacements et refacturer les frais au réel',
        responsable: 'Dirigeant',
        delai: '45 jours',
        impact: 'Économie estimée de 4 000€/an',
      },
      {
        action: 'Transformer 5 missions ponctuelles en accompagnement mensuel',
        responsable: 'Dirigeant',
        delai: '90 jours',
        impact: '+60% de revenus récurrents',
      },
    ],
  },

  'Comptabilité, finance & juridique': {
    revenus: ['Forfaits de tenue comptable mensuels', 'Missions exceptionnelles (juridique, conseil)'],
    variables: ['Sous-traitance de la paie', 'Licences logicielles par dossier'],
    fixes: ['Salaires des collaborateurs', 'Loyer du cabinet'],
    chiffres: { ca: '600 000', cf: '380 000', cv: '60 000', treso: '90 000' },
    decisions: [
      {
        action: 'Réviser les forfaits des dossiers sous-facturés',
        responsable: 'Associé',
        delai: '30 jours',
        impact: '+25 000€ d’honoraires sur l’année',
      },
      {
        action: 'Renégocier les licences logicielles au volume',
        responsable: 'Associé',
        delai: '45 jours',
        impact: 'Économie estimée de 9 000€/an',
      },
      {
        action: 'Proposer une offre de suivi mensuel à 30 clients',
        responsable: 'Associé + collaborateurs',
        delai: '90 jours',
        impact: '+36 000€ de revenus récurrents par an',
      },
    ],
  },

  'Santé, social & bien-être': {
    revenus: ['Forfaits de suivi en 6 séances', 'Consultations à l’unité'],
    variables: ['Consommables et petit matériel', 'Commission de la plateforme de réservation'],
    fixes: ['Charges personnelles et cotisations', 'Loyer du cabinet partagé'],
    chiffres: { ca: '90 000', cf: '30 000', cv: '8 000', treso: '15 000' },
    decisions: [
      {
        action: 'Revaloriser le tarif de la séance de 60 à 70€',
        responsable: 'Praticien',
        delai: '30 jours',
        impact: '+9 000€ de CA à volume égal',
      },
      {
        action: 'Passer à une prise de rendez-vous en ligne sans commission',
        responsable: 'Praticien',
        delai: '45 jours',
        impact: 'Économie estimée de 1 500€/an',
      },
      {
        action: 'Proposer le forfait 6 séances à chaque nouvelle personne',
        responsable: 'Praticien',
        delai: '90 jours',
        impact: '+50% de revenus prévisibles',
      },
    ],
  },

  'Commerce & services': {
    revenus: ['Abonnements et paniers réguliers', 'Ventes en boutique'],
    variables: ['Achats de marchandises', 'Frais de livraison et emballages'],
    fixes: ['Salaires des vendeurs', 'Loyer du local'],
    chiffres: { ca: '500 000', cf: '150 000', cv: '280 000', treso: '50 000' },
    decisions: [
      {
        action: 'Revoir le coefficient sur les produits les plus demandés',
        responsable: 'Gérant',
        delai: '30 jours',
        impact: '+3 pts de marge, soit ~15 000€ sur l’année',
      },
      {
        action: 'Réduire les invendus en ajustant les commandes chaque semaine',
        responsable: 'Responsable achats',
        delai: '45 jours',
        impact: 'Économie estimée de 10 000€/an',
      },
      {
        action: 'Lancer un abonnement mensuel pour les clients fidèles',
        responsable: 'Gérant + vendeurs',
        delai: '90 jours',
        impact: '+200 abonnés, soit 3 000€ de revenus récurrents par mois',
      },
    ],
  },

  'Numérique & innovation': {
    revenus: ['Abonnements mensuels', 'Mise en place et formation'],
    variables: ['Hébergement et services cloud', 'Commissions de paiement'],
    fixes: ['Salaires de l’équipe', 'Bureaux et outils'],
    chiffres: { ca: '240 000', cf: '160 000', cv: '25 000', treso: '120 000' },
    decisions: [
      {
        action: 'Augmenter de 15% la formule de base pour les nouveaux clients',
        responsable: 'Fondateur',
        delai: '30 jours',
        impact: '+18 000€ de revenus récurrents par an',
      },
      {
        action: 'Supprimer les environnements cloud inutilisés',
        responsable: 'CTO',
        delai: '45 jours',
        impact: 'Économie estimée de 6 000€/an',
      },
      {
        action: 'Faire passer les clients mensuels à l’abonnement annuel',
        responsable: 'Fondateur + commercial',
        delai: '90 jours',
        impact: '+30% de trésorerie encaissée d’avance',
      },
    ],
  },

  'Communication & création': {
    revenus: ['Contrats annuels au forfait', 'Projets ponctuels (identité, site)'],
    variables: ['Freelances (développeur, photographe)', 'Impression et fabrication'],
    fixes: ['Salaires du studio', 'Loyer de l’atelier'],
    chiffres: { ca: '150 000', cf: '80 000', cv: '30 000', treso: '25 000' },
    decisions: [
      {
        action: 'Facturer les corrections au-delà de deux allers-retours',
        responsable: 'Fondateur',
        delai: '30 jours',
        impact: '+8 000€ de CA sur l’année',
      },
      {
        action: 'Renégocier les tarifs de l’imprimeur partenaire',
        responsable: 'Chef de projet',
        delai: '45 jours',
        impact: 'Économie estimée de 3 000€/an',
      },
      {
        action: 'Proposer un forfait mensuel de suivi à chaque client livré',
        responsable: 'Fondateur',
        delai: '90 jours',
        impact: '+6 contrats, soit 36 000€ de revenus récurrents',
      },
    ],
  },

  'Industrie & logistique': {
    revenus: ['Contrats cadres avec les donneurs d’ordre', 'Commandes ponctuelles'],
    variables: ['Matières premières', 'Transport et emballage'],
    fixes: ['Salaires de production', 'Loyer et entretien de l’atelier'],
    chiffres: { ca: '2 000 000', cf: '800 000', cv: '900 000', treso: '250 000' },
    decisions: [
      {
        action: 'Répercuter la hausse des matières dans les nouveaux contrats',
        responsable: 'Directeur commercial',
        delai: '30 jours',
        impact: '+2 pts de marge, soit ~40 000€ sur l’année',
      },
      {
        action: 'Regrouper les livraisons pour réduire le coût de transport',
        responsable: 'Responsable logistique',
        delai: '45 jours',
        impact: 'Économie estimée de 25 000€/an',
      },
      {
        action: 'Signer un contrat cadre annuel avec deux clients réguliers',
        responsable: 'Directeur commercial',
        delai: '90 jours',
        impact: '+35% de CA sécurisé sur l’année',
      },
    ],
  },

  'Éducation, sport & loisirs': {
    revenus: ['Adhésions et abonnements annuels', 'Stages et sessions ponctuelles'],
    variables: ['Intervenants vacataires', 'Matériel pédagogique'],
    fixes: ['Salaires des encadrants', 'Location des salles'],
    chiffres: { ca: '200 000', cf: '120 000', cv: '40 000', treso: '30 000' },
    decisions: [
      {
        action: 'Revoir le tarif des stages selon leur taux de remplissage',
        responsable: 'Directeur',
        delai: '30 jours',
        impact: '+10 000€ de CA sur la saison',
      },
      {
        action: 'Partager la location des salles avec une autre structure',
        responsable: 'Directeur',
        delai: '45 jours',
        impact: 'Économie estimée de 8 000€/an',
      },
      {
        action: 'Proposer le paiement mensuel de l’adhésion annuelle',
        responsable: 'Directeur + accueil',
        delai: '90 jours',
        impact: '+15% de réinscriptions, revenus lissés sur l’année',
      },
    ],
  },

  'Tourisme & restauration': {
    revenus: ['Formules déjeuner des habitués', 'Service du soir et événements'],
    variables: ['Produits frais et boissons', 'Commissions des plateformes de réservation'],
    fixes: ['Salaires de la brigade', 'Loyer et énergie'],
    chiffres: { ca: '450 000', cf: '200 000', cv: '150 000', treso: '45 000' },
    decisions: [
      {
        action: 'Revoir le prix des trois plats les plus vendus',
        responsable: 'Gérant',
        delai: '30 jours',
        impact: '+2 pts de marge, soit ~9 000€ sur l’année',
      },
      {
        action: 'Réduire le gaspillage avec une carte plus courte',
        responsable: 'Chef',
        delai: '45 jours',
        impact: 'Économie estimée de 12 000€/an',
      },
      {
        action: 'Lancer une carte déjeuner prépayée pour les habitués',
        responsable: 'Gérant + salle',
        delai: '90 jours',
        impact: '+20% de couverts réguliers le midi',
      },
    ],
  },

  'Agriculture & environnement': {
    revenus: ['Abonnements aux paniers hebdomadaires', 'Ventes aux commerçants et sur les marchés'],
    variables: ['Semences, plants et intrants', 'Emballages et livraison'],
    fixes: ['Salaire du saisonnier', 'Fermage et bâtiments'],
    chiffres: { ca: '180 000', cf: '80 000', cv: '50 000', treso: '30 000' },
    decisions: [
      {
        action: 'Réviser le prix du panier à chaque changement de saison',
        responsable: 'Exploitant',
        delai: '30 jours',
        impact: '+6 000€ de CA sur l’année',
      },
      {
        action: 'Mutualiser les tournées de livraison avec deux fermes voisines',
        responsable: 'Exploitant',
        delai: '45 jours',
        impact: 'Économie estimée de 4 000€/an',
      },
      {
        action: 'Faire passer 50 clients du marché à l’abonnement panier',
        responsable: 'Associés',
        delai: '90 jours',
        impact: '+25% de revenus récurrents',
      },
    ],
  },

  'Secteur public & intérêt général': {
    revenus: ['Subventions de fonctionnement pluriannuelles', 'Appels à projets et prestations'],
    variables: ['Intervenants extérieurs', 'Déplacements des bénévoles'],
    fixes: ['Salaires des permanents', 'Loyer du local'],
    chiffres: { ca: '150 000', cf: '100 000', cv: '25 000', treso: '40 000' },
    decisions: [
      {
        action: 'Facturer les ateliers aux partenaires qui en ont les moyens',
        responsable: 'Directrice',
        delai: '30 jours',
        impact: '+8 000€ de ressources propres',
      },
      {
        action: 'Partager le local avec une autre association',
        responsable: 'Bureau',
        delai: '45 jours',
        impact: 'Économie estimée de 6 000€/an',
      },
      {
        action: 'Transformer deux subventions annuelles en conventions de trois ans',
        responsable: 'Directrice + trésorier',
        delai: '90 jours',
        impact: 'Budget sécurisé sur trois ans',
      },
    ],
  },
};
