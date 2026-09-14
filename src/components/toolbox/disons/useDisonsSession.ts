import { useCallback, useEffect, useMemo, useState } from 'react';
import { useToolSession, type ToolIdentity } from '@/hooks/useToolSession';
import { useFacilitator } from '@/hooks/useFacilitator';
import { useToast } from '@/hooks/useToast';
import { buildNote, notesOf, downloadTextFile } from '@/components/toolbox/shared/boardNotes';
import { aDonneCoeur, heureDuCoeur } from '@/components/toolbox/shared/coeurs';
import {
  chronoRemaining, resetChronoState, toggleChronoState, withDuration,
} from '@/components/toolbox/shared/toolChrono';
import {
  DISONS_TEXT_MAX, INITIAL_DISONS_STATE, buildDisonsSummary, disonsReducer, normalizeDisonsState, votesUsedBy,
  type DisonsKind, type DisonsOp, type DisonsState,
} from './disonsLogic';

/**
 * Orchestration métier de « Disons-nous les choses » au-dessus du socle
 * temps réel, en mode « opérations » (voir `disonsReducer`), comme la
 * Boîte à idées : chaque carte, publication ou vote est diffusé seul.
 */
export function useDisonsSession(code: string | null, identity: ToolIdentity | null) {
  const toast = useToast();
  const [now, setNow] = useState(() => Date.now());

  const session = useToolSession<DisonsState>({
    toolType: 'disons-nous',
    code,
    identity,
    initialState: INITIAL_DISONS_STATE,
    reducer: disonsReducer,
  });
  const { isHost } = session;
  const send = session.dispatch as (op: DisonsOp) => void;
  // Les sessions ouvertes avant la synchro par opérations n'ont ni séance ni réglages.
  const state = useMemo(() => normalizeDisonsState(session.state), [session.state]);
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
  const publishedNotes = useMemo(() => state.notes.filter((n) => n.revealed), [state.notes]);
  const votesUsed = useMemo(() => votesUsedBy(state.notes, myId), [state.notes, myId]);
  const votesLeft = state.voteLimit > 0 ? Math.max(0, state.voteLimit - votesUsed) : null;

  /** Prépare une carte brouillon (visible seulement par son auteur). */
  const addDraft = useCallback((kind: DisonsKind, text: string) => {
    if (!identity || !text.trim()) return;
    send({ t: 'add', round: state.round, note: buildNote(identity, kind, text.slice(0, DISONS_TEXT_MAX)) });
  }, [identity, send, state.round]);

  /** Supprime une carte : l'auteur ses brouillons, l'animateur n'importe laquelle. */
  const deleteNote = useCallback((id: string) => {
    send({ t: 'delete', id, by: myId, moderator: isFacilitator });
  }, [send, myId, isFacilitator]);

  /** Publie un ou plusieurs de ses brouillons ; les cartes voyagent avec la publication. */
  const publish = useCallback((ids: string[]) => {
    if (!ids.length) return;
    send({ t: 'publish', authorId: myId, ids, round: state.round, notes: state.notes.filter((n) => ids.includes(n.id)) });
  }, [send, myId, state.notes, state.round]);

  /** Vote cœur (impossible sur ses propres cartes, dans la limite de cœurs). */
  const vote = useCallback((id: string) => {
    const note = state.notes.find((n) => n.id === id);
    if (!note || note.authorId === myId) return;
    // Un cœur au-delà de la limite (limite baissée entre-temps) ne compte pas mais existe : ce clic le retire.
    const liked = !aDonneCoeur(state.likes, id, myId);
    if (liked && votesLeft === 0) {
      toast.warning(`Vous avez donné vos ${state.voteLimit} cœurs : retirez-en un pour voter ailleurs.`);
      return;
    }
    send({ t: 'like', id, voterId: myId, liked, at: heureDuCoeur(state.likes, id, myId) });
  }, [state.notes, state.likes, state.voteLimit, myId, votesLeft, send, toast]);

  /** Marque « à retenir » / annule (animateur). */
  const retain = useCallback((id: string) => {
    const note = state.notes.find((n) => n.id === id);
    if (note) send({ t: 'retain', id, retained: !note.retained });
  }, [state.notes, send]);

  const setAnonymous = useCallback((value: boolean) => send({ t: 'anonymous', value }), [send]);
  const setVoteLimit = useCallback((value: number) => send({ t: 'voteLimit', value }), [send]);

  const exportSummary = useCallback(() => {
    downloadTextFile('disons-nous-les-choses.txt', buildDisonsSummary(state));
  }, [state]);

  const reset = useCallback(() => {
    send({ t: 'reset', round: state.round + 1, chrono: resetChronoState(state.chrono) });
    toast.success('Séance réinitialisée');
  }, [send, state.round, state.chrono, toast]);

  const toggleChrono = useCallback(() => {
    setNow(Date.now());
    send({ t: 'chrono', chrono: toggleChronoState(state.chrono) });
  }, [send, state.chrono]);

  const resetChrono = useCallback(() => send({ t: 'chrono', chrono: resetChronoState(state.chrono) }), [send, state.chrono]);
  const setDuration = useCallback((seconds: number) => send({ t: 'chrono', chrono: withDuration(seconds) }), [send]);

  return {
    state,
    participants: session.participants,
    isFacilitator,
    toggleFacilitator,
    isLoading: session.isLoading,
    remainingSec,
    myId,
    myNotes,
    publishedNotes,
    votesLeft,
    actions: {
      addDraft, deleteNote, publish, vote, retain, setAnonymous, setVoteLimit, exportSummary, reset,
      toggleChrono, resetChrono, setDuration,
    },
  };
}

export default useDisonsSession;
