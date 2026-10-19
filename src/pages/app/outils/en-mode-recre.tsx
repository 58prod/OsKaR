import React, { useRef, useState } from 'react';
import { ImagePlus } from 'lucide-react';
import { useToolPage } from '@/hooks/useToolPage';
import { ToolPageShell } from '@/components/toolbox/ToolPageShell';
import { RecreToolbar } from '@/components/toolbox/recre/RecreToolbar';
import { RecreUploader, type RecreUploaderHandle } from '@/components/toolbox/recre/RecreUploader';
import { RecreBoard } from '@/components/toolbox/recre/RecreBoard';
import { RecreReveal } from '@/components/toolbox/recre/RecreReveal';
import { useRecreSession } from '@/components/toolbox/recre/useRecreSession';

const EnModeRecrePage: React.FC = () => {
  const { code, isCreating, identity, handleJoin, handleShare } = useToolPage('en-mode-recre');

  const { state, participants, isFacilitator, toggleFacilitator, remainingSec, myId, actions } =
    useRecreSession(code, identity);

  const me = participants.find((p) => p.id === myId);

  // Photos glissées depuis l'ordinateur, n'importe où sur la page : elles
  // rejoignent « Mes photos », prêtes à envoyer. Le compteur évite que le
  // survol d'un élément enfant ne fasse clignoter la zone.
  const uploaderRef = useRef<RecreUploaderHandle>(null);
  const survols = useRef(0);
  const [survol, setSurvol] = useState(false);
  const avecFichiers = (e: React.DragEvent) => Array.from(e.dataTransfer.types).includes('Files');
  const depot = {
    onDragEnter: (e: React.DragEvent) => {
      if (!avecFichiers(e) || state.reveal) return;
      e.preventDefault();
      survols.current += 1;
      setSurvol(true);
    },
    onDragOver: (e: React.DragEvent) => {
      if (!avecFichiers(e) || state.reveal) return;
      e.preventDefault();
      e.dataTransfer.dropEffect = 'copy';
    },
    onDragLeave: (e: React.DragEvent) => {
      if (!avecFichiers(e)) return;
      survols.current = Math.max(0, survols.current - 1);
      if (survols.current === 0) setSurvol(false);
    },
    onDrop: (e: React.DragEvent) => {
      if (!avecFichiers(e)) return;
      e.preventDefault();
      survols.current = 0;
      setSurvol(false);
      if (!state.reveal) uploaderRef.current?.ajouter(e.dataTransfer.files);
    },
  };

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

      <div className="relative flex flex-1 overflow-hidden" {...depot}>
        <RecreUploader
          ref={uploaderRef}
          myName={me?.name ?? identity?.name ?? ''}
          myColor={me?.color ?? identity?.color ?? '#94a3b8'}
          onAddPhotos={actions.addPhotos}
        />
        <RecreBoard
          state={state}
          myId={myId}
          isFacilitator={isFacilitator}
          onToggleLike={actions.toggleLike}
          onDeletePhoto={actions.removePhoto}
          onShowToAll={actions.startRevealAt}
          onToggleHighlight={actions.toggleHighlight}
        />
        <RecreReveal
          state={state}
          myId={myId}
          isFacilitator={isFacilitator}
          onLike={actions.toggleLike}
          onShowAuthor={actions.showAuthor}
          onNext={actions.nextPhoto}
          onGoTo={actions.goToPhoto}
          onClose={actions.closeReveal}
        />
        {survol && (
          <div className="pointer-events-none absolute inset-3 z-40 flex flex-col items-center justify-center gap-2 rounded-2xl border-[3px] border-dashed border-[#ec4899] bg-[#fdf2f8]/90" aria-hidden>
            <ImagePlus className="h-10 w-10 text-[#ec4899]" />
            <p className="text-base font-bold text-navy">Déposez vos photos ici</p>
            <p className="text-sm text-muted">Elles s’ajoutent à « Mes photos », prêtes à envoyer.</p>
          </div>
        )}
      </div>
    </ToolPageShell>
  );
};

export default EnModeRecrePage;
