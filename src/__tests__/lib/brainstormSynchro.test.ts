import type { BoardNote } from '@/components/toolbox/shared/boardNotes';
import {
  BRAINSTORM_TEXT_MAX,
  INITIAL_BRAINSTORM_STATE,
  POS_MAX,
  arrangeByColor,
  brainstormReducer,
  buildBrainstormSummary,
  freePosition,
  normalizeBrainstormState,
  type BrainstormOp,
  type BrainstormState,
} from '@/components/toolbox/brainstorm/brainstormLogic';

/*
 * Synchronisation du Brainstorming : chaque écran applique les opérations
 * qu'il reçoit, dans l'ordre où elles lui arrivent. Ces tests jouent le même
 * lot d'opérations dans des ordres différents et vérifient que tous les
 * écrans aboutissent au même état.
 */

const appliquer = (ops: BrainstormOp[], depart: BrainstormState = INITIAL_BRAINSTORM_STATE) =>
  ops.reduce(brainstormReducer, depart);

const postit = (id: string, authorId: string, text = `Idée ${id}`, category = 'cy'): BoardNote => ({
  id, authorId, authorName: authorId, authorColor: '#000', category, text, revealed: false, likedBy: [], retained: false,
});
const ajout = (n: BoardNote, round = 0): BrainstormOp => ({ t: 'add', round, note: n });
const revele = (n: BoardNote, x = 0.2, y = 0.3, at = 1): BrainstormOp =>
  ({ t: 'reveal', authorId: n.authorId, items: [{ id: n.id, pos: { x, y, rot: 1, at } }] });

describe('Brainstorming — post-its simultanés', () => {
  const postits = ['alice', 'bruno', 'chloe', 'david', 'emma', 'farid', 'gael', 'hugo']
    .map((a, i) => postit(`m1b${i}-x`, a, `Idée de ${a}`, ['cy', 'cb', 'cg'][i % 3]));
  const ops = postits.flatMap((n, i) => [ajout(n), revele(n, i / 10, i / 12)]);

  it('garde tous les post-its, à la même place et dans le même ordre partout', () => {
    const x = appliquer(ops);
    // Un autre écran reçoit les opérations de chacun dans un autre ordre (chaque auteur garde le sien).
    const parAuteur = postits.map((n, i) => [ajout(n), revele(n, i / 10, i / 12)]).reverse().flat();
    const y = appliquer(parAuteur);
    expect(x.notes).toHaveLength(8);
    expect(y.notes.map((n) => n.id)).toEqual(x.notes.map((n) => n.id));
    expect(y.positions).toEqual(x.positions);
  });

  it('ne change rien quand une opération est reçue deux fois', () => {
    expect(appliquer([...ops, ...ops])).toEqual(appliquer(ops));
  });

  it('révèle un post-it même si sa révélation arrive avant son ajout', () => {
    const n = postit('m1z-x', 'farid', 'Webinaire');
    const reveal: BrainstormOp = { t: 'reveal', authorId: 'farid', items: [{ id: n.id, pos: { x: 0.2, y: 0.5, rot: 0, at: 1 }, note: n }] };
    const desordre = appliquer([reveal, ajout(n)]);
    const ordre = appliquer([ajout(n), reveal]);
    expect(desordre.notes).toHaveLength(1);
    expect(desordre.notes[0].revealed).toBe(true);
    expect(desordre).toEqual(ordre);
    // Personne ne peut révéler le post-it d'un autre en le fabriquant.
    const usurpe: BrainstormOp = { t: 'reveal', authorId: 'hugo', items: [{ id: 'm1y', pos: { x: 0, y: 0, rot: 0 }, note: postit('m1y', 'farid') }] };
    expect(appliquer([usurpe]).notes).toHaveLength(0);
  });

  it('cumule les cœurs envoyés au même moment, sans bascule', () => {
    const votes: BrainstormOp[] = postits.map((n) => ({ t: 'like', id: postits[0].id, voterId: n.authorId, liked: true }));
    const s = appliquer([...ops, ...votes, ...votes]);
    expect(s.notes.find((n) => n.id === postits[0].id)?.likedBy).toHaveLength(8);
  });
});

describe('Brainstorming — déplacements', () => {
  const a = postit('m2-a', 'alice');
  const base = appliquer([ajout(a), revele(a, 0.2, 0.3, 100)]);

  it('le déplacement le plus récent l’emporte, quel que soit l’ordre d’arrivée', () => {
    const m1: BrainstormOp = { t: 'move', id: a.id, x: 0.5, y: 0.5, at: 200 };
    const m2: BrainstormOp = { t: 'move', id: a.id, x: 0.1, y: 0.7, at: 300 };
    const x = appliquer([m1, m2], base);
    const y = appliquer([m2, m1], base);
    expect(x.positions[a.id]).toEqual(y.positions[a.id]);
    expect(x.positions[a.id]).toMatchObject({ x: 0.1, y: 0.7, rot: 1 });
  });

  it('garde le post-it sur le canvas', () => {
    const s = appliquer([{ t: 'move', id: a.id, x: 3, y: -1, at: 200 }], base);
    expect(s.positions[a.id]).toMatchObject({ x: POS_MAX.x, y: 0 });
  });

  it('range les post-its couleur par couleur, les plus aimés d’abord', () => {
    const b = postit('m2-b', 'bruno', 'Bleu', 'cb');
    const c = postit('m2-c', 'chloe', 'Jaune aimé', 'cy');
    const s = appliquer([ajout(b), revele(b), ajout(c), revele(c), { t: 'like', id: c.id, voterId: 'x', liked: true }], base);
    const places = arrangeByColor(s.notes, 3, 500);
    const ordre = Object.entries(places).sort(([, p], [, q]) => p.y - q.y || p.x - q.x).map(([id]) => id);
    expect(ordre).toEqual([c.id, a.id, b.id]);
    const rangee = appliquer([{ t: 'arrange', positions: places }], s);
    expect(rangee.positions[b.id]).toMatchObject({ rot: 0, at: 500 });
  });

  it('pose un nouveau post-it loin de ceux déjà placés', () => {
    const occupes = [{ x: 0.1, y: 0.1, rot: 0 }, { x: 0.12, y: 0.15, rot: 0 }];
    let graine = 0;
    const rand = () => { graine = (graine * 9301 + 49297) % 233280; return graine / 233280; };
    const p = freePosition(occupes, 0, rand);
    expect(Math.hypot((p.x - 0.1) * 1.6, p.y - 0.1)).toBeGreaterThan(0.3);
  });
});

describe('Brainstorming — règles et séance', () => {
  const a = postit('m3-a', 'alice');
  const b = postit('m3-b', 'bruno');
  const base = appliquer([ajout(a), revele(a), ajout(b)]);

  it('ne révèle que ses propres idées, et « reprendre » les renvoie en préparation', () => {
    expect(appliquer([{ t: 'reveal', authorId: 'alice', items: [{ id: b.id, pos: { x: 0, y: 0, rot: 0 } }] }], base)
      .notes.find((n) => n.id === b.id)?.revealed).toBe(false);
    const repris = appliquer([{ t: 'unreveal', authorId: 'alice' }], base);
    expect(repris.notes.find((n) => n.id === a.id)?.revealed).toBe(false);
    expect(repris.positions[a.id]).toBeUndefined();
  });

  it('laisse supprimer ses idées ; l’animateur peut supprimer n’importe laquelle', () => {
    expect(appliquer([{ t: 'delete', id: a.id, by: 'bruno' }], base).notes).toHaveLength(2);
    expect(appliquer([{ t: 'delete', id: a.id, by: 'alice' }], base).notes).toHaveLength(1);
    expect(appliquer([{ t: 'delete', id: a.id, by: 'chloe', moderator: true }], base).positions[a.id]).toBeUndefined();
  });

  it('« Retenir » reçu deux fois ne s’annule pas', () => {
    const r: BrainstormOp = { t: 'retain', id: a.id, retained: true };
    expect(appliquer([r, r], base).notes.find((n) => n.id === a.id)?.retained).toBe(true);
  });

  it('borne le texte et remplace une couleur inconnue par le jaune', () => {
    const s = appliquer([ajout(postit('m3-c', 'chloe', 'x'.repeat(400), 'zz'))]);
    expect(s.notes[0].text).toHaveLength(BRAINSTORM_TEXT_MAX);
    expect(s.notes[0].category).toBe('cy');
  });

  it('la réinitialisation garde le thème et ignore une idée envoyée juste avant', () => {
    const s = appliquer([
      { t: 'theme', theme: 'Réduire les délais' },
      { t: 'reset', round: 1 },
      ajout(postit('m3-d', 'david'), 0),
      { t: 'reset', round: 1 },
    ], base);
    expect(s).toMatchObject({ round: 1, notes: [], positions: {}, theme: 'Réduire les délais' });
  });
});

describe('Brainstorming — export et anciennes sessions', () => {
  it('liste les idées retenues d’abord, sans les noms si la séance est anonyme', () => {
    const a = { ...postit('m4-a', 'alice', 'Un atelier client', 'cg'), authorName: 'Alice' };
    const b = { ...postit('m4-b', 'bruno', 'Un tableau partagé', 'cb'), authorName: 'Bruno' };
    const s = appliquer([
      { t: 'theme', theme: 'Fidéliser' },
      ajout(a), revele(a), ajout(b), revele(b),
      { t: 'like', id: b.id, voterId: 'alice', liked: true },
      { t: 'retain', id: a.id, retained: true },
    ]);
    const txt = buildBrainstormSummary(s, new Date(2026, 8, 14));
    expect(txt).toContain('Thème : Fidéliser');
    expect(txt.indexOf('IDÉES RETENUES')).toBeLessThan(txt.indexOf('AUTRES IDÉES'));
    expect(txt).toContain('- [Vert] Un atelier client  (0 vote — Alice)');
    expect(buildBrainstormSummary({ ...s, anonymous: true })).not.toContain('Bruno');
  });

  it('reprend un état enregistré par l’ancienne version', () => {
    const n = { ...postit('m5', 'alice'), revealed: true };
    const s = normalizeBrainstormState({ notes: [n], positions: { m5: { x: 0.2, y: 0.4, rot: 2 } }, theme: 'Vieux' } as Partial<BrainstormState>);
    expect(s).toMatchObject({ round: 0, anonymous: false, theme: 'Vieux' });
    expect(s.positions.m5).toMatchObject({ x: 0.2, y: 0.4, rot: 2, at: 0 });
  });
});
