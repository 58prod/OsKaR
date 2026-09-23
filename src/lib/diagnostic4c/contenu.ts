import type { PillarId, StateKey } from '@/lib/diagnostic';

/*
 * Diagnostic 4c — textes. Part de la V4 d'Eric (lib/diagnostic4) et applique
 * la revue du 2026-09-23 :
 * - pratiques sans faux positif ni ambiguïté (priorités « écrites, cinq au
 *   plus », opportunités « triées », clients « fidèles ou recommandés »…) ;
 * - Finance : la solidité est enfin mesurée (trois mois de charges) ;
 * - chaque pratique mène à l'outil Oskar qui la met en place ;
 * - restitution nette (verdicts, domino, profils de la V3), les précautions
 *   étant regroupées une seule fois en bas de page.
 */

export interface Outil4c {
  href: string;
  libelle: string;
}

export interface Critere4c {
  /** Pratique sur laquelle on se prononce. */
  texte: string;
  /** Question à se poser quand la réponse est « Je ne sais pas ». */
  verification: string;
  /** Action proposée quand la pratique n'est pas en place. */
  action: string;
  /** Élément à examiner avec un coach : rien n'est collecté ici. */
  preuveAExaminer: string;
  /** Fonction d'Oskar qui aide à mettre la pratique en place. */
  outil: Outil4c;
}

export interface Pilier4c {
  question: string;
  criteres: [Critere4c, Critere4c, Critere4c, Critere4c];
}

const VISION = '/app/vision';
const FIT = '/app/fit';
const FINANCE = '/app/finance';

export const PILIERS4C: Record<PillarId, Pilier4c> = {
  vision: {
    question: 'Savez-vous où va votre entreprise — et votre équipe le sait-elle ?',
    criteres: [
      {
        texte: 'Notre cap à trois ans est écrit, en quelques phrases.',
        verification: 'Pourriez-vous retrouver ce cap écrit, là, maintenant ?',
        action: 'Écrivez votre cap à trois ans en cinq lignes : où vous voulez être, pour qui, avec quel résultat.',
        preuveAExaminer: 'Un document daté présentant le cap à trois ans.',
        outil: { href: `${VISION}?etape=vision`, libelle: 'Atelier OSKAR Vision' },
      },
      {
        texte: 'Nos personnes clés savent l’expliquer avec leurs propres mots.',
        verification: 'Avez-vous déjà demandé à vos personnes clés de reformuler votre cap ?',
        action: 'Demandez à trois personnes clés de reformuler votre cap : les écarts montrent ce qui n’est pas passé.',
        preuveAExaminer: 'Les reformulations recueillies auprès des personnes clés.',
        outil: { href: VISION, libelle: 'Atelier OSKAR Vision, à partager' },
      },
      {
        texte: 'Ce cap nous sert à trier les opportunités : nous savons dire non à ce qui en sort.',
        verification: 'Quelle est la dernière opportunité écartée, et pour quelle raison ?',
        action: 'Écrivez ce que vous ne ferez pas : c’est ce qui rend un cap utile au moment de décider.',
        preuveAExaminer: 'Un exemple d’opportunité écartée et le motif de la décision.',
        outil: { href: `${VISION}?etape=valeurs`, libelle: 'Atelier OSKAR Vision · valeurs' },
      },
      {
        texte: 'Nos grands choix de l’année (budget, recrutements, investissements) en découlent.',
        verification: 'Vos derniers grands choix se réfèrent-ils explicitement à votre cap ?',
        action: 'Reliez chaque grand choix de l’année à une ambition de votre cap.',
        preuveAExaminer: 'Un budget, un recrutement ou un investissement relié au cap.',
        outil: { href: `${VISION}?etape=objectifs`, libelle: 'Atelier OSKAR Vision · objectifs' },
      },
    ],
  },
  fit: {
    question: 'Vos clients vous choisissent-ils pour de bonnes raisons ?',
    criteres: [
      {
        texte: 'Nous savons, preuves à l’appui, pourquoi nos clients nous choisissent.',
        verification: 'Quand avez-vous demandé pour la dernière fois à un client pourquoi il vous a choisi ?',
        action: 'Interrogez cinq clients récents : pourquoi vous, pourquoi maintenant, et qu’auraient-ils fait sinon ?',
        preuveAExaminer: 'Des comptes rendus d’entretiens ou des retours clients récents.',
        outil: { href: `${FIT}?etape=signaux`, libelle: 'Atelier OSKAR Market Fit · signaux' },
      },
      {
        texte: 'Une bonne part de notre chiffre d’affaires vient de clients fidèles ou recommandés.',
        verification: 'Savez-vous quelle part de votre chiffre d’affaires vient de clients fidèles ou recommandés ?',
        action: 'Notez d’où vient chaque client ce trimestre : fidèle, recommandé, prospecté, publicité.',
        preuveAExaminer: 'La répartition du chiffre d’affaires par origine des clients.',
        outil: { href: `${FIT}?etape=signaux`, libelle: 'Atelier OSKAR Market Fit · signaux' },
      },
      {
        texte: 'Nous tenons nos prix face à des concurrents moins chers.',
        verification: 'Sur vos dernières affaires perdues, le prix était-il la raison ?',
        action: 'Formulez en une phrase ce qu’un client perd en choisissant moins cher que vous.',
        preuveAExaminer: 'Des devis comparés et les motifs de gain ou de perte d’affaires.',
        outil: { href: `${FIT}?etape=differenciation`, libelle: 'Atelier OSKAR Market Fit · différenciation' },
      },
      {
        texte: 'Nous mesurons la fidélité ou la satisfaction de nos clients au moins chaque trimestre.',
        verification: 'Quelle est votre dernière mesure de satisfaction ou de fidélité, et de quand date-t-elle ?',
        action: 'Choisissez un indicateur de fidélité (réachat, recommandation, départs) et suivez-le chaque trimestre.',
        preuveAExaminer: 'Un tableau de suivi daté de satisfaction, de fidélité ou de réachat.',
        outil: { href: `${FIT}?etape=signaux`, libelle: 'Atelier OSKAR Market Fit · signaux' },
      },
    ],
  },
  finance: {
    question: 'Vos chiffres sont-ils lisibles, et votre modèle solide ?',
    criteres: [
      {
        texte: 'Nous connaissons la marge de chacune de nos offres ou activités.',
        verification: 'Pourriez-vous citer la marge de votre offre principale ?',
        action: 'Calculez la marge offre par offre : il arrive souvent qu’une activité en finance une autre.',
        preuveAExaminer: 'Un calcul récent des marges par offre ou activité.',
        outil: { href: `${FINANCE}?etape=couts`, libelle: 'Atelier OSKAR Finance · coûts et marges' },
      },
      {
        texte: 'Nous tenons un prévisionnel de trésorerie à six mois, mis à jour chaque mois.',
        verification: 'De quand date la dernière mise à jour de votre prévisionnel de trésorerie ?',
        action: 'Montez un prévisionnel de trésorerie à six mois et mettez-le à jour chaque mois.',
        preuveAExaminer: 'Un prévisionnel de trésorerie à six mois et ses dates de mise à jour.',
        outil: { href: `${FINANCE}?etape=rentabilite`, libelle: 'Atelier OSKAR Finance · rentabilité et trésorerie' },
      },
      {
        texte: 'Aucun client ne représente plus de 20 % de notre chiffre d’affaires.',
        verification: 'Quel poids représente votre premier client dans votre chiffre d’affaires ?',
        action: 'Mesurez le poids de vos trois premiers clients et fixez-vous un seuil de dépendance à ne pas dépasser.',
        preuveAExaminer: 'La répartition du chiffre d’affaires par client sur les douze derniers mois.',
        outil: { href: `${FINANCE}?etape=revenus`, libelle: 'Atelier OSKAR Finance · revenus' },
      },
      {
        texte: 'Notre trésorerie couvre au moins trois mois de charges.',
        verification: 'Combien de mois de charges votre trésorerie couvre-t-elle aujourd’hui ?',
        action: 'Calculez votre nombre de mois de charges couverts, et fixez-vous un seuil d’alerte.',
        preuveAExaminer: 'Le solde de trésorerie rapporté aux charges mensuelles.',
        outil: { href: `${FINANCE}?etape=rentabilite`, libelle: 'Atelier OSKAR Finance · rentabilité et trésorerie' },
      },
    ],
  },
  okr: {
    question: 'Vos priorités se transforment-elles en résultats ?',
    criteres: [
      {
        texte: 'Nos objectifs de l’année sont chiffrés et datés.',
        verification: 'Pourriez-vous citer un objectif de l’année avec son chiffre et son échéance ?',
        action: 'Transformez chaque objectif de l’année en résultat chiffré, avec une échéance.',
        preuveAExaminer: 'Une liste d’objectifs avec cibles chiffrées et échéances.',
        outil: { href: '/app/okr', libelle: 'Construire mes OKR' },
      },
      {
        texte: 'Nos priorités du trimestre sont écrites, et il y en a cinq au plus.',
        verification: 'Où sont écrites vos priorités du trimestre, et combien y en a-t-il ?',
        action: 'Écrivez vos priorités du trimestre, cinq au plus, et dites ce que vous mettez de côté.',
        preuveAExaminer: 'La liste écrite des priorités du trimestre.',
        outil: { href: '/app/okr', libelle: 'Construire mes OKR' },
      },
      {
        texte: 'Chaque priorité a un responsable nommé.',
        verification: 'Pour chaque priorité, pourriez-vous dire qui en répond ?',
        action: 'Nommez un responsable pour chaque priorité : une personne, pas une équipe.',
        preuveAExaminer: 'La liste des priorités et de leurs responsables nommés.',
        outil: { href: '/app/okr', libelle: 'Construire mes OKR' },
      },
      {
        texte: 'Nous faisons le point sur l’avancement, chiffres à l’appui, au moins toutes les deux semaines.',
        verification: 'Quand a eu lieu votre dernier point d’avancement chiffré ?',
        action: 'Installez un point d’avancement de 20 minutes toutes les deux semaines, chiffres à l’appui.',
        preuveAExaminer: 'Les dates et comptes rendus des derniers points d’avancement.',
        outil: { href: '/app/okr/check-in', libelle: 'Check-in OSKAR OKR' },
      },
    ],
  },
  team: {
    question: 'Votre équipe avance-t-elle sans tout faire remonter à vous ?',
    criteres: [
      {
        texte: 'Sur les sujets importants, chacun sait qui décide.',
        verification: 'Sur votre dernière décision importante, chacun savait-il qui tranchait ?',
        action: 'Listez les dix décisions qui reviennent le plus souvent et écrivez qui tranche chacune.',
        preuveAExaminer: 'Une répartition écrite des décisions ou des décisions récentes documentées.',
        outil: { href: '/app/outils/resolution-collective', libelle: 'Résolution collective' },
      },
      {
        texte: 'Les désaccords se disent en réunion, pas dans les couloirs.',
        verification: 'Quel est le dernier désaccord mis sur la table en réunion ?',
        action: 'Ouvrez un temps pour nommer ce qui freine, sans détour, puis décidez ensemble.',
        preuveAExaminer: 'Un exemple récent de désaccord discuté en réunion et de son traitement.',
        outil: { href: '/app/outils/disons-nous', libelle: 'Disons-nous les choses' },
      },
      {
        texte: 'Au moins une fois par trimestre, nous revoyons ensemble notre façon de travailler.',
        verification: 'Quand avez-vous revu ensemble votre façon de travailler pour la dernière fois ?',
        action: 'Animez une rétrospective d’équipe ce mois-ci : ce qui marche, ce qui coince, ce qu’on change.',
        preuveAExaminer: 'Les dates et comptes rendus des dernières rétrospectives.',
        outil: { href: '/app/outils/retrospective', libelle: 'Rétrospective d’équipe' },
      },
      {
        texte: 'Nous prenons régulièrement le pouls de l’équipe (moral, charge, motivation).',
        verification: 'Quand avez-vous mesuré le moral de l’équipe pour la dernière fois ?',
        action: 'Prenez le pouls de l’équipe ce mois-ci, puis tous les trimestres, pour voir venir les tensions.',
        preuveAExaminer: 'Les résultats datés d’une météo ou d’un baromètre d’équipe.',
        outil: { href: '/app/outils/team-mood', libelle: 'Team Mood' },
      },
    ],
  },
};

/** Verdict d'un pilier. Ne cite aucune pratique précise : il reste vrai quelles que soient les réponses. */
export const VERDICTS4C: Record<PillarId, Record<StateKey, { titre: string; texte: string }>> = {
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
    f: { titre: 'Vous pilotez sans tableau de bord financier.', texte: 'Sans chiffres fiables ni réserve suffisante, un seul imprévu peut suffire à tout bloquer.' },
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
export const DOMINO4C: Record<PillarId, Partial<Record<PillarId, string>>> = {
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

/** Profils : mêmes noms que le test /performance, pour que les deux parlent la même langue. */
export const PROFILS4C: Record<ProfilId, { nom: string; texte: (pilier: string) => string }> = {
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
    texte: (p) => `Les fondations sont là, par endroits. ${p} freine le reste : c’est par là qu’il faut commencer.`,
  },
  pilote: {
    nom: 'Le pilote à vue',
    texte: (p) => `Ça avance, surtout grâce à votre énergie. Sans repères partagés, tout repose sur vous. Premier chantier : ${p}.`,
  },
};

/** Atelier proposé pour le pilier prioritaire. */
export const ATELIERS4C: Record<PillarId, { href: string; libelle: string; promesse: string }> = {
  vision: { href: '/app/vision', libelle: 'Commencer l’atelier OSKAR Vision', promesse: 'Pas à pas, du sens de votre entreprise à des cibles concrètes : votre cap écrit, prêt à être partagé.' },
  fit: { href: '/app/fit', libelle: 'Commencer l’atelier OSKAR Market Fit', promesse: 'Votre offre, votre différence, vos concurrents et vos signaux clients mis à plat.' },
  finance: { href: '/app/finance', libelle: 'Commencer l’atelier OSKAR Finance', promesse: 'Revenus, coûts, marges, rentabilité et trésorerie : vos chiffres clés réunis pour décider.' },
  okr: { href: '/app/okr', libelle: 'Construire mes OKR', promesse: 'Vos ambitions traduites en objectifs et résultats clés mesurables, puis en actions suivies.' },
  team: { href: '/app/outils', libelle: 'Découvrir les outils OSKAR Team', promesse: 'Rétrospective, météo d’équipe, résolution collective : des rituels prêts à animer en direct avec votre équipe.' },
};
