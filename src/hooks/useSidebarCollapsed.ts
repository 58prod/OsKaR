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

export function useSidebarCollapsed(): { collapsed: boolean; toggle: () => void } {
  const collapsed = useSyncExternalStore(souscrire, lireEtat, lireEtatServeur);

  // Première montée seulement : le script de `_document` a déjà posé l'attribut,
  // on aligne simplement l'état React dessus.
  useEffect(() => {
    if (plie === null) appliquer(lirePreference(), false);
  }, []);

  const toggle = useCallback(() => appliquer(!(plie ?? false), true), []);

  return { collapsed, toggle };
}

export default useSidebarCollapsed;
