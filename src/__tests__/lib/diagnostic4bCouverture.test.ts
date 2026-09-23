import { analyser4, etatInitial4, note4, type Etat4, type Reponse4 } from '@/lib/diagnostic4/calcul';
import { PILLARS, type PillarId } from '@/lib/diagnostic';

const OPTIONS = { couvertureMinimale: 2 };
const R = (s: string) => s.split(' ') as Etat4['piliers'][PillarId]['reponses'];

describe('Diagnostic 4b — couverture', () => {
  it('« Je ne sais pas » et « Non applicable » sortent du calcul ; moins de deux pratiques renseignées suspend la note', () => {
    expect(note4({ perception: 5, reponses: R('oui non inconnu na') }, OPTIONS)).toBe(5);
    expect(note4({ perception: 5, reponses: R('oui na na na') }, OPTIONS)).toBeNull();
    expect(note4({ perception: 5, reponses: R('oui inconnu inconnu inconnu') }, OPTIONS)).toBeNull();
    // Sans option, la V4 d'Eric suspend toujours au premier « Je ne sais pas ».
    expect(note4({ perception: 5, reponses: R('oui non inconnu na') })).toBeNull();
  });

  it('le score global pèse chaque pilier selon ses pratiques renseignées', () => {
    const e = etatInitial4();
    PILLARS.forEach((p) => { e.piliers[p.id] = { perception: 5, reponses: R('non non non non') }; });
    e.piliers.vision = { perception: 5, reponses: R('oui oui na na') };
    const a = analyser4(e, OPTIONS);
    // Vision à 10 sur 2 pratiques, les autres à 0 sur 4 : (10×2) / 18 = 1,1 (et non 10/5 = 2).
    expect(a.moyenne).toBe(1.1);
    expect(a.nbExploitables).toBe(18);
  });

  it('le texte d’un pilier suspendu dit quoi faire selon la cause', () => {
    const e = etatInitial4();
    PILLARS.forEach((p) => { e.piliers[p.id] = { perception: 5, reponses: R('oui oui oui oui') }; });
    e.piliers.fit = { perception: 5, reponses: R('oui inconnu inconnu non') };
    e.piliers.team = { perception: 5, reponses: R('oui na na na') };
    const v = analyser4(e, OPTIONS).verdicts;
    expect(v.find((x) => x.id === 'fit')!.texte).toMatch(/^Note établie sur 2 pratiques sur 4 ; 2 réponses « Je ne sais pas » à clarifier/);
    expect(v.find((x) => x.id === 'team')!.texte).toMatch(/Note suspendue : 1 pratique exploitable sur 4.*Confirmez avec votre coach/);
    expect(analyser4(e, OPTIONS).profil).toBeNull();
  });
});
