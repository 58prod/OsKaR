/**
 * Code couleur des 5 piliers, celui du menu (`oskar.css`) : repris par les
 * pages d'accueil des piliers, les ateliers et le Diagnostic.
 *
 * Tailwind déclare les mêmes valeurs (`vision`, `fit`… dans
 * tailwind.config.js) pour les classes `bg-vision`, `text-fit`… Un test
 * vérifie que les deux restent identiques : changer une couleur ici sans la
 * changer là-bas le fait échouer.
 */

export type PilierId = 'vision' | 'fit' | 'finance' | 'okr' | 'team';

export interface CouleurPilier {
  /** Couleur du pilier (menu actif, boutons, curseurs). */
  DEFAULT: string;
  /** Variante foncée (survol, texte sur fond clair). */
  dark: string;
  /** Variante claire (fonds d'icônes, pastilles). */
  light: string;
}

export const COULEURS_PILIERS: Record<PilierId, CouleurPilier> = {
  vision: { DEFAULT: '#0ea5e9', dark: '#0284c7', light: '#e0f2fe' },
  fit: { DEFAULT: '#22c55e', dark: '#16a34a', light: '#dcfce7' },
  finance: { DEFAULT: '#f59e0b', dark: '#d97706', light: '#fef3c7' },
  okr: { DEFAULT: '#6366f1', dark: '#4f46e5', light: '#ede9fe' },
  team: { DEFAULT: '#ec4899', dark: '#db2777', light: '#fce7f3' },
};
