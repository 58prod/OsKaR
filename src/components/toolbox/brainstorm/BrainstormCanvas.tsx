import React, { useEffect, useRef, useState } from 'react';
import { Heart, LayoutGrid, Minus, Plus, Star, X } from 'lucide-react';
import type { BoardNote } from '@/components/toolbox/shared/boardNotes';
import { BRAINSTORM_ACCENT, POS_MAX, getBrainstormColor, type PostitPosition } from './brainstormLogic';

interface BrainstormCanvasProps {
  notes: BoardNote[];
  positions: Record<string, PostitPosition>;
  myId: string;
  isFacilitator: boolean;
  anonymous: boolean;
  onMove: (id: string, pos: { x: number; y: number }) => void;
  onArrange: (cols: number) => void;
  onLike: (id: string) => void;
  onRetain: (id: string) => void;
  onDelete: (id: string) => void;
}

/** Largeur d'un post-it à 100 % (px). */
const POSTIT_W = 180;

/** Motif de fond type liège (points discrets). */
const DOTS_BG: React.CSSProperties = {
  backgroundImage: 'radial-gradient(circle, #cbd5e1 1px, transparent 1px)',
  backgroundSize: '24px 24px',
};

interface Drag {
  id: string;
  pointerId: number;
  /** Écart entre le pointeur et le coin du post-it, en fraction du canvas. */
  dx: number;
  dy: number;
  x: number;
  y: number;
  moved: boolean;
}

const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));

/**
 * Canvas libre du Brainstorming : zoom local (avec défilement quand on
 * zoome), post-its révélés déplaçables à la souris comme au doigt, vote
 * cœur, « Retenir » et « Ranger par couleur » pour l'animateur.
 */
export const BrainstormCanvas: React.FC<BrainstormCanvasProps> = ({
  notes, positions, myId, isFacilitator, anonymous, onMove, onArrange, onLike, onRetain, onDelete,
}) => {
  const viewportRef = useRef<HTMLDivElement>(null);
  const surfaceRef = useRef<HTMLDivElement>(null);
  const [drag, setDrag] = useState<Drag | null>(null);
  const [zoom, setZoom] = useState(1);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const revealed = notes.filter((n) => n.revealed);

  useEffect(() => {
    if (!confirmId) return;
    const t = setTimeout(() => setConfirmId(null), 3000);
    return () => clearTimeout(t);
  }, [confirmId]);

  const applyZoom = (delta: number) => {
    setZoom((z) => Math.min(2, Math.max(0.5, Math.round((z + delta) * 10) / 10)));
  };

  const arrange = () => {
    const width = viewportRef.current?.clientWidth ?? 900;
    onArrange(Math.max(1, Math.floor((width * zoom) / (POSTIT_W + 16))));
  };

  const pointerFraction = (e: React.PointerEvent) => {
    const r = surfaceRef.current!.getBoundingClientRect();
    return { fx: (e.clientX - r.left) / r.width, fy: (e.clientY - r.top) / r.height };
  };

  const onPointerDown = (e: React.PointerEvent, id: string, pos: PostitPosition) => {
    if (e.button !== 0 || (e.target as HTMLElement).closest('button') || !surfaceRef.current) return;
    const { fx, fy } = pointerFraction(e);
    e.currentTarget.setPointerCapture(e.pointerId);
    setDrag({ id, pointerId: e.pointerId, dx: fx - pos.x, dy: fy - pos.y, x: pos.x, y: pos.y, moved: false });
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!drag || e.pointerId !== drag.pointerId || !surfaceRef.current) return;
    const { fx, fy } = pointerFraction(e);
    const x = clamp(fx - drag.dx, 0, POS_MAX.x);
    const y = clamp(fy - drag.dy, 0, POS_MAX.y);
    const moved = drag.moved || Math.abs(x - drag.x) > 0.002 || Math.abs(y - drag.y) > 0.002;
    setDrag({ ...drag, x, y, moved });
  };

  const onPointerUp = (e: React.PointerEvent) => {
    if (!drag || e.pointerId !== drag.pointerId) return;
    if (drag.moved) onMove(drag.id, { x: drag.x, y: drag.y });
    setDrag(null);
  };

  return (
    <div className="relative flex-1 overflow-hidden bg-surface">
      {/* Zoom + rangement */}
      <div className="absolute right-4 top-3 z-20 flex items-center gap-1 rounded-xl border border-line bg-white/90 p-1 shadow-sm backdrop-blur">
        {isFacilitator && revealed.length > 1 && (
          <button
            type="button"
            onClick={arrange}
            title="Aligner les post-its en grille, couleur par couleur, les plus aimés d’abord"
            className="mr-1 inline-flex h-7 items-center gap-1.5 rounded-lg px-2.5 text-xs font-bold text-navy transition-colors hover:bg-surface"
          >
            <LayoutGrid className="h-3.5 w-3.5" style={{ color: BRAINSTORM_ACCENT }} aria-hidden /> Ranger par couleur
          </button>
        )}
        <button
          type="button"
          onClick={() => applyZoom(-0.1)}
          aria-label="Dézoomer"
          className="flex h-7 w-7 items-center justify-center rounded-lg text-navy transition-colors hover:bg-surface"
        >
          <Minus className="h-3.5 w-3.5" aria-hidden />
        </button>
        <button
          type="button"
          onClick={() => setZoom(1)}
          title="Revenir à 100 %"
          className="min-w-[46px] rounded-lg py-1 text-center text-xs font-bold text-muted hover:bg-surface"
          aria-live="polite"
        >
          {Math.round(zoom * 100)}%
        </button>
        <button
          type="button"
          onClick={() => applyZoom(0.1)}
          aria-label="Zoomer"
          className="flex h-7 w-7 items-center justify-center rounded-lg text-navy transition-colors hover:bg-surface"
        >
          <Plus className="h-3.5 w-3.5" aria-hidden />
        </button>
      </div>

      {/* Zone défilante : au-delà de 100 %, on se déplace dans le canvas. */}
      <div ref={viewportRef} className="absolute inset-0 overflow-auto">
        <div
          ref={surfaceRef}
          className="relative"
          style={{ ...DOTS_BG, width: `${zoom * 100}%`, height: `${zoom * 100}%`, minHeight: 360 * zoom, backgroundSize: `${24 * zoom}px ${24 * zoom}px` }}
          aria-label="Canvas des idées"
        >
          {revealed.length === 0 && (
            <p className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 select-none text-center text-sm text-muted/70">
              Les idées révélées apparaîtront ici<br />et seront librement déplaçables
            </p>
          )}

          {revealed.map((n) => {
            const c = getBrainstormColor(n.category);
            const base = positions[n.id] ?? { x: 0.4, y: 0.4, rot: 0 };
            const dragging = drag?.id === n.id;
            const pos = dragging ? { ...base, x: drag.x, y: drag.y } : base;
            const liked = n.likedBy.includes(myId);
            const mine = n.authorId === myId;
            const canDelete = mine || isFacilitator;
            const author = mine ? 'Vous' : anonymous ? 'Anonyme' : n.authorName;
            return (
              <div
                key={n.id}
                onPointerDown={(e) => onPointerDown(e, n.id, base)}
                onPointerMove={onPointerMove}
                onPointerUp={onPointerUp}
                onPointerCancel={() => setDrag(null)}
                className={`group absolute select-none rounded border-t-[3px] p-2 pb-6 shadow-md transition-shadow hover:shadow-lg ${
                  dragging ? 'z-30 cursor-grabbing shadow-xl' : 'cursor-grab'
                } ${n.retained ? 'ring-2 ring-warning-400' : ''}`}
                style={{
                  left: `${pos.x * 100}%`,
                  top: `${pos.y * 100}%`,
                  width: POSTIT_W,
                  background: c.bg,
                  borderTopColor: c.dot,
                  transform: `rotate(${dragging ? 0 : pos.rot}deg) scale(${zoom})`,
                  transformOrigin: 'top left',
                  touchAction: 'none',
                }}
              >
                {n.retained && (
                  <span className="absolute -left-2 -top-2.5 flex h-5 w-5 items-center justify-center rounded-full bg-warning-400 text-white shadow" title="Idée retenue">
                    <Star className="h-3 w-3" style={{ fill: '#fff' }} aria-hidden />
                    <span className="sr-only">Idée retenue</span>
                  </span>
                )}
                <div className="absolute right-1 top-1 flex items-center gap-0.5">
                  {isFacilitator && (
                    <button
                      type="button"
                      onClick={() => onRetain(n.id)}
                      aria-pressed={n.retained}
                      aria-label={n.retained ? 'Ne plus retenir' : 'Retenir cette idée'}
                      title={n.retained ? 'Ne plus retenir' : 'Retenir'}
                      className={`rounded p-0.5 transition-opacity hover:text-warning-600 focus-visible:opacity-100 group-hover:opacity-100 ${
                        n.retained ? 'text-warning-500 opacity-100' : 'text-navy/30 opacity-0'
                      }`}
                    >
                      <Star className="h-3.5 w-3.5" style={{ fill: n.retained ? 'currentColor' : 'none' }} aria-hidden />
                    </button>
                  )}
                  {canDelete && (
                    confirmId === n.id ? (
                      <button
                        type="button"
                        onClick={() => { onDelete(n.id); setConfirmId(null); }}
                        className="rounded bg-danger-600 px-1.5 py-0.5 text-[10px] font-bold text-white"
                      >
                        Supprimer ?
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setConfirmId(n.id)}
                        aria-label="Supprimer le post-it"
                        className="rounded p-0.5 text-navy/30 opacity-0 transition-opacity hover:text-danger-600 focus-visible:opacity-100 group-hover:opacity-100"
                      >
                        <X className="h-3.5 w-3.5" aria-hidden />
                      </button>
                    )
                  )}
                </div>
                <p className="break-words pr-8 text-[13px] leading-snug text-navy">{n.text}</p>
                <span className="absolute bottom-1.5 left-2.5 flex items-center gap-1 text-[11px] font-semibold text-navy/40">
                  {!(anonymous && !mine) && <span className="h-2 w-2 rounded-full" style={{ background: n.authorColor }} aria-hidden />}
                  {author}
                </span>
                <button
                  type="button"
                  onClick={() => onLike(n.id)}
                  aria-pressed={liked}
                  aria-label={liked ? `Je n'aime plus (${n.likedBy.length})` : `J'aime (${n.likedBy.length})`}
                  className="absolute bottom-1 right-1.5 inline-flex items-center gap-1 rounded-full px-1 py-0.5 text-[11px] font-bold transition-colors"
                  style={{ color: liked ? '#ec4899' : '#94a3b8' }}
                >
                  <Heart className="h-3 w-3" style={{ fill: liked ? '#ec4899' : 'none' }} aria-hidden />
                  {n.likedBy.length > 0 && n.likedBy.length}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Compteur */}
      <p className="pointer-events-none absolute bottom-3.5 right-4 rounded-full border border-line bg-white px-3 py-1 text-xs text-muted shadow-sm">
        <strong className="text-navy">{revealed.length}</strong> post-it{revealed.length > 1 ? 's' : ''}
      </p>
    </div>
  );
};

export default BrainstormCanvas;
