import {
  INITIAL_ROTI_STATE,
  ROTI_COMMENT_MAX,
  computeRoti,
  normalizeRotiState,
  rotiReducer,
  type RotiOp,
  type RotiState,
} from '@/components/toolbox/roti/rotiLogic';

/*
 * Synchronisation du ROTI : chaque écran applique les opérations qu'il
 * reçoit, dans l'ordre où elles lui arrivent. Ces tests jouent le même lot
 * d'opérations dans des ordres différents et vérifient que tous les écrans
 * aboutissent au même état.
 */

const appliquer = (ops: RotiOp[], depart: RotiState = INITIAL_ROTI_STATE) => ops.reduce(rotiReducer, depart);
const arret = { ...INITIAL_ROTI_STATE.chrono };

describe('ROTI — votes simultanés', () => {
  const votes: RotiOp[] = ['alice', 'bruno', 'chloe', 'david', 'emma', 'farid', 'gael', 'hugo', 'ines', 'jules']
    .map((voterId, i) => ({ t: 'vote', round: 0, voterId, star: (i % 5) + 1, comment: `mot de ${voterId}` }));

  it('garde les dix votes, quel que soit leur ordre d’arrivée', () => {
    const a = appliquer(votes);
    const b = appliquer([...votes].reverse());
    expect(Object.keys(a.votes)).toHaveLength(10);
    expect(b.votes).toEqual(a.votes);
    expect(computeRoti(a.votes).avgRounded).toBe(3);
  });

  it('ne change rien quand une opération est reçue deux fois', () => {
    const une = appliquer(votes);
    expect(appliquer([...votes, ...votes])).toEqual(une);
  });

  it('laisse chacun modifier sa note avant la révélation', () => {
    const s = appliquer([
      { t: 'vote', round: 0, voterId: 'alice', star: 2, comment: '' },
      { t: 'vote', round: 0, voterId: 'alice', star: 5, comment: 'Finalement top' },
    ]);
    expect(s.votes).toEqual({ alice: { star: 5, comment: 'Finalement top' } });
  });

  it('refuse une note hors de 1 à 5 et borne le commentaire', () => {
    const s = appliquer([
      { t: 'vote', round: 0, voterId: 'alice', star: 0, comment: '' },
      { t: 'vote', round: 0, voterId: 'bruno', star: 6, comment: '' },
      { t: 'vote', round: 0, voterId: 'chloe', star: 2.5, comment: '' },
      { t: 'vote', round: 0, voterId: 'david', star: 4, comment: 'x'.repeat(500) },
    ]);
    expect(Object.keys(s.votes)).toEqual(['david']);
    expect(s.votes.david.comment).toHaveLength(ROTI_COMMENT_MAX);
  });
});

describe('ROTI — révélation et nouveau tour', () => {
  const avant = appliquer([
    { t: 'vote', round: 0, voterId: 'alice', star: 5, comment: '' },
    { t: 'vote', round: 0, voterId: 'bruno', star: 4, comment: '' },
  ]);

  it('fige les votes vus par celui qui révèle, pour tout le monde', () => {
    const tardif: RotiOp = { t: 'vote', round: 0, voterId: 'chloe', star: 1, comment: '' };
    const revele: RotiOp = { t: 'reveal', round: 0, votes: avant.votes, chrono: arret };
    const chezChloe = appliquer([tardif, revele], avant);
    const chezAnimateur = appliquer([revele, tardif], avant);
    expect(Object.keys(chezChloe.votes).sort()).toEqual(['alice', 'bruno']);
    expect(chezAnimateur).toEqual(chezChloe);
    expect(computeRoti(chezChloe.votes).avgRounded).toBe(4.5);
  });

  it('efface les votes au nouveau tour, sans laisser revenir un vote en retard', () => {
    const reset: RotiOp = { t: 'newRound', round: 1, chrono: arret };
    const enRetard: RotiOp = { t: 'vote', round: 0, voterId: 'chloe', star: 1, comment: '' };
    const s = appliquer([reset, enRetard], { ...avant, session: 'Rétro sprint 12' });
    expect(s.round).toBe(1);
    expect(s.votes).toEqual({});
    expect(s.revealed).toBe(false);
    expect(s.session).toBe('Rétro sprint 12');
  });

  it('ignore un nouveau tour déjà appliqué ou dépassé', () => {
    const s = appliquer([
      { t: 'newRound', round: 1 },
      { t: 'vote', round: 1, voterId: 'alice', star: 3, comment: '' },
      { t: 'newRound', round: 1 },
    ], avant);
    expect(s.votes).toEqual({ alice: { star: 3, comment: '' } });
  });
});

describe('ROTI — votants hors ligne et anciennes sessions', () => {
  it('retient le prénom de chaque votant, jusqu’au tour suivant', () => {
    const s = appliquer([{ t: 'vote', round: 0, voterId: 'alice', star: 4, comment: '', name: 'Alice', color: '#f59e0b' }]);
    expect(s.voterNames.alice).toEqual({ name: 'Alice', color: '#f59e0b' });
    expect(appliquer([{ t: 'newRound', round: 1 }], s).voterNames).toEqual({});
  });

  it('complète un état enregistré par l’ancienne version (sans tour ni minuteur)', () => {
    const ancien = { session: 'Atelier', votes: { alice: { star: 3, comment: 'ok' } }, revealed: false } as Partial<RotiState>;
    const s = normalizeRotiState(ancien);
    expect(s.round).toBe(0);
    expect(s.chrono).toEqual(INITIAL_ROTI_STATE.chrono);
    expect(rotiReducer(s, { t: 'vote', round: 0, voterId: 'bruno', star: 5, comment: '' }).votes).toEqual({
      alice: { star: 3, comment: 'ok' },
      bruno: { star: 5, comment: '' },
    });
  });
});
