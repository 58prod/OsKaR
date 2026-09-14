import { useCallback, useEffect, useMemo, useState } from 'react';
import { useToolSession, type ToolIdentity } from '@/hooks/useToolSession';
import { useFacilitator } from '@/hooks/useFacilitator';
import { useToast } from '@/hooks/useToast';
import { downloadTextFile } from '@/components/toolbox/shared/boardNotes';
import {
  chronoRemaining, resetChronoState, toggleChronoState, withDuration,
} from '@/components/toolbox/shared/toolChrono';
import {
  INITIAL_SKILLS_STATE, MAX_SKILLS, SKILL_NAME_MAX,
  buildDefaultSkills, buildSkillsSummary, normalizeSkillsState, skillId, skillsReducer,
  type SkillsOp, type SkillsState,
} from './skillsLogic';

/**
 * Orchestration métier de « Compétences de l'équipe » au-dessus du socle
 * temps réel, en mode « opérations » (voir `skillsReducer`) : chaque note
 * est diffusée seule, si bien que toute l'équipe peut se noter en même temps.
 */
export function useSkillsSession(code: string | null, identity: ToolIdentity | null) {
  const toast = useToast();
  const [now, setNow] = useState(() => Date.now());

  const session = useToolSession<SkillsState>({
    toolType: 'competences',
    code,
    identity,
    initialState: INITIAL_SKILLS_STATE,
    reducer: skillsReducer,
  });
  const { isHost, isConnected } = session;
  const send = session.dispatch as (op: SkillsOp) => void;
  // Les sessions ouvertes avant la synchro par opérations n'ont ni séance ni minuteur.
  const state = useMemo(() => normalizeSkillsState(session.state), [session.state]);
  const { isFacilitator, toggleFacilitator } = useFacilitator(isHost);
  const myId = identity?.id ?? '';
  const who = useMemo(
    () => (identity ? { id: identity.id, name: identity.name, color: identity.color } : null),
    [identity],
  );

  // Ma fiche existe dès la connexion, et revient après une réinitialisation.
  const hasMyCard = !!state.people[myId];
  useEffect(() => {
    if (!isConnected || !who || hasMyCard) return;
    send({ t: 'join', round: state.round, person: who });
  }, [isConnected, who, hasMyCard, state.round, send]);

  useEffect(() => {
    if (!state.chrono.running) return;
    setNow(Date.now());
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [state.chrono.running]);
  const remainingSec = chronoRemaining(state.chrono, now);

  const me = useMemo(() => state.people[myId] ?? null, [state.people, myId]);

  /** Note (1–10) sur une compétence — chacun ne note que sa propre fiche. */
  const setScore = useCallback((id: string, value: number) => {
    if (who) send({ t: 'score', round: state.round, person: who, skillId: id, value });
  }, [send, who, state.round]);

  const addSkill = useCallback((name: string) => {
    const trimmed = name.trim().slice(0, SKILL_NAME_MAX);
    if (!trimmed) return;
    if (state.skills.length >= MAX_SKILLS) return;
    if (state.skills.some((s) => s.name.toLowerCase() === trimmed.toLowerCase())) {
      toast.warning('Cette compétence est déjà dans la liste.');
      return;
    }
    send({ t: 'skillAdd', skill: { id: skillId(), name: trimmed } });
  }, [send, state.skills, toast]);

  const renameSkill = useCallback((id: string, name: string) => send({ t: 'skillRename', id, name }), [send]);
  const deleteSkill = useCallback((id: string) => send({ t: 'skillDelete', id }), [send]);

  const toggleChrono = useCallback(() => {
    setNow(Date.now());
    send({ t: 'chrono', chrono: toggleChronoState(state.chrono) });
  }, [send, state.chrono]);
  const resetChrono = useCallback(() => send({ t: 'chrono', chrono: resetChronoState(state.chrono) }), [send, state.chrono]);
  const setDuration = useCallback((seconds: number) => send({ t: 'chrono', chrono: withDuration(seconds) }), [send]);

  const exportSummary = useCallback(() => {
    downloadTextFile('competences-equipe.txt', buildSkillsSummary(state));
  }, [state]);

  /** Réinitialise notes et liste (animateur) — chaque fiche est recréée à vide. */
  const reset = useCallback(() => {
    send({ t: 'reset', round: state.round + 1, skills: buildDefaultSkills(), chrono: resetChronoState(state.chrono) });
    toast.success('Séance réinitialisée');
  }, [send, state.round, state.chrono, toast]);

  return {
    state,
    participants: session.participants,
    isFacilitator,
    toggleFacilitator,
    isLoading: session.isLoading,
    remainingSec,
    myId,
    me,
    actions: {
      setScore, addSkill, renameSkill, deleteSkill, exportSummary, reset, toggleChrono, resetChrono, setDuration,
    },
  };
}

export default useSkillsSession;
