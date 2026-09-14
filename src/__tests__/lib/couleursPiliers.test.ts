import { COULEURS_PILIERS } from '@/constants/piliers';
import { PILLARS } from '@/lib/diagnostic';

// La configuration Tailwind est un module CommonJS : on la lit telle quelle.
// eslint-disable-next-line @typescript-eslint/no-require-imports
const tailwind = require('../../../tailwind.config.js');

/*
 * Chaque pilier a un code couleur dans le menu ; les pages d'accueil des
 * piliers et le Diagnostic doivent reprendre exactement le même.
 */
describe('Couleurs des piliers', () => {
  const couleursTailwind = tailwind.theme.extend.colors;

  it('sont identiques dans Tailwind (menu, pages d’accueil) et dans le code', () => {
    (Object.keys(COULEURS_PILIERS) as (keyof typeof COULEURS_PILIERS)[]).forEach((id) => {
      expect(couleursTailwind[id]).toEqual(COULEURS_PILIERS[id]);
    });
  });

  it('sont celles des blocs et des curseurs du Diagnostic', () => {
    PILLARS.forEach((p) => {
      expect(p.color).toBe(COULEURS_PILIERS[p.id as keyof typeof COULEURS_PILIERS].DEFAULT);
    });
  });
});
