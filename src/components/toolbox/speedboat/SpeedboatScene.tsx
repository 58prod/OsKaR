import React, { useEffect, useRef, useState } from 'react';
import { Check, Heart, Trash2, Undo2 } from 'lucide-react';
import type { BoardNote } from '@/components/toolbox/shared/boardNotes';
import {
  CARD_POS_MAX, SPEEDBOAT_ZONES, getSpeedboatZone, zoneAt,
  type CardPosition, type SpeedboatZoneKey,
} from './speedboatLogic';

interface SpeedboatSceneProps {
  notes: BoardNote[];
  positions: Record<string, CardPosition>;
  myId: string;
  isFacilitator: boolean;
  anonymous: boolean;
  showInstructions: boolean;
  voteLimit: number;
  /** Cœurs restants (null = illimité). */
  votesLeft: number | null;
  onMove: (id: string, zone: SpeedboatZoneKey, pos: { x: number; y: number }) => void;
  onVote: (id: string) => void;
  onRetain: (id: string) => void;
  onDelete: (id: string) => void;
}

const LABEL_POS: Record<string, string> = {
  tl: 'left-3 top-3', tr: 'right-3 top-3', bl: 'left-3 bottom-3', br: 'right-3 bottom-3',
};

interface Drag {
  id: string;
  pointerId: number;
  /** Écart entre le pointeur et le coin de la carte, en fraction de la scène. */
  dx: number;
  dy: number;
  x: number;
  y: number;
  moved: boolean;
}

const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));

/**
 * Scène du Speedboat : image de fond (voilier, île, ancres, récifs) avec
 * 4 zones en surimpression. Les tickets placés se déplacent à la souris
 * comme au doigt ; lâchés dans une autre zone, ils en prennent la couleur.
 */
export const SpeedboatScene: React.FC<SpeedboatSceneProps> = ({
  notes, positions, myId, isFacilitator, anonymous, showInstructions, voteLimit, votesLeft,
  onMove, onVote, onRetain, onDelete,
}) => {
  const sceneRef = useRef<HTMLDivElement>(null);
  const [drag, setDrag] = useState<Drag | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const placed = notes.filter((n) => n.revealed);

  useEffect(() => {
    if (!confirmDelete) return;
    const t = setTimeout(() => setConfirmDelete(null), 4000);
    return () => clearTimeout(t);
  }, [confirmDelete]);

  const fraction = (e: React.PointerEvent) => {
    const r = sceneRef.current!.getBoundingClientRect();
    return { fx: (e.clientX - r.left) / r.width, fy: (e.clientY - r.top) / r.height };
  };

  const onPointerDown = (e: React.PointerEvent, id: string, pos: CardPosition) => {
    if (e.button !== 0 || (e.target as HTMLElement).closest('button') || !sceneRef.current) return;
    const { fx, fy } = fraction(e);
    e.currentTarget.setPointerCapture(e.pointerId);
    setDrag({ id, pointerId: e.pointerId, dx: fx - pos.x, dy: fy - pos.y, x: pos.x, y: pos.y, moved: false });
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!drag || e.pointerId !== drag.pointerId || !sceneRef.current) return;
    const { fx, fy } = fraction(e);
    const x = clamp(fx - drag.dx, 0, CARD_POS_MAX.x);
    const y = clamp(fy - drag.dy, 0, CARD_POS_MAX.y);
    setDrag({ ...drag, x, y, moved: drag.moved || Math.abs(x - drag.x) > 0.002 || Math.abs(y - drag.y) > 0.002 });
  };

  const onPointerUp = (e: React.PointerEvent) => {
    if (!drag || e.pointerId !== drag.pointerId) return;
    if (drag.moved) {
      // La zone est celle où se trouve le pointeur au moment du lâcher.
      const { fx, fy } = fraction(e);
      onMove(drag.id, zoneAt(clamp(fx, 0, 1), clamp(fy, 0, 1)), { x: drag.x, y: drag.y });
    }
    setDrag(null);
  };

  const overZone = drag?.moved && sceneRef.current ? zoneAt(drag.x + drag.dx, drag.y + drag.dy) : null;

  return (
    <div className="relative flex-1 overflow-auto bg-surface p-4">
      <div
        ref={sceneRef}
        className="relative mx-auto aspect-[3/2] max-h-full w-full max-w-[1100px] overflow-hidden rounded-xl shadow-card"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/images/speedboat-bg.png"
          alt=""
          draggable={false}
          className="absolute inset-0 h-full w-full select-none object-cover"
        />

        {SPEEDBOAT_ZONES.map((z) => (
          <div
            key={z.key}
            aria-label={z.name}
            className={`absolute transition-colors ${overZone === z.key ? 'bg-white/25' : ''}`}
            style={{ left: `${z.left}%`, top: `${z.top}%`, width: `${z.width}%`, height: `${z.height}%` }}
          >
            <span
              className={`absolute ${LABEL_POS[z.labelCorner]} rounded-lg border-[1.5px] bg-white/85 px-2.5 py-1 text-xs font-bold backdrop-blur-sm`}
              style={{ color: z.color, borderColor: `${z.color}55` }}
            >
              {z.name}
            </span>
            {showInstructions && (
              <span
                className={`absolute ${LABEL_POS[z.labelCorner].replace('top-3', 'top-11').replace('bottom-3', 'bottom-11')} max-w-[240px] rounded-lg bg-white/75 px-2.5 py-1.5 text-[11px] leading-snug text-navy backdrop-blur-sm`}
              >
                {z.desc}
              </span>
            )}
          </div>
        ))}

        {placed.map((n) => {
          const z = getSpeedboatZone(n.category);
          const base = positions[n.id] ?? { x: 0.4, y: 0.4 };
          const dragging = drag?.id === n.id;
          const pos = dragging ? { x: drag.x, y: drag.y } : base;
          const voted = n.likedBy.includes(myId);
          const mine = n.authorId === myId;
          const author = mine ? 'Votre ticket' : anonymous ? 'Anonyme' : n.authorName;
          return (
            <div
              key={n.id}
              onPointerDown={(e) => onPointerDown(e, n.id, base)}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
              onPointerCancel={() => setDrag(null)}
              className={`absolute w-[168px] select-none rounded-lg border-t-4 bg-white/95 p-2 shadow-md backdrop-blur-sm transition-shadow hover:shadow-lg ${
                dragging ? 'z-30 cursor-grabbing shadow-xl' : 'cursor-grab'
              } ${n.retained ? 'outline outline-2 outline-warning-500' : ''}`}
              style={{ left: `${pos.x * 100}%`, top: `${pos.y * 100}%`, borderTopColor: z.color, touchAction: 'none' }}
            >
              {n.retained && (
                <span className="absolute -top-2.5 right-2 inline-flex items-center gap-0.5 rounded-full bg-warning-500 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
                  <Check className="h-3 w-3" aria-hidden /> Retenu
                </span>
              )}
              <p className="flex items-center gap-1 text-[11px] font-bold" style={{ color: anonymous && !mine ? '#94a3b8' : n.authorColor }}>
                {!(anonymous && !mine) && <span className="h-2 w-2 rounded-full" style={{ background: n.authorColor }} aria-hidden />}
                {author}
                <span className="ml-auto text-[10px] font-bold opacity-80" style={{ color: z.color }}>{z.name}</span>
              </p>
              <p className="mt-1 break-words text-xs leading-snug text-navy">{n.text}</p>
              <div className="mt-1.5 flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => onVote(n.id)}
                  disabled={mine}
                  aria-pressed={voted}
                  title={mine ? 'On ne vote pas pour ses propres tickets' : votesLeft === 0 && !voted ? 'Plus de cœurs disponibles' : undefined}
                  aria-label={voted ? `Retirer mon vote (${n.likedBy.length})` : `Voter (${n.likedBy.length})`}
                  className={`inline-flex items-center gap-1 rounded-full px-1 py-0.5 text-[11px] font-bold transition-colors disabled:cursor-default disabled:opacity-40 ${
                    votesLeft === 0 && !voted && !mine ? 'opacity-50' : ''
                  }`}
                  style={{ color: voted ? '#ec4899' : '#94a3b8' }}
                >
                  <Heart className="h-3 w-3" style={{ fill: voted ? '#ec4899' : 'none' }} aria-hidden />
                  {n.likedBy.length}
                </button>
                {isFacilitator && (
                  <span className="ml-auto flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => onRetain(n.id)}
                      className={`inline-flex items-center gap-0.5 rounded px-1.5 py-0.5 text-[10px] font-bold transition-colors ${
                        n.retained ? 'bg-warning-100 text-warning-700' : 'bg-surface text-muted hover:text-navy'
                      }`}
                    >
                      {n.retained ? <><Undo2 className="h-3 w-3" aria-hidden /> Annuler</> : <><Check className="h-3 w-3" aria-hidden /> Retenir</>}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (confirmDelete === n.id) { onDelete(n.id); setConfirmDelete(null); } else setConfirmDelete(n.id);
                      }}
                      title="Supprimer (modération)"
                      aria-label={confirmDelete === n.id ? 'Confirmer la suppression' : 'Supprimer le ticket'}
                      className={`inline-flex items-center gap-0.5 rounded px-1 py-0.5 text-[10px] font-bold transition-colors ${
                        confirmDelete === n.id ? 'bg-danger-600 text-white' : 'text-muted hover:text-danger-600'
                      }`}
                    >
                      <Trash2 className="h-3 w-3" aria-hidden /> {confirmDelete === n.id && 'Supprimer ?'}
                    </button>
                  </span>
                )}
              </div>
            </div>
          );
        })}

        {votesLeft !== null && (
          <p
            className={`absolute bottom-3 left-1/2 z-20 inline-flex -translate-x-1/2 items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold shadow ${
              votesLeft === 0 ? 'bg-danger-50 text-danger-600' : 'bg-white/90 text-navy'
            }`}
            aria-live="polite"
          >
            <Heart className="h-3.5 w-3.5" style={{ fill: '#ec4899', color: '#ec4899' }} aria-hidden />
            Cœurs restants : {votesLeft} / {voteLimit}
          </p>
        )}
      </div>
    </div>
  );
};

export default SpeedboatScene;
