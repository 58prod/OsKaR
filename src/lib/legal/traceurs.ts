/*
 * Traceurs déposés par Oskar, relevés dans le code le 2026-09-13.
 * Tous sont stockés dans le navigateur (localStorage) et strictement
 * nécessaires : aucun cookie publicitaire ni de mesure d'audience.
 * Ajouter ici toute nouvelle clé : les pages Cookies et Paramètres la lisent.
 */

export type Traceur = {
  /** Clé exacte, ou préfixe quand la fin varie. */
  cle: string;
  prefixe?: boolean;
  finalite: string;
  /** Effaçable depuis la page Paramètres (la session ne l'est pas : on se déconnecte). */
  effacable: boolean;
};

export const TRACEURS: Traceur[] = [
  { cle: 'sb-', prefixe: true, finalite: 'Garder votre session ouverte une fois connecté', effacable: false },
  { cle: 'oskar_cookie_consent', finalite: 'Retenir que vous avez lu l’information sur les cookies', effacable: true },
  { cle: 'oskar_consent_date', finalite: 'Date à laquelle vous l’avez lue', effacable: true },
  { cle: 'oskar_cookie_preferences', finalite: 'Anciens choix de cookies, qui ne servent plus', effacable: true },
  { cle: 'oskar.sidebar.collapsed', finalite: 'Se souvenir si le menu est replié', effacable: true },
  { cle: 'oskar.secteur', finalite: 'Adapter les exemples à votre secteur d’activité', effacable: true },
  { cle: 'oskar.okr.trimestre', finalite: 'Rouvrir vos OKR sur le trimestre consulté', effacable: true },
  { cle: 'oskar.tool.', prefixe: true, finalite: 'Vous reconnaître dans les outils d’équipe (prénom, couleur)', effacable: true },
];

/** Libellé affiché d'une clé (préfixe suivi de « … »). */
export const libelleCle = (t: Traceur) => (t.prefixe ? `${t.cle}…` : t.cle);

/** Le traceur correspond-il à cette clé du stockage ? */
export const correspond = (t: Traceur, cle: string) => (t.prefixe ? cle.startsWith(t.cle) : cle === t.cle);
