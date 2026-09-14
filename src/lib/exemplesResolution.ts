/*
 * Exemples de l'outil « Résolution collective », par famille de métiers.
 *
 * Même règle que le reste de `exemples.ts` : une personne qui a choisi son
 * domaine d'activité lit des exemples de son métier, les autres lisent les
 * exemples génériques. Ce fichier est rattaché au jeu complet dans
 * `exemples.ts` (champ `resolution`) ; un test vérifie qu'aucune famille n'est
 * oubliée.
 *
 * Les problèmes suivent le format proposé aux participants : « Quand
 * (situation), alors (conséquence) ». Pas de « Ex : » ni de points de
 * suspension : c'est la page qui les habille.
 */

export interface ExemplesResolution {
  /** Thème de l'atelier, saisi par l'animateur. */
  theme: string;
  /** Un problème rencontré, au format « Quand…, alors… ». */
  probleme: string;
  /** Une solution proposée pour ce problème. */
  solution: string;
  /** La première action concrète, une fois la solution validée. */
  premierPas: string;
}

/** Sans métier choisi : des exemples passe-partout. */
export const RESOLUTION_PAR_DEFAUT: ExemplesResolution = {
  theme: 'L’organisation de nos réunions',
  probleme: 'Quand une réunion n’a pas d’ordre du jour, alors on en sort sans décision',
  solution: 'Envoyer l’ordre du jour la veille, avec la décision attendue',
  premierPas: 'Rédiger un modèle d’ordre du jour d’une page',
};

/* Les clés sont les intitulés exacts des familles de `secteurs.ts`. */
export const RESOLUTION_PAR_FAMILLE: Record<string, ExemplesResolution> = {
  'Artisanat & bâtiment': {
    theme: 'La préparation des chantiers',
    probleme: 'Quand le matériel arrive incomplet sur le chantier, alors l’équipe perd une demi-journée',
    solution: 'Une liste de matériel vérifiée la veille par le chef d’équipe',
    premierPas: 'Écrire la liste type pour les trois chantiers de la semaine',
  },
  'Immobilier & habitat': {
    theme: 'Le suivi des mandats',
    probleme: 'Quand un vendeur reste quinze jours sans nouvelles, alors il confie son bien à une autre agence',
    solution: 'Un point téléphonique chaque vendredi avec chaque vendeur',
    premierPas: 'Bloquer un créneau le vendredi après-midi dans l’agenda de l’agence',
  },
  'Conseil & accompagnement': {
    theme: 'Le démarrage des nouvelles missions',
    probleme: 'Quand le cadrage n’est pas écrit, alors le client attend plus que ce qui était prévu',
    solution: 'Une note de cadrage validée par le client avant la première séance',
    premierPas: 'Rédiger le modèle de note de cadrage',
  },
  'Comptabilité, finance & juridique': {
    theme: 'La collecte des pièces clients',
    probleme: 'Quand les pièces arrivent la veille de l’échéance, alors toute l’équipe travaille dans l’urgence',
    solution: 'Un rappel automatique envoyé quinze jours avant chaque échéance',
    premierPas: 'Lister les clients concernés par l’échéance du mois prochain',
  },
  'Santé, social & bien-être': {
    theme: 'Les rendez-vous non honorés',
    probleme: 'Quand un patient ne vient pas sans prévenir, alors le créneau est perdu pour tout le monde',
    solution: 'Un SMS de rappel la veille, avec un lien pour annuler',
    premierPas: 'Comparer deux outils de rappel par SMS',
  },
  'Commerce & services': {
    theme: 'L’accueil en boutique le samedi',
    probleme: 'Quand le magasin est plein le samedi, alors des clients repartent sans avoir été servis',
    solution: 'Un renfort à mi-temps le samedi et un coin d’attente',
    premierPas: 'Relever l’affluence heure par heure les deux prochains samedis',
  },
  'Numérique & innovation': {
    theme: 'Nos mises en production',
    probleme: 'Quand une mise en production a lieu le vendredi soir, alors les incidents tombent pendant le week-end',
    solution: 'Plus aucune mise en production après le jeudi midi',
    premierPas: 'Annoncer la règle à l’équipe et l’ajouter au guide de livraison',
  },
  'Communication & création': {
    theme: 'Les allers-retours avec les clients',
    probleme: 'Quand les retours du client arrivent par cinq canaux, alors on en oublie à chaque version',
    solution: 'Un seul document de retours par projet, commenté par le client',
    premierPas: 'Tester le document de retours sur le projet en cours',
  },
  'Industrie & logistique': {
    theme: 'Les changements de série',
    probleme: 'Quand un changement de série n’est pas préparé, alors la ligne s’arrête plus d’une heure',
    solution: 'Préparer outils et réglages pendant que la série précédente tourne',
    premierPas: 'Chronométrer les deux prochains changements de série',
  },
  'Éducation, sport & loisirs': {
    theme: 'Les inscriptions de la rentrée',
    probleme: 'Quand les inscriptions se font sur papier, alors on passe des soirées à tout ressaisir',
    solution: 'Un formulaire d’inscription en ligne, avec le paiement',
    premierPas: 'Recenser les informations demandées aujourd’hui sur la fiche papier',
  },
  'Tourisme & restauration': {
    theme: 'Le coup de feu du service du midi',
    probleme: 'Quand toutes les commandes arrivent à 12 h 30, alors les clients attendent plus de vingt minutes',
    solution: 'Une carte du jour courte et une mise en place renforcée dès 11 h 30',
    premierPas: 'Tester une carte réduite à trois plats la semaine prochaine',
  },
  'Agriculture & environnement': {
    theme: 'La vente directe',
    probleme: 'Quand les commandes arrivent par téléphone et par SMS, alors on se trompe dans les paniers',
    solution: 'Un bon de commande unique en ligne, clos le mercredi soir',
    premierPas: 'Créer le bon de commande pour les dix clients les plus réguliers',
  },
  'Secteur public & intérêt général': {
    theme: 'L’accueil des nouveaux bénévoles',
    probleme: 'Quand un nouveau bénévole arrive sans accueil, alors il ne revient pas après deux permanences',
    solution: 'Un binôme avec un bénévole expérimenté pendant le premier mois',
    premierPas: 'Identifier trois bénévoles prêts à accueillir un nouveau',
  },
};
