import React from 'react';
import { useRouter } from 'next/router';
import { AlertCircle, AlertTriangle, Check, Target, Lightbulb } from 'lucide-react';
import type { ProductFitAnalysis } from '@/lib/productFit/types';

/*
 * Colonne de résultats, calquée sur `SynthesisPanel` de la page Diagnostic :
 * bloc sombre `bg-navy-dark rounded-card p-6` avec la note en 48px sur 10,
 * puis des cartes blanches `rounded-card` + `shadow-card` en 20px de padding.
 *
 * Une seule note affichée, sur 10 comme le Diagnostic : le double affichage
 * « Indice de Potentiel /100 » et « Note de douleur /10 » disait deux fois la
 * même chose dans deux unités différentes.
 */

interface ProductFitSynthesisProps {
  analysis: ProductFitAnalysis;
}

/** Même code couleur que le Diagnostic : fragile, en construction, solide. */
function tonIcone(ton: ProductFitAnalysis['verdictTone']) {
  if (ton === 'success') return <Check className="h-3.5 w-3.5 shrink-0" aria-hidden />;
  if (ton === 'warning' || ton === 'info') return <AlertTriangle className="h-3.5 w-3.5 shrink-0" aria-hidden />;
  return <AlertCircle className="h-3.5 w-3.5 shrink-0" aria-hidden />;
}

const TON_COULEURS: Record<ProductFitAnalysis['verdictTone'], { bg: string; c: string; barre: string }> = {
  success: { bg: '#e6faf7', c: '#00806e', barre: '#00d4b4' },
  info: { bg: '#e0f2fe', c: '#0369a1', barre: '#0ea5e9' },
  warning: { bg: '#fffbeb', c: '#b45309', barre: '#f59e0b' },
  danger: { bg: '#fff0ea', c: '#e2653f', barre: '#e2653f' }, // corail OsKaR
};

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

  const aDesResultats = personasResults.length > 0;
  const couleurs = TON_COULEURS[verdictTone];

  return (
    <div className="flex flex-col gap-4 lg:sticky lg:top-24">
      {/* Note du produit */}
      <section className="bg-navy-dark rounded-card p-6 text-white" aria-label="Résultat">
        <div className="text-[11px] font-bold uppercase tracking-widest text-white/40 mb-2">
          Votre résultat
        </div>
        {aDesResultats ? (
          <>
            <div className="text-5xl font-extrabold leading-none tracking-tight">
              {globalScoreOn10}
              <span className="text-lg font-normal text-white/35"> /10</span>
            </div>
            <span
              className="inline-flex items-center gap-1.5 mt-3 px-3.5 py-1.5 rounded-full text-[13px] font-bold"
              style={{ background: couleurs.bg, color: couleurs.c }}
            >
              {tonIcone(verdictTone)} {verdictLabel}
            </span>
          </>
        ) : (
          <div className="text-sm font-light italic text-white/30 mt-1">En attente de vos réponses…</div>
        )}
        <div className="h-1.5 bg-white/10 rounded-full overflow-hidden mt-4">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${aDesResultats ? globalPotentialScore : 0}%`,
              background: aDesResultats ? couleurs.barre : '#00d4b4',
            }}
          />
        </div>
        <p className="text-sm text-white/70 leading-relaxed mt-4">{verdictDescription}</p>
      </section>

      {/* Par qui commencer */}
      {priorityPersona && (
        <section className="bg-white rounded-card border border-line shadow-card p-5" aria-label="Votre premier client">
          <div className="flex items-center gap-2.5 mb-3">
            <span className="w-7 h-7 rounded-lg bg-teal text-navy-dark flex items-center justify-center shrink-0">
              <Target className="h-4 w-4" aria-hidden />
            </span>
            <div className="min-w-0">
              <div className="text-[11px] font-bold uppercase tracking-wider text-muted">
                Votre premier client
              </div>
              <h3 className="text-lg font-bold text-navy truncate">{priorityPersona.personaName}</h3>
            </div>
          </div>
          <p className="text-sm text-muted leading-relaxed">{priorityPersona.priorityExplanation}</p>
        </section>
      )}

      {/* Comparaison des trois profils */}
      {aDesResultats && (
        <section className="bg-white rounded-card border border-line shadow-card p-5" aria-label="Comparaison des profils">
          <div className="text-sm font-bold text-navy mb-3">Vos profils, comparés</div>
          <ul className="space-y-3">
            {personasResults.map((p) => (
              <li key={p.personaId}>
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <span className="text-sm text-ink truncate">{p.personaName}</span>
                  <span className="text-xs font-bold text-navy shrink-0">{p.scoreOn10}/10</span>
                </div>
                <div className="h-1.5 bg-surface rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${
                      p.isPriorityTarget ? 'bg-teal' : 'bg-navy/20'
                    }`}
                    style={{ width: `${Math.min(100, p.normalizedScore)}%` }}
                  />
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Ce qui va bien, ce qui inquiète */}
      {(strengths.length > 0 || vulnerabilities.length > 0) && (
        <section className="bg-white rounded-card border border-line shadow-card p-5 space-y-4" aria-label="Points d'attention">
          {strengths.length > 0 && (
            <div>
              <div className="flex items-center gap-1.5 text-sm font-bold text-navy mb-2">
                <Check className="h-3.5 w-3.5 text-teal-dark" aria-hidden />
                Vos atouts
              </div>
              <ul className="space-y-1.5">
                {strengths.map((texte, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-ink leading-snug">
                    <span className="text-teal-dark font-bold" aria-hidden>•</span>
                    <span>{texte}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {vulnerabilities.length > 0 && (
            <div className={strengths.length > 0 ? 'pt-4 border-t border-line' : ''}>
              <div className="flex items-center gap-1.5 text-sm font-bold text-navy mb-2">
                <AlertTriangle className="h-3.5 w-3.5 text-warning-600" aria-hidden />
                À surveiller
              </div>
              <ul className="space-y-1.5">
                {vulnerabilities.map((texte, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-ink leading-snug">
                    <span className="text-warning-600 font-bold" aria-hidden>•</span>
                    <span>{texte}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>
      )}

      {/* Quoi faire ensuite */}
      {actionRecommendations.length > 0 && (
        <section className="bg-white rounded-card border border-line shadow-card p-5" aria-label="Et maintenant">
          <div className="flex items-center gap-1.5 text-sm font-bold text-navy mb-3">
            <Lightbulb className="h-3.5 w-3.5 text-teal-dark" aria-hidden />
            Et maintenant ?
          </div>
          <ol className="space-y-2.5">
            {actionRecommendations.slice(0, 3).map((rec, i) => (
              <li key={i} className="rounded-lg bg-surface p-3">
                <div className="text-sm font-semibold text-navy mb-1">{rec.title}</div>
                <p className="text-xs text-muted leading-relaxed">{rec.advice}</p>
              </li>
            ))}
          </ol>
          <button
            type="button"
            onClick={() => router.push('/app/okr')}
            className="w-full justify-center inline-flex items-center px-4 py-3.5 mt-4 bg-navy text-white text-sm font-bold rounded-lg transition-all hover:bg-navy-light"
          >
            En faire un objectif →
          </button>
        </section>
      )}
    </div>
  );
};

export default ProductFitSynthesis;
