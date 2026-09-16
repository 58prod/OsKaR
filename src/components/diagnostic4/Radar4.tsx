import React from 'react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts';
import { PILLARS, type PillarId } from '@/lib/diagnostic';

/*
 * Radar du Diagnostic 4 : deux tracés superposés, le ressenti (pointillés)
 * et les preuves ramenées sur 10 (surface). L'écart se voit d'un coup d'œil.
 */

const TickPilier = ({ x, y, payload, textAnchor }: { x: number; y: number; payload: { value: string; index: number }; textAnchor: 'start' | 'middle' | 'end' }) => (
  <text x={x} y={y} textAnchor={textAnchor} dominantBaseline="central" fill={PILLARS[payload.index]?.color ?? '#4b5494'} fontSize={12} fontWeight={700}>
    {payload.value}
  </text>
);

export default function Radar4({ valeurs }: { valeurs: Partial<Record<PillarId, { ressenti: number; preuves: number }>> }) {
  const data = PILLARS.map((p) => ({ subject: p.label, ressenti: valeurs[p.id]?.ressenti ?? 0, preuves: valeurs[p.id]?.preuves ?? 0 }));
  return (
    <ResponsiveContainer width="100%" height="100%">
      <RadarChart cx="50%" cy="50%" outerRadius="76%" data={data}>
        <PolarGrid stroke="rgba(30,45,125,0.1)" />
        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
        <PolarAngleAxis dataKey="subject" tick={(props: any) => <TickPilier {...props} />} />
        <PolarRadiusAxis angle={54} domain={[0, 10]} tickCount={6} tick={false} axisLine={false} />
        <Radar name="Ressenti" dataKey="ressenti" stroke="#9098c5" strokeWidth={2} strokeDasharray="5 4" fill="none" isAnimationActive />
        <Radar name="Pratiques déclarées" dataKey="preuves" stroke="#1e2d7d" strokeWidth={2} fill="#00d4b4" fillOpacity={0.18} isAnimationActive />
      </RadarChart>
    </ResponsiveContainer>
  );
}
