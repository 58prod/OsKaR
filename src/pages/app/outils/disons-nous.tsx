import React from 'react';
import { useToolPage } from '@/hooks/useToolPage';
import { ToolPageShell } from '@/components/toolbox/ToolPageShell';
import { DisonsToolbar } from '@/components/toolbox/disons/DisonsToolbar';
import { DisonsComposerPanel } from '@/components/toolbox/disons/DisonsComposerPanel';
import { DisonsBoard } from '@/components/toolbox/disons/DisonsBoard';
import { useDisonsSession } from '@/components/toolbox/disons/useDisonsSession';

const DisonsNousPage: React.FC = () => {
  const { code, isCreating, identity, handleJoin, handleShare } = useToolPage('disons-nous');

  const {
    state, participants, isFacilitator, toggleFacilitator, remainingSec,
    myId, myNotes, publishedNotes, votesLeft, actions,
  } = useDisonsSession(code, identity);

  const me = participants.find((p) => p.id === myId);
  const freinCount = publishedNotes.filter((n) => n.category === 'frein').length;
  const moteurCount = publishedNotes.filter((n) => n.category === 'moteur').length;
  const votesCount = publishedNotes.reduce((sum, n) => sum + n.likedBy.length, 0);

  return (
    <ToolPageShell
      title="Disons-nous les choses"
      code={code}
      isCreating={isCreating}
      identity={identity}
      isFacilitator={isFacilitator}
      onToggleFacilitator={toggleFacilitator}
      onJoin={handleJoin}
      onShare={handleShare}
    >
      <DisonsToolbar
        state={state}
        remainingSec={remainingSec}
        freinCount={freinCount}
        moteurCount={moteurCount}
        votesCount={votesCount}
        isFacilitator={isFacilitator}
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
        <DisonsComposerPanel
          key={state.round}
          myName={me?.name ?? identity?.name ?? ''}
          myColor={me?.color ?? identity?.color ?? '#94a3b8'}
          myNotes={myNotes}
          anonymous={state.anonymous}
          onAddDraft={actions.addDraft}
          onPublish={actions.publish}
          onDeleteDraft={actions.deleteNote}
        />

        <DisonsBoard
          notes={state.notes}
          myId={myId}
          isFacilitator={isFacilitator}
          anonymous={state.anonymous}
          voteLimit={state.voteLimit}
          votesLeft={votesLeft}
          onVote={actions.vote}
          onRetain={actions.retain}
          onDelete={actions.deleteNote}
        />
      </div>
    </ToolPageShell>
  );
};

export default DisonsNousPage;
