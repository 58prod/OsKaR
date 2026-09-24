import React, { useState } from 'react';
import {
  ClipboardCopy, Download, Eye, EyeOff, Grid2x2, ListChecks, RotateCcw, UserRound, UserX,
} from 'lucide-react';
import { ChronoControls } from '@/components/toolbox/shared/ChronoControls';
import { TexteSynchro } from '@/components/toolbox/shared/TexteSynchro';
import { EISENHOWER_ACCENT, EISENHOWER_THEME_MAX, type EisenhowerState } from './eisenhowerLogic';

export type EisenhowerVue = 'matrice' | 'plan';

interface EisenhowerToolbarProps {
  state: EisenhowerState;
  remainingSec: number;
  ticketsCount: number;
  groupesCount: number;
  participantsCount: number;
  isFacilitator: boolean;
  vue: EisenhowerVue;
  onVueChange: (vue: EisenhowerVue) => void;
  showInstructions: boolean;
  onToggleInstructions: () => void;
  highlightMine: boolean;
  onToggleHighlightMine: () => void;
  /** Exemple de sujet, adapté au métier. */
  sujetExemple: string;
  onThemeChange: (text: string) => void;
  onAnonymousChange: (value: boolean) => void;
  onToggleChrono: () => void;
  onResetChrono: () => void;
  onDurationChange: (seconds: number) => void;
  onCopy: () => void;
  onExport: () => void;
  onReset: () => void;
}

const bouton = 'inline-flex items-center gap-1.5 rounded-lg border border-line px-3 py-1.5 text-sm font-semibold text-navy transition-colors hover:bg-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal';

/**
 * Barre supérieure de la matrice, sur le modèle des autres outils : sujet et
 * compteurs à gauche ; vue, consignes, réglages de l'animateur et minuteur
 * partagé à droite.
 */
export const EisenhowerToolbar: React.FC<EisenhowerToolbarProps> = ({
  state, remainingSec, ticketsCount, groupesCount, participantsCount, isFacilitator, vue, onVueChange,
  showInstructions, onToggleInstructions, highlightMine, onToggleHighlightMine, sujetExemple,
  onThemeChange, onAnonymousChange, onToggleChrono, onResetChrono, onDurationChange, onCopy, onExport, onReset,
}) => {
  const [confirmReset, setConfirmReset] = useState(false);

  return (
    <div
      className="flex flex-wrap items-center gap-3 border-b border-line bg-white px-6 py-3"
      style={{ '--tool-accent': EISENHOWER_ACCENT } as React.CSSProperties}
    >
      <span className="inline-flex shrink-0 items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-muted">
        <Grid2x2 className="h-4 w-4" style={{ color: EISENHOWER_ACCENT }} aria-hidden /> Sujet
      </span>

      {isFacilitator ? (
        <div className="min-w-[220px] flex-1">
          <TexteSynchro
            value={state.theme.text}
            onCommit={onThemeChange}
            label="Sujet de la matrice"
            placeholder={`Ex : ${sujetExemple}`}
            maxLength={EISENHOWER_THEME_MAX}
            className="font-semibold"
          />
        </div>
      ) : (
        <span className="min-w-[220px] flex-1 truncate text-base font-semibold text-navy">
          {state.theme.text || <span className="font-normal text-muted">Sujet libre</span>}
        </span>
      )}

      <p className="shrink-0 text-sm text-muted" aria-live="polite">
        <strong className="text-navy">{ticketsCount}</strong> ticket{ticketsCount > 1 ? 's' : ''}
        {groupesCount !== ticketsCount && <> · <strong className="text-navy">{groupesCount}</strong> après regroupement</>}
        {' · '}{participantsCount} participant{participantsCount > 1 ? 's' : ''}
      </p>

      {!isFacilitator && state.anonymous && (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-surface px-3 py-1 text-xs font-semibold text-muted">
          <UserX className="h-3.5 w-3.5" aria-hidden /> Tickets anonymes
        </span>
      )}

      <div className="ml-auto flex flex-wrap items-center gap-2.5">
        <div className="inline-flex rounded-lg border border-line p-0.5" role="tablist" aria-label="Affichage">
          {([
            ['matrice', 'Matrice', Grid2x2],
            ['plan', "Plan d'action", ListChecks],
          ] as const).map(([key, label, Icon]) => (
            <button
              key={key}
              type="button"
              role="tab"
              aria-selected={vue === key}
              onClick={() => onVueChange(key)}
              className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal ${
                vue === key ? 'text-white' : 'text-muted hover:text-navy'
              }`}
              style={vue === key ? { background: EISENHOWER_ACCENT } : undefined}
            >
              <Icon className="h-4 w-4" aria-hidden /> {label}
            </button>
          ))}
        </div>

        {vue === 'matrice' && (
          <>
            <button type="button" onClick={onToggleInstructions} aria-pressed={showInstructions} className={bouton}>
              {showInstructions ? <EyeOff className="h-4 w-4" aria-hidden /> : <Eye className="h-4 w-4" aria-hidden />}
              {showInstructions ? 'Masquer les consignes' : 'Afficher les consignes'}
            </button>
            <button
              type="button"
              onClick={onToggleHighlightMine}
              aria-pressed={highlightMine}
              className={bouton}
              style={highlightMine ? { borderColor: EISENHOWER_ACCENT, color: EISENHOWER_ACCENT } : undefined}
            >
              <UserRound className="h-4 w-4" aria-hidden /> Mes tickets
            </button>
          </>
        )}

        <button type="button" onClick={onCopy} className={bouton}>
          <ClipboardCopy className="h-4 w-4" aria-hidden /> Copier le plan
        </button>

        {isFacilitator && (
          <>
            <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-line px-3 py-1.5 text-sm font-semibold text-navy transition-colors hover:bg-surface">
              <input
                type="checkbox"
                checked={state.anonymous}
                onChange={(e) => onAnonymousChange(e.target.checked)}
                className="h-4 w-4"
                style={{ accentColor: EISENHOWER_ACCENT }}
              />
              <UserX className="h-4 w-4" aria-hidden /> Tickets anonymes
            </label>
            <button
              type="button"
              onClick={onExport}
              className="inline-flex items-center gap-1.5 rounded-lg bg-navy px-3 py-1.5 text-sm font-bold text-white transition-colors hover:bg-navy-light focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal"
            >
              <Download className="h-4 w-4" aria-hidden /> Exporter
            </button>
            <button type="button" onClick={() => setConfirmReset(true)} className={bouton}>
              <RotateCcw className="h-4 w-4" aria-hidden /> Réinitialiser
            </button>
          </>
        )}

        <ChronoControls
          chrono={state.chrono}
          remainingSec={remainingSec}
          isFacilitator={isFacilitator}
          accent={EISENHOWER_ACCENT}
          idPrefix="eisenhower"
          onToggle={onToggleChrono}
          onReset={onResetChrono}
          onDurationChange={onDurationChange}
        />
      </div>

      {confirmReset && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="eisenhower-confirm-reset-title"
          className="fixed inset-0 z-[210] flex items-center justify-center bg-navy/60 p-6"
          onClick={(e) => { if (e.target === e.currentTarget) setConfirmReset(false); }}
        >
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-card-hover">
            <h2 id="eisenhower-confirm-reset-title" className="text-base font-bold text-navy">
              Réinitialiser la matrice ?
            </h2>
            <p className="mt-2 text-sm text-muted">
              Tous les tickets, regroupements et plans d&apos;action seront effacés pour tout le monde. Le sujet est gardé. Pensez à exporter avant.
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

export default EisenhowerToolbar;
