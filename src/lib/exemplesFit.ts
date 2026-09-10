/*
 * Exemples de l'atelier Fit, par famille de métiers.
 *
 * Même règle que le reste de `exemples.ts` : une personne qui a choisi son
 * domaine d'activité lit des exemples de son métier, les autres lisent ceux de
 * la maquette `fit-atelier.html`. Ce fichier est rattaché au jeu complet dans
 * `exemples.ts` (champ `fit`) ; un test vérifie qu'aucune famille n'est oubliée.
 *
 * Les textes sont écrits sans « Ex : » ni points de suspension : c'est la page
 * qui les habille, comme dans la maquette.
 */

export interface ExemplesFit {
  /** Étape 1 — l'offre ; `avant` est le contre-exemple du conseil. */
  offre: { nom: string; valeur: string; limite: string; pitch: string; avant: string };
  /** Étape 2 — la différenciation. */
  avantage: string;
  mieux: string;
  /** Ce qu'un client dit de vous quand il vous recommande, entre guillemets. */
  differencePercue: string;
  /** Étape 3 — une ligne du tableau, puis les deux questions. */
  concurrent: { nom: string; bien: string; avantage: string };
  raison: string;
  sans: string;
  /** Étape 4 — un verbatim signé, puis les indicateurs chiffrés. */
  verbatim: string;
  signaux: { retention: string; organique: string; nps: string; autre: string };
}

/** Sans métier choisi : les exemples de la maquette. */
export const FIT_PAR_DEFAUT: ExemplesFit = {
  offre: {
    nom: 'Accompagnement stratégique dirigeant',
    valeur: 'Clarifier sa direction stratégique, aligner ses équipes et gagner en sérénité dans la prise de décision',
    limite: 'Ce n’est pas de la formation, ni du conseil opérationnel au quotidien',
    pitch: 'J’aide les dirigeants de PME à construire un cap stratégique clair, en moins de 2h par mois',
    avant: 'Accompagnement stratégique et opérationnel des organisations.',
  },
  avantage: 'Une méthode structurée en rituels courts (moins de 30 min), adaptée aux contraintes des dirigeants de PME',
  mieux: 'Là où les cabinets de conseil produisent des rapports, nous créons des rituels opérationnels actionnables immédiatement',
  differencePercue:
    '« Ce qui me plaît, c’est que vos rituels sont courts — je n’ai pas l’impression de perdre du temps, j’ai l’impression d’en gagner. »',
  concurrent: {
    nom: 'Cabinet de conseil classique',
    bien: 'Expertise sectorielle, réseau',
    avantage: 'Plus rapide, moins cher, plus opérationnel',
  },
  raison:
    'Parce que notre méthode est plus rapide à mettre en place et ne nécessite pas d’expertise en stratégie de leur part',
  sans: 'Ils avancent sans méthode, ou délèguent à un cabinet de conseil classique plus cher et moins opérationnel',
  verbatim: '« C’est la première fois que j’ai une vision claire de mon entreprise. » — Sophie M., dirigeante PME',
  signaux: {
    retention: '80% des clients renouvellent',
    organique: '60% des nouveaux clients par bouche-à-oreille',
    nps: 'NPS +42 sur les 6 derniers mois',
    autre: 'Taux d’upsell, durée moyenne contrat',
  },
};

/* Les clés sont les intitulés exacts des familles de `secteurs.ts`. */
export const FIT_PAR_FAMILLE: Record<string, ExemplesFit> = {
  'Artisanat & bâtiment': {
    offre: {
      nom: 'Dépannage plomberie en moins de 2 heures',
      valeur: 'Retrouver de l’eau chaude le jour même, sans passer sa journée au téléphone à chercher un artisan disponible',
      limite: 'Ce n’est pas de la rénovation complète de salle de bains, ni une intervention hors de notre secteur',
      pitch: 'Je dépanne les particuliers de l’agglomération en moins de 2 heures, avec un devis annoncé avant d’intervenir',
      avant: 'Travaux de plomberie, chauffage et sanitaire tous types.',
    },
    avantage: 'Un créneau d’intervention garanti dans la journée et un devis ferme donné avant de toucher à quoi que ce soit',
    mieux: 'Là où les réseaux de dépannage envoient un sous-traitant inconnu, c’est toujours le même artisan qui vient, et qui rappelle',
    differencePercue: '« Il est venu le jour même, il m’a dit le prix avant de commencer, et le chantier était propre. »',
    concurrent: {
      nom: 'Réseau national de dépannage',
      bien: 'Numéro unique, disponible 24h/24',
      avantage: 'Prix annoncé, artisan local, suivi après le chantier',
    },
    raison: 'Parce qu’on répond au téléphone, qu’on annonce un prix avant d’intervenir et qu’on laisse le chantier propre',
    sans: 'Ils attendent plusieurs jours un artisan disponible, ou bricolent eux-mêmes en attendant que ça casse vraiment',
    verbatim: '« Enfin un plombier qui rappelle et qui tient ses horaires. » — Sylvie, propriétaire d’une maison ancienne',
    signaux: {
      retention: '40% des clients nous rappellent pour un second chantier',
      organique: '70% des nouveaux chantiers par bouche-à-oreille',
      nps: '4,9/5 sur 60 avis en ligne',
      autre: 'Taux de devis signés, délai moyen d’intervention',
    },
  },

  'Immobilier & habitat': {
    offre: {
      nom: 'Estimation et vente accompagnée',
      valeur: 'Vendre au juste prix, dans un délai maîtrisé, sans subir des visites inutiles',
      limite: 'Ce n’est pas de la gestion locative, ni une simple mise en ligne d’annonce',
      pitch: 'J’aide les propriétaires du quartier à vendre au bon prix en moins de 90 jours, avec des visites réservées aux acheteurs sérieux',
      avant: 'Transactions immobilières, estimation, gestion.',
    },
    avantage: 'Une estimation argumentée sous 24 heures, fondée sur les ventes réelles du quartier et non sur les annonces',
    mieux: 'Là où les réseaux nationaux multiplient les mandats simples, nous travaillons en exclusivité avec un plan de vente écrit',
    differencePercue: '« Vous m’avez dit la vérité sur le prix dès le premier rendez-vous, et c’était vendu en six semaines. »',
    concurrent: {
      nom: 'Agence d’un réseau national',
      bien: 'Notoriété, grande visibilité des annonces',
      avantage: 'Connaissance fine du quartier, un seul interlocuteur',
    },
    raison: 'Parce qu’on annonce un prix réaliste dès l’estimation et qu’on qualifie les acquéreurs avant chaque visite',
    sans: 'Ils vendent entre particuliers, baissent leur prix plusieurs fois et laissent le bien s’éterniser en ligne',
    verbatim: '« Vous avez vendu en six semaines ce que je n’arrivais pas à vendre depuis un an. » — Marc, vendeur',
    signaux: {
      retention: '30% des vendeurs nous confient aussi leur achat',
      organique: '45% des mandats viennent de recommandations',
      nps: '4,8/5 sur 90 avis clients',
      autre: 'Délai moyen de vente, écart entre prix affiché et prix vendu',
    },
  },

  'Conseil & accompagnement': {
    offre: {
      nom: 'Accompagnement du dirigeant en 3 mois',
      valeur: 'Prendre du recul sur ses décisions, arbitrer plus vite et arrêter de porter seul chaque choix structurant',
      limite: 'Ce n’est pas de la formation, ni une mission de conseil qui décide à la place du dirigeant',
      pitch: 'J’aide les dirigeants de PME de 10 à 50 personnes à décider plus sereinement, en une séance toutes les deux semaines',
      avant: 'Coaching, conseil et accompagnement des organisations.',
    },
    avantage: 'Des séances courtes, centrées sur une décision réelle à prendre, avec un point d’étape écrit après chacune',
    mieux: 'Là où les cabinets livrent un rapport en fin de mission, nous travaillons sur les décisions de la semaine, au fil de l’eau',
    differencePercue: '« Je ressors de chaque séance avec une décision prise, pas avec une liste de choses à réfléchir. »',
    concurrent: {
      nom: 'Grand cabinet de conseil',
      bien: 'Méthodes éprouvées, équipes nombreuses',
      avantage: 'Proximité, disponibilité, prix accessible à une PME',
    },
    raison: 'Parce qu’on travaille sur leurs vraies décisions, à leur rythme, sans leur demander de devenir experts en stratégie',
    sans: 'Ils décident seuls, en parlent à leur expert-comptable, ou repoussent les décisions difficiles',
    verbatim: '« Pour la première fois, je sais où va mon entreprise. » — Sophie, dirigeante d’une PME de 15 personnes',
    signaux: {
      retention: '75% des clients prolongent au-delà de 3 mois',
      organique: '60% des nouveaux clients par recommandation',
      nps: 'NPS +45 sur les 12 derniers mois',
      autre: 'Durée moyenne d’accompagnement, taux de prolongation',
    },
  },

  'Comptabilité, finance & juridique': {
    offre: {
      nom: 'Tableau de bord mensuel du dirigeant',
      valeur: 'Connaître chaque mois sa trésorerie et sa marge, et anticiper ses échéances au lieu de les subir',
      limite: 'Ce n’est pas un logiciel à remplir soi-même, ni un simple dépôt de liasse fiscale une fois par an',
      pitch: 'Je donne aux dirigeants de TPE leurs chiffres clés chaque mois, expliqués en 30 minutes, pour décider en connaissance de cause',
      avant: 'Tenue comptable, fiscalité, social et juridique.',
    },
    avantage: 'Un rendez-vous mensuel de 30 minutes où les chiffres sont expliqués dans un langage de dirigeant, pas de comptable',
    mieux: 'Là où les cabinets traditionnels livrent un bilan six mois après la clôture, nous suivons l’année en temps réel',
    differencePercue: '« Pour la première fois, je comprends mes chiffres avant qu’il ne soit trop tard pour agir. »',
    concurrent: {
      nom: 'Cabinet comptable traditionnel',
      bien: 'Sérieux, relation de longue date',
      avantage: 'Chiffres mensuels, conseil proactif, pièces dématérialisées',
    },
    raison: 'Parce qu’on les appelle avant les échéances et qu’on traduit leurs chiffres en décisions concrètes',
    sans: 'Ils attendent le bilan annuel et découvrent leurs résultats six mois trop tard, ou tiennent un tableur à la main',
    verbatim: '« Je sais enfin où j’en suis sans attendre la fin de l’année. » — Karim, gérant d’une société de services',
    signaux: {
      retention: '95% des clients restent d’une année sur l’autre',
      organique: '50% des nouveaux dossiers apportés par nos clients',
      nps: 'NPS +38 sur l’enquête annuelle',
      autre: 'Part des missions de conseil, dossiers par collaborateur',
    },
  },

  'Santé, social & bien-être': {
    offre: {
      nom: 'Suivi en six séances',
      valeur: 'Aller mieux durablement, avec un suivi entre les rendez-vous plutôt que des consultations isolées',
      limite: 'Ce n’est pas un traitement médical, ni une prise en charge en urgence',
      pitch: 'J’accompagne les actifs de 30 à 50 ans qui veulent aller mieux durablement, en six séances et avec un contact entre deux rendez-vous',
      avant: 'Consultations et accompagnement bien-être.',
    },
    avantage: 'Un parcours construit sur six séances avec un point d’étape écrit, plutôt que des rendez-vous au coup par coup',
    mieux: 'Là où les consultations s’enchaînent sans lien, nous suivons une progression et restons joignables entre deux séances',
    differencePercue: '« J’ai l’impression d’être suivie, pas simplement reçue entre deux rendez-vous. »',
    concurrent: {
      nom: 'Praticien généraliste du quartier',
      bien: 'Disponibilité, remboursement',
      avantage: 'Suivi dans la durée, temps d’écoute, approche ciblée',
    },
    raison: 'Parce qu’on prend le temps d’écouter, qu’on suit une progression et qu’on oriente ailleurs quand ce n’est pas notre domaine',
    sans: 'Ils prennent rendez-vous quand ça ne va plus, puis abandonnent leur suivi au bout de trois semaines',
    verbatim: '« C’est la première fois que je tiens un suivi jusqu’au bout. » — Nadia, suivie depuis 6 mois',
    signaux: {
      retention: '70% des personnes vont au bout des six séances',
      organique: '55% des nouvelles personnes adressées par des patients ou des confrères',
      nps: '9,1/10 de satisfaction mesurée',
      autre: 'Taux d’absence, délai pour un premier rendez-vous',
    },
  },

  'Commerce & services': {
    offre: {
      nom: 'Livraison le jour même dans le quartier',
      valeur: 'Faire ses achats de qualité sans courir après les horaires d’ouverture',
      limite: 'Ce n’est pas une livraison nationale, ni une boutique en ligne généraliste',
      pitch: 'Je livre les habitants du quartier le jour même, avec les produits choisis et les conseils de la boutique',
      avant: 'Commerce de proximité, vente de produits divers.',
    },
    avantage: 'Une sélection courte et choisie, un vrai conseil, et une livraison le soir pour ceux qui travaillent tard',
    mieux: 'Là où les grandes surfaces vendent du volume, nous connaissons nos clients et leur disons quand un produit ne leur convient pas',
    differencePercue: '« Ici, on me conseille vraiment, et on me dit quand ce n’est pas le bon produit pour moi. »',
    concurrent: {
      nom: 'Grande surface de périphérie',
      bien: 'Prix bas, choix très large',
      avantage: 'Conseil, sélection de qualité, proximité et livraison',
    },
    raison: 'Parce qu’on les connaît par leur prénom, qu’on conseille sincèrement et qu’on s’adapte à leurs horaires',
    sans: 'Ils commandent sur une grande plateforme en ligne ou font leurs courses en grande surface le samedi',
    verbatim: '« Je viens pour les conseils autant que pour les produits. » — Julie, cliente depuis deux ans',
    signaux: {
      retention: '60% des clients reviennent au moins une fois par mois',
      organique: '40% des nouveaux clients viennent sur recommandation',
      nps: '4,7/5 sur 120 avis en ligne',
      autre: 'Panier moyen, fréquence de visite',
    },
  },

  'Numérique & innovation': {
    offre: {
      nom: 'Automatisation des saisies répétitives',
      valeur: 'Gagner deux heures par semaine en arrêtant de recopier les mêmes données d’un outil à l’autre',
      limite: 'Ce n’est pas un logiciel de gestion complet, ni un développement sur mesure',
      pitch: 'J’aide les responsables d’équipe en PME à supprimer leurs saisies répétitives, sans compétence technique, en moins d’une heure d’installation',
      avant: 'Solution logicielle innovante de gestion des données.',
    },
    avantage: 'Une mise en route en moins d’une heure, sans intégrateur, avec des connecteurs vers les outils déjà utilisés',
    mieux: 'Là où les éditeurs généralistes demandent des semaines de paramétrage, notre outil est utile dès le premier jour',
    differencePercue: '« Je l’ai installé un lundi, le mardi je ne recopiais déjà plus rien. »',
    concurrent: {
      nom: 'Éditeur de logiciel généraliste',
      bien: 'Couverture fonctionnelle très large',
      avantage: 'Prise en main immédiate, prix adapté aux PME',
    },
    raison: 'Parce qu’il est utile dès le premier jour et qu’il ne demande ni intégrateur ni formation',
    sans: 'Ils continuent avec un tableur et beaucoup de copier-coller, ou bricolent des macros que personne ne maintient',
    verbatim: '« J’ai récupéré deux heures par semaine dès le premier mois. » — Léa, responsable dans une PME',
    signaux: {
      retention: '90% des clients encore abonnés après 6 mois',
      organique: '35% des inscriptions viennent de recommandations',
      nps: 'NPS +48 sur les 6 derniers mois',
      autre: 'Conversion essai → abonnement, revenu récurrent mensuel',
    },
  },

  'Communication & création': {
    offre: {
      nom: 'Identité de marque en trois semaines',
      valeur: 'Avoir enfin une image qui ressemble à son entreprise et qu’on ose montrer à ses clients',
      limite: 'Ce n’est pas de l’animation de réseaux sociaux au quotidien, ni de la publicité payante',
      pitch: 'Je crée l’identité complète des fondateurs qui se lancent, en trois semaines, avec des supports prêts à l’emploi',
      avant: 'Création graphique, communication et design.',
    },
    avantage: 'Un temps d’écoute avant tout dessin, et des livrables pensés pour l’usage réel : devis, site, réseaux',
    mieux: 'Là où les plateformes en ligne livrent un logo seul, nous livrons une identité cohérente et les supports qui vont avec',
    differencePercue: '« Vous avez compris ce que je voulais dire avant que je sache l’exprimer. »',
    concurrent: {
      nom: 'Plateforme de logos en ligne',
      bien: 'Rapide, très peu cher',
      avantage: 'Écoute, cohérence de marque, supports utilisables',
    },
    raison: 'Parce qu’on écoute avant de proposer, qu’on tient les délais et que chaque livrable a un usage précis',
    sans: 'Ils font un logo avec un outil en ligne et n’osent pas montrer leur site à leurs prospects',
    verbatim: '« Je suis fier d’envoyer mes devis maintenant. » — Thomas, fondateur',
    signaux: {
      retention: '50% des clients reviennent pour un second projet',
      organique: '65% des projets viennent de recommandations',
      nps: 'NPS +52 sur les 20 derniers projets',
      autre: 'Taux de dépassement de budget, part des clients au forfait',
    },
  },

  'Industrie & logistique': {
    offre: {
      nom: 'Livraison à l’heure avec suivi de commande',
      valeur: 'Recevoir ses pièces à la date promise, sans relancer trois fois pour savoir où en est la commande',
      limite: 'Ce n’est pas de la production en très grande série, ni de la logistique internationale',
      pitch: 'Je produis et livre les pièces de nos donneurs d’ordre à la date annoncée, avec un suivi de commande consultable à tout moment',
      avant: 'Production industrielle et prestations logistiques.',
    },
    avantage: '95% des commandes livrées à la date promise, et un suivi de commande accessible sans appeler',
    mieux: 'Là où les grands sous-traitants font patienter les petites séries, nous les traitons avec le même engagement de délai',
    differencePercue: '« Avec vous, je n’ai plus besoin de relancer : la date annoncée est tenue. »',
    concurrent: {
      nom: 'Sous-traitant à bas coût à l’étranger',
      bien: 'Prix unitaire très bas',
      avantage: 'Délais tenus, réactivité, qualité contrôlée sur place',
    },
    raison: 'Parce qu’on tient les délais annoncés et qu’on prévient avant, jamais après, quand un aléa survient',
    sans: 'Ils multiplient les fournisseurs pour se couvrir, gonflent leurs stocks et relancent en permanence',
    verbatim: '« Vous êtes le seul fournisseur que je n’ai jamais besoin de relancer. » — Pierre, responsable achats',
    signaux: {
      retention: '90% des donneurs d’ordre renouvellent leurs commandes',
      organique: '30% des nouveaux clients viennent de recommandations',
      nps: 'Taux de service de 96% sur l’année',
      autre: 'Taux de non-conformité, délai moyen de livraison',
    },
  },

  'Éducation, sport & loisirs': {
    offre: {
      nom: 'Programme débutant en petits groupes',
      valeur: 'Progresser à son rythme, voir ses progrès et ne pas abandonner au bout d’un mois',
      limite: 'Ce n’est pas de la compétition, ni des cours particuliers à domicile',
      pitch: 'J’aide les adultes débutants à progresser en groupes de huit, avec un point d’étape chaque mois pour voir le chemin parcouru',
      avant: 'Cours, séances et activités pour tous niveaux.',
    },
    avantage: 'Des groupes de huit au maximum, un encadrement formé et une progression visible à chaque séance',
    mieux: 'Là où les grandes structures remplissent des cours de trente personnes, chacun est suivi individuellement',
    differencePercue: '« Pour la première fois, je vois que je progresse, alors je continue. »',
    concurrent: {
      nom: 'Salle à grand volume',
      bien: 'Horaires larges, prix bas',
      avantage: 'Petits groupes, suivi personnalisé, ambiance',
    },
    raison: 'Parce qu’on suit chacun personnellement et que les progrès sont visibles dès les premières semaines',
    sans: 'Ils suivent des vidéos en ligne ou s’inscrivent dans une grande salle, puis abandonnent au bout d’un mois',
    verbatim: '« C’est la première saison que je vais jusqu’au bout. » — Hugo, adhérent débutant',
    signaux: {
      retention: '70% des adhérents se réinscrivent la saison suivante',
      organique: '50% des nouveaux adhérents viennent par des proches',
      nps: '9/10 de satisfaction en fin de saison',
      autre: 'Taux de remplissage des sessions, taux d’abandon',
    },
  },

  'Tourisme & restauration': {
    offre: {
      nom: 'Formule déjeuner en 30 minutes',
      valeur: 'Bien manger le midi, avec des produits frais, sans y passer toute sa pause',
      limite: 'Ce n’est pas de la restauration rapide industrielle, ni un service traiteur pour événements',
      pitch: 'Je sers aux salariés du quartier un déjeuner frais et fait maison en moins de 30 minutes, sur place ou à emporter',
      avant: 'Restaurant traditionnel, cuisine variée.',
    },
    avantage: 'Une carte courte de produits frais, servie en moins de 30 minutes, avec réservation en un clic',
    mieux: 'Là où les chaînes servent vite des produits industriels, nous servons aussi vite une cuisine faite maison',
    differencePercue: '« C’est rapide sans être de la restauration rapide : je mange vraiment bien en une demi-heure. »',
    concurrent: {
      nom: 'Chaîne de restauration rapide',
      bien: 'Rapidité, prix, horaires larges',
      avantage: 'Fait maison, produits frais, accueil personnalisé',
    },
    raison: 'Parce qu’on sert aussi vite qu’une chaîne, avec des produits frais et une équipe qui reconnaît ses habitués',
    sans: 'Ils achètent un sandwich en vitesse ou déjeunent devant leur écran',
    verbatim: '« Mon déjeuner est redevenu un vrai moment. » — Camille, salariée du quartier',
    signaux: {
      retention: '45% des clients du midi reviennent chaque semaine',
      organique: '35% des nouvelles tables viennent de recommandations',
      nps: '4,6/5 sur 300 avis en ligne',
      autre: 'Taux de remplissage, ticket moyen',
    },
  },

  'Agriculture & environnement': {
    offre: {
      nom: 'Panier hebdomadaire de la ferme',
      valeur: 'Manger des produits de saison, en sachant d’où ils viennent et qui les a cultivés',
      limite: 'Ce n’est pas une épicerie complète, ni une livraison à domicile dans tout le département',
      pitch: 'Je propose aux familles du secteur un panier de légumes de la ferme chaque semaine, récoltés la veille',
      avant: 'Production agricole diversifiée, vente de produits.',
    },
    avantage: 'Des produits récoltés la veille, cultivés à moins de 20 km, avec la possibilité de visiter la ferme',
    mieux: 'Là où la grande distribution vend des produits anonymes venus de loin, nous disons comment et par qui ils sont cultivés',
    differencePercue: '« Je sais d’où viennent mes légumes, et mes enfants savent qui les fait pousser. »',
    concurrent: {
      nom: 'Rayon bio du supermarché',
      bien: 'Accessibilité, choix toute l’année',
      avantage: 'Fraîcheur, traçabilité, lien direct avec le producteur',
    },
    raison: 'Parce que les produits sont plus frais, qu’on sait comment ils sont cultivés, et que le prix fait vivre la ferme',
    sans: 'Ils achètent au supermarché du coin sans savoir d’où viennent les produits',
    verbatim: '« On a retrouvé le goût des légumes. » — Martine, abonnée depuis un an',
    signaux: {
      retention: '80% des abonnés renouvellent leur panier chaque saison',
      organique: '60% des nouveaux abonnés viennent de recommandations',
      nps: '9,2/10 de satisfaction',
      autre: 'Paniers par semaine, part de la vente directe',
    },
  },

  'Secteur public & intérêt général': {
    offre: {
      nom: 'Permanence d’accès aux droits',
      valeur: 'Obtenir les aides auxquelles on a droit, sans se perdre dans des démarches illisibles',
      limite: 'Ce n’est pas un service juridique complet, ni un guichet qui fait les démarches à la place des personnes',
      pitch: 'J’accompagne les familles du territoire dans leurs démarches, avec une permanence chaque semaine et des bénévoles formés',
      avant: 'Actions d’accompagnement social et d’information du public.',
    },
    avantage: 'Des permanences sans rendez-vous, un langage simple, et un suivi jusqu’à l’obtention effective de l’aide',
    mieux: 'Là où les guichets renvoient vers un formulaire en ligne, nous faisons la démarche avec la personne, jusqu’au bout',
    differencePercue: '« Ici, on m’explique, et on ne me lâche pas avant que ce soit réglé. »',
    concurrent: {
      nom: 'Démarche en ligne',
      bien: 'Accessible à toute heure, gratuite',
      avantage: 'Accompagnement humain, langage clair, suivi jusqu’au bout',
    },
    raison: 'Parce qu’on accueille sans condition, qu’on explique sans jargon et qu’on suit chaque dossier jusqu’au bout',
    sans: 'Ils renoncent à leurs droits, ou demandent à un proche qui ne connaît pas mieux les démarches',
    verbatim: '« Sans vous, j’aurais abandonné mon dossier. » — Amina, accompagnée depuis trois mois',
    signaux: {
      retention: '75% des personnes accompagnées obtiennent leur aide',
      organique: '50% des personnes adressées par des partenaires',
      nps: '9/10 de satisfaction mesurée',
      autre: 'Dossiers aboutis, délai moyen d’accompagnement',
    },
  },
};
