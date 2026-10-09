import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Pencil, Shuffle, X } from 'lucide-react';
import { EMOJI_CATALOG, emojiAuHasard } from './pokerLogic';

interface PokerCarteEmojiProps {
  /** Emoji de la personne (vide au tout premier rendu, le temps du tirage). */
  emoji: string;
  selected: boolean;
  locked: boolean;
  onVote: (emoji: string) => void;
  onChoose: (emoji: string) => void;
}

/**
 * Dernière carte de la suite « Fibonacci + » : chacun y voit son propre emoji,
 * tiré au hasard au départ, et peut le changer avec le crayon. Le choix
 * s'ouvre en fenêtre centrée (rendue dans <body>) : un panneau accroché à la
 * carte débordait de la zone de vote et obligeait à la faire défiler.
 */
export const PokerCarteEmoji: React.FC<PokerCarteEmojiProps> = ({ emoji, selected, locked, onVote, onChoose }) => {
  const [open, setOpen] = useState(false);

  // Fermeture à la touche Échap.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  const choisir = (e: string) => {
    onChoose(e);
    setOpen(false);
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => !locked && emoji && onVote(emoji)}
        disabled={locked || !emoji}
        aria-pressed={selected}
        aria-label={`Voter avec mon emoji ${emoji}`}
        className={[
          'flex items-center justify-center rounded-xl border-2 text-3xl transition-all sm:text-4xl',
          'h-[92px] w-[66px] shadow-card sm:h-[122px] sm:w-[90px]',
          selected
            ? 'border-navy bg-navy -translate-y-2.5 scale-105'
            : 'border-dashed border-line bg-white hover:-translate-y-2 hover:border-navy',
          locked ? 'cursor-not-allowed opacity-40 hover:translate-y-0' : 'cursor-pointer',
        ].join(' ')}
      >
        <span aria-hidden>{emoji}</span>
      </button>

      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-haspopup="dialog"
        title="Changer mon emoji"
        className="absolute -right-2 -top-2 z-10 flex h-7 w-7 items-center justify-center rounded-full border border-line bg-white text-navy shadow-card transition-colors hover:bg-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal"
      >
        <Pencil className="h-3.5 w-3.5" aria-hidden />
        <span className="sr-only">Changer mon emoji</span>
      </button>

      {open && createPortal(
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="poker-emoji-title"
          className="fixed inset-0 z-[210] flex items-center justify-center bg-navy/60 p-6"
          onClick={(e) => { if (e.target === e.currentTarget) setOpen(false); }}
        >
          <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-card-hover">
            <div className="mb-3 flex items-center gap-3">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border-2 border-dashed border-line text-3xl" aria-hidden>
                {emoji}
              </span>
              <h2 id="poker-emoji-title" className="flex-1 text-base font-bold text-navy">Choisir mon emoji</h2>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-muted transition-colors hover:bg-surface hover:text-navy"
              >
                <X className="h-4 w-4" aria-hidden />
                <span className="sr-only">Fermer</span>
              </button>
            </div>
            <div className="flex max-h-[50vh] flex-wrap gap-1 overflow-y-auto scrollbar-thin">
              {EMOJI_CATALOG.map((e, i) => (
                <button
                  key={`${e}-${i}`}
                  type="button"
                  onClick={() => choisir(e)}
                  aria-pressed={e === emoji}
                  className={[
                    'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border-[1.5px] text-xl transition-transform hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal',
                    e === emoji ? 'border-navy bg-surface' : 'border-transparent bg-surface hover:border-primary-200',
                  ].join(' ')}
                >
                  <span aria-hidden>{e}</span>
                  <span className="sr-only">Choisir {e}</span>
                </button>
              ))}
            </div>
            <div className="mt-4 flex justify-end">
              <button
                type="button"
                onClick={() => choisir(emojiAuHasard())}
                className="inline-flex items-center gap-1.5 rounded-lg border border-line px-3 py-1.5 text-sm font-semibold text-navy transition-colors hover:bg-surface"
              >
                <Shuffle className="h-4 w-4" aria-hidden /> Au hasard
              </button>
            </div>
          </div>
        </div>,
        document.body,
      )}
    </div>
  );
};

export default PokerCarteEmoji;
