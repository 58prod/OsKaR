import React from 'react';
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

      {/* Préférence personnelle : ne change rien chez les autres. */}
      <label
        className="mt-3 flex cursor-pointer select-none items-center justify-between gap-2 border-t border-line pt-2.5"
        title="Emojis, réactions et dessins envoyés par les autres. Réglage pour vous seulement ; les vôtres s’envolent toujours."
      >
        <span className="whitespace-nowrap text-xs font-semibold text-navy">Voir les réactions des autres</span>
        <span className="relative inline-flex h-[18px] w-8 shrink-0 items-center">
          <input
            type="checkbox"
            role="switch"
            checked={voirReactions}
            onChange={onToggleVoirReactions}
            className="peer h-full w-full cursor-pointer appearance-none rounded-full bg-line transition-colors checked:bg-teal focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal focus-visible:ring-offset-1"
          />
          <span
            aria-hidden
            className="pointer-events-none absolute left-[2px] h-[14px] w-[14px] rounded-full bg-white shadow transition-transform peer-checked:translate-x-[14px]"
          />
        </span>
      </label>
    </div>
  );
};

export default PokerReactions;
