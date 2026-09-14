import React, { useState } from 'react';
import { Download, EyeOff, Heart, RotateCcw } from 'lucide-react';
import { ChronoControls } from '@/components/toolbox/shared/ChronoControls';
import { DISONS_ACCENT, DISONS_VOTE_LIMITS, type DisonsState } from './disonsLogic';

interface DisonsToolbarProps {
  state: DisonsState;
  remainingSec: number;
  freinCount: number;
  moteurCount: number;
  votesCount: number;
  isFacilitator: boolean;
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
 * Barre supérieure de « Disons-nous les choses », sur le modèle des autres
 * jeux : compteurs à gauche ; anonymat, cœurs par personne, export,
 * réinitialisation confirmée et minuteur partagé à droite.
 */
export const DisonsToolbar: React.FC<DisonsToolbarProps> = ({
  state, remainingSec, freinCount, moteurCount, votesCount, isFacilitator,
  onAnonymousChange, onVoteLimitChange, onToggleChrono, onResetChrono, onDurationChange, onExport, onReset,
}) => {
  const [confirmReset, setConfirmReset] = useState(false);

  return (
    <div
      className="flex flex-wrap items-center gap-3 border-b border-line bg-white px-6 py-3"
      style={{ '--tool-accent': DISONS_ACCENT } as React.CSSProperties}
    >
      <p className="text-sm text-muted" aria-live="polite">
        <strong style={{ color: '#e11d48' }}>{freinCount}</strong> frein{freinCount > 1 ? 's' : ''}
        {' · '}<strong style={{ color: '#16a34a' }}>{moteurCount}</strong> moteur{moteurCount > 1 ? 's' : ''}
        {' · '}<strong className="text-navy">{votesCount}</strong> vote{votesCount > 1 ? 's' : ''}
      </p>

      {!isFacilitator && (
        <div className="flex flex-wrap items-center gap-2">
          {state.anonymous && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-surface px-3 py-1 text-xs font-semibold text-muted">
              <EyeOff className="h-3.5 w-3.5" aria-hidden /> Cartes anonymes
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
        {isFacilitator && (
          <>
            <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-line px-3 py-1.5 text-sm font-semibold text-navy transition-colors hover:bg-surface">
              <input
                type="checkbox"
                checked={state.anonymous}
                onChange={(e) => onAnonymousChange(e.target.checked)}
                className="h-4 w-4"
                style={{ accentColor: DISONS_ACCENT }}
              />
              <EyeOff className="h-4 w-4" aria-hidden /> Cartes anonymes
            </label>
            <label className="flex items-center gap-2 text-sm font-semibold text-muted">
              <Heart className="h-4 w-4" aria-hidden />
              <span className="sr-only">Cœurs par personne</span>
              <select
                value={state.voteLimit}
                onChange={(e) => onVoteLimitChange(Number(e.target.value))}
                className="rounded-lg border border-line bg-white px-3 py-1.5 text-sm font-medium text-navy outline-none focus:border-[var(--tool-accent)]"
              >
                {!DISONS_VOTE_LIMITS.includes(state.voteLimit) && (
                  <option value={state.voteLimit}>{limitLabel(state.voteLimit)}</option>
                )}
                {DISONS_VOTE_LIMITS.map((v) => (
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
          accent={DISONS_ACCENT}
          idPrefix="disons"
          onToggle={onToggleChrono}
          onReset={onResetChrono}
          onDurationChange={onDurationChange}
        />
      </div>

      {confirmReset && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="disons-confirm-reset-title"
          className="fixed inset-0 z-[210] flex items-center justify-center bg-navy/60 p-6"
          onClick={(e) => { if (e.target === e.currentTarget) setConfirmReset(false); }}
        >
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-card-hover">
            <h2 id="disons-confirm-reset-title" className="text-base font-bold text-navy">
              Réinitialiser la séance ?
            </h2>
            <p className="mt-2 text-sm text-muted">
              Toutes les cartes et les votes de la séance seront effacés pour tout le monde. Pensez à exporter le résumé avant.
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

export default DisonsToolbar;
