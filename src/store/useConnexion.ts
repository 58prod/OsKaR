import { create } from 'zustand';
import { APRES_CONNEXION } from '@/lib/authFlux';

/*
 * Fenêtre de connexion unique de l'app (`AuthModal`, montée une fois dans
 * _app.tsx). N'importe quel écran l'ouvre avec `ouvrirConnexion()`, au lieu
 * d'embarquer sa propre copie de la fenêtre.
 */

export type OngletAuth = 'login' | 'register' | 'oubli';

interface EtatConnexion {
  ouverte: boolean;
  onglet: OngletAuth;
  /** Page où aller une fois connecté. */
  destination: string;
  /** Change à chaque ouverture : le formulaire repart d'un état vide. */
  ouverture: number;
  ouvrir: (onglet?: OngletAuth, destination?: string) => void;
  fermer: () => void;
}

export const useConnexion = create<EtatConnexion>((set) => ({
  ouverte: false,
  onglet: 'register',
  destination: APRES_CONNEXION,
  ouverture: 0,
  ouvrir: (onglet = 'register', destination = APRES_CONNEXION) =>
    set((s) => ({ ouverte: true, onglet, destination, ouverture: s.ouverture + 1 })),
  fermer: () => set({ ouverte: false }),
}));

/** Ouvre la fenêtre de connexion, y compris depuis du code hors composant (menu). */
export function ouvrirConnexion(onglet?: OngletAuth, destination?: string): void {
  useConnexion.getState().ouvrir(onglet, destination);
}
