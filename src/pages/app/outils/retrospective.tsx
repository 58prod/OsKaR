import React, { useState } from 'react';
import { ClipboardList, NotebookPen } from 'lucide-react';
import { useToolPage } from '@/hooks/useToolPage';
import { ToolPageShell } from '@/components/toolbox/ToolPageShell';
import { RetroToolbar } from '@/components/toolbox/retro/RetroToolbar';
import { RetroPrepPanel } from '@/components/toolbox/retro/RetroPrepPanel';
import { RetroBoard } from '@/components/toolbox/retro/RetroBoard';
import { RetroActionsPanel } from '@/components/toolbox/retro/RetroActionsPanel';
import { useRetroSession } from '@/components/toolbox/retro/useRetroSession';
import { RetroPanelTab } from '@/components/toolbox/retro/RetroPanelTab';
import { RetroRecreLink } from '@/components/toolbox/retro/RetroRecreLink';
import { getRetentionLabel } from '@/constants/toolbox';

const RetrospectivePage: React.FC = () => {
  const { code, isCreating, identity, handleJoin, handleShare } = useToolPage('retrospective');

  const {
    state, participants, isFacilitator, toggleFacilitator,
    remainingSec, myId, myNotes, retroActions, actions,
  } = useRetroSession(code, identity);

  // Panneaux latéraux repliables, pour laisser la place au tableau quand il est plein.
  const [prepOpen, setPrepOpen] = useState(true);
  const [actionsOpen, setActionsOpen] = useState(true);

  const me = participants.find((p) => p.id === myId);
  const openActionsCount = retroActions.filter((a) => !state.actionMeta[a.id]?.done).length
    + state.pastActions.filter((a) => !a.done).length;
  const revealedCount = state.notes.filter((n) => n.revealed).length;

  return (
    <ToolPageShell
      title="Rétrospective d'équipe"
      code={code}
      isCreating={isCreating}
      identity={identity}
      isFacilitator={isFacilitator}
      onToggleFacilitator={toggleFacilitator}
      onJoin={handleJoin}
      onShare={handleShare}
      retentionLabel={getRetentionLabel('retrospective')}
      codeHint="C'est le code de votre équipe : gardez le lien et rouvrez-le à chaque rétro pour retrouver le suivi des actions."
    >
      <RetroToolbar
        chrono={state.chrono}
        remainingSec={remainingSec}
        isFacilitator={isFacilitator}
        notesCount={state.notes.length}
        revealedCount={revealedCount}
        actionsCount={retroActions.length}
        onToggleChrono={actions.toggleChrono}
        onResetChrono={actions.resetChrono}
        onDurationChange={actions.setDuration}
        onExport={actions.exportSummary}
        onNewRetro={actions.newRetro}
        onReset={actions.reset}
      />

      <div className="flex flex-1 overflow-hidden">
        {prepOpen ? (
          <RetroPrepPanel
            myName={me?.name ?? identity?.name ?? ''}
            myColor={me?.color ?? identity?.color ?? '#94a3b8'}
            myNotes={myNotes}
            onAddNote={actions.addNote}
            onDeleteNote={actions.deleteNote}
            onRevealNext={actions.revealMyNext}
            onRevealAll={actions.revealMyAll}
            onUnreveal={actions.unrevealMine}
            onCollapse={() => setPrepOpen(false)}
          />
        ) : (
          <RetroPanelTab
            side="left"
            label="Ma préparation"
            icon={NotebookPen}
            badge={myNotes.filter((n) => !n.revealed).length}
            onOpen={() => setPrepOpen(true)}
          />
        )}

        <div className="relative flex flex-1 overflow-hidden">
          <RetroBoard
            notes={state.notes}
            myId={myId}
            onMove={actions.moveToCategory}
            onMovePile={actions.movePileTo}
            onPile={actions.pileOn}
            onPileOnto={actions.pileOnto}
            onUnpile={actions.unpile}
            onLike={actions.like}
          />
          {code && <RetroRecreLink retroCode={code} />}
        </div>

        {actionsOpen ? (
          <RetroActionsPanel
            actions={retroActions}
            actionMeta={state.actionMeta}
            pastActions={state.pastActions}
            isFacilitator={isFacilitator}
            onMetaChange={actions.setActionMeta}
            onPastChange={actions.setPastAction}
            onPastDelete={actions.deletePastAction}
            dismissedCount={state.dismissedActions.filter((id) => state.notes.some((n) => n.id === id && n.revealed && n.category === 'start')).length}
            onDismiss={actions.dismissAction}
            onRestore={actions.restoreActions}
            onExport={actions.exportActions}
            onImport={actions.importActions}
            onCollapse={() => setActionsOpen(false)}
          />
        ) : (
          <RetroPanelTab
            side="right"
            label="Actions"
            icon={ClipboardList}
            badge={openActionsCount}
            onOpen={() => setActionsOpen(true)}
          />
        )}
      </div>
    </ToolPageShell>
  );
};

export default RetrospectivePage;
