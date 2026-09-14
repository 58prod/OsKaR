import type { BoardNote } from '@/components/toolbox/shared/boardNotes';
import {
  INITIAL_RETRO_STATE, normalizeRetroState, retroReducer, type RetroNote, type RetroOp, type RetroState,
} from '@/components/toolbox/retro/retroLogic';
import {
  INITIAL_BRAINSTORM_STATE, brainstormReducer, type BrainstormOp, type BrainstormState,
} from '@/components/toolbox/brainstorm/brainstormLogic';
import {
  INITIAL_IDEABOX_STATE, ideaboxReducer, type IdeaboxOp, type IdeaboxState,
} from '@/components/toolbox/ideabox/ideaboxLogic';

/*
 * Messages dans le désordre : deux messages d'une même personne peuvent
 * arriver dans l'ordre inverse (vécu à 8 personnes dans la même
 * milliseconde). Aucune note ne doit rester bloquée, aucune note supprimée
 * ou effacée ne doit revenir, et tous les écrans doivent finir identiques.
 */

const note = (id: string, authorId: string, category = 'plus'): RetroNote => ({
  id, authorId, authorName: authorId, authorColor: '#000', category, text: `Note ${id}`,
  revealed: false, likedBy: [], retained: false,
});

/** Tous les ordres possibles d'une petite liste de messages. */
function permutations<T>(list: T[]): T[][] {
  if (list.length <= 1) return [list];
  return list.flatMap((x, i) => permutations([...list.slice(0, i), ...list.slice(i + 1)]).map((p) => [x, ...p]));
}

describe('Rétrospective — messages dans le désordre', () => {
  const r = (ops: RetroOp[], s: RetroState = INITIAL_RETRO_STATE) => ops.reduce(retroReducer, s);
  const n = note('m1-a', 'alice');
  const ajout: RetroOp = { t: 'addNote', note: n, today: '2026-09-14', session: 0 };
  const revele: RetroOp = { t: 'reveal', ids: [n.id], authorId: 'alice', session: 0, notes: [n] };

  it('révèle une note même si sa révélation arrive avant son ajout', () => {
    const s = r([revele, ajout]);
    expect(s.notes).toHaveLength(1);
    expect(s.notes[0].revealed).toBe(true);
    expect(s.notes).toEqual(r([ajout, revele]).notes);
  });

  it('ne fait jamais revenir une note supprimée, quel que soit l’ordre', () => {
    const suppr: RetroOp = { t: 'deleteNote', id: n.id };
    permutations([ajout, revele, suppr]).forEach((ordre) => {
      const s = r(ordre);
      expect(s.notes).toHaveLength(0);
    });
  });

  it('n’accepte pas une note d’un autre auteur glissée dans une révélation', () => {
    const usurpe: RetroOp = { t: 'reveal', ids: ['m1-b'], authorId: 'hugo', session: 0, notes: [note('m1-b', 'alice')] };
    expect(r([usurpe]).notes).toHaveLength(0);
    // Ni révéler la note existante d'un autre.
    const s = r([{ t: 'addNote', note: note('m1-c', 'alice'), today: 'x', session: 0 }, { t: 'reveal', ids: ['m1-c'], authorId: 'hugo', session: 0 }]);
    expect(s.notes[0].revealed).toBe(false);
  });

  it('une note envoyée avant « Nouvelle rétro » ne réapparaît pas après, quel que soit l’ordre', () => {
    const avant = r([{ t: 'addNote', note: note('m2-a', 'alice', 'start'), today: '2026-09-14', session: 0 },
      { t: 'reveal', ids: ['m2-a'], authorId: 'alice', session: 0 }]);
    const nouvelle: RetroOp = { t: 'newRetro', today: '2026-09-14', session: 1 };
    const tardive: RetroOp = { t: 'addNote', note: note('m2-b', 'bruno'), today: '2026-09-14', session: 0 };
    const x = r([nouvelle, tardive], avant);
    const y = r([tardive, nouvelle], avant);
    expect(x.notes).toEqual([]);
    expect(y.notes).toEqual([]);
    expect(x.pastActions).toHaveLength(1);
    expect(y.pastActions).toEqual(x.pastActions);
  });

  it('« Nouvelle rétro » reçue deux fois n’archive qu’une fois', () => {
    const avant = r([{ t: 'addNote', note: note('m3-a', 'alice', 'start'), today: '2026-09-14', session: 0 },
      { t: 'reveal', ids: ['m3-a'], authorId: 'alice', session: 0 }]);
    const nouvelle: RetroOp = { t: 'newRetro', today: '2026-09-14', session: 1 };
    const s = r([nouvelle, { t: 'addNote', note: note('m3-b', 'bruno'), today: 'x', session: 1 }, nouvelle], avant);
    expect(s.pastActions).toHaveLength(1);
    expect(s.notes.map((x) => x.id)).toEqual(['m3-b']);
  });

  it('reste compatible avec les messages et les séances d’avant', () => {
    const ancien = normalizeRetroState({ notes: [note('m4', 'alice')] } as Partial<RetroState>);
    expect(ancien).toMatchObject({ session: 0, deletedIds: [] });
    // Un message sans numéro de séance s'applique comme avant.
    expect(r([{ t: 'reveal', ids: ['m4'] }], ancien).notes[0].revealed).toBe(true);
  });
});

describe('Brainstorming et Boîte à idées — effacement et suppression', () => {
  const b = (ops: BrainstormOp[], s: BrainstormState = INITIAL_BRAINSTORM_STATE) => ops.reduce(brainstormReducer, s);
  const i = (ops: IdeaboxOp[], s: IdeaboxState = INITIAL_IDEABOX_STATE) => ops.reduce(ideaboxReducer, s);
  const postit = { ...note('m5-a', 'alice', 'cy') } as BoardNote;

  it('brainstorming : une révélation d’avant la réinitialisation ne fait pas revenir le post-it', () => {
    const rev: BrainstormOp = { t: 'reveal', authorId: 'alice', round: 0, items: [{ id: postit.id, pos: { x: 0.2, y: 0.2, rot: 0 }, note: postit }] };
    const reset: BrainstormOp = { t: 'reset', round: 1 };
    expect(b([reset, rev]).notes).toEqual([]);
    expect(b([rev, reset]).notes).toEqual([]);
  });

  it('brainstorming : un post-it supprimé ne revient jamais, quel que soit l’ordre', () => {
    const ajout: BrainstormOp = { t: 'add', round: 0, note: postit };
    const rev: BrainstormOp = { t: 'reveal', authorId: 'alice', round: 0, items: [{ id: postit.id, pos: { x: 0.2, y: 0.2, rot: 0 }, note: postit }] };
    const suppr: BrainstormOp = { t: 'delete', id: postit.id, by: 'alice' };
    permutations([ajout, rev, suppr]).forEach((ordre) => {
      const s = b(ordre);
      expect(s.notes).toEqual([]);
      expect(s.positions).toEqual({});
    });
  });

  it('boîte à idées : ni une publication d’avant la réinitialisation, ni une idée supprimée ne reviennent', () => {
    const idee = { ...postit, category: 'team' };
    const pub: IdeaboxOp = { t: 'publish', authorId: 'alice', ids: [idee.id], round: 0, notes: [idee] };
    expect(i([{ t: 'reset', round: 1 }, pub]).notes).toEqual([]);
    const ajout: IdeaboxOp = { t: 'add', round: 0, note: idee };
    const suppr: IdeaboxOp = { t: 'delete', id: idee.id, by: 'chloe', moderator: true };
    permutations([ajout, pub, suppr]).forEach((ordre) => {
      expect(i(ordre).notes).toEqual([]);
    });
  });
});
