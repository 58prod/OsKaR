import React from 'react';
import {
  CheckCircle2,
  AlertTriangle,
  Target,
  Info,
  Lightbulb,
  ArrowRight,
} from 'lucide-react';
import { useRouter } from 'next/router';
import type { ProductFitAnalysis } from '@/lib/productFit/types';

interface ProductFitSynthesisProps {
  analysis: ProductFitAnalysis;
}

export const ProductFitSynthesis: React.FC<ProductFitSynthesisProps> = ({ analysis }) => {
  const router = useRouter();
  const {
    globalPotentialScore,
    globalScoreOn10,
    verdictLabel,
    verdictDescription,
    verdictTone,
    priorityPersona,
    personasResults,
    strengths,
    vulnerabilities,
    actionRecommendations,
  } = analysis;

  const getToneBadgeClass = () => {
    switch (verdictTone) {
      case 'success': return 'bg-emerald-100 text-emerald-800 border-emerald-300';
      case 'info':    return 'bg-teal-light text-teal-dark border-teal/40';
      case 'warning': return 'bg-amber-100 text-amber-800 border-amber-300';
      case 'danger':  return 'bg-rose-100 text-rose-800 border-rose-300';
      default:        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 65) return 'text-emerald-600';
    if (score >= 40) return 'text-teal';
    if (score >= 20) return 'text-amber-600';
    return 'text-rose-600';
  };

  return (
    <div className="space-y-4">
      {/* 1. Score Global & Verdict Card */}
      <div className="bg-navy-dark text-white rounded-2xl p-5 sm:p-6 shadow-sm relative overflow-hidden">
        <div className="relative z-10 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] font-extrabold uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-white/10 text-teal">
              Résultat en direct
            </span>
            <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${getToneBadgeClass()}`}>
              {verdictLabel}
            </span>
          </div>

          <div className="flex items-baseline justify-between gap-4 pt-1">
            <div>
              <span className="text-xs text-white/60 font-semibold block">
                Indice de Potentiel
              </span>
              <div className="text-3xl sm:text-4xl font-black text-teal tracking-tight">
                {globalPotentialScore} <span className="text-sm font-semibold text-white/50">/ 100</span>
              </div>
            </div>

            <div className="text-right">
              <span className="text-[11px] text-white/60 font-semibold block">
                Note de douleur
              </span>
              <div className="text-2xl font-black text-white">
                {globalScoreOn10} <span className="text-xs font-semibold text-white/50">/ 10</span>
              </div>
            </div>
          </div>

          <p className="text-xs text-white/80 leading-relaxed pt-1">
            {verdictDescription}
          </p>
        </div>

        <div className="absolute -right-16 -top-16 w-52 h-52 bg-teal/10 rounded-full blur-[70px]" />
      </div>

      {/* 2. Cible Prioritaire Spotlight */}
      {priorityPersona && (
        <div className="bg-white rounded-2xl border-2 border-teal/40 p-4 sm:p-5 shadow-xs space-y-2.5">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-teal text-navy-dark rounded-lg">
                <Target className="h-4 w-4" />
              </div>
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-teal-dark block">
                  Cœur de Cible (Early Adopter)
                </span>
                <h4 className="text-sm font-bold text-navy">{priorityPersona.personaName}</h4>
              </div>
            </div>

            <div className="text-right">
              <span className="text-xs font-black text-navy">{priorityPersona.scoreOn10}/10</span>
              <span className="text-[10px] text-muted block">{priorityPersona.rawScore} pts</span>
            </div>
          </div>

          <p className="text-xs text-navy/80 bg-surface/60 p-2.5 rounded-xl leading-relaxed">
            {priorityPersona.priorityExplanation}
          </p>
        </div>
      )}

      {/* 3. Comparatif Rapide des Personas */}
      <div className="bg-white rounded-2xl border border-line p-4 sm:p-5 shadow-xs space-y-3">
        <div className="flex items-center justify-between text-xs">
          <h4 className="font-bold text-navy">Comparatif des 3 cibles</h4>
          <span className="text-[10px] text-muted">max 1000 pts</span>
        </div>

        <div className="space-y-2.5">
          {personasResults.map((p, idx) => (
            <div key={p.personaId} className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-navy truncate max-w-[180px]">
                  #{idx + 1} {p.personaName}
                </span>
                <span className={`font-bold ${getScoreColor(p.normalizedScore)}`}>
                  {p.scoreOn10}/10 ({p.rawScore} pts)
                </span>
              </div>
              <div className="w-full bg-surface h-2 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${
                    p.isPriorityTarget ? 'bg-teal' : 'bg-navy/20'
                  }`}
                  style={{ width: `${Math.min(100, p.normalizedScore)}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 4. Forces & Vigilances */}
      <div className="bg-white rounded-2xl border border-line p-4 sm:p-5 shadow-xs space-y-3">
        {strengths.length > 0 && (
          <div className="space-y-1.5">
            <span className="text-xs font-bold text-emerald-700 flex items-center gap-1.5">
              <CheckCircle2 className="h-3.5 w-3.5" /> Forces
            </span>
            <ul className="space-y-1 text-xs text-navy/80">
              {strengths.map((st, i) => (
                <li key={i} className="flex items-start gap-1.5">
                  <span className="text-emerald-500 font-bold">•</span>
                  <span>{st}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {vulnerabilities.length > 0 && (
          <div className="space-y-1.5 pt-2 border-t border-line/60">
            <span className="text-xs font-bold text-amber-700 flex items-center gap-1.5">
              <AlertTriangle className="h-3.5 w-3.5" /> Vigilances
            </span>
            <ul className="space-y-1 text-xs text-navy/80">
              {vulnerabilities.map((vuln, i) => (
                <li key={i} className="flex items-start gap-1.5">
                  <span className="text-amber-500 font-bold">•</span>
                  <span>{vuln}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* 5. Prochaines Étapes / Plan d'action */}
      {actionRecommendations.length > 0 && (
        <div className="bg-white rounded-2xl border border-line p-4 sm:p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-navy flex items-center gap-1.5">
              <Lightbulb className="h-3.5 w-3.5 text-teal-dark" /> Prochaines étapes recommandées
            </span>
            <button
              onClick={() => router.push('/app/okr/dashboard')}
              className="text-[11px] font-bold text-teal-dark hover:underline flex items-center gap-1"
            >
              Créer un OKR →
            </button>
          </div>

          <div className="space-y-2">
            {actionRecommendations.slice(0, 3).map((rec, i) => (
              <div key={i} className="bg-surface/50 p-2.5 rounded-xl border border-line/60 text-xs">
                <div className="font-bold text-navy mb-0.5">{rec.title}</div>
                <p className="text-[11.5px] text-muted leading-snug">{rec.advice}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
