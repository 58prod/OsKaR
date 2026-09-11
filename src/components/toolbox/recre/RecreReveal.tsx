import React, { useMemo } from 'react';
import { ArrowRight, Eye, Heart, X } from 'lucide-react';
import { currentRevealPhoto, type RecreState } from './recreLogic';

interface RecreRevealProps {
  state: RecreState;
  myId: string;
  isFacilitator: boolean;
  onLike: (photoId: string) => void;
  onShowAuthor: () => void;
  onNext: () => void;
  onClose: () => void;
}

const CONFETTI_COLORS = ['#f59e0b', '#ec4899', '#00d4b4', '#6366f1', '#22c55e'];

/** Pluie de confettis aux couleurs de l'auteur (recréée à chaque dévoilement). */
const Confetti: React.FC<{ color: string }> = ({ color }) => {
  const pieces = useMemo(() => Array.from({ length: 40 }, (_, i) => ({
    key: i,
    left: `${10 + Math.random() * 80}%`,
    size: 6 + Math.random() * 6,
    color: [color, ...CONFETTI_COLORS][Math.floor(Math.random() * (CONFETTI_COLORS.length + 1))],
    round: Math.random() > 0.5,
    duration: `${0.8 + Math.random() * 0.8}s`,
    delay: `${Math.random() * 0.3}s`,
  })), [color]);
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      {pieces.map((p) => (
        <span
          key={p.key}
          className="absolute top-0 animate-confetti-fall opacity-0"
          style={{
            left: p.left,
            width: p.size,
            height: p.size,
            background: p.color,
            borderRadius: p.round ? '50%' : '1px',
            animationDuration: p.duration,
            animationDelay: p.delay,
          }}
        />
      ))}
    </div>
  );
};

/**
 * Mode révélation (maquette `recre.html`) : chaque photo passe en grand sur
 * l'écran de tous. On devine l'auteur, l'animateur le dévoile (confettis),
 * puis passe à la suivante. Tout le monde peut aimer la photo.
 */
export const RecreReveal: React.FC<RecreRevealProps> = ({
  state, myId, isFacilitator, onLike, onShowAuthor, onNext, onClose,
}) => {
  const current = currentRevealPhoto(state);
  if (!state.reveal || !current) return null;
  const { photo, position, total } = current;
  const liked = photo.likedBy.includes(myId);
  const count = photo.likedBy.length;
  const isLast = position >= total;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Mode révélation"
      className="absolute inset-0 z-50 flex flex-col items-center justify-center gap-5 overflow-hidden bg-[rgba(15,20,50,0.9)] p-6"
    >
      {state.reveal.authorShown && <Confetti key={photo.id} color={photo.authorColor} />}

      <span className="text-sm font-semibold tracking-wide text-white/50" aria-live="polite">
        {position} / {total}
      </span>

      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        key={photo.id}
        src={photo.url}
        alt={`Photo ${position} sur ${total}`}
        className="block max-h-[55vh] max-w-[80%] animate-pop rounded border-[10px] border-white object-contain shadow-[0_20px_60px_rgba(0,0,0,0.5)]"
      />

      <div className="flex min-h-[48px] items-center" aria-live="polite">
        {state.reveal.authorShown ? (
          <span className="inline-flex animate-pop items-center gap-2.5 rounded-xl bg-white px-5 py-2.5">
            <span className="h-3.5 w-3.5 rounded-full" style={{ background: photo.authorColor }} aria-hidden />
            <span className="text-base font-bold text-navy">{photo.authorName}</span>
          </span>
        ) : (
          <span className="text-sm font-semibold text-white/70">À votre avis, qui a posté cette photo ?</span>
        )}
      </div>

      <button
        type="button"
        onClick={() => onLike(photo.id)}
        aria-pressed={liked}
        className={`inline-flex items-center gap-1.5 rounded-full border-[1.5px] px-4 py-1.5 text-sm font-bold transition-colors ${
          liked ? 'border-[#ec4899] bg-[#ec4899]/15 text-[#f9a8d4]' : 'border-white/30 text-white hover:bg-white/10'
        }`}
      >
        <Heart className="h-4 w-4" style={{ fill: liked ? '#ec4899' : 'none', color: liked ? '#ec4899' : undefined }} aria-hidden />
        J&apos;aime{count > 0 && ` · ${count}`}
      </button>

      {isFacilitator ? (
        <div className="flex flex-wrap justify-center gap-2.5">
          {!state.reveal.authorShown && (
            <button
              type="button"
              onClick={onShowAuthor}
              className="inline-flex items-center gap-1.5 rounded-lg bg-teal px-5 py-2 text-sm font-bold text-navy transition-colors hover:bg-teal-dark"
            >
              <Eye className="h-4 w-4" aria-hidden /> Révéler l&apos;auteur
            </button>
          )}
          <button
            type="button"
            onClick={onNext}
            className="inline-flex items-center gap-1.5 rounded-lg border-[1.5px] border-white/30 bg-white/15 px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-white/25"
          >
            {isLast ? 'Terminer' : <>Photo suivante <ArrowRight className="h-4 w-4" aria-hidden /></>}
          </button>
        </div>
      ) : (
        <p className="text-xs text-white/50">L&apos;animateur fait défiler les photos.</p>
      )}

      {isFacilitator && (
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 inline-flex items-center gap-1 rounded-lg bg-white/15 px-3 py-1.5 text-sm font-semibold text-white transition-colors hover:bg-white/25"
        >
          <X className="h-4 w-4" aria-hidden /> Fermer
        </button>
      )}
    </div>
  );
};

export default RecreReveal;
