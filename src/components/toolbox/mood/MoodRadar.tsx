import React from 'react';
import {
  Legend, Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer,
} from 'recharts';

export interface RadarSerie {
  /** Clé de la valeur dans chaque ligne de `data`. */
  key: string;
  label: string;
  color: string;
  dashed?: boolean;
  fillOpacity?: number;
}

interface MoodRadarProps {
  /** Une ligne par dimension : `label` + une valeur sur 10 par série. */
  data: Array<{ label: string } & Record<string, number | string>>;
  series: RadarSerie[];
  height: number;
  ariaLabel: string;
}

/** Radar des 5 dimensions (0 à 10), une ou plusieurs séries superposées. */
export const MoodRadar: React.FC<MoodRadarProps> = ({ data, series, height, ariaLabel }) => (
  <div className="w-full" style={{ height }} role="img" aria-label={ariaLabel}>
    <ResponsiveContainer width="100%" height="100%">
      <RadarChart data={data} outerRadius="70%">
        <PolarGrid stroke="#e2e8f0" />
        <PolarAngleAxis dataKey="label" tick={{ fill: '#1e2d7d', fontSize: 12, fontWeight: 600 }} />
        <PolarRadiusAxis domain={[0, 10]} tickCount={6} angle={90} tick={{ fill: '#94a3b8', fontSize: 10 }} />
        {series.map((s) => (
          <Radar
            key={s.key}
            name={s.label}
            dataKey={s.key}
            stroke={s.color}
            fill={s.color}
            fillOpacity={s.fillOpacity ?? 0.2}
            strokeWidth={2}
            strokeDasharray={s.dashed ? '5 4' : undefined}
            isAnimationActive={false}
          />
        ))}
        {series.length > 1 && <Legend wrapperStyle={{ fontSize: 12 }} />}
      </RadarChart>
    </ResponsiveContainer>
  </div>
);

export default MoodRadar;
