import type { PillarId, StateKey } from '@/lib/diagnostic';

/*
 * Diagnostic 3 — version d'essai rapide (page /diagnostic3) : le format du
 * Diagnostic en ligne (ressenti + cases à cocher), avec des critères
 * vérifiables et une analyse réécrite. Tous les textes sont ici.
 *
 * Règles d'écriture des critères : un seul fait par case, vérifiable (on peut
 * le montrer), valable de la TPE à la multinationale, sans jargon de start-up.
 * Chaque critère porte l'action proposée quand il n'est pas coché.
 */

export interface Critere3 {
  /** Ce que l'on coche quand c'est vrai aujourd'hui. */
  texte: string;
  /** Action proposée quand la case reste vide. */
  action: string;
}

export interface Pilier3 {
  /** La question que pose le pilier, sous son nom. */
  question: string;
  criteres: [Critere3, Critere3, Critere3, Critere3];
}

export const PILIERS3: Record<PillarId, Pilier3> = {
  vision: {
    question: 'Savez-vous où va votre entreprise — et votre équipe le sait-elle ?',
    criteres: [
      {
        texte: 'Notre cap à trois ans est écrit, en quelques phrases.',
        action: 'Écrivez votre cap à trois ans en cinq lignes : où vous voulez être, pour qui, avec quel résultat.',
      },
      {
        texte: 'Nos personnes clés sauraient le redire avec leurs propres mots.',
        action: 'Demandez à trois personnes clés de reformuler votre cap : les écarts montrent ce qui n’est pas passé.',
      },
      {
        texte: 'Cette année, nous avons dit non à une opportunité parce qu’elle sortait de ce cap.',
        action: 'Écrivez ce que vous ne ferez pas : c’est ce qui rend un cap utile au moment de décider.',
      },
      {
        texte: 'Nos budgets et nos recrutements de l’année en découlent directement.',
        action: 'Reliez chaque grand poste de budget et chaque recrutement à une ambition de votre cap.',
      },
    ],
  },
  fit: {
    question: 'Vos clients vous choisissent-ils pour de bonnes raisons ?',
    criteres: [
      {
        texte: 'Nous savons, preuves à l’appui, pourquoi nos clients nous choisissent.',
        action: 'Interrogez cinq clients récents : pourquoi vous, pourquoi maintenant, et qu’auraient-ils fait sinon ?',
      },
      {
        texte: 'Une bonne part de nos nouveaux clients vient de recommandations ou de clients qui reviennent.',
        action: 'Notez d’où vient chaque nouveau client ce trimestre : recommandation, retour, prospection, publicité.',
      },
      {
        texte: 'Nous tenons nos prix face à des concurrents moins chers.',
        action: 'Formulez en une phrase ce qu’un client perd en choisissant moins cher que vous.',
      },
      {
        texte: 'Nous suivons au moins un indicateur de fidélité ou de satisfaction client.',
        action: 'Choisissez un indicateur de fidélité (réachat, recommandation, départs) et suivez-le chaque mois.',
      },
    ],
  },
  finance: {
    question: 'Vos chiffres vous permettent-ils de décider à temps ?',
    criteres: [
      {
        texte: 'Nous connaissons la marge de chacune de nos offres ou activités.',
        action: 'Calculez la marge offre par offre : il arrive souvent qu’une activité en finance une autre.',
      },
      {
        texte: 'Nous tenons un prévisionnel de trésorerie à six mois, mis à jour chaque mois.',
        action: 'Montez un prévisionnel de trésorerie à six mois et mettez-le à jour chaque mois.',
      },
      {
        texte: 'Aucun client ne représente plus de 20 % de notre chiffre d’affaires.',
        action: 'Mesurez le poids de vos trois premiers clients et fixez-vous un seuil de dépendance à ne pas dépasser.',
      },
      {
        texte: 'Nos indicateurs financiers clés sont revus chaque mois, et des décisions en sortent.',
        action: 'Instaurez un point financier mensuel de 30 minutes, avec trois indicateurs et une décision à la clé.',
      },
    ],
  },
  okr: {
    question: 'Vos priorités se transforment-elles en résultats ?',
    criteres: [
      {
        texte: 'Nos objectifs de l’année sont chiffrés et datés.',
        action: 'Transformez chaque objectif de l’année en résultat chiffré, avec une échéance.',
      },
      {
        texte: 'Nous avons cinq priorités au plus ce trimestre.',
        action: 'Réduisez vos priorités du trimestre à cinq au plus, et dites ce que vous mettez de côté.',
      },
      {
        texte: 'Chaque priorité a un responsable nommé.',
        action: 'Nommez un responsable pour chaque priorité : une personne, pas une équipe.',
      },
      {
        texte: 'Nous faisons le point sur l’avancement au moins toutes les deux semaines.',
        action: 'Installez un point d’avancement de 20 minutes toutes les deux semaines, chiffres à l’appui.',
      },
    ],
  },
  team: {
    question: 'Votre équipe avance-t-elle sans tout faire remonter à vous ?',
    criteres: [
      {
        texte: 'Sur les sujets importants, chacun sait qui décide.',
        action: 'Listez les dix décisions qui reviennent le plus souvent et écrivez qui tranche chacune.',
      },
      {
        texte: 'Les désaccords se disent en réunion, pas dans les couloirs.',
        action: 'Ouvrez chaque réunion importante par un tour « ce qui me gêne » : les non-dits reculent vite.',
      },
      {
        texte: 'Au moins une fois par trimestre, nous revoyons ensemble notre façon de travailler.',
        action: 'Animez une rétrospective d’équipe ce mois-ci : ce qui marche, ce qui coince, ce qu’on change.',
      },
      {
        texte: 'Chaque personne a eu un vrai échange individuel sur son rôle ces six derniers mois.',
        action: 'Planifiez un échange individuel avec chaque personne sur son rôle et ce qui l’aiderait à progresser.',
      },
    ],
  },
};

/** Diagnostic d'un pilier selon son niveau : un titre qui nomme, une phrase qui explique. */
export const VERDICTS3: Record<PillarId, Record<StateKey, { titre: string; texte: string }>> = {
  // Ces textes ne citent aucun critère précis : ils doivent rester vrais quelles que soient les cases cochées.
  vision: {
    f: { titre: 'Votre cap reste dans votre tête.', texte: 'Tant qu’il n’est pas partagé et utilisé pour décider, chaque arbitrage repasse par vous et l’équipe avance à tâtons.' },
    c: { titre: 'Votre cap existe, mais il ne décide pas encore.', texte: 'L’étape suivante : qu’il serve à trancher — ce que vous faites, et surtout ce que vous ne faites pas.' },
    s: { titre: 'Votre cap est clair et partagé.', texte: 'Il guide les décisions au-delà de vous : c’est ce qui permet de grandir sans tout porter.' },
  },
  fit: {
    f: { titre: 'Votre valeur aux yeux des clients reste à prouver.', texte: 'Tant qu’elle n’est pas démontrée, vous vendez au prix des autres et chaque client coûte cher à gagner.' },
    c: { titre: 'Votre offre plaît, sa différence reste à démontrer.', texte: 'Quelques preuves de plus vous diront précisément où accélérer.' },
    s: { titre: 'Votre offre a trouvé son marché.', texte: 'Vous savez ce qui fait votre valeur, et vos clients le confirment.' },
  },
  finance: {
    f: { titre: 'Vous pilotez sans tableau de bord financier.', texte: 'Sans chiffres fiables et réguliers, un seul imprévu peut suffire à tout bloquer.' },
    c: { titre: 'Vos chiffres existent, mais n’éclairent pas toutes vos décisions.', texte: 'Plus réguliers et plus précis, ils vous permettraient de voir venir au lieu de constater.' },
    s: { titre: 'Vos chiffres éclairent vos décisions.', texte: 'Vous voyez venir, et vous pouvez investir en connaissance de cause.' },
  },
  okr: {
    f: { titre: 'Tout est prioritaire, donc rien ne l’est.', texte: 'Sans priorités claires et suivies, c’est l’urgence du jour qui fixe l’agenda.' },
    c: { titre: 'Vos objectifs sont posés, leur suivi reste à ancrer.', texte: 'C’est la régularité du suivi, plus que la qualité du plan, qui fait les résultats.' },
    s: { titre: 'Vos priorités sont claires et suivies.', texte: 'Ce qui est décidé se fait : c’est la marque des équipes qui délivrent.' },
  },
  team: {
    f: { titre: 'Votre équipe fonctionne, mais tout remonte à vous.', texte: 'Quand les rôles restent flous et les tensions non dites, l’équipe s’use — et vous en premier.' },
    c: { titre: 'Votre équipe avance, mais pourrait aller plus loin.', texte: 'Clarifier qui décide et se donner des temps pour se parler libère beaucoup d’énergie.' },
    s: { titre: 'Votre équipe est une force.', texte: 'L’entreprise ne repose pas que sur vous : c’est ce qui la rend solide.' },
  },
};

/** Effet domino : ce que le pilier le plus faible coûte au pilier le plus solide. [faible][solide] */
export const DOMINO3: Record<PillarId, Partial<Record<PillarId, string>>> = {
  vision: {
    fit: 'Vos clients vous suivent, mais sans cap écrit vous risquez de courir après chaque demande au lieu de choisir vos marchés.',
    finance: 'Vos finances sont saines : c’est le bon moment pour décider où investir — encore faut-il savoir où vous allez.',
    okr: 'Votre équipe exécute bien. Sans cap clair, elle risque d’exceller… dans la mauvaise direction.',
    team: 'Votre équipe est engagée : elle n’attend qu’une direction claire pour donner sa pleine mesure.',
  },
  fit: {
    vision: 'Votre cap est clair, mais le marché ne l’a pas encore validé : c’est lui qui aura le dernier mot.',
    finance: 'Vos finances vous donnent du temps. Utilisez-le pour prouver la valeur de votre offre avant qu’il ne file.',
    okr: 'Votre exécution est rodée : assurez-vous qu’elle pousse une offre que vos clients réclament vraiment.',
    team: 'Votre équipe est solide : mettez-la au contact des clients pour affûter votre offre.',
  },
  finance: {
    vision: 'Vous savez où aller, mais sans visibilité financière, chaque pas vers ce cap se fait à l’aveugle.',
    fit: 'Vos clients sont là. La question n’est plus de vendre, mais de savoir ce que chaque vente vous rapporte vraiment.',
    okr: 'Vous tenez vos objectifs : ajoutez-y la rentabilité, sinon vous risquez de réussir à perte.',
    team: 'Votre équipe tient bon. Sans pilotage financier, c’est elle qui encaissera le premier imprévu.',
  },
  okr: {
    vision: 'Votre cap est clair, mais il reste une intention tant qu’il ne devient pas des priorités suivies.',
    fit: 'Le marché répond : chaque trimestre sans priorités nettes, ce sont des opportunités qui passent.',
    finance: 'Vous avez les moyens de vos ambitions ; il manque le cadre pour les transformer en résultats.',
    team: 'L’énergie de votre équipe est là : sans priorités partagées, elle se disperse au lieu de s’additionner.',
  },
  team: {
    vision: 'Le cap est clair sur le papier. C’est l’équipe qui le fera exister — ou pas.',
    fit: 'Vos clients sont convaincus. La croissance qui vient mettra l’équipe sous tension : c’est maintenant qu’il faut la consolider.',
    finance: 'Les chiffres sont bons, mais la solidité d’une entreprise se mesure aussi à celle de son équipe.',
    okr: 'Vos méthodes sont en place. Sans adhésion, elles restent des tableaux que personne ne fait vivre.',
  },
};

export type ProfilId = 'horloger' | 'stratege' | 'batisseur' | 'pilote';

/** Profils repris du test /performance, pour que les deux parlent la même langue. */
export const PROFILS3: Record<ProfilId, { nom: string; texte: (pilier: string) => string }> = {
  horloger: {
    nom: 'L’horloger',
    texte: () => 'Cap clair, marché validé, chiffres maîtrisés, équipe alignée : c’est rare. Votre enjeu n’est plus de construire, mais de tenir ce niveau en grandissant.',
  },
  stratege: {
    nom: 'Le stratège',
    texte: (p) => `Votre entreprise est bien structurée. Votre prochain palier se joue sur ${p} : c’est là que se trouve votre marge de progression.`,
  },
  batisseur: {
    nom: 'Le bâtisseur',
    texte: (p) => `Les fondations sont là, par endroits. ${p} freine tout le reste : c’est par là qu’il faut commencer.`,
  },
  pilote: {
    nom: 'Le pilote à vue',
    texte: (p) => `Ça avance, surtout grâce à votre énergie. Sans repères partagés, tout repose sur vous. Premier chantier : ${p}.`,
  },
};

/** Lien « aller plus loin » vers l'atelier de chaque pilier. */
export const ATELIERS3: Record<PillarId, { href: string; libelle: string; promesse: string }> = {
  vision: { href: '/app/vision', libelle: 'Commencer l’atelier OSKAR Vision', promesse: 'Pas à pas, du sens de votre entreprise à des cibles concrètes : votre cap écrit, prêt à être partagé.' },
  fit: { href: '/app/fit', libelle: 'Commencer l’atelier OSKAR Market Fit', promesse: 'Votre offre, votre différence, vos concurrents et vos signaux clients mis à plat.' },
  finance: { href: '/app/finance', libelle: 'Commencer l’atelier OSKAR Finance', promesse: 'Revenus, coûts, marges et rentabilité : vos chiffres clés réunis pour décider.' },
  okr: { href: '/app/okr', libelle: 'Construire mes OKR', promesse: 'Vos ambitions traduites en objectifs et résultats clés mesurables, puis en actions suivies.' },
  team: { href: '/app/outils', libelle: 'Découvrir les outils OSKAR Team', promesse: 'Rétrospective, météo d’équipe, boîte à idées : des rituels prêts à animer en direct avec votre équipe.' },
};
