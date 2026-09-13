import { useCallback, useEffect, useMemo, useState } from 'react';
import { useToolSession, type ToolIdentity } from '@/hooks/useToolSession';
import { useFacilitator } from '@/hooks/useFacilitator';
import {
  INITIAL_DAILY_STATE, dailyReducer, isActive, normalizeDailyState, shuffled, totalElapsed, turnRemaining,
  type DailyOp, type DailyPerson, type DailyState,
} from './dailyLogic';

const token = () => Math.random().toString(36).slice(2, 10);

/**
 * Orchestration métier du Daily Stand-up au-dessus du socle temps réel, en
 * mode « opérations » (voir `dailyReducer`), comme la rétro, la récré, le
 * Planning Poker et le ROTI.
 */
export function useDailySession(code: string | null, identity: ToolIdentity | null) {
  const session = useToolSession<DailyState>({
    toolType: 'daily-standup',
    code,
    identity,
    initialState: INITIAL_DAILY_STATE,
    reducer: dailyReducer,
  });
  const { isHost, isLoading } = session;
  const send = session.dispatch as (op: DailyOp) => void;
  const state = useMemo(() => normalizeDailyState(session.state), [session.state]);
  const { isFacilitator, toggleFacilitator } = useFacilitator(isHost);
  const myId = identity?.id ?? '';
  const active = isActive(state.phase);

  // Tick d'affichage : fin pendant un tour (barre de progression), à la
  // seconde entre deux tours (durée totale de la séance).
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!active) return;
    setNow(Date.now());
    const t = setInterval(() => setNow(Date.now()), state.phase === 'running' ? 250 : 1000);
    return () => clearInterval(t);
  }, [active, state.phase]);

  const remainingSec = turnRemaining(state, now);
  const totalSec = totalElapsed(state, now);
  const currentId = state.currentIdx >= 0 ? state.order[state.currentIdx] ?? null : null;
  const nextId = state.phase === 'next' ? state.order[state.currentIdx + 1] ?? null : null;

  // Arrivé pendant le daily : on prend place en fin de tour, pour avoir la parole aussi.
  useEffect(() => {
    if (!identity || isLoading || !active || state.order.includes(identity.id)) return;
    send({ t: 'join', run: state.run, id: identity.id, person: { name: identity.name, color: identity.color } });
  }, [identity, isLoading, active, state.order, state.run, send]);

  // Personnes en ligne + personnes du tour dont la connexion a décroché.
  const people = useMemo(() => {
    const online = new Set(session.participants.map((p) => p.id));
    const byId = new Map<string, DailyPerson & { online: boolean }>();
    Object.entries(state.names).forEach(([id, p]) => byId.set(id, { ...p, online: online.has(id) }));
    session.participants.forEach((p) => byId.set(p.id, { name: p.name, color: p.color, online: true }));
    return byId;
  }, [session.participants, state.names]);

  const start = useCallback(() => {
    const ids = session.participants.map((p) => p.id);
    if (ids.length === 0) return;
    const names: Record<string, DailyPerson> = {};
    session.participants.forEach((p) => { names[p.id] = { name: p.name, color: p.color }; });
    send({
      t: 'start', run: state.run + 1, token: token(),
      order: state.randomOrder ? shuffled(ids) : ids, names, at: Date.now(),
    });
  }, [send, session.participants, state.run, state.randomOrder]);

  const pauseResume = useCallback(() => {
    if (state.phase === 'running') {
      send({ t: 'pause', run: state.run, idx: state.currentIdx, remainingSec: turnRemaining(state) });
    } else if (state.phase === 'paused') {
      setNow(Date.now());
      send({ t: 'resume', run: state.run, idx: state.currentIdx, endsAt: Date.now() + state.remainingSec * 1000 });
    }
  }, [send, state]);

  const next = useCallback(() => {
    send({ t: 'next', run: state.run, idx: state.currentIdx, at: Date.now() });
  }, [send, state.run, state.currentIdx]);

  const go = useCallback(() => {
    setNow(Date.now());
    send({ t: 'go', run: state.run, idx: state.currentIdx + 1, endsAt: Date.now() + state.durationSec * 1000 });
  }, [send, state.run, state.currentIdx, state.durationSec]);

  const skip = useCallback(() => {
    send({ t: 'skip', run: state.run, idx: state.currentIdx + 1, at: Date.now() });
  }, [send, state.run, state.currentIdx]);

  const stop = useCallback(() => {
    send({ t: 'stop', run: state.run + 1, token: token() });
  }, [send, state.run]);

  const setDuration = useCallback((sec: number) => send({ t: 'duration', durationSec: sec }), [send]);
  const setRandomOrder = useCallback((value: boolean) => send({ t: 'randomOrder', value }), [send]);

  return {
    state,
    participants: session.participants,
    people,
    isFacilitator,
    toggleFacilitator,
    isLoading,
    remainingSec,
    totalSec,
    currentId,
    nextId,
    myId,
    actions: { start, pauseResume, next, go, skip, stop, setDuration, setRandomOrder },
  };
}

export default useDailySession;
