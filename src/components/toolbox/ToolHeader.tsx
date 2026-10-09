import React, { useState } from 'react';
import Link from 'next/link';
import { ChevronLeft, Lock, LogOut, Share2, Users } from 'lucide-react';

/** Animation réservée au créateur de la session, ou ouverte à tous. */
export interface FacilitatorLock {
  /** L'animation est réservée au créateur. */
  exclusive: boolean;
  /** La personne est le créateur : elle peut changer ce réglage. */
  canChange: boolean;
  onChange: (exclusive: boolean) => void;
}

interface ToolHeaderProps {
  title: string;
  /** Code de session affiché à côté du bouton Inviter. */
  sessionCode: string;
  isFacilitator: boolean;
  onToggleFacilitator: () => void;
  onShare: () => void;
  /** Quitter la session (bouton affiché seulement si fourni), après confirmation. */
  onLeave?: () => void;
  /** Texte de la confirmation de départ. */
  leaveLabel?: string;
  /** Outils qui permettent de réserver l'animation au créateur. */
  facilitatorLock?: FacilitatorLock;
}

/**
 * En-tête plein écran commun à tous les outils (hors AppShell : accessible
 * sans compte). Inclut le toggle « Mode animateur » auto-promu.
 */
export const ToolHeader: React.FC<ToolHeaderProps> = ({
  title, sessionCode, isFacilitator, onToggleFacilitator, onShare, onLeave, leaveLabel, facilitatorLock,
}) => {
  const [confirmLeave, setConfirmLeave] = useState(false);

  return (
    <header className="flex h-16 shrink-0 items-center gap-2 border-b border-line bg-white px-3 sm:gap-3.5 sm:px-5">
      <h1 className="min-w-0 flex-1 truncate text-[0.95rem] font-semibold text-navy">{title}</h1>

      {facilitatorLock?.exclusive && !facilitatorLock.canChange ? (
        <span
          className="inline-flex shrink-0 items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted"
          title="Le créateur de la session s’est réservé l’animation."
        >
          <Lock className="h-3.5 w-3.5" aria-hidden />
          <span className="max-sm:hidden">Animation réservée</span>
        </span>
      ) : (
        <label className="inline-flex shrink-0 cursor-pointer items-center gap-2 select-none">
          <span className="text-xs font-semibold uppercase tracking-wide text-muted max-sm:sr-only">Mode animateur</span>
          <span className="relative inline-flex h-[22px] w-10 items-center">
            <input
              type="checkbox"
              role="switch"
              checked={isFacilitator}
              onChange={onToggleFacilitator}
              className="peer h-full w-full cursor-pointer appearance-none rounded-full bg-line transition-colors checked:bg-teal focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal focus-visible:ring-offset-1"
            />
            <span
              aria-hidden
              className="pointer-events-none absolute left-[3px] h-4 w-4 rounded-full bg-white shadow transition-transform peer-checked:translate-x-[18px]"
            />
          </span>
        </label>
      )}

      {facilitatorLock?.canChange && (
        <button
          type="button"
          onClick={() => facilitatorLock.onChange(!facilitatorLock.exclusive)}
          aria-pressed={facilitatorLock.exclusive}
          title={facilitatorLock.exclusive
            ? 'L’animation vous est réservée. Cliquer pour laisser chacun prendre la main.'
            : 'Chacun peut activer le mode animateur. Cliquer pour vous réserver l’animation.'}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-line px-2.5 py-1.5 text-xs font-semibold text-navy transition-colors hover:bg-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal"
        >
          {facilitatorLock.exclusive
            ? <><Lock className="h-3.5 w-3.5" aria-hidden /> <span className="max-sm:sr-only">Moi uniquement</span></>
            : <><Users className="h-3.5 w-3.5" aria-hidden /> <span className="max-sm:sr-only">Ouvert à tous</span></>}
        </button>
      )}

      <button
        type="button"
        onClick={onShare}
        className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-line px-2.5 py-1.5 text-sm font-semibold text-navy transition-colors hover:bg-surface sm:px-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal"
      >
        <Share2 className="h-4 w-4" aria-hidden />
        <span className="max-sm:sr-only">Inviter</span>
        <span className="ml-1 font-mono text-xs font-bold tracking-wider text-muted max-sm:hidden">{sessionCode}</span>
      </button>

      {onLeave && (
        <button
          type="button"
          onClick={() => setConfirmLeave(true)}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-line px-2.5 py-1.5 text-sm font-semibold text-navy transition-colors hover:bg-surface sm:px-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal"
        >
          <LogOut className="h-4 w-4" aria-hidden />
          <span className="max-sm:sr-only">Quitter</span>
        </button>
      )}

      <Link
        href="/app/outils"
        className="ml-1 flex shrink-0 items-center gap-1.5 border-l border-line pl-2 text-xs sm:pl-3.5 font-medium text-muted transition-colors hover:text-navy"
      >
        <ChevronLeft className="h-3.5 w-3.5" aria-hidden />
        <span className="max-sm:sr-only">Boîte à outils</span>
      </Link>

      {onLeave && confirmLeave && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="tool-confirm-leave-title"
          className="fixed inset-0 z-[210] flex items-center justify-center bg-navy/60 p-6"
          onClick={(e) => { if (e.target === e.currentTarget) setConfirmLeave(false); }}
        >
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-card-hover">
            <h2 id="tool-confirm-leave-title" className="text-base font-bold text-navy">
              Quitter la session ?
            </h2>
            {leaveLabel && <p className="mt-2 text-sm text-muted">{leaveLabel}</p>}
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setConfirmLeave(false)}
                className="rounded-lg border border-line px-3 py-1.5 text-sm font-semibold text-navy transition-colors hover:bg-surface"
              >
                Rester
              </button>
              <button
                type="button"
                onClick={() => { setConfirmLeave(false); onLeave(); }}
                className="inline-flex items-center gap-1.5 rounded-lg bg-navy px-3 py-1.5 text-sm font-bold text-white transition-colors hover:bg-navy-light"
              >
                <LogOut className="h-4 w-4" aria-hidden /> Quitter
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

export default ToolHeader;
