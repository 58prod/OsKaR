import type { PillarId } from '@/lib/diagnostic';

/*
 * Diagnostic 4 — version d'essai rapide (page /diagnostic4) : le format du
 * Diagnostic en ligne (ressenti + cases à cocher), avec des critères
 * vérifiables et une analyse réécrite. Tous les textes sont ici.
 *
 * Règles d'écriture des critères : un seul fait par case, vérifiable (on peut
 * le montrer), valable de la TPE à la multinationale, sans jargon de start-up.
 * Chaque critère porte l'action proposée quand il n'est pas coché.
 */

export interface Critere4 {
  /** Ce que l'on coche quand c'est vrai aujourd'hui. */
  texte: string;
  /** Question à approfondir quand la pratique n’est pas déclarée. */
  verification: string;
  /** Action à envisager si le besoin est confirmé. */
  action: string;
}

export interface Pilier4 {
  /** La question que pose le pilier, sous son nom. */
  question: string;
  criteres: [Critere4, Critere4, Critere4, Critere4];
}

export const PILIERS4: Record<PillarId, Pilier4> = {
  vision: {
    question: 'Savez-vous où va votre entreprise — et votre équipe le sait-elle ?',
    criteres: [
      {
        texte: 'Notre cap à trois ans est écrit, en quelques phrases.',
        verification: "Votre cap à trois ans est-il écrit et accessible ?",
        action: 'Écrivez votre cap à trois ans en cinq lignes : où vous voulez être, pour qui, avec quel résultat.',
      },
      {
        texte: 'Nos personnes clés sauraient le redire avec leurs propres mots.',
        verification: "Comment les personnes clés reformulent-elles votre cap ?",
        action: 'Demandez aux personnes clés de reformuler votre cap, puis discutez ensemble des éventuels écarts.',
      },
      {
        texte: 'Cette année, nous avons dit non à une opportunité parce qu’elle sortait de ce cap.',
        verification: "Avez-vous eu à refuser une opportunité cette année ? Si oui, le cap a-t-il guidé ce choix ?",
        action: 'Écrivez ce que vous ne ferez pas : c’est ce qui rend un cap utile au moment de décider.',
      },
      {
        texte: 'Nos budgets et nos recrutements de l’année en découlent directement.',
        verification: "Comment reliez-vous les budgets et les recrutements au cap ?",
        action: 'Reliez chaque grand poste de budget et chaque recrutement à une ambition de votre cap.',
      },
    ],
  },
  fit: {
    question: 'Vos clients vous choisissent-ils pour de bonnes raisons ?',
    criteres: [
      {
        texte: 'Nous savons, preuves à l’appui, pourquoi nos clients nous choisissent.',
        verification: "Sur quels retours clients vous appuyez-vous pour expliquer leur choix ?",
        action: 'Interrogez cinq clients récents : pourquoi vous, pourquoi maintenant, et qu’auraient-ils fait sinon ?',
      },
      {
        texte: 'Une bonne part de nos nouveaux clients vient de recommandations ou de clients qui reviennent.',
        verification: "Quelle place occupent les recommandations et le réachat dans votre modèle commercial ?",
        action: 'Notez d’où vient chaque nouveau client ce trimestre : recommandation, retour, prospection, publicité.',
      },
      {
        texte: 'Nous tenons nos prix face à des concurrents moins chers.',
        verification: "Comment vos prix résistent-ils aux offres concurrentes moins chères ?",
        action: 'Formulez en une phrase ce qu’un client perd en choisissant moins cher que vous.',
      },
      {
        texte: 'Nous suivons au moins un indicateur de fidélité ou de satisfaction client.',
        verification: "Quel indicateur de fidélité ou de satisfaction suivez-vous, et à quelle fréquence ?",
        action: 'Choisissez un indicateur de fidélité (réachat, recommandation, départs) et suivez-le chaque mois.',
      },
    ],
  },
  finance: {
    question: 'Vos chiffres vous permettent-ils de décider à temps ?',
    criteres: [
      {
        texte: 'Nous connaissons la marge de chacune de nos offres ou activités.',
        verification: "Disposez-vous d’une marge calculée pour chaque offre ou activité ?",
        action: 'Calculez la marge offre par offre pour comparer leur contribution.',
      },
      {
        texte: 'Nous tenons un prévisionnel de trésorerie à six mois, mis à jour chaque mois.',
        verification: "À quel horizon anticipez-vous la trésorerie et quand actualisez-vous ce prévisionnel ?",
        action: 'Montez un prévisionnel de trésorerie à six mois et mettez-le à jour chaque mois.',
      },
      {
        texte: 'Aucun client ne représente plus de 20 % de notre chiffre d’affaires.',
        verification: "Quel poids représentent vos principaux clients, et quelle concentration est acceptable dans votre contexte ?",
        action: 'Mesurez le poids de vos trois premiers clients et fixez-vous un seuil de dépendance à ne pas dépasser.',
      },
      {
        texte: 'Nos indicateurs financiers clés sont revus chaque mois, et des décisions en sortent.',
        verification: "À quelle fréquence revoyez-vous les indicateurs financiers et quelles décisions en découlent ?",
        action: 'Instaurez un point financier mensuel de 30 minutes, avec trois indicateurs et une décision à la clé.',
      },
    ],
  },
  okr: {
    question: 'Vos priorités se transforment-elles en résultats ?',
    criteres: [
      {
        texte: 'Nos objectifs de l’année sont chiffrés et datés.',
        verification: "Quels objectifs de l’année ont une cible chiffrée et une échéance ?",
        action: 'Transformez chaque objectif de l’année en résultat chiffré, avec une échéance.',
      },
      {
        texte: 'Nous avons cinq priorités au plus ce trimestre.',
        verification: "Combien de priorités poursuivez-vous ce trimestre ?",
        action: 'Réduisez vos priorités du trimestre à cinq au plus, et dites ce que vous mettez de côté.',
      },
      {
        texte: 'Chaque priorité a un responsable nommé.',
        verification: "Un responsable est-il nommé pour chaque priorité ?",
        action: 'Nommez un responsable pour chaque priorité : une personne, pas une équipe.',
      },
      {
        texte: 'Nous faisons le point sur l’avancement au moins toutes les deux semaines.',
        verification: "À quelle fréquence faites-vous le point sur l’avancement des priorités ?",
        action: 'Installez un point d’avancement de 20 minutes toutes les deux semaines, chiffres à l’appui.',
      },
    ],
  },
  team: {
    question: 'Votre équipe avance-t-elle sans tout faire remonter à vous ?',
    criteres: [
      {
        texte: 'Sur les sujets importants, chacun sait qui décide.',
        verification: "Qui tranche les décisions importantes, et est-ce clair pour les personnes concernées ?",
        action: 'Listez les dix décisions qui reviennent le plus souvent et écrivez qui tranche chacune.',
      },
      {
        texte: 'Les désaccords se disent en réunion, pas dans les couloirs.',
        verification: "Dans quel cadre les désaccords peuvent-ils être exprimés et discutés ?",
        action: 'Proposez un temps de discussion des désaccords en réunion et convenez de règles d’écoute.',
      },
      {
        texte: 'Au moins une fois par trimestre, nous revoyons ensemble notre façon de travailler.',
        verification: "Quand avez-vous revu ensemble votre façon de travailler pour la dernière fois ?",
        action: 'Animez une rétrospective d’équipe ce mois-ci : ce qui marche, ce qui coince, ce qu’on change.',
      },
      {
        texte: 'Chaque personne a eu un vrai échange individuel sur son rôle ces six derniers mois.',
        verification: "Quand chaque personne a-t-elle eu un échange individuel sur son rôle ?",
        action: 'Planifiez un échange individuel avec chaque personne sur son rôle et ce qui l’aiderait à progresser.',
      },
    ],
  },
};

export type ProfilId = 'horloger' | 'stratege' | 'batisseur' | 'pilote';

/** Profils repris du test /performance, pour que les deux parlent la même langue. */
export const PROFILS4: Record<ProfilId, { nom: string; texte: (pilier: string) => string }> = {
  horloger: {
    nom: 'L’horloger',
    texte: () => 'Les scores de tous les piliers évalués atteignent le niveau « Solide », avec une moyenne d’au moins 8,5/10. Vérifiez les pratiques déclarées à partir d’exemples récents.',
  },
  stratege: {
    nom: 'Le stratège',
    texte: (p) => `Votre score global atteint le niveau « Solide ». ${p} fait partie des piliers les moins bien notés : ses réponses peuvent servir de point de départ à un échange.`,
  },
  batisseur: {
    nom: 'Le bâtisseur',
    texte: (p) => `Votre score global se situe au niveau « En construction ». ${p} fait partie des piliers les moins bien notés. C’est une piste à examiner, sans en déduire qu’il freine les autres.`,
  },
  pilote: {
    nom: 'Le pilote à vue',
    texte: (p) => `Votre score global se situe au niveau « Fragile ». Commencez par préciser les pratiques non renseignées, notamment sur ${p}, avant de choisir un chantier.`,
  },
};

/** Lien « aller plus loin » vers l'atelier de chaque pilier. */
export const ATELIERS4: Record<PillarId, { href: string; libelle: string; promesse: string }> = {
  vision: { href: '/app/vision', libelle: 'Commencer l’atelier OSKAR Vision', promesse: 'Pas à pas, du sens de votre entreprise à des cibles concrètes : votre cap écrit, prêt à être partagé.' },
  fit: { href: '/app/fit', libelle: 'Commencer l’atelier OSKAR Market Fit', promesse: 'Votre offre, votre différence, vos concurrents et vos signaux clients mis à plat.' },
  finance: { href: '/app/finance', libelle: 'Commencer l’atelier OSKAR Finance', promesse: 'Revenus, coûts, marges et rentabilité : vos chiffres clés réunis pour décider.' },
  okr: { href: '/app/okr', libelle: 'Construire mes OKR', promesse: 'Vos ambitions traduites en objectifs et résultats clés mesurables, puis en actions suivies.' },
  team: { href: '/app/outils', libelle: 'Découvrir les outils OSKAR Team', promesse: 'Rétrospective, météo d’équipe, boîte à idées : des rituels prêts à animer en direct avec votre équipe.' },
};
