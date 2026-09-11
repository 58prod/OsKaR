import { colonnes, lancementParDefaut, periode, programme, type CleEvenement } from '@/lib/coachs/calendrier';

const rangs = (lancement: number, cle: CleEvenement) =>
  programme(lancement)
    .filter((e) => e.cle === cle)
    .map((e) => e.rang);

describe('calendrier des ateliers', () => {
  it('ouvre l’année par Vision, Market Fit et Finance, puis l’atelier OKR le mois suivant', () => {
    expect(rangs(8, 'atelier-vision')).toEqual([0]);
    expect(rangs(8, 'atelier-fit')).toEqual([0]);
    expect(rangs(8, 'atelier-finance')).toEqual([0]);
    expect(rangs(8, 'atelier-okr')).toEqual([1]);
    expect(rangs(8, 'suivi-finance')).toEqual([6]);
  });

  it('place les suivis OKR en fin de trimestre civil et la revue en décembre', () => {
    // Lancement en janvier : suivis en mars, juin, septembre ; revue en décembre.
    expect(rangs(0, 'suivi-okr')).toEqual([2, 5, 8]);
    expect(rangs(0, 'revue-okr')).toEqual([11]);
  });

  it('ne place jamais de suivi OKR avant ni pendant le mois de l’atelier OKR', () => {
    // Lancement en mars : pas de suivi en mars (lancement), atelier OKR en avril.
    expect(rangs(2, 'suivi-okr')).toEqual([3, 6]);
    // Lancement en novembre : atelier OKR en décembre, donc pas de revue ce mois-là.
    expect(rangs(10, 'revue-okr')).toEqual([]);
    expect(rangs(10, 'suivi-okr')).toEqual([4, 7, 10]);
  });

  it('réunit l’équipe chaque mois : alignement en janvier et septembre, rétro sinon', () => {
    expect(rangs(0, 'alignement')).toEqual([0, 8]);
    expect(rangs(0, 'retro')).toHaveLength(10);
  });

  it('déroule les 12 mois à cheval sur deux années', () => {
    const c = colonnes(8, 2026);
    expect(c[0]).toEqual({ mois: 8, annee: 2026 });
    expect(c[4]).toEqual({ mois: 0, annee: 2027 });
    expect(periode(8, 2026)).toBe('Sep 2026 → Août 2027');
  });

  it('propose de lancer le mois suivant', () => {
    expect(lancementParDefaut(new Date(2026, 8, 11))).toEqual({ lancement: 9, annee: 2026 });
    expect(lancementParDefaut(new Date(2026, 11, 3))).toEqual({ lancement: 0, annee: 2027 });
  });
});
