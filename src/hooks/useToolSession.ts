import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { RealtimeChannel } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from '@/lib/supabaseClient';
import { TOOLBOX_CONFIG, type ToolType } from '@/constants/toolbox';
import { ToolSessionService } from '@/services/toolSession';

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
}

/**
 * Socle de synchronisation temps réel réutilisable par tous les outils.
 * - Broadcast : diffusion de l'état partagé (last-write-wins).
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
  const snapshotTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  identityRef.current = identity;
  onSignalRef.current = opts.onSignal;

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

  const sendSignal = useCallback((payload: any) => {
    channelRef.current?.send({ type: 'broadcast', event: 'signal', payload });
  }, []);

  useEffect(() => {
    if (!toolType || !code || !identity) return;

    // Mode dégradé (Supabase non configuré) : fonctionnement local mono-utilisateur.
    if (!isSupabaseConfigured()) {
      setHostId(identity.id);
      hostIdRef.current = identity.id;
      setParticipants([{ ...identity, isHost: true }]);
      setIsConnected(true);
      setIsLoading(false);
      return;
    }

    let cancelled = false;
    const channel = supabase.channel(`tool:${toolType}:${code}`, {
      config: { presence: { key: identity.id }, broadcast: { self: false } },
    });
    channelRef.current = channel;

    channel.on('broadcast', { event: 'state' }, ({ payload }: { payload: { state?: TState } }) => {
      if (payload?.state === undefined) return;
      stateRef.current = payload.state as TState;
      setLocalState(payload.state as TState);
    });
    channel.on('broadcast', { event: 'signal' }, ({ payload }: { payload: any }) => onSignalRef.current?.(payload));
    channel.on('presence', { event: 'sync' }, () => refreshParticipants(channel));
    channel.on('presence', { event: 'join' }, () => {
      if (hostIdRef.current && identityRef.current?.id === hostIdRef.current) {
        channel.send({ type: 'broadcast', event: 'state', payload: { state: stateRef.current } });
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
        stateRef.current = row.state as TState;
        setLocalState(row.state as TState);
      }
      await channel.track({ ...identity, isHost: row?.host_id === identity.id });
      setIsConnected(true);
      setIsLoading(false);
    });

    return () => {
      cancelled = true;
      if (snapshotTimer.current) clearTimeout(snapshotTimer.current);
      supabase.removeChannel(channel);
      channelRef.current = null;
      setIsConnected(false);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [toolType, code, identity?.id]);

  return useMemo(
    () => ({ state, setState, participants, hostId, isHost, isConnected, isLoading, sendSignal }),
    [state, setState, participants, hostId, isHost, isConnected, isLoading, sendSignal],
  );
}
