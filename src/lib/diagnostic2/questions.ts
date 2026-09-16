import type { PillarId } from '@/lib/diagnostic';

/*
 * Diagnostic 2 — version d'essai (page /diagnostic2), à comparer avec le
 * Diagnostic actuel avant de décider. Chaque pilier : 3 situations concrètes,
 * 4 réponses rangées de la moins mûre (0 point) à la plus mûre (3 points).
 * Les points ne sont pas affichés.
 */

export interface Question2 {
  q: string;
  /** Réponses dans l'ordre des points : 0, 1, 2, 3. */
  o: [string, string, string, string];
}

export const QUESTIONS2: Record<PillarId, [Question2, Question2, Question2]> = {
  vision: [
    {
      q: 'Votre cap à trois ans est…',
      o: [
        'Dans votre tête, pas encore formulé',
        'Formulé, mais peu partagé',
        'Écrit et présenté à l’équipe',
        'Écrit, et repris par l’équipe dans ses décisions',
      ],
    },
    {
      q: 'Une belle occasion se présente hors de votre cœur de métier. Vous décidez…',
      o: [
        'Selon l’urgence ou le chiffre en jeu',
        'Surtout à l’intuition',
        'En vous demandant si elle sert votre cap',
        'Avec des critères connus de tous — et il vous arrive de dire non',
      ],
    },
    {
      q: 'Vos grands arbitrages de l’année (budget, recrutements, investissements)…',
      o: [
        'Se font sans lien avec un cap écrit',
        'S’y réfèrent de temps en temps',
        'S’y réfèrent le plus souvent',
        'En découlent, et vous savez l’expliquer',
      ],
    },
  ],
  fit: [
    {
      q: 'Pourquoi vos clients vous choisissent, vous le savez…',
      o: [
        'Vous le supposez',
        'Par ce que vous en percevez au quotidien',
        'Parce que vous le leur demandez de temps en temps',
        'Parce que vous le mesurez régulièrement',
      ],
    },
    {
      q: 'Vos clients reviennent ou vous recommandent…',
      o: [
        'Rarement : il faut sans cesse en trouver de nouveaux',
        'Quand on les relance',
        'Souvent',
        'C’est une source majeure de nouveaux clients, et vous la suivez',
      ],
    },
    {
      q: 'Un client vous compare à un concurrent moins cher. Vous…',
      o: [
        'Baissez votre prix pour ne pas le perdre',
        'Négociez au cas par cas',
        'Défendez votre différence, avec un succès variable',
        'Tenez votre prix : votre différence est claire pour lui',
      ],
    },
  ],
  finance: [
    {
      q: 'La rentabilité de chacune de vos offres ou activités, vous la connaissez…',
      o: [
        'Pas en détail',
        'À la clôture des comptes',
        'Chaque trimestre',
        'Chaque mois, et elle guide vos décisions',
      ],
    },
    {
      q: 'Votre trésorerie des 6 à 12 prochains mois est…',
      o: [
        'Découverte au fil de l’eau',
        'Estimée dans les grandes lignes',
        'Dans un prévisionnel mis à jour de temps en temps',
        'Dans un prévisionnel mis à jour chaque mois',
      ],
    },
    {
      q: 'Votre principal client, ou votre principale source de revenus, disparaît demain…',
      o: [
        'L’entreprise est en danger immédiat',
        'Il faut réduire fortement la voilure',
        'C’est un coup dur, mais absorbable',
        'L’impact reste limité',
      ],
    },
  ],
  okr: [
    {
      q: 'Vos objectifs de l’année sont…',
      o: [
        'Pas formalisés',
        'Formulés, sans chiffre ni échéance',
        'Chiffrés, mais connus surtout de la direction',
        'Chiffrés, datés et connus des équipes concernées',
      ],
    },
    {
      q: 'Les priorités du trimestre, vous en avez…',
      o: [
        'Aucune en particulier : tout est prioritaire',
        'Plus de dix',
        'Entre cinq et dix',
        'Trois à cinq, pas plus',
      ],
    },
    {
      q: 'L’avancement de vos objectifs est revu…',
      o: [
        'En fin d’année, ou rarement',
        'Quand un problème apparaît',
        'Chaque mois',
        'Toutes les une à deux semaines, chiffres à l’appui',
      ],
    },
  ],
  team: [
    {
      q: 'Un sujet tombe entre deux personnes ou deux équipes…',
      o: [
        'Personne ne le prend, ou vous finissez par le faire',
        'Il faut chercher qui s’en occupe',
        'On trouve vite le responsable',
        'Chacun sait qui décide',
      ],
    },
    {
      q: 'Les désaccords dans vos équipes…',
      o: [
        'Ne s’expriment pas, ou trop tard',
        'S’expriment en aparté',
        'S’expriment en réunion, parfois difficilement',
        'Sont mis sur la table et tranchés',
      ],
    },
    {
      q: 'Faire le point sur votre façon de travailler ensemble…',
      o: [
        'N’arrive jamais',
        'Une fois par an, à l’entretien annuel',
        'Quelques fois par an',
        'Régulièrement, et cela change des choses',
      ],
    },
  ],
};
