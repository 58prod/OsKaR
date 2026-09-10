import { useMemo } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { exemplesPour, type JeuExemples } from '@/lib/exemples';

/**
 * Les exemples à proposer à la personne devant l'écran, choisis d'après le
 * domaine d'activité qu'elle a indiqué. Tant qu'elle n'en a pas choisi, ce sont
 * les exemples génériques : jamais de champ vide.
 *
 * À appeler depuis toute page qui propose des exemples, y compris les ateliers
 * à venir, plutôt que d'écrire des phrases en dur.
 */
export function useExemples(): JeuExemples {
  const secteur = useAppStore((s) => s.user?.companyProfile?.industry);
  return useMemo(() => exemplesPour(secteur), [secteur]);
}

export default useExemples;
