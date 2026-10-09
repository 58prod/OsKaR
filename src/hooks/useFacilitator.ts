import { useCallback, useState } from 'react';

/**
 * Mode animateur auto-promu, commun à tous les outils.
 * N'importe qui peut débloquer localement les contrôles (calqué sur la
 * Boîte à idées). Par défaut on suit l'hôte (créateur de la session).
 * `reserveAHote` : l'hôte a gardé l'animation pour lui, les autres ne
 * peuvent plus l'activer.
 */
export function useFacilitator(isHost: boolean, reserveAHote = false) {
  const [override, setOverride] = useState<boolean | null>(null);
  const isFacilitator = reserveAHote && !isHost ? false : override ?? isHost;
  const toggleFacilitator = useCallback(() => {
    if (reserveAHote && !isHost) return;
    setOverride((prev) => !(prev ?? isHost));
  }, [isHost, reserveAHote]);
  return { isFacilitator, toggleFacilitator };
}

export default useFacilitator;
