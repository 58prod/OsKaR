import React, { useState } from 'react';
import { Download, EyeOff, Heart, RotateCcw } from 'lucide-react';
import { ChronoControls } from '@/components/toolbox/shared/ChronoControls';
import { MAX_RETENUS, RESOLUTION_ACCENT, VOTE_LIMITS, type ResolutionState } from './resolutionLogic';

interface ResolutionToolbarProps {
  state: ResolutionState;
  remainingSec: number;
  retainedCount: number;
  isFacilitator: boolean;
  onAnonymousChange: (value: boolean) => void;
  onVoteLimitChange: (value: number) => void;
  onToggleChrono: () => void;
  onResetChrono: () => void;
  onDurationChange: (seconds: number) => void;
  onExport: () => void;
  onReset: () => void;
}

const pluriel = (n: number, mot: string) => `${mot}${n > 1 ? 's' : ''}`;

/**
 * Barre supérieure de la Résolution collective, sur le modèle des autres
 * outils : compteurs à gauche ; réglages (anonymat, cœurs par personne),
 * export, nouvel atelier confirmé et minuteur partagé à droite.
 */
export const ResolutionToolbar: React.FC<ResolutionToolbarProps> = ({
  state, remainingSec, retainedCount, isFacilitator,
  onAnonymousChange, onVoteLimitChange, onToggleChrono, onResetChrono, onDurationChange, onExport, onReset,
}) => {
  const [confirmReset, setConfirmReset] = useState(false);
  const nbProblemes = state.problems.length;
  const nbSolutions = state.solutions.length;

  return (
    <div
      className="flex flex-wrap items-center gap-3 border-b border-line bg-white px-6 py-3"
      style={{ '--tool-accent': RESOLUTION_ACCENT } as React.CSSProperties}
    >
      <p className="text-sm text-muted" aria-live="polite">
        <strong className="text-navy">{nbProblemes}</strong> {pluriel(nbProblemes, 'problème')}
        {' · '}
        <strong className="text-navy">{retainedCount}</strong> / {MAX_RETENUS} {pluriel(retainedCount, 'retenu')}
        {' · '}
        <strong className="text-navy">{nbSolutions}</strong> {pluriel(nbSolutions, 'solution')}
      </p>

      {!isFacilitator && (
        <div className="flex flex-wrap items-center gap-2">
          {state.anonymous && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-surface px-3 py-1 text-xs font-semibold text-muted">
              <EyeOff className="h-3.5 w-3.5" aria-hidden /> Atelier anonyme
            </span>
          )}
          {state.voteLimit > 0 && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-surface px-3 py-1 text-xs font-semibold text-muted">
              <Heart className="h-3.5 w-3.5" aria-hidden /> {state.voteLimit} {pluriel(state.voteLimit, 'cœur')} par personne
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
                style={{ accentColor: RESOLUTION_ACCENT }}
              />
              <EyeOff className="h-4 w-4" aria-hidden /> Anonyme
            </label>
            <label className="flex items-center gap-2 text-sm font-semibold text-muted">
              <Heart className="h-4 w-4" aria-hidden />
              <span className="sr-only">Cœurs par personne pour choisir les problèmes</span>
              <select
                value={state.voteLimit}
                onChange={(e) => onVoteLimitChange(Number(e.target.value))}
                className="rounded-lg border border-line bg-white px-3 py-1.5 text-sm font-medium text-navy outline-none focus:border-[var(--tool-accent)]"
              >
                {!VOTE_LIMITS.some((v) => v.value === state.voteLimit) && (
                  <option value={state.voteLimit}>{state.voteLimit} cœurs par personne</option>
                )}
                {VOTE_LIMITS.map((v) => <option key={v.value} value={v.value}>{v.label}</option>)}
              </select>
            </label>
            <button
              type="button"
              onClick={onExport}
              className="inline-flex items-center gap-1.5 rounded-lg bg-navy px-3 py-1.5 text-sm font-bold text-white transition-colors hover:bg-navy-light focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal"
            >
              <Download className="h-4 w-4" aria-hidden /> Exporter la synthèse
            </button>
            <button
              type="button"
              onClick={() => setConfirmReset(true)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-line px-3 py-1.5 text-sm font-semibold text-navy transition-colors hover:bg-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal"
            >
              <RotateCcw className="h-4 w-4" aria-hidden /> Nouvel atelier
            </button>
          </>
        )}

        <ChronoControls
          chrono={state.chrono}
          remainingSec={remainingSec}
          isFacilitator={isFacilitator}
          accent={RESOLUTION_ACCENT}
          idPrefix="resolution"
          onToggle={onToggleChrono}
          onReset={onResetChrono}
          onDurationChange={onDurationChange}
        />
      </div>

      {confirmReset && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="resolution-confirm-reset-title"
          className="fixed inset-0 z-[210] flex items-center justify-center bg-navy/60 p-6"
          onClick={(e) => { if (e.target === e.currentTarget) setConfirmReset(false); }}
        >
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-card-hover">
            <h2 id="resolution-confirm-reset-title" className="text-base font-bold text-navy">
              Commencer un nouvel atelier ?
            </h2>
            <p className="mt-2 text-sm text-muted">
              Problèmes, solutions, commentaires, votes et premiers pas seront effacés pour tout le monde.
              Le thème et les réglages sont gardés. Pensez à exporter la synthèse avant.
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
                <RotateCcw className="h-4 w-4" aria-hidden /> Tout effacer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ResolutionToolbar;
