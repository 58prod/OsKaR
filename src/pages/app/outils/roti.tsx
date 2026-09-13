import React from 'react';
import { useToolPage } from '@/hooks/useToolPage';
import { ToolPageShell } from '@/components/toolbox/ToolPageShell';
import { RotiToolbar } from '@/components/toolbox/roti/RotiToolbar';
import { RotiBoard } from '@/components/toolbox/roti/RotiBoard';
import { RotiResults } from '@/components/toolbox/roti/RotiResults';
import { useRotiSession } from '@/components/toolbox/roti/useRotiSession';

const RotiPage: React.FC = () => {
  const { code, isCreating, identity, handleJoin, handleShare } = useToolPage('roti');

  const { state, participants, isFacilitator, toggleFacilitator, remainingSec, results, myId, actions } =
    useRotiSession(code, identity);

  return (
    <ToolPageShell
      title="ROTI"
      code={code}
      isCreating={isCreating}
      identity={identity}
      isFacilitator={isFacilitator}
      onToggleFacilitator={toggleFacilitator}
      onJoin={handleJoin}
      onShare={handleShare}
    >
      <RotiToolbar
        session={state.session}
        chrono={state.chrono}
        remainingSec={remainingSec}
        isFacilitator={isFacilitator}
        revealed={state.revealed}
        voteCount={Object.keys(state.votes).length}
        totalCount={participants.length}
        onSessionChange={actions.setSession}
        onToggleChrono={actions.toggleChrono}
        onResetChrono={actions.resetChrono}
        onDurationChange={actions.setDuration}
        onReveal={actions.reveal}
        onReset={actions.reset}
      />

      <div className="flex flex-1 overflow-hidden">
        <div className="flex flex-1 overflow-hidden">
          {/* Nouveau tour : la note et le commentaire en cours de saisie repartent à zéro. */}
          <RotiBoard
            key={state.round}
            state={state}
            participants={participants}
            myId={myId}
            onVote={actions.vote}
          />
        </div>

        <aside
          className="relative flex w-[320px] shrink-0 flex-col gap-3.5 overflow-y-auto border-l border-line bg-surface p-5"
          aria-label="Résultats du ROTI"
        >
          <RotiResults results={results} state={state} participants={participants} />
        </aside>
      </div>
    </ToolPageShell>
  );
};

export default RotiPage;
