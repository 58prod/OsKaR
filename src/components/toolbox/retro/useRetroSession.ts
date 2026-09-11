import { useCallback, useEffect, useMemo, useState } from 'react';
import { useToolSession, type ToolIdentity } from '@/hooks/useToolSession';
import { useFacilitator } from '@/hooks/useFacilitator';
import {
  buildNote, moveNote, notesOf, removeNote, revealAll, revealNext,
  toggleLike, unrevealAll, downloadTextFile,
} from '@/components/toolbox/shared/boardNotes';
import {
  chronoRemaining, resetChronoState, toggleChronoState, withDuration,
} from '@/components/toolbox/shared/toolChrono';
import {
  INITIAL_RETRO_STATE, allActions, buildActionsCsv, buildRetroSummary, mergeImportedActions,
  mergePile, movePile, normalizeRetroState, parseActionsCsv, pileNotes, retroActions,
  startNewRetro, todayISO, unpileNote,
  type RetroActionMeta, type RetroCategoryKey, type RetroNote, type RetroState,
} from './retroLogic';

/** Orchestration métier de la Rétrospective d'équipe au-dessus du socle temps réel. */
export function useRetroSession(code: string | null, identity: ToolIdentity | null) {
  const session = useToolSession<RetroState>({
    toolType: 'retrospective',
    code,
    identity,
    initialState: INITIAL_RETRO_STATE,
  });
  const { setState: setRawState, isHost } = session;
  // Les séances créées avant le suivi des actions n'ont pas tous les champs.
  const state = useMemo(() => normalizeRetroState(session.state), [session.state]);
  const setState = useCallback((updater: (prev: RetroState) => RetroState) => {
    setRawState((p) => updater(normalizeRetroState(p)));
  }, [setRawState]);
  const { isFacilitator, toggleFacilitator } = useFacilitator(isHost);
  const myId = identity?.id ?? '';

  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!state.chrono.running) return;
    setNow(Date.now());
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [state.chrono.running]);
  const remainingSec = chronoRemaining(state.chrono, now);

  const myNotes = useMemo(() => notesOf(state.notes, myId), [state.notes, myId]);
  const actions_ = useMemo(() => retroActions(state), [state]);

  const addNote = useCallback((category: RetroCategoryKey, text: string) => {
    if (!identity || !text.trim()) return;
    const note = buildNote(identity, category, text);
    setState((p) => ({ ...p, retroDate: p.retroDate || todayISO(), notes: [...p.notes, note] }));
  }, [identity, setState]);

  const deleteNote = useCallback((id: string) => {
    setState((p) => {
      const meta = { ...p.actionMeta };
      delete meta[id];
      return { ...p, notes: removeNote(p.notes, id) as RetroNote[], actionMeta: meta };
    });
  }, [setState]);

  const revealMyNext = useCallback(() => {
    setState((p) => ({ ...p, notes: revealNext(p.notes, myId) as RetroNote[] }));
  }, [setState, myId]);

  const revealMyAll = useCallback(() => {
    setState((p) => ({ ...p, notes: revealAll(p.notes, myId) as RetroNote[] }));
  }, [setState, myId]);

  const unrevealMine = useCallback(() => {
    setState((p) => {
      const mine = new Set(p.notes.filter((n) => n.authorId === myId).map((n) => n.id));
      let notes = unrevealAll(p.notes, myId) as RetroNote[];
      mine.forEach((id) => { notes = unpileNote(notes, id); });
      return { ...p, notes };
    });
  }, [setState, myId]);

  const moveToCategory = useCallback((id: string, category: RetroCategoryKey) => {
    setState((p) => ({ ...p, notes: unpileNote(moveNote(p.notes, id, category) as RetroNote[], id) }));
  }, [setState]);

  const movePileTo = useCallback((pileId: string, category: RetroCategoryKey) => {
    setState((p) => ({ ...p, notes: movePile(p.notes, pileId, category) }));
  }, [setState]);

  const pileOn = useCallback((id: string, targetId: string) => {
    setState((p) => ({ ...p, notes: pileNotes(p.notes, id, targetId) }));
  }, [setState]);

  const pileOnto = useCallback((pileId: string, targetId: string) => {
    setState((p) => ({ ...p, notes: mergePile(p.notes, pileId, targetId) }));
  }, [setState]);

  const unpile = useCallback((id: string) => {
    setState((p) => ({ ...p, notes: unpileNote(p.notes, id) }));
  }, [setState]);

  const like = useCallback((id: string) => {
    setState((p) => ({ ...p, notes: toggleLike(p.notes, id, myId) as RetroNote[] }));
  }, [setState, myId]);

  const setActionMeta = useCallback((id: string, patch: Partial<RetroActionMeta>) => {
    setState((p) => {
      const prev = p.actionMeta[id] ?? { resp: '', deadline: '', done: false };
      return { ...p, actionMeta: { ...p.actionMeta, [id]: { ...prev, ...patch } } };
    });
  }, [setState]);

  const setPastAction = useCallback((id: string, patch: Partial<RetroActionMeta>) => {
    setState((p) => ({
      ...p,
      pastActions: p.pastActions.map((a) => (a.id === id ? { ...a, ...patch } : a)),
    }));
  }, [setState]);

  const deletePastAction = useCallback((id: string) => {
    setState((p) => ({ ...p, pastActions: p.pastActions.filter((a) => a.id !== id) }));
  }, [setState]);

  const toggleChrono = useCallback(() => {
    setNow(Date.now());
    setState((p) => ({ ...p, chrono: toggleChronoState(p.chrono) }));
  }, [setState]);

  const resetChrono = useCallback(() => {
    setState((p) => ({ ...p, chrono: resetChronoState(p.chrono) }));
  }, [setState]);

  const setDuration = useCallback((seconds: number) => {
    setState((p) => ({ ...p, chrono: withDuration(seconds) }));
  }, [setState]);

  const exportSummary = useCallback(() => {
    downloadTextFile('retrospective.txt', buildRetroSummary(state));
  }, [state]);

  const exportActions = useCallback(() => {
    downloadTextFile(`actions-retro-${todayISO()}.csv`, buildActionsCsv(allActions(state)));
  }, [state]);

  /** Ajoute à l'historique les actions d'un fichier exporté ; renvoie le nombre ajouté. */
  const importActions = useCallback((csv: string): number => {
    const imported = parseActionsCsv(csv);
    let added = 0;
    setState((p) => {
      const merged = mergeImportedActions(p.pastActions, imported);
      added = merged.added;
      return { ...p, pastActions: merged.actions };
    });
    return added;
  }, [setState]);

  /** Vide les cases pour une nouvelle rétro ; les actions passent dans le suivi. */
  const newRetro = useCallback(() => {
    setState((p) => startNewRetro(p));
  }, [setState]);

  /** Efface tout, suivi des actions compris. */
  const reset = useCallback(() => {
    setState(() => ({ ...INITIAL_RETRO_STATE, retroDate: todayISO() }));
  }, [setState]);

  return {
    state,
    participants: session.participants,
    isFacilitator,
    toggleFacilitator,
    isLoading: session.isLoading,
    remainingSec,
    myId,
    myNotes,
    retroActions: actions_,
    actions: {
      addNote, deleteNote, revealMyNext, revealMyAll, unrevealMine,
      moveToCategory, movePileTo, pileOn, pileOnto, unpile, like,
      setActionMeta, setPastAction, deletePastAction,
      toggleChrono, resetChrono, setDuration,
      exportSummary, exportActions, importActions, newRetro, reset,
    },
  };
}

export default useRetroSession;
