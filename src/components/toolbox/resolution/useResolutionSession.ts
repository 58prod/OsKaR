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
  COMMENTAIRE_MAX, INITIAL_RESOLUTION_STATE, MAX_RETENUS, PHASES, PROBLEME_MAX, SOLUTION_MAX,
  aDonneCoeur, apres, buildResolutionSummary, monVote, normalizeResolutionState, phaseIndex, phaseInfo, planDe, problemesRetenus,
  racine, resolutionReducer, votesUsedBy,
  type CommentKind, type GroupeProblemes, type PlanField, type ResolutionOp, type ResolutionPhase,
  type ResolutionState, type SolutionKind,
} from './resolutionLogic';

/**
 * Orchestration métier de la Résolution collective au-dessus du socle temps
 * réel, en mode « opérations » (voir `resolutionReducer`), comme les autres
 * outils : chaque contribution, vote ou texte partagé est diffusé seul, sans
 * rien écraser.
 */
export function useResolutionSession(code: string | null, identity: ToolIdentity | null) {
  const toast = useToast();
  const [now, setNow] = useState(() => Date.now());

  const session = useToolSession<ResolutionState>({
    toolType: 'resolution-collective',
    code,
    identity,
    initialState: INITIAL_RESOLUTION_STATE,
    reducer: resolutionReducer,
  });
  const send = session.dispatch as (op: ResolutionOp) => void;
  const state = useMemo(() => normalizeResolutionState(session.state), [session.state]);
  const { isFacilitator, toggleFacilitator } = useFacilitator(session.isHost);
  const myId = identity?.id ?? '';

  // Tick d'affichage du chrono lorsqu'il tourne (cf. usePokerSession).
  useEffect(() => {
    if (!state.chrono.running) return;
    setNow(Date.now());
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [state.chrono.running]);

  const remainingSec = chronoRemaining(state.chrono, now);
  const retenus = useMemo(() => problemesRetenus(state), [state]);
  const votesLeft = state.voteLimit > 0 ? Math.max(0, state.voteLimit - votesUsedBy(state, myId)) : null;

  const moi = useMemo(
    () => (identity ? { authorId: identity.id, authorName: identity.name, authorColor: identity.color } : null),
    [identity],
  );

  /* ── Déroulé ── */

  const setTheme = useCallback((text: string) => {
    send({ t: 'theme', text, at: apres(state.theme.at) });
  }, [send, state.theme.at]);

  /** Change d'étape et prépare le minuteur à la durée proposée pour cette étape. */
  const goToPhase = useCallback((phase: ResolutionPhase) => {
    if (phase === state.phase) return;
    if (phaseIndex(phase) >= phaseIndex('solutions') && retenus.length === 0) {
      toast.warning('Retenez au moins un problème avant de passer à la suite.');
      return;
    }
    send({ t: 'phase', phase, at: apres(state.phaseAt), chrono: withDuration(phaseInfo(phase).dureeSec) });
  }, [send, state.phase, state.phaseAt, retenus.length, toast]);

  /* ── Contributions ── */

  const addProblem = useCallback((text: string) => {
    if (!moi || !text.trim()) return;
    send({ t: 'addProblem', round: state.round, problem: { id: noteId(), ...moi, text: text.slice(0, PROBLEME_MAX) } });
  }, [moi, send, state.round]);

  const addSolution = useCallback((problemId: string, kind: SolutionKind, text: string) => {
    if (!moi || !text.trim()) return;
    send({ t: 'addSolution', round: state.round, solution: { id: noteId(), ...moi, problemId, kind, text: text.slice(0, SOLUTION_MAX) } });
  }, [moi, send, state.round]);

  const addComment = useCallback((solutionId: string, kind: CommentKind, text: string) => {
    if (!moi || !text.trim()) return;
    send({ t: 'comment', round: state.round, comment: { id: noteId(), ...moi, solutionId, kind, text: text.slice(0, COMMENTAIRE_MAX) } });
  }, [moi, send, state.round]);

  /** Supprime une contribution : la sienne, ou n'importe laquelle pour l'animateur. */
  const deleteItem = useCallback((id: string) => {
    send({ t: 'delete', id, by: myId, moderator: isFacilitator });
  }, [send, myId, isFacilitator]);

  /* ── Choix des problèmes ── */

  /**
   * Cœur sur un groupe de problèmes : un second clic retire le cœur, y compris
   * celui donné à un problème avant qu'il ne soit regroupé.
   */
  const likeGroupe = useCallback((g: GroupeProblemes) => {
    const quand = (id: string) => apres(state.coeurs[id]?.[myId]?.at ?? 0);
    const donnes = [g.racine, ...g.membres].filter((p) => aDonneCoeur(state, p.id, myId));
    if (donnes.length) {
      donnes.forEach((p) => send({ t: 'like', id: p.id, voterId: myId, liked: false, at: quand(p.id) }));
      return;
    }
    if (g.racine.authorId === myId) return;
    if (votesLeft === 0) {
      toast.warning(`Vous avez donné vos ${state.voteLimit} cœurs : retirez-en un pour voter ailleurs.`);
      return;
    }
    send({ t: 'like', id: g.racine.id, voterId: myId, liked: true, at: quand(g.racine.id) });
  }, [myId, send, votesLeft, state, toast]);

  const retain = useCallback((id: string, on: boolean) => {
    if (on && retenus.length >= MAX_RETENUS) {
      toast.warning(`${MAX_RETENUS} problèmes au plus : retirez-en un pour en retenir un autre.`);
      return;
    }
    send({ t: 'retain', id, on, at: apres(state.retenus[id]?.at ?? 0) });
  }, [retenus.length, send, state.retenus, toast]);

  const setQuestion = useCallback((id: string, text: string) => {
    send({ t: 'question', id, text, at: apres(state.questions[id]?.at ?? 0) });
  }, [send, state.questions]);

  /** Regroupe `id` dans `into` (null = le détacher). */
  const merge = useCallback((id: string, into: string | null) => {
    const cible = into ? racine(state, into) : null;
    if (cible === id) return;
    send({ t: 'merge', id, into: cible, at: apres(state.regroupements[id]?.at ?? 0) });
  }, [send, state]);

  /* ── Échange ── */

  const setRapporteur = useCallback((problemId: string, who: ToolIdentity | null) => {
    send({
      t: 'rapporteur', problemId, id: who?.id ?? null, name: who?.name, color: who?.color,
      at: apres(state.rapporteurs[problemId]?.at ?? 0),
    });
  }, [send, state.rapporteurs]);

  const setSynthese = useCallback((problemId: string, text: string) => {
    send({ t: 'synthese', problemId, text, at: apres(state.syntheses[problemId]?.at ?? 0) });
  }, [send, state.syntheses]);

  /* ── Vote ── */

  /** Une voix par problème ; recliquer sur son choix le retire. */
  const vote = useCallback((problemId: string, c: string) => {
    const actuel = monVote(state, problemId, myId);
    send({
      t: 'vote', problemId, voterId: myId, c: actuel === c ? null : c,
      at: apres(state.votes[problemId]?.[myId]?.at ?? 0),
    });
  }, [send, state, myId]);

  const revealVotes = useCallback((on: boolean) => {
    send({ t: 'revealVotes', on, at: apres(state.votesRevealed.at) });
  }, [send, state.votesRevealed.at]);

  const validate = useCallback((problemId: string, c: string | null) => {
    send({ t: 'validate', problemId, c, at: apres(state.validated[problemId]?.at ?? 0) });
  }, [send, state.validated]);

  /* ── Premier pas ── */

  const setPlan = useCallback((problemId: string, field: PlanField, text: string) => {
    send({ t: 'plan', problemId, field, text, at: apres(planDe(state, problemId)[field].at) });
  }, [send, state]);

  /* ── Réglages, minuteur, synthèse ── */

  const setAnonymous = useCallback((value: boolean) => send({ t: 'anonymous', value }), [send]);
  const setVoteLimit = useCallback((value: number) => send({ t: 'voteLimit', value }), [send]);

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

  const exportSummary = useCallback(() => {
    downloadTextFile('resolution-collective.txt', buildResolutionSummary(state));
  }, [state]);

  const copySummary = useCallback(async () => {
    if (await copyText(buildResolutionSummary(state))) toast.success('Synthèse copiée : collez-la dans votre compte rendu.');
    else toast.warning('Copie impossible ici : utilisez « Exporter ».');
  }, [state, toast]);

  const reset = useCallback(() => {
    send({ t: 'reset', round: state.round + 1, at: apres(state.phaseAt), chrono: withDuration(PHASES[0].dureeSec) });
    toast.success('Nouvel atelier prêt');
  }, [send, state.round, state.phaseAt, toast]);

  return {
    state,
    participants: session.participants,
    isFacilitator,
    toggleFacilitator,
    remainingSec,
    myId,
    retenus,
    votesLeft,
    actions: {
      setTheme, goToPhase, addProblem, addSolution, addComment, deleteItem, likeGroupe, retain, setQuestion, merge,
      setRapporteur, setSynthese, vote, revealVotes, validate, setPlan, setAnonymous, setVoteLimit,
      toggleChrono, resetChrono, setDuration, exportSummary, copySummary, reset,
    },
  };
}

export type ResolutionActions = ReturnType<typeof useResolutionSession>['actions'];

export default useResolutionSession;
