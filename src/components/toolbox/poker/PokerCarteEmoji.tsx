import React, { useEffect, useRef, useState } from 'react';
import { Pencil, Shuffle } from 'lucide-react';
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
 * tiré au hasard au départ, et peut le changer avec le crayon.
 */
export const PokerCarteEmoji: React.FC<PokerCarteEmojiProps> = ({ emoji, selected, locked, onVote, onChoose }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Fermeture au clic à côté et à la touche Échap.
  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('pointerdown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const choisir = (e: string) => {
    onChoose(e);
    setOpen(false);
  };

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => !locked && emoji && onVote(emoji)}
        disabled={locked || !emoji}
        aria-pressed={selected}
        aria-label={`Voter avec mon emoji ${emoji}`}
        className={[
          'flex items-center justify-center rounded-xl border-2 text-4xl transition-all',
          'h-[122px] w-[90px] shadow-card',
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

      {open && (
        <div
          role="dialog"
          aria-label="Choisir mon emoji"
          className="absolute left-0 top-full z-30 mt-2 w-[296px] rounded-xl border border-line bg-white p-3 shadow-card-hover"
        >
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wide text-muted">Mon emoji</span>
            <button
              type="button"
              onClick={() => choisir(emojiAuHasard())}
              className="inline-flex items-center gap-1 rounded-lg border border-line px-2 py-1 text-xs font-semibold text-navy transition-colors hover:bg-surface"
            >
              <Shuffle className="h-3.5 w-3.5" aria-hidden /> Au hasard
            </button>
          </div>
          <div className="flex max-h-[200px] flex-wrap gap-1 overflow-y-auto scrollbar-thin">
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
        </div>
      )}
    </div>
  );
};

export default PokerCarteEmoji;
