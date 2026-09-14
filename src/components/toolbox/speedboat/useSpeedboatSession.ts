import { useCallback, useEffect, useMemo, useState } from 'react';
import { useToolSession, type ToolIdentity } from '@/hooks/useToolSession';
import { useFacilitator } from '@/hooks/useFacilitator';
import { useToast } from '@/hooks/useToast';
import { buildNote, notesOf, downloadTextFile } from '@/components/toolbox/shared/boardNotes';
import {
  chronoRemaining, resetChronoState, toggleChronoState, withDuration,
} from '@/components/toolbox/shared/toolChrono';
import {
  INITIAL_SPEEDBOAT_STATE, SPEEDBOAT_TEXT_MAX, buildSpeedboatSummary, freePositionInZone, getSpeedboatZone,
  normalizeSpeedboatState, speedboatReducer, votesUsedBy,
  type CardPosition, type SpeedboatOp, type SpeedboatState, type SpeedboatZoneKey,
} from './speedboatLogic';

/**
 * Orchestration métier de la Rétrospective Speedboat au-dessus du socle
 * temps réel, en mode « opérations » (voir `speedboatReducer`) : chaque
 * ticket, placement, déplacement ou vote est diffusé seul.
 */
export function useSpeedboatSession(code: string | null, identity: ToolIdentity | null) {
  const toast = useToast();
  const [now, setNow] = useState(() => Date.now());

  const session = useToolSession<SpeedboatState>({
    toolType: 'speedboat',
    code,
    identity,
    initialState: INITIAL_SPEEDBOAT_STATE,
    reducer: speedboatReducer,
  });
  const { isHost } = session;
  const send = session.dispatch as (op: SpeedboatOp) => void;
  // Les sessions ouvertes avant la synchro par opérations n'ont ni séance ni réglages.
  const state = useMemo(() => normalizeSpeedboatState(session.state), [session.state]);
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
  const placedNotes = useMemo(() => state.notes.filter((n) => n.revealed), [state.notes]);
  const votesUsed = useMemo(() => votesUsedBy(state.notes, myId), [state.notes, myId]);
  const votesLeft = state.voteLimit > 0 ? Math.max(0, state.voteLimit - votesUsed) : null;

  /** Prépare un ticket brouillon (visible seulement par son auteur). */
  const addDraft = useCallback((zone: SpeedboatZoneKey, text: string) => {
    if (!identity || !text.trim()) return;
    send({ t: 'add', round: state.round, note: buildNote(identity, zone, text.slice(0, SPEEDBOAT_TEXT_MAX)) });
  }, [identity, send, state.round]);

  /** Place ses brouillons sur le tableau, chacun là où il reste de la place dans sa zone. */
  const publish = useCallback((ids: string[]) => {
    const drafts = state.notes.filter((n) => ids.includes(n.id) && n.authorId === myId && !n.revealed);
    if (!drafts.length) return;
    const taken: CardPosition[] = Object.values(state.positions);
    const at = Date.now();
    const items = drafts.map((note) => {
      const pos = freePositionInZone(getSpeedboatZone(note.category), taken, at);
      taken.push(pos);
      return { id: note.id, pos, note };
    });
    send({ t: 'publish', authorId: myId, round: state.round, items });
  }, [send, myId, state.notes, state.positions, state.round]);

  /** Déplace un ticket placé vers une zone + position (le plus récent l'emporte). */
  const moveCard = useCallback((id: string, zone: SpeedboatZoneKey, pos: { x: number; y: number }) => {
    send({ t: 'move', id, zone, x: pos.x, y: pos.y, at: Date.now() });
  }, [send]);

  /** Vote cœur (impossible sur ses propres tickets, dans la limite de cœurs). */
  const vote = useCallback((id: string) => {
    const note = state.notes.find((n) => n.id === id);
    if (!note || note.authorId === myId) return;
    const liked = !note.likedBy.includes(myId);
    if (liked && votesLeft === 0) {
      toast.warning(`Vous avez donné vos ${state.voteLimit} cœurs : retirez-en un pour voter ailleurs.`);
      return;
    }
    send({ t: 'like', id, voterId: myId, liked });
  }, [state.notes, state.voteLimit, myId, votesLeft, send, toast]);

  /** Marque « à retenir » / annule (animateur). */
  const retain = useCallback((id: string) => {
    const note = state.notes.find((n) => n.id === id);
    if (note) send({ t: 'retain', id, retained: !note.retained });
  }, [state.notes, send]);

  /** Supprime un ticket : l'auteur ses brouillons, l'animateur n'importe lequel. */
  const deleteNote = useCallback((id: string) => {
    send({ t: 'delete', id, by: myId, moderator: isFacilitator });
  }, [send, myId, isFacilitator]);

  const setAnonymous = useCallback((value: boolean) => send({ t: 'anonymous', value }), [send]);
  const setVoteLimit = useCallback((value: number) => send({ t: 'voteLimit', value }), [send]);

  const exportSummary = useCallback(() => {
    downloadTextFile('retro-speedboat.txt', buildSpeedboatSummary(state));
  }, [state]);

  const reset = useCallback(() => {
    send({ t: 'reset', round: state.round + 1, chrono: resetChronoState(state.chrono) });
    toast.success('Speedboat réinitialisé');
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
    placedNotes,
    votesLeft,
    actions: {
      addDraft, publish, moveCard, vote, retain, deleteNote, setAnonymous, setVoteLimit, exportSummary, reset,
      toggleChrono, resetChrono, setDuration,
    },
  };
}

export default useSpeedboatSession;
