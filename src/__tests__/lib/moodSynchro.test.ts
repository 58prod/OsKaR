import {
  INITIAL_MOOD_STATE,
  buildMoodSummary,
  computeMoodGlobal,
  computeMoodStats,
  moodReducer,
  normalizeMoodState,
  pointsToDiscuss,
  type MoodOp,
  type MoodScores,
  type MoodState,
} from '@/components/toolbox/mood/moodLogic';

/*
 * Synchronisation du Team Mood : chaque écran applique les opérations qu'il
 * reçoit, dans l'ordre où elles lui arrivent. Ces tests jouent le même lot
 * d'opérations dans des ordres différents et vérifient que tous les écrans
 * aboutissent au même état.
 */

const appliquer = (ops: MoodOp[], depart: MoodState = INITIAL_MOOD_STATE) => ops.reduce(moodReducer, depart);
const arret = { ...INITIAL_MOOD_STATE.chrono };
const notes = (energie: number, charge: number, sens: number, liens: number, epanouissement: number): MoodScores =>
  ({ energie, charge, sens, liens, epanouissement });

describe('Team Mood — votes simultanés', () => {
  const votes: MoodOp[] = ['alice', 'bruno', 'chloe', 'david', 'emma', 'farid', 'gael', 'hugo']
    .map((voterId, i) => ({ t: 'vote', round: 0, voterId, dims: notes(1 + (i % 10), 5, 6, 7, 8) }));

  it('garde tous les votes, quel que soit leur ordre d’arrivée', () => {
    const a = appliquer(votes);
    const b = appliquer([...votes].reverse());
    expect(Object.keys(a.votes)).toHaveLength(8);
    expect(b.votes).toEqual(a.votes);
  });

  it('ne change rien quand une opération est reçue deux fois', () => {
    expect(appliquer([...votes, ...votes])).toEqual(appliquer(votes));
  });

  it('refuse des notes incomplètes ou hors de 1 à 10, et arrondit à l’entier', () => {
    const s = appliquer([
      { t: 'vote', round: 0, voterId: 'alice', dims: { ...notes(5, 5, 5, 5, 5), energie: 11 } },
      { t: 'vote', round: 0, voterId: 'bruno', dims: { energie: 5 } as MoodScores },
      { t: 'vote', round: 0, voterId: 'chloe', dims: notes(4.4, 5, 5, 5, 5) },
    ]);
    expect(Object.keys(s.votes)).toEqual(['chloe']);
    expect(s.votes.chloe.dims.energie).toBe(4);
  });
});

describe('Team Mood — révélation, discussion et nouveau tour', () => {
  const avant = appliquer([
    { t: 'vote', round: 0, voterId: 'alice', dims: notes(8, 3, 7, 9, 6), name: 'Alice', color: '#f59e0b' },
    { t: 'vote', round: 0, voterId: 'bruno', dims: notes(6, 4, 8, 2, 7) },
  ]);

  it('fige les votes vus par celui qui révèle, pour tout le monde', () => {
    const tardif: MoodOp = { t: 'vote', round: 0, voterId: 'chloe', dims: notes(1, 1, 1, 1, 1) };
    const revele: MoodOp = { t: 'reveal', round: 0, votes: avant.votes, chrono: arret };
    const x = appliquer([tardif, revele], avant);
    const y = appliquer([revele, tardif], avant);
    expect(Object.keys(x.votes).sort()).toEqual(['alice', 'bruno']);
    expect(y).toEqual(x);
  });

  it('ouvre la discussion depuis la moyenne, au demi-point, et seulement après révélation', () => {
    expect(appliquer([{ t: 'phase', round: 0, phase: 'discussion' }], avant).phase).toBe('vote');
    const s = appliquer([
      { t: 'reveal', round: 0, votes: avant.votes, chrono: arret },
      { t: 'phase', round: 0, phase: 'discussion' },
    ], avant);
    expect(s.phase).toBe('discussion');
    expect(s.collective).toEqual(notes(7, 3.5, 7.5, 5.5, 6.5));
  });

  it('ajuste chaque dimension indépendamment et garde les réglages en revenant aux votes', () => {
    const s = appliquer([
      { t: 'reveal', round: 0, votes: avant.votes, chrono: arret },
      { t: 'phase', round: 0, phase: 'discussion' },
      { t: 'collective', round: 0, key: 'charge', value: 2.3 },
      { t: 'collective', round: 0, key: 'liens', value: 42 },
      { t: 'phase', round: 0, phase: 'vote' },
      { t: 'phase', round: 0, phase: 'discussion' },
    ], avant);
    expect(s.collective?.charge).toBe(2.5);
    expect(s.collective?.liens).toBe(10);
    expect(s.collective?.energie).toBe(7);
  });

  it('efface tout au nouveau tour, sans laisser revenir un vote en retard', () => {
    const s = appliquer([
      { t: 'reveal', round: 0, votes: avant.votes, chrono: arret },
      { t: 'phase', round: 0, phase: 'discussion' },
      { t: 'newRound', round: 1, chrono: arret },
      { t: 'vote', round: 0, voterId: 'chloe', dims: notes(1, 1, 1, 1, 1) },
      { t: 'collective', round: 0, key: 'charge', value: 9 },
    ], avant);
    expect(s).toMatchObject({ round: 1, votes: {}, revealed: false, phase: 'vote', collective: null });
  });
});

describe('Team Mood — résultats', () => {
  const votes = {
    alice: { dims: notes(8, 3, 7, 9, 6) },
    bruno: { dims: notes(6, 4, 8, 2, 7) },
  };

  it('calcule moyenne, étendue et moral global', () => {
    const stats = computeMoodStats(votes);
    const liens = stats.find((s) => s.key === 'liens')!;
    expect(liens).toMatchObject({ average: 5.5, min: 2, max: 9, count: 2 });
    expect(computeMoodGlobal(stats)).toBe(6);
  });

  it('signale les moyennes basses et les avis partagés, les plus basses d’abord', () => {
    const points = pointsToDiscuss(computeMoodStats(votes));
    expect(points.map((p) => p.stat.key)).toEqual(['charge', 'liens']);
    expect(points[0]).toMatchObject({ low: true, split: false });
    expect(points[1]).toMatchObject({ low: false, split: true });
  });

  it('rédige une synthèse lisible', () => {
    const texte = buildMoodSummary(computeMoodStats(votes), notes(7, 3.5, 7.5, 5.5, 6.5), 2, new Date(2026, 8, 13));
    expect(texte).toContain('Team Mood — 13/09/2026');
    expect(texte).toContain('Moral global : 6 / 10 (2 votes)');
    expect(texte).toContain('Charge : moyenne 3,5 (de 3 à 4) · collectif 3,5');
    expect(texte).toContain('Points à discuter : Charge, Liens');
  });

  it('reprend un état enregistré par l’ancienne version', () => {
    const s = normalizeMoodState({ votes: { alice: { dims: notes(5, 5, 5, 5, 5) } }, revealed: true } as Partial<MoodState>);
    expect(s).toMatchObject({ round: 0, phase: 'vote', collective: null, anonymous: false });
    expect(Object.keys(s.votes)).toEqual(['alice']);
  });
});
