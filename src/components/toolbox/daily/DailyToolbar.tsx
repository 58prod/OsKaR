import React, { useState } from 'react';
import { Shuffle, Square, Sunrise } from 'lucide-react';
import { DAILY_ACCENT, DAILY_DURATIONS, formatTime, isActive, type DailyState } from './dailyLogic';

interface DailyToolbarProps {
  state: DailyState;
  totalSec: number;
  participantsCount: number;
  isFacilitator: boolean;
  onDurationChange: (sec: number) => void;
  onRandomOrderChange: (value: boolean) => void;
  onStop: () => void;
}

const durationLabel = (sec: number) =>
  DAILY_DURATIONS.find((d) => d.value === sec)?.label ?? formatTime(sec);

/**
 * Barre supérieure du Daily, sur le modèle de la rétro, de la récré, du
 * Planning Poker et du ROTI : l'avancement du tour de table et la durée de
 * la séance à gauche, les réglages de l'animateur à droite, confirmation
 * avant d'arrêter.
 */
export const DailyToolbar: React.FC<DailyToolbarProps> = ({
  state, totalSec, participantsCount, isFacilitator, onDurationChange, onRandomOrderChange, onStop,
}) => {
  const [confirmStop, setConfirmStop] = useState(false);
  const active = isActive(state.phase);
  const position = state.phase === 'next' ? state.currentIdx + 2 : state.currentIdx + 1;

  return (
    <div
      className="flex flex-wrap items-center gap-3 border-b border-line bg-white px-6 py-3"
      style={{ '--tool-accent': DAILY_ACCENT } as React.CSSProperties}
    >
      <span className="inline-flex shrink-0 items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-muted">
        <Sunrise className="h-4 w-4" style={{ color: DAILY_ACCENT }} aria-hidden /> Tour de table
      </span>

      <p className="text-sm text-muted" aria-live="polite">
        {active ? (
          <>
            Tour <strong className="text-navy">{Math.min(position, state.order.length)}</strong> / {state.order.length}
            {' · '}Durée <strong className="font-mono text-navy">{formatTime(totalSec)}</strong>
          </>
        ) : state.phase === 'done' ? (
          <>
            Terminé · <strong className="text-navy">{state.order.length - state.skipped.length}</strong> prise{state.order.length - state.skipped.length > 1 ? 's' : ''} de parole
            {' · '}Durée <strong className="font-mono text-navy">{formatTime(totalSec)}</strong>
          </>
        ) : (
          <>
            <strong className="text-navy">{participantsCount}</strong> participant{participantsCount > 1 ? 's' : ''} en ligne
          </>
        )}
      </p>

      <div className="ml-auto flex flex-wrap items-center gap-2.5">
        {isFacilitator && state.phase !== 'done' ? (
          <label className="flex items-center gap-2 text-sm font-semibold text-muted">
            Temps par personne
            <select
              value={state.durationSec}
              onChange={(e) => onDurationChange(Number(e.target.value))}
              className="rounded-lg border border-line bg-white px-3 py-1.5 text-sm font-medium text-navy outline-none focus:border-[var(--tool-accent)]"
            >
              {!DAILY_DURATIONS.some((d) => d.value === state.durationSec) && (
                <option value={state.durationSec}>{formatTime(state.durationSec)}</option>
              )}
              {DAILY_DURATIONS.map((d) => (
                <option key={d.value} value={d.value}>{d.label}</option>
              ))}
            </select>
          </label>
        ) : (
          <span className="text-sm text-muted">
            <strong className="text-navy">{durationLabel(state.durationSec)}</strong> par personne
          </span>
        )}

        {isFacilitator && state.phase === 'idle' && (
          <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-line px-3 py-1.5 text-sm font-semibold text-navy transition-colors hover:bg-surface">
            <input
              type="checkbox"
              checked={state.randomOrder}
              onChange={(e) => onRandomOrderChange(e.target.checked)}
              className="h-4 w-4"
              style={{ accentColor: DAILY_ACCENT }}
            />
            <Shuffle className="h-4 w-4" aria-hidden /> Ordre aléatoire
          </label>
        )}

        {isFacilitator && active && (
          <button
            type="button"
            onClick={() => setConfirmStop(true)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-line px-3 py-1.5 text-sm font-semibold text-danger-600 transition-colors hover:bg-danger-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal"
          >
            <Square className="h-4 w-4" aria-hidden /> Arrêter
          </button>
        )}
      </div>

      {confirmStop && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="daily-confirm-stop-title"
          className="fixed inset-0 z-[210] flex items-center justify-center bg-navy/60 p-6"
          onClick={(e) => { if (e.target === e.currentTarget) setConfirmStop(false); }}
        >
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-card-hover">
            <h2 id="daily-confirm-stop-title" className="text-base font-bold text-navy">
              Arrêter le daily ?
            </h2>
            <p className="mt-2 text-sm text-muted">
              Le tour de table en cours sera interrompu pour tout le monde. Le temps par personne est conservé.
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setConfirmStop(false)}
                className="rounded-lg border border-line px-3 py-1.5 text-sm font-semibold text-navy transition-colors hover:bg-surface"
              >
                Continuer
              </button>
              <button
                type="button"
                onClick={() => { onStop(); setConfirmStop(false); }}
                className="inline-flex items-center gap-1.5 rounded-lg bg-danger-600 px-3 py-1.5 text-sm font-bold text-white transition-colors hover:bg-danger-700"
              >
                <Square className="h-4 w-4" aria-hidden /> Arrêter
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DailyToolbar;
