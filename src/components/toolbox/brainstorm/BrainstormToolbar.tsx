import React, { useState } from 'react';
import { Download, EyeOff, RotateCcw, StickyNote } from 'lucide-react';
import { ChronoControls } from '@/components/toolbox/shared/ChronoControls';
import { BRAINSTORM_ACCENT, BRAINSTORM_THEME_MAX, type BrainstormState } from './brainstormLogic';

interface BrainstormToolbarProps {
  state: BrainstormState;
  remainingSec: number;
  isFacilitator: boolean;
  revealedCount: number;
  votesCount: number;
  onThemeChange: (theme: string) => void;
  onAnonymousChange: (value: boolean) => void;
  onToggleChrono: () => void;
  onResetChrono: () => void;
  onDurationChange: (seconds: number) => void;
  onExport: () => void;
  onReset: () => void;
}

/**
 * Barre supérieure du Brainstorming, sur le modèle des autres jeux : thème
 * de la séance (fixé par l'animateur) et compteurs à gauche ; anonymat,
 * export, réinitialisation confirmée et minuteur partagé à droite.
 */
export const BrainstormToolbar: React.FC<BrainstormToolbarProps> = ({
  state, remainingSec, isFacilitator, revealedCount, votesCount,
  onThemeChange, onAnonymousChange, onToggleChrono, onResetChrono, onDurationChange, onExport, onReset,
}) => {
  const [confirmReset, setConfirmReset] = useState(false);

  return (
    <div
      className="flex flex-wrap items-center gap-3 border-b border-line bg-white px-6 py-3"
      style={{ '--tool-accent': BRAINSTORM_ACCENT } as React.CSSProperties}
    >
      <span className="inline-flex shrink-0 items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-muted">
        <StickyNote className="h-4 w-4" style={{ color: BRAINSTORM_ACCENT }} aria-hidden /> Thème
      </span>

      {isFacilitator ? (
        <label className="min-w-[220px] flex-1">
          <span className="sr-only">Thème de la séance</span>
          <input
            type="text"
            value={state.theme}
            onChange={(e) => onThemeChange(e.target.value)}
            maxLength={BRAINSTORM_THEME_MAX}
            placeholder="Quel est le sujet de cette séance ?"
            className="w-full bg-transparent text-base font-semibold text-navy outline-none placeholder:font-normal placeholder:text-line"
          />
        </label>
      ) : (
        <span className="min-w-[220px] flex-1 truncate text-base font-semibold text-navy">
          {state.theme || <span className="font-normal text-muted">En attente du thème…</span>}
        </span>
      )}

      <p className="shrink-0 text-sm text-muted" aria-live="polite">
        <strong className="text-navy">{revealedCount}</strong> idée{revealedCount > 1 ? 's' : ''}
        {' · '}
        <strong className="text-navy">{votesCount}</strong> vote{votesCount > 1 ? 's' : ''}
      </p>

      {!isFacilitator && state.anonymous && (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-surface px-3 py-1 text-xs font-semibold text-muted">
          <EyeOff className="h-3.5 w-3.5" aria-hidden /> Idées anonymes
        </span>
      )}

      <div className="ml-auto flex flex-wrap items-center gap-2.5">
        {isFacilitator && (
          <>
            <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-line px-3 py-1.5 text-sm font-semibold text-navy transition-colors hover:bg-surface">
              <input
                type="checkbox"
                checked={state.anonymous}
                onChange={(e) => onAnonymousChange(e.target.checked)}
                className="h-4 w-4"
                style={{ accentColor: BRAINSTORM_ACCENT }}
              />
              <EyeOff className="h-4 w-4" aria-hidden /> Idées anonymes
            </label>
            <button
              type="button"
              onClick={onExport}
              className="inline-flex items-center gap-1.5 rounded-lg bg-navy px-3 py-1.5 text-sm font-bold text-white transition-colors hover:bg-navy-light focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal"
            >
              <Download className="h-4 w-4" aria-hidden /> Exporter le résumé
            </button>
            <button
              type="button"
              onClick={() => setConfirmReset(true)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-line px-3 py-1.5 text-sm font-semibold text-navy transition-colors hover:bg-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal"
            >
              <RotateCcw className="h-4 w-4" aria-hidden /> Réinitialiser
            </button>
          </>
        )}

        <ChronoControls
          chrono={state.chrono}
          remainingSec={remainingSec}
          isFacilitator={isFacilitator}
          accent={BRAINSTORM_ACCENT}
          idPrefix="brainstorm"
          onToggle={onToggleChrono}
          onReset={onResetChrono}
          onDurationChange={onDurationChange}
        />
      </div>

      {confirmReset && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="brainstorm-confirm-reset-title"
          className="fixed inset-0 z-[210] flex items-center justify-center bg-navy/60 p-6"
          onClick={(e) => { if (e.target === e.currentTarget) setConfirmReset(false); }}
        >
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-card-hover">
            <h2 id="brainstorm-confirm-reset-title" className="text-base font-bold text-navy">
              Réinitialiser le brainstorming ?
            </h2>
            <p className="mt-2 text-sm text-muted">
              Toutes les idées de la séance seront effacées pour tout le monde. Le thème est conservé. Pensez à exporter le résumé avant.
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setConfirmReset(false)}
                className="rounded-lg border border-line px-3 py-1.5 text-sm font-semibold text-navy transition-colors hover:bg-surface"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={() => { onReset(); setConfirmReset(false); }}
                className="inline-flex items-center gap-1.5 rounded-lg bg-danger-600 px-3 py-1.5 text-sm font-bold text-white transition-colors hover:bg-danger-700"
              >
                <RotateCcw className="h-4 w-4" aria-hidden /> Réinitialiser
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BrainstormToolbar;
