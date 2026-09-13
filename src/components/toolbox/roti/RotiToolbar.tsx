import React, { useState } from 'react';
import { Eye, Star, Trash2 } from 'lucide-react';
import { ChronoControls } from '@/components/toolbox/shared/ChronoControls';
import type { ToolChrono } from '@/components/toolbox/shared/toolChrono';
import { ROTI_ACCENT, ROTI_SESSION_MAX } from './rotiLogic';

interface RotiToolbarProps {
  session: string;
  chrono: ToolChrono;
  remainingSec: number;
  isFacilitator: boolean;
  revealed: boolean;
  voteCount: number;
  totalCount: number;
  onSessionChange: (value: string) => void;
  onToggleChrono: () => void;
  onResetChrono: () => void;
  onDurationChange: (seconds: number) => void;
  onReveal: () => void;
  onReset: () => void;
}

/**
 * Barre supérieure du ROTI, sur le modèle de la rétro, de la récré et du
 * Planning Poker : la séance évaluée (éditable par l'animateur), le compteur
 * de votes, les commandes de l'animateur et le minuteur partagé aux couleurs
 * de l'outil.
 */
export const RotiToolbar: React.FC<RotiToolbarProps> = ({
  session, chrono, remainingSec, isFacilitator, revealed, voteCount, totalCount,
  onSessionChange, onToggleChrono, onResetChrono, onDurationChange, onReveal, onReset,
}) => {
  const [confirmReset, setConfirmReset] = useState(false);

  return (
    <div
      className="flex flex-wrap items-center gap-3 border-b border-line bg-white px-6 py-3"
      style={{ '--tool-accent': ROTI_ACCENT } as React.CSSProperties}
    >
      <span className="inline-flex shrink-0 items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-muted">
        <Star className="h-4 w-4" style={{ color: ROTI_ACCENT }} aria-hidden /> Séance
      </span>

      {isFacilitator ? (
        <label className="min-w-[220px] flex-1">
          <span className="sr-only">Séance évaluée</span>
          <input
            type="text"
            value={session}
            onChange={(e) => onSessionChange(e.target.value)}
            maxLength={ROTI_SESSION_MAX}
            placeholder="Quelle séance évaluez-vous ?…"
            className="w-full bg-transparent text-base font-semibold text-navy outline-none placeholder:font-normal placeholder:text-line"
          />
        </label>
      ) : (
        <span className="min-w-[220px] flex-1 truncate text-base font-semibold text-navy">
          {session || <span className="font-normal text-muted">En attente de l’intitulé de la séance…</span>}
        </span>
      )}

      <p className="shrink-0 text-sm text-muted" aria-live="polite">
        <strong className="text-navy">{voteCount}</strong> / {totalCount} vote{totalCount > 1 ? 's' : ''}
      </p>

      <div className="ml-auto flex flex-wrap items-center gap-2.5">
        {isFacilitator && (
          <>
            <button
              type="button"
              onClick={onReveal}
              disabled={revealed || voteCount === 0}
              title={voteCount === 0 ? 'Il faut au moins un vote' : 'Montrer les notes à toute l’équipe'}
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
          chrono={chrono}
          remainingSec={remainingSec}
          isFacilitator={isFacilitator}
          accent={ROTI_ACCENT}
          idPrefix="roti"
          onToggle={onToggleChrono}
          onReset={onResetChrono}
          onDurationChange={onDurationChange}
        />
      </div>

      {confirmReset && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="roti-confirm-reset-title"
          className="fixed inset-0 z-[210] flex items-center justify-center bg-navy/60 p-6"
          onClick={(e) => { if (e.target === e.currentTarget) setConfirmReset(false); }}
        >
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-card-hover">
            <h2 id="roti-confirm-reset-title" className="text-base font-bold text-navy">
              Réinitialiser les votes ?
            </h2>
            <p className="mt-2 text-sm text-muted">
              Toutes les notes et tous les commentaires seront effacés pour tout le monde. L’intitulé de la séance est conservé.
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

export default RotiToolbar;
