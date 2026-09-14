import { useCallback, useEffect, useMemo, useState } from 'react';
import { useToolSession, type ToolIdentity } from '@/hooks/useToolSession';
import { useFacilitator } from '@/hooks/useFacilitator';
import { useToast } from '@/hooks/useToast';
import {
  chronoRemaining, resetChronoState, toggleChronoState, withDuration,
} from '@/components/toolbox/shared/toolChrono';
import {
  INITIAL_MOOD_STATE, buildMoodSummary, computeMoodGlobal, computeMoodStats, moodReducer, normalizeMoodState,
  type MoodDimKey, type MoodOp, type MoodPhase, type MoodScores, type MoodState,
} from './moodLogic';
import { copyText } from '@/components/toolbox/shared/copyText';

/**
 * Orchestration métier du Team Mood au-dessus du socle temps réel, en mode
 * « opérations » (voir `moodReducer`), comme la rétro, la récré, le Planning
 * Poker, le ROTI et le Daily.
 */
export function useMoodSession(code: string | null, identity: ToolIdentity | null) {
  const toast = useToast();
  const [now, setNow] = useState(() => Date.now());

  const session = useToolSession<MoodState>({
    toolType: 'team-mood',
    code,
    identity,
    initialState: INITIAL_MOOD_STATE,
    reducer: moodReducer,
  });
  const { isHost } = session;
  const send = session.dispatch as (op: MoodOp) => void;
  // Les sessions ouvertes avant la synchro par opérations n'ont ni tour ni minuteur.
  const state = useMemo(() => normalizeMoodState(session.state), [session.state]);
  const { isFacilitator, toggleFacilitator } = useFacilitator(isHost);
  const myId = identity?.id ?? '';

  // Tick d'affichage du chrono lorsqu'il tourne (cf. usePokerSession).
  useEffect(() => {
    if (!state.chrono.running) return;
    setNow(Date.now());
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [state.chrono.running]);

  const remainingSec = chronoRemaining(state.chrono, now);
  const stats = useMemo(() => computeMoodStats(state.votes), [state.votes]);
  const globalAvg = useMemo(() => computeMoodGlobal(stats), [stats]);

  const reveal = useCallback(() => {
    const c = state.chrono;
    send({
      t: 'reveal',
      round: state.round,
      votes: state.votes,
      chrono: { ...c, running: false, endsAt: null, remainingSec: chronoRemaining(c) },
    });
  }, [send, state.chrono, state.round, state.votes]);

  // Révélation automatique en fin de minuteur, par l'animateur.
  useEffect(() => {
    if (!isFacilitator || !state.chrono.running) return;
    if (remainingSec <= 0 && !state.revealed && Object.keys(state.votes).length > 0) reveal();
  }, [isFacilitator, remainingSec, state.chrono.running, state.revealed, state.votes, reveal]);

  const vote = useCallback((dims: MoodScores) => {
    if (!identity || state.revealed) return;
    send({ t: 'vote', round: state.round, voterId: identity.id, dims, name: identity.name, color: identity.color });
  }, [send, identity, state.round, state.revealed]);

  // Les personnes en ligne, puis celles qui ont voté et dont la connexion a
  // décroché : leurs notes comptent, on continue donc de les montrer.
  const players = useMemo(() => {
    const online = session.participants.map((p) => ({ ...p, online: true }));
    const present = new Set(online.map((p) => p.id));
    const absents = Object.keys(state.votes)
      .filter((id) => !present.has(id))
      .map((id) => ({
        id,
        name: state.voterNames[id]?.name ?? 'Participant',
        color: state.voterNames[id]?.color ?? '#94a3b8',
        isHost: false,
        online: false,
      }));
    return [...online, ...absents];
  }, [session.participants, state.votes, state.voterNames]);

  // Notes et discussion effacées, minuteur revenu à sa durée.
  const reset = useCallback(() => {
    send({ t: 'newRound', round: state.round + 1, chrono: resetChronoState(state.chrono) });
    toast.success('Notes réinitialisées');
  }, [send, state.round, state.chrono, toast]);

  const setPhase = useCallback((phase: MoodPhase) => send({ t: 'phase', round: state.round, phase }), [send, state.round]);

  const setCollective = useCallback((key: MoodDimKey, value: number) => {
    send({ t: 'collective', round: state.round, key, value });
  }, [send, state.round]);

  const setAnonymous = useCallback((value: boolean) => send({ t: 'anonymous', value }), [send]);

  const copySummary = useCallback(async () => {
    const text = buildMoodSummary(stats, state.collective, Object.keys(state.votes).length);
    if (await copyText(text)) toast.success('Synthèse copiée : collez-la dans votre compte rendu.');
    else toast.warning('Copie impossible dans ce navigateur.');
  }, [stats, state.collective, state.votes, toast]);

  const toggleChrono = useCallback(() => {
    setNow(Date.now());
    send({ t: 'chrono', chrono: toggleChronoState(state.chrono) });
  }, [send, state.chrono]);

  const resetChrono = useCallback(() => {
    send({ t: 'chrono', chrono: resetChronoState(state.chrono) });
  }, [send, state.chrono]);

  const setDuration = useCallback((seconds: number) => {
    send({ t: 'chrono', chrono: withDuration(seconds) });
  }, [send]);

  return {
    state,
    participants: players,
    isFacilitator,
    toggleFacilitator,
    isLoading: session.isLoading,
    remainingSec,
    stats,
    globalAvg,
    myId,
    actions: {
      vote, reveal, reset, setPhase, setCollective, setAnonymous, copySummary, toggleChrono, resetChrono, setDuration,
    },
  };
}

export default useMoodSession;
