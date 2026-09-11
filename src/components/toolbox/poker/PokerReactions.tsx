import React from 'react';
import { EMOJI_CATALOG } from './pokerLogic';

interface PokerReactionsProps {
  onReact: (emoji: string) => void;
}

/** Panneau de réactions émoji partagées (diffusées à tous les participants). */
export const PokerReactions: React.FC<PokerReactionsProps> = ({ onReact }) => {
  return (
    <div className="rounded-card border-[1.5px] border-line bg-white p-4">
      <div className="mb-2.5 text-xs font-bold uppercase tracking-wide text-muted">Réactions</div>
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
