/*
 * Générateur de proposition du kit coach — transposition de
 * `plateforme/kit-proposition.html`. Les trois formats préchargés, la lecture
 * du déroulé (« Titre | ce qui s'y passe », une séance par ligne) et les
 * valeurs de départ du formulaire sont repris de la maquette.
 */

export type FormatProposition = 'flash' | 'parcours' | 'okr';

export interface ModeleFormat {
  libelle: string;
  duree: string;
  seances: string;
  deroule: string[];
  livrables: string[];
}

export const FORMATS: Record<FormatProposition, ModeleFormat> = {
  flash: {
    libelle: 'Flash — 1 pilier',
    duree: '6 à 8 semaines',
    seances: '3 séances de 2 h',
    deroule: [
      'Cadrage | On pose le périmètre du pilier retenu et ce qui doit avoir changé à la fin.',
      'Atelier de fond | La séance de travail principale, avec les personnes concernées.',
      'Ancrage | On vérifie ce qui tient, on cale le rituel de suivi et la suite éventuelle.',
    ],
    livrables: [
      'Le pilier renseigné dans la plateforme',
      'Un rituel de suivi installé',
      'Une synthèse écrite en une page',
      'Les points de vigilance identifiés',
    ],
  },
  parcours: {
    libelle: 'Parcours complet — 5 piliers',
    duree: '6 mois',
    seances: '8 à 10 séances de 2 à 3 h',
    deroule: [
      'Vision | Le cap à un an, les valeurs, les objectifs fondateurs.',
      'Fit | La confrontation de l’offre au terrain et aux preuves réelles.',
      'Finance | Le tableau de bord mensuel et les arbitrages qu’il déclenche.',
      'OKR | Les objectifs du trimestre et le rythme de suivi hebdomadaire.',
      'Team | Les rituels d’équipe et la répartition des rôles.',
      'Revue de parcours | Ce qui a bougé, ce qui reste, comment vous continuez seuls.',
    ],
    livrables: [
      'Les 5 piliers renseignés dans la plateforme',
      'Un plan d’actions jusqu’à fin d’année',
      'Les rituels d’équipe installés',
      'Un tableau de bord mensuel opérationnel',
      'Une synthèse de parcours',
      'L’équipe autonome sur la méthode',
    ],
  },
  okr: {
    libelle: 'Suivi OKR trimestriel',
    duree: 'Par trimestre, reconductible',
    seances: '1 cadrage + 2 check-ins + 1 revue',
    deroule: [
      'Cadrage du trimestre | On fixe 3 objectifs maximum et leurs résultats clés mesurables.',
      'Check-in à 4 semaines | On regarde les chiffres, on corrige ce qui dérive.',
      'Check-in à 8 semaines | Dernière fenêtre pour rattraper ou renoncer proprement.',
      'Revue de fin de trimestre | Bilan honnête, puis cadrage du trimestre suivant.',
    ],
    livrables: [
      'Les OKR du trimestre dans la plateforme',
      'Un rituel hebdomadaire tenu par l’équipe',
      'Une revue de trimestre documentée',
      'Le cadrage du trimestre suivant',
    ],
  },
};

/** Ordre des scores : Vision, Fit, Finance, OKR, Team. */
export const PILIERS_SCORES = [
  { court: 'Vis', libelle: 'Vision', couleur: 'vision' },
  { court: 'Fit', libelle: 'Fit', couleur: 'fit' },
  { court: 'Fin', libelle: 'Finance', couleur: 'finance' },
  { court: 'OKR', libelle: 'OKR', couleur: 'okr' },
  { court: 'Team', libelle: 'Team', couleur: 'team' },
] as const;

export interface SaisieProposition {
  format: FormatProposition;
  orga: string;
  contact: string;
  date: string;
  validite: string;
  scores: [string, string, string, string, string];
  constat: string;
  citation: string;
  objectif: string;
  deroule: string;
  livrables: string;
  duree: string;
  seances: string;
  montant: string;
  modalites: string;
  inclus: string;
  coach: string;
  structure: string;
  contactCoach: string;
  labelRpr: boolean;
}

/** Durée de validité proposée par défaut : trois semaines. */
export const VALIDITE_JOURS = 21;

export function dateLongue(d: Date): string {
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
}

/** Recharge durée, séances, déroulé et livrables du format choisi. */
export function appliquerFormat(s: SaisieProposition, format: FormatProposition): SaisieProposition {
  const m = FORMATS[format];
  return {
    ...s,
    format,
    duree: m.duree,
    seances: m.seances,
    deroule: m.deroule.join('\n'),
    livrables: m.livrables.join('\n'),
  };
}

export function saisieInitiale(aujourdhui: Date): SaisieProposition {
  const validite = new Date(aujourdhui.getTime() + VALIDITE_JOURS * 24 * 3600 * 1000);
  return appliquerFormat(
    {
      format: 'flash',
      orga: 'Nom de l’entreprise',
      contact: 'Prénom Nom, dirigeant',
      date: dateLongue(aujourdhui),
      validite: dateLongue(validite),
      scores: ['7,0', '4,5', '5,5', '3,8', '7,1'],
      constat:
        'Nos échanges ont fait ressortir deux points : des objectifs annuels qui ne descendent pas dans le quotidien de l’équipe, et une offre dont vous n’avez pas encore les preuves qu’elle répond au bon besoin.',
      citation: 'On se fixe des objectifs en janvier, et en mars personne ne s’en souvient.',
      objectif:
        'Sortir avec des objectifs trimestriels que votre équipe peut réciter — et un rituel de suivi qui tient sans vous.',
      deroule: '',
      livrables: '',
      duree: '',
      seances: '',
      montant: '',
      modalites: '50 % à la signature, solde à la dernière séance',
      inclus: 'Accès à la plateforme Oskar pendant la mission',
      coach: 'Prénom Nom',
      structure: 'Cabinet / indépendant',
      contactCoach: 'prenom@cabinet.fr · 06 00 00 00 00',
      labelRpr: true,
    },
    'flash'
  );
}

/** Lignes non vides, débarrassées de leurs espaces. */
export function lireLignes(texte: string): string[] {
  return texte
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);
}

export interface Seance {
  titre: string;
  detail: string | null;
}

/** « Titre | ce qui s'y passe » → { titre, detail }. Le détail est facultatif. */
export function lireDeroule(texte: string): Seance[] {
  return lireLignes(texte).map((ligne) => {
    const [titre, ...reste] = ligne.split('|');
    const detail = reste.join('|').trim();
    return { titre: titre.trim(), detail: detail || null };
  });
}

/** Valeur saisie, ou le repli de la maquette (« — ») quand le champ est vide. */
export function ouRepli(valeur: string, repli = '—'): string {
  return valeur.trim() || repli;
}
