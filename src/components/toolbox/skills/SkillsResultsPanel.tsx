import React, { useState } from 'react';
import {
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer,
} from 'recharts';
import { Radar as RadarIcon, Sparkles, Users } from 'lucide-react';
import {
  countScored, formatScore, isComplete, peopleOf, personRadarData, scoreColor, skillAverage, skillsHighlights,
  teamRadarData, type SkillHighlight, type SkillsRadarPoint, type SkillsState,
} from './skillsLogic';

interface SkillsResultsPanelProps {
  state: SkillsState;
}

type ResultsView = 'radars' | 'table';

/** Un radar individuel ou d'équipe (échelle fixe 0–10). */
const SkillRadarCard: React.FC<{ title: React.ReactNode; data: SkillsRadarPoint[]; color: string }> = ({
  title, data, color,
}) => (
  <div className="rounded-xl border border-line bg-white p-3 shadow-card" style={{ borderTop: `3px solid ${color}` }}>
    <div className="mb-1 flex items-center gap-1.5 text-sm font-bold text-navy">{title}</div>
    <div className="h-[220px] w-full" role="img" aria-label="Radar des notes par compétence">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart data={data} outerRadius="68%">
          <PolarGrid stroke="#f1f5f9" />
          <PolarAngleAxis dataKey="label" tick={{ fill: '#475569', fontSize: 10, fontWeight: 600 }} />
          <PolarRadiusAxis domain={[0, 10]} tickCount={6} tick={{ fill: '#94a3b8', fontSize: 9 }} />
          <Radar dataKey="value" stroke={color} fill={color} fillOpacity={0.15} strokeWidth={2} isAnimationActive={false} />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  </div>
);

const HighlightLine: React.FC<{ label: string; rows: SkillHighlight[]; tone: string; spread?: boolean }> = ({
  label, rows, tone, spread,
}) => (
  <li className="flex flex-wrap items-baseline gap-1.5">
    <span className="text-xs font-bold uppercase tracking-wide" style={{ color: tone }}>{label}</span>
    {rows.length === 0 ? (
      <span className="text-sm text-muted">—</span>
    ) : rows.map((r) => (
      <span key={r.skill.id} className="rounded-md bg-surface px-2 py-0.5 text-sm font-semibold text-navy">
        {r.skill.name}{' '}
        <span className="text-xs font-bold" style={{ color: tone }}>
          {spread ? `de ${r.min} à ${r.max}` : formatScore(r.average)}
        </span>
      </span>
    ))}
  </li>
);

/**
 * Panneau de résultats : points clés de l'équipe, puis radars individuels
 * et radar agrégé, ou vue tableau (notes par personne et moyennes), mis à
 * jour en direct.
 */
export const SkillsResultsPanel: React.FC<SkillsResultsPanelProps> = ({ state }) => {
  const [view, setView] = useState<ResultsView>('radars');
  const people = peopleOf(state);
  const scored = people.filter((p) => countScored(p, state.skills) > 0);
  const h = skillsHighlights(state);

  return (
    <div className="relative flex w-[46%] min-w-[340px] shrink-0 flex-col overflow-hidden bg-surface">
      <div className="flex items-center gap-2 border-b border-line bg-white px-4 py-2">
        <span className="text-xs font-bold uppercase tracking-wide text-muted">Vue</span>
        <div className="flex overflow-hidden rounded-lg border border-line" role="tablist" aria-label="Vue des résultats">
          {(['radars', 'table'] as const).map((v) => (
            <button
              key={v}
              type="button"
              role="tab"
              aria-selected={view === v}
              onClick={() => setView(v)}
              className={`px-3 py-1 text-xs font-bold transition-colors ${
                view === v ? 'bg-navy text-white' : 'bg-white text-muted hover:text-navy'
              }`}
            >
              {v === 'radars' ? 'Radars' : 'Tableau'}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {scored.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center gap-2 text-center text-sm text-muted">
            <RadarIcon className="h-10 w-10 opacity-20" aria-hidden />
            Les radars apparaîtront au fur et<br />à mesure des notes.
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {scored.length > 1 && (
              <div className="rounded-xl border border-line bg-white p-3 shadow-card">
                <p className="mb-2 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-muted">
                  <Sparkles className="h-4 w-4 text-teal-dark" aria-hidden /> Points clés de l’équipe
                </p>
                <ul className="flex flex-col gap-1.5" aria-live="polite">
                  <HighlightLine label="Forces" rows={h.forces} tone="#16a34a" />
                  <HighlightLine label="Axes de progrès" rows={h.progres} tone="#dc2626" />
                  <HighlightLine label="Avis très partagés" rows={h.heterogenes} tone="#b45309" spread />
                </ul>
              </div>
            )}

            {view === 'radars' ? (
              <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
                {scored.length > 1 && (
                  <SkillRadarCard
                    title={<><Users className="h-4 w-4 text-teal-dark" aria-hidden /> Équipe (moyenne)</>}
                    data={teamRadarData(state)}
                    color="#00d4b4"
                  />
                )}
                {scored.map((p) => (
                  <SkillRadarCard
                    key={p.id}
                    title={<><span className="h-2.5 w-2.5 rounded-full" style={{ background: p.color }} aria-hidden /> {p.name}{isComplete(p, state.skills) && <span className="ml-auto text-xs font-semibold text-teal-dark">✓ complet</span>}</>}
                    data={personRadarData(p, state.skills)}
                    color={p.color}
                  />
                ))}
              </div>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-line bg-white shadow-card">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-line text-left text-xs font-bold uppercase tracking-wide text-muted">
                      <th className="px-3 py-2">Compétence</th>
                      {people.map((p) => (
                        <th key={p.id} className="px-3 py-2">
                          <span className="inline-flex items-center gap-1.5 normal-case text-navy">
                            <span className="h-2 w-2 rounded-full" style={{ background: p.color }} aria-hidden />
                            {p.name}
                          </span>
                        </th>
                      ))}
                      {people.length > 1 && <th className="px-3 py-2">Moy.</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {state.skills.map((s) => {
                      const avg = skillAverage(state, s.id);
                      return (
                        <tr key={s.id} className="border-b border-line/60 last:border-b-0">
                          <td className="px-3 py-2 font-semibold text-navy">{s.name}</td>
                          {people.map((p) => {
                            const v = p.scores[s.id] ?? 0;
                            return (
                              <td key={p.id} className="px-3 py-2">
                                {v > 0 ? (
                                  <span className="inline-flex min-w-[28px] justify-center rounded-md px-1.5 py-0.5 text-xs font-bold text-white" style={{ background: scoreColor(v) }}>
                                    {v}
                                  </span>
                                ) : (
                                  <span className="text-line">—</span>
                                )}
                              </td>
                            );
                          })}
                          {people.length > 1 && (
                            <td className="px-3 py-2">
                              {avg > 0 ? (
                                <span className="inline-flex min-w-[28px] justify-center rounded-md px-1.5 py-0.5 text-xs font-bold text-white" style={{ background: scoreColor(avg) }}>
                                  {formatScore(avg)}
                                </span>
                              ) : (
                                <span className="text-line">—</span>
                              )}
                            </td>
                          )}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default SkillsResultsPanel;
