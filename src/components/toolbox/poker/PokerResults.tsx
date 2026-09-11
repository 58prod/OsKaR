import React from 'react';
import { Eye, PartyPopper, ThumbsUp, Zap } from 'lucide-react';
import type { PokerResults as Results, ConsensusLevel } from './pokerLogic';

interface PokerResultsProps {
  results: Results;
  revealed: boolean;
}

const CONSENSUS_UI: Record<Exclude<ConsensusLevel, 'none'>, { label: string; className: string; Icon: typeof PartyPopper }> = {
  perfect: { label: 'Consensus parfait !', className: 'bg-teal-light border-teal text-navy', Icon: PartyPopper },
  good: { label: 'Bonne convergence', className: 'bg-primary-50 border-primary-300 text-primary-700', Icon: ThumbsUp },
  diverge: { label: 'Discussion recommandée', className: 'bg-warning-100 border-warning-200 text-warning-800', Icon: Zap },
};

/** Colonne de résultats : moyenne, consensus, distribution. */
export const PokerResults: React.FC<PokerResultsProps> = ({ results, revealed }) => {
  if (!revealed) {
    return (
      <div className="rounded-card border-[1.5px] border-dashed border-line bg-white px-5 py-5 text-center text-sm text-muted">
        <Eye className="mx-auto mb-2 h-7 w-7 opacity-20" aria-hidden />
        Les résultats s'affichent après la révélation des cartes.
      </div>
    );
  }

  const consensus = results.consensus !== 'none' ? CONSENSUS_UI[results.consensus] : null;

  return (
    <div className="rounded-card border-[1.5px] border-teal bg-white p-5 shadow-card" aria-live="polite">
      <div className="py-2 text-center">
        <div className="text-5xl font-black leading-none text-navy">{results.average}</div>
        <div className="mt-1 text-sm font-medium text-muted">Estimation moyenne</div>
      </div>

      {consensus && (
        <div className={`mt-4 flex items-center gap-2 rounded-lg border-[1.5px] px-3.5 py-2.5 text-sm font-bold ${consensus.className}`}>
          <consensus.Icon className="h-4 w-4 shrink-0" aria-hidden />
          {consensus.label}
        </div>
      )}

      <div className="mt-4">
        <div className="mb-2.5 text-xs font-bold uppercase tracking-wide text-muted">Distribution</div>
        <ul className="flex flex-wrap gap-2">
          {results.distribution.map((d) => (
            <li key={d.value} className="min-w-[52px] flex-1 rounded-lg bg-surface px-3.5 py-2.5 text-center">
              <div className="text-xl font-extrabold text-navy">{d.value}</div>
              <div className="mt-0.5 text-xs font-medium text-muted">
                {d.count} vote{d.count > 1 ? 's' : ''}
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default PokerResults;
