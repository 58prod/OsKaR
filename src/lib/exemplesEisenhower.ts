/*
 * Exemples de l'outil « Matrice d'Eisenhower », par famille de métiers.
 *
 * Même règle que le reste de `exemples.ts` : une personne qui a choisi son
 * domaine d'activité lit des exemples de son métier, les autres lisent les
 * exemples génériques. Ce fichier est rattaché au jeu complet dans
 * `exemples.ts` (champ `eisenhower`) ; un test vérifie qu'aucune famille n'est
 * oubliée.
 *
 * Un exemple de tâche par quadrant, sans « Ex : » ni points de suspension :
 * c'est la page qui les habille.
 */

export interface ExemplesEisenhower {
  /** Sujet de la matrice, saisi par l'animateur. */
  sujet: string;
  /** Urgent et important. */
  faire: string;
  /** Important, pas urgent. */
  planifier: string;
  /** Urgent, pas important. */
  deleguer: string;
  /** Ni urgent ni important. */
  abandonner: string;
}

/** Sans métier choisi : des exemples passe-partout. */
export const EISENHOWER_PAR_DEFAUT: ExemplesEisenhower = {
  sujet: 'Nos priorités du mois',
  faire: 'Répondre au client mécontent qui attend depuis lundi',
  planifier: 'Écrire les fiches de poste des deux prochains recrutements',
  deleguer: 'Commander les fournitures de bureau',
  abandonner: 'Refaire la mise en page du rapport mensuel',
};

/* Les clés sont les intitulés exacts des familles de `secteurs.ts`. */
export const EISENHOWER_PAR_FAMILLE: Record<string, ExemplesEisenhower> = {
  'Artisanat & bâtiment': {
    sujet: 'Les chantiers de la semaine',
    faire: 'Rappeler le client dont la fuite n’est toujours pas réparée',
    planifier: 'Former l’apprenti à la pose des chaudières',
    deleguer: 'Commander le matériel du chantier de jeudi',
    abandonner: 'Refaire le lettrage de la camionnette',
  },
  'Immobilier & habitat': {
    sujet: 'Les priorités de l’agence ce mois-ci',
    faire: 'Relancer le notaire pour la signature de vendredi',
    planifier: 'Rencontrer les trois vendeurs dont le mandat expire en fin de mois',
    deleguer: 'Organiser les photos du nouvel appartement',
    abandonner: 'Mettre à jour les anciennes annonces déjà vendues',
  },
  'Conseil & accompagnement': {
    sujet: 'Nos priorités du trimestre',
    faire: 'Envoyer la proposition attendue par le client demain matin',
    planifier: 'Écrire l’offre d’accompagnement packagée',
    deleguer: 'Réserver la salle du séminaire client',
    abandonner: 'Retravailler une troisième fois le modèle de présentation',
  },
  'Comptabilité, finance & juridique': {
    sujet: 'La période des bilans',
    faire: 'Déposer la déclaration de TVA qui tombe vendredi',
    planifier: 'Mettre en place la collecte automatique des pièces clients',
    deleguer: 'Relancer les clients qui n’ont pas envoyé leurs relevés',
    abandonner: 'Refaire le classement des archives de l’an dernier',
  },
  'Santé, social & bien-être': {
    sujet: 'L’organisation du cabinet',
    faire: 'Rappeler le patient dont les résultats sont arrivés',
    planifier: 'Suivre la formation obligatoire de l’année',
    deleguer: 'Réorganiser les rendez-vous de la semaine de congés',
    abandonner: 'Changer la décoration de la salle d’attente',
  },
  'Commerce & services': {
    sujet: 'Les priorités de la boutique',
    faire: 'Réassortir le produit en rupture avant samedi',
    planifier: 'Préparer les soldes de janvier',
    deleguer: 'Mettre à jour les étiquettes de prix',
    abandonner: 'Refaire la vitrine qui a été changée le mois dernier',
  },
  'Numérique & innovation': {
    sujet: 'Le prochain sprint',
    faire: 'Corriger le bug qui bloque les paiements',
    planifier: 'Réduire la dette technique du module de facturation',
    deleguer: 'Répondre aux questions de support de niveau 1',
    abandonner: 'Réécrire l’outil interne que personne n’utilise',
  },
  'Communication & création': {
    sujet: 'Les projets en cours au studio',
    faire: 'Livrer la maquette promise au client pour demain',
    planifier: 'Mettre à jour notre book avec les trois derniers projets',
    deleguer: 'Exporter les visuels aux différents formats réseaux',
    abandonner: 'Tester une quatrième version du logo déjà validé',
  },
  'Industrie & logistique': {
    sujet: 'Les priorités de l’atelier',
    faire: 'Réparer la machine arrêtée sur la ligne 2',
    planifier: 'Planifier la maintenance préventive de l’année',
    deleguer: 'Recompter le stock de palettes vides',
    abandonner: 'Refaire le tableau d’affichage de l’atelier',
  },
  'Éducation, sport & loisirs': {
    sujet: 'La préparation de la rentrée',
    faire: 'Trouver un remplaçant pour le cours de mercredi',
    planifier: 'Construire le programme de l’année prochaine',
    deleguer: 'Envoyer les rappels de cotisation',
    abandonner: 'Refaire les affiches de l’an dernier qui sont encore bonnes',
  },
  'Tourisme & restauration': {
    sujet: 'La saison qui arrive',
    faire: 'Remplacer le cuisinier absent ce week-end',
    planifier: 'Préparer la carte de printemps',
    deleguer: 'Passer la commande de boissons de la semaine',
    abandonner: 'Répondre à chaque avis en ligne vieux de plus d’un an',
  },
  'Agriculture & environnement': {
    sujet: 'Les travaux de la saison',
    faire: 'Récolter la parcelle avant l’orage annoncé',
    planifier: 'Monter le dossier d’aide à l’investissement',
    deleguer: 'Préparer les paniers du marché de samedi',
    abandonner: 'Repeindre le hangar cette année',
  },
  'Secteur public & intérêt général': {
    sujet: 'Les priorités de l’association',
    faire: 'Envoyer le dossier de subvention qui clôt vendredi',
    planifier: 'Construire le plan d’accueil des nouveaux bénévoles',
    deleguer: 'Organiser le covoiturage pour l’événement de samedi',
    abandonner: 'Refaire la plaquette de présentation encore à jour',
  },
};
