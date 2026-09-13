import React from 'react';
import { Star, Eye } from 'lucide-react';
import type { ToolParticipant } from '@/hooks/useToolSession';
import { STAR_COLORS, type RotiResults as Results, type RotiState } from './rotiLogic';

interface RotiResultsProps {
  results: Results;
  state: RotiState;
  /** En ligne, plus les votants dont la connexion a décroché (`online: false`). */
  participants: (ToolParticipant & { online?: boolean })[];
}

/** Rangée d'étoiles statiques pour un score donné. */
export const StarRow: React.FC<{ value: number; size: number; color: string }> = ({ value, size, color }) => (
  <span className="inline-flex gap-0.5" aria-hidden>
    {[1, 2, 3, 4, 5].map((i) => (
      <Star
        key={i}
        style={{ width: size, height: size, color: i <= value ? color : '#e2e8f0', fill: i <= value ? color : 'none' }}
      />
    ))}
  </span>
);

/** Colonne de résultats ROTI : score moyen, distribution, votes individuels. */
export const RotiResults: React.FC<RotiResultsProps> = ({ results, state, participants }) => {
  if (!state.revealed) {
    return (
      <div className="rounded-card border-[1.5px] border-dashed border-line bg-white px-5 py-5 text-center text-sm text-muted">
        <Eye className="mx-auto mb-2 h-7 w-7 opacity-20" aria-hidden />
        Les notes restent masquées jusqu’à la révélation.
      </div>
    );
  }

  const heroColor = STAR_COLORS[results.starIndex] || '#94a3b8';
  // Ceux qui ont voté d'abord, puis les autres, estompés.
  const ordered = [
    ...participants.filter((p) => state.votes[p.id]),
    ...participants.filter((p) => !state.votes[p.id]),
  ];

  return (
    <div className="flex flex-col gap-3.5" aria-live="polite">
      {/* Score hero */}
      <div className="rounded-card border-[1.5px] border-teal bg-white p-5 text-center shadow-card">
        <div className="flex items-end justify-center gap-1">
          <span className="text-5xl font-black leading-none" style={{ color: heroColor }}>
            {results.avgRounded}
          </span>
          <span className="pb-1 text-sm font-medium text-muted">/ 5</span>
        </div>
        <div className="mt-2 flex justify-center">
          <StarRow value={results.starIndex} size={24} color={heroColor} />
        </div>
        <span
          className="mt-3 inline-block rounded-lg px-3 py-1.5 text-sm font-bold"
          style={{ background: results.verdict.bg, color: results.verdict.color }}
        >
          {results.verdict.label}
        </span>
        <div className="mt-2 text-xs text-muted">
          {results.count} vote{results.count > 1 ? 's' : ''}
        </div>
      </div>

      {/* Distribution */}
      <div className="rounded-card border border-line bg-white p-5 shadow-card">
        <div className="mb-3 text-xs font-bold uppercase tracking-wide text-muted">Distribution des votes</div>
        <ul className="flex flex-col gap-2">
          {results.distribution.map((d) => (
            <li key={d.star} className="flex items-center gap-2.5">
              <span className="w-[72px] shrink-0">
                <StarRow value={d.star} size={11} color={STAR_COLORS[d.star]} />
              </span>
              <span className="h-3.5 flex-1 overflow-hidden rounded-md bg-surface">
                <span
                  className="block h-full rounded-md transition-[width] duration-500"
                  style={{ width: `${d.pct}%`, background: STAR_COLORS[d.star] }}
                />
              </span>
              <span className="w-5 shrink-0 text-right text-sm font-bold text-navy">{d.count}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Votes individuels */}
      <div className="rounded-card border border-line bg-white p-5 shadow-card">
        <div className="mb-3 text-xs font-bold uppercase tracking-wide text-muted">Votes individuels</div>
        <ul className="flex flex-col gap-3">
          {ordered.map((p) => {
            const v = state.votes[p.id];
            return (
              <li key={p.id} className={`rounded-xl border border-line p-3 ${v ? '' : 'opacity-50'}`}>
                <div className="flex items-center gap-2">
                  <span
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
                    style={{ background: p.color }}
                    aria-hidden
                  >
                    {p.name.charAt(0).toUpperCase()}
                  </span>
                  <span className="min-w-0 flex-1 truncate text-sm font-bold text-navy">{p.name}</span>
                  {v ? (
                    <span className="inline-flex" aria-label={`${v.star} sur 5`}>
                      <StarRow value={v.star} size={13} color={STAR_COLORS[v.star]} />
                    </span>
                  ) : (
                    <span className="text-xs italic text-muted">n’a pas voté</span>
                  )}
                </div>
                {v?.comment && (
                  <p className="mt-1.5 break-words pl-9 text-sm italic text-muted">« {v.comment} »</p>
                )}
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
};

export default RotiResults;
