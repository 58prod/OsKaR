import React from 'react';
import { AlertCircle, AlertTriangle, Check, ArrowRight } from 'lucide-react';
import { COULEURS_PILIERS, type PilierId } from '@/constants/piliers';
import type { Pillar, PillarInput } from '@/lib/diagnostic';
import {
  objectiveScore,
  subjectiveScore,
  score as computeScore,
  fmt,
  stateOf,
  stateLabel,
  stateColor,
} from '@/lib/diagnostic';

interface PillarCardProps {
  pillar: Pillar;
  input: PillarInput;
  onSliderChange: (value: number) => void;
  onToggleCheck: (index: number) => void;
  onOpenModule: (pillar: Pillar) => void;
}

const StateIcon: React.FC<{ state: 'f' | 'c' | 's' }> = ({ state }) => {
  if (state === 'f') return <AlertCircle className="h-3.5 w-3.5 shrink-0" aria-hidden />;
  if (state === 'c') return <AlertTriangle className="h-3.5 w-3.5 shrink-0" aria-hidden />;
  return <Check className="h-3.5 w-3.5 shrink-0" aria-hidden />;
};

export const PillarCard: React.FC<PillarCardProps> = ({ pillar, input, onSliderChange, onToggleCheck, onOpenModule }) => {
  const checkedCount = input.checks.filter(Boolean).length;
  const obj = objectiveScore(input);
  const subj = subjectiveScore(input);
  const total = computeScore(input);
  const st = stateOf(total);
  const col = stateColor(st);
  // Code couleur du pilier dans le menu : liseré, intitulé, curseur, cases et bouton.
  const couleur = COULEURS_PILIERS[pillar.id as PilierId] ?? { DEFAULT: pillar.color, dark: pillar.color, light: '#f5f6fa' };

  return (
    <article className="bg-white rounded-card border border-line shadow-card p-5 mb-4" style={{ borderTop: `3px solid ${couleur.DEFAULT}` }}>
      <div className="flex items-stretch gap-3 mb-3">
        <span className="w-1 rounded-full" style={{ background: couleur.DEFAULT }} aria-hidden />
        <div>
          <div className="text-[11px] font-bold uppercase tracking-wider" style={{ color: couleur.dark }}>{pillar.module}</div>
          <h3 className="text-lg font-bold text-navy">{pillar.label}</h3>
        </div>
      </div>
      <p className="text-sm text-muted mb-4">{pillar.desc}</p>

      {input.touched && (
        <div className="grid grid-cols-3 gap-px rounded-lg overflow-hidden bg-navy-dark mb-4 animate-fade-in">
          <Breakdown label="Ressenti" value={fmt(subj)} />
          <Breakdown label="Critères objectifs" value={fmt(obj)} />
          <Breakdown label="Score hybride" value={fmt(total)} highlight />
        </div>
      )}

      <div className="mb-4">
        <span className="block text-sm font-semibold text-ink mb-2">Comment vous sentez-vous sur ce pilier&nbsp;?</span>
        <div className="flex items-center gap-3">
          <span className="text-xs text-muted" aria-hidden>0</span>
          <input
            type="range"
            min={0}
            max={10}
            step={1}
            value={input.slider}
            onChange={(e) => onSliderChange(parseInt(e.target.value, 10))}
            className="flex-1 h-1.5 cursor-pointer"
            style={{ accentColor: couleur.DEFAULT }}
            aria-label={`Ressenti sur le pilier ${pillar.label}, de 0 à 10`}
            aria-valuetext={`${input.slider} sur 10`}
          />
          <span className="text-xs text-muted" aria-hidden>10</span>
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-semibold text-ink">Critères objectifs</span>
          <span className="text-xs font-bold text-muted">{checkedCount}/3</span>
        </div>
        <ul className="space-y-1.5">
          {pillar.q.map((q, i) => {
            const checked = input.checks[i];
            return (
              <li key={i}>
                <label className="flex items-start gap-2.5 cursor-pointer group rounded-md p-1 -m-1 hover:bg-surface transition-colors">
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => onToggleCheck(i)}
                    className="mt-0.5 h-4 w-4 shrink-0 rounded border-line focus:ring-2 focus:ring-teal cursor-pointer"
                    style={{ accentColor: couleur.DEFAULT, color: couleur.DEFAULT }}
                  />
                  <span className="text-sm text-ink leading-snug">{q}</span>
                </label>
              </li>
            );
          })}
        </ul>
      </div>

      {input.touched && (
        <div className="flex items-center justify-between gap-3 mt-4 pt-4 border-t border-line animate-fade-in">
          <span
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold"
            style={{ background: col.bg, color: col.c }}
          >
            <StateIcon state={st} /> {stateLabel(st)}
          </span>
          <button
            type="button"
            onClick={() => onOpenModule(pillar)}
            className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-white rounded-lg transition-transform hover:-translate-y-0.5"
            style={{ background: couleur.DEFAULT }}
          >
            Ouvrir {pillar.module} <ArrowRight className="h-3.5 w-3.5" aria-hidden />
          </button>
        </div>
      )}
    </article>
  );
};

const Breakdown: React.FC<{ label: string; value: string; highlight?: boolean }> = ({ label, value, highlight }) => (
  <div className={`px-3 py-2.5 text-center ${highlight ? 'bg-navy' : 'bg-navy-dark'}`}>
    <div className="text-[10px] font-semibold uppercase tracking-wide text-white/40 mb-0.5">{label}</div>
    <div className="text-base font-bold text-white">
      {value}
      <span className="text-[11px] font-normal text-white/40"> /10</span>
    </div>
  </div>
);

export default PillarCard;
