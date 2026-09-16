import React from 'react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts';
import { PILLARS, type PillarId } from '@/lib/diagnostic';

/*
 * Deux mesures distinctes. La page attend des valeurs disponibles sur tous
 * les piliers retenus ; Team est absent pour un indépendant.
 */

const TickPilier = ({ x, y, payload, textAnchor }: { x: number; y: number; payload: { value: string }; textAnchor: 'start' | 'middle' | 'end' }) => (
  <text x={x} y={y} textAnchor={textAnchor} dominantBaseline="central" fill={PILLARS.find((p) => p.label === payload.value)?.color ?? '#4b5494'} fontSize={12} fontWeight={700}>
    {payload.value}
  </text>
);

export default function Radar4({ valeurs }: { valeurs: { id: PillarId; perception: number; pratiques: number }[] }) {
  const data = valeurs.map((v) => ({ subject: PILLARS.find((p) => p.id === v.id)!.label, perception: v.perception, pratiques: v.pratiques }));
  return (
    <ResponsiveContainer width="100%" height="100%">
      <RadarChart cx="50%" cy="50%" outerRadius="76%" data={data}>
        <PolarGrid stroke="rgba(30,45,125,0.1)" />
        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
        <PolarAngleAxis dataKey="subject" tick={(props: any) => <TickPilier {...props} />} />
        <PolarRadiusAxis angle={54} domain={[0, 10]} tickCount={6} tick={false} axisLine={false} />
        <Radar name="Perception" dataKey="perception" stroke="#9098c5" strokeWidth={2} strokeDasharray="5 4" fill="none" isAnimationActive />
        <Radar name="Pratiques déclarées" dataKey="pratiques" stroke="#1e2d7d" strokeWidth={2} fill="#00d4b4" fillOpacity={0.18} isAnimationActive />
      </RadarChart>
    </ResponsiveContainer>
  );
}
