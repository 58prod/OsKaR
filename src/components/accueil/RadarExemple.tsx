import React from 'react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer } from 'recharts';

/*
 * Radar d'exemple de la page d'accueil. Isolé dans son propre fichier pour être
 * chargé à la demande (`next/dynamic`) : la bibliothèque de graphiques ne pèse
 * plus sur le premier chargement de l'accueil. Le rendu est inchangé — le radar
 * ne se dessinait déjà que dans le navigateur.
 */

const RADAR_DATA = [
  { subject: 'Vision', A: 70 },
  { subject: 'Market Fit', A: 45 },
  { subject: 'Finance', A: 55 },
  { subject: 'OKR', A: 38 },
  { subject: 'Team', A: 71 },
];

export default function RadarExemple() {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <RadarChart cx="50%" cy="50%" outerRadius="80%" data={RADAR_DATA}>
        <PolarGrid stroke="#e2e4f0" />
        <PolarAngleAxis dataKey="subject" tick={{ fill: '#1e2d7d', fontSize: 11, fontWeight: 600 }} />
        <Radar
          name="Score"
          dataKey="A"
          stroke="#1e2d7d"
          fill="#00d4b4"
          fillOpacity={0.2}
          dot={{ r: 4, fill: '#00d4b4', stroke: '#1e2d7d' }}
        />
      </RadarChart>
    </ResponsiveContainer>
  );
}
