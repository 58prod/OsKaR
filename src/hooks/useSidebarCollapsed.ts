import { useCallback, useEffect, useSyncExternalStore } from 'react';

const CLE_STOCKAGE = 'oskar.sidebar.collapsed';
const ATTRIBUT = 'data-sidebar';

/*
 * État de pliage du menu latéral, partagé par tous les shells (AppShell,
 * OkrShell, ToolPageShell).
 *
 * Deux pièges que cette implémentation évite :
 *
 * 1. Le menu qui se replie puis se déplie à chaque changement de page.
 *    Chaque page monte son propre shell : un état local repartait donc de
 *    « replié » avant qu'un effet ne relise localStorage. L'état vit ici au
 *    niveau du module, hors du cycle de vie des pages, et n'est lu qu'une fois.
 *
 * 2. Le même clignotement au tout premier affichage.
 *    La largeur n'est plus rendue par React mais par la variable CSS
 *    `--oskar-sidebar`, pilotée par l'attribut `data-sidebar` que `_document`
 *    pose sur <html> avant le premier affichage. React ne s'en sert que pour
 *    les attributs d'accessibilité.
 */

/** null tant que la préférence n'a pas été lue (rendu serveur, ou avant montage). */
let plie: boolean | null = null;
/** Nombre de fois où la personne a plié ou déplié le menu elle-même. */
let basculesManuelles = 0;
/** Pages d'outil affichées (0 ou 1, mais 2 un instant quand on passe d'un outil à l'autre). */
let outilsAffiches = 0;
const abonnes = new Set<() => void>();

function souscrire(auChangement: () => void) {
  abonnes.add(auChangement);
  return () => {
    abonnes.delete(auChangement);
  };
}

/** Valeur courante ; « déplié » par défaut, comme le CSS et le rendu serveur. */
const lireEtat = () => plie ?? false;

/** Rendu serveur : toujours déplié, pour que l'hydratation parte du même état. */
const lireEtatServeur = () => false;

/**
 * Préférence de l'utilisateur : son choix mémorisé, sinon repli sur petit écran.
 * Même règle que le script de `_document`, largeur inconnue comprise : à 0, on
 * laisse le menu déplié plutôt que de le replier à tort.
 */
function lirePreference(): boolean {
  try {
    const memorise = window.localStorage.getItem(CLE_STOCKAGE);
    if (memorise !== null) return memorise === '1';
  } catch {
    /* stockage indisponible : on décide sur la seule largeur d'écran */
  }
  const largeur = window.innerWidth || document.documentElement.clientWidth || 0;
  return largeur > 0 && largeur <= 900;
}

function appliquer(valeur: boolean, memoriser: boolean) {
  plie = valeur;
  const racine = document.documentElement;
  racine.setAttribute(ATTRIBUT, valeur ? 'collapsed' : 'expanded');
  racine.style.setProperty('--oskar-sidebar', valeur ? '4rem' : '15rem');
  if (memoriser) {
    try {
      window.localStorage.setItem(CLE_STOCKAGE, valeur ? '1' : '0');
    } catch {
      /* stockage indisponible (navigation privée) : la préférence vaut pour cette page */
    }
  }
  abonnes.forEach((auChangement) => auChangement());
}

export function useSidebarCollapsed(): {
  collapsed: boolean;
  toggle: () => void;
  /** Replie ou déplie sans mémoriser (repli automatique d'une page, par ex.). */
  setCollapsedTemporaire: (valeur: boolean) => void;
} {
  const collapsed = useSyncExternalStore(souscrire, lireEtat, lireEtatServeur);

  // Première montée seulement : le script de `_document` a déjà posé l'attribut,
  // on aligne simplement l'état React dessus.
  useEffect(() => {
    if (plie === null) appliquer(lirePreference(), false);
  }, []);

  const toggle = useCallback(() => {
    basculesManuelles += 1;
    appliquer(!(plie ?? false), true);
  }, []);
  const setCollapsedTemporaire = useCallback((valeur: boolean) => {
    if ((plie ?? false) !== valeur) appliquer(valeur, false);
  }, []);

  return { collapsed, toggle, setCollapsedTemporaire };
}

/**
 * Pages d'outil (rétro, poker…) : le menu est replié à l'arrivée, pour laisser
 * la place à l'outil, sans toucher à la préférence mémorisée. En quittant
 * l'outil, il se rouvre s'il était ouvert avant, sauf si la personne l'a plié
 * ou déplié elle-même entre-temps. `_document` le replie déjà avant le premier
 * affichage quand on ouvre directement l'adresse d'un outil.
 */
export function useMenuReplieDansOutil(): void {
  useEffect(() => {
    const etaitOuvert = !lirePreference();
    const bascules = basculesManuelles;
    outilsAffiches += 1;
    if (plie !== true) appliquer(true, false);
    return () => {
      outilsAffiches -= 1;
      // Après coup : d'un outil à l'autre (rétro → récré), le menu ne se rouvre pas pour se refermer aussitôt.
      setTimeout(() => {
        if (outilsAffiches === 0 && etaitOuvert && basculesManuelles === bascules && plie) appliquer(false, false);
      }, 0);
    };
  }, []);
}

export default useSidebarCollapsed;
