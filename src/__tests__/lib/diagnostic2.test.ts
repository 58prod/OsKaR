import { analyser2, etatInitial2, note2, niveau2, type Etat2 } from '@/lib/diagnostic2/calcul';
import type { PillarId } from '@/lib/diagnostic';

function remplir(etat: Etat2, id: PillarId, r: number, ressenti: number | null = null) {
  etat.piliers[id] = { reponses: [r, r, r], ressenti };
}

describe('Diagnostic 2 — calcul', () => {
  it('note sur 10 et niveaux sans trou', () => {
    expect(note2({ reponses: [3, 3, 3], ressenti: null })).toBe(10);
    expect(note2({ reponses: [1, 1, 2], ressenti: null })).toBe(4.4);
    expect(note2({ reponses: [1, null, 2], ressenti: null })).toBeNull();
    expect([niveau2(3.9), niveau2(4), niveau2(6.9), niveau2(7)]).toEqual(['f', 'c', 'c', 's']);
  });

  it('pas de score global tant que tout n’est pas répondu', () => {
    const e = etatInitial2();
    remplir(e, 'fit', 3);
    expect(analyser2(e).complet).toBe(false);
    expect(analyser2(e).moyenne).toBeNull();
  });

  it('un pilier fragile empêche « Solide » et devient la priorité, avec son atelier', () => {
    const e = etatInitial2();
    (['vision', 'fit', 'finance', 'okr'] as PillarId[]).forEach((id) => remplir(e, id, 3));
    remplir(e, 'team', 0, 8);
    const a = analyser2(e);
    expect(a.moyenne).toBe(8);
    expect(a.niveauGlobal).toBe('c');
    expect(a.priorite?.id).toBe('team');
    expect(a.croisements.length).toBeLessThanOrEqual(2);
    expect(a.ecarts).toEqual([{ id: 'team', label: 'Team', ressenti: 8, note: 0 }]);
  });

  it('« Je travaille seul » retire Team du calcul', () => {
    const e = etatInitial2();
    (['vision', 'fit', 'finance', 'okr'] as PillarId[]).forEach((id) => remplir(e, id, 3));
    e.seul = true;
    const a = analyser2(e);
    expect(a.complet).toBe(true);
    expect(a.niveauGlobal).toBe('s');
    expect(a.priorite).toBeNull();
  });
});
