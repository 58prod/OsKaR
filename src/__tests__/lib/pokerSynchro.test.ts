import {
  DERNIERS_DESSINS_MAX,
  DESSIN_POIDS_MAX,
  INITIAL_POKER_STATE,
  ajouterAuxDerniers,
  cadreDuDessin,
  computeResults,
  estDessinValide,
  normalizePokerState,
  pokerReducer,
  remplirZone,
  type PokerOp,
  type PokerState,
} from '@/components/toolbox/poker/pokerLogic';

/*
 * Synchronisation du Planning Poker : chaque écran applique les opérations
 * qu'il reçoit, dans l'ordre où elles lui arrivent. Ces tests jouent le même
 * lot d'opérations dans des ordres différents et vérifient que tous les
 * écrans aboutissent au même état.
 */

const appliquer = (ops: PokerOp[], depart: PokerState = INITIAL_POKER_STATE) => ops.reduce(pokerReducer, depart);
const arret = { ...INITIAL_POKER_STATE.chrono };

describe('Planning Poker — votes simultanés', () => {
  const votes: PokerOp[] = ['alice', 'bruno', 'chloe', 'david', 'emma', 'farid', 'gael', 'hugo', 'ines', 'jules']
    .map((voterId, i) => ({ t: 'vote', round: 0, voterId, value: ['3', '5', '8'][i % 3] }));

  it('garde les dix votes, quel que soit leur ordre d’arrivée', () => {
    const a = appliquer(votes);
    const b = appliquer([...votes].reverse());
    expect(Object.keys(a.votes)).toHaveLength(10);
    expect(b.votes).toEqual(a.votes);
  });

  it('ne change rien quand une opération est reçue deux fois', () => {
    const une = appliquer(votes);
    expect(appliquer([...votes, ...votes])).toEqual(une);
  });

  it('laisse chacun changer d’avis avant la révélation', () => {
    const s = appliquer([
      { t: 'vote', round: 0, voterId: 'alice', value: '3' },
      { t: 'vote', round: 0, voterId: 'alice', value: '8' },
    ]);
    expect(s.votes).toEqual({ alice: '8' });
  });
});

describe('Planning Poker — révélation et nouvelle manche', () => {
  const avant = appliquer([
    { t: 'vote', round: 0, voterId: 'alice', value: '5' },
    { t: 'vote', round: 0, voterId: 'bruno', value: '5' },
  ]);

  it('fige les votes vus par celui qui révèle, pour tout le monde', () => {
    const tardif: PokerOp = { t: 'vote', round: 0, voterId: 'chloe', value: '13' };
    const revele: PokerOp = { t: 'reveal', round: 0, votes: avant.votes, chrono: arret };
    // Écran de Chloé : son vote arrive avant la révélation ; écran de l'animateur : après.
    const chezChloe = appliquer([tardif, revele], avant);
    const chezAnimateur = appliquer([revele, tardif], avant);
    expect(chezChloe.votes).toEqual({ alice: '5', bruno: '5' });
    expect(chezAnimateur).toEqual(chezChloe);
    expect(computeResults(chezChloe.votes).consensus).toBe('perfect');
  });

  it('efface les votes à la nouvelle manche, sans laisser revenir un vote en retard', () => {
    const reset: PokerOp = { t: 'newRound', round: 1, chrono: arret };
    const enRetard: PokerOp = { t: 'vote', round: 0, voterId: 'chloe', value: '13' };
    const s = appliquer([reset, enRetard], avant);
    expect(s.round).toBe(1);
    expect(s.votes).toEqual({});
    expect(s.revealed).toBe(false);
  });

  it('ignore une nouvelle manche déjà appliquée ou dépassée', () => {
    const s = appliquer([
      { t: 'newRound', round: 1 },
      { t: 'vote', round: 1, voterId: 'alice', value: '2' },
      { t: 'newRound', round: 1 },
    ], avant);
    expect(s.votes).toEqual({ alice: '2' });
  });

  it('change de suite en ouvrant une nouvelle manche', () => {
    const s = appliquer([{ t: 'newRound', round: 1, suiteKey: 'tshirt', suite: ['S', 'M', 'L'] }], avant);
    expect(s.suite).toEqual(['S', 'M', 'L']);
    expect(s.votes).toEqual({});
  });
});

describe('Planning Poker — votants hors ligne', () => {
  it('retient le prénom de chaque votant, jusqu’à la manche suivante', () => {
    const s = appliquer([{ t: 'vote', round: 0, voterId: 'alice', value: '3', name: 'Alice', color: '#f59e0b' }]);
    expect(s.voterNames.alice).toEqual({ name: 'Alice', color: '#f59e0b' });
    expect(appliquer([{ t: 'newRound', round: 1 }], s).voterNames).toEqual({});
  });
});

describe('Planning Poker — emoji dessiné', () => {
  it('n’accepte qu’une petite image PNG', () => {
    expect(estDessinValide('data:image/png;base64,iVBORw0KGgo=')).toBe(true);
    expect(estDessinValide('data:image/svg+xml;base64,PHN2Zz4=')).toBe(false);
    expect(estDessinValide('javascript:alert(1)')).toBe(false);
    expect(estDessinValide(`data:image/png;base64,${'A'.repeat(DESSIN_POIDS_MAX)}`)).toBe(false);
    expect(estDessinValide(42)).toBe(false);
  });

  it('recadre sur le dessin, même tracé petit dans un coin', () => {
    const cote = 100;
    const alpha = new Uint8Array(cote * cote);
    for (let y = 80; y < 90; y++) for (let x = 85; x < 95; x++) alpha[y * cote + x] = 255;
    const cadre = cadreDuDessin(alpha, cote)!;
    expect(cadre.taille).toBe(26);
    expect(cadre.x + cadre.taille).toBeLessThanOrEqual(cote);
    expect(cadre.x).toBeLessThanOrEqual(85);
    expect(cadre.y).toBeLessThanOrEqual(80);
    expect(cadreDuDessin(new Uint8Array(cote * cote), cote)).toBeNull();
  });
});

describe('Planning Poker — pot de peinture', () => {
  const cote = 10;
  const noir = [26, 26, 46] as const;
  const rose = [236, 72, 153] as const;
  /** Un carré noir de 6 × 6 (bords de 2 à 7) sur fond transparent. */
  const carre = () => {
    const px = new Uint8ClampedArray(cote * cote * 4);
    for (let y = 2; y <= 7; y++) {
      for (let x = 2; x <= 7; x++) {
        if (x === 2 || x === 7 || y === 2 || y === 7) px.set([...noir, 255], (y * cote + x) * 4);
      }
    }
    return px;
  };
  const pixel = (px: Uint8ClampedArray, x: number, y: number) => Array.from(px.slice((y * cote + x) * 4, (y * cote + x) * 4 + 4));

  it("remplit l'intérieur d'une forme fermée sans déborder", () => {
    const px = carre();
    expect(remplirZone(px, cote, 4.6, 4.2, rose)).toBe(true);
    expect(pixel(px, 3, 3)).toEqual([...rose, 255]);
    expect(pixel(px, 6, 6)).toEqual([...rose, 255]);
    expect(pixel(px, 2, 4)).toEqual([...noir, 255]);
    expect(pixel(px, 0, 0)).toEqual([0, 0, 0, 0]);
  });

  it("remplit le fond sans toucher à l'intérieur", () => {
    const px = carre();
    remplirZone(px, cote, 0, 0, rose);
    expect(pixel(px, 9, 9)).toEqual([...rose, 255]);
    expect(pixel(px, 4, 4)).toEqual([0, 0, 0, 0]);
  });

  it('ne fait rien sur une zone déjà de cette couleur ou hors du cadre', () => {
    const px = carre();
    remplirZone(px, cote, 4, 4, rose);
    expect(remplirZone(px, cote, 4, 4, rose)).toBe(false);
    expect(remplirZone(px, cote, -1, 4, rose)).toBe(false);
    expect(remplirZone(px, cote, 4, cote, rose)).toBe(false);
  });

  it('repeint sous le bord adouci du trait, sans liseré', () => {
    const px = carre();
    px.set([...noir, 128], (4 * cote + 3) * 4); // bord adouci à l'intérieur du carré
    remplirZone(px, cote, 5, 5, rose);
    const [r, g, b, a] = pixel(px, 3, 4);
    expect(a).toBe(255);
    expect(r).toBeGreaterThan(noir[0]);
    expect(r).toBeLessThan(rose[0]);
    expect([g, b]).not.toEqual([rose[1], rose[2]]);
  });
});

describe('Planning Poker — mes derniers dessins', () => {
  it('place le dernier envoyé en tête, sans doublon, dans la limite', () => {
    const liste = ['a', 'b', 'c', 'd', 'e', 'f'];
    expect(ajouterAuxDerniers(liste, 'g')).toEqual(['g', 'a', 'b', 'c', 'd', 'e']);
    expect(ajouterAuxDerniers(liste, 'c')).toEqual(['c', 'a', 'b', 'd', 'e', 'f']);
    expect(ajouterAuxDerniers(liste, 'g')).toHaveLength(DERNIERS_DESSINS_MAX);
    expect(ajouterAuxDerniers([], 'a')).toEqual(['a']);
  });
});

describe('Planning Poker — sessions déjà ouvertes', () => {
  it('complète un état enregistré sans numéro de manche', () => {
    const ancien = { ...INITIAL_POKER_STATE, votes: { alice: '3' } } as Partial<PokerState>;
    delete ancien.round;
    const s = normalizePokerState(ancien);
    expect(s.round).toBe(0);
    expect(pokerReducer(s, { t: 'vote', round: 0, voterId: 'bruno', value: '5' }).votes).toEqual({ alice: '3', bruno: '5' });
  });
});
