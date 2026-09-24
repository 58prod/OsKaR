import React from 'react';
import { ArrowRight, Check } from 'lucide-react';
import { TexteSynchro } from '@/components/toolbox/shared/TexteSynchro';
import { PHASES, RESOLUTION_ACCENT, THEME_MAX, phaseIndex, type ResolutionPhase } from './resolutionLogic';

interface ResolutionStepsProps {
  phase: ResolutionPhase;
  theme: string;
  /** Thème proposé en exemple, adapté au métier. */
  exempleTheme: string;
  isFacilitator: boolean;
  onTheme: (text: string) => void;
  onGo: (phase: ResolutionPhase) => void;
}

/**
 * Bandeau du déroulé : le thème de l'atelier (saisi par l'animateur) et les
 * six étapes. L'animateur passe d'une étape à l'autre ; les participants
 * suivent.
 */
export const ResolutionSteps: React.FC<ResolutionStepsProps> = ({
  phase, theme, exempleTheme, isFacilitator, onTheme, onGo,
}) => {
  const cur = phaseIndex(phase);
  const suivante = PHASES[cur + 1];

  return (
    <div className="flex flex-wrap items-center gap-x-6 gap-y-3 border-b border-line bg-white px-6 py-3">
      <div className="flex min-w-[240px] flex-1 items-center gap-2.5">
        <span className="shrink-0 text-xs font-bold uppercase tracking-wide text-muted">Thème</span>
        {isFacilitator ? (
          <TexteSynchro
            value={theme}
            onCommit={onTheme}
            label="Thème de l'atelier"
            placeholder={`Ex : ${exempleTheme}`}
            maxLength={THEME_MAX}
            className="font-semibold"
          />
        ) : theme ? (
          <p className="min-w-0 break-words text-sm font-bold text-navy">{theme}</p>
        ) : (
          <p className="text-sm italic text-muted">L’animateur va préciser le thème…</p>
        )}
      </div>

      <nav aria-label="Étapes de l'atelier">
        <ol className="flex flex-wrap items-center gap-y-1">
          {PHASES.map((p, i) => {
            const etat = i < cur ? 'fait' : i === cur ? 'encours' : 'avenir';
            const contenu = (
              <>
                <span
                  className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-bold"
                  style={etat === 'encours'
                    ? { background: RESOLUTION_ACCENT, color: '#fff' }
                    : etat === 'fait'
                      ? { background: '#ffedd5', color: RESOLUTION_ACCENT }
                      : { background: '#f1f5f9', color: '#94a3b8' }}
                  aria-hidden
                >
                  {etat === 'fait' ? <Check className="h-3.5 w-3.5" /> : i + 1}
                </span>
                <span className={`whitespace-nowrap text-xs ${etat === 'encours' ? 'font-bold text-navy' : 'font-semibold text-muted'}`}>
                  {p.label}
                </span>
                {etat === 'fait' && <span className="sr-only">(terminée)</span>}
              </>
            );
            return (
              <li key={p.key} className="flex items-center">
                {i > 0 && <span className="mx-0.5 h-px w-3 bg-line" aria-hidden />}
                {isFacilitator ? (
                  <button
                    type="button"
                    onClick={() => onGo(p.key)}
                    aria-current={etat === 'encours' ? 'step' : undefined}
                    title={etat === 'encours' ? undefined : `Aller à l’étape « ${p.label} »`}
                    className="inline-flex items-center gap-1.5 rounded-full px-2 py-1 transition-colors hover:bg-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal"
                  >
                    {contenu}
                  </button>
                ) : (
                  <span aria-current={etat === 'encours' ? 'step' : undefined} className="inline-flex items-center gap-1.5 px-2 py-1">
                    {contenu}
                  </span>
                )}
              </li>
            );
          })}
        </ol>
      </nav>

      {isFacilitator && suivante && (
        <button
          type="button"
          onClick={() => onGo(suivante.key)}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-bold text-white transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal"
          style={{ background: RESOLUTION_ACCENT }}
        >
          Étape suivante : {suivante.label} <ArrowRight className="h-4 w-4" aria-hidden />
        </button>
      )}
    </div>
  );
};

export default ResolutionSteps;
