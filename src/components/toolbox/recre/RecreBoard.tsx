import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Eye, Heart, ImageIcon, Trash2, X } from 'lucide-react';
import {
  placerEnColonnes, ratioAffiche, RECRE_COLONNES, RECRE_COLONNES_ETROIT, RECRE_LARGEUR_ETROITE, tiltFor,
  type RecreState,
} from './recreLogic';

interface RecreBoardProps {
  state: RecreState;
  myId: string;
  isFacilitator: boolean;
  onToggleLike: (photoId: string) => void;
  onDeletePhoto: (photoId: string) => void;
  /** Animateur : ouvrir le diaporama sur cette photo, pour toute l'équipe. */
  onShowToAll: (photoId: string) => void;
}

/** Galerie « polaroid » des photos déposées, avec compteur de « j'aime ».
 * Chaque photo garde ses proportions (rien n'est rogné). Les photos restent
 * anonymes sur le board tant que leur auteur n'a pas été dévoilé en mode
 * révélation.
 * Les colonnes sont construites ici plutôt qu'en colonnes CSS (`columns`) :
 * avec des cartes inclinées, le navigateur coupait parfois une carte entre
 * deux colonnes et laissait son cadre blanc vide dans la colonne voisine.
 * Leur nombre est fixe et chaque photo est placée d'après ses proportions
 * (`placerEnColonnes`) : tout le monde voit le même mur, dans le même ordre,
 * quelle que soit la taille de son écran. Les photos sont numérotées pour
 * pouvoir en parler (« la 7 ! »). */
export const RecreBoard: React.FC<RecreBoardProps> = ({
  state, myId, isFacilitator, onToggleLike, onDeletePhoto, onShowToAll,
}) => {
  const [zoomId, setZoomId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const grilleRef = useRef<HTMLDivElement>(null);
  const [etroit, setEtroit] = useState(false);
  // Proportions mesurées au chargement, pour les photos déposées avant la 2.72.
  const [mesures, setMesures] = useState<Record<string, number>>({});
  const vide = state.photos.length === 0;
  const zoom = state.photos.find((p) => p.id === zoomId) ?? null;

  useEffect(() => {
    const el = grilleRef.current;
    if (!el) return;
    const mesurer = () => setEtroit(el.clientWidth < RECRE_LARGEUR_ETROITE);
    mesurer();
    const ro = new ResizeObserver(mesurer);
    ro.observe(el);
    return () => ro.disconnect();
  }, [vide]);

  const nbColonnes = etroit ? RECRE_COLONNES_ETROIT : RECRE_COLONNES;
  const colonnes = useMemo(
    () => placerEnColonnes(state.photos, nbColonnes, (i) => mesures[state.photos[i].id]),
    [state.photos, nbColonnes, mesures],
  );

  useEffect(() => {
    if (!zoomId && !confirmDeleteId) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      setZoomId(null);
      setConfirmDeleteId(null);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [zoomId, confirmDeleteId]);

  if (vide) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center p-10 text-center text-muted">
        <ImageIcon className="mb-3 h-12 w-12 opacity-20" aria-hidden />
        <p className="text-sm">Les photos déposées apparaîtront ici.</p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <div ref={grilleRef} className="flex items-start gap-6" aria-live="polite">
        {colonnes.map((indexes, col) => (
          <ul key={col} className="flex min-w-0 flex-1 flex-col gap-6">
            {indexes.map((i) => {
              const photo = state.photos[i];
              const ratio = ratioAffiche(photo.ratio ?? mesures[photo.id]);
              const liked = photo.likedBy.includes(myId);
              const count = photo.likedBy.length;
              const authorShown = state.authorsShown.includes(photo.id);
              return (
                <li
                  key={photo.id}
                  className="relative rounded-md bg-white p-2.5 pb-3 shadow-card transition-transform rotate-[var(--tilt)] hover:z-10 hover:scale-[1.03]"
                  // Inclinaison via variable : le zoom au survol (hover:scale) s'y ajoute.
                  style={{ '--tilt': `${tiltFor(i)}deg` } as React.CSSProperties}
                >
                  <span
                    className="absolute -left-2 -top-2 z-[1] inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-navy px-1.5 text-[11px] font-bold text-white shadow-card"
                    aria-hidden
                  >
                    {i + 1}
                  </span>
                  <button
                    type="button"
                    onClick={() => setZoomId(photo.id)}
                    className="block w-full overflow-hidden rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ec4899]"
                    // Cadre aux proportions de la photo : la place est réservée
                    // avant le chargement, le mur ne bouge pas.
                    style={{ aspectRatio: String(ratio) }}
                    aria-label={`Agrandir la photo ${i + 1}`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={photo.url}
                      alt={`Photo ${i + 1} partagée sur le board`}
                      loading="lazy"
                      onLoad={photo.ratio ? undefined : (e) => {
                        const { naturalWidth: w, naturalHeight: h } = e.currentTarget;
                        if (w && h) setMesures((m) => (m[photo.id] ? m : { ...m, [photo.id]: w / h }));
                      }}
                      className="block h-full w-full object-contain"
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
        ))}
      </div>

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
          onClick={() => setZoomId(null)}
          className="fixed inset-0 z-[200] flex cursor-zoom-out flex-col items-center justify-center gap-4 bg-navy/90 p-6"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={zoom.url} alt="Photo agrandie" className="max-h-[78vh] max-w-[88vw] rounded-sm border-8 border-white object-contain shadow-card-hover" />
          {isFacilitator && !state.reveal && (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onShowToAll(zoom.id); setZoomId(null); }}
              className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg bg-[#ec4899] px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-[#db2777] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
            >
              <Eye className="h-4 w-4" aria-hidden /> Montrer à toute l&apos;équipe
            </button>
          )}
          <button
            type="button"
            onClick={() => setZoomId(null)}
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
