import React from 'react';
import { ChevronLeft, ChevronRight, type LucideIcon } from 'lucide-react';

/**
 * Panneau latéral replié : un onglet vertical étroit (comme l'onglet
 * « Actions » de la maquette) qui laisse la place au tableau pendant la
 * discussion. Un clic rouvre le panneau.
 */
export const RetroPanelTab: React.FC<{
  side: 'left' | 'right';
  label: string;
  icon: LucideIcon;
  badge?: number;
  onOpen: () => void;
}> = ({ side, label, icon: Icon, badge, onOpen }) => {
  const Chevron = side === 'left' ? ChevronRight : ChevronLeft;
  return (
    <button
      type="button"
      onClick={onOpen}
      aria-label={`Ouvrir le panneau « ${label} »`}
      className={`flex w-10 shrink-0 flex-col items-center gap-2 bg-white py-3 text-muted transition-colors hover:bg-surface hover:text-navy ${
        side === 'left' ? 'border-r border-line' : 'border-l border-line'
      }`}
    >
      <Chevron className="h-4 w-4" aria-hidden />
      <Icon className="h-4 w-4" aria-hidden />
      <span className="text-xs font-bold [writing-mode:vertical-rl]">{label}</span>
      {badge !== undefined && badge > 0 && (
        <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-[#6366f1] px-1 text-[10px] font-bold text-white">
          {badge}
        </span>
      )}
    </button>
  );
};

/** Bouton « replier » placé dans l'en-tête d'un panneau ouvert. */
export const RetroPanelCollapse: React.FC<{ side: 'left' | 'right'; onClose: () => void }> = ({ side, onClose }) => {
  const Chevron = side === 'left' ? ChevronLeft : ChevronRight;
  return (
    <button
      type="button"
      onClick={onClose}
      aria-label="Replier le panneau"
      title="Replier le panneau"
      className="rounded-md p-1 text-muted transition-colors hover:bg-surface hover:text-navy"
    >
      <Chevron className="h-4 w-4" aria-hidden />
    </button>
  );
};

export default RetroPanelTab;
