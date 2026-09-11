import { INITIAL_RETRO_STATE, retroReducer, type RetroNote } from '@/components/toolbox/retro/retroLogic';
import {
  INITIAL_RECRE_STATE, currentRevealPhoto, recreReducer, shuffle, type RecrePhoto,
} from '@/components/toolbox/recre/recreLogic';

function note(id: string, authorId: string): RetroNote {
  return {
    id, authorId, authorName: authorId, authorColor: '#000', category: 'plus', text: id,
    revealed: false, likedBy: [], retained: false,
  };
}

function photo(id: string, authorId = 'a'): RecrePhoto {
  return { id, authorId, authorName: authorId, authorColor: '#000', url: `u/${id}`, likedBy: [] };
}

describe('Synchronisation par opérations — rétro', () => {
  it('deux notes ajoutées en même temps arrivent chez tout le monde, dans le même ordre', () => {
    const a = { t: 'addNote' as const, note: note('m1abc-aaaa', 'alice'), today: '2026-09-11' };
    const b = { t: 'addNote' as const, note: note('m1abd-bbbb', 'bruno'), today: '2026-09-11' };
    const chezAlice = retroReducer(retroReducer(INITIAL_RETRO_STATE, a), b);
    const chezBruno = retroReducer(retroReducer(INITIAL_RETRO_STATE, b), a);
    expect(chezAlice.notes.map((n) => n.id)).toEqual(['m1abc-aaaa', 'm1abd-bbbb']);
    expect(chezBruno).toEqual(chezAlice);
  });

  it('les votes simultanés de deux personnes se cumulent', () => {
    let s = retroReducer(INITIAL_RETRO_STATE, { t: 'addNote', note: note('n1', 'alice'), today: '2026-09-11' });
    s = retroReducer(s, { t: 'reveal', ids: ['n1'] });
    s = retroReducer(s, { t: 'like', id: 'n1', voterId: 'bruno', liked: true });
    s = retroReducer(s, { t: 'like', id: 'n1', voterId: 'chloe', liked: true });
    s = retroReducer(s, { t: 'like', id: 'n1', voterId: 'bruno', liked: true });
    expect(s.notes[0].likedBy).toEqual(['bruno', 'chloe']);
  });
});

describe('Synchronisation par opérations — récré', () => {
  it('deux photos envoyées en même temps arrivent toutes les deux', () => {
    const a = { t: 'addPhoto' as const, photo: photo('1757590000000-aaaa') };
    const b = { t: 'addPhoto' as const, photo: photo('1757590000001-bbbb') };
    const x = recreReducer(recreReducer(INITIAL_RECRE_STATE, a), b);
    const y = recreReducer(recreReducer(INITIAL_RECRE_STATE, b), a);
    expect(x.photos).toHaveLength(2);
    expect(y).toEqual(x);
  });

  it('mode révélation : auteur dévoilé, photo suivante, photo supprimée sautée, fin', () => {
    let s = INITIAL_RECRE_STATE;
    ['p1', 'p2', 'p3'].forEach((id) => { s = recreReducer(s, { t: 'addPhoto', photo: photo(id, `auteur-${id}`) }); });
    s = recreReducer(s, { t: 'startReveal', queue: ['p2', 'p1', 'p3'] });
    expect(currentRevealPhoto(s)).toMatchObject({ photo: { id: 'p2' }, position: 1, total: 3 });

    s = recreReducer(s, { t: 'showAuthor' });
    expect(s.reveal?.authorShown).toBe(true);
    expect(s.authorsShown).toEqual(['p2']);

    s = recreReducer(s, { t: 'removePhoto', id: 'p1' });
    s = recreReducer(s, { t: 'nextPhoto', from: 0 });
    expect(currentRevealPhoto(s)).toMatchObject({ photo: { id: 'p3' }, position: 2, total: 2 });
    // Le même clic reçu une seconde fois ne fait pas sauter de photo.
    expect(recreReducer(s, { t: 'nextPhoto', from: 0 })).toEqual(s);
    expect(s.reveal?.authorShown).toBe(false);

    s = recreReducer(s, { t: 'nextPhoto', from: 2 });
    expect(s.reveal).toBeNull();
  });

  it('mélange sans perdre de photo', () => {
    expect(shuffle(['a', 'b', 'c', 'd']).sort()).toEqual(['a', 'b', 'c', 'd']);
  });
});
