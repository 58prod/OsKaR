import React from 'react';
import { useToolPage } from '@/hooks/useToolPage';
import { ToolPageShell } from '@/components/toolbox/ToolPageShell';
import { IdeaboxToolbar } from '@/components/toolbox/ideabox/IdeaboxToolbar';
import { IdeaboxComposerPanel } from '@/components/toolbox/ideabox/IdeaboxComposerPanel';
import { IdeaboxBoard } from '@/components/toolbox/ideabox/IdeaboxBoard';
import { useIdeaboxSession } from '@/components/toolbox/ideabox/useIdeaboxSession';

const IdeaBoxPage: React.FC = () => {
  const { code, isCreating, identity, handleJoin, handleShare } = useToolPage('idea-box');

  const {
    state, participants, isFacilitator, toggleFacilitator, remainingSec, myId, myNotes, votesLeft, actions,
  } = useIdeaboxSession(code, identity);

  const me = participants.find((p) => p.id === myId);
  const published = state.notes.filter((n) => n.revealed);
  const retainedCount = published.filter((n) => n.retained).length;
  const votesCount = published.reduce((sum, n) => sum + n.likedBy.length, 0);

  return (
    <ToolPageShell
      title="Boîte à idées"
      code={code}
      isCreating={isCreating}
      identity={identity}
      isFacilitator={isFacilitator}
      onToggleFacilitator={toggleFacilitator}
      onJoin={handleJoin}
      onShare={handleShare}
    >
      <IdeaboxToolbar
        state={state}
        remainingSec={remainingSec}
        publishedCount={published.length}
        retainedCount={retainedCount}
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
        <IdeaboxComposerPanel
          key={state.round}
          myName={me?.name ?? identity?.name ?? ''}
          myColor={me?.color ?? identity?.color ?? '#94a3b8'}
          myNotes={myNotes}
          anonymous={state.anonymous}
          onAddDraft={actions.addDraft}
          onPublish={actions.publish}
          onDeleteDraft={actions.deleteNote}
        />

        <IdeaboxBoard
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

export default IdeaBoxPage;
