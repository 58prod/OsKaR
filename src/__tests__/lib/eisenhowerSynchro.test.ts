import {
  INITIAL_EISENHOWER_STATE,
  TICKET_POS_MAX,
  buildEisenhowerSummary,
  eisenhowerReducer,
  freePositionInQuadrant,
  groupesDuQuadrant,
  groupesTickets,
  normalizeEisenhowerState,
  quadrantAt,
  type EisenhowerOp,
  type EisenhowerState,
  type EisenhowerTicket,
  type QuadrantKey,
} from '@/components/toolbox/eisenhower/eisenhowerLogic';

/*
 * Synchronisation de la Matrice d'Eisenhower : chaque écran applique les
 * opérations qu'il reçoit, dans l'ordre où elles lui arrivent. Ces tests
 * jouent les mêmes opérations dans des ordres différents et vérifient que
 * tous les écrans aboutissent au même état.
 */

const appliquer = (ops: EisenhowerOp[], depart: EisenhowerState = INITIAL_EISENHOWER_STATE) => ops.reduce(eisenhowerReducer, depart);

/** La base (jsonb) réordonne les clés : on compare des états aux clés triées. */
const trie = (v: unknown): unknown => {
  if (Array.isArray(v)) return v.map(trie);
  if (v && typeof v === 'object') {
    return Object.fromEntries(Object.keys(v as object).sort().map((k) => [k, trie((v as Record<string, unknown>)[k])]));
  }
  return v;
};

const ticket = (id: string, authorId: string, quadrant: QuadrantKey = 'faire', text = `Ticket ${id}`): EisenhowerTicket => ({
  id, authorId, authorName: authorId, authorColor: '#000', quadrant, text, revealed: false,
});
const ajout = (t: EisenhowerTicket, round = 0): EisenhowerOp => ({ t: 'add', round, ticket: t });
const place = (t: EisenhowerTicket, x = 0.1, y = 0.1, round = 0): EisenhowerOp =>
  ({ t: 'publish', authorId: t.authorId, round, items: [{ id: t.id, pos: { x, y, q: quadrantAt(x, y), at: 1 }, ticket: t }] });

function permutations<T>(list: T[]): T[][] {
  if (list.length <= 1) return [list];
  return list.flatMap((x, i) => permutations([...list.slice(0, i), ...list.slice(i + 1)]).map((p) => [x, ...p]));
}

function toutesLesPermutationsDonnentLeMemeEtat(ops: EisenhowerOp[], depart?: EisenhowerState) {
  const ref = trie(appliquer(ops, depart));
  permutations(ops).forEach((p) => expect(trie(appliquer(p, depart))).toEqual(ref));
  return appliquer(ops, depart);
}

describe('Eisenhower — tickets simultanés', () => {
  const quadrants: QuadrantKey[] = ['faire', 'planifier', 'deleguer', 'abandonner'];
  const tickets = ['alice', 'bruno', 'chloe', 'david', 'emma', 'farid', 'gael', 'hugo']
    .flatMap((a, i) => [ticket(`m1s${i}a`, a, quadrants[i % 4]), ticket(`m1s${i}b`, a, quadrants[(i + 1) % 4])]);
  const ops = tickets.flatMap((t, i) => [ajout(t), place(t, (i % 9) / 10, (i % 8) / 10)]);

  it('garde tous les tickets à la même place, quel que soit l’ordre d’arrivée', () => {
    const x = appliquer(ops);
    const y = appliquer([...ops].reverse());
    expect(x.tickets).toHaveLength(16);
    expect(x.tickets.every((t) => t.revealed)).toBe(true);
    expect(y).toEqual(x);
  });

  it('ne change rien quand une opération est reçue deux fois', () => {
    expect(appliquer([...ops, ...ops])).toEqual(appliquer(ops));
  });

  it('garde les brouillons hors de la matrice', () => {
    const s = appliquer([ajout(ticket('m1-x', 'alice'))]);
    expect(groupesTickets(s)).toHaveLength(0);
  });
});

describe('Eisenhower — déplacements', () => {
  const a = ticket('m2-a', 'alice');
  const base = appliquer([ajout(a), place(a, 0.1, 0.1)]);

  it('change le quadrant avec le déplacement, et le plus récent l’emporte partout', () => {
    const m1: EisenhowerOp = { t: 'move', id: a.id, x: 0.7, y: 0.7, q: 'abandonner', at: 200 };
    const m2: EisenhowerOp = { t: 'move', id: a.id, x: 0.6, y: 0.2, q: 'planifier', at: 300 };
    const s = toutesLesPermutationsDonnentLeMemeEtat([m1, m2], base);
    expect(s.placements[a.id]).toMatchObject({ x: 0.6, y: 0.2, q: 'planifier' });
  });

  it('garde un déplacement arrivé avant le placement du ticket', () => {
    const b = ticket('m2-b', 'bruno', 'deleguer');
    const s = toutesLesPermutationsDonnentLeMemeEtat([
      ajout(b), place(b, 0.1, 0.6), { t: 'move', id: b.id, x: 0.2, y: 0.1, q: 'faire', at: 500 },
    ]);
    expect(s.placements[b.id]).toMatchObject({ x: 0.2, y: 0.1, q: 'faire' });
    expect(groupesTickets(s)[0].placement.q).toBe('faire');
  });

  it('garde le ticket sur la matrice', () => {
    const s = appliquer([{ t: 'move', id: a.id, x: 3, y: -1, q: 'planifier', at: 200 }], base);
    expect(s.placements[a.id]).toMatchObject({ x: TICKET_POS_MAX.x, y: 0 });
  });

  it('place un nouveau ticket dans son quadrant, sous le libellé', () => {
    (['faire', 'planifier', 'deleguer', 'abandonner'] as QuadrantKey[]).forEach((q) => {
      for (let i = 0; i < 20; i++) {
        const p = freePositionInQuadrant(q, [{ x: 0.1, y: 0.1 }]);
        expect(quadrantAt(p.x, p.y)).toBe(q);
        expect(p.q).toBe(q);
      }
    });
  });
});

describe('Eisenhower — regroupements', () => {
  const [a, b, c] = ['m3-a', 'm3-b', 'm3-c'].map((id, i) => ticket(id, ['alice', 'bruno', 'chloe'][i]));
  const base = appliquer([ajout(a), place(a, 0.1, 0.1), ajout(b), place(b, 0.3, 0.1), ajout(c), place(c, 0.6, 0.6)]);

  it('regroupe deux tickets, et le plus récent l’emporte si deux personnes regroupent le même', () => {
    const s = toutesLesPermutationsDonnentLeMemeEtat([
      { t: 'group', id: b.id, into: a.id, at: 10 },
      { t: 'group', id: b.id, into: c.id, at: 20 },
    ], base);
    const g = groupesTickets(s);
    expect(g).toHaveLength(2);
    expect(g.find((x) => x.tete.id === c.id)?.membres.map((m) => m.id)).toEqual([b.id]);
  });

  it('ignore une boucle de regroupements sans perdre de ticket', () => {
    const s = appliquer([
      { t: 'group', id: a.id, into: b.id, at: 10 },
      { t: 'group', id: b.id, into: a.id, at: 11 },
    ], base);
    const g = groupesTickets(s);
    expect(g.reduce((n, x) => n + 1 + x.membres.length, 0)).toBe(3);
  });

  it('détache un ticket', () => {
    const s = appliquer([
      { t: 'group', id: b.id, into: a.id, at: 10 },
      { t: 'group', id: b.id, into: null, at: 11 },
    ], base);
    expect(groupesTickets(s)).toHaveLength(3);
  });

  it('libère les tickets regroupés quand celui qui les accueille est supprimé', () => {
    const s = appliquer([
      { t: 'group', id: b.id, into: a.id, at: 10 },
      { t: 'delete', id: a.id, by: 'alice' },
    ], base);
    expect(groupesTickets(s).map((g) => g.tete.id).sort()).toEqual([b.id, c.id]);
  });
});

describe('Eisenhower — suivi et droits', () => {
  const a = ticket('m4-a', 'alice');
  const base = appliquer([ajout(a), place(a, 0.1, 0.1)]);

  it('garde le porteur et l’échéance les plus récents, quel que soit l’ordre', () => {
    const s = toutesLesPermutationsDonnentLeMemeEtat([
      { t: 'porteur', id: a.id, text: 'Bruno', at: 10 },
      { t: 'porteur', id: a.id, text: 'Chloé', at: 12 },
      { t: 'echeance', id: a.id, text: '2026-10-03', at: 11 },
      { t: 'echeance', id: a.id, text: 'demain', at: 9 },
    ], base);
    expect(s.porteurs[a.id].text).toBe('Chloé');
    expect(s.echeances[a.id].text).toBe('2026-10-03');
  });

  it('refuse une échéance qui n’est pas une date', () => {
    const s = appliquer([{ t: 'echeance', id: a.id, text: 'demain', at: 10 }], base);
    expect(s.echeances[a.id].text).toBe('');
  });

  it('ne laisse modifier ou supprimer un ticket que par son auteur ou l’animateur', () => {
    const s1 = appliquer([
      { t: 'edit', id: a.id, text: 'Piraté', at: 10, by: 'bruno' },
      { t: 'delete', id: a.id, by: 'bruno' },
    ], base);
    expect(s1.tickets).toHaveLength(1);
    expect(s1.textes[a.id]).toBeUndefined();
    const s2 = appliquer([{ t: 'edit', id: a.id, text: 'Reformulé', at: 10, by: 'bruno', moderator: true }], base);
    expect(s2.textes[a.id].text).toBe('Reformulé');
  });

  it('ne fait pas revenir un ticket supprimé par un message en retard', () => {
    const s = appliquer([{ t: 'delete', id: a.id, by: 'alice' }, ajout(a), place(a, 0.2, 0.2)], base);
    expect(s.tickets).toHaveLength(0);
    expect(s.placements[a.id]).toBeUndefined();
  });

  it('efface tout à la réinitialisation, et ignore ensuite les messages de l’ancienne séance', () => {
    const b = ticket('m4-b', 'bruno');
    const s = appliquer([
      { t: 'theme', text: 'Le trimestre', at: 5 },
      { t: 'reset', round: 1 },
      ajout(b, 0),
      place(b, 0.1, 0.1, 0),
    ], base);
    expect(s.tickets).toHaveLength(0);
    expect(s.theme.text).toBe('Le trimestre');
    expect(s.round).toBe(1);
  });
});

describe('Eisenhower — lecture et synthèse', () => {
  it('classe un quadrant du plus important et urgent au moins important', () => {
    const [a, b, c] = ['m5-a', 'm5-b', 'm5-c'].map((id) => ticket(id, 'alice'));
    const s = appliquer([ajout(a), place(a, 0.3, 0.3), ajout(b), place(b, 0.05, 0.1), ajout(c), place(c, 0.2, 0.1)]);
    expect(groupesDuQuadrant(groupesTickets(s), 'faire').map((g) => g.tete.id)).toEqual([b.id, c.id, a.id]);
  });

  it('résume la matrice quadrant par quadrant, avec le suivi et les regroupements', () => {
    const [a, b] = [ticket('m6-a', 'alice', 'faire', 'Rappeler le client'), ticket('m6-b', 'bruno', 'faire', 'Répondre au client')];
    const s = appliquer([
      ajout(a), place(a, 0.1, 0.1), ajout(b), place(b, 0.2, 0.2),
      { t: 'group', id: b.id, into: a.id, at: 5 },
      { t: 'porteur', id: a.id, text: 'Chloé', at: 5 },
      { t: 'echeance', id: a.id, text: '2026-10-03', at: 5 },
      { t: 'theme', text: 'Nos priorités', at: 5 },
    ]);
    const txt = buildEisenhowerSummary(s, new Date(2026, 8, 24));
    expect(txt).toContain('Sujet : Nos priorités');
    expect(txt).toContain('1. FAIRE');
    expect(txt).toContain('Rappeler le client — alice');
    expect(txt).toContain('porteur : Chloé · échéance : 03/10/2026');
    expect(txt).toContain('+ Répondre au client — bruno');
    expect(txt).toContain('4. ABANDONNER');
  });

  it('reprend un état incomplet ou abîmé sans planter', () => {
    const s = normalizeEisenhowerState({ tickets: [null, { id: 'x' }] } as unknown as EisenhowerState);
    expect(s.tickets).toEqual([]);
    expect(s.theme.text).toBe('');
  });
});
