import React from 'react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts';
import { PILLARS, type PillarId } from '@/lib/diagnostic';

/* Radar du Diagnostic 2 : mêmes réglages que `RadarPiliers`, alimenté par les notes. */

const TickPilier = ({ x, y, payload, textAnchor }: { x: number; y: number; payload: { value: string; index: number }; textAnchor: 'start' | 'middle' | 'end' }) => (
  <text x={x} y={y} textAnchor={textAnchor} dominantBaseline="central" fill={PILLARS[payload.index]?.color ?? '#4b5494'} fontSize={12} fontWeight={700}>
    {payload.value}
  </text>
);

export default function Radar2({ notes }: { notes: Partial<Record<PillarId, number>> }) {
  const data = PILLARS.map((p) => ({ subject: p.label, value: notes[p.id] ?? 0 }));
  return (
    <ResponsiveContainer width="100%" height="100%">
      <RadarChart cx="50%" cy="50%" outerRadius="78%" data={data}>
        <PolarGrid stroke="rgba(30,45,125,0.1)" />
        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
        <PolarAngleAxis dataKey="subject" tick={(props: any) => <TickPilier {...props} />} />
        <PolarRadiusAxis angle={54} domain={[0, 10]} tickCount={6} tick={{ fill: '#9098c5', fontSize: 11 }} axisLine={false} tickFormatter={(v: number) => (v === 0 ? '' : String(v))} />
        <Radar name="Note" dataKey="value" stroke="#1e2d7d" strokeWidth={2} fill="#00d4b4" fillOpacity={0.12} isAnimationActive />
      </RadarChart>
    </ResponsiveContainer>
  );
}
