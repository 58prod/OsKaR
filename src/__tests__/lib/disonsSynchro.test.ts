import type { BoardNote } from '@/components/toolbox/shared/boardNotes';
import {
  DISONS_TEXT_MAX,
  INITIAL_DISONS_STATE,
  buildDisonsSummary,
  columnCards,
  disonsReducer,
  normalizeDisonsState,
  votesUsedBy,
  type DisonsOp,
  type DisonsState,
} from '@/components/toolbox/disons/disonsLogic';

/*
 * Synchronisation de « Disons-nous les choses » : chaque écran applique les
 * opérations qu'il reçoit, dans l'ordre où elles lui arrivent. Ces tests
 * jouent les mêmes opérations dans des ordres différents et vérifient que
 * tous les écrans aboutissent au même état.
 */

const appliquer = (ops: DisonsOp[], depart: DisonsState = INITIAL_DISONS_STATE) => ops.reduce(disonsReducer, depart);

const carte = (id: string, authorId: string, category = 'frein', text = `Carte ${id}`): BoardNote => ({
  id, authorId, authorName: authorId, authorColor: '#000', category, text, revealed: false, likedBy: [], retained: false,
});
const ajout = (n: BoardNote, round = 0): DisonsOp => ({ t: 'add', round, note: n });
const publie = (n: BoardNote, round = 0): DisonsOp => ({ t: 'publish', authorId: n.authorId, ids: [n.id], round, notes: [n] });

function permutations<T>(list: T[]): T[][] {
  if (list.length <= 1) return [list];
  return list.flatMap((x, i) => permutations([...list.slice(0, i), ...list.slice(i + 1)]).map((p) => [x, ...p]));
}

describe('Disons-nous les choses — cartes simultanées', () => {
  const cartes = ['alice', 'bruno', 'chloe', 'david', 'emma', 'farid', 'gael', 'hugo']
    .flatMap((a, i) => [carte(`m1d${i}a`, a, 'frein'), carte(`m1d${i}b`, a, 'moteur')]);
  const ops = cartes.flatMap((n) => [ajout(n), publie(n)]);

  it('garde toutes les cartes, dans la bonne colonne, quel que soit l’ordre d’arrivée', () => {
    const x = appliquer(ops);
    const y = appliquer([...ops].reverse());
    expect(x.notes).toHaveLength(16);
    expect(x.notes.every((n) => n.revealed)).toBe(true);
    expect(y.notes).toEqual(x.notes);
    expect(columnCards(x.notes, 'frein')).toHaveLength(8);
    expect(columnCards(x.notes, 'moteur')).toHaveLength(8);
  });

  it('ne change rien quand une opération est reçue deux fois', () => {
    expect(appliquer([...ops, ...ops])).toEqual(appliquer(ops));
  });

  it('cumule les cœurs envoyés au même moment, sans bascule', () => {
    const votes: DisonsOp[] = ['bruno', 'chloe', 'david'].map((v) => ({ t: 'like', id: 'm1d0a', voterId: v, liked: true }));
    const s = appliquer([...ops, ...votes, ...[...votes].reverse()]);
    expect(s.notes.find((n) => n.id === 'm1d0a')?.likedBy).toHaveLength(3);
  });
});

describe('Disons-nous les choses — règles', () => {
  const a = carte('m2-a', 'alice');
  const b = carte('m2-b', 'bruno', 'moteur');
  const base = appliquer([ajout(a), publie(a), ajout(b)]);

  it('interdit de voter pour sa propre carte ou pour un brouillon', () => {
    const s = appliquer([
      { t: 'like', id: a.id, voterId: 'alice', liked: true },
      { t: 'like', id: b.id, voterId: 'alice', liked: true },
    ], base);
    expect(s.notes.every((n) => n.likedBy.length === 0)).toBe(true);
  });

  it('ne publie que ses propres brouillons', () => {
    expect(appliquer([{ t: 'publish', authorId: 'alice', ids: [b.id] }], base).notes.find((n) => n.id === b.id)?.revealed).toBe(false);
  });

  it('respecte le nombre de cœurs par personne', () => {
    const cartes = ['m3-a', 'm3-b', 'm3-c'].map((id) => carte(id, 'bruno'));
    const s = appliquer([
      { t: 'voteLimit', value: 2 },
      ...cartes.flatMap((n) => [ajout(n), publie(n)]),
      ...cartes.map((n): DisonsOp => ({ t: 'like', id: n.id, voterId: 'alice', liked: true })),
    ]);
    expect(votesUsedBy(s.notes, 'alice')).toBe(2);
  });

  it('« Retenir » reçu deux fois ne s’annule pas, et la carte retenue passe en tête', () => {
    const c = carte('m2-c', 'chloe');
    const s = appliquer([
      ajout(c), publie(c),
      { t: 'like', id: a.id, voterId: 'david', liked: true },
      { t: 'retain', id: c.id, retained: true },
      { t: 'retain', id: c.id, retained: true },
    ], base);
    expect(columnCards(s.notes, 'frein').map((n) => n.id)).toEqual([c.id, a.id]);
  });

  it('borne le texte et range un type inconnu dans « Frein »', () => {
    const s = appliquer([ajout(carte('m2-d', 'emma', 'nimportequoi', 'x'.repeat(500)))]);
    expect(s.notes[0].text).toHaveLength(DISONS_TEXT_MAX);
    expect(s.notes[0].category).toBe('frein');
  });
});

describe('Disons-nous les choses — messages dans le désordre et réinitialisation', () => {
  const n = carte('m4-a', 'farid', 'moteur');

  it('publie une carte même si sa publication arrive avant son ajout', () => {
    const s = appliquer([publie(n), ajout(n)]);
    expect(s.notes).toHaveLength(1);
    expect(s.notes[0].revealed).toBe(true);
    expect(s).toEqual(appliquer([ajout(n), publie(n)]));
  });

  it('une carte supprimée par l’animateur ne revient jamais, quel que soit l’ordre', () => {
    const suppr: DisonsOp = { t: 'delete', id: n.id, by: 'chloe', moderator: true };
    permutations([ajout(n), publie(n), suppr]).forEach((ordre) => {
      expect(appliquer(ordre).notes).toEqual([]);
    });
  });

  it('efface les cartes, garde les réglages et ignore ce qui a été envoyé avant la remise à zéro', () => {
    const s = appliquer([
      { t: 'anonymous', value: false },
      { t: 'voteLimit', value: 3 },
      ajout(n), publie(n),
      { t: 'reset', round: 1 },
      publie(carte('m4-b', 'gael')),
      ajout(carte('m4-c', 'hugo')),
      { t: 'reset', round: 1 },
    ]);
    expect(s).toMatchObject({ round: 1, notes: [], anonymous: false, voteLimit: 3, deleted: [] });
  });
});

describe('Disons-nous les choses — export et anciennes sessions', () => {
  it('liste les colonnes, retenues d’abord, sans les noms si la séance est anonyme', () => {
    const f = { ...carte('m5-a', 'alice', 'frein', 'Trop de réunions'), authorName: 'Alice' };
    const m = { ...carte('m5-b', 'bruno', 'moteur', 'Entraide spontanée'), authorName: 'Bruno' };
    const s = appliquer([ajout(f), publie(f), ajout(m), publie(m), { t: 'retain', id: f.id, retained: true }]);
    const anonyme = buildDisonsSummary(s, new Date(2026, 8, 14));
    expect(anonyme).toContain('CE QUI NOUS FREINE');
    expect(anonyme).toContain('[✓] Trop de réunions  (0 vote)');
    expect(anonyme).not.toContain('Alice');
    expect(buildDisonsSummary({ ...s, anonymous: false })).toContain('Entraide spontanée  (0 vote — Bruno)');
  });

  it('une nouvelle séance est anonyme ; une ancienne séance garde les noms', () => {
    expect(INITIAL_DISONS_STATE.anonymous).toBe(true);
    const ancienne = normalizeDisonsState({ notes: [{ ...carte('m6', 'alice'), revealed: true, likedBy: ['alice', 'bruno'] }] } as Partial<DisonsState>);
    expect(ancienne).toMatchObject({ anonymous: false, round: 0, voteLimit: 0 });
    expect(ancienne.notes[0].likedBy).toEqual(['bruno']);
  });
});
