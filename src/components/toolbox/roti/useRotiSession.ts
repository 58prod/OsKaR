import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useToolSession, type ToolIdentity } from '@/hooks/useToolSession';
import { useFacilitator } from '@/hooks/useFacilitator';
import { useToast } from '@/hooks/useToast';
import {
  chronoRemaining, resetChronoState, toggleChronoState, withDuration,
} from '@/components/toolbox/shared/toolChrono';
import { launchFireworks } from '@/components/toolbox/poker/flyingEmoji';
import {
  EXCELLENT_MIN, INITIAL_ROTI_STATE, computeRoti, normalizeRotiState, rotiReducer,
  type RotiOp, type RotiState,
} from './rotiLogic';

/**
 * Orchestration métier du ROTI au-dessus du socle temps réel, en mode
 * « opérations » (voir `rotiReducer`), comme le Planning Poker : chaque vote
 * est diffusé seul, si bien que toute l'équipe peut noter dans la même
 * seconde sans qu'aucun vote ne se perde.
 */
export function useRotiSession(code: string | null, identity: ToolIdentity | null) {
  const toast = useToast();
  const [now, setNow] = useState(() => Date.now());
  const fireworksShown = useRef(false);

  const session = useToolSession<RotiState>({
    toolType: 'roti',
    code,
    identity,
    initialState: INITIAL_ROTI_STATE,
    reducer: rotiReducer,
  });
  const { isHost } = session;
  const send = session.dispatch as (op: RotiOp) => void;
  // Les sessions ouvertes avant la synchro par opérations n'ont ni tour ni minuteur.
  const state = useMemo(() => normalizeRotiState(session.state), [session.state]);
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
  const results = useMemo(() => computeRoti(state.votes), [state.votes]);

  const reveal = useCallback(() => {
    const c = state.chrono;
    send({
      t: 'reveal',
      round: state.round,
      votes: state.votes,
      chrono: { ...c, running: false, endsAt: null, remainingSec: chronoRemaining(c) },
    });
  }, [send, state.chrono, state.round, state.votes]);

  // Révélation automatique en fin de minuteur, par l'animateur. Deux
  // révélations simultanées sont sans effet : la seconde est ignorée.
  useEffect(() => {
    if (!isFacilitator || !state.chrono.running) return;
    if (remainingSec <= 0 && !state.revealed && Object.keys(state.votes).length > 0) reveal();
  }, [isFacilitator, remainingSec, state.chrono.running, state.revealed, state.votes, reveal]);

  // Feux d'artifice pour une séance jugée excellente (une fois par révélation).
  useEffect(() => {
    if (state.revealed && results.count > 0 && results.avgRounded >= EXCELLENT_MIN && !fireworksShown.current) {
      fireworksShown.current = true;
      launchFireworks();
    }
    if (!state.revealed) fireworksShown.current = false;
  }, [state.revealed, results.count, results.avgRounded]);

  const vote = useCallback((star: number, comment: string) => {
    if (!identity || state.revealed) return;
    send({
      t: 'vote', round: state.round, voterId: identity.id, star, comment,
      name: identity.name, color: identity.color,
    });
  }, [send, identity, state.round, state.revealed]);

  // Les personnes en ligne, puis celles qui ont voté et dont la connexion a
  // décroché : leur note compte, on continue donc de les montrer.
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

  const setSession = useCallback((value: string) => send({ t: 'session', session: value }), [send]);

  // Votes et commentaires effacés, minuteur revenu à sa durée ; la séance est gardée.
  const reset = useCallback(() => {
    send({ t: 'newRound', round: state.round + 1, chrono: resetChronoState(state.chrono) });
    toast.success('Votes réinitialisés');
  }, [send, state.round, state.chrono, toast]);

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
    results,
    myId,
    actions: { setSession, vote, reveal, reset, toggleChrono, resetChrono, setDuration },
  };
}

export default useRotiSession;
