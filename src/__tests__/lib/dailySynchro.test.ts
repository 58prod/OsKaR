import {
  INITIAL_DAILY_STATE,
  dailyReducer,
  normalizeDailyState,
  shuffled,
  totalElapsed,
  type DailyOp,
  type DailyState,
} from '@/components/toolbox/daily/dailyLogic';

/*
 * Synchronisation du Daily : chaque écran applique les opérations qu'il
 * reçoit, dans l'ordre où elles lui arrivent. Ces tests vérifient qu'un geste
 * doublé (double clic, deux animateurs) ne fait avancer qu'une fois, et que
 * tous les écrans aboutissent au même état.
 */

const appliquer = (ops: DailyOp[], depart: DailyState = INITIAL_DAILY_STATE) => ops.reduce(dailyReducer, depart);
const noms = { alice: { name: 'Alice', color: '#f59e0b' }, bruno: { name: 'Bruno', color: '#3b82f6' }, chloe: { name: 'Chloé', color: '#ec4899' } };
const demarre: DailyOp = { t: 'start', run: 1, token: 'a', order: ['alice', 'bruno', 'chloe'], names: noms, at: 1_000 };

describe('Daily — démarrage', () => {
  it('lance le premier tour avec la durée par personne', () => {
    const s = appliquer([demarre]);
    expect(s.phase).toBe('running');
    expect(s.currentIdx).toBe(0);
    expect(s.endsAt).toBe(1_000 + 120_000);
    expect(s.names.bruno.name).toBe('Bruno');
  });

  it('départage deux animateurs qui démarrent en même temps, quel que soit l’ordre reçu', () => {
    const autre: DailyOp = { ...demarre, token: 'b', order: ['chloe', 'bruno', 'alice'] } as DailyOp;
    const x = appliquer([demarre, autre]);
    const y = appliquer([autre, demarre]);
    expect(x).toEqual(y);
    expect(x.order).toEqual(['chloe', 'bruno', 'alice']);
  });

  it('ne redémarre pas quand l’opération est reçue deux fois', () => {
    const s = appliquer([demarre, { t: 'next', run: 1, idx: 0, at: 2_000 }, demarre]);
    expect(s.phase).toBe('next');
  });
});

describe('Daily — enchaînement des tours', () => {
  it('« Suivant » cliqué deux fois ne fait avancer que d’une personne', () => {
    const suivant: DailyOp = { t: 'next', run: 1, idx: 0, at: 2_000 };
    const go: DailyOp = { t: 'go', run: 1, idx: 1, endsAt: 200_000 };
    const s = appliquer([demarre, suivant, suivant, go, go, suivant]);
    expect(s.phase).toBe('running');
    expect(s.currentIdx).toBe(1);
  });

  it('pause et reprise ne concernent que le tour en cours', () => {
    const s1 = appliquer([demarre, { t: 'pause', run: 1, idx: 0, remainingSec: 42 }]);
    expect(s1.phase).toBe('paused');
    expect(s1.remainingSec).toBe(42);
    const s2 = appliquer([{ t: 'resume', run: 1, idx: 0, endsAt: 99_000 }], s1);
    expect(s2.phase).toBe('running');
    expect(s2.endsAt).toBe(99_000);
    // Une pause envoyée pour le tour précédent est ignorée.
    expect(appliquer([{ t: 'pause', run: 1, idx: 5, remainingSec: 1 }], s2).phase).toBe('running');
  });

  it('termine après la dernière personne, avec la durée totale', () => {
    const s = appliquer([
      demarre,
      { t: 'next', run: 1, idx: 0, at: 2_000 }, { t: 'go', run: 1, idx: 1, endsAt: 0 },
      { t: 'next', run: 1, idx: 1, at: 3_000 }, { t: 'go', run: 1, idx: 2, endsAt: 0 },
      { t: 'next', run: 1, idx: 2, at: 61_000 },
    ]);
    expect(s.phase).toBe('done');
    expect(totalElapsed(s, 999_999)).toBe(60);
  });

  it('passe le tour d’une personne absente, et termine si c’était la dernière', () => {
    const s = appliquer([
      demarre,
      { t: 'next', run: 1, idx: 0, at: 2_000 },
      { t: 'skip', run: 1, idx: 1, at: 2_500 },
      { t: 'skip', run: 1, idx: 1, at: 2_500 },
    ]);
    expect(s.phase).toBe('next');
    expect(s.currentIdx).toBe(1);
    expect(s.skipped).toEqual(['bruno']);
    const fin = appliquer([{ t: 'skip', run: 1, idx: 2, at: 3_000 }], s);
    expect(fin.phase).toBe('done');
    expect(fin.skipped).toEqual(['bruno', 'chloe']);
  });
});

describe('Daily — retardataires et arrêt', () => {
  it('ajoute un retardataire en fin de tour, une seule fois', () => {
    const j: DailyOp = { t: 'join', run: 1, id: 'david', person: { name: 'David', color: '#000' } };
    const s = appliquer([demarre, j, j]);
    expect(s.order).toEqual(['alice', 'bruno', 'chloe', 'david']);
    expect(s.names.david.name).toBe('David');
  });

  it('range deux arrivées simultanées dans le même ordre partout', () => {
    const e: DailyOp = { t: 'join', run: 1, id: 'emma', person: { name: 'Emma', color: '#000' } };
    const d: DailyOp = { t: 'join', run: 1, id: 'david', person: { name: 'David', color: '#000' } };
    expect(appliquer([demarre, e, d]).order).toEqual(appliquer([demarre, d, e]).order);
  });

  it('n’ajoute personne hors séance ni d’une séance précédente', () => {
    const j: DailyOp = { t: 'join', run: 0, id: 'david', person: { name: 'David', color: '#000' } };
    expect(appliquer([j]).order).toEqual([]);
    expect(appliquer([demarre, j]).order).toHaveLength(3);
  });

  it('l’arrêt remet à zéro en gardant les réglages, et ignore les gestes de l’ancienne séance', () => {
    const s = appliquer([
      { t: 'duration', durationSec: 60 },
      { t: 'randomOrder', value: true },
      { ...demarre, run: 1 } as DailyOp,
      { t: 'stop', run: 2, token: 'z' },
      { t: 'next', run: 1, idx: 0, at: 5_000 },
    ]);
    expect(s.phase).toBe('idle');
    expect(s.durationSec).toBe(60);
    expect(s.randomOrder).toBe(true);
    expect(s.order).toEqual([]);
  });

  it('borne la durée par personne et garde le temps du tour en cours', () => {
    expect(appliquer([{ t: 'duration', durationSec: 5 }]).durationSec).toBe(15);
    const s = appliquer([demarre, { t: 'pause', run: 1, idx: 0, remainingSec: 50 }, { t: 'duration', durationSec: 300 }]);
    expect(s.durationSec).toBe(300);
    expect(s.remainingSec).toBe(50);
  });
});

describe('Daily — utilitaires et anciennes sessions', () => {
  it('le tirage au sort garde tout le monde', () => {
    const ids = ['a', 'b', 'c', 'd', 'e'];
    expect(shuffled(ids).sort()).toEqual(ids);
  });

  it('complète un état enregistré par l’ancienne version', () => {
    const ancien = { phase: 'running', order: ['alice', 'bruno'], currentIdx: 1, durationSec: 90, endsAt: 5, remainingSec: 90, startedAt: 1 } as Partial<DailyState>;
    const s = normalizeDailyState(ancien);
    expect(s.baseCount).toBe(2);
    expect(s.names).toEqual({});
    expect(s.run).toBe(0);
    expect(dailyReducer(s, { t: 'next', run: 0, idx: 1, at: 10 }).phase).toBe('done');
  });
});
