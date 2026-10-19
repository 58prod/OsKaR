import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useToolSession, type ToolIdentity } from '@/hooks/useToolSession';
import { useFacilitator } from '@/hooks/useFacilitator';
import { buildNote, notesOf, downloadTextFile } from '@/components/toolbox/shared/boardNotes';
import {
  chronoRemaining, resetChronoState, toggleChronoState, withDuration,
} from '@/components/toolbox/shared/toolChrono';
import {
  INITIAL_RETRO_STATE, allActions, buildActionsCsv, buildRetroSummary, keyBeside, mergeImportedActions,
  normalizeRetroState, parseActionsCsv, queueKey, retroActions, retroReducer, sortQueue, todayISO,
  type RetroActionMeta, type RetroCategoryKey, type RetroNote, type RetroOp,
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

  const myNotes = useMemo(() => sortQueue(notesOf(state.notes, myId) as RetroNote[]), [state.notes, myId]);
  const actions_ = useMemo(() => retroActions(state), [state]);

  const addNote = useCallback((category: RetroCategoryKey, text: string) => {
    if (!identity || !text.trim()) return;
    send({ t: 'addNote', note: buildNote(identity, category, text), today: todayISO(), session: state.session });
  }, [identity, send, state.session]);

  const deleteNote = useCallback((id: string) => send({ t: 'deleteNote', id }), [send]);

  /** Modifie le texte (et, avant révélation, le quadrant) d'une de ses notes. */
  const editNote = useCallback((id: string, text: string, category: RetroCategoryKey) => {
    const note = state.notes.find((n) => n.id === id && n.authorId === myId);
    if (!note || !text.trim()) return;
    const at = Date.now();
    send({
      t: 'editNote',
      note: { ...note, text: text.trim(), category: note.revealed ? note.category : category, editedAt: at },
      at,
      session: state.session,
    });
  }, [state.notes, myId, send, state.session]);

  /** Révèle ses notes, dans l'ordre de sa file ; elles voyagent avec la révélation (voir `retroReducer`). */
  const reveal = useCallback((notes: RetroNote[]) => {
    if (!notes.length) return;
    send({ t: 'reveal', ids: notes.map((n) => n.id), authorId: myId, session: state.session, notes, at: Date.now() });
  }, [send, myId, state.session]);

  const myPending = useMemo(() => myNotes.filter((n) => !n.revealed), [myNotes]);

  // Couleur changée (choisie, ou attribuée car déjà prise) : ses notes la suivent.
  // Une seule fois par couleur : deux onglets en désaccord ne se renvoient pas la balle.
  const myColor = identity?.color;
  const colorSent = useRef<string | null>(null);
  useEffect(() => {
    if (!myColor || !myId || colorSent.current === myColor) return;
    if (myNotes.some((n) => n.authorColor !== myColor)) {
      colorSent.current = myColor;
      send({ t: 'color', authorId: myId, color: myColor });
    }
  }, [myColor, myId, myNotes, send]);

  const revealMyNext = useCallback(() => {
    if (myPending[0]) reveal([myPending[0]]);
  }, [myPending, reveal]);

  const revealMyAll = useCallback(() => reveal(myPending), [myPending, reveal]);

  const revealOne = useCallback((id: string) => {
    const note = myPending.find((n) => n.id === id);
    if (note) reveal([note]);
  }, [myPending, reveal]);

  /** Monte ou descend une note dans sa file de préparation (ordre de révélation). */
  const moveInQueue = useCallback((id: string, dir: -1 | 1) => {
    const i = myPending.findIndex((n) => n.id === id);
    if (i < 0 || (dir === -1 && i === 0) || (dir === 1 && i === myPending.length - 1)) return;
    const keys = myPending.filter((n) => n.id !== id).map(queueKey);
    const key = dir === -1 ? keyBeside(keys, i - 1, 'before') : keyBeside(keys, i, 'after');
    send({ t: 'order', orders: { [id]: key }, at: Date.now(), queue: true });
  }, [myPending, send]);

  /** Place une note de sa file juste avant ou après une autre (glisser-déposer). */
  const placeInQueue = useCallback((id: string, targetId: string, side: 'before' | 'after') => {
    if (id === targetId) return;
    const others = myPending.filter((n) => n.id !== id);
    const index = others.findIndex((n) => n.id === targetId);
    if (index < 0 || !myPending.some((n) => n.id === id)) return;
    send({ t: 'order', orders: { [id]: keyBeside(others.map(queueKey), index, side) }, at: Date.now(), queue: true });
  }, [myPending, send]);

  /** Nouvelles places sur le tableau (glisser-déposer). */
  const setOrders = useCallback((orders: Record<string, number>) => {
    if (Object.keys(orders).length) send({ t: 'order', orders, at: Date.now() });
  }, [send]);

  /** Regroupe (ou plus) les notes par personne sur le tableau, révélées ou non. */
  const toggleGroupByAuthor = useCallback(() => {
    send({ t: 'groupByAuthor', on: !state.groupByAuthor, at: Date.now() });
  }, [send, state.groupByAuthor]);

  /** Marque des notes comme abordées : barrées et rangées en bas de leur case. */
  const setTreated = useCallback((ids: string[], treated: boolean) => {
    if (ids.length) send({ t: 'treated', ids, treated, at: Date.now() });
  }, [send]);

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
    downloadTextFile(`retrospective-${state.retroDate || todayISO()}.txt`, buildRetroSummary(state));
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
  const newRetro = useCallback(() => {
    send({ t: 'newRetro', today: todayISO(), session: state.session + 1 });
  }, [send, state.session]);

  /** Efface tout, suivi des actions compris. */
  const reset = useCallback(() => send({ t: 'reset', today: todayISO(), session: state.session + 1 }), [send, state.session]);

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
      addNote, editNote, deleteNote, revealMyNext, revealMyAll, revealOne, unrevealMine, moveInQueue, placeInQueue,
      setOrders, toggleGroupByAuthor, setTreated,
      moveToCategory, movePileTo, pileOn, pileOnto, unpile, like,
      setActionMeta, setPastAction, deletePastAction, dismissAction, restoreActions,
      toggleChrono, resetChrono, setDuration,
      exportSummary, exportActions, importActions, newRetro, reset,
    },
  };
}

export default useRetroSession;
