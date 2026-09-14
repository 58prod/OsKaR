import React from 'react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts';
import type { DiagnosticState } from '@/lib/diagnostic';
import { PILLARS, score as computeScore } from '@/lib/diagnostic';

/*
 * Radar des 5 piliers du Diagnostic. Isolé dans son propre fichier pour être
 * chargé à la demande par `SynthesisPanel` (`next/dynamic`) : la bibliothèque
 * de graphiques ne pèse plus sur le premier affichage de la page. Le rendu est
 * inchangé — le radar ne se dessinait déjà que dans le navigateur.
 */

/** Nom de chaque pilier autour du radar, dans sa couleur. */
const TickPilier = ({ x, y, payload, textAnchor }: { x: number; y: number; payload: { value: string; index: number }; textAnchor: 'start' | 'middle' | 'end' }) => (
  <text x={x} y={y} textAnchor={textAnchor} dominantBaseline="central" fill={PILLARS[payload.index]?.color ?? '#4b5494'} fontSize={12} fontWeight={700}>
    {payload.value}
  </text>
);

/** Point de chaque pilier sur le radar, dans sa couleur. */
const PointPilier = ({ cx, cy, index }: { cx: number; cy: number; index: number }) => (
  <circle key={index} cx={cx} cy={cy} r={4.5} fill={PILLARS[index]?.color ?? '#00d4b4'} stroke="#fff" strokeWidth={1.5} />
);

export default function RadarPiliers({ state }: { state: DiagnosticState }) {
  const radarData = PILLARS.map((p) => ({
    subject: p.label,
    value: state[p.id].touched ? computeScore(state[p.id]) : 0,
  }));

  return (
    <ResponsiveContainer width="100%" height="100%">
      <RadarChart cx="50%" cy="50%" outerRadius="78%" data={radarData}>
        <PolarGrid stroke="rgba(30,45,125,0.1)" />
        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
        <PolarAngleAxis dataKey="subject" tick={(props: any) => <TickPilier {...props} />} />
        {/* Graduations entre Vision (en haut) et Market Fit : sur l'axe vertical, « Vision » cachait le 10. */}
        <PolarRadiusAxis angle={54} domain={[0, 10]} tickCount={6} tick={{ fill: '#9098c5', fontSize: 11 }} axisLine={false} tickFormatter={(v: number) => v === 0 ? '' : String(v)} />
        <Radar
          name="Score"
          dataKey="value"
          stroke="#1e2d7d"
          strokeWidth={2}
          fill="#00d4b4"
          fillOpacity={0.12}
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          dot={(props: any) => <PointPilier key={props.index} cx={props.cx} cy={props.cy} index={props.index} />}
          isAnimationActive
        />
      </RadarChart>
    </ResponsiveContainer>
  );
}
