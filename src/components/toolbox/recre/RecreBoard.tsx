import React, { useEffect, useState } from 'react';
import { Heart, ImageIcon, Trash2, X } from 'lucide-react';
import { tiltFor, type RecreState } from './recreLogic';

interface RecreBoardProps {
  state: RecreState;
  myId: string;
  onToggleLike: (photoId: string) => void;
  onDeletePhoto: (photoId: string) => void;
}

/** Galerie « polaroid » des photos déposées, avec compteur de « j'aime ».
 * Chaque photo garde ses proportions (rien n'est rogné). Les photos restent
 * anonymes sur le board tant que leur auteur n'a pas été dévoilé en mode
 * révélation. */
export const RecreBoard: React.FC<RecreBoardProps> = ({ state, myId, onToggleLike, onDeletePhoto }) => {
  const [zoom, setZoom] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  useEffect(() => {
    if (!zoom && !confirmDeleteId) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      setZoom(null);
      setConfirmDeleteId(null);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [zoom, confirmDeleteId]);

  if (state.photos.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center p-10 text-center text-muted">
        <ImageIcon className="mb-3 h-12 w-12 opacity-20" aria-hidden />
        <p className="text-sm">Les photos déposées apparaîtront ici.</p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <ul className="columns-[190px] gap-6" aria-live="polite">
        {state.photos.map((photo, i) => {
          const liked = photo.likedBy.includes(myId);
          const count = photo.likedBy.length;
          const authorShown = state.authorsShown.includes(photo.id);
          return (
            <li
              key={photo.id}
              className="relative mb-6 break-inside-avoid rounded-md bg-white p-2.5 pb-3 shadow-card transition-transform rotate-[var(--tilt)] hover:z-10 hover:scale-[1.03]"
              // Inclinaison via variable : le zoom au survol (hover:scale) s'y ajoute.
              style={{ '--tilt': `${tiltFor(i)}deg` } as React.CSSProperties}
            >
              <button
                type="button"
                onClick={() => setZoom(photo.url)}
                className="block w-full overflow-hidden rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ec4899]"
                aria-label="Agrandir la photo"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={photo.url}
                  alt="Photo partagée sur le board"
                  loading="lazy"
                  className="mx-auto block h-auto max-h-[340px] w-auto max-w-full"
                />
              </button>
              <div className="mt-2 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => onToggleLike(photo.id)}
                  aria-pressed={liked}
                  aria-label={liked ? `Je n'aime plus (${count})` : `J'aime (${count})`}
                  className="inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-xs font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ec4899]"
                  style={{ color: liked ? '#ec4899' : '#94a3b8' }}
                >
                  <Heart className="h-3.5 w-3.5" style={{ fill: liked ? '#ec4899' : 'none' }} aria-hidden />
                  {count > 0 && count}
                </button>
                {authorShown && (
                  <span className="inline-flex min-w-0 items-center gap-1 text-[11px] font-bold text-muted">
                    <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: photo.authorColor }} aria-hidden />
                    <span className="truncate">{photo.authorName}</span>
                  </span>
                )}
                {photo.authorId === myId && (
                  <button
                    type="button"
                    onClick={() => setConfirmDeleteId(photo.id)}
                    aria-label="Supprimer ma photo"
                    className="ml-auto rounded-full p-1 text-muted transition-colors hover:bg-danger-50 hover:text-danger-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ec4899]"
                  >
                    <Trash2 className="h-3.5 w-3.5" aria-hidden />
                  </button>
                )}
              </div>
            </li>
          );
        })}
      </ul>

      {confirmDeleteId && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="recre-confirm-delete-title"
          className="fixed inset-0 z-[210] flex items-center justify-center bg-navy/60 p-6"
        >
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-card-hover">
            <h2 id="recre-confirm-delete-title" className="text-base font-bold text-navy">
              Supprimer votre photo ?
            </h2>
            <p className="mt-2 text-sm text-muted">
              Cette action est définitive : la photo sera retirée du board pour tout le monde.
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setConfirmDeleteId(null)}
                className="rounded-lg border border-line px-3 py-1.5 text-sm font-semibold text-navy transition-colors hover:bg-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={() => { onDeletePhoto(confirmDeleteId); setConfirmDeleteId(null); }}
                className="inline-flex items-center gap-1.5 rounded-lg bg-danger-600 px-3 py-1.5 text-sm font-bold text-white transition-colors hover:bg-danger-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-danger-600"
              >
                <Trash2 className="h-4 w-4" aria-hidden /> Supprimer
              </button>
            </div>
          </div>
        </div>
      )}

      {zoom && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Photo agrandie"
          onClick={() => setZoom(null)}
          className="fixed inset-0 z-[200] flex cursor-zoom-out items-center justify-center bg-navy/90 p-6"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={zoom} alt="Photo agrandie" className="max-h-[85vh] max-w-[88vw] rounded-sm border-8 border-white object-contain shadow-card-hover" />
          <button
            type="button"
            onClick={() => setZoom(null)}
            aria-label="Fermer"
            className="absolute right-5 top-5 inline-flex items-center gap-1 rounded-lg bg-white/15 px-3 py-1.5 text-sm font-semibold text-white transition-colors hover:bg-white/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
          >
            <X className="h-4 w-4" aria-hidden /> Fermer
          </button>
        </div>
      )}
    </div>
  );
};

export default RecreBoard;
