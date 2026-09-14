import React, { useState } from 'react';
import { useToolPage } from '@/hooks/useToolPage';
import { ToolPageShell } from '@/components/toolbox/ToolPageShell';
import { SpeedboatToolbar } from '@/components/toolbox/speedboat/SpeedboatToolbar';
import { SpeedboatPrepPanel } from '@/components/toolbox/speedboat/SpeedboatPrepPanel';
import { SpeedboatScene } from '@/components/toolbox/speedboat/SpeedboatScene';
import { useSpeedboatSession } from '@/components/toolbox/speedboat/useSpeedboatSession';

const SpeedboatPage: React.FC = () => {
  const { code, isCreating, identity, handleJoin, handleShare } = useToolPage('speedboat');
  const [showInstructions, setShowInstructions] = useState(true);

  const {
    state, participants, isFacilitator, toggleFacilitator, remainingSec,
    myId, myNotes, placedNotes, votesLeft, actions,
  } = useSpeedboatSession(code, identity);

  const me = participants.find((p) => p.id === myId);

  return (
    <ToolPageShell
      title="Rétrospective Speedboat"
      code={code}
      isCreating={isCreating}
      identity={identity}
      isFacilitator={isFacilitator}
      onToggleFacilitator={toggleFacilitator}
      onJoin={handleJoin}
      onShare={handleShare}
    >
      <SpeedboatToolbar
        state={state}
        remainingSec={remainingSec}
        placedNotes={placedNotes}
        participantsCount={participants.length}
        isFacilitator={isFacilitator}
        showInstructions={showInstructions}
        onToggleInstructions={() => setShowInstructions((v) => !v)}
        onAnonymousChange={actions.setAnonymous}
        onVoteLimitChange={actions.setVoteLimit}
        onToggleChrono={actions.toggleChrono}
        onResetChrono={actions.resetChrono}
        onDurationChange={actions.setDuration}
        onExport={actions.exportSummary}
        onReset={actions.reset}
      />

      <div className="flex flex-1 overflow-hidden">
        {/* Nouvelle séance : le texte en cours de saisie repart à zéro. */}
        <SpeedboatPrepPanel
          key={state.round}
          myName={me?.name ?? identity?.name ?? ''}
          myColor={me?.color ?? identity?.color ?? '#94a3b8'}
          myNotes={myNotes}
          anonymous={state.anonymous}
          onAddDraft={actions.addDraft}
          onPublish={actions.publish}
          onDeleteDraft={actions.deleteNote}
        />

        <SpeedboatScene
          notes={state.notes}
          positions={state.positions}
          myId={myId}
          isFacilitator={isFacilitator}
          anonymous={state.anonymous}
          showInstructions={showInstructions}
          voteLimit={state.voteLimit}
          votesLeft={votesLeft}
          onMove={actions.moveCard}
          onVote={actions.vote}
          onRetain={actions.retain}
          onDelete={actions.deleteNote}
        />
      </div>
    </ToolPageShell>
  );
};

export default SpeedboatPage;
