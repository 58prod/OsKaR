import {
  INITIAL_RETRO_STATE, boardItems, buildActionsCsv, mergeImportedActions, normalizeRetroState,
  parseActionsCsv, pileNotes, mergePile, unpileNote, startNewRetro,
  type RetroNote, type RetroState,
} from '@/components/toolbox/retro/retroLogic';

function note(id: string, category: string, extra: Partial<RetroNote> = {}): RetroNote {
  return {
    id, category, text: `note ${id}`, authorId: 'a', authorName: 'Alice', authorColor: '#f59e0b',
    revealed: true, likedBy: [], retained: false, ...extra,
  };
}

describe('Rétrospective — suivi des actions', () => {
  it('complète un état ancien sans suivi', () => {
    const s = normalizeRetroState({ notes: [], actionMeta: {}, chrono: INITIAL_RETRO_STATE.chrono } as Partial<RetroState>);
    expect(s.pastActions).toEqual([]);
    expect(s.retroDate).toBe('');
  });

  it('nouvelle rétro : vide les cases et garde les actions avec responsable et échéance', () => {
    const state: RetroState = {
      ...INITIAL_RETRO_STATE,
      retroDate: '2026-09-01',
      notes: [note('1', 'plus'), note('2', 'start'), note('3', 'start', { revealed: false })],
      actionMeta: { 2: { resp: 'Bruno', deadline: '2026-09-20', done: false } },
      pastActions: [{
        id: 'old', text: 'ancienne', authorName: 'Eve', authorColor: '#000', resp: '', deadline: '',
        done: true, retroDate: '2026-08-15',
      }],
    };
    const next = startNewRetro(state, '2026-09-11');
    expect(next.notes).toEqual([]);
    expect(next.actionMeta).toEqual({});
    expect(next.retroDate).toBe('2026-09-11');
    expect(next.pastActions.map((a) => a.id)).toEqual(['2', 'old']);
    expect(next.pastActions[0]).toMatchObject({ resp: 'Bruno', deadline: '2026-09-20', retroDate: '2026-09-01' });
  });

  it('export puis import CSV, sans doublon', () => {
    const actions = [{
      id: 'x', text: 'Revoir; la "revue" de code', authorName: 'Alice', authorColor: '#f59e0b',
      resp: 'Bruno', deadline: '2026-10-01', done: true, retroDate: '2026-09-11',
    }];
    const parsed = parseActionsCsv(buildActionsCsv(actions));
    expect(parsed).toHaveLength(1);
    expect(parsed[0]).toMatchObject({
      text: 'Revoir; la "revue" de code', authorName: 'Alice', resp: 'Bruno',
      deadline: '2026-10-01', done: true, retroDate: '2026-09-11',
    });
    const merged = mergeImportedActions(actions, parsed);
    expect(merged.added).toBe(0);
    expect(merged.actions).toHaveLength(1);
  });
});

describe('Rétrospective — tas de notes', () => {
  it('empile deux notes, puis un tas sur une autre note, puis sort une note', () => {
    let notes = [note('1', 'plus'), note('2', 'plus'), note('3', 'minus'), note('4', 'plus', { revealed: false })];
    notes = pileNotes(notes, '2', '1');
    expect(boardItems(notes.filter((n) => n.category === 'plus')).map((i) => i.kind)).toEqual(['pile', 'note']);

    notes = mergePile(notes, '1', '3');
    const minus = boardItems(notes.filter((n) => n.category === 'minus'));
    expect(minus).toHaveLength(1);
    expect(minus[0].kind === 'pile' && minus[0].notes.map((n) => n.id)).toEqual(['1', '2', '3']);

    notes = unpileNote(notes, '2');
    const after = boardItems(notes.filter((n) => n.category === 'minus'));
    expect(after.map((i) => i.kind)).toEqual(['pile', 'note']);
  });

  it("n'empile pas une note masquée", () => {
    const notes = [note('1', 'plus'), note('2', 'plus', { revealed: false })];
    expect(pileNotes(notes, '1', '2')).toBe(notes);
  });
});
