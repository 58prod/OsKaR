import React, { useMemo } from 'react';
import { useToolPage } from '@/hooks/useToolPage';
import { useExemples } from '@/hooks/useExemples';
import { ToolPageShell } from '@/components/toolbox/ToolPageShell';
import { ResolutionToolbar } from '@/components/toolbox/resolution/ResolutionToolbar';
import { ResolutionSteps } from '@/components/toolbox/resolution/ResolutionSteps';
import { ResolutionMyPanel } from '@/components/toolbox/resolution/ResolutionMyPanel';
import { ProblemesCaches, ProblemesChoix } from '@/components/toolbox/resolution/ResolutionProblemes';
import {
  EchangeColonnes, PlanColonnes, SolutionsCachees, VoteColonnes,
} from '@/components/toolbox/resolution/ResolutionColonnes';
import { groupesProblemes } from '@/components/toolbox/resolution/resolutionLogic';
import { useResolutionSession } from '@/components/toolbox/resolution/useResolutionSession';

const ResolutionCollectivePage: React.FC = () => {
  const { code, isCreating, identity, handleJoin, handleShare } = useToolPage('resolution-collective');
  const exemples = useExemples().resolution;

  const {
    state, participants, isFacilitator, toggleFacilitator, remainingSec, myId, retenus, votesLeft, actions,
  } = useResolutionSession(code, identity);

  const me = participants.find((p) => p.id === myId);
  const groupes = useMemo(() => groupesProblemes(state), [state]);
  const commun = { state, retenus, myId, isFacilitator, actions };

  let etape: React.ReactNode;
  switch (state.phase) {
    case 'problemes':
      etape = <ProblemesCaches state={state} myId={myId} />;
      break;
    case 'choix':
      etape = <ProblemesChoix {...commun} groupes={groupes} votesLeft={votesLeft} />;
      break;
    case 'solutions':
      etape = <SolutionsCachees {...commun} />;
      break;
    case 'echange':
      etape = <EchangeColonnes {...commun} identity={identity} />;
      break;
    case 'vote':
      etape = <VoteColonnes {...commun} participantsCount={participants.length} />;
      break;
    default:
      etape = <PlanColonnes {...commun} exemples={exemples} />;
  }

  return (
    <ToolPageShell
      title="Résolution collective"
      code={code}
      isCreating={isCreating}
      identity={identity}
      isFacilitator={isFacilitator}
      onToggleFacilitator={toggleFacilitator}
      onJoin={handleJoin}
      onShare={handleShare}
    >
      <ResolutionToolbar
        state={state}
        remainingSec={remainingSec}
        retainedCount={retenus.length}
        isFacilitator={isFacilitator}
        onAnonymousChange={actions.setAnonymous}
        onVoteLimitChange={actions.setVoteLimit}
        onToggleChrono={actions.toggleChrono}
        onResetChrono={actions.resetChrono}
        onDurationChange={actions.setDuration}
        onExport={actions.exportSummary}
        onReset={actions.reset}
      />

      <ResolutionSteps
        phase={state.phase}
        theme={state.theme.text}
        exempleTheme={exemples.theme}
        isFacilitator={isFacilitator}
        onTheme={actions.setTheme}
        onGo={actions.goToPhase}
      />

      <div className="flex flex-1 overflow-hidden">
        {/* Nouvel atelier : les saisies en cours repartent à zéro. */}
        <ResolutionMyPanel
          key={state.round}
          state={state}
          retenus={retenus}
          myId={myId}
          myName={me?.name ?? identity?.name ?? ''}
          myColor={me?.color ?? identity?.color ?? '#94a3b8'}
          votesLeft={votesLeft}
          exemples={exemples}
          actions={actions}
        />
        <div className="flex flex-1 flex-col overflow-hidden">{etape}</div>
      </div>

      {/* Suggestions pour le champ « Porteur » du premier pas. */}
      <datalist id="resolution-participants">
        {participants.map((p) => <option key={p.id} value={p.name} />)}
      </datalist>
    </ToolPageShell>
  );
};

export default ResolutionCollectivePage;
