import {
  INITIAL_RECRE_STATE, placerEnColonnes, previousRevealId, recreReducer, revealOrder, type RecrePhoto,
  type RecreState,
} from '@/components/toolbox/recre/recreLogic';
import { RECRE_SUJETS, sujetAuHasard, sujetVoisin } from '@/components/toolbox/recre/recreSujets';

function photo(id: string, ratio?: number): RecrePhoto {
  return { id, authorId: `a-${id}`, authorName: id, authorColor: '#000', url: `u/${id}`, likedBy: [], ratio };
}

function avecPhotos(ids: string[]): RecreState {
  return ids.reduce<RecreState>((s, id) => recreReducer(s, { t: 'addPhoto', photo: photo(id) }), INITIAL_RECRE_STATE);
}

describe('Récré — sujets proposés', () => {
  it('une centaine de sujets, sans doublon', () => {
    expect(RECRE_SUJETS.length).toBeGreaterThanOrEqual(100);
    expect(new Set(RECRE_SUJETS).size).toBe(RECRE_SUJETS.length);
  });

  it('suivant / précédent tournent en boucle', () => {
    const dernier = RECRE_SUJETS[RECRE_SUJETS.length - 1];
    expect(sujetVoisin(dernier, 1)).toBe(RECRE_SUJETS[0]);
    expect(sujetVoisin(RECRE_SUJETS[0], -1)).toBe(dernier);
    expect(sujetVoisin(RECRE_SUJETS[3], 1)).toBe(RECRE_SUJETS[4]);
  });

  it('un thème saisi à la main repart du début (suivant) ou de la fin (précédent)', () => {
    expect(sujetVoisin('Ma semaine', 1)).toBe(RECRE_SUJETS[0]);
    expect(sujetVoisin('Ma semaine', -1)).toBe(RECRE_SUJETS[RECRE_SUJETS.length - 1]);
  });

  it('le hasard ne retombe jamais sur le sujet en cours', () => {
    expect(sujetAuHasard(RECRE_SUJETS[0], () => 0)).not.toBe(RECRE_SUJETS[0]);
    expect(RECRE_SUJETS).toContain(sujetAuHasard('', () => 0.999));
  });
});

describe('Récré — l’animateur choisit la photo du diaporama', () => {
  it('va sur une photo de la file, et y revient sans effet si le clic arrive deux fois', () => {
    let s = avecPhotos(['p1', 'p2', 'p3']);
    s = recreReducer(s, { t: 'startReveal', queue: ['p2', 'p1', 'p3'] });
    s = recreReducer(s, { t: 'goToPhoto', id: 'p3' });
    expect(s.reveal).toEqual({ queue: ['p2', 'p1', 'p3'], index: 2, authorShown: false });
    expect(recreReducer(s, { t: 'goToPhoto', id: 'p3' })).toEqual(s);
  });

  it('une photo déjà dévoilée garde son auteur affiché', () => {
    let s = avecPhotos(['p1', 'p2']);
    s = recreReducer(s, { t: 'startReveal', queue: ['p1', 'p2'] });
    s = recreReducer(s, { t: 'showAuthor' });
    s = recreReducer(s, { t: 'nextPhoto', from: 0 });
    expect(s.reveal?.authorShown).toBe(false);
    s = recreReducer(s, { t: 'goToPhoto', id: 'p1' });
    expect(s.reveal).toMatchObject({ index: 0, authorShown: true });
  });

  it('une photo arrivée après le lancement rejoint la fin de la file', () => {
    let s = avecPhotos(['p1', 'p2']);
    s = recreReducer(s, { t: 'startReveal', queue: ['p2', 'p1'] });
    s = recreReducer(s, { t: 'addPhoto', photo: photo('p3') });
    expect(revealOrder(s).map((p) => p.id)).toEqual(['p2', 'p1', 'p3']);
    s = recreReducer(s, { t: 'goToPhoto', id: 'p3' });
    expect(s.reveal).toMatchObject({ queue: ['p2', 'p1', 'p3'], index: 2 });
  });

  it('ignore une photo supprimée ou un diaporama fermé', () => {
    let s = avecPhotos(['p1']);
    expect(recreReducer(s, { t: 'goToPhoto', id: 'p1' })).toEqual(s);
    s = recreReducer(s, { t: 'startReveal', queue: ['p1'] });
    expect(recreReducer(s, { t: 'goToPhoto', id: 'absente' })).toEqual(s);
  });

  it('« précédente » saute les photos supprimées', () => {
    let s = avecPhotos(['p1', 'p2', 'p3']);
    s = recreReducer(s, { t: 'startReveal', queue: ['p1', 'p2', 'p3'] });
    expect(previousRevealId(s)).toBeNull();
    s = recreReducer(s, { t: 'goToPhoto', id: 'p3' });
    s = recreReducer(s, { t: 'removePhoto', id: 'p2' });
    expect(previousRevealId(s)).toBe('p1');
  });
});

describe('Récré — même mur de photos sur tous les écrans', () => {
  it('ne dépend que des photos : même résultat à chaque calcul', () => {
    const photos = [photo('a', 0.75), photo('b', 1.5), photo('c', 1), photo('d', 0.6), photo('e', 1.33), photo('f')];
    expect(placerEnColonnes(photos, 4)).toEqual(placerEnColonnes([...photos], 4));
  });

  it('chaque photo va dans la colonne la moins haute, la plus à gauche en cas d’égalité', () => {
    // a, b, c, d remplissent les 4 colonnes ; d (paysage) laisse la 4ᵉ la plus courte.
    const photos = [photo('a', 0.75), photo('b', 0.75), photo('c', 1), photo('d', 2), photo('e', 1), photo('f', 1)];
    expect(placerEnColonnes(photos, 4)).toEqual([[0], [1], [2, 5], [3, 4]]);
  });

  it('chaque photo est placée une fois et une seule', () => {
    const photos = Array.from({ length: 23 }, (_, i) => photo(`p${i}`, 0.5 + (i % 5) * 0.4));
    const places = placerEnColonnes(photos, 4).flat().sort((x, y) => x - y);
    expect(places).toEqual(photos.map((_, i) => i));
  });

  it('utilise les proportions mesurées pour les anciennes photos', () => {
    const photos = [photo('a', 1), photo('b'), photo('c', 1)];
    // b mesurée très haute : c passe à côté.
    expect(placerEnColonnes(photos, 2, (i) => (i === 1 ? 0.6 : undefined))).toEqual([[0, 2], [1]]);
  });
});

describe('Récré — photo mise en avant sur le board', () => {
  it('l’animateur met une photo en avant, puis la retire', () => {
    let s = avecPhotos(['p1', 'p2']);
    s = recreReducer(s, { t: 'highlight', id: 'p2' });
    expect(s.highlightedId).toBe('p2');
    expect(recreReducer(s, { t: 'highlight', id: 'p2' })).toEqual(s);
    expect(recreReducer(s, { t: 'highlight', id: null }).highlightedId).toBeNull();
  });

  it('ignore une photo inconnue, et oublie la mise en avant d’une photo supprimée', () => {
    let s = avecPhotos(['p1']);
    expect(recreReducer(s, { t: 'highlight', id: 'absente' }).highlightedId).toBeNull();
    s = recreReducer(s, { t: 'highlight', id: 'p1' });
    expect(recreReducer(s, { t: 'removePhoto', id: 'p1' }).highlightedId).toBeNull();
    expect(recreReducer(s, { t: 'reset' }).highlightedId).toBeNull();
  });

  it('une séance d’avant la mise en avant se lit sans erreur', () => {
    const ancienne = { ...INITIAL_RECRE_STATE } as Partial<RecreState>;
    delete ancienne.highlightedId;
    expect(recreReducer(ancienne as RecreState, { t: 'theme', theme: 'x' }).highlightedId).toBeNull();
  });
});
