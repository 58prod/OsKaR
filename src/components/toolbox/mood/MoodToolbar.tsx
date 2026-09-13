import React, { useState } from 'react';
import { EyeOff, Eye, Trash2 } from 'lucide-react';
import { ChronoControls } from '@/components/toolbox/shared/ChronoControls';
import { MOOD_ACCENT, type MoodPhase, type MoodState } from './moodLogic';

interface MoodToolbarProps {
  state: MoodState;
  remainingSec: number;
  isFacilitator: boolean;
  voteCount: number;
  totalCount: number;
  onPhaseChange: (phase: MoodPhase) => void;
  onAnonymousChange: (value: boolean) => void;
  onToggleChrono: () => void;
  onResetChrono: () => void;
  onDurationChange: (seconds: number) => void;
  onReveal: () => void;
  onReset: () => void;
}

const PHASES: { key: MoodPhase; num: number; label: string }[] = [
  { key: 'vote', num: 1, label: 'Votes individuels' },
  { key: 'discussion', num: 2, label: 'Discussion collective' },
];

/**
 * Barre supérieure du Team Mood, sur le modèle des autres jeux : les deux
 * temps de l'atelier et le compteur de votes à gauche, les commandes de
 * l'animateur et le minuteur partagé à droite, confirmation avant d'effacer.
 */
export const MoodToolbar: React.FC<MoodToolbarProps> = ({
  state, remainingSec, isFacilitator, voteCount, totalCount,
  onPhaseChange, onAnonymousChange, onToggleChrono, onResetChrono, onDurationChange, onReveal, onReset,
}) => {
  const [confirmReset, setConfirmReset] = useState(false);

  return (
    <div
      className="flex flex-wrap items-center gap-3 border-b border-line bg-white px-6 py-3"
      style={{ '--tool-accent': MOOD_ACCENT } as React.CSSProperties}
    >
      <div className="flex items-center gap-1 rounded-xl bg-surface p-1" role="group" aria-label="Temps de l’atelier">
        {PHASES.map((p) => {
          const active = state.phase === p.key;
          const locked = p.key === 'discussion' && !state.revealed;
          return (
            <button
              key={p.key}
              type="button"
              aria-pressed={active}
              disabled={!isFacilitator || locked}
              onClick={() => onPhaseChange(p.key)}
              title={locked ? 'Révélez d’abord les notes' : !isFacilitator ? 'L’animateur choisit le temps de l’atelier' : undefined}
              className={[
                'inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-semibold transition-colors',
                active ? 'bg-white text-navy shadow-card' : 'text-muted',
                isFacilitator && !locked && !active ? 'hover:text-navy' : '',
                'disabled:cursor-default',
                locked ? 'opacity-50' : '',
              ].join(' ')}
            >
              <span
                className="flex h-5 w-5 items-center justify-center rounded-full text-[11px] font-bold text-white"
                style={{ background: active ? MOOD_ACCENT : '#94a3b8' }}
                aria-hidden
              >
                {p.num}
              </span>
              {p.label}
            </button>
          );
        })}
      </div>

      <p className="shrink-0 text-sm text-muted" aria-live="polite">
        <strong className="text-navy">{voteCount}</strong> / {totalCount} vote{totalCount > 1 ? 's' : ''}
      </p>

      {!isFacilitator && state.anonymous && (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-surface px-3 py-1 text-xs font-semibold text-muted">
          <EyeOff className="h-3.5 w-3.5" aria-hidden /> Notes anonymes
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
                style={{ accentColor: MOOD_ACCENT }}
              />
              <EyeOff className="h-4 w-4" aria-hidden /> Notes anonymes
            </label>
            <button
              type="button"
              onClick={onReveal}
              disabled={state.revealed || voteCount === 0}
              title={voteCount === 0 ? 'Il faut au moins un vote' : 'Montrer les résultats à toute l’équipe'}
              className="inline-flex items-center gap-1.5 rounded-lg bg-navy px-3 py-1.5 text-sm font-bold text-white transition-colors hover:bg-navy-light focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Eye className="h-4 w-4" aria-hidden /> Révéler
            </button>
            <button
              type="button"
              onClick={() => setConfirmReset(true)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-line px-3 py-1.5 text-sm font-semibold text-navy transition-colors hover:bg-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal"
            >
              <Trash2 className="h-4 w-4" aria-hidden /> Réinitialiser
            </button>
          </>
        )}

        <ChronoControls
          chrono={state.chrono}
          remainingSec={remainingSec}
          isFacilitator={isFacilitator}
          accent={MOOD_ACCENT}
          idPrefix="mood"
          onToggle={onToggleChrono}
          onReset={onResetChrono}
          onDurationChange={onDurationChange}
        />
      </div>

      {confirmReset && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="mood-confirm-reset-title"
          className="fixed inset-0 z-[210] flex items-center justify-center bg-navy/60 p-6"
          onClick={(e) => { if (e.target === e.currentTarget) setConfirmReset(false); }}
        >
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-card-hover">
            <h2 id="mood-confirm-reset-title" className="text-base font-bold text-navy">
              Réinitialiser les notes ?
            </h2>
            <p className="mt-2 text-sm text-muted">
              Toutes les notes et la note collective seront effacées pour tout le monde.
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
                <Trash2 className="h-4 w-4" aria-hidden /> Réinitialiser
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MoodToolbar;
