import React from 'react';
import { MessageCircleWarning } from 'lucide-react';
import { MOOD_LOW, MOOD_SPREAD, formatNote, pointsToDiscuss, type MoodDimStat } from './moodLogic';

/** Encadré « Points à discuter » : moyennes basses et avis très partagés. */
export const MoodPoints: React.FC<{ stats: MoodDimStat[] }> = ({ stats }) => {
  const points = pointsToDiscuss(stats);
  if (points.length === 0) {
    return (
      <div className="rounded-card border border-success-200 bg-success-50 p-4 text-sm text-success-800">
        Aucune dimension sous {MOOD_LOW} de moyenne ni d’avis très partagés.
      </div>
    );
  }
  return (
    <div className="rounded-card border border-warning-200 bg-warning-50 p-4">
      <div className="mb-2 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-warning-800">
        <MessageCircleWarning className="h-4 w-4" aria-hidden /> Points à discuter
      </div>
      <ul className="flex flex-col gap-1.5 text-sm text-navy">
        {points.map(({ stat, low, split }) => (
          <li key={stat.key} className="flex items-start gap-2">
            <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full" style={{ background: stat.color }} aria-hidden />
            <span>
              <strong>{stat.label}</strong>
              {low && <> · moyenne {formatNote(stat.average)}</>}
              {split && <> · avis partagés (de {stat.min} à {stat.max}, écart ≥ {MOOD_SPREAD})</>}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default MoodPoints;
