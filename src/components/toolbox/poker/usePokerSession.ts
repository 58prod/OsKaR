import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useToolSession, type ToolIdentity } from '@/hooks/useToolSession';
import { useFacilitator } from '@/hooks/useFacilitator';
import { useToast } from '@/hooks/useToast';
import {
  chronoRemaining, resetChronoState, toggleChronoState, withDuration,
} from '@/components/toolbox/shared/toolChrono';
import { shootEmojis, launchFireworks } from './flyingEmoji';
import {
  INITIAL_POKER_STATE, SUITES, computeResults, normalizePokerState, pokerReducer,
  type PokerOp, type PokerState, type SuiteKey,
} from './pokerLogic';

/**
 * Orchestration métier du Planning Poker au-dessus du socle temps réel, en
 * mode « opérations » (voir `pokerReducer`) : chaque vote est diffusé seul,
 * si bien que toute l'équipe peut voter dans la même seconde sans qu'aucun
 * vote ne se perde. Dérivés (chrono, résultats), effets (auto-révélation,
 * feux d'artifice) et actions (vote, suite, chrono, réactions).
 */
export function usePokerSession(code: string | null, identity: ToolIdentity | null) {
  const toast = useToast();
  const [now, setNow] = useState(() => Date.now());
  const fireworksShown = useRef(false);

  const onSignal = useCallback((payload: any) => {
    if (payload?.type === 'emoji' && typeof payload.emoji === 'string') {
      shootEmojis(payload.emoji);
    }
  }, []);

  const session = useToolSession<PokerState>({
    toolType: 'planning-poker',
    code,
    identity,
    initialState: INITIAL_POKER_STATE,
    onSignal,
    reducer: pokerReducer,
  });
  const { isHost, sendSignal } = session;
  const send = session.dispatch as (op: PokerOp) => void;
  // Les sessions ouvertes avant les manches numérotées n'ont pas `round`.
  const state = useMemo(() => normalizePokerState(session.state), [session.state]);
  const myId = identity?.id ?? '';

  const { isFacilitator, toggleFacilitator } = useFacilitator(isHost);

  // Tick d'affichage du chrono lorsqu'il tourne. On recale `now` dès le passage
  // en « running » (cas d'un démarrage reçu via la synchro temps réel) pour éviter
  // une valeur transitoire calculée sur une horloge figée.
  useEffect(() => {
    if (!state.chrono.running) return;
    setNow(Date.now());
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [state.chrono.running]);

  const remainingSec = chronoRemaining(state.chrono, now);
  const results = useMemo(() => computeResults(state.votes), [state.votes]);

  const reveal = useCallback(() => {
    const c = state.chrono;
    send({
      t: 'reveal',
      round: state.round,
      votes: state.votes,
      chrono: { ...c, running: false, endsAt: null, remainingSec: chronoRemaining(c) },
    });
  }, [send, state.chrono, state.round, state.votes]);

  // Auto-révélation en fin de chrono, par l'animateur (l'hôte par défaut ; si
  // l'hôte est parti, celui qui a pris la main). Deux révélations simultanées
  // sont sans effet : la seconde est ignorée.
  useEffect(() => {
    if (!isFacilitator || !state.chrono.running) return;
    if (remainingSec <= 0 && !state.revealed && Object.keys(state.votes).length > 0) reveal();
  }, [isFacilitator, remainingSec, state.chrono.running, state.revealed, state.votes, reveal]);

  // Feux d'artifice au consensus parfait (une fois par révélation).
  useEffect(() => {
    if (state.revealed && results.consensus === 'perfect' && !fireworksShown.current) {
      fireworksShown.current = true;
      launchFireworks();
    }
    if (!state.revealed) fireworksShown.current = false;
  }, [state.revealed, results.consensus]);

  const vote = useCallback((value: string) => {
    if (!identity || state.revealed) return;
    send({ t: 'vote', round: state.round, voterId: identity.id, value, name: identity.name, color: identity.color });
  }, [send, identity, state.round, state.revealed]);

  // Les personnes en ligne, puis celles qui ont voté et dont la connexion a
  // décroché : leur vote compte, on continue donc de les montrer.
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

  const setStory = useCallback((story: string) => send({ t: 'story', story }), [send]);

  const setSuite = useCallback((key: SuiteKey) => {
    send({
      t: 'newRound',
      round: state.round + 1,
      suiteKey: key,
      suite: key === 'custom' ? state.suite : [...SUITES[key]],
    });
  }, [send, state.round, state.suite]);

  const applyCustom = useCallback((raw: string) => {
    const vals = raw.split(',').map((s) => s.trim()).filter(Boolean);
    if (vals.length < 2) {
      toast.warning('Ajoutez au moins 2 valeurs séparées par des virgules.');
      return;
    }
    send({ t: 'newRound', round: state.round + 1, suiteKey: 'custom', suite: vals });
  }, [send, state.round, toast]);

  // Comme la maquette : les votes sont effacés et le chrono revient à sa durée.
  const reset = useCallback(() => {
    send({ t: 'newRound', round: state.round + 1, chrono: resetChronoState(state.chrono) });
    toast.success('Votes réinitialisés');
  }, [send, state.round, state.chrono, toast]);

  const toggleChrono = useCallback(() => {
    // Recale l'horloge d'affichage au clic : le premier rendu utilise l'heure
    // réelle (pas de valeur transitoire).
    setNow(Date.now());
    send({ t: 'chrono', chrono: toggleChronoState(state.chrono) });
  }, [send, state.chrono]);

  const resetChrono = useCallback(() => {
    send({ t: 'chrono', chrono: resetChronoState(state.chrono) });
  }, [send, state.chrono]);

  const setDuration = useCallback((seconds: number) => {
    send({ t: 'chrono', chrono: withDuration(seconds) });
  }, [send]);

  const react = useCallback((emoji: string) => {
    shootEmojis(emoji);
    sendSignal({ type: 'emoji', emoji });
  }, [sendSignal]);

  return {
    state,
    participants: players,
    isHost,
    isFacilitator,
    toggleFacilitator,
    isLoading: session.isLoading,
    remainingSec,
    results,
    myId,
    actions: { vote, setStory, setSuite, applyCustom, reveal, reset, toggleChrono, resetChrono, setDuration, react },
  };
}
