import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { RealtimeChannel } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from '@/lib/supabaseClient';
import { TOOLBOX_CONFIG, type ToolType } from '@/constants/toolbox';
import { ToolSessionService } from '@/services/toolSession';

/** Fenêtre (ms) pendant laquelle nos opérations sont rejouées sur un état reçu. */
const RECENT_OPS_MS = 10_000;

export interface ToolIdentity {
  id: string;
  name: string;
  color: string;
}

export interface ToolParticipant extends ToolIdentity {
  isHost: boolean;
}

interface UseToolSessionOptions<TState> {
  toolType: ToolType;
  code: string | null;
  identity: ToolIdentity | null;
  initialState: TState;
  /** Reçoit les signaux éphémères diffusés (ex: réactions emoji). */
  onSignal?: (payload: any) => void;
  /**
   * Mode « opérations » : au lieu de diffuser tout l'état à chaque
   * modification (le dernier qui écrit gagne, et deux ajouts simultanés
   * peuvent s'écraser), chaque client diffuse l'opération qu'il vient de
   * faire, et tous l'appliquent avec ce réducteur. À utiliser via `dispatch`.
   */
  reducer?: (state: TState, op: any) => TState;
}

interface UseToolSessionResult<TState> {
  state: TState;
  setState: (updater: TState | ((prev: TState) => TState)) => void;
  participants: ToolParticipant[];
  hostId: string | null;
  isHost: boolean;
  isConnected: boolean;
  isLoading: boolean;
  sendSignal: (payload: any) => void;
  /** Applique une opération localement et la diffuse (mode « opérations »). */
  dispatch: (op: any) => void;
}

/**
 * Socle de synchronisation temps réel réutilisable par tous les outils.
 * - Broadcast : diffusion de l'état partagé (last-write-wins), ou des
 *   opérations quand l'outil fournit un `reducer` (pas d'écrasement).
 * - Presence : liste des participants réellement en ligne.
 * - Snapshot DB : réhydratation des retardataires / après rafraîchissement.
 */
export function useToolSession<TState>(
  opts: UseToolSessionOptions<TState>,
): UseToolSessionResult<TState> {
  const { toolType, code, identity, initialState } = opts;

  const [state, setLocalState] = useState<TState>(initialState);
  const [participants, setParticipants] = useState<ToolParticipant[]>([]);
  const [hostId, setHostId] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const channelRef = useRef<RealtimeChannel | null>(null);
  const stateRef = useRef<TState>(initialState);
  const hostIdRef = useRef<string | null>(null);
  const identityRef = useRef(identity);
  const onSignalRef = useRef(opts.onSignal);
  const reducerRef = useRef(opts.reducer);
  const snapshotTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  /** L'état de la base est-il chargé ? Avant, les opérations sont mises en attente. */
  const readyRef = useRef(false);
  /** Opérations faites avant le chargement, à rejouer puis diffuser. */
  const pendingOpsRef = useRef<any[]>([]);
  /** Opérations locales récentes, rejouées si un état complet arrive juste après. */
  const recentOpsRef = useRef<{ op: any; at: number }[]>([]);

  identityRef.current = identity;
  onSignalRef.current = opts.onSignal;
  reducerRef.current = opts.reducer;

  const isHost = !!identity && hostId === identity.id;

  const refreshParticipants = useCallback((channel: RealtimeChannel) => {
    const presence = channel.presenceState() as Record<string, any[]>;
    const byId = new Map<string, ToolParticipant>();
    Object.values(presence).forEach((entries) => {
      entries.forEach((meta: any) => {
        if (meta?.id) byId.set(meta.id, { id: meta.id, name: meta.name, color: meta.color, isHost: !!meta.isHost });
      });
    });
    setParticipants(Array.from(byId.values()));
  }, []);

  const scheduleSnapshot = useCallback((next: TState) => {
    if (!code) return;
    if (snapshotTimer.current) clearTimeout(snapshotTimer.current);
    snapshotTimer.current = setTimeout(() => {
      void ToolSessionService.saveSnapshot(code, next as any, toolType);
    }, TOOLBOX_CONFIG.snapshotDebounceMs);
  }, [code, toolType]);

  const setState = useCallback((updater: TState | ((prev: TState) => TState)) => {
    const next = typeof updater === 'function'
      ? (updater as (p: TState) => TState)(stateRef.current)
      : updater;
    stateRef.current = next;
    setLocalState(next);
    channelRef.current?.send({ type: 'broadcast', event: 'state', payload: { state: next } });
    scheduleSnapshot(next);
  }, [scheduleSnapshot]);

  const dispatch = useCallback((op: any) => {
    const reducer = reducerRef.current;
    if (!reducer) return;
    const next = reducer(stateRef.current, op);
    stateRef.current = next;
    setLocalState(next);
    const now = Date.now();
    recentOpsRef.current = [...recentOpsRef.current.filter((r) => now - r.at < RECENT_OPS_MS), { op, at: now }];
    // Pas encore connecté : l'état de la base, à son arrivée, effacerait ce
    // geste. On le garde pour le rejouer et le diffuser une fois chargé.
    if (!readyRef.current) {
      pendingOpsRef.current.push(op);
      return;
    }
    channelRef.current?.send({ type: 'broadcast', event: 'op', payload: { op } });
    scheduleSnapshot(next);
  }, [scheduleSnapshot]);

  const sendSignal = useCallback((payload: any) => {
    channelRef.current?.send({ type: 'broadcast', event: 'signal', payload });
  }, []);

  useEffect(() => {
    if (!toolType || !code || !identity) return;

    // Mode dégradé (Supabase non configuré) : fonctionnement local mono-utilisateur.
    if (!isSupabaseConfigured()) {
      readyRef.current = true;
      setHostId(identity.id);
      hostIdRef.current = identity.id;
      setParticipants([{ ...identity, isHost: true }]);
      setIsConnected(true);
      setIsLoading(false);
      return;
    }

    let cancelled = false;
    readyRef.current = false;
    const channel = supabase.channel(`tool:${toolType}:${code}`, {
      config: { presence: { key: identity.id }, broadcast: { self: false } },
    });
    channelRef.current = channel;

    channel.on('broadcast', { event: 'state' }, ({ payload }: { payload: { state?: TState; for?: string[] } }) => {
      if (payload?.state === undefined) return;
      // En mode « opérations », l'état complet n'est envoyé qu'aux arrivants :
      // les autres l'ont déjà, et l'appliquer pourrait effacer une opération
      // encore en vol.
      const reducer = reducerRef.current;
      if (reducer && !payload.for?.includes(identityRef.current?.id ?? '')) return;
      let next = payload.state as TState;
      // L'état reçu peut précéder nos tout derniers gestes : on les rejoue
      // (les opérations sont idempotentes, les rejouer deux fois est sans effet).
      if (reducer) {
        const now = Date.now();
        recentOpsRef.current
          .filter((r) => now - r.at < RECENT_OPS_MS)
          .forEach((r) => { next = reducer(next, r.op); });
      }
      stateRef.current = next;
      setLocalState(next);
    });
    channel.on('broadcast', { event: 'op' }, ({ payload }: { payload: { op?: any } }) => {
      const reducer = reducerRef.current;
      if (!reducer || payload?.op === undefined) return;
      const next = reducer(stateRef.current, payload.op);
      stateRef.current = next;
      setLocalState(next);
      // Chacun enregistre aussi : si l'auteur ferme sa page aussitôt, son
      // instantané différé serait perdu.
      scheduleSnapshot(next);
    });
    channel.on('broadcast', { event: 'signal' }, ({ payload }: { payload: any }) => onSignalRef.current?.(payload));
    channel.on('presence', { event: 'sync' }, () => refreshParticipants(channel));
    channel.on('presence', { event: 'join' }, ({ key }: { key: string }) => {
      if (hostIdRef.current && identityRef.current?.id === hostIdRef.current && key !== identityRef.current?.id) {
        channel.send({ type: 'broadcast', event: 'state', payload: { state: stateRef.current, for: [key] } });
      }
      refreshParticipants(channel);
    });

    channel.subscribe(async (status: string) => {
      if (status !== 'SUBSCRIBED' || cancelled) return;
      const row = await ToolSessionService.getOrCreate({ toolType, code, hostId: identity.id, initialState })
        ?? await ToolSessionService.get(code);
      if (cancelled) return;
      if (row) {
        setHostId(row.host_id);
        hostIdRef.current = row.host_id;
        let next = row.state as TState;
        const reducer = reducerRef.current;
        const pending = pendingOpsRef.current;
        pendingOpsRef.current = [];
        if (reducer) pending.forEach((op) => { next = reducer(next, op); });
        stateRef.current = next;
        setLocalState(next);
        pending.forEach((op) => channel.send({ type: 'broadcast', event: 'op', payload: { op } }));
        if (pending.length) scheduleSnapshot(next);
      }
      readyRef.current = true;
      await channel.track({ ...identity, isHost: row?.host_id === identity.id });
      setIsConnected(true);
      setIsLoading(false);
    });

    return () => {
      cancelled = true;
      // On quitte la page : enregistrer tout de suite l'instantané en attente.
      if (snapshotTimer.current) {
        clearTimeout(snapshotTimer.current);
        snapshotTimer.current = null;
        void ToolSessionService.saveSnapshot(code, stateRef.current as any, toolType);
      }
      supabase.removeChannel(channel);
      channelRef.current = null;
      setIsConnected(false);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [toolType, code, identity?.id]);

  return useMemo(
    () => ({ state, setState, participants, hostId, isHost, isConnected, isLoading, sendSignal, dispatch }),
    [state, setState, participants, hostId, isHost, isConnected, isLoading, sendSignal, dispatch],
  );
}
