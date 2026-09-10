import { useEffect, useMemo, useState } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { exemplesPour, type JeuExemples } from '@/lib/exemples';
import { secteurDuNavigateur } from './useSecteurChoisi';

/**
 * Les exemples à proposer à la personne devant l'écran, choisis d'après le
 * domaine d'activité qu'elle a indiqué. Tant qu'elle n'en a pas choisi, ce sont
 * les exemples génériques : jamais de champ vide.
 *
 * À appeler depuis toute page qui propose des exemples, y compris les ateliers
 * à venir, plutôt que d'écrire des phrases en dur.
 */
export function useExemples(): JeuExemples {
  const secteurDuProfil = useAppStore((s) => s.user?.companyProfile?.industry);
  // Un visiteur peut choisir son métier depuis la page d'un pilier, sans compte :
  // son choix vit alors dans ce navigateur (voir useSecteurChoisi).
  const [secteurVisiteur, setSecteurVisiteur] = useState('');
  useEffect(() => setSecteurVisiteur(secteurDuNavigateur()), [secteurDuProfil]);
  return useMemo(
    () => exemplesPour(secteurDuProfil || secteurVisiteur),
    [secteurDuProfil, secteurVisiteur]
  );
}

export default useExemples;
