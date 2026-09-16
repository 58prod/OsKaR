import { analyser3, etatInitial3, niveau3, note3, type Etat3 } from '@/lib/diagnostic3/calcul';
import { DOMINO3, PILIERS3, VERDICTS3 } from '@/lib/diagnostic3/contenu';
import { PILLARS, type PillarId } from '@/lib/diagnostic';

const IDS = PILLARS.map((p) => p.id);
function remplir(etat: Etat3, id: PillarId, preuves: number, ressenti: number) {
  etat.piliers[id] = { ressenti, preuves: [0, 1, 2, 3].map((i) => i < preuves) as Etat3['piliers'][PillarId]['preuves'] };
}

describe('Diagnostic 3 — calcul', () => {
  it('les preuves pèsent 8 points, le ressenti 2', () => {
    expect(note3({ ressenti: 10, preuves: [false, false, false, false] })).toBe(2);
    expect(note3({ ressenti: 0, preuves: [true, true, true, true] })).toBe(8);
    expect(note3({ ressenti: 5, preuves: [true, true, true, false] })).toBe(7);
    expect(note3({ ressenti: 10, preuves: [true, true, false, false] })).toBe(6);
    expect(note3({ ressenti: null, preuves: [true, true, true, true] })).toBeNull();
  });

  it('il faut 3 preuves sur 4 pour être solide', () => {
    expect(niveau3(note3({ ressenti: 10, preuves: [true, true, false, false] })!)).toBe('c');
    expect(niveau3(note3({ ressenti: 5, preuves: [true, true, true, false] })!)).toBe('s');
  });

  it('un pilier fragile empêche « Solide » ; priorité, domino, angle mort et actions', () => {
    const e = etatInitial3();
    ['vision', 'fit', 'finance', 'okr'].forEach((id) => remplir(e, id as PillarId, 4, 9));
    remplir(e, 'team', 0, 8);
    const a = analyser3(e);
    expect(a.complet).toBe(true);
    expect(a.niveauGlobal).toBe('c');
    expect(a.profil?.id).toBe('batisseur');
    expect(a.priorite?.id).toBe('team');
    expect(a.domino?.fort.id).toBe('vision');
    expect(a.lucidite).toEqual([{ id: 'team', label: 'Team', ressenti: 8, preuves: 0, sens: 'angle-mort' }]);
    expect(a.leviers).toHaveLength(2);
  });

  it('tout solide et haut : l’horloger, sans priorité', () => {
    const e = etatInitial3();
    IDS.forEach((id) => remplir(e, id, 4, 9));
    const a = analyser3(e);
    expect(a.profil?.id).toBe('horloger');
    expect(a.priorite).toBeNull();
    expect(a.leviers).toHaveLength(0);
  });

  it('« Je travaille seul » retire Team', () => {
    const e = etatInitial3();
    ['vision', 'fit', 'finance', 'okr'].forEach((id) => remplir(e, id as PillarId, 1, 2));
    e.seul = true;
    const a = analyser3(e);
    expect(a.complet).toBe(true);
    expect(a.profil?.id).toBe('pilote');
  });

  it('tous les textes sont remplis', () => {
    IDS.forEach((id) => {
      expect(PILIERS3[id].criteres).toHaveLength(4);
      (['f', 'c', 's'] as const).forEach((n) => expect(VERDICTS3[id][n].titre).toBeTruthy());
      IDS.filter((b) => b !== id).forEach((b) => expect(DOMINO3[id][b]).toBeTruthy());
    });
  });
});
