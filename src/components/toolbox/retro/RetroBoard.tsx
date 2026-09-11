import React, { useEffect, useState } from 'react';
import { Heart, Layers, X } from 'lucide-react';
import {
  RETRO_CATEGORIES, boardItems, getRetroCategory,
  type RetroCategoryKey, type RetroNote,
} from './retroLogic';

interface RetroBoardProps {
  notes: RetroNote[];
  myId: string;
  onMove: (id: string, category: RetroCategoryKey) => void;
  onMovePile: (pileId: string, category: RetroCategoryKey) => void;
  onPile: (id: string, targetId: string) => void;
  onPileOnto: (pileId: string, targetId: string) => void;
  onUnpile: (id: string) => void;
  onLike: (id: string) => void;
}

type DragItem = { kind: 'note' | 'pile'; id: string };

/**
 * Tableau 2 × 2 des quadrants de la rétrospective. Les cases « + » et « – »,
 * toujours les plus remplies, occupent la colonne la plus large ; chaque case
 * défile indépendamment. Les notes non révélées apparaissent masquées ; les
 * notes révélées se déplacent par glisser-déposer, et posées sur une autre
 * note elles forment un tas.
 */
export const RetroBoard: React.FC<RetroBoardProps> = ({
  notes, myId, onMove, onMovePile, onPile, onPileOnto, onUnpile, onLike,
}) => {
  const [drag, setDrag] = useState<DragItem | null>(null);
  const [overKey, setOverKey] = useState<RetroCategoryKey | null>(null);
  const [overTarget, setOverTarget] = useState<string | null>(null);
  const [openPile, setOpenPile] = useState<string | null>(null);

  const endDrag = () => { setDrag(null); setOverKey(null); setOverTarget(null); };

  const dropOnTarget = (targetId: string) => {
    if (drag?.kind === 'note' && drag.id !== targetId) onPile(drag.id, targetId);
    if (drag?.kind === 'pile') onPileOnto(drag.id, targetId);
    endDrag();
  };

  const targetProps = (targetId: string) => ({
    onDragOver: (e: React.DragEvent) => {
      if (!drag) return;
      e.preventDefault();
      e.stopPropagation();
      setOverTarget(targetId);
    },
    onDragLeave: () => setOverTarget((t) => (t === targetId ? null : t)),
    onDrop: (e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); dropOnTarget(targetId); },
  });

  const pileNotes = openPile ? notes.filter((n) => n.revealed && n.pileId === openPile) : [];
  useEffect(() => {
    if (openPile && pileNotes.length < 2) setOpenPile(null);
  }, [openPile, pileNotes.length]);

  return (
    <div className="grid flex-1 grid-cols-1 gap-3 overflow-y-auto p-4 md:grid-cols-[3fr_2fr] md:grid-rows-2 md:overflow-hidden">
      {RETRO_CATEGORIES.map((cat) => {
        const catNotes = notes.filter((n) => n.category === cat.key);
        return (
          <section
            key={cat.key}
            aria-label={cat.label}
            onDragOver={(e) => { e.preventDefault(); setOverKey(cat.key); }}
            onDragLeave={() => setOverKey((k) => (k === cat.key ? null : k))}
            onDrop={(e) => {
              e.preventDefault();
              if (drag?.kind === 'note') onMove(drag.id, cat.key);
              if (drag?.kind === 'pile') onMovePile(drag.id, cat.key);
              endDrag();
            }}
            className={`flex min-h-[220px] flex-col overflow-hidden rounded-xl border-2 transition-colors md:min-h-0 ${
              overKey === cat.key ? 'border-teal' : 'border-transparent'
            }`}
            style={{ background: cat.bg }}
          >
            <header className="flex shrink-0 items-center gap-2 px-3.5 pt-3">
              <span
                className="flex h-6 w-6 items-center justify-center rounded-md text-sm font-bold text-white"
                style={{ background: cat.color }}
                aria-hidden
              >
                {cat.symbol}
              </span>
              <h3 className="text-sm font-bold" style={{ color: cat.color }}>{cat.label}</h3>
              <span className="ml-auto rounded-full bg-white/70 px-2 py-0.5 text-xs font-bold text-navy">
                {catNotes.length}
              </span>
            </header>

            <ul
              className="flex min-h-0 flex-1 flex-wrap content-start items-start gap-1.5 overflow-y-auto p-3"
              aria-live="polite"
            >
              {boardItems(catNotes).map((item) => (item.kind === 'note' ? (
                <RetroNoteCard
                  key={item.note.id}
                  note={item.note}
                  myId={myId}
                  isTarget={overTarget === item.note.id}
                  onLike={onLike}
                  onDragStart={() => setDrag({ kind: 'note', id: item.note.id })}
                  onDragEnd={endDrag}
                  dropProps={item.note.revealed ? targetProps(item.note.id) : {}}
                />
              ) : (
                <RetroPileCard
                  key={item.pileId}
                  notes={item.notes}
                  color={cat.color}
                  isTarget={overTarget === item.notes[0].id}
                  onOpen={() => setOpenPile(item.pileId)}
                  onDragStart={() => setDrag({ kind: 'pile', id: item.pileId })}
                  onDragEnd={endDrag}
                  dropProps={targetProps(item.notes[0].id)}
                />
              )))}
            </ul>
          </section>
        );
      })}

      {openPile && pileNotes.length > 1 && (
        <RetroPileModal
          notes={pileNotes}
          myId={myId}
          onLike={onLike}
          onUnpile={onUnpile}
          onClose={() => setOpenPile(null)}
        />
      )}
    </div>
  );
};

type DropProps = Partial<Pick<React.HTMLAttributes<HTMLLIElement>, 'onDragOver' | 'onDragLeave' | 'onDrop'>>;

const LikeButton: React.FC<{ note: RetroNote; myId: string; onLike: (id: string) => void }> = ({ note, myId, onLike }) => {
  const liked = note.likedBy.includes(myId);
  return (
    <button
      type="button"
      onClick={(e) => { e.stopPropagation(); onLike(note.id); }}
      aria-pressed={liked}
      aria-label={liked ? `Je n'aime plus (${note.likedBy.length})` : `J'aime (${note.likedBy.length})`}
      className="ml-auto inline-flex shrink-0 items-center gap-0.5 rounded-full px-1 text-[10px] font-bold transition-colors"
      style={{ color: liked ? '#ec4899' : '#94a3b8' }}
    >
      <Heart className="h-3 w-3" style={{ fill: liked ? '#ec4899' : 'none' }} aria-hidden />
      {note.likedBy.length > 0 && note.likedBy.length}
    </button>
  );
};

const RetroNoteCard: React.FC<{
  note: RetroNote;
  myId: string;
  isTarget: boolean;
  onLike: (id: string) => void;
  onDragStart: () => void;
  onDragEnd: () => void;
  dropProps: DropProps;
}> = ({ note, myId, isTarget, onLike, onDragStart, onDragEnd, dropProps }) => {
  if (!note.revealed) {
    return (
      <li
        className="h-[46px] w-[128px] rounded-md border-l-4 bg-white/55 shadow-sm"
        style={{ borderLeftColor: note.authorColor }}
        aria-label="Note masquée (non révélée)"
      />
    );
  }

  return (
    <li
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      {...dropProps}
      title="Glissez sur une autre note pour les empiler"
      className={`w-[128px] cursor-grab rounded-md border-l-4 bg-white px-2 py-1.5 shadow-sm transition-shadow hover:shadow-md active:cursor-grabbing ${
        isTarget ? 'ring-2 ring-teal' : ''
      }`}
      style={{ borderLeftColor: note.authorColor }}
    >
      <p className="break-words text-xs leading-snug text-navy">{note.text}</p>
      <div className="mt-1 flex items-center gap-1">
        <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: note.authorColor }} aria-hidden />
        <span className="truncate text-[10px] font-semibold text-muted">{note.authorName}</span>
        <LikeButton note={note} myId={myId} onLike={onLike} />
      </div>
    </li>
  );
};

const RetroPileCard: React.FC<{
  notes: RetroNote[];
  color: string;
  isTarget: boolean;
  onOpen: () => void;
  onDragStart: () => void;
  onDragEnd: () => void;
  dropProps: DropProps;
}> = ({ notes, color, isTarget, onOpen, onDragStart, onDragEnd, dropProps }) => {
  const likes = notes.reduce((sum, n) => sum + n.likedBy.length, 0);
  return (
    <li
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      {...dropProps}
      className="relative w-[128px] cursor-grab active:cursor-grabbing"
    >
      <span className="absolute inset-0 translate-x-[3px] translate-y-[-2px] rotate-[3deg] rounded-md bg-white/70 shadow-sm" aria-hidden />
      <span className="absolute inset-0 translate-x-[-2px] translate-y-[2px] rotate-[-2deg] rounded-md bg-white/55 shadow-sm" aria-hidden />
      <button
        type="button"
        onClick={onOpen}
        aria-label={`Tas de ${notes.length} notes : ${notes[0].text}. Ouvrir`}
        className={`relative block w-full rounded-md border-l-4 bg-white px-2 py-1.5 text-left shadow-sm transition-shadow hover:shadow-md ${
          isTarget ? 'ring-2 ring-teal' : ''
        }`}
        style={{ borderLeftColor: color }}
      >
        <p className="line-clamp-3 break-words text-xs leading-snug text-navy">{notes[0].text}</p>
        <span className="mt-1 flex items-center gap-1 text-[10px] font-bold" style={{ color }}>
          <Layers className="h-3 w-3" aria-hidden /> {notes.length} notes
          {likes > 0 && (
            <span className="ml-auto inline-flex items-center gap-0.5 text-[#ec4899]">
              <Heart className="h-3 w-3" style={{ fill: '#ec4899' }} aria-hidden /> {likes}
            </span>
          )}
        </span>
      </button>
    </li>
  );
};

const RetroPileModal: React.FC<{
  notes: RetroNote[];
  myId: string;
  onLike: (id: string) => void;
  onUnpile: (id: string) => void;
  onClose: () => void;
}> = ({ notes, myId, onLike, onUnpile, onClose }) => {
  const cat = getRetroCategory(notes[0].category);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="retro-pile-title"
      className="fixed inset-0 z-[210] flex items-center justify-center bg-navy/60 p-6"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="flex max-h-[80vh] w-full max-w-md flex-col rounded-2xl bg-white p-6 shadow-card-hover">
        <div className="flex items-center gap-2">
          <Layers className="h-4 w-4" style={{ color: cat.color }} aria-hidden />
          <h2 id="retro-pile-title" className="text-base font-bold text-navy">
            Tas de {notes.length} notes
          </h2>
          <span className="text-xs font-semibold" style={{ color: cat.color }}>· {cat.label}</span>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer"
            className="ml-auto rounded-md p-1 text-muted transition-colors hover:bg-surface hover:text-navy"
          >
            <X className="h-4 w-4" aria-hidden />
          </button>
        </div>
        <ul className="mt-4 flex flex-col gap-2 overflow-y-auto">
          {notes.map((n) => (
            <li
              key={n.id}
              className="rounded-lg border-l-4 bg-surface px-3 py-2"
              style={{ borderLeftColor: n.authorColor }}
            >
              <p className="text-sm leading-snug text-navy">{n.text}</p>
              <div className="mt-1.5 flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full" style={{ background: n.authorColor }} aria-hidden />
                <span className="text-[11px] font-semibold text-muted">{n.authorName}</span>
                <button
                  type="button"
                  onClick={() => onUnpile(n.id)}
                  className="ml-3 text-[11px] font-semibold text-muted underline-offset-2 transition-colors hover:text-navy hover:underline"
                >
                  Sortir du tas
                </button>
                <LikeButton note={n} myId={myId} onLike={onLike} />
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default RetroBoard;
