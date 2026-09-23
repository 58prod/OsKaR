import { analyser4 } from '@/lib/diagnostic4/calcul';
import { etatAuHasard } from '@/lib/diagnostic4b/hasard';

it('le tirage de test fait sortir les quatre profils, de façon équilibrée', () => {
  const options = { inconnuCommeNon: true };
  const compte: Record<string, number> = {};
  for (let i = 0; i < 400; i++) {
    const a = analyser4(etatAuHasard(options), options);
    expect(a.complet).toBe(true);
    const id = a.profil?.id ?? 'aucun';
    compte[id] = (compte[id] ?? 0) + 1;
  }
  ['horloger', 'stratege', 'batisseur', 'pilote'].forEach((id) => expect(compte[id]).toBeGreaterThan(60));
});
