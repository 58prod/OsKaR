import React, { useState } from 'react';
import { Eye, Layers, Trash2 } from 'lucide-react';
import { ChronoControls } from '@/components/toolbox/shared/ChronoControls';
import type { ToolChrono } from '@/components/toolbox/shared/toolChrono';
import { POKER_ACCENT, type SuiteKey } from './pokerLogic';

interface PokerToolbarProps {
  story: string;
  chrono: ToolChrono;
  remainingSec: number;
  isFacilitator: boolean;
  revealed: boolean;
  voteCount: number;
  totalCount: number;
  suiteKey: SuiteKey;
  onStoryChange: (story: string) => void;
  onToggleChrono: () => void;
  onResetChrono: () => void;
  onDurationChange: (seconds: number) => void;
  onSuiteChange: (key: SuiteKey) => void;
  onApplyCustom: (raw: string) => void;
  onReveal: () => void;
  onReset: () => void;
}

/**
 * Barre supérieure du Planning Poker, sur le modèle de la rétro et de la
 * récré : la story à estimer (éditable par l'animateur, comme le thème de la
 * récré), le compteur de votes, les commandes de l'animateur et le minuteur
 * partagé aux couleurs de l'outil.
 */
export const PokerToolbar: React.FC<PokerToolbarProps> = ({
  story, chrono, remainingSec, isFacilitator, revealed, voteCount, totalCount, suiteKey,
  onStoryChange, onToggleChrono, onResetChrono, onDurationChange, onSuiteChange, onApplyCustom, onReveal, onReset,
}) => {
  const [customRaw, setCustomRaw] = useState('');
  const [confirmReset, setConfirmReset] = useState(false);

  return (
    <div
      className="flex flex-wrap items-center gap-3 border-b border-line bg-white px-6 py-3"
      style={{ '--tool-accent': POKER_ACCENT } as React.CSSProperties}
    >
      <span className="inline-flex shrink-0 items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-muted">
        <Layers className="h-4 w-4" style={{ color: POKER_ACCENT }} aria-hidden /> Story
      </span>

      {isFacilitator ? (
        <label className="min-w-[220px] flex-1">
          <span className="sr-only">Story à estimer</span>
          <input
            type="text"
            value={story}
            onChange={(e) => onStoryChange(e.target.value)}
            placeholder="Décrivez la fonctionnalité à estimer…"
            className="w-full bg-transparent text-base font-semibold text-navy outline-none placeholder:font-normal placeholder:text-line"
          />
        </label>
      ) : (
        <span className="min-w-[220px] flex-1 truncate text-base font-semibold text-navy">
          {story || <span className="font-normal text-muted">En attente de la story…</span>}
        </span>
      )}

      <p className="shrink-0 text-sm text-muted" aria-live="polite">
        <strong className="text-navy">{voteCount}</strong> / {totalCount} vote{totalCount > 1 ? 's' : ''}
      </p>

      <div className="ml-auto flex flex-wrap items-center gap-2.5">
        {isFacilitator && (
          <>
            <label className="sr-only" htmlFor="poker-suite">Suite de votes</label>
            <select
              id="poker-suite"
              value={suiteKey}
              onChange={(e) => onSuiteChange(e.target.value as SuiteKey)}
              className="rounded-lg border border-line bg-white px-3 py-1.5 text-sm font-medium text-navy outline-none focus:border-[var(--tool-accent)]"
            >
              <option value="fibonacci">Fibonacci (1,2,3,5,8,13,?)</option>
              <option value="tshirt">T-Shirts (XS,S,M,L,XL,?)</option>
              <option value="custom">Personnalisé…</option>
            </select>
            {suiteKey === 'custom' && (
              <form
                onSubmit={(e) => { e.preventDefault(); onApplyCustom(customRaw); }}
                className="flex items-center gap-1.5"
              >
                <label htmlFor="poker-suite-custom" className="sr-only">Valeurs personnalisées (séparées par des virgules)</label>
                <input
                  id="poker-suite-custom"
                  type="text"
                  value={customRaw}
                  onChange={(e) => setCustomRaw(e.target.value)}
                  placeholder="Ex : 0,1,2,4,8,?"
                  className="w-40 rounded-lg border border-line bg-white px-3 py-1.5 text-sm text-navy outline-none focus:border-[var(--tool-accent)]"
                />
                <button
                  type="submit"
                  className="rounded-lg border border-line px-3 py-1.5 text-sm font-semibold text-navy transition-colors hover:bg-surface"
                >
                  Appliquer
                </button>
              </form>
            )}
            <button
              type="button"
              onClick={onReveal}
              disabled={revealed || voteCount === 0}
              title={voteCount === 0 ? 'Il faut au moins un vote' : 'Montrer les cartes à toute l’équipe'}
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
          accent={POKER_ACCENT}
          idPrefix="poker"
          onToggle={onToggleChrono}
          onReset={onResetChrono}
          onDurationChange={onDurationChange}
        />
      </div>

      {confirmReset && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="poker-confirm-reset-title"
          className="fixed inset-0 z-[210] flex items-center justify-center bg-navy/60 p-6"
          onClick={(e) => { if (e.target === e.currentTarget) setConfirmReset(false); }}
        >
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-card-hover">
            <h2 id="poker-confirm-reset-title" className="text-base font-bold text-navy">
              Réinitialiser les votes ?
            </h2>
            <p className="mt-2 text-sm text-muted">
              Tous les votes en cours seront effacés. Les participants devront voter à nouveau sur cette story.
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

export default PokerToolbar;
