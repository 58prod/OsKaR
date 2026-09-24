import { useCallback, useEffect, useMemo, useState } from 'react';
import { useToolSession, type ToolIdentity } from '@/hooks/useToolSession';
import { useFacilitator } from '@/hooks/useFacilitator';
import { useToast } from '@/hooks/useToast';
import { downloadTextFile, noteId } from '@/components/toolbox/shared/boardNotes';
import { copyText } from '@/components/toolbox/shared/copyText';
import {
  chronoRemaining, resetChronoState, toggleChronoState, withDuration,
} from '@/components/toolbox/shared/toolChrono';
import {
  EISENHOWER_TEXT_MAX, INITIAL_EISENHOWER_STATE, apres, buildEisenhowerSummary, eisenhowerReducer,
  freePositionInQuadrant, groupesTickets, normalizeEisenhowerState,
  type EisenhowerOp, type EisenhowerState, type GroupeTickets, type QuadrantKey,
} from './eisenhowerLogic';

/**
 * Orchestration métier de la Matrice d'Eisenhower au-dessus du socle temps
 * réel, en mode « opérations » (voir `eisenhowerReducer`) : chaque ticket,
 * placement, déplacement ou regroupement est diffusé seul.
 */
export function useEisenhowerSession(code: string | null, identity: ToolIdentity | null) {
  const toast = useToast();
  const [now, setNow] = useState(() => Date.now());

  const session = useToolSession<EisenhowerState>({
    toolType: 'matrice-eisenhower',
    code,
    identity,
    initialState: INITIAL_EISENHOWER_STATE,
    reducer: eisenhowerReducer,
  });
  const { isHost } = session;
  const send = session.dispatch as (op: EisenhowerOp) => void;
  const state = useMemo(() => normalizeEisenhowerState(session.state), [session.state]);
  const { isFacilitator, toggleFacilitator } = useFacilitator(isHost);
  const myId = identity?.id ?? '';

  useEffect(() => {
    if (!state.chrono.running) return;
    setNow(Date.now());
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [state.chrono.running]);

  const remainingSec = chronoRemaining(state.chrono, now);
  const myTickets = useMemo(() => state.tickets.filter((t) => t.authorId === myId), [state.tickets, myId]);
  const groupes = useMemo(() => groupesTickets(state), [state]);
  const groupeDe = useCallback(
    (id: string): GroupeTickets | undefined => groupes.find((g) => g.tete.id === id || g.membres.some((m) => m.id === id)),
    [groupes],
  );

  /** Prépare un ticket brouillon (visible seulement par son auteur). */
  const addDraft = useCallback((quadrant: QuadrantKey, text: string) => {
    if (!identity || !text.trim()) return;
    send({
      t: 'add',
      round: state.round,
      ticket: {
        id: noteId(),
        authorId: identity.id,
        authorName: identity.name,
        authorColor: identity.color,
        quadrant,
        text: text.trim().slice(0, EISENHOWER_TEXT_MAX),
        revealed: false,
      },
    });
  }, [identity, send, state.round]);

  /** Place ses brouillons sur la matrice, chacun là où il reste de la place dans son quadrant. */
  const publish = useCallback((ids: string[]) => {
    const drafts = state.tickets.filter((t) => ids.includes(t.id) && t.authorId === myId && !t.revealed);
    if (!drafts.length) return;
    const taken = groupes.map((g) => g.placement);
    const at = Date.now();
    const items = drafts.map((ticket) => {
      const pos = freePositionInQuadrant(ticket.quadrant, taken, at);
      taken.push(pos);
      return { id: ticket.id, pos, ticket };
    });
    send({ t: 'publish', authorId: myId, round: state.round, items });
  }, [send, myId, state.tickets, state.round, groupes]);

  /** Déplace un ticket et tout son groupe (le plus récent l'emporte). */
  const move = useCallback((id: string, q: QuadrantKey, pos: { x: number; y: number }) => {
    const g = groupeDe(id);
    const ids = [g?.tete.id ?? id, ...(g?.membres ?? []).map((m) => m.id)];
    const at = apres(Math.max(0, ...ids.map((tid) => state.placements[tid]?.at ?? 0)));
    ids.forEach((tid) => send({ t: 'move', id: tid, x: pos.x, y: pos.y, q, at }));
  }, [groupeDe, send, state.placements]);

  /** Change de quadrant sans glisser : le ticket rejoint une place libre du quadrant choisi. */
  const moveToQuadrant = useCallback((id: string, q: QuadrantKey) => {
    const g = groupeDe(id);
    if (!g || g.placement.q === q) return;
    const pos = freePositionInQuadrant(q, groupes.filter((x) => x !== g).map((x) => x.placement));
    move(id, q, pos);
  }, [groupeDe, groupes, move]);

  /** Regroupe le ticket `id` (et ses tickets regroupés) sous le groupe du ticket `into`. */
  const merge = useCallback((id: string, into: string) => {
    const source = groupeDe(id);
    const cible = groupeDe(into);
    if (!source || !cible || source === cible) return;
    const at = apres(Math.max(0, ...[source.tete, ...source.membres].map((t) => state.groupes[t.id]?.at ?? 0)));
    [source.tete, ...source.membres].forEach((t) => {
      send({ t: 'group', id: t.id, into: cible.tete.id, at });
      // Les tickets regroupés suivent la place du groupe.
      send({ t: 'move', id: t.id, ...cible.placement, at: apres(Math.max(cible.placement.at, state.placements[t.id]?.at ?? 0)) });
    });
    // Le suivi déjà décidé n'est pas perdu : il passe au groupe s'il n'en a pas.
    const cibleId = cible.tete.id;
    const porteur = state.porteurs[source.tete.id]?.text;
    const echeance = state.echeances[source.tete.id]?.text;
    if (porteur && !state.porteurs[cibleId]?.text) send({ t: 'porteur', id: cibleId, text: porteur, at: apres(state.porteurs[cibleId]?.at ?? 0) });
    if (echeance && !state.echeances[cibleId]?.text) send({ t: 'echeance', id: cibleId, text: echeance, at: apres(state.echeances[cibleId]?.at ?? 0) });
  }, [groupeDe, send, state.groupes, state.placements, state.porteurs, state.echeances]);

  /** Sort un ticket de son groupe et le pose à une place libre du même quadrant. */
  const detach = useCallback((id: string) => {
    const g = groupeDe(id);
    if (!g || g.tete.id === id) return;
    send({ t: 'group', id, into: null, at: apres(state.groupes[id]?.at ?? 0) });
    const pos = freePositionInQuadrant(g.placement.q, groupes.map((x) => x.placement));
    send({ t: 'move', id, x: pos.x, y: pos.y, q: pos.q, at: apres(Math.max(g.placement.at, state.placements[id]?.at ?? 0)) });
  }, [groupeDe, groupes, send, state.groupes, state.placements]);

  /**
   * Supprime un ticket : l'auteur les siens, l'animateur n'importe lequel.
   * En tête d'un groupe, le ticket suivant prend sa place avec le suivi.
   */
  const deleteTicket = useCallback((id: string) => {
    const g = groupeDe(id);
    if (g && g.tete.id === id && g.membres.length) {
      const [suivant, ...autres] = g.membres;
      send({ t: 'group', id: suivant.id, into: null, at: apres(state.groupes[suivant.id]?.at ?? 0) });
      autres.forEach((m) => send({ t: 'group', id: m.id, into: suivant.id, at: apres(state.groupes[m.id]?.at ?? 0) }));
      const porteur = state.porteurs[id]?.text;
      const echeance = state.echeances[id]?.text;
      if (porteur && !state.porteurs[suivant.id]?.text) send({ t: 'porteur', id: suivant.id, text: porteur, at: apres(state.porteurs[suivant.id]?.at ?? 0) });
      if (echeance && !state.echeances[suivant.id]?.text) send({ t: 'echeance', id: suivant.id, text: echeance, at: apres(state.echeances[suivant.id]?.at ?? 0) });
    }
    send({ t: 'delete', id, by: myId, moderator: isFacilitator });
  }, [groupeDe, send, state.groupes, state.porteurs, state.echeances, myId, isFacilitator]);

  const editText = useCallback((id: string, text: string) => {
    if (!text.trim()) return;
    send({ t: 'edit', id, text, at: apres(state.textes[id]?.at ?? 0), by: myId, moderator: isFacilitator });
  }, [send, state.textes, myId, isFacilitator]);

  const setPorteur = useCallback((id: string, text: string) => {
    send({ t: 'porteur', id, text, at: apres(state.porteurs[id]?.at ?? 0) });
  }, [send, state.porteurs]);

  const setEcheance = useCallback((id: string, text: string) => {
    send({ t: 'echeance', id, text, at: apres(state.echeances[id]?.at ?? 0) });
  }, [send, state.echeances]);

  const setTheme = useCallback((text: string) => {
    send({ t: 'theme', text, at: apres(state.theme.at) });
  }, [send, state.theme.at]);

  const setAnonymous = useCallback((value: boolean) => send({ t: 'anonymous', value }), [send]);

  const exportSummary = useCallback(() => {
    downloadTextFile('matrice-eisenhower.txt', buildEisenhowerSummary(state));
  }, [state]);

  const copySummary = useCallback(async () => {
    if (await copyText(buildEisenhowerSummary(state))) toast.success('Plan d’action copié');
    else toast.error('La copie a échoué : utilisez « Exporter ».');
  }, [state, toast]);

  const reset = useCallback(() => {
    send({ t: 'reset', round: state.round + 1, chrono: resetChronoState(state.chrono) });
    toast.success('Matrice réinitialisée');
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
    remainingSec,
    myId,
    myTickets,
    groupes,
    actions: {
      addDraft, publish, move, moveToQuadrant, merge, detach, deleteTicket, editText, setPorteur, setEcheance,
      setTheme, setAnonymous, exportSummary, copySummary, reset, toggleChrono, resetChrono, setDuration,
    },
  };
}

export default useEisenhowerSession;
