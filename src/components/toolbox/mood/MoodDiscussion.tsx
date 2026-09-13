import React from 'react';
import { ClipboardCopy } from 'lucide-react';
import { MoodRadar } from './MoodRadar';
import { MoodPoints } from './MoodPoints';
import {
  MOOD_ACCENT, MOOD_DIMS, averageOf, formatNote, type MoodDimKey, type MoodDimStat, type MoodState,
} from './moodLogic';

interface MoodDiscussionProps {
  stats: MoodDimStat[];
  globalAvg: number;
  state: MoodState;
  isFacilitator: boolean;
  onCollectiveChange: (key: MoodDimKey, value: number) => void;
  onCopySummary: () => void;
}

/**
 * Deuxième temps de l'atelier (repris de la maquette) : après l'échange,
 * l'équipe s'accorde sur une note par dimension. La moyenne des votes sert
 * de point de départ ; l'animateur ajuste, tout le monde voit le radar bouger.
 */
export const MoodDiscussion: React.FC<MoodDiscussionProps> = ({
  stats, globalAvg, state, isFacilitator, onCollectiveChange, onCopySummary,
}) => {
  const collective = state.collective;
  if (!collective) return null;
  const collectiveAvg = averageOf(MOOD_DIMS.map((d) => collective[d.key]));
  const data = stats.map((s) => ({ label: s.label, average: s.average, collective: collective[s.key] }));

  return (
    <div className="flex flex-1 overflow-hidden">
      <section
        aria-labelledby="mood-collective-title"
        className="relative flex w-[420px] shrink-0 flex-col gap-5 overflow-y-auto border-r border-line bg-white p-6"
      >
        <div>
          <h2 id="mood-collective-title" className="text-base font-bold text-navy">Ajustement collectif</h2>
          <p className="mt-1 text-sm text-muted">
            Échangez sur les résultats, puis mettez-vous d’accord sur une note par dimension. La moyenne des votes sert de point de départ
            {isFacilitator ? ' ; vous ajustez les curseurs.' : ' ; l’animateur ajuste les curseurs.'}
          </p>
        </div>

        {stats.map((s) => {
          const val = collective[s.key];
          const pct = ((val - 1) / 9) * 100;
          return (
            <div key={s.key}>
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: s.color }} aria-hidden />
                <label htmlFor={`mood-coll-${s.key}`} className="flex-1 text-sm font-bold text-navy">{s.label}</label>
                <span className="text-xs text-muted">moy. {formatNote(s.average)}</span>
                <span className="w-9 text-right text-sm font-extrabold" style={{ color: s.color }}>{formatNote(val)}</span>
              </div>
              <input
                id={`mood-coll-${s.key}`}
                type="range"
                min={1}
                max={10}
                step={0.5}
                value={val}
                disabled={!isFacilitator}
                onChange={(e) => onCollectiveChange(s.key, Number(e.target.value))}
                aria-valuetext={`${formatNote(val)} sur 10`}
                className="mt-1.5 h-2 w-full cursor-pointer appearance-none rounded-full outline-none focus-visible:ring-2 focus-visible:ring-teal disabled:cursor-default"
                style={{ background: `linear-gradient(to right, ${s.color} ${pct}%, #e2e8f0 ${pct}%)`, accentColor: s.color }}
              />
            </div>
          );
        })}

        <MoodPoints stats={stats} />

        <button
          type="button"
          onClick={onCopySummary}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-line px-4 py-2.5 text-sm font-semibold text-navy transition-colors hover:bg-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal"
        >
          <ClipboardCopy className="h-4 w-4" aria-hidden /> Copier la synthèse
        </button>
      </section>

      <div className="relative flex flex-1 flex-col items-center overflow-y-auto p-6">
        <div className="flex w-full max-w-2xl flex-col rounded-card border border-line bg-white p-6 shadow-card">
          <div className="flex flex-wrap justify-center gap-8 text-center">
            <div>
              <div className="text-4xl font-black text-[#00a58c]">{formatNote(globalAvg)}</div>
              <div className="text-xs font-semibold uppercase tracking-wide text-muted">Moyenne des votes</div>
            </div>
            <div>
              <div className="text-4xl font-black" style={{ color: MOOD_ACCENT }}>{formatNote(collectiveAvg)}</div>
              <div className="text-xs font-semibold uppercase tracking-wide text-muted">Note collective</div>
            </div>
          </div>
          <MoodRadar
            data={data}
            height={440}
            ariaLabel="Radar comparant la moyenne des votes et la note collective"
            series={[
              { key: 'average', label: 'Moyenne des votes', color: '#00d4b4', dashed: true, fillOpacity: 0.1 },
              { key: 'collective', label: 'Note collective', color: MOOD_ACCENT, fillOpacity: 0.15 },
            ]}
          />
        </div>
      </div>
    </div>
  );
};

export default MoodDiscussion;
