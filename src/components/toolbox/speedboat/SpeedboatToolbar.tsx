import React, { useState } from 'react';
import { Download, Eye, EyeOff, Heart, RotateCcw, UserX } from 'lucide-react';
import type { BoardNote } from '@/components/toolbox/shared/boardNotes';
import { ChronoControls } from '@/components/toolbox/shared/ChronoControls';
import { SPEEDBOAT_ACCENT, SPEEDBOAT_VOTE_LIMITS, type SpeedboatState } from './speedboatLogic';

interface SpeedboatToolbarProps {
  state: SpeedboatState;
  remainingSec: number;
  placedNotes: BoardNote[];
  participantsCount: number;
  isFacilitator: boolean;
  showInstructions: boolean;
  onToggleInstructions: () => void;
  onAnonymousChange: (value: boolean) => void;
  onVoteLimitChange: (value: number) => void;
  onToggleChrono: () => void;
  onResetChrono: () => void;
  onDurationChange: (seconds: number) => void;
  onExport: () => void;
  onReset: () => void;
}

const limitLabel = (n: number) => (n > 0 ? `${n} cœur${n > 1 ? 's' : ''} par personne` : 'Cœurs illimités');

/**
 * Barre supérieure du Speedboat, sur le modèle des autres jeux : compteurs à
 * gauche ; instructions, anonymat, cœurs par personne, export,
 * réinitialisation confirmée et minuteur partagé à droite.
 */
export const SpeedboatToolbar: React.FC<SpeedboatToolbarProps> = ({
  state, remainingSec, placedNotes, participantsCount, isFacilitator, showInstructions,
  onToggleInstructions, onAnonymousChange, onVoteLimitChange, onToggleChrono, onResetChrono, onDurationChange,
  onExport, onReset,
}) => {
  const [confirmReset, setConfirmReset] = useState(false);
  const votes = placedNotes.reduce((s, n) => s + n.likedBy.length, 0);
  const retained = placedNotes.filter((n) => n.retained).length;

  return (
    <div
      className="flex flex-wrap items-center gap-3 border-b border-line bg-white px-6 py-3"
      style={{ '--tool-accent': SPEEDBOAT_ACCENT } as React.CSSProperties}
    >
      <p className="text-sm text-muted" aria-live="polite">
        <strong className="text-navy">{placedNotes.length}</strong> ticket{placedNotes.length > 1 ? 's' : ''}
        {' · '}<strong className="text-navy">{votes}</strong> vote{votes > 1 ? 's' : ''}
        {retained > 0 && <> · <strong className="text-warning-600">{retained}</strong> retenu{retained > 1 ? 's' : ''}</>}
        {' · '}{participantsCount} participant{participantsCount > 1 ? 's' : ''}
      </p>

      {!isFacilitator && (
        <div className="flex flex-wrap items-center gap-2">
          {state.anonymous && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-surface px-3 py-1 text-xs font-semibold text-muted">
              <UserX className="h-3.5 w-3.5" aria-hidden /> Tickets anonymes
            </span>
          )}
          {state.voteLimit > 0 && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-surface px-3 py-1 text-xs font-semibold text-muted">
              <Heart className="h-3.5 w-3.5" aria-hidden /> {limitLabel(state.voteLimit)}
            </span>
          )}
        </div>
      )}

      <div className="ml-auto flex flex-wrap items-center gap-2.5">
        <button
          type="button"
          onClick={onToggleInstructions}
          aria-pressed={showInstructions}
          className="inline-flex items-center gap-1.5 rounded-lg border border-line px-3 py-1.5 text-sm font-semibold text-navy transition-colors hover:bg-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal"
        >
          {showInstructions ? <EyeOff className="h-4 w-4" aria-hidden /> : <Eye className="h-4 w-4" aria-hidden />}
          {showInstructions ? 'Masquer les consignes' : 'Afficher les consignes'}
        </button>

        {isFacilitator && (
          <>
            <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-line px-3 py-1.5 text-sm font-semibold text-navy transition-colors hover:bg-surface">
              <input
                type="checkbox"
                checked={state.anonymous}
                onChange={(e) => onAnonymousChange(e.target.checked)}
                className="h-4 w-4"
                style={{ accentColor: SPEEDBOAT_ACCENT }}
              />
              <UserX className="h-4 w-4" aria-hidden /> Tickets anonymes
            </label>
            <label className="flex items-center gap-2 text-sm font-semibold text-muted">
              <Heart className="h-4 w-4" aria-hidden />
              <span className="sr-only">Cœurs par personne</span>
              <select
                value={state.voteLimit}
                onChange={(e) => onVoteLimitChange(Number(e.target.value))}
                className="rounded-lg border border-line bg-white px-3 py-1.5 text-sm font-medium text-navy outline-none focus:border-[var(--tool-accent)]"
              >
                {!SPEEDBOAT_VOTE_LIMITS.includes(state.voteLimit) && (
                  <option value={state.voteLimit}>{limitLabel(state.voteLimit)}</option>
                )}
                {SPEEDBOAT_VOTE_LIMITS.map((v) => (
                  <option key={v} value={v}>{limitLabel(v)}</option>
                ))}
              </select>
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
          accent={SPEEDBOAT_ACCENT}
          idPrefix="speedboat"
          onToggle={onToggleChrono}
          onReset={onResetChrono}
          onDurationChange={onDurationChange}
        />
      </div>

      {confirmReset && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="speedboat-confirm-reset-title"
          className="fixed inset-0 z-[210] flex items-center justify-center bg-navy/60 p-6"
          onClick={(e) => { if (e.target === e.currentTarget) setConfirmReset(false); }}
        >
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-card-hover">
            <h2 id="speedboat-confirm-reset-title" className="text-base font-bold text-navy">
              Réinitialiser le Speedboat ?
            </h2>
            <p className="mt-2 text-sm text-muted">
              Tous les tickets et votes de la séance seront effacés pour tout le monde. Pensez à exporter le résumé avant.
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

export default SpeedboatToolbar;
