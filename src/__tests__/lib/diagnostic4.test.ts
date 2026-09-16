import { analyser4, etatInitial4, niveau4, note4, type Etat4 } from '@/lib/diagnostic4/calcul';
import { PILIERS4 } from '@/lib/diagnostic4/contenu';
import { PILLARS, type PillarId } from '@/lib/diagnostic';

const IDS = PILLARS.map((p) => p.id);
function remplir(etat: Etat4, id: PillarId, preuves: number, ressenti: number) {
  etat.piliers[id] = { ressenti, preuves: [0, 1, 2, 3].map((i) => i < preuves) as Etat4['piliers'][PillarId]['preuves'] };
}

describe('Diagnostic 4 — calcul', () => {
  it('les preuves pèsent 8 points, le ressenti 2', () => {
    expect(note4({ ressenti: 10, preuves: [false, false, false, false] })).toBe(2);
    expect(note4({ ressenti: 0, preuves: [true, true, true, true] })).toBe(8);
    expect(note4({ ressenti: 5, preuves: [true, true, true, false] })).toBe(7);
    expect(note4({ ressenti: 10, preuves: [true, true, false, false] })).toBe(6);
    expect(note4({ ressenti: null, preuves: [true, true, true, true] })).toBeNull();
  });

  it('il faut 3 preuves sur 4 pour être solide', () => {
    expect(niveau4(note4({ ressenti: 10, preuves: [true, true, false, false] })!)).toBe('c');
    expect(niveau4(note4({ ressenti: 5, preuves: [true, true, true, false] })!)).toBe('s');
  });

  it('un pilier fragile empêche « Solide » ; priorité, écarts et actions', () => {
    const e = etatInitial4();
    ['vision', 'fit', 'finance', 'okr'].forEach((id) => remplir(e, id as PillarId, 4, 9));
    remplir(e, 'team', 0, 8);
    const a = analyser4(e);
    expect(a.complet).toBe(true);
    expect(a.niveauGlobal).toBe('c');
    expect(a.profil?.id).toBe('batisseur');
    expect(a.priorite?.id).toBe('team');
    expect(a.priorite?.justification).toContain('pas la cause établie');
    expect(a.lucidite).toEqual([{ id: 'team', label: 'Team', ressenti: 8, preuves: 0, sens: 'angle-mort' }]);
    expect(a.leviers).toHaveLength(2);
  });

  it('tout solide et haut : l’horloger, sans priorité', () => {
    const e = etatInitial4();
    IDS.forEach((id) => remplir(e, id, 4, 9));
    const a = analyser4(e);
    expect(a.profil?.id).toBe('horloger');
    expect(a.priorite).toBeNull();
    expect(a.leviers).toHaveLength(0);
  });

  it('« Je travaille seul » retire Team', () => {
    const e = etatInitial4();
    ['vision', 'fit', 'finance', 'okr'].forEach((id) => remplir(e, id as PillarId, 1, 2));
    e.seul = true;
    const a = analyser4(e);
    expect(a.complet).toBe(true);
    expect(a.profil?.id).toBe('pilote');
    expect(a.verdicts.map((v) => v.id)).not.toContain('team');
    expect(a.leviers.every((l) => l.id !== 'team')).toBe(true);
  });

  it('tous les textes sont remplis', () => {
    IDS.forEach((id) => {
      expect(PILIERS4[id].criteres).toHaveLength(4);
      PILIERS4[id].criteres.forEach((c) => {
        expect(c.texte).toBeTruthy();
        expect(c.verification).toBeTruthy();
        expect(c.action).toBeTruthy();
      });
    });
  });

  it('ne déduit pas un suivi régulier de trois pratiques OKR cochées', () => {
    const e = etatInitial4();
    IDS.forEach((id) => remplir(e, id, 4, 9));
    remplir(e, 'okr', 3, 7);
    const a = analyser4(e);
    const okr = a.verdicts.find((v) => v.id === 'okr')!;
    expect(okr.niveau).toBe('s');
    expect(okr.constats.map((c) => c.texte)).toEqual([
      'Nos objectifs de l’année sont chiffrés et datés.',
      'Nous avons cinq priorités au plus ce trimestre.',
      'Chaque priorité a un responsable nommé.',
    ]);
    expect(okr.aVerifier).toEqual([expect.objectContaining({
      index: 3,
      verification: 'À quelle fréquence faites-vous le point sur l’avancement des priorités ?',
    })]);
    expect(a.leviers).toEqual([expect.objectContaining({ id: 'okr', index: 3 })]);
    expect(JSON.stringify(a)).not.toMatch(/Ce qui est décidé se fait|priorités sont claires et suivies|freine tout le reste/);
  });

  it('attend un questionnaire complet avant de produire des conclusions', () => {
    const e = etatInitial4();
    remplir(e, 'vision', 1, 5);
    const a = analyser4(e);
    expect(a.notes).toHaveLength(1);
    expect(a.verdicts).toEqual([]);
    expect(a.leviers).toEqual([]);
    expect(a.lucidite).toEqual([]);
    expect(a.priorite).toBeNull();
    expect(a.profil).toBeNull();
  });

  it('traite les cases vides comme des points à préciser et explique les égalités', () => {
    const e = etatInitial4();
    IDS.forEach((id) => remplir(e, id, 0, 7));
    const a = analyser4(e);
    expect(a.priorite?.justification).toContain('partagent la note la plus basse');
    a.verdicts.forEach((v) => {
      expect(v.constats).toEqual([]);
      expect(v.aVerifier).toHaveLength(4);
      expect(v.texte).toContain('précisez vos réponses avant de conclure');
    });
  });

  // Les 16 combinaisons couvrent notamment les pratiques de suivi présentes
  // sans objectifs écrits, et l’inverse, à tous les niveaux de ressenti.
  it.each(IDS)('%s : chaque constat et chaque action restent rattachés à leur case', (id) => {
    for (let masque = 0; masque < 16; masque++) {
      for (const ressenti of [0, 5, 10]) {
        const e = etatInitial4();
        IDS.forEach((p) => remplir(e, p, 4, 9));
        e.piliers[id] = { ressenti, preuves: [0, 1, 2, 3].map((i) => Boolean(masque & (1 << i))) as Etat4['piliers'][PillarId]['preuves'] };
        const a = analyser4(e);
        const v = a.verdicts.find((p) => p.id === id)!;
        expect(v.constats.length + v.aVerifier.length).toBe(4);
        PILIERS4[id].criteres.forEach((c, index) => {
          if (e.piliers[id].preuves[index]) {
            expect(v.constats).toContainEqual({ index, texte: c.texte });
            expect(v.aVerifier.some((p) => p.index === index)).toBe(false);
          } else {
            expect(v.aVerifier).toContainEqual({ index, ...c });
            expect(v.constats.some((p) => p.index === index)).toBe(false);
          }
        });
        a.leviers.forEach((l) => {
          expect(e.piliers[l.id].preuves[l.index]).toBe(false);
          expect(l.action).toBe(PILIERS4[l.id].criteres[l.index].action);
          expect(l.texte).toBe(PILIERS4[l.id].criteres[l.index].texte);
        });
      }
    }
  });
});
