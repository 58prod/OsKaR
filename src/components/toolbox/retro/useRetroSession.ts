import { useCallback, useEffect, useMemo, useState } from 'react';
import { useToolSession, type ToolIdentity } from '@/hooks/useToolSession';
import { useFacilitator } from '@/hooks/useFacilitator';
import { buildNote, notesOf, downloadTextFile } from '@/components/toolbox/shared/boardNotes';
import {
  chronoRemaining, resetChronoState, toggleChronoState, withDuration,
} from '@/components/toolbox/shared/toolChrono';
import {
  INITIAL_RETRO_STATE, allActions, buildActionsCsv, buildRetroSummary, mergeImportedActions,
  normalizeRetroState, parseActionsCsv, retroActions, retroReducer, todayISO,
  type RetroActionMeta, type RetroCategoryKey, type RetroOp,
} from './retroLogic';

/**
 * Orchestration métier de la Rétrospective d'équipe au-dessus du socle temps
 * réel, en mode « opérations » : chaque geste est diffusé comme une opération
 * (voir `retroReducer`), si bien que dix personnes peuvent ajouter leurs
 * notes en même temps sans qu'aucune ne se perde.
 */
export function useRetroSession(code: string | null, identity: ToolIdentity | null) {
  const session = useToolSession({
    toolType: 'retrospective',
    code,
    identity,
    initialState: INITIAL_RETRO_STATE,
    reducer: retroReducer,
  });
  const { isHost } = session;
  const send = session.dispatch as (op: RetroOp) => void;
  // Les séances créées avant le suivi des actions n'ont pas tous les champs.
  const state = useMemo(() => normalizeRetroState(session.state), [session.state]);
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
    send({ t: 'addNote', note: buildNote(identity, category, text), today: todayISO() });
  }, [identity, send]);

  const deleteNote = useCallback((id: string) => send({ t: 'deleteNote', id }), [send]);

  const revealMyNext = useCallback(() => {
    const next = state.notes.find((n) => n.authorId === myId && !n.revealed);
    if (next) send({ t: 'reveal', ids: [next.id] });
  }, [state.notes, myId, send]);

  const revealMyAll = useCallback(() => {
    const ids = state.notes.filter((n) => n.authorId === myId && !n.revealed).map((n) => n.id);
    if (ids.length) send({ t: 'reveal', ids });
  }, [state.notes, myId, send]);

  const unrevealMine = useCallback(() => send({ t: 'unreveal', authorId: myId }), [send, myId]);

  const moveToCategory = useCallback((id: string, category: RetroCategoryKey) => {
    send({ t: 'move', id, category });
  }, [send]);

  const movePileTo = useCallback((pileId: string, category: RetroCategoryKey) => {
    send({ t: 'movePile', pileId, category });
  }, [send]);

  const pileOn = useCallback((id: string, targetId: string) => send({ t: 'pile', id, targetId }), [send]);

  const pileOnto = useCallback((pileId: string, targetId: string) => {
    send({ t: 'pileOnto', pileId, targetId });
  }, [send]);

  const unpile = useCallback((id: string) => send({ t: 'unpile', id }), [send]);

  const like = useCallback((id: string) => {
    const note = state.notes.find((n) => n.id === id);
    if (!note) return;
    send({ t: 'like', id, voterId: myId, liked: !note.likedBy.includes(myId) });
  }, [state.notes, myId, send]);

  const setActionMeta = useCallback((id: string, patch: Partial<RetroActionMeta>) => {
    send({ t: 'actionMeta', id, patch });
  }, [send]);

  const setPastAction = useCallback((id: string, patch: Partial<RetroActionMeta>) => {
    send({ t: 'pastAction', id, patch });
  }, [send]);

  const deletePastAction = useCallback((id: string) => send({ t: 'deletePastAction', id }), [send]);

  /** Retire une note « À démarrer » de la liste des actions ; elle reste sur le tableau. */
  const dismissAction = useCallback((id: string) => send({ t: 'dismissAction', id }), [send]);
  const restoreActions = useCallback(() => send({ t: 'restoreActions' }), [send]);

  const toggleChrono = useCallback(() => {
    setNow(Date.now());
    send({ t: 'chrono', chrono: toggleChronoState(state.chrono) });
  }, [state.chrono, send]);

  const resetChrono = useCallback(() => {
    send({ t: 'chrono', chrono: resetChronoState(state.chrono) });
  }, [state.chrono, send]);

  const setDuration = useCallback((seconds: number) => {
    send({ t: 'chrono', chrono: withDuration(seconds) });
  }, [send]);

  const exportSummary = useCallback(() => {
    downloadTextFile('retrospective.txt', buildRetroSummary(state));
  }, [state]);

  const exportActions = useCallback(() => {
    downloadTextFile(`actions-retro-${todayISO()}.csv`, buildActionsCsv(allActions(state)));
  }, [state]);

  /** Ajoute au suivi les actions d'un fichier exporté ; renvoie le nombre ajouté. */
  const importActions = useCallback((csv: string): number => {
    const { added, actions } = mergeImportedActions(state.pastActions, parseActionsCsv(csv));
    if (added > 0) send({ t: 'importActions', actions: actions.slice(state.pastActions.length) });
    return added;
  }, [state.pastActions, send]);

  /** Vide les cases pour une nouvelle rétro ; les actions passent dans le suivi. */
  const newRetro = useCallback(() => send({ t: 'newRetro', today: todayISO() }), [send]);

  /** Efface tout, suivi des actions compris. */
  const reset = useCallback(() => send({ t: 'reset', today: todayISO() }), [send]);

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
      setActionMeta, setPastAction, deletePastAction, dismissAction, restoreActions,
      toggleChrono, resetChrono, setDuration,
      exportSummary, exportActions, importActions, newRetro, reset,
    },
  };
}

export default useRetroSession;
