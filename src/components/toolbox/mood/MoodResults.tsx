import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import type { ToolParticipant } from '@/hooks/useToolSession';
import { MoodRadar, type RadarSerie } from './MoodRadar';
import { MoodPoints } from './MoodPoints';
import { MOOD_DIMS, averageOf, formatNote, type MoodDimStat, type MoodState } from './moodLogic';

interface MoodResultsProps {
  stats: MoodDimStat[];
  globalAvg: number;
  state: MoodState;
  /** En ligne, plus les votants dont la connexion a décroché (`online: false`). */
  participants: (ToolParticipant & { online?: boolean })[];
}

/**
 * Colonne de résultats : moral global, radar de l'équipe (et, au clic, celui
 * d'une personne), détail par dimension, points à discuter, notes individuelles.
 */
export const MoodResults: React.FC<MoodResultsProps> = ({ stats, globalAvg, state, participants }) => {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  if (!state.revealed) {
    return (
      <div className="rounded-card border-[1.5px] border-dashed border-line bg-white px-5 py-5 text-center text-sm text-muted">
        <Eye className="mx-auto mb-2 h-7 w-7 opacity-20" aria-hidden />
        Les notes restent masquées jusqu’à la révélation.
      </div>
    );
  }

  const voters = participants.filter((p) => state.votes[p.id]);
  const selected = !state.anonymous && selectedId ? voters.find((p) => p.id === selectedId) : undefined;
  const data = stats.map((s) => ({
    label: s.label,
    average: s.average,
    ...(selected ? { person: state.votes[selected.id].dims[s.key] } : {}),
  }));
  const series: RadarSerie[] = [{ key: 'average', label: 'Moyenne équipe', color: '#00d4b4' }];
  if (selected) series.push({ key: 'person', label: selected.name, color: selected.color, fillOpacity: 0.08 });

  return (
    <div className="flex flex-col gap-3.5" aria-live="polite">
      <div className="rounded-card border-[1.5px] border-teal bg-white p-5 shadow-card">
        <div className="text-center">
          <div className="text-5xl font-black leading-none text-navy">
            {formatNote(globalAvg)}<span className="text-lg font-medium text-muted"> / 10</span>
          </div>
          <div className="mt-1 text-sm font-medium text-muted">
            Moral global · {voters.length || Object.keys(state.votes).length} vote{Object.keys(state.votes).length > 1 ? 's' : ''}
          </div>
        </div>
        <MoodRadar data={data} series={series} height={260} ariaLabel="Radar de la moyenne d’équipe par dimension" />
      </div>

      <div className="rounded-card border border-line bg-white p-5 shadow-card">
        <div className="mb-3 text-xs font-bold uppercase tracking-wide text-muted">Par dimension</div>
        <ul className="flex flex-col gap-3">
          {stats.map((s) => (
            <li key={s.key}>
              <div className="flex items-baseline gap-2 text-sm">
                <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: s.color }} aria-hidden />
                <span className="flex-1 font-semibold text-navy">{s.label}</span>
                <span className="font-extrabold text-navy">{formatNote(s.average)}</span>
              </div>
              {/* Étendue des notes (de la plus basse à la plus haute) et moyenne. */}
              <div className="relative mt-1.5 h-2 rounded-full bg-surface" aria-label={`Notes de ${s.min} à ${s.max}`}>
                <span
                  className="absolute inset-y-0 rounded-full opacity-30"
                  style={{ left: `${((s.min - 1) / 9) * 100}%`, width: `${((s.max - s.min) / 9) * 100}%`, background: s.color, minWidth: 4 }}
                />
                <span
                  className="absolute top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow"
                  style={{ left: `${((s.average - 1) / 9) * 100}%`, background: s.color }}
                />
              </div>
              <div className="mt-0.5 text-[11px] text-muted">de {s.min} à {s.max}</div>
            </li>
          ))}
        </ul>
      </div>

      <MoodPoints stats={stats} />

      <div className="rounded-card border border-line bg-white p-5 shadow-card">
        <div className="mb-3 text-xs font-bold uppercase tracking-wide text-muted">Notes individuelles</div>
        {state.anonymous ? (
          <p className="flex items-start gap-2 text-sm text-muted">
            <EyeOff className="mt-0.5 h-4 w-4 shrink-0" aria-hidden /> Notes anonymes : seules les moyennes de l’équipe sont affichées.
          </p>
        ) : (
          <>
            <p className="mb-2.5 text-xs text-muted">Cliquez sur une personne pour superposer son radar.</p>
            <ul className="flex flex-col gap-2.5">
              {voters.map((p) => {
                const v = state.votes[p.id];
                const isSel = selectedId === p.id;
                return (
                  <li key={p.id}>
                    <button
                      type="button"
                      aria-pressed={isSel}
                      onClick={() => setSelectedId(isSel ? null : p.id)}
                      className={`w-full rounded-xl border p-3 text-left transition-colors hover:bg-surface ${isSel ? 'border-navy ring-1 ring-navy' : 'border-line'}`}
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
                          style={{ background: p.color }}
                          aria-hidden
                        >
                          {p.name.charAt(0).toUpperCase()}
                        </span>
                        <span className="min-w-0 flex-1 truncate text-sm font-bold text-navy">{p.name}</span>
                        <span className="text-sm font-extrabold text-navy">
                          {formatNote(averageOf(MOOD_DIMS.map((d) => v.dims[d.key])))}
                        </span>
                      </div>
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {MOOD_DIMS.map((d) => (
                          <span
                            key={d.key}
                            className="inline-flex items-center gap-1 rounded-md bg-surface px-2 py-1 text-xs font-semibold text-navy"
                            title={d.label}
                          >
                            <span className="h-2 w-2 rounded-full" style={{ background: d.color }} aria-hidden />
                            {d.label.slice(0, 3)} {v.dims[d.key]}
                          </span>
                        ))}
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          </>
        )}
      </div>
    </div>
  );
};

export default MoodResults;
