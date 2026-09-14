import React from 'react';
import { AlertCircle, AlertTriangle, Check, FileText, Save, RotateCcw, Loader2 } from 'lucide-react';
import dynamic from 'next/dynamic';
import type { DiagnosticState } from '@/lib/diagnostic';
import { PILLARS, score as computeScore, fmt, stateOf, stateLabel, stateColor, stateBorder } from '@/lib/diagnostic';

// Chargé à la demande : la bibliothèque de graphiques ne ralentit plus le
// premier affichage du Diagnostic.
const RadarPiliers = dynamic(() => import('./RadarPiliers'), { ssr: false });

interface SynthesisPanelProps {
  state: DiagnosticState;
  onAnalyse: () => void;
  onSave: () => void;
  onRestore: () => void;
  onDownloadPdf: () => void;
  saving?: boolean;
  restoring?: boolean;
}

const StateIcon: React.FC<{ state: 'f' | 'c' | 's' }> = ({ state }) => {
  if (state === 'f') return <AlertCircle className="h-3.5 w-3.5 shrink-0" aria-hidden />;
  if (state === 'c') return <AlertTriangle className="h-3.5 w-3.5 shrink-0" aria-hidden />;
  return <Check className="h-3.5 w-3.5 shrink-0" aria-hidden />;
};

export const SynthesisPanel: React.FC<SynthesisPanelProps> = ({ state, onAnalyse, onSave, onRestore, onDownloadPdf, saving = false, restoring = false }) => {
  const evaluated = PILLARS.filter((p) => state[p.id].touched);
  const hasData = evaluated.length > 0;
  const scores = evaluated.map((p) => computeScore(state[p.id]));
  const average = scores.length ? scores.reduce((a, b) => a + b, 0) / scores.length : null;
  const avgState = average !== null ? stateOf(average) : null;
  const avgCol = avgState ? stateColor(avgState) : null;

  return (
    <div className="flex flex-col gap-4 lg:sticky lg:top-24">
      {/* Score global */}
      <section className="bg-navy-dark rounded-card p-6 text-white" aria-label="Score global">
        <div className="text-[11px] font-bold uppercase tracking-widest text-white/40 mb-2">Score global</div>
        {average !== null && avgState && avgCol ? (
          <>
            <div className="text-5xl font-extrabold leading-none tracking-tight">
              {fmt(average)}
              <span className="text-lg font-normal text-white/35"> /10</span>
            </div>
            <span
              className="inline-flex items-center gap-1.5 mt-3 px-3.5 py-1.5 rounded-full text-[13px] font-bold"
              style={{ background: avgCol.bg, color: avgCol.c }}
            >
              <StateIcon state={avgState} /> {stateLabel(avgState)}
            </span>
          </>
        ) : (
          <div className="text-sm font-light italic text-white/30 mt-1">En attente d’évaluation…</div>
        )}
        <div className="h-1.5 bg-white/10 rounded-full overflow-hidden mt-4">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{ width: `${(average ?? 0) * 10}%`, background: avgState ? stateBorder(avgState) : '#00d4b4' }}
          />
        </div>
      </section>

      {/* Radar */}
      <section className="bg-white rounded-card border border-line shadow-card p-5" aria-label="Radar des 5 piliers">
        <div className="text-sm font-bold text-navy mb-3">Radar OSKAR</div>
        <div className="w-full h-60">
          <RadarPiliers state={state} />
        </div>
      </section>

      {/* Actions */}
      <button
        type="button"
        onClick={onAnalyse}
        disabled={!hasData}
        className="w-full justify-center inline-flex items-center px-4 py-3.5 bg-navy text-white text-sm font-bold rounded-lg transition-all hover:bg-navy-light disabled:opacity-40 disabled:cursor-not-allowed"
      >
        Analyser mes résultats →
      </button>

      {/* Enregistrer / Restaurer */}
      <div className="grid grid-cols-2 gap-2.5">
        <button
          type="button"
          onClick={onSave}
          disabled={!hasData || saving}
          className="justify-center inline-flex items-center gap-2 px-3 py-3 bg-white text-navy text-sm font-semibold border-[1.5px] border-line rounded-lg transition-all hover:border-navy disabled:opacity-35 disabled:cursor-not-allowed"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <Save className="h-4 w-4" aria-hidden />}
          Enregistrer
        </button>
        <button
          type="button"
          onClick={onRestore}
          disabled={restoring}
          className="justify-center inline-flex items-center gap-2 px-3 py-3 bg-white text-navy text-sm font-semibold border-[1.5px] border-line rounded-lg transition-all hover:border-navy disabled:opacity-35 disabled:cursor-not-allowed"
        >
          {restoring ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <RotateCcw className="h-4 w-4" aria-hidden />}
          Restaurer
        </button>
      </div>

      <button
        type="button"
        onClick={onDownloadPdf}
        disabled={!hasData}
        className="w-full justify-center inline-flex items-center gap-2 px-4 py-3 bg-white text-navy text-sm font-semibold border-[1.5px] border-line rounded-lg transition-all hover:border-navy disabled:opacity-35 disabled:cursor-not-allowed"
      >
        <FileText className="h-4 w-4" aria-hidden />
        Télécharger la synthèse PDF
      </button>
    </div>
  );
};

export default SynthesisPanel;
