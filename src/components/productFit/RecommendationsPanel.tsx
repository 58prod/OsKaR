import React from 'react';
import { Lightbulb, ArrowRight, Target } from 'lucide-react';
import { useRouter } from 'next/router';
import type { ProductFitAnalysis } from '@/lib/productFit/types';

interface RecommendationsPanelProps {
  analysis: ProductFitAnalysis;
}

export const RecommendationsPanel: React.FC<RecommendationsPanelProps> = ({ analysis }) => {
  const router = useRouter();
  const { actionRecommendations, priorityPersona } = analysis;

  const getPriorityBadge = (prio: string) => {
    switch (prio) {
      case 'Haute':   return 'bg-red-100 text-red-800 border-red-200';
      case 'Moyenne': return 'bg-amber-100 text-amber-800 border-amber-200';
      default:        return 'bg-blue-100 text-blue-800 border-blue-200';
    }
  };

  const getCategoryIcon = (cat: string) => {
    if (cat.includes('Cible'))   return '🎯';
    if (cat.includes('Marché'))  return '🔍';
    if (cat.includes('Étape'))   return '⚡';
    return '💡';
  };

  if (actionRecommendations.length === 0) return null;

  return (
    <div className="bg-white rounded-3xl border border-line p-6 sm:p-8 shadow-card space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-teal-light text-teal-dark">
              <Lightbulb className="h-5 w-5" />
            </span>
            <h3 className="text-xl font-bold text-navy">Plan d'Action & Prochaines Étapes</h3>
          </div>
          <p className="text-xs text-muted mt-1">
            Recommandations concrètes pour <strong>valider votre marché</strong> et concentrer vos efforts sur votre cible prioritaire.
          </p>
        </div>

        <button
          type="button"
          onClick={() => router.push('/app/okr/dashboard')}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-navy text-white text-xs font-bold rounded-xl hover:bg-navy-light transition-all shadow-xs shrink-0"
        >
          <Target className="h-4 w-4 text-teal" />
          Créer un objectif OKR lié →
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {actionRecommendations.map((rec, index) => (
          <div
            key={index}
            className="p-5 rounded-2xl border border-line bg-surface/40 hover:bg-surface transition-colors flex flex-col justify-between space-y-3"
          >
            <div>
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-muted flex items-center gap-1">
                  {getCategoryIcon(rec.category)} {rec.category}
                </span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getPriorityBadge(rec.priority)}`}>
                  {rec.priority}
                </span>
              </div>
              <h4 className="font-bold text-navy text-sm leading-snug mb-1.5">{rec.title}</h4>
              <p className="text-xs text-muted leading-relaxed">{rec.advice}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
