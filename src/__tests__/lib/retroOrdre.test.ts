import {
  INITIAL_RETRO_STATE, boardKey, keyBeside, retroReducer, sortBoardNotes, sortQueue,
  type RetroNote, type RetroOp, type RetroState,
} from '@/components/toolbox/retro/retroLogic';

/*
 * Rétrospective : ordre des notes (révélation, rangement à la main,
 * regroupement par personne), notes abordées et modification d'une note.
 * Quel que soit l'ordre d'arrivée des messages, tous les écrans finissent
 * identiques.
 */

const note = (id: string, authorId: string, category = 'plus'): RetroNote => ({
  id, authorId, authorName: authorId, authorColor: '#000', category, text: `Note ${id}`,
  revealed: false, likedBy: [], retained: false,
});

const r = (ops: RetroOp[], s: RetroState = INITIAL_RETRO_STATE) => ops.reduce(retroReducer, s);
const add = (n: RetroNote): RetroOp => ({ t: 'addNote', note: n, today: '2026-10-19', session: 0 });
const reveal = (ns: RetroNote[], at: number): RetroOp => ({
  t: 'reveal', ids: ns.map((n) => n.id), authorId: ns[0].authorId, session: 0, notes: ns, at,
});

function permutations<T>(list: T[]): T[][] {
  if (list.length <= 1) return [list];
  return list.flatMap((x, i) => permutations([...list.slice(0, i), ...list.slice(i + 1)]).map((p) => [x, ...p]));
}

describe('Rétrospective — ordre des notes', () => {
  // Créées dans l'ordre a1, b1, a2 ; révélées : b1 d'abord, puis a1 et a2 ensemble.
  const a1 = note('a1', 'alice');
  const b1 = note('b1', 'bruno');
  const a2 = note('a2', 'alice');
  const base = r([add(a1), add(b1), add(a2), reveal([b1], 1000), reveal([a1, a2], 2000)]);

  it('affiche les notes dans l’ordre de leur révélation, pas de leur création', () => {
    expect(sortBoardNotes(base.notes).map((n) => n.id)).toEqual(['b1', 'a1', 'a2']);
  });

  it('met les notes masquées après les notes révélées, et les notes abordées tout en bas', () => {
    const s = r([add(note('c1', 'chloe')), { t: 'treated', ids: ['b1'], treated: true, at: 3000 }], base);
    expect(sortBoardNotes(s.notes).map((n) => n.id)).toEqual(['a1', 'a2', 'c1', 'b1']);
  });

  it('une révélation reçue deux fois ne change pas la place de la note', () => {
    const s = r([reveal([b1], 9000)], base);
    expect(s.notes.find((n) => n.id === 'b1')!.revealedAt).toBe(1000);
  });

  it('range une note à la main, et le plus récent l’emporte quel que soit l’ordre d’arrivée', () => {
    const avant: RetroOp = { t: 'order', orders: { a2: 500 }, at: 3000 };
    const apres: RetroOp = { t: 'order', orders: { a2: 1500 }, at: 4000 };
    const egal: RetroOp = { t: 'order', orders: { a2: 1200 }, at: 4000 };
    const results = permutations([avant, apres, egal]).map((ops) => r(ops, base).notes);
    results.forEach((notes) => expect(notes).toEqual(results[0]));
    expect(sortBoardNotes(results[0]).map((n) => n.id)).toEqual(['b1', 'a2', 'a1']);
  });

  it('marquer abordée / plus abordée converge quel que soit l’ordre', () => {
    const oui: RetroOp = { t: 'treated', ids: ['a1'], treated: true, at: 3000 };
    const non: RetroOp = { t: 'treated', ids: ['a1'], treated: false, at: 3500 };
    expect(r([oui, non], base).notes).toEqual(r([non, oui], base).notes);
    expect(r([non, oui], base).notes.find((n) => n.id === 'a1')!.treated).toBe(false);
  });

  it('« Annuler ma révélation » efface la place, l’état abordé et le rangement', () => {
    const s = r([
      { t: 'treated', ids: ['a1'], treated: true, at: 3000 },
      { t: 'order', orders: { a1: 10 }, at: 3000 },
      { t: 'unreveal', authorId: 'alice' },
    ], base);
    const n = s.notes.find((x) => x.id === 'a1')!;
    expect(n).toMatchObject({ revealed: false, treated: undefined, order: undefined, revealedAt: undefined });
  });

  it('regroupe par personne avant même les révélations, et chaque note révélée reste dans son groupe', () => {
    const b2 = note('b2', 'bruno');
    const c1 = note('c1', 'chloe');
    const s = r([add(b2), add(c1), { t: 'groupByAuthor', on: true, at: 3000 }], base);
    // Alice (a1, a2), puis Bruno (b1 révélée, b2 masquée), puis Chloé (masquée).
    expect(sortBoardNotes(s.notes, s.groupByAuthor).map((n) => n.id)).toEqual(['a1', 'a2', 'b1', 'b2', 'c1']);
    const t = r([reveal([c1], 4000), { t: 'treated', ids: ['a1'], treated: true, at: 5000 }], s);
    expect(sortBoardNotes(t.notes, t.groupByAuthor).map((n) => n.id)).toEqual(['a2', 'b1', 'b2', 'c1', 'a1']);
    // Sans regroupement : ordre de révélation, masquées ensuite.
    expect(sortBoardNotes(t.notes).map((n) => n.id)).toEqual(['b1', 'a2', 'c1', 'b2', 'a1']);
  });

  it('activer / désactiver le regroupement converge quel que soit l’ordre', () => {
    const on: RetroOp = { t: 'groupByAuthor', on: true, at: 100 };
    const off: RetroOp = { t: 'groupByAuthor', on: false, at: 200 };
    expect(r([on, off]).groupByAuthor).toBe(false);
    expect(r([off, on]).groupByAuthor).toBe(false);
    expect(r([on]).groupByAuthor).toBe(true);
  });

  it('calcule une place avant, après ou entre deux notes', () => {
    expect(keyBeside([10, 20, 30], 1, 'before')).toBe(15);
    expect(keyBeside([10, 20, 30], 1, 'after')).toBe(25);
    expect(keyBeside([10, 20, 30], 0, 'before')).toBe(9);
    expect(keyBeside([10, 20, 30], 2, 'after')).toBe(31);
    expect(boardKey({ ...a1, revealedAt: 7, order: 3 })).toBe(3);
  });

  it('la file de préparation suit les flèches ↑ ↓ et révèle dans cet ordre', () => {
    const c1 = note('c1', 'chloe');
    const c2 = note('c2', 'chloe');
    const s = r([add(c1), add(c2), { t: 'order', orders: { c2: 0 }, at: 100, queue: true }]);
    const mine = sortQueue(s.notes);
    expect(mine.map((n) => n.id)).toEqual(['c2', 'c1']);
    const t = r([reveal(mine, 5000)], s);
    expect(sortBoardNotes(t.notes).map((n) => n.id)).toEqual(['c2', 'c1']);
    expect(sortQueue(t.notes).map((n) => n.id)).toEqual(['c2', 'c1']);
  });
});

describe('Rétrospective — modifier une note', () => {
  const n = note('m1', 'alice');
  const edit = (patch: Partial<RetroNote>, at: number, authorId = 'alice'): RetroOp => ({
    t: 'editNote', note: { ...n, authorId, ...patch }, at, session: 0,
  });

  it('change le texte de sa note, la modification la plus récente gagne', () => {
    const e1 = edit({ text: 'Première' }, 100);
    const e2 = edit({ text: 'Seconde' }, 200);
    expect(r([add(n), e1, e2]).notes[0].text).toBe('Seconde');
    expect(r([add(n), e2, e1]).notes[0].text).toBe('Seconde');
  });

  it('refuse la modification par une autre personne', () => {
    expect(r([add(n), edit({ text: 'Usurpée' }, 100, 'hugo')]).notes[0].text).toBe('Note m1');
  });

  it('change le quadrant tant que la note n’est pas révélée, plus ensuite', () => {
    expect(r([add(n), edit({ category: 'minus' }, 100)]).notes[0].category).toBe('minus');
    const revelee = r([add(n), reveal([n], 50), { t: 'move', id: 'm1', category: 'question' }]);
    expect(r([edit({ text: 'Corrigée', category: 'plus' }, 100)], revelee).notes[0])
      .toMatchObject({ text: 'Corrigée', category: 'question' });
  });

  it('n’est pas perdue si elle arrive avant l’ajout ou après la révélation', () => {
    const e = edit({ text: 'Corrigée', category: 'start', editedAt: 100 }, 100);
    const rev = reveal([{ ...n, text: 'Corrigée', category: 'start', editedAt: 100 }], 200);
    const results = permutations([add(n), e, rev]).map((ops) => r(ops).notes);
    results.forEach((notes) => {
      expect(notes).toHaveLength(1);
      expect(notes[0]).toMatchObject({ text: 'Corrigée', category: 'start', revealed: true });
    });
  });

  it('ne fait pas revenir une note supprimée', () => {
    expect(r([add(n), { t: 'deleteNote', id: 'm1' }, edit({ text: 'x' }, 100)]).notes).toHaveLength(0);
  });
});

describe('Rétrospective — couleur des participants', () => {
  it('donne une couleur libre quand la sienne est prise, et la garde sinon', () => {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { couleurLibre, PARTICIPANT_PALETTE } = require('@/utils/toolIdentity');
    expect(couleurLibre(['#2563eb'], '#dc2626')).toBe('#dc2626');
    expect(couleurLibre(['#2563eb', '#dc2626'], '#2563eb')).toBe('#16a34a');
    expect(couleurLibre(PARTICIPANT_PALETTE, '#2563eb')).toBe('#2563eb');
    expect(new Set(PARTICIPANT_PALETTE).size).toBe(PARTICIPANT_PALETTE.length);
  });

  it('garde une couleur libre foncée telle quelle et assombrit une couleur trop claire', () => {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { couleurLisible, PARTICIPANT_PALETTE } = require('@/utils/toolIdentity');
    expect(couleurLisible('#1E293B')).toBe('#1e293b');
    expect(couleurLisible('#ffffff')).not.toBe('#ffffff');
    expect(couleurLisible('#ffff00')).toMatch(/^#[0-9a-f]{6}$/);
    expect(couleurLisible('rouge')).toBe(PARTICIPANT_PALETTE[0]);
    PARTICIPANT_PALETTE.forEach((c: string) => expect(couleurLisible(c)).toBe(c));
  });

  it('recolore toutes les notes de l’auteur, et seulement les siennes', () => {
    const s = r([add(note('k1', 'alice')), add(note('k2', 'bruno')), { t: 'color', authorId: 'alice', color: '#16a34a' }]);
    expect(s.notes.map((n) => n.authorColor)).toEqual(['#16a34a', '#000']);
    expect(r([{ t: 'color', authorId: 'alice', color: 'javascript:' }], s)).toEqual(s);
  });
});
