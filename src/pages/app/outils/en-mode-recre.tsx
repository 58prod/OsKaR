import React from 'react';
import { useToolPage } from '@/hooks/useToolPage';
import { ToolPageShell } from '@/components/toolbox/ToolPageShell';
import { RecreToolbar } from '@/components/toolbox/recre/RecreToolbar';
import { RecreUploader } from '@/components/toolbox/recre/RecreUploader';
import { RecreBoard } from '@/components/toolbox/recre/RecreBoard';
import { RecreReveal } from '@/components/toolbox/recre/RecreReveal';
import { useRecreSession } from '@/components/toolbox/recre/useRecreSession';

const EnModeRecrePage: React.FC = () => {
  const { code, isCreating, identity, handleJoin, handleShare } = useToolPage('en-mode-recre');

  const { state, participants, isFacilitator, toggleFacilitator, remainingSec, myId, actions } =
    useRecreSession(code, identity);

  const me = participants.find((p) => p.id === myId);

  return (
    <ToolPageShell
      title="En mode récré !"
      code={code}
      isCreating={isCreating}
      identity={identity}
      isFacilitator={isFacilitator}
      onToggleFacilitator={toggleFacilitator}
      onJoin={handleJoin}
      onShare={handleShare}
    >
      <RecreToolbar
        state={state}
        isFacilitator={isFacilitator}
        remainingSec={remainingSec}
        onThemeChange={actions.setTheme}
        onToggleChrono={actions.toggleChrono}
        onResetChrono={actions.resetChrono}
        onDurationChange={actions.setDuration}
        onStartReveal={actions.startReveal}
        onReset={actions.reset}
      />

      <div className="relative flex flex-1 overflow-hidden">
        <RecreUploader
          myName={me?.name ?? identity?.name ?? ''}
          myColor={me?.color ?? identity?.color ?? '#94a3b8'}
          onAddPhotos={actions.addPhotos}
        />
        <RecreBoard state={state} myId={myId} onToggleLike={actions.toggleLike} onDeletePhoto={actions.removePhoto} />
        <RecreReveal
          state={state}
          myId={myId}
          isFacilitator={isFacilitator}
          onLike={actions.toggleLike}
          onShowAuthor={actions.showAuthor}
          onNext={actions.nextPhoto}
          onClose={actions.closeReveal}
        />
      </div>
    </ToolPageShell>
  );
};

export default EnModeRecrePage;
