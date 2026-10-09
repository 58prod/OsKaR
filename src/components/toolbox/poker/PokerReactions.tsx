import React from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { EMOJI_CATALOG } from './pokerLogic';

interface PokerReactionsProps {
  onReact: (emoji: string) => void;
  /** Les réactions et dessins des autres s'envolent-ils chez moi ? */
  voirReactions: boolean;
  onToggleVoirReactions: () => void;
}

/** Panneau de réactions émoji partagées (diffusées à tous les participants). */
export const PokerReactions: React.FC<PokerReactionsProps> = ({ onReact, voirReactions, onToggleVoirReactions }) => {
  return (
    <div className="rounded-card border-[1.5px] border-line bg-white p-4">
      <div className="mb-2.5 flex items-center justify-between gap-2">
        <span className="text-xs font-bold uppercase tracking-wide text-muted">Réactions</span>
        {/* Préférence personnelle : ne change rien chez les autres. */}
        <button
          type="button"
          onClick={onToggleVoirReactions}
          aria-pressed={!voirReactions}
          title={voirReactions
            ? 'Ne plus voir les emojis, réactions et dessins envoyés par les autres (chez vous seulement)'
            : 'Voir à nouveau les emojis, réactions et dessins envoyés par les autres'}
          className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] font-semibold text-muted transition-colors hover:bg-surface hover:text-navy focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal"
        >
          {voirReactions
            ? <><Eye className="h-3.5 w-3.5" aria-hidden /> Celles des autres : visibles</>
            : <><EyeOff className="h-3.5 w-3.5" aria-hidden /> Celles des autres : masquées</>}
        </button>
      </div>
      <div
        className="relative flex max-h-[120px] flex-wrap gap-1 overflow-y-auto scrollbar-thin"
        role="group"
        aria-label="Envoyer une réaction"
      >
        {EMOJI_CATALOG.map((emoji, i) => (
          <button
            key={`${emoji}-${i}`}
            type="button"
            onClick={() => onReact(emoji)}
            title={`Envoyer ${emoji}`}
            className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border-[1.5px] border-transparent bg-surface text-xl transition-transform hover:scale-110 hover:border-primary-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal active:scale-95"
          >
            <span aria-hidden>{emoji}</span>
            <span className="sr-only">Envoyer la réaction {emoji}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default PokerReactions;
