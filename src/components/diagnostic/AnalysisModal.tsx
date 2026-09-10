import React, { useEffect, useRef } from 'react';
import { X, Loader2 } from 'lucide-react';
import type { AnalysisResult } from '@/lib/diagnostic';
import { fmt, stateLabel, stateColor, stateBorder } from '@/lib/diagnostic';

interface AnalysisModalProps {
  open: boolean;
  loading: boolean;
  result: AnalysisResult | null;
  onClose: () => void;
  onStartModule?: (module: string) => void;
}

export const AnalysisModal: React.FC<AnalysisModalProps> = ({ open, loading, result, onClose, onStartModule }) => {
  const closeRef = useRef<HTMLButtonElement>(null);
  const lastFocusedRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) return;
    lastFocusedRef.current = document.activeElement as HTMLElement | null;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    closeRef.current?.focus();
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
      lastFocusedRef.current?.focus();
    };
  }, [open, onClose]);

  if (!open) return null;
  const n = result?.evaluatedCount ?? 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-dark/60 backdrop-blur-sm animate-fade-in" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div role="dialog" aria-modal="true" aria-labelledby="an-title" className="w-full max-w-2xl max-h-[90vh] flex flex-col bg-white rounded-2xl shadow-auth-modal overflow-hidden">
        <header className="flex items-center justify-between gap-4 px-6 py-5 bg-gradient-to-br from-navy-dark to-navy shrink-0">
          <div>
            <h2 id="an-title" className="text-base font-bold text-white">Analyse de vos résultats</h2>
            <p className="text-[11.5px] text-white/50 mt-0.5">{loading ? 'Génération en cours…' : `${n}/5 pilier${n > 1 ? 's' : ''} évalué${n > 1 ? 's' : ''}`}</p>
          </div>
          <button ref={closeRef} type="button" onClick={onClose} aria-label="Fermer l'analyse" className="w-7 h-7 inline-flex items-center justify-center rounded-full bg-white/12 text-white hover:bg-white/25 transition-colors">
            <X className="h-4 w-4" aria-hidden />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto px-6 py-5">
          {loading || !result ? (
            <div className="flex flex-col items-center justify-center gap-3 py-16 text-muted">
              <Loader2 className="h-7 w-7 animate-spin text-teal-dark" aria-hidden />
              <p className="text-sm">Analyse en cours…</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Récap scores */}
              <div className="flex flex-wrap gap-4 justify-center">
                {result.recap.map((r) => {
                  const col = stateColor(r.state);
                  return (
                    <div key={r.id} className="text-center min-w-[64px]">
                      <div className="text-2xl font-extrabold" style={{ color: col.c }}>{fmt(r.score)}</div>
                      <div className="text-[11px] text-muted font-medium">{r.label}</div>
                    </div>
                  );
                })}
              </div>

              {/* Bloc global */}
              <div className="bg-surface rounded-xl p-5 border border-line">
                <div className="flex items-center gap-3 mb-2">
                  <div className="text-3xl font-extrabold text-navy">{fmt(result.average)}<span className="text-base font-normal text-muted">/10</span></div>
                  <span className="px-3 py-1 rounded-full text-xs font-bold" style={{ background: stateColor(result.averageState).bg, color: stateColor(result.averageState).c }}>{stateLabel(result.averageState)}</span>
                </div>
                <p className="text-sm text-ink leading-relaxed">{result.globalMessage}</p>
              </div>

              {/* Axes prioritaires */}
              {result.priorities.length > 0 && (
                <Section title="Axes prioritaires">
                  {result.priorities.map((p, idx) => (
                    <div key={p.id} className="flex gap-3 mb-3 last:mb-0">
                      <div className="w-7 h-7 shrink-0 rounded-full flex items-center justify-center text-white text-sm font-bold" style={{ background: stateColor(p.state).c }}>{idx + 1}</div>
                      <div>
                        <div className="text-sm font-bold text-navy">{p.label} — {fmt(p.score)}/10</div>
                        <p className="text-[13px] text-muted leading-relaxed mt-0.5">{p.prio} {p.detail}</p>
                      </div>
                    </div>
                  ))}
                </Section>
              )}

              {/* Points d'appui */}
              {result.supports.length > 0 && (
                <Section title="Points d'appui">
                  {result.supports.map((s) => (
                    <div key={s.id} className="flex gap-3 mb-3 last:mb-0">
                      <div className="w-7 h-7 shrink-0 rounded-full bg-teal-light flex items-center justify-center text-teal-dark text-sm font-bold" aria-hidden>✓</div>
                      <div>
                        <div className="text-sm font-bold text-navy">{s.label} — {fmt(s.score)}/10</div>
                        <p className="text-[13px] text-muted leading-relaxed mt-0.5">{s.detail}</p>
                      </div>
                    </div>
                  ))}
                </Section>
              )}

              {/* Insights croisés */}
              {result.insights.length > 0 && (
                <Section title="Insights croisés">
                  {result.insights.map((r, i) => {
                    const ca = stateColor(r.sa), cb = stateColor(r.sb);
                    return (
                      <div key={i} className="bg-surface rounded-lg p-3.5 mb-2.5 last:mb-0 border-l-4" style={{ borderLeftColor: stateBorder(r.sa) }}>
                        <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                          <span className="px-2 py-0.5 rounded-full text-[11px] font-bold" style={{ background: ca.bg, color: ca.c }}>{r.labelA} — {stateLabel(r.sa)}</span>
                          <span className="text-muted text-xs" aria-hidden>×</span>
                          <span className="px-2 py-0.5 rounded-full text-[11px] font-bold" style={{ background: cb.bg, color: cb.c }}>{r.labelB} — {stateLabel(r.sb)}</span>
                        </div>
                        <p className="text-[13px] text-ink leading-relaxed">{r.t1}</p>
                        <p className="text-[13px] text-muted leading-relaxed mt-1">{r.t2}</p>
                      </div>
                    );
                  })}
                </Section>
              )}

              {/* Recommandation */}
              {result.reco && (
                <div className="bg-navy-dark rounded-xl px-5 py-4 flex items-center justify-between gap-4">
                  <div className="text-[12.5px] text-white/80 leading-relaxed">
                    <strong className="block text-white text-[13px] mb-0.5">{result.reco.title}</strong>
                    {result.reco.text}
                  </div>
                  {result.reco.kind === 'module' && result.reco.module && (
                    <button type="button" onClick={() => onStartModule?.(result.reco!.module as string)} className="shrink-0 px-4 py-2 bg-teal text-navy-dark text-[13px] font-bold rounded-lg hover:bg-teal-dark transition-colors">Démarrer →</button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        <footer className="flex items-center justify-between px-6 py-3.5 border-t border-line bg-surface shrink-0">
          <span className="text-[11.5px] text-muted">Analyse personnalisée Oskar</span>
          <button type="button" onClick={onClose} className="px-4 py-2 bg-navy text-white text-[13px] font-bold rounded-lg hover:bg-navy-light transition-colors">Fermer</button>
        </footer>
      </div>
    </div>
  );
};

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div>
    <div className="text-[11px] font-bold uppercase tracking-wider text-muted mb-3">{title}</div>
    {children}
  </div>
);

export default AnalysisModal;
