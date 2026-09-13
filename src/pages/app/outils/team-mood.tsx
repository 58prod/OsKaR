import React from 'react';
import { useToolPage } from '@/hooks/useToolPage';
import { ToolPageShell } from '@/components/toolbox/ToolPageShell';
import { MoodToolbar } from '@/components/toolbox/mood/MoodToolbar';
import { MoodBoard } from '@/components/toolbox/mood/MoodBoard';
import { MoodResults } from '@/components/toolbox/mood/MoodResults';
import { MoodDiscussion } from '@/components/toolbox/mood/MoodDiscussion';
import { useMoodSession } from '@/components/toolbox/mood/useMoodSession';

const TeamMoodPage: React.FC = () => {
  const { code, isCreating, identity, handleJoin, handleShare } = useToolPage('team-mood');

  const { state, participants, isFacilitator, toggleFacilitator, remainingSec, stats, globalAvg, myId, actions } =
    useMoodSession(code, identity);

  return (
    <ToolPageShell
      title="Team Mood"
      code={code}
      isCreating={isCreating}
      identity={identity}
      isFacilitator={isFacilitator}
      onToggleFacilitator={toggleFacilitator}
      onJoin={handleJoin}
      onShare={handleShare}
    >
      <MoodToolbar
        state={state}
        remainingSec={remainingSec}
        isFacilitator={isFacilitator}
        voteCount={Object.keys(state.votes).length}
        totalCount={participants.length}
        onPhaseChange={actions.setPhase}
        onAnonymousChange={actions.setAnonymous}
        onToggleChrono={actions.toggleChrono}
        onResetChrono={actions.resetChrono}
        onDurationChange={actions.setDuration}
        onReveal={actions.reveal}
        onReset={actions.reset}
      />

      {state.phase === 'discussion' && state.collective ? (
        <MoodDiscussion
          stats={stats}
          globalAvg={globalAvg}
          state={state}
          isFacilitator={isFacilitator}
          onCollectiveChange={actions.setCollective}
          onCopySummary={actions.copySummary}
        />
      ) : (
        <div className="flex flex-1 overflow-hidden">
          <div className="flex flex-1 overflow-hidden">
            {/* Nouveau tour : les notes en cours de saisie repartent à zéro. */}
            <MoodBoard key={state.round} state={state} participants={participants} myId={myId} onVote={actions.vote} />
          </div>

          <aside
            className="relative flex w-[360px] shrink-0 flex-col gap-3.5 overflow-y-auto border-l border-line bg-surface p-5"
            aria-label="Résultats du Team Mood"
          >
            <MoodResults stats={stats} globalAvg={globalAvg} state={state} participants={participants} />
          </aside>
        </div>
      )}
    </ToolPageShell>
  );
};

export default TeamMoodPage;
