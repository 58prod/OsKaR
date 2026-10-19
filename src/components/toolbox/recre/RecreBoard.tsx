import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Eye, Heart, ImageIcon, Minus, Plus, Star, Trash2, X } from 'lucide-react';
import {
  placerEnColonnes, ratioAffiche, RECRE_COLONNES, RECRE_COLONNES_ETROIT, RECRE_LARGEUR_ETROITE, tiltFor,
  type RecreState,
} from './recreLogic';

/** Niveaux de zoom du board (1 = largeur de l'écran), propres à chacun. */
const NIVEAUX_ZOOM = [0.5, 0.6, 0.7, 0.85, 1, 1.25, 1.5, 2];
const CLE_ZOOM = 'oskar.recre.zoom';

function zoomMemorise(): number {
  try {
    const v = Number(window.localStorage.getItem(CLE_ZOOM));
    return NIVEAUX_ZOOM.includes(v) ? v : 1;
  } catch {
    return 1;
  }
}

interface RecreBoardProps {
  state: RecreState;
  myId: string;
  isFacilitator: boolean;
  onToggleLike: (photoId: string) => void;
  onDeletePhoto: (photoId: string) => void;
  /** Animateur : ouvrir le diaporama sur cette photo, pour toute l'équipe. */
  onShowToAll: (photoId: string) => void;
  /** Animateur : mettre la photo en avant sur le board (ou la retirer). */
  onToggleHighlight: (photoId: string) => void;
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
 * pouvoir en parler (« la 7 ! »).
 * L'animateur peut aussi, sans lancer le diaporama, mettre une photo en avant :
 * elle se redresse, grossit et s'encadre de rose chez tout le monde, les
 * autres s'estompent, et chacun la voit défiler jusqu'à elle. */
export const RecreBoard: React.FC<RecreBoardProps> = ({
  state, myId, isFacilitator, onToggleLike, onDeletePhoto, onShowToAll, onToggleHighlight,
}) => {
  const [zoomId, setZoomId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const cadreRef = useRef<HTMLDivElement>(null);
  const [etroit, setEtroit] = useState(false);
  // Zoom du board : seulement chez soi, il agrandit ou réduit le mur sans
  // changer le nombre de colonnes (le mur reste le même pour tous).
  const [niveau, setNiveau] = useState(1);
  useEffect(() => { setNiveau(zoomMemorise()); }, []);
  const changerNiveau = (pas: 1 | -1 | 0) => {
    const i = NIVEAUX_ZOOM.indexOf(niveau);
    const suivant = pas === 0 ? 1 : NIVEAUX_ZOOM[Math.min(NIVEAUX_ZOOM.length - 1, Math.max(0, i + pas))];
    setNiveau(suivant);
    try { window.localStorage.setItem(CLE_ZOOM, String(suivant)); } catch { /* navigation privée */ }
  };
  // Proportions mesurées au chargement, pour les photos déposées avant la 2.72.
  const [mesures, setMesures] = useState<Record<string, number>>({});
  const vide = state.photos.length === 0;
  const zoom = state.photos.find((p) => p.id === zoomId) ?? null;

  useEffect(() => {
    const el = cadreRef.current;
    if (!el) return;
    const mesurer = () => setEtroit(el.clientWidth < RECRE_LARGEUR_ETROITE);
    mesurer();
    const ro = new ResizeObserver(mesurer);
    ro.observe(el);
    return () => ro.disconnect();
  }, [vide]);

  // La photo mise en avant défile jusqu'au centre de l'écran de chacun.
  const enAvant = state.highlightedId;
  useEffect(() => {
    if (!enAvant) return;
    document.getElementById(`recre-photo-${enAvant}`)?.scrollIntoView({ block: 'center', behavior: 'smooth' });
  }, [enAvant]);

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

  const iNiveau = NIVEAUX_ZOOM.indexOf(niveau);
  const boutonZoom =
    'inline-flex h-8 w-8 items-center justify-center rounded-lg text-navy transition-colors hover:bg-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ec4899] disabled:cursor-not-allowed disabled:opacity-30';

  return (
    <div className="relative flex min-w-0 flex-1 flex-col">
      <div ref={cadreRef} className="flex-1 overflow-auto px-8 pb-16 pt-10">
        <div
          className="mx-auto flex items-start gap-5 transition-[width] duration-200"
          style={{ width: `${niveau * 100}%` }}
          aria-live="polite"
        >
          {colonnes.map((indexes, col) => (
            <ul key={col} className="flex min-w-0 flex-1 flex-col gap-5">
              {indexes.map((i) => {
                const photo = state.photos[i];
                const ratio = ratioAffiche(photo.ratio ?? mesures[photo.id]);
                const liked = photo.likedBy.includes(myId);
                const count = photo.likedBy.length;
                const authorShown = state.authorsShown.includes(photo.id);
                const misEnAvant = enAvant === photo.id;
                return (
                  <li
                    key={photo.id}
                    id={`recre-photo-${photo.id}`}
                    className={`relative rounded-md bg-white p-2 pb-2.5 transition-[transform,opacity,box-shadow] duration-300 rotate-[var(--tilt)] ${
                      misEnAvant
                        ? 'z-20 scale-[1.12] shadow-card-hover ring-4 ring-[#ec4899]'
                        : `shadow-card hover:z-10 hover:scale-[1.03] ${enAvant ? 'opacity-50 hover:opacity-100' : ''}`
                    }`}
                    // Inclinaison via variable : le zoom au survol (hover:scale) s'y
                    // ajoute ; la photo mise en avant se redresse.
                    style={{ '--tilt': `${misEnAvant ? 0 : tiltFor(i)}deg` } as React.CSSProperties}
                    aria-current={misEnAvant ? 'true' : undefined}
                  >
                    {misEnAvant && (
                      <span className="absolute -top-3 left-1/2 z-[1] inline-flex -translate-x-1/2 items-center gap-1 whitespace-nowrap rounded-full bg-[#ec4899] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white shadow-card">
                        <Star className="h-3 w-3 fill-white" aria-hidden /> En avant
                      </span>
                    )}
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
                      {isFacilitator && (
                        <button
                          type="button"
                          onClick={() => onToggleHighlight(photo.id)}
                          aria-pressed={misEnAvant}
                          aria-label={misEnAvant ? 'Ne plus mettre en avant' : `Mettre la photo ${i + 1} en avant`}
                          title={misEnAvant ? 'Ne plus mettre en avant' : 'Mettre en avant sur le board de tous'}
                          className="ml-auto rounded-full p-1 transition-colors hover:bg-[#fdf2f8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ec4899]"
                          style={{ color: misEnAvant ? '#ec4899' : '#94a3b8' }}
                        >
                          <Star className="h-3.5 w-3.5" style={{ fill: misEnAvant ? '#ec4899' : 'none' }} aria-hidden />
                        </button>
                      )}
                      {photo.authorId === myId && (
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteId(photo.id)}
                          aria-label="Supprimer ma photo"
                          className={`${isFacilitator ? '' : 'ml-auto '}rounded-full p-1 text-muted transition-colors hover:bg-danger-50 hover:text-danger-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ec4899]`}
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

      </div>

      <div
        role="group"
        aria-label="Zoom du board"
        className="absolute bottom-4 right-4 z-30 flex items-center gap-0.5 rounded-xl border border-line bg-white p-1 shadow-card"
      >
        <button type="button" onClick={() => changerNiveau(-1)} disabled={iNiveau <= 0} aria-label="Dézoomer" title="Dézoomer" className={boutonZoom}>
          <Minus className="h-4 w-4" aria-hidden />
        </button>
        <button
          type="button"
          onClick={() => changerNiveau(0)}
          title="Revenir à 100 %"
          aria-label={`Zoom ${Math.round(niveau * 100)} %, revenir à 100 %`}
          className="h-8 min-w-[52px] rounded-lg px-1 text-xs font-bold tabular-nums text-muted transition-colors hover:bg-surface hover:text-navy focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ec4899]"
        >
          {Math.round(niveau * 100)} %
        </button>
        <button type="button" onClick={() => changerNiveau(1)} disabled={iNiveau >= NIVEAUX_ZOOM.length - 1} aria-label="Zoomer" title="Zoomer" className={boutonZoom}>
          <Plus className="h-4 w-4" aria-hidden />
        </button>
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
            <div className="flex flex-wrap justify-center gap-2.5">
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); onToggleHighlight(zoom.id); setZoomId(null); }}
                className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border-[1.5px] border-white/30 bg-white/15 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-white/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
              >
                <Star className="h-4 w-4" aria-hidden />
                {enAvant === zoom.id ? 'Ne plus mettre en avant' : 'Mettre en avant sur le board'}
              </button>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); onShowToAll(zoom.id); setZoomId(null); }}
                className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg bg-[#ec4899] px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-[#db2777] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
              >
                <Eye className="h-4 w-4" aria-hidden /> Diaporama à partir de celle-ci
              </button>
            </div>
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
