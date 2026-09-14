import { useCallback, useEffect, useMemo, useState } from 'react';
import { useToolSession, type ToolIdentity } from '@/hooks/useToolSession';
import { useFacilitator } from '@/hooks/useFacilitator';
import { useToast } from '@/hooks/useToast';
import { buildNote, notesOf, downloadTextFile } from '@/components/toolbox/shared/boardNotes';
import {
  chronoRemaining, resetChronoState, toggleChronoState, withDuration,
} from '@/components/toolbox/shared/toolChrono';
import {
  BRAINSTORM_TEXT_MAX, INITIAL_BRAINSTORM_STATE, arrangeByColor, brainstormReducer, buildBrainstormSummary,
  freePosition, normalizeBrainstormState,
  type BrainstormColorKey, type BrainstormOp, type BrainstormState, type PostitPosition,
} from './brainstormLogic';

/**
 * Orchestration métier du Brainstorming au-dessus du socle temps réel, en
 * mode « opérations » (voir `brainstormReducer`), comme la rétro : chaque
 * post-it, déplacement ou vote est diffusé seul, sans rien écraser.
 */
export function useBrainstormSession(code: string | null, identity: ToolIdentity | null) {
  const toast = useToast();
  const [now, setNow] = useState(() => Date.now());

  const session = useToolSession<BrainstormState>({
    toolType: 'brainstorming',
    code,
    identity,
    initialState: INITIAL_BRAINSTORM_STATE,
    reducer: brainstormReducer,
  });
  const { isHost } = session;
  const send = session.dispatch as (op: BrainstormOp) => void;
  // Les sessions ouvertes avant la synchro par opérations n'ont ni séance ni anonymat.
  const state = useMemo(() => normalizeBrainstormState(session.state), [session.state]);
  const { isFacilitator, toggleFacilitator } = useFacilitator(isHost);
  const myId = identity?.id ?? '';

  useEffect(() => {
    if (!state.chrono.running) return;
    setNow(Date.now());
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [state.chrono.running]);
  const remainingSec = chronoRemaining(state.chrono, now);

  const myNotes = useMemo(() => notesOf(state.notes, myId), [state.notes, myId]);

  /** Prépare une idée (visible seulement par son auteur). */
  const addNote = useCallback((colorKey: BrainstormColorKey, text: string) => {
    if (!identity || !text.trim()) return;
    send({ t: 'add', round: state.round, note: buildNote(identity, colorKey, text.slice(0, BRAINSTORM_TEXT_MAX)) });
  }, [identity, send, state.round]);

  /** Supprime une idée : les siennes, ou n'importe laquelle pour l'animateur. */
  const deleteNote = useCallback((id: string) => {
    send({ t: 'delete', id, by: myId, moderator: isFacilitator });
  }, [send, myId, isFacilitator]);

  /** Révèle des idées préparées, chacune posée là où il reste de la place. */
  const revealIds = useCallback((ids: string[]) => {
    if (!ids.length) return;
    const taken: PostitPosition[] = Object.values(state.positions);
    const at = Date.now();
    const items = ids.map((id) => {
      const pos = freePosition(taken, at);
      taken.push(pos);
      return { id, pos, note: state.notes.find((n) => n.id === id) };
    });
    send({ t: 'reveal', authorId: myId, items });
  }, [send, myId, state.positions, state.notes]);

  const pendingIds = useMemo(() => myNotes.filter((n) => !n.revealed).map((n) => n.id), [myNotes]);
  const revealMyNext = useCallback(() => revealIds(pendingIds.slice(0, 1)), [revealIds, pendingIds]);
  const revealMyAll = useCallback(() => revealIds(pendingIds), [revealIds, pendingIds]);
  const unrevealMine = useCallback(() => send({ t: 'unreveal', authorId: myId }), [send, myId]);

  /** Déplace un post-it sur le canvas (sa rotation est conservée). */
  const moveNote = useCallback((id: string, pos: { x: number; y: number }) => {
    send({ t: 'move', id, x: pos.x, y: pos.y, at: Date.now() });
  }, [send]);

  /** Range tous les post-its en grille, couleur par couleur (animateur). */
  const arrange = useCallback((cols: number) => {
    send({ t: 'arrange', positions: arrangeByColor(state.notes, cols, Date.now()) });
  }, [send, state.notes]);

  /** Vote cœur (autorisé sur toutes les idées, y compris les siennes). */
  const like = useCallback((id: string) => {
    const note = state.notes.find((n) => n.id === id);
    if (note) send({ t: 'like', id, voterId: myId, liked: !note.likedBy.includes(myId) });
  }, [send, state.notes, myId]);

  const retain = useCallback((id: string) => {
    const note = state.notes.find((n) => n.id === id);
    if (note) send({ t: 'retain', id, retained: !note.retained });
  }, [send, state.notes]);

  const setTheme = useCallback((theme: string) => send({ t: 'theme', theme }), [send]);
  const setAnonymous = useCallback((value: boolean) => send({ t: 'anonymous', value }), [send]);

  const toggleChrono = useCallback(() => {
    setNow(Date.now());
    send({ t: 'chrono', chrono: toggleChronoState(state.chrono) });
  }, [send, state.chrono]);

  const resetChrono = useCallback(() => send({ t: 'chrono', chrono: resetChronoState(state.chrono) }), [send, state.chrono]);
  const setDuration = useCallback((seconds: number) => send({ t: 'chrono', chrono: withDuration(seconds) }), [send]);

  const exportSummary = useCallback(() => {
    downloadTextFile('brainstorming.txt', buildBrainstormSummary(state));
  }, [state]);

  const reset = useCallback(() => {
    send({ t: 'reset', round: state.round + 1, chrono: resetChronoState(state.chrono) });
    toast.success('Brainstorming réinitialisé');
  }, [send, state.round, state.chrono, toast]);

  return {
    state,
    participants: session.participants,
    isFacilitator,
    toggleFacilitator,
    isLoading: session.isLoading,
    remainingSec,
    myId,
    myNotes,
    actions: {
      addNote, deleteNote, revealMyNext, revealMyAll, unrevealMine,
      moveNote, arrange, like, retain, setTheme, setAnonymous,
      toggleChrono, resetChrono, setDuration, exportSummary, reset,
    },
  };
}

export default useBrainstormSession;
