import React, { useEffect } from 'react';
import { Clock, Play, Pause, ChevronRight, CheckCircle2, SkipForward } from 'lucide-react';
import {
  DAILY_ACCENT, DAILY_PRINCIPE, DAILY_QUESTIONS, OVERTIME_TAUNTS, formatTime, type DailyState,
} from './dailyLogic';

interface DailyStageProps {
  state: DailyState;
  currentName: string;
  nextName: string;
  isSelf: boolean;
  isNextSelf: boolean;
  remainingSec: number;
  totalSec: number;
  isFacilitator: boolean;
  canStart: boolean;
  onStart: () => void;
  onPauseResume: () => void;
  onNext: () => void;
  onGo: () => void;
  onSkip: () => void;
  onStop: () => void;
}

const Frame: React.FC<{ children: React.ReactNode; tone?: string }> = ({ children, tone }) => (
  <div className={`flex flex-1 flex-col items-center justify-center overflow-y-auto p-8 text-center ${tone ?? ''}`}>
    {children}
  </div>
);

/** Les points à aborder pendant son tour. */
const Questions: React.FC<{ compact?: boolean }> = ({ compact }) => (
  <ul className={`flex flex-wrap justify-center gap-2 ${compact ? '' : 'mt-5'}`} aria-label="Points à aborder">
    {DAILY_QUESTIONS.map((q) => (
      <li
        key={q.label}
        className={[
          'inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-semibold',
          q.extra ? 'border border-dashed border-line bg-white/70 text-muted' : 'border border-line bg-white text-navy shadow-card',
        ].join(' ')}
      >
        <span aria-hidden>{q.emoji}</span> {q.label}
      </li>
    ))}
  </ul>
);

const primaryBtn =
  'inline-flex items-center gap-2 rounded-xl px-8 py-3.5 text-base font-bold text-white shadow-card transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal disabled:cursor-not-allowed disabled:opacity-40';

/** Zone centrale du Daily : écrans repos / annonce / chrono / fin. */
export const DailyStage: React.FC<DailyStageProps> = (props) => {
  const { state, currentName, nextName, isSelf, isNextSelf, remainingSec, totalSec, isFacilitator, canStart } = props;
  const over = remainingSec < 0;
  const { phase } = state;

  // Raccourcis de l'animateur : Espace = pause / reprise, → = suivant / c'est parti.
  const { onPauseResume, onNext, onGo } = props;
  useEffect(() => {
    if (!isFacilitator) return;
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement | null;
      if (e.repeat || e.metaKey || e.ctrlKey || e.altKey) return;
      if (el?.closest('input, textarea, select, button, [contenteditable], [role="dialog"]')) return;
      if (e.key === ' ' && (phase === 'running' || phase === 'paused')) { e.preventDefault(); onPauseResume(); }
      if (e.key === 'ArrowRight') {
        if (phase === 'running' || phase === 'paused') onNext();
        else if (phase === 'next') onGo();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isFacilitator, phase, onPauseResume, onNext, onGo]);

  if (phase === 'idle') {
    return (
      <Frame>
        <Clock className="mb-4 h-12 w-12" style={{ color: DAILY_ACCENT }} aria-hidden />
        <h2 className="text-2xl font-bold text-navy">Prêt pour le daily ?</h2>
        <p className="mt-2 max-w-lg text-muted">{DAILY_PRINCIPE}</p>
        <Questions />
        <p className="mt-4 text-sm text-muted">Chacun parle à son tour, dans la limite du temps imparti.</p>
        {isFacilitator ? (
          <div className="mt-6 flex flex-col items-center gap-3">
            <button type="button" onClick={props.onStart} disabled={!canStart} className={primaryBtn} style={{ background: DAILY_ACCENT }}>
              <Play className="h-5 w-5" aria-hidden /> Démarrer le daily
            </button>
            {!canStart && <p className="text-sm text-muted">En attente de participants…</p>}
          </div>
        ) : (
          <p className="mt-6 rounded-lg bg-white px-4 py-2 text-sm text-muted shadow-card">
            En attente du lancement par l’animateur.
          </p>
        )}
      </Frame>
    );
  }

  if (phase === 'done') {
    const spoke = state.order.length - state.skipped.length;
    return (
      <Frame>
        <CheckCircle2 className="mb-4 h-14 w-14 text-success-500" aria-hidden />
        <h2 className="text-2xl font-bold text-navy">Daily terminé !</h2>
        <p className="mt-2 text-muted">
          {spoke} prise{spoke > 1 ? 's' : ''} de parole en <strong className="font-mono text-navy">{formatTime(totalSec)}</strong>
          {state.skipped.length > 0 && <> · {state.skipped.length} tour{state.skipped.length > 1 ? 's' : ''} passé{state.skipped.length > 1 ? 's' : ''}</>}
        </p>
        <p className="mt-1 text-muted">Bonne journée à toute l’équipe.</p>
        {isFacilitator && (
          <button type="button" onClick={props.onStop} className={`mt-6 ${primaryBtn}`} style={{ background: DAILY_ACCENT }}>
            Nouveau daily
          </button>
        )}
      </Frame>
    );
  }

  if (phase === 'next') {
    return (
      <Frame tone="bg-teal-light">
        <div className="text-lg font-medium text-muted">{isNextSelf ? 'C’est à vous !' : 'C’est au tour de'}</div>
        <div className="my-2 text-6xl font-black tracking-tight text-navy">{nextName}</div>
        {isFacilitator ? (
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={props.onSkip}
              title="Absent ou rien à signaler"
              className="inline-flex items-center gap-1.5 rounded-xl border border-line bg-white px-4 py-3 text-sm font-semibold text-navy transition-colors hover:bg-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal"
            >
              <SkipForward className="h-4 w-4" aria-hidden /> Passer son tour
            </button>
            <button type="button" onClick={props.onGo} className={primaryBtn} style={{ background: DAILY_ACCENT }}>
              <Play className="h-5 w-5" aria-hidden /> C’est parti
            </button>
          </div>
        ) : (
          <p className="mt-6 text-sm text-muted">En attente de l’animateur…</p>
        )}
      </Frame>
    );
  }

  // running | paused
  const elapsed = Math.max(0, state.durationSec - remainingSec);
  const elapsedRatio = state.durationSec > 0 ? elapsed / state.durationSec : 0;
  const fillPct = Math.min(100, elapsedRatio * 100);
  const past75 = elapsedRatio >= 0.75;
  // Couleur de la barre : verte, puis orange dès 75 %, puis rouge en dépassement.
  const fillColor = over ? 'bg-danger-500/40' : past75 ? 'bg-warning-400/40' : 'bg-teal/30';
  // Pas de transition au passage à 0 (nouveau tour) pour éviter un retour de barre.
  const fillTransition = fillPct <= 0 ? '' : 'transition-[width] duration-1000 ease-linear';
  // Au-delà du double du temps imparti : mode « exagération » (effets + message taquin tournant).
  const wayOver = phase === 'running' && state.durationSec > 0 && remainingSec <= -state.durationSec;
  // Graine par séance (startedAt) + index courant : la rotation ne démarre pas
  // toujours sur le même message pour la première personne d'un daily.
  const tauntLen = OVERTIME_TAUNTS.length;
  const tauntSeed = Math.floor((state.startedAt ?? 0) / 1000) + Math.max(0, state.currentIdx);
  const taunt = OVERTIME_TAUNTS[((tauntSeed % tauntLen) + tauntLen) % tauntLen];
  const paused = phase === 'paused';

  return (
    <div className="relative flex flex-1 flex-col items-center justify-center overflow-hidden p-8 text-center">
      {/* Barre de progression en fond : temps écoulé (verte → orange à 75 % → rouge en dépassement). */}
      <div
        className={`pointer-events-none absolute inset-y-0 left-0 z-0 ${fillColor} ${fillTransition} ${wayOver ? 'animate-pulse' : ''}`}
        style={{ width: `${fillPct}%` }}
        aria-hidden
      />

      <div className="relative z-10 flex flex-col items-center">
        {paused ? (
          <div className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-warning-100 px-4 py-1.5 text-sm font-bold uppercase tracking-wide text-warning-800">
            <Pause className="h-4 w-4" aria-hidden /> En pause
          </div>
        ) : isSelf ? (
          <div className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-navy/10 px-4 py-1.5 text-sm font-bold uppercase tracking-wide text-navy">
            <span aria-hidden>🎙</span> Vous parlez
          </div>
        ) : (
          <div className="mb-3 h-8" aria-hidden />
        )}
        <div className="text-4xl font-black tracking-tight text-navy">{currentName}</div>
        {over && <div className="mt-2 text-lg font-extrabold uppercase tracking-wide text-danger-600">Temps dépassé</div>}
        <output
          className={`my-4 inline-block font-light tabular-nums ${over ? 'text-danger-600' : 'text-navy'} ${paused ? 'opacity-50' : ''} ${
            wayOver ? 'animate-wobble' : !paused && remainingSec > 0 && remainingSec <= 3 ? 'animate-pulse' : ''
          }`}
          style={{ fontSize: '5.5rem', lineHeight: 1 }}
          aria-label="Temps restant"
        >
          {formatTime(remainingSec)}
        </output>

        {wayOver && (
          <div
            role="status"
            aria-live="polite"
            className="mb-2 inline-flex items-center gap-2 rounded-full bg-danger-100 px-4 py-1.5 text-sm font-bold text-danger-700 shadow-card animate-bounce-gentle"
          >
            <span className="text-lg" aria-hidden>{taunt.emoji}</span>
            {taunt.text}
          </div>
        )}

        <Questions compact />

        {isFacilitator && (
          <>
            <div className="mt-6 flex items-center gap-3">
              <button
                type="button"
                onClick={props.onPauseResume}
                className="inline-flex items-center gap-1.5 rounded-xl border border-line bg-white px-4 py-2.5 text-sm font-semibold text-navy transition-colors hover:bg-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal"
              >
                {paused ? <Play className="h-4 w-4" aria-hidden /> : <Pause className="h-4 w-4" aria-hidden />}
                {paused ? 'Reprendre' : 'Pause'}
              </button>
              <button
                type="button"
                onClick={props.onNext}
                className="inline-flex items-center gap-1.5 rounded-xl px-5 py-2.5 text-sm font-bold text-white shadow-card transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal"
                style={{ background: DAILY_ACCENT }}
              >
                {state.currentIdx >= state.order.length - 1 ? 'Terminer' : 'Suivant'} <ChevronRight className="h-4 w-4" aria-hidden />
              </button>
            </div>
            <p className="mt-3 text-xs text-muted">Raccourcis : Espace = pause · → = suivant</p>
          </>
        )}
      </div>
    </div>
  );
};

export default DailyStage;
