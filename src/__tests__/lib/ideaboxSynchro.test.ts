import type { BoardNote } from '@/components/toolbox/shared/boardNotes';
import {
  INITIAL_IDEABOX_STATE,
  IDEA_MAX,
  buildIdeaboxSummary,
  ideaboxReducer,
  normalizeIdeaboxState,
  votesUsedBy,
  type IdeaboxOp,
  type IdeaboxState,
} from '@/components/toolbox/ideabox/ideaboxLogic';

/*
 * Synchronisation de la Boîte à idées : chaque écran applique les opérations
 * qu'il reçoit, dans l'ordre où elles lui arrivent. Ces tests jouent le même
 * lot d'opérations dans des ordres différents et vérifient que tous les
 * écrans aboutissent au même état.
 */

const appliquer = (ops: IdeaboxOp[], depart: IdeaboxState = INITIAL_IDEABOX_STATE) => ops.reduce(ideaboxReducer, depart);

const idee = (id: string, authorId: string, text = `Idée ${id}`, category = 'process'): BoardNote => ({
  id, authorId, authorName: authorId, authorColor: '#000', category, text, revealed: false, likedBy: [], retained: false,
});
const ajout = (n: BoardNote, round = 0): IdeaboxOp => ({ t: 'add', round, note: n });
const publie = (n: BoardNote): IdeaboxOp => ({ t: 'publish', authorId: n.authorId, ids: [n.id] });

describe('Boîte à idées — idées simultanées', () => {
  const idees = ['alice', 'bruno', 'chloe', 'david', 'emma', 'farid', 'gael', 'hugo']
    .map((a, i) => idee(`m1a${i}-x`, a));
  const ops = idees.flatMap((n) => [ajout(n), publie(n)]);

  it('garde toutes les idées, dans le même ordre, quel que soit l’ordre d’arrivée', () => {
    const x = appliquer(ops);
    const y = appliquer([...ops].reverse().sort((a, b) => (a.t === 'add' ? -1 : 1) - (b.t === 'add' ? -1 : 1)));
    expect(x.notes).toHaveLength(8);
    expect(x.notes.every((n) => n.revealed)).toBe(true);
    expect(y.notes.map((n) => n.id)).toEqual(x.notes.map((n) => n.id));
  });

  it('ne change rien quand une opération est reçue deux fois', () => {
    expect(appliquer([...ops, ...ops])).toEqual(appliquer(ops));
  });

  it('publie une idée même si sa publication arrive avant son ajout', () => {
    const n = idee('m1z-x', 'farid');
    const pub: IdeaboxOp = { t: 'publish', authorId: 'farid', ids: [n.id], notes: [n] };
    const desordre = appliquer([pub, ajout(n)]);
    expect(desordre.notes).toHaveLength(1);
    expect(desordre.notes[0].revealed).toBe(true);
    expect(desordre).toEqual(appliquer([ajout(n), pub]));
    // Une idée d'un autre auteur glissée dans la publication est ignorée.
    const usurpe: IdeaboxOp = { t: 'publish', authorId: 'hugo', ids: ['m1y'], notes: [idee('m1y', 'farid')] };
    expect(appliquer([usurpe]).notes).toHaveLength(0);
  });

  it('cumule les votes de toute l’équipe envoyés au même moment', () => {
    const cible = idees[0];
    const votes: IdeaboxOp[] = idees.slice(1).map((n) => ({ t: 'like', id: cible.id, voterId: n.authorId, liked: true }));
    const x = appliquer([...ops, ...votes]);
    const y = appliquer([...ops, ...[...votes].reverse(), ...votes]);
    expect(x.notes[0].likedBy).toHaveLength(7);
    expect(new Set(y.notes[0].likedBy)).toEqual(new Set(x.notes[0].likedBy));
  });
});

describe('Boîte à idées — règles', () => {
  const a = idee('m1-a', 'alice');
  const b = idee('m1-b', 'bruno');
  const base = appliquer([ajout(a), ajout(b), publie(a)]);

  it('interdit de voter pour sa propre idée ou pour un brouillon', () => {
    const s = appliquer([
      { t: 'like', id: a.id, voterId: 'alice', liked: true },
      { t: 'like', id: b.id, voterId: 'alice', liked: true },
    ], base);
    expect(s.notes.find((n) => n.id === a.id)?.likedBy).toEqual([]);
    expect(s.notes.find((n) => n.id === b.id)?.likedBy).toEqual([]);
  });

  it('ne publie que ses propres brouillons', () => {
    const s = appliquer([{ t: 'publish', authorId: 'alice', ids: [b.id] }], base);
    expect(s.notes.find((n) => n.id === b.id)?.revealed).toBe(false);
  });

  it('laisse l’auteur supprimer son brouillon, et l’animateur n’importe quelle idée', () => {
    expect(appliquer([{ t: 'delete', id: b.id, by: 'alice' }], base).notes).toHaveLength(2);
    expect(appliquer([{ t: 'delete', id: b.id, by: 'bruno' }], base).notes).toHaveLength(1);
    expect(appliquer([{ t: 'delete', id: a.id, by: 'alice' }], base).notes).toHaveLength(2);
    expect(appliquer([{ t: 'delete', id: a.id, by: 'chloe', moderator: true }], base).notes).toHaveLength(1);
  });

  it('respecte le nombre de cœurs par personne', () => {
    const idees = ['m2-a', 'm2-b', 'm2-c'].map((id) => idee(id, 'bruno'));
    const s = appliquer([
      { t: 'voteLimit', value: 2 },
      ...idees.flatMap((n) => [ajout(n), publie(n)]),
      ...idees.map((n): IdeaboxOp => ({ t: 'like', id: n.id, voterId: 'alice', liked: true })),
    ]);
    expect(votesUsedBy(s.notes, 'alice')).toBe(2);
    // En retirant un cœur, on peut le redonner ailleurs.
    const s2 = appliquer([
      { t: 'like', id: 'm2-a', voterId: 'alice', liked: false },
      { t: 'like', id: 'm2-c', voterId: 'alice', liked: true },
    ], s);
    expect(s2.notes.find((n) => n.id === 'm2-c')?.likedBy).toEqual(['alice']);
  });

  it('« Retenir » envoyé deux fois ne s’annule pas', () => {
    const r: IdeaboxOp = { t: 'retain', id: a.id, retained: true };
    expect(appliquer([r, r], base).notes.find((n) => n.id === a.id)?.retained).toBe(true);
  });

  it('borne le texte et range une catégorie inconnue dans « Autre »', () => {
    const s = appliquer([ajout(idee('m3', 'alice', 'x'.repeat(500), 'nimportequoi'))]);
    expect(s.notes[0].text).toHaveLength(IDEA_MAX);
    expect(s.notes[0].category).toBe('other');
  });
});

describe('Boîte à idées — réinitialisation et export', () => {
  it('efface les idées, garde les réglages et ignore une idée envoyée avant la remise à zéro', () => {
    const n = idee('m4', 'alice');
    const s = appliquer([
      { t: 'anonymous', value: true },
      { t: 'voteLimit', value: 3 },
      ajout(n), publie(n),
      { t: 'reset', round: 1 },
      ajout(idee('m5', 'bruno'), 0),
      { t: 'reset', round: 1 },
    ]);
    expect(s).toMatchObject({ round: 1, notes: [], anonymous: true, voteLimit: 3 });
  });

  it('exporte les idées sans les noms quand la séance est anonyme', () => {
    const n = { ...idee('m6', 'alice', 'Un café le lundi', 'team'), authorName: 'Alice' };
    const s = appliquer([ajout(n), publie(n), { t: 'like', id: 'm6', voterId: 'bruno', liked: true }, { t: 'retain', id: 'm6', retained: true }]);
    const nominatif = buildIdeaboxSummary(s, new Date(2026, 8, 14));
    expect(nominatif).toContain('- [Équipe] Un café le lundi  (1 vote — Alice)');
    const anonyme = buildIdeaboxSummary({ ...s, anonymous: true }, new Date(2026, 8, 14));
    expect(anonyme).toContain('- [Équipe] Un café le lundi  (1 vote)');
    expect(anonyme).not.toContain('Alice');
    expect(anonyme).toContain('BOÎTE À IDÉES OSKAR — 14/09/2026');
  });

  it('reprend un état enregistré par l’ancienne version', () => {
    const ancien = { notes: [{ ...idee('m7', 'alice'), revealed: true, likedBy: ['bruno', 'alice'] }] } as Partial<IdeaboxState>;
    const s = normalizeIdeaboxState(ancien);
    expect(s).toMatchObject({ round: 0, anonymous: false, voteLimit: 0 });
    expect(s.notes[0].likedBy).toEqual(['bruno']);
  });
});
