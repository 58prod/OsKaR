/*
 * Calendrier des ateliers du kit coach — reprise de `Oskar/timeline.html`,
 * mise à jour sur l'app actuelle (durées et contenus des ateliers, OSKAR
 * Market Fit, rétro de la boîte à outils).
 *
 * Règles de placement, sur les 12 mois qui suivent le lancement :
 *   - Vision, Market Fit et Finance le mois du lancement ;
 *   - l'atelier OKR le mois suivant, puis un suivi à chaque fin de trimestre
 *     civil (mars, juin, septembre) et la revue annuelle en décembre, jamais
 *     avant l'atelier OKR ;
 *   - un suivi Finance six mois après le lancement ;
 *   - un point d'alignement avec toute l'équipe en janvier et en septembre,
 *     une rétro d'équipe les autres mois.
 */

export type PilierCalendrier = 'vision' | 'fit' | 'finance' | 'okr' | 'team';

/** Atelier = case pleine, suivi = case bordée, rituel = case teintée. */
export type NatureEvenement = 'atelier' | 'suivi' | 'rituel';

export type CleEvenement =
  | 'atelier-vision'
  | 'atelier-fit'
  | 'atelier-finance'
  | 'suivi-finance'
  | 'atelier-okr'
  | 'suivi-okr'
  | 'revue-okr'
  | 'alignement'
  | 'retro';

export interface ModeleEvenement {
  pilier: PilierCalendrier;
  nature: NatureEvenement;
  /** Titre complet, repris dans la légende. */
  titre: string;
  /** Titre court de la case : la ligne dit déjà le pilier. */
  court: string;
  duree: string;
  public: string;
  detail: string;
}

export const EVENEMENTS: Record<CleEvenement, ModeleEvenement> = {
  'atelier-vision': {
    pilier: 'vision',
    nature: 'atelier',
    titre: 'Atelier Vision',
    court: 'Atelier',
    duree: '~1h',
    public: 'Équipe dirigeante',
    detail: 'Sens, cibles, réalité, projection, valeurs : le cap de l’entreprise et les objectifs qui en découlent.',
  },
  'atelier-fit': {
    pilier: 'fit',
    nature: 'atelier',
    titre: 'Atelier Market Fit',
    court: 'Atelier',
    duree: '~1h',
    public: 'Dirigeant et responsables commerciaux',
    detail: 'Offre, différenciation, concurrence et signaux terrain, jusqu’au diagnostic Market Fit.',
  },
  'atelier-finance': {
    pilier: 'finance',
    nature: 'atelier',
    titre: 'Atelier Finance',
    court: 'Atelier',
    duree: '~1h',
    public: 'Dirigeant et responsable financier',
    detail: 'Revenus, coûts et marge, rentabilité : point mort, trésorerie, puis les décisions à prendre.',
  },
  'suivi-finance': {
    pilier: 'finance',
    nature: 'suivi',
    titre: 'Suivi Finance',
    court: 'Suivi',
    duree: '1h',
    public: 'Dirigeant et responsable financier',
    detail: 'Six mois après : les chiffres réels face aux prévisions, les écarts, les décisions à ajuster.',
  },
  'atelier-okr': {
    pilier: 'okr',
    nature: 'atelier',
    titre: 'Atelier OKR',
    court: 'Atelier',
    duree: '~45 min',
    public: 'Dirigeant et responsables',
    detail: 'Trois objectifs chiffrés pour l’année, les résultats clés du premier trimestre et le plan d’actions.',
  },
  'suivi-okr': {
    pilier: 'okr',
    nature: 'suivi',
    titre: 'Suivi OKR',
    court: 'Suivi',
    duree: '1h',
    public: 'Dirigeant et responsables',
    detail: 'En fin de trimestre : résultats clés mis à jour, actions revues, objectifs du trimestre suivant.',
  },
  'revue-okr': {
    pilier: 'okr',
    nature: 'suivi',
    titre: 'Revue annuelle OKR',
    court: 'Revue annuelle',
    duree: '1h',
    public: 'Dirigeant et responsables',
    detail: 'En décembre : bilan de l’année, enseignements, préparation des objectifs de l’année suivante.',
  },
  alignement: {
    pilier: 'team',
    nature: 'suivi',
    titre: 'Point d’alignement',
    court: 'Alignement',
    duree: '1h',
    public: 'Toute l’équipe',
    detail: 'En janvier et en septembre : partager la vision, les priorités et les objectifs, faire le bilan du semestre.',
  },
  retro: {
    pilier: 'team',
    nature: 'rituel',
    titre: 'Rétro d’équipe',
    court: 'Rétro',
    duree: '~1h',
    public: 'Toute l’équipe',
    detail: 'Chaque mois : ce qui a marché, ce qui doit changer. Outil Rétro de la boîte à outils.',
  },
};

export const PILIERS_CALENDRIER: { id: PilierCalendrier; libelle: string; couleur: string }[] = [
  { id: 'vision', libelle: 'Vision', couleur: '#0ea5e9' },
  { id: 'fit', libelle: 'Market Fit', couleur: '#22c55e' },
  { id: 'finance', libelle: 'Finance', couleur: '#f59e0b' },
  { id: 'okr', libelle: 'OKR', couleur: '#6366f1' },
  { id: 'team', libelle: 'Team', couleur: '#ec4899' },
];

export const MOIS = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre',
];
export const MOIS_COURTS = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'];

export interface Evenement {
  cle: CleEvenement;
  /** Rang du mois dans le programme : 0 = mois du lancement, 11 = dernier. */
  rang: number;
}

/** Les événements des 12 mois qui suivent un lancement (mois civil 0–11). */
export function programme(lancement: number): Evenement[] {
  const mois = (rang: number) => (lancement + rang) % 12;
  const evenements: Evenement[] = [
    { cle: 'atelier-vision', rang: 0 },
    { cle: 'atelier-fit', rang: 0 },
    { cle: 'atelier-finance', rang: 0 },
    { cle: 'atelier-okr', rang: 1 },
    { cle: 'suivi-finance', rang: 6 },
  ];

  // Suivis OKR : fins de trimestre civil, à partir du mois qui suit l'atelier OKR.
  for (let rang = 2; rang < 12; rang++) {
    const m = mois(rang);
    if (m === 11) evenements.push({ cle: 'revue-okr', rang });
    else if (m === 2 || m === 5 || m === 8) evenements.push({ cle: 'suivi-okr', rang });
  }

  // Équipe : alignement en janvier et septembre, rétro les autres mois.
  for (let rang = 0; rang < 12; rang++) {
    const m = mois(rang);
    evenements.push({ cle: m === 0 || m === 8 ? 'alignement' : 'retro', rang });
  }

  return evenements;
}

export interface Colonne {
  mois: number;
  annee: number;
}

/** Les 12 colonnes du tableau, du mois de lancement au onzième mois suivant. */
export function colonnes(lancement: number, annee: number): Colonne[] {
  return Array.from({ length: 12 }, (_, rang) => ({
    mois: (lancement + rang) % 12,
    annee: annee + Math.floor((lancement + rang) / 12),
  }));
}

/** « Sep 2026 → Août 2027 ». */
export function periode(lancement: number, annee: number): string {
  const c = colonnes(lancement, annee);
  const debut = c[0];
  const fin = c[11];
  return `${MOIS_COURTS[debut.mois]} ${debut.annee} → ${MOIS_COURTS[fin.mois]} ${fin.annee}`;
}

/** Lancement proposé par défaut : le mois qui suit la date donnée. */
export function lancementParDefaut(aujourdhui: Date): { lancement: number; annee: number } {
  const suivant = aujourdhui.getMonth() + 1;
  return { lancement: suivant % 12, annee: aujourdhui.getFullYear() + Math.floor(suivant / 12) };
}
