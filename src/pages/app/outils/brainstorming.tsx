import React from 'react';
import { useToolPage } from '@/hooks/useToolPage';
import { ToolPageShell } from '@/components/toolbox/ToolPageShell';
import { BrainstormToolbar } from '@/components/toolbox/brainstorm/BrainstormToolbar';
import { BrainstormPrepPanel } from '@/components/toolbox/brainstorm/BrainstormPrepPanel';
import { BrainstormCanvas } from '@/components/toolbox/brainstorm/BrainstormCanvas';
import { useBrainstormSession } from '@/components/toolbox/brainstorm/useBrainstormSession';

const BrainstormingPage: React.FC = () => {
  const { code, isCreating, identity, handleJoin, handleShare } = useToolPage('brainstorming');

  const {
    state, participants, isFacilitator, toggleFacilitator,
    remainingSec, myId, myNotes, actions,
  } = useBrainstormSession(code, identity);

  const me = participants.find((p) => p.id === myId);
  const revealed = state.notes.filter((n) => n.revealed);
  const votesCount = revealed.reduce((sum, n) => sum + n.likedBy.length, 0);

  return (
    <ToolPageShell
      title="Brainstorming"
      code={code}
      isCreating={isCreating}
      identity={identity}
      isFacilitator={isFacilitator}
      onToggleFacilitator={toggleFacilitator}
      onJoin={handleJoin}
      onShare={handleShare}
    >
      <BrainstormToolbar
        state={state}
        remainingSec={remainingSec}
        isFacilitator={isFacilitator}
        revealedCount={revealed.length}
        votesCount={votesCount}
        onThemeChange={actions.setTheme}
        onAnonymousChange={actions.setAnonymous}
        onToggleChrono={actions.toggleChrono}
        onResetChrono={actions.resetChrono}
        onDurationChange={actions.setDuration}
        onExport={actions.exportSummary}
        onReset={actions.reset}
      />

      <div className="flex flex-1 overflow-hidden">
        {/* Nouvelle séance : le texte en cours de saisie repart à zéro. */}
        <BrainstormPrepPanel
          key={state.round}
          myName={me?.name ?? identity?.name ?? ''}
          myColor={me?.color ?? identity?.color ?? '#94a3b8'}
          myNotes={myNotes}
          onAddNote={actions.addNote}
          onDeleteNote={actions.deleteNote}
          onRevealNext={actions.revealMyNext}
          onRevealAll={actions.revealMyAll}
          onUnreveal={actions.unrevealMine}
        />

        <BrainstormCanvas
          notes={state.notes}
          positions={state.positions}
          myId={myId}
          isFacilitator={isFacilitator}
          anonymous={state.anonymous}
          onMove={actions.moveNote}
          onArrange={actions.arrange}
          onLike={actions.like}
          onRetain={actions.retain}
          onDelete={actions.deleteNote}
        />
      </div>
    </ToolPageShell>
  );
};

export default BrainstormingPage;
