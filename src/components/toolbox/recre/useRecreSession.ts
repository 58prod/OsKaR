import { useCallback, useEffect, useMemo, useState } from 'react';
import { useToolSession, type ToolIdentity } from '@/hooks/useToolSession';
import { useFacilitator } from '@/hooks/useFacilitator';
import { deleteRecrePhoto, uploadRecrePhoto } from '@/services/recreStorage';
import {
  chronoRemaining, INITIAL_RECRE_STATE, normalizeRecreState, recreReducer, shuffle,
  type RecreOp, type RecrePhoto,
} from './recreLogic';

/**
 * Orchestration métier de « En mode récré ! » au-dessus du socle temps réel,
 * en mode « opérations » (voir `recreReducer`) : les photos envoyées au même
 * moment par plusieurs personnes arrivent toutes sur le board.
 */
export function useRecreSession(code: string | null, identity: ToolIdentity | null) {
  const session = useToolSession({
    toolType: 'en-mode-recre',
    code,
    identity,
    initialState: INITIAL_RECRE_STATE,
    reducer: recreReducer,
  });
  const { isHost } = session;
  const send = session.dispatch as (op: RecreOp) => void;
  const state = useMemo(() => normalizeRecreState(session.state), [session.state]);
  const { isFacilitator, toggleFacilitator } = useFacilitator(isHost);
  const myId = identity?.id ?? '';

  const [now, setNow] = useState(() => Date.now());

  // Tick d'affichage du chrono lorsqu'il tourne (cf. usePokerSession).
  useEffect(() => {
    if (!state.chrono.running) return;
    setNow(Date.now());
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [state.chrono.running]);

  const remainingSec = chronoRemaining(state.chrono, now);

  const setTheme = useCallback((theme: string) => send({ t: 'theme', theme }), [send]);

  /**
   * Téléverse puis publie une à une les photos sélectionnées. Renvoie les
   * noms des fichiers qui n'ont pas pu être lus (ex : format HEIC sur un
   * ordinateur), pour que l'interface le signale.
   */
  const addPhotos = useCallback(async (files: File[]): Promise<string[]> => {
    if (!code || !identity || files.length === 0) return [];
    const failed: string[] = [];
    for (const file of files) {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      try {
        const url = await uploadRecrePhoto(code, id, file);
        const photo: RecrePhoto = {
          id,
          authorId: identity.id,
          authorName: identity.name,
          authorColor: identity.color,
          url,
          likedBy: [],
        };
        send({ t: 'addPhoto', photo });
      } catch {
        failed.push(file.name);
      }
    }
    return failed;
  }, [code, identity, send]);

  /** Supprime une de ses propres photos (déjà confirmé côté UI). */
  const removePhoto = useCallback((photoId: string) => {
    send({ t: 'removePhoto', id: photoId });
    if (code) {
      deleteRecrePhoto(code, photoId).catch(() => {
        /* best-effort : le fichier Storage sera purgé avec la session expirée */
      });
    }
  }, [code, send]);

  const toggleLike = useCallback((photoId: string) => {
    const photo = state.photos.find((p) => p.id === photoId);
    if (!photo) return;
    send({ t: 'like', id: photoId, voterId: myId, liked: !photo.likedBy.includes(myId) });
  }, [state.photos, myId, send]);

  const toggleChrono = useCallback(() => {
    setNow(Date.now());
    const c = state.chrono;
    if (c.running) {
      send({ t: 'chrono', chrono: { ...c, running: false, endsAt: null, remainingSec: chronoRemaining(c) } });
      return;
    }
    const rem = c.remainingSec > 0 ? c.remainingSec : c.durationSec;
    send({ t: 'chrono', chrono: { ...c, running: true, endsAt: Date.now() + rem * 1000, remainingSec: rem } });
  }, [state.chrono, send]);

  const resetChrono = useCallback(() => {
    send({ t: 'chrono', chrono: { ...state.chrono, running: false, endsAt: null, remainingSec: state.chrono.durationSec } });
  }, [state.chrono, send]);

  const setDuration = useCallback((seconds: number) => {
    const sec = Math.max(60, Math.min(60 * 60, Math.round(seconds)));
    send({ t: 'chrono', chrono: { running: false, endsAt: null, remainingSec: sec, durationSec: sec } });
  }, [send]);

  /**
   * Lance le mode révélation, photos dans un ordre mélangé. Après une
   * interruption, on reprend avec les photos dont l'auteur n'est pas encore
   * connu ; une fois toutes dévoilées, on repart sur l'ensemble.
   */
  const startReveal = useCallback(() => {
    const pending = state.photos.filter((p) => !state.authorsShown.includes(p.id));
    const pool = pending.length ? pending : state.photos;
    send({ t: 'startReveal', queue: shuffle(pool.map((p) => p.id)) });
  }, [state.photos, state.authorsShown, send]);

  const showAuthor = useCallback(() => send({ t: 'showAuthor' }), [send]);
  const nextPhoto = useCallback(() => {
    if (state.reveal) send({ t: 'nextPhoto', from: state.reveal.index });
  }, [state.reveal, send]);
  const closeReveal = useCallback(() => send({ t: 'closeReveal' }), [send]);

  const reset = useCallback(() => send({ t: 'reset' }), [send]);

  return {
    state,
    participants: session.participants,
    isFacilitator,
    toggleFacilitator,
    isLoading: session.isLoading,
    remainingSec,
    myId,
    actions: {
      setTheme, addPhotos, removePhoto, toggleLike, toggleChrono, resetChrono, setDuration,
      startReveal, showAuthor, nextPhoto, closeReveal, reset,
    },
  };
}

export default useRecreSession;
