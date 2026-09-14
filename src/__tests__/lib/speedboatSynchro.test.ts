import type { BoardNote } from '@/components/toolbox/shared/boardNotes';
import {
  CARD_POS_MAX,
  INITIAL_SPEEDBOAT_STATE,
  SPEEDBOAT_TEXT_MAX,
  buildSpeedboatSummary,
  freePositionInZone,
  getSpeedboatZone,
  normalizeSpeedboatState,
  speedboatReducer,
  votesUsedBy,
  zoneAt,
  type SpeedboatOp,
  type SpeedboatState,
} from '@/components/toolbox/speedboat/speedboatLogic';

/*
 * Synchronisation du Speedboat : chaque écran applique les opérations qu'il
 * reçoit, dans l'ordre où elles lui arrivent. Ces tests jouent les mêmes
 * opérations dans des ordres différents et vérifient que tous les écrans
 * aboutissent au même état.
 */

const appliquer = (ops: SpeedboatOp[], depart: SpeedboatState = INITIAL_SPEEDBOAT_STATE) => ops.reduce(speedboatReducer, depart);

const ticket = (id: string, authorId: string, category = 'vent', text = `Ticket ${id}`): BoardNote => ({
  id, authorId, authorName: authorId, authorColor: '#000', category, text, revealed: false, likedBy: [], retained: false,
});
const ajout = (n: BoardNote, round = 0): SpeedboatOp => ({ t: 'add', round, note: n });
const place = (n: BoardNote, x = 0.1, y = 0.1, round = 0): SpeedboatOp =>
  ({ t: 'publish', authorId: n.authorId, round, items: [{ id: n.id, pos: { x, y, at: 1 }, note: n }] });

function permutations<T>(list: T[]): T[][] {
  if (list.length <= 1) return [list];
  return list.flatMap((x, i) => permutations([...list.slice(0, i), ...list.slice(i + 1)]).map((p) => [x, ...p]));
}

describe('Speedboat — tickets simultanés', () => {
  const zones = ['vent', 'objectif', 'ancre', 'recif'];
  const tickets = ['alice', 'bruno', 'chloe', 'david', 'emma', 'farid', 'gael', 'hugo']
    .flatMap((a, i) => [ticket(`m1s${i}a`, a, zones[i % 4]), ticket(`m1s${i}b`, a, zones[(i + 1) % 4])]);
  const ops = tickets.flatMap((n, i) => [ajout(n), place(n, (i % 5) / 10, (i % 4) / 10)]);

  it('garde tous les tickets à la même place, quel que soit l’ordre d’arrivée', () => {
    const x = appliquer(ops);
    const y = appliquer([...ops].reverse());
    expect(x.notes).toHaveLength(16);
    expect(x.notes.every((n) => n.revealed)).toBe(true);
    expect(y.notes).toEqual(x.notes);
    expect(y.positions).toEqual(x.positions);
  });

  it('ne change rien quand une opération est reçue deux fois', () => {
    expect(appliquer([...ops, ...ops])).toEqual(appliquer(ops));
  });

  it('cumule les cœurs envoyés au même moment, sans bascule', () => {
    const votes: SpeedboatOp[] = ['bruno', 'chloe', 'david'].map((v) => ({ t: 'like', id: 'm1s0a', voterId: v, liked: true }));
    expect(appliquer([...ops, ...votes, ...votes]).notes.find((n) => n.id === 'm1s0a')?.likedBy).toHaveLength(3);
  });
});

describe('Speedboat — déplacements et zones', () => {
  const a = ticket('m2-a', 'alice', 'vent');
  const base = appliquer([ajout(a), place(a, 0.1, 0.1)]);

  it('change la zone avec le déplacement, et le plus récent l’emporte partout', () => {
    const m1: SpeedboatOp = { t: 'move', id: a.id, zone: 'recif', x: 0.7, y: 0.7, at: 200 };
    const m2: SpeedboatOp = { t: 'move', id: a.id, zone: 'objectif', x: 0.6, y: 0.2, at: 300 };
    const x = appliquer([m1, m2], base);
    const y = appliquer([m2, m1], base);
    expect(x).toEqual(y);
    expect(x.notes[0].category).toBe('objectif');
    expect(x.positions[a.id]).toMatchObject({ x: 0.6, y: 0.2 });
  });

  it('garde le ticket sur la scène', () => {
    const s = appliquer([{ t: 'move', id: a.id, zone: 'recif', x: 3, y: -1, at: 200 }], base);
    expect(s.positions[a.id]).toMatchObject({ x: CARD_POS_MAX.x, y: 0 });
  });

  it('reconnaît la zone sous le pointeur', () => {
    expect([zoneAt(0.2, 0.2), zoneAt(0.8, 0.2), zoneAt(0.2, 0.8), zoneAt(0.8, 0.8)]).toEqual(['vent', 'objectif', 'ancre', 'recif']);
  });

  it('pose un nouveau ticket dans sa zone, loin des autres', () => {
    const zone = getSpeedboatZone('recif');
    let graine = 0;
    const rand = () => { graine = (graine * 9301 + 49297) % 233280; return graine / 233280; };
    const p = freePositionInZone(zone, [{ x: 0.55, y: 0.6 }], 0, rand);
    expect(zoneAt(p.x + 0.01, p.y + 0.01)).toBe('recif');
    expect(Math.hypot((p.x - 0.55) * 1.5, p.y - 0.6)).toBeGreaterThan(0.1);
  });
});

describe('Speedboat — règles, désordre et réinitialisation', () => {
  const a = ticket('m3-a', 'alice');
  const b = ticket('m3-b', 'bruno');

  it('interdit de voter pour son propre ticket et respecte la limite de cœurs', () => {
    const tickets = ['m3-c', 'm3-d', 'm3-e'].map((id) => ticket(id, 'bruno'));
    const s = appliquer([
      { t: 'voteLimit', value: 2 },
      ajout(a), place(a),
      ...tickets.flatMap((n) => [ajout(n), place(n)]),
      { t: 'like', id: a.id, voterId: 'alice', liked: true },
      ...tickets.map((n): SpeedboatOp => ({ t: 'like', id: n.id, voterId: 'alice', liked: true })),
    ]);
    expect(s.notes.find((n) => n.id === a.id)?.likedBy).toEqual([]);
    expect(votesUsedBy(s.notes, 'alice')).toBe(2);
  });

  it('ne place pas le ticket d’un autre, et un ticket supprimé ne revient jamais', () => {
    expect(appliquer([ajout(b), { t: 'publish', authorId: 'alice', items: [{ id: b.id, pos: { x: 0, y: 0 } }] }]).notes[0].revealed).toBe(false);
    const suppr: SpeedboatOp = { t: 'delete', id: a.id, by: 'chloe', moderator: true };
    permutations([ajout(a), place(a), suppr]).forEach((ordre) => {
      const s = appliquer(ordre);
      expect(s.notes).toEqual([]);
      expect(s.positions).toEqual({});
    });
  });

  it('place un ticket même si son placement arrive avant son ajout', () => {
    const s = appliquer([place(a), ajout(a)]);
    expect(s.notes[0].revealed).toBe(true);
    expect(s).toEqual(appliquer([ajout(a), place(a)]));
  });

  it('« Retenir » reçu deux fois ne s’annule pas', () => {
    const r: SpeedboatOp = { t: 'retain', id: a.id, retained: true };
    expect(appliquer([ajout(a), place(a), r, r]).notes[0].retained).toBe(true);
  });

  it('efface les tickets, garde les réglages et ignore ce qui a été envoyé avant la remise à zéro', () => {
    const s = appliquer([
      { t: 'anonymous', value: true },
      ajout(a), place(a),
      { t: 'reset', round: 1 },
      place(b), ajout(b),
      { t: 'reset', round: 1 },
    ]);
    expect(s).toMatchObject({ round: 1, notes: [], positions: {}, anonymous: true });
  });

  it('borne le texte et range une zone inconnue dans « Le Vent »', () => {
    const s = appliquer([ajout(ticket('m3-f', 'emma', 'nulle-part', 'x'.repeat(400)))]);
    expect(s.notes[0].text).toHaveLength(SPEEDBOAT_TEXT_MAX);
    expect(s.notes[0].category).toBe('vent');
  });
});

describe('Speedboat — export et anciennes sessions', () => {
  it('liste les zones, tickets retenus d’abord, sans les noms si la séance est anonyme', () => {
    const v = { ...ticket('m4-a', 'alice', 'vent', 'Bonne entraide'), authorName: 'Alice' };
    const r = { ...ticket('m4-b', 'bruno', 'recif', 'Serveur en panne'), authorName: 'Bruno' };
    const s = appliquer([ajout(v), place(v), ajout(r), place(r, 0.6, 0.6), { t: 'retain', id: r.id, retained: true }]);
    const txt = buildSpeedboatSummary(s, new Date(2026, 8, 14));
    expect(txt).toContain('LE VENT');
    expect(txt).toContain('Bonne entraide  (0 vote — Alice)');
    expect(txt).toContain('[✓] Serveur en panne');
    expect(buildSpeedboatSummary({ ...s, anonymous: true })).not.toContain('Bruno');
  });

  it('reprend un état enregistré par l’ancienne version', () => {
    const n = { ...ticket('m5', 'alice', 'ancre'), revealed: true };
    const s = normalizeSpeedboatState({ notes: [n], positions: { m5: { x: 0.2, y: 0.6 } } } as Partial<SpeedboatState>);
    expect(s).toMatchObject({ round: 0, anonymous: false, voteLimit: 0, deleted: [] });
    expect(s.positions.m5).toMatchObject({ x: 0.2, y: 0.6, at: 0 });
  });
});
