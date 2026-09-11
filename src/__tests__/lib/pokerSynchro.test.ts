import {
  INITIAL_POKER_STATE,
  computeResults,
  normalizePokerState,
  pokerReducer,
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

describe('Planning Poker — sessions déjà ouvertes', () => {
  it('complète un état enregistré sans numéro de manche', () => {
    const ancien = { ...INITIAL_POKER_STATE, votes: { alice: '3' } } as Partial<PokerState>;
    delete ancien.round;
    const s = normalizePokerState(ancien);
    expect(s.round).toBe(0);
    expect(pokerReducer(s, { t: 'vote', round: 0, voterId: 'bruno', value: '5' }).votes).toEqual({ alice: '3', bruno: '5' });
  });
});
