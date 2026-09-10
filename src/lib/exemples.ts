import { familleDe } from './secteurs';
import { FIT_PAR_DEFAUT, FIT_PAR_FAMILLE, type ExemplesFit } from './exemplesFit';
import { FINANCE_PAR_DEFAUT, FINANCE_PAR_FAMILLE, type ExemplesFinance } from './exemplesFinance';

/*
 * Exemples adaptés au métier.
 *
 * Règle produit posée par Christophe le 2026-09-10 : dès qu'une personne a
 * choisi son domaine d'activité, les exemples proposés par l'application
 * parlent son langage. Tant qu'elle ne l'a pas choisi, on garde les exemples
 * génériques, jamais un champ vide.
 *
 * Les jeux sont définis par **famille** (14) et non par activité (95) :
 * un plombier, un menuisier et un couvreur partagent les mêmes repères —
 * chantiers, devis, clients — et écrire 95 jeux serait impossible à tenir à
 * jour. La famille se déduit de l'activité via `familleDe`.
 *
 * Les prochaines pages devront suivre la même logique : appeler
 * `exemplesPour(secteur)` plutôt que d'écrire des exemples en dur.
 */

/** Un objectif annuel proposé en un clic : le libellé court est celui de la pastille. */
export interface ObjectifExemple {
  /** Texte de la pastille, court. */
  libelle: string;
  /** Objectif complet, écrit dans la carte. */
  titre: string;
  cible: string;
  unite: string;
}

export interface JeuExemples {
  /** Six objectifs annuels, proposés en un clic à l'étape 1. */
  objectifs: ObjectifExemple[];
  /** Trois amorces de saisie, une par carte d'objectif annuel. */
  amorces: [string, string, string];
  /** Un objectif de trimestre. */
  objectifTrimestre: string;
  /** Un résultat clé chiffré. */
  resultatCle: { titre: string; cible: string; unite: string };
  /** Une action concrète, à faire cette semaine. */
  action: string;
  /** Repères pour le bilan Potentiel Produit. */
  produit: { nom: string; promesse: string; prenom: string; situation: string; probleme: string; aujourdhui: string };
  /** Repères pour l'atelier Vision. */
  vision: {
    pourquoi: string;
    comment: string;
    quoi: string;
    cible: string;
    acteur: string;
    probleme: string;
    projection: { ca: string; clients: string; offre: string; organisation: string };
    valeurs: { nom: string; traduction: string }[];
  };
  /** Repères pour l'atelier Fit, écrits à part dans `exemplesFit.ts`. */
  fit: ExemplesFit;
  /** Repères pour l'atelier Finance, écrits à part dans `exemplesFinance.ts`. */
  finance: ExemplesFinance;
}

/** Un jeu avant qu'on lui rattache ses exemples Fit et Finance. */
type JeuSansFit = Omit<JeuExemples, 'fit' | 'finance'>;

/** Sans secteur choisi : les exemples d'origine, volontairement passe-partout. */
const JEU_PAR_DEFAUT: JeuSansFit = {
  objectifs: [
    { libelle: 'Doubler le CA', titre: "Doubler mon chiffre d'affaires", cible: '2', unite: 'M€ de CA' },
    { libelle: "Structurer l'équipe", titre: "Recruter et structurer l'équipe", cible: '5', unite: 'collaborateurs' },
    { libelle: 'Lancer un produit', titre: 'Lancer un nouveau produit sur le marché', cible: '3', unite: 'nouveaux clients' },
    { libelle: 'Devenir la référence', titre: 'Devenir la référence locale de mon secteur', cible: '50', unite: '% de notoriété' },
    { libelle: 'Automatiser', titre: 'Automatiser la production pour gagner du temps', cible: '10', unite: 'h/semaine gagnées' },
    { libelle: 'Fidéliser les clients', titre: 'Fidéliser 90% de mes clients actuels', cible: '90', unite: '% de rétention' },
  ],
  amorces: [
    'Ex : Devenir leader sur mon marché régional…',
    'Ex : Créer une équipe autonome et performante…',
    'Ex : Lancer un nouveau produit rentable…',
  ],
  objectifTrimestre: 'Augmenter les ventes',
  resultatCle: { titre: 'Signer 3 partenariats commerciaux', cible: '3', unite: 'partenariats' },
  action: 'Contacter 5 prospects cette semaine',
  produit: {
    nom: 'Mon produit',
    promesse: 'Aider les familles à garder la mémoire de leurs proches',
    prenom: 'Claire',
    situation: 'Mère de deux enfants, salariée',
    probleme: 'Elle perd 3 heures par semaine',
    aujourdhui: 'À la main, sur un tableur',
  },
  vision: {
    pourquoi: 'Nous croyons que chaque organisation mérite un cap clair et une équipe alignée',
    comment: 'Grâce à une méthode structurée, des rituels courts et un accompagnement ancré dans le réel',
    quoi: 'Nous accompagnons nos clients avec une méthode éprouvée',
    cible: 'Dirigeants de PME',
    acteur: 'Partenaire prescripteur',
    probleme: 'des difficultés à aligner leurs équipes sur une direction commune, du temps perdu sans décision',
    projection: { ca: '400 k€ de chiffre d\'affaires', clients: '50 clients actifs', offre: '2 offres packagées', organisation: 'une équipe de 4 personnes' },
    valeurs: [
      { nom: 'Simplicité', traduction: 'Jamais plus de trois étapes dans un processus' },
      { nom: 'Confiance', traduction: 'On dit ce qu\'on fait, on fait ce qu\'on dit' },
      { nom: 'Exigence', traduction: 'On livre ce dont on serait fier' },
    ],
  },
};

export const EXEMPLES_PAR_DEFAUT: JeuExemples = { ...JEU_PAR_DEFAUT, fit: FIT_PAR_DEFAUT, finance: FINANCE_PAR_DEFAUT };

/* Un jeu par famille de la liste des secteurs. Les clés sont les intitulés
 * exacts de `secteurs.ts` : un test vérifie qu'aucune famille n'est oubliée. */
const JEUX_PAR_FAMILLE: Record<string, JeuSansFit> = {
  'Artisanat & bâtiment': {
    objectifs: [
      { libelle: 'Plus de chantiers', titre: 'Augmenter le nombre de chantiers signés', cible: '60', unite: 'chantiers' },
      { libelle: 'Devis acceptés', titre: 'Améliorer mon taux de devis acceptés', cible: '50', unite: '% de devis signés' },
      { libelle: 'Recruter', titre: 'Recruter et former un apprenti', cible: '2', unite: 'apprentis' },
      { libelle: 'Marge chantier', titre: 'Mieux chiffrer pour protéger ma marge', cible: '25', unite: '% de marge' },
      { libelle: 'Avis clients', titre: 'Devenir le mieux noté de mon secteur', cible: '50', unite: 'avis 5 étoiles' },
      { libelle: 'Moins de trajets', titre: 'Réduire les trajets en regroupant les chantiers', cible: '5', unite: 'h/semaine gagnées' },
    ],
    amorces: [
      'Ex : Devenir l’artisan de référence de ma commune…',
      'Ex : Constituer une équipe fiable et formée…',
      'Ex : Développer une activité de rénovation énergétique…',
    ],
    objectifTrimestre: 'Remplir le planning du trimestre',
    resultatCle: { titre: 'Envoyer 40 devis', cible: '40', unite: 'devis' },
    action: 'Relancer les 10 devis sans réponse',
    produit: {
      nom: 'Mon service',
      promesse: 'Dépanner en moins de 2 heures, 7 jours sur 7',
      prenom: 'Sylvie',
      situation: 'Propriétaire d’une maison ancienne',
      probleme: 'Elle attend trois jours un artisan disponible',
      aujourdhui: 'Elle appelle plusieurs numéros au hasard',
    },
    vision: {
      pourquoi: 'Nous croyons qu\'un chantier bien fait, livré dans les délais, change la vie de ceux qui l\'attendent',
      comment: 'Grâce à des devis clairs, des délais tenus et un chantier laissé propre',
      quoi: 'Nous réalisons des installations et des rénovations chez les particuliers et les entreprises',
      cible: 'Propriétaires de maisons anciennes',
      acteur: 'Fournisseur de matériaux',
      probleme: 'des artisans injoignables, des devis flous et des chantiers qui traînent, au point de renoncer à leurs travaux',
      projection: { ca: '350 k€ de chiffre d\'affaires', clients: '80 chantiers dans l\'année', offre: '2 prestations phares', organisation: 'un binôme et un apprenti' },
      valeurs: [
        { nom: 'Parole tenue', traduction: 'Un délai annoncé est un délai respecté' },
        { nom: 'Propreté', traduction: 'Le chantier est rendu net chaque soir' },
        { nom: 'Franchise', traduction: 'On dit quand on ne sait pas faire' },
      ],
    },
  },

  'Immobilier & habitat': {
    objectifs: [
      { libelle: 'Plus de mandats', titre: 'Rentrer davantage de mandats exclusifs', cible: '40', unite: 'mandats' },
      { libelle: 'Délai de vente', titre: 'Vendre plus vite en affinant les prix', cible: '60', unite: 'jours de délai' },
      { libelle: 'Recommandation', titre: 'Faire de mes clients mes meilleurs prescripteurs', cible: '30', unite: '% par recommandation' },
      { libelle: 'Gestion locative', titre: 'Développer le portefeuille de gestion locative', cible: '80', unite: 'lots gérés' },
      { libelle: 'Visites qualifiées', titre: 'Ne faire visiter qu’à des acheteurs sérieux', cible: '5', unite: 'visites par vente' },
      { libelle: 'Notoriété locale', titre: 'Devenir l’agence de référence du quartier', cible: '100', unite: 'avis clients' },
    ],
    amorces: [
      'Ex : Devenir l’agence incontournable de ma ville…',
      'Ex : Structurer une équipe de négociateurs…',
      'Ex : Développer la gestion locative…',
    ],
    objectifTrimestre: 'Renforcer la rentrée de mandats',
    resultatCle: { titre: 'Signer 12 mandats exclusifs', cible: '12', unite: 'mandats' },
    action: 'Faire 20 estimations gratuites ce mois-ci',
    produit: {
      nom: 'Mon service',
      promesse: 'Estimer un bien en 24 heures, sans engagement',
      prenom: 'Marc',
      situation: 'Propriétaire qui veut vendre',
      probleme: 'Il ne sait pas à quel prix mettre son bien',
      aujourdhui: 'Il compare des annonces sur internet',
    },
    vision: {
      pourquoi: 'Nous croyons qu\'un projet immobilier réussi commence par une estimation honnête',
      comment: 'Grâce à une connaissance fine du quartier et un accompagnement de bout en bout',
      quoi: 'Nous accompagnons les vendeurs et les acquéreurs sur notre secteur',
      cible: 'Propriétaires qui vendent pour la première fois',
      acteur: 'Notaire partenaire',
      probleme: 'des estimations fantaisistes, des visites inutiles et des ventes qui s\'éternisent faute de conseil',
      projection: { ca: '400 k€ d\'honoraires', clients: '45 transactions', offre: 'vente et gestion locative', organisation: 'trois négociateurs' },
      valeurs: [
        { nom: 'Honnêteté', traduction: 'On annonce le prix du marché, pas celui qui fait signer' },
        { nom: 'Disponibilité', traduction: 'On rappelle dans la journée' },
        { nom: 'Discrétion', traduction: 'Ce qui se dit chez le client y reste' },
      ],
    },
  },

  'Conseil & accompagnement': {
    objectifs: [
      { libelle: 'Missions récurrentes', titre: 'Passer des missions ponctuelles à l’accompagnement long', cible: '10', unite: 'clients au forfait' },
      { libelle: 'Tarif journalier', titre: 'Revaloriser mon tarif journalier', cible: '1200', unite: '€ par jour' },
      { libelle: 'Remplir l’agenda', titre: 'Remplir mon agenda trois mois à l’avance', cible: '80', unite: '% de jours vendus' },
      { libelle: 'Me faire connaître', titre: 'Être identifié comme expert sur ma spécialité', cible: '2000', unite: 'abonnés' },
      { libelle: 'Offre packagée', titre: 'Transformer mon savoir-faire en offre claire', cible: '3', unite: 'offres vendues' },
      { libelle: 'Recommandation', titre: 'Développer le bouche-à-oreille', cible: '50', unite: '% par recommandation' },
    ],
    amorces: [
      'Ex : Devenir la référence sur ma spécialité…',
      'Ex : Sécuriser un revenu récurrent…',
      'Ex : Lancer une offre collective…',
    ],
    objectifTrimestre: 'Construire un flux régulier de prospects',
    resultatCle: { titre: 'Tenir 20 rendez-vous de découverte', cible: '20', unite: 'rendez-vous' },
    action: 'Publier un retour d’expérience client cette semaine',
    produit: {
      nom: 'Mon accompagnement',
      promesse: 'Aider un dirigeant à y voir clair en trois séances',
      prenom: 'Sophie',
      situation: 'Dirigeante d’une PME de 15 personnes',
      probleme: 'Elle décide seule et doute de ses arbitrages',
      aujourdhui: 'Elle en parle à son expert-comptable',
    },
    vision: {
      pourquoi: 'Nous croyons que chaque dirigeant mérite un cap clair et une équipe alignée',
      comment: 'Grâce à une méthode structurée, des rituels courts et un accompagnement ancré dans le réel',
      quoi: 'Nous accompagnons les dirigeants de PME dans leurs décisions structurantes',
      cible: 'Dirigeants de PME de 10 à 50 personnes',
      acteur: 'Réseau d\'entrepreneurs prescripteur',
      probleme: 'des difficultés à aligner leurs équipes sur une direction commune, du temps perdu en réunions sans décision',
      projection: { ca: '180 k€ de chiffre d\'affaires', clients: '12 clients accompagnés', offre: '2 offres packagées', organisation: 'seul, avec deux partenaires' },
      valeurs: [
        { nom: 'Clarté', traduction: 'Aucun jargon dans nos livrables' },
        { nom: 'Exigence', traduction: 'On dit ce qui fâche quand c\'est utile' },
        { nom: 'Indépendance', traduction: 'On refuse une mission qu\'on ne croit pas utile' },
      ],
    },
  },

  'Comptabilité, finance & juridique': {
    objectifs: [
      { libelle: 'Portefeuille clients', titre: 'Développer le portefeuille de clients', cible: '150', unite: 'clients' },
      { libelle: 'Missions à valeur', titre: 'Passer de la saisie au conseil', cible: '40', unite: '% de missions conseil' },
      { libelle: 'Dématérialiser', titre: 'Dématérialiser la collecte des pièces', cible: '90', unite: '% de pièces numériques' },
      { libelle: 'Fidéliser', titre: 'Réduire le nombre de départs de clients', cible: '95', unite: '% de clients fidèles' },
      { libelle: 'Recruter', titre: 'Renforcer l’équipe pour absorber la croissance', cible: '3', unite: 'collaborateurs' },
      { libelle: 'Périodes de pointe', titre: 'Lisser la charge des périodes fiscales', cible: '10', unite: 'h/semaine gagnées' },
    ],
    amorces: [
      'Ex : Devenir le cabinet de référence des indépendants…',
      'Ex : Développer une offre de conseil…',
      'Ex : Automatiser la production comptable…',
    ],
    objectifTrimestre: 'Développer les missions de conseil',
    resultatCle: { titre: 'Proposer un bilan conseil à 30 clients', cible: '30', unite: 'clients' },
    action: 'Appeler 10 clients pour un point annuel',
    produit: {
      nom: 'Mon service',
      promesse: 'Donner à un dirigeant ses chiffres clés chaque mois',
      prenom: 'Karim',
      situation: 'Gérant d’une société de services',
      probleme: 'Il découvre ses résultats six mois trop tard',
      aujourdhui: 'Il attend le bilan annuel',
    },
    vision: {
      pourquoi: 'Nous croyons qu\'un dirigeant doit comprendre ses chiffres pour décider sereinement',
      comment: 'Grâce à des points réguliers, un langage simple et des outils qui évitent la paperasse',
      quoi: 'Nous tenons la comptabilité et conseillons les dirigeants tout au long de l\'année',
      cible: 'Indépendants et TPE',
      acteur: 'Éditeur du logiciel comptable',
      probleme: 'des chiffres découverts trop tard, des échéances subies et l\'impression de payer sans comprendre',
      projection: { ca: '600 k€ d\'honoraires', clients: '150 clients', offre: 'une offre de conseil mensuelle', organisation: 'une équipe de six' },
      valeurs: [
        { nom: 'Pédagogie', traduction: 'On explique jusqu\'à ce que ce soit compris' },
        { nom: 'Anticipation', traduction: 'Aucune échéance découverte la veille' },
        { nom: 'Confidentialité', traduction: 'Les dossiers restent entre nous' },
      ],
    },
  },

  'Santé, social & bien-être': {
    objectifs: [
      { libelle: 'Remplir l’agenda', titre: 'Remplir mon planning de consultations', cible: '80', unite: '% de créneaux occupés' },
      { libelle: 'Moins d’absences', titre: 'Réduire les rendez-vous non honorés', cible: '5', unite: '% d’absences' },
      { libelle: 'Suivi régulier', titre: 'Installer un vrai suivi dans la durée', cible: '6', unite: 'séances par personne' },
      { libelle: 'Nouvelle pratique', titre: 'Me former et proposer une nouvelle approche', cible: '1', unite: 'nouvelle pratique' },
      { libelle: 'Travail en réseau', titre: 'Développer les liens avec les autres praticiens', cible: '15', unite: 'partenaires' },
      { libelle: 'Équilibre', titre: 'Préserver mon équilibre en organisant mes semaines', cible: '4', unite: 'jours travaillés' },
    ],
    amorces: [
      'Ex : Être reconnu pour mon approche…',
      'Ex : Ouvrir un second cabinet…',
      'Ex : Travailler en équipe pluridisciplinaire…',
    ],
    objectifTrimestre: 'Stabiliser la file active',
    resultatCle: { titre: 'Accueillir 25 nouvelles personnes', cible: '25', unite: 'personnes' },
    action: 'Rencontrer 3 confrères pour échanger des adressages',
    produit: {
      nom: 'Mon accompagnement',
      promesse: 'Proposer un suivi entre deux consultations',
      prenom: 'Nadia',
      situation: 'Active, deux enfants, peu de temps',
      probleme: 'Elle abandonne son suivi au bout de trois semaines',
      aujourdhui: 'Elle prend rendez-vous quand ça ne va plus',
    },
    vision: {
      pourquoi: 'Nous croyons que prendre soin de quelqu\'un demande du temps et de l\'écoute',
      comment: 'Grâce à des séances qui ne se ressemblent pas et un suivi entre les rendez-vous',
      quoi: 'Nous accompagnons les personnes qui souhaitent aller mieux, durablement',
      cible: 'Actifs de 30 à 50 ans',
      acteur: 'Médecin traitant prescripteur',
      probleme: 'des parcours morcelés, des rendez-vous trop courts et l\'impression de repartir sans réponse',
      projection: { ca: '90 k€ de chiffre d\'affaires', clients: '120 personnes suivies', offre: 'un accompagnement en 6 séances', organisation: 'un cabinet partagé' },
      valeurs: [
        { nom: 'Écoute', traduction: 'On ne coupe jamais la parole' },
        { nom: 'Justesse', traduction: 'On oriente ailleurs quand ce n\'est pas notre domaine' },
        { nom: 'Régularité', traduction: 'Un suivi, pas des rendez-vous isolés' },
      ],
    },
  },

  'Commerce & services': {
    objectifs: [
      { libelle: 'Chiffre d’affaires', titre: 'Augmenter le chiffre d’affaires du magasin', cible: '500', unite: 'k€ de CA' },
      { libelle: 'Panier moyen', titre: 'Faire progresser le panier moyen', cible: '45', unite: '€ par panier' },
      { libelle: 'Clients fidèles', titre: 'Créer une clientèle qui revient', cible: '500', unite: 'clients fidèles' },
      { libelle: 'Vendre en ligne', titre: 'Ouvrir un second canal de vente en ligne', cible: '20', unite: '% des ventes' },
      { libelle: 'Stocks', titre: 'Réduire les invendus et les ruptures', cible: '10', unite: '% d’invendus' },
      { libelle: 'Équipe', titre: 'Constituer une équipe autonome en boutique', cible: '3', unite: 'vendeurs formés' },
    ],
    amorces: [
      'Ex : Devenir l’adresse incontournable du quartier…',
      'Ex : Ouvrir un deuxième point de vente…',
      'Ex : Développer la vente en ligne…',
    ],
    objectifTrimestre: 'Faire revenir les clients plus souvent',
    resultatCle: { titre: 'Inscrire 300 clients au programme de fidélité', cible: '300', unite: 'inscrits' },
    action: 'Mettre en avant trois produits en vitrine cette semaine',
    produit: {
      nom: 'Mon service',
      promesse: 'Faire livrer ses achats le jour même dans le quartier',
      prenom: 'Julie',
      situation: 'Travaille à plein temps, peu disponible',
      probleme: 'Elle arrive après la fermeture',
      aujourdhui: 'Elle commande en ligne ailleurs',
    },
    vision: {
      pourquoi: 'Nous croyons qu\'un commerce de quartier crée du lien autant qu\'il vend',
      comment: 'Grâce à une sélection exigeante, des conseils sincères et un accueil qui donne envie de revenir',
      quoi: 'Nous proposons des produits choisis et un service de proximité',
      cible: 'Habitants du quartier',
      acteur: 'Producteur local',
      probleme: 'des rayons impersonnels, des conseils absents et des horaires qui ne collent pas à leur vie',
      projection: { ca: '500 k€ de chiffre d\'affaires', clients: '500 clients fidèles', offre: 'boutique et vente en ligne', organisation: 'trois vendeurs formés' },
      valeurs: [
        { nom: 'Conseil sincère', traduction: 'On dit quand un produit ne convient pas' },
        { nom: 'Proximité', traduction: 'On connaît nos clients par leur prénom' },
        { nom: 'Qualité', traduction: 'On ne vend que ce qu\'on utiliserait' },
      ],
    },
  },

  'Numérique & innovation': {
    objectifs: [
      { libelle: 'Revenu récurrent', titre: 'Installer un revenu mensuel récurrent', cible: '20', unite: 'k€ par mois' },
      { libelle: 'Premiers clients', titre: 'Convaincre mes premiers clients payants', cible: '30', unite: 'clients payants' },
      { libelle: 'Rétention', titre: 'Garder les clients au-delà de six mois', cible: '90', unite: '% de rétention' },
      { libelle: 'Acquisition', titre: 'Construire un canal d’acquisition régulier', cible: '200', unite: 'inscriptions par mois' },
      { libelle: 'Mise en production', titre: 'Livrer plus souvent et plus sereinement', cible: '20', unite: 'mises en production' },
      { libelle: 'Équipe produit', titre: 'Structurer une équipe produit', cible: '4', unite: 'recrutements' },
    ],
    amorces: [
      'Ex : Atteindre la rentabilité sans lever de fonds…',
      'Ex : Devenir la référence sur notre usage…',
      'Ex : Ouvrir un second marché…',
    ],
    objectifTrimestre: 'Transformer les essais en clients payants',
    resultatCle: { titre: 'Convertir 15 essais en abonnements', cible: '15', unite: 'abonnements' },
    action: 'Appeler 10 utilisateurs inactifs pour comprendre',
    produit: {
      nom: 'Mon produit',
      promesse: 'Faire gagner deux heures par semaine sur une tâche répétitive',
      prenom: 'Léa',
      situation: 'Responsable dans une PME',
      probleme: 'Elle recopie les mêmes données chaque semaine',
      aujourdhui: 'Un tableur et beaucoup de patience',
    },
    vision: {
      pourquoi: 'Nous croyons que le logiciel doit faire gagner du temps, pas en prendre',
      comment: 'Grâce à un produit simple, livré souvent, construit avec ceux qui l\'utilisent',
      quoi: 'Nous éditons un outil qui automatise une tâche répétitive du quotidien',
      cible: 'Responsables d\'équipe en PME',
      acteur: 'Investisseur principal',
      probleme: 'des heures perdues à recopier des données d\'un outil à l\'autre, sans jamais avoir le temps d\'y remédier',
      projection: { ca: '240 k€ de revenus récurrents', clients: '150 clients payants', offre: 'deux formules', organisation: 'une équipe de quatre' },
      valeurs: [
        { nom: 'Simplicité', traduction: 'Jamais plus de trois étapes pour une action' },
        { nom: 'Écoute produit', traduction: 'Chaque semaine, on parle à un utilisateur' },
        { nom: 'Transparence', traduction: 'Les incidents sont annoncés avant d\'être remarqués' },
      ],
    },
  },

  'Communication & création': {
    objectifs: [
      { libelle: 'Clients récurrents', titre: 'Passer des missions ponctuelles aux contrats annuels', cible: '8', unite: 'clients au forfait' },
      { libelle: 'Tarifs', titre: 'Revaloriser mes tarifs sur les nouvelles missions', cible: '30', unite: '% d’augmentation' },
      { libelle: 'Portfolio', titre: 'Montrer des références qui attirent mes clients cibles', cible: '10', unite: 'études de cas' },
      { libelle: 'Notoriété', titre: 'Faire connaître mon travail à ma cible', cible: '5000', unite: 'abonnés' },
      { libelle: 'Spécialisation', titre: 'Me spécialiser sur un secteur précis', cible: '60', unite: '% du CA sur ce secteur' },
      { libelle: 'Rentabilité', titre: 'Mieux estimer mes projets pour arrêter de perdre du temps', cible: '20', unite: '% de dépassement' },
    ],
    amorces: [
      'Ex : Devenir l’agence de référence d’un secteur…',
      'Ex : Créer un studio de trois personnes…',
      'Ex : Lancer une offre packagée…',
    ],
    objectifTrimestre: 'Attirer des clients mieux qualifiés',
    resultatCle: { titre: 'Publier 6 études de cas', cible: '6', unite: 'études de cas' },
    action: 'Écrire le retour d’expérience du dernier projet livré',
    produit: {
      nom: 'Mon offre',
      promesse: 'Livrer une identité complète en trois semaines',
      prenom: 'Thomas',
      situation: 'Fondateur qui lance son activité',
      probleme: 'Il n’ose pas montrer son site à ses prospects',
      aujourdhui: 'Un logo fait avec un outil en ligne',
    },
    vision: {
      pourquoi: 'Nous croyons qu\'une marque juste vaut mieux qu\'une marque tape-à-l\'œil',
      comment: 'Grâce à un travail d\'écoute avant tout dessin, et des livrables qui servent vraiment',
      quoi: 'Nous créons des identités et des supports pour des entreprises qui se lancent ou se réinventent',
      cible: 'Fondateurs qui lancent leur activité',
      acteur: 'Imprimeur partenaire',
      probleme: 'une image qui ne leur ressemble pas, faite vite, qu\'ils n\'osent pas montrer à leurs clients',
      projection: { ca: '150 k€ de chiffre d\'affaires', clients: '20 projets livrés', offre: 'une offre packagée', organisation: 'un studio de trois' },
      valeurs: [
        { nom: 'Écoute', traduction: 'On comprend avant de proposer' },
        { nom: 'Utilité', traduction: 'Chaque livrable a un usage précis' },
        { nom: 'Tenue des délais', traduction: 'Une date annoncée est tenue' },
      ],
    },
  },

  'Industrie & logistique': {
    objectifs: [
      { libelle: 'Productivité', titre: 'Augmenter la production sans allonger les journées', cible: '15', unite: '% de production' },
      { libelle: 'Qualité', titre: 'Réduire les rebuts et les retours', cible: '2', unite: '% de rebuts' },
      { libelle: 'Délais', titre: 'Tenir les délais annoncés aux clients', cible: '95', unite: '% livré à l’heure' },
      { libelle: 'Sécurité', titre: 'Faire baisser les accidents et les presque-accidents', cible: '0', unite: 'accident' },
      { libelle: 'Maintenance', titre: 'Passer d’une maintenance subie à une maintenance prévue', cible: '80', unite: '% de préventif' },
      { libelle: 'Polyvalence', titre: 'Former les équipes à plusieurs postes', cible: '10', unite: 'personnes formées' },
    ],
    amorces: [
      'Ex : Doubler la capacité de production…',
      'Ex : Être le fournisseur le plus fiable de nos clients…',
      'Ex : Réduire notre empreinte…',
    ],
    objectifTrimestre: 'Fiabiliser les délais de livraison',
    resultatCle: { titre: 'Livrer 95% des commandes à l’heure', cible: '95', unite: '% à l’heure' },
    action: 'Analyser les 5 dernières livraisons en retard',
    produit: {
      nom: 'Mon service',
      promesse: 'Suivre une commande en temps réel, sans appeler',
      prenom: 'Pierre',
      situation: 'Responsable achats chez un client',
      probleme: 'Il relance trois fois pour savoir où en est sa commande',
      aujourdhui: 'Des appels et des courriels',
    },
    vision: {
      pourquoi: 'Nous croyons qu\'un client bien livré est un client qui revient',
      comment: 'Grâce à des procédés fiables, une maintenance anticipée et des équipes polyvalentes',
      quoi: 'Nous produisons et livrons des pièces pour nos donneurs d\'ordre',
      cible: 'Donneurs d\'ordre industriels',
      acteur: 'Transporteur partenaire',
      probleme: 'des retards en cascade, des non-conformités découvertes trop tard et des relances permanentes',
      projection: { ca: '2 M€ de chiffre d\'affaires', clients: '25 clients réguliers', offre: 'deux lignes de production', organisation: 'une équipe de vingt' },
      valeurs: [
        { nom: 'Fiabilité', traduction: 'Ce qui est promis est livré à l\'heure' },
        { nom: 'Sécurité', traduction: 'Aucun raccourci sur les règles' },
        { nom: 'Amélioration continue', traduction: 'Chaque incident donne lieu à une action' },
      ],
    },
  },

  'Éducation, sport & loisirs': {
    objectifs: [
      { libelle: 'Remplir les sessions', titre: 'Remplir les sessions de formation', cible: '90', unite: '% de places occupées' },
      { libelle: 'Adhérents', titre: 'Faire grandir le nombre d’adhérents', cible: '300', unite: 'adhérents' },
      { libelle: 'Fidélité', titre: 'Faire revenir les participants la saison suivante', cible: '70', unite: '% de réinscription' },
      { libelle: 'Nouvelle offre', titre: 'Lancer un nouveau format de séance', cible: '2', unite: 'nouveaux formats' },
      { libelle: 'Satisfaction', titre: 'Être recommandé par les participants', cible: '9', unite: '/10 de satisfaction' },
      { libelle: 'Financement', titre: 'Diversifier les sources de financement', cible: '3', unite: 'partenaires' },
    ],
    amorces: [
      'Ex : Devenir le club de référence du territoire…',
      'Ex : Ouvrir une nouvelle section…',
      'Ex : Professionnaliser l’encadrement…',
    ],
    objectifTrimestre: 'Réussir la rentrée des inscriptions',
    resultatCle: { titre: 'Enregistrer 120 inscriptions', cible: '120', unite: 'inscriptions' },
    action: 'Organiser une séance découverte gratuite',
    produit: {
      nom: 'Mon offre',
      promesse: 'Progresser à son rythme avec un suivi personnalisé',
      prenom: 'Hugo',
      situation: 'Débutant, horaires irréguliers',
      probleme: 'Il abandonne au bout d’un mois',
      aujourdhui: 'Des vidéos trouvées en ligne',
    },
    vision: {
      pourquoi: 'Nous croyons que progresser doit rester un plaisir',
      comment: 'Grâce à des groupes à taille humaine, un encadrement formé et une progression visible',
      quoi: 'Nous proposons des séances et des formations tout au long de l\'année',
      cible: 'Débutants adultes',
      acteur: 'Collectivité qui subventionne',
      probleme: 'des cours trop grands, des progrès invisibles et l\'envie d\'abandonner au bout d\'un mois',
      projection: { ca: '200 k€ de chiffre d\'affaires', clients: '300 adhérents', offre: 'trois formats de séance', organisation: 'quatre encadrants' },
      valeurs: [
        { nom: 'Bienveillance', traduction: 'Personne n\'est laissé au fond de la salle' },
        { nom: 'Progression', traduction: 'Chacun sait où il en est' },
        { nom: 'Régularité', traduction: 'Les séances ont lieu, quoi qu\'il arrive' },
      ],
    },
  },

  'Tourisme & restauration': {
    objectifs: [
      { libelle: 'Taux de remplissage', titre: 'Mieux remplir la salle en semaine', cible: '75', unite: '% de remplissage' },
      { libelle: 'Ticket moyen', titre: 'Faire progresser le ticket moyen', cible: '32', unite: '€ par couvert' },
      { libelle: 'Réservations directes', titre: 'Réduire la dépendance aux plateformes', cible: '60', unite: '% en direct' },
      { libelle: 'Avis clients', titre: 'Devenir la meilleure adresse du secteur', cible: '4.8', unite: '/5 de note' },
      { libelle: 'Coût matière', titre: 'Maîtriser le coût matière et le gaspillage', cible: '30', unite: '% de coût matière' },
      { libelle: 'Fidéliser l’équipe', titre: 'Garder mon équipe toute la saison', cible: '90', unite: '% de l’équipe' },
    ],
    amorces: [
      'Ex : Devenir l’adresse dont on parle en ville…',
      'Ex : Ouvrir un second établissement…',
      'Ex : Développer une clientèle d’habitués…',
    ],
    objectifTrimestre: 'Remplir les services du midi',
    resultatCle: { titre: 'Servir 600 couverts le midi', cible: '600', unite: 'couverts' },
    action: 'Proposer une formule déjeuner rapide aux bureaux voisins',
    produit: {
      nom: 'Mon offre',
      promesse: 'Déjeuner bien et vite, en moins de 30 minutes',
      prenom: 'Camille',
      situation: 'Salariée avec une pause courte',
      probleme: 'Elle n’a pas le temps de s’asseoir',
      aujourdhui: 'Un sandwich acheté en vitesse',
    },
    vision: {
      pourquoi: 'Nous croyons qu\'un bon repas et un bon accueil font une vraie journée',
      comment: 'Grâce à des produits frais, une carte courte et une équipe qui reste',
      quoi: 'Nous accueillons nos clients midi et soir, sur place et à emporter',
      cible: 'Salariés du quartier le midi',
      acteur: 'Producteur local',
      probleme: 'des cartes interminables, des produits sans goût et un service pressé qui gâche la pause',
      projection: { ca: '450 k€ de chiffre d\'affaires', clients: '25 000 couverts', offre: 'une carte courte de saison', organisation: 'une brigade de six' },
      valeurs: [
        { nom: 'Produit frais', traduction: 'Rien de surgelé dans nos assiettes' },
        { nom: 'Accueil', traduction: 'On dit bonjour à chacun' },
        { nom: 'Respect de l\'équipe', traduction: 'Les plannings sont connus à l\'avance' },
      ],
    },
  },

  'Agriculture & environnement': {
    objectifs: [
      { libelle: 'Vente directe', titre: 'Développer la vente directe aux particuliers', cible: '40', unite: '% du CA en direct' },
      { libelle: 'Marge', titre: 'Améliorer la marge sur les productions principales', cible: '30', unite: '% de marge' },
      { libelle: 'Transformer', titre: 'Transformer une partie de la production', cible: '3', unite: 'produits transformés' },
      { libelle: 'Transition', titre: 'Engager une transition sur les pratiques', cible: '50', unite: '% de surface convertie' },
      { libelle: 'Débouchés', titre: 'Sécuriser des débouchés à l’année', cible: '5', unite: 'contrats' },
      { libelle: 'Charge de travail', titre: 'Alléger les pointes de travail', cible: '2', unite: 'jours de repos par semaine' },
    ],
    amorces: [
      'Ex : Vivre correctement de mon exploitation…',
      'Ex : Développer un circuit court…',
      'Ex : Transmettre l’exploitation dans de bonnes conditions…',
    ],
    objectifTrimestre: 'Lancer la vente directe',
    resultatCle: { titre: 'Constituer 80 paniers hebdomadaires', cible: '80', unite: 'paniers' },
    action: 'Rencontrer 5 commerçants du secteur',
    produit: {
      nom: 'Mon offre',
      promesse: 'Recevoir chaque semaine des produits de la ferme voisine',
      prenom: 'Martine',
      situation: 'Habite en périphérie, cuisine tous les jours',
      probleme: 'Elle ne sait pas d’où viennent ses légumes',
      aujourdhui: 'Le supermarché du coin',
    },
    vision: {
      pourquoi: 'Nous croyons qu\'on peut nourrir correctement sans épuiser la terre',
      comment: 'Grâce à des pratiques choisies, des circuits courts et un lien direct avec ceux qui consomment',
      quoi: 'Nous produisons et vendons nos récoltes, en direct et auprès de commerçants',
      cible: 'Familles du secteur',
      acteur: 'Coopérative',
      probleme: 'des produits anonymes venus de loin, sans savoir qui les a cultivés ni comment',
      projection: { ca: '180 k€ de chiffre d\'affaires', clients: '200 paniers par semaine', offre: 'paniers et vente à la ferme', organisation: 'deux associés et un saisonnier' },
      valeurs: [
        { nom: 'Transparence', traduction: 'On dit comment on cultive' },
        { nom: 'Saison', traduction: 'On ne vend que ce qui pousse maintenant' },
        { nom: 'Juste prix', traduction: 'Un prix qui fait vivre les deux côtés' },
      ],
    },
  },

  'Secteur public & intérêt général': {
    objectifs: [
      { libelle: 'Bénéficiaires', titre: 'Toucher davantage de bénéficiaires', cible: '1000', unite: 'bénéficiaires' },
      { libelle: 'Financements', titre: 'Sécuriser les financements sur plusieurs années', cible: '3', unite: 'conventions pluriannuelles' },
      { libelle: 'Bénévoles', titre: 'Renforcer et fidéliser l’équipe bénévole', cible: '50', unite: 'bénévoles actifs' },
      { libelle: 'Faire connaître', titre: 'Faire connaître l’action auprès du public', cible: '5000', unite: 'personnes touchées' },
      { libelle: 'Mesurer l’impact', titre: 'Mesurer et démontrer l’impact des actions', cible: '5', unite: 'indicateurs suivis' },
      { libelle: 'Partenariats', titre: 'Construire des partenariats durables', cible: '10', unite: 'partenaires' },
    ],
    amorces: [
      'Ex : Devenir l’acteur de référence sur notre cause…',
      'Ex : Pérenniser nos financements…',
      'Ex : Essaimer notre action sur un autre territoire…',
    ],
    objectifTrimestre: 'Préparer les demandes de subvention',
    resultatCle: { titre: 'Déposer 6 dossiers de financement', cible: '6', unite: 'dossiers' },
    action: 'Rencontrer deux financeurs potentiels',
    produit: {
      nom: 'Notre action',
      promesse: 'Accompagner les familles dans leurs démarches administratives',
      prenom: 'Amina',
      situation: 'Parent isolé, peu à l’aise avec le numérique',
      probleme: 'Elle renonce à des aides faute de savoir les demander',
      aujourdhui: 'Elle demande à un proche',
    },
    vision: {
      pourquoi: 'Nous croyons que personne ne devrait renoncer à ses droits faute d\'accompagnement',
      comment: 'Grâce à des permanences régulières, des bénévoles formés et un langage compréhensible',
      quoi: 'Nous accompagnons les personnes dans leurs démarches et leurs projets',
      cible: 'Familles du territoire',
      acteur: 'Collectivité financeuse',
      probleme: 'des démarches illisibles, des guichets fermés et l\'abandon avant d\'avoir obtenu quoi que ce soit',
      projection: { ca: '150 k€ de budget', clients: '1 000 bénéficiaires', offre: 'permanences et ateliers', organisation: 'deux salariés et 40 bénévoles' },
      valeurs: [
        { nom: 'Inconditionnalité', traduction: 'On accueille sans condition' },
        { nom: 'Clarté', traduction: 'On explique sans jargon administratif' },
        { nom: 'Durée', traduction: 'On ne lâche pas en cours de route' },
      ],
    },
  },

  Autre: JEU_PAR_DEFAUT,
};

/** Chaque jeu complété de ses exemples Fit et Finance ; « Autre » reste le jeu générique. */
export const EXEMPLES_PAR_FAMILLE: Record<string, JeuExemples> = Object.fromEntries(
  Object.entries(JEUX_PAR_FAMILLE).map(([famille, jeu]) => [
    famille,
    jeu === JEU_PAR_DEFAUT
      ? EXEMPLES_PAR_DEFAUT
      : {
          ...jeu,
          fit: FIT_PAR_FAMILLE[famille] ?? FIT_PAR_DEFAUT,
          finance: FINANCE_PAR_FAMILLE[famille] ?? FINANCE_PAR_DEFAUT,
        },
  ])
);

/**
 * Le jeu d'exemples correspondant à une activité.
 * Repli sur les exemples génériques si l'activité est absente, inconnue, ou si
 * sa famille n'a pas encore de jeu dédié.
 */
export function exemplesPour(activite: string | undefined | null): JeuExemples {
  const famille = familleDe(activite);
  if (!famille) return EXEMPLES_PAR_DEFAUT;
  return EXEMPLES_PAR_FAMILLE[famille] ?? EXEMPLES_PAR_DEFAUT;
}
