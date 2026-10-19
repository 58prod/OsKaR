import React, { useEffect, useRef, useState } from 'react';
import { Check, Heart, Layers, Pencil, X } from 'lucide-react';
import {
  RETRO_CATEGORIES, boardItems, boardKey, getRetroCategory, keyBeside, sortBoardNotes,
  type RetroBoardItem, type RetroCategoryKey, type RetroNote,
} from './retroLogic';

interface RetroBoardProps {
  notes: RetroNote[];
  myId: string;
  /** Notes regroupées par personne (un repère au nom de chacun ouvre son groupe). */
  groupByAuthor: boolean;
  onMove: (id: string, category: RetroCategoryKey) => void;
  onMovePile: (pileId: string, category: RetroCategoryKey) => void;
  onPile: (id: string, targetId: string) => void;
  onPileOnto: (pileId: string, targetId: string) => void;
  onUnpile: (id: string) => void;
  onLike: (id: string) => void;
  /** Ouvre la modification d'une de ses notes. */
  onEdit: (id: string) => void;
  /** Nouvelles places sur le tableau. */
  onOrder: (orders: Record<string, number>) => void;
  /** Marque des notes abordées (ou plus). */
  onTreated: (ids: string[], treated: boolean) => void;
}

type DragItem = { kind: 'note' | 'pile'; id: string };
/** Posée sur une note : avant elle, après elle, ou dessus (tas). */
type Zone = 'before' | 'after' | 'pile';

/** Durée de la mise en avant d'une note qui vient d'être révélée. */
const FRESH_MS = 6000;

const itemNotes = (it: RetroBoardItem) => (it.kind === 'note' ? [it.note] : it.notes);
const itemTarget = (it: RetroBoardItem) => (it.kind === 'note' ? it.note.id : it.notes[0].id);
const itemDragId = (it: RetroBoardItem) => (it.kind === 'note' ? it.note.id : it.pileId);
const itemKey = (it: RetroBoardItem) => Math.min(...itemNotes(it).map(boardKey));
const itemTreated = (it: RetroBoardItem) => itemNotes(it).every((n) => n.treated);
const itemAuthor = (it: RetroBoardItem) => itemNotes(it)[0].authorId;

/** Bord gauche ou droit d'une note : on range ; au centre : on empile. */
function zoneOf(e: React.DragEvent): Zone {
  const r = (e.currentTarget as HTMLElement).getBoundingClientRect();
  const x = (e.clientX - r.left) / r.width;
  if (x < 0.3) return 'before';
  if (x > 0.7) return 'after';
  return 'pile';
}

/**
 * Notes révélées depuis l'arrivée sur la page : mises en avant quelques
 * secondes. Une note vue masquée puis révélée, ou révélée il y a moins de
 * 15 s, compte ; celles déjà là au chargement, non.
 */
function useFreshNotes(notes: RetroNote[]): Set<string> {
  const hidden = useRef(new Set<string>());
  const seen = useRef(new Set<string>());
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const [fresh, setFresh] = useState<Set<string>>(() => new Set());

  useEffect(() => {
    const now = Date.now();
    const added: string[] = [];
    notes.forEach((n) => {
      if (!n.revealed) { hidden.current.add(n.id); seen.current.delete(n.id); return; }
      if (seen.current.has(n.id)) return;
      seen.current.add(n.id);
      const recent = n.revealedAt !== undefined && Math.abs(now - n.revealedAt) < 15000;
      if (hidden.current.has(n.id) || recent) added.push(n.id);
      hidden.current.delete(n.id);
    });
    if (!added.length) return;
    setFresh((prev) => new Set([...prev, ...added]));
    timers.current.push(setTimeout(() => {
      setFresh((prev) => {
        const next = new Set(prev);
        added.forEach((id) => next.delete(id));
        return next;
      });
    }, FRESH_MS));
  }, [notes]);

  useEffect(() => () => timers.current.forEach(clearTimeout), []);
  return fresh;
}

/**
 * Tableau 2 × 2 des quadrants de la rétrospective. Les cases « + » et « – »,
 * toujours les plus remplies, occupent la colonne la plus large ; chaque case
 * défile indépendamment. Dans chaque case : les notes à aborder dans l'ordre
 * de leur révélation, puis les notes encore masquées, puis les notes déjà
 * abordées (barrées). Glissée sur le bord d'une note, une note se range
 * avant ou après elle ; posée au centre, elle forme un tas.
 */
export const RetroBoard: React.FC<RetroBoardProps> = ({
  notes, myId, groupByAuthor, onMove, onMovePile, onPile, onPileOnto, onUnpile, onLike, onEdit, onOrder, onTreated,
}) => {
  const [drag, setDrag] = useState<DragItem | null>(null);
  const [overKey, setOverKey] = useState<RetroCategoryKey | null>(null);
  const [over, setOver] = useState<{ id: string; zone: Zone } | null>(null);
  const [openPile, setOpenPile] = useState<string | null>(null);
  const fresh = useFreshNotes(notes);

  const endDrag = () => { setDrag(null); setOverKey(null); setOver(null); };

  /** Range les notes déplacées avant ou après la cible, dans la même partie de la case. */
  const placeBeside = (items: RetroBoardItem[], targetId: string, side: 'before' | 'after') => {
    if (!drag) return;
    const target = items.find((it) => itemTarget(it) === targetId);
    const dragged = drag.kind === 'note'
      ? notes.filter((n) => n.id === drag.id && n.revealed)
      : notes.filter((n) => n.revealed && n.pileId === drag.id);
    if (!target || !dragged.length) return;
    const treated = itemTreated(target);
    // Regroupées par personne : on se range parmi les notes de la même personne.
    const section = items.filter((it) => itemNotes(it)[0].revealed && itemTreated(it) === treated
      && itemDragId(it) !== drag.id && (!groupByAuthor || itemAuthor(it) === itemAuthor(target)));
    const index = section.indexOf(target);
    if (index < 0) return;
    const key = keyBeside(section.map(itemKey), index, side);
    const category = target.kind === 'note' ? target.note.category : target.notes[0].category;
    if (dragged[0].category !== category) {
      if (drag.kind === 'note') onMove(drag.id, category as RetroCategoryKey);
      else onMovePile(drag.id, category as RetroCategoryKey);
    }
    onOrder(Object.fromEntries(dragged.map((n) => [n.id, key])));
    // Rangée parmi les notes abordées, elle le devient (et inversement).
    const toggle = dragged.filter((n) => !!n.treated !== treated).map((n) => n.id);
    if (toggle.length) onTreated(toggle, treated);
  };

  const dropOnTarget = (items: RetroBoardItem[], targetId: string, zone: Zone) => {
    if (zone !== 'pile') placeBeside(items, targetId, zone);
    else if (drag?.kind === 'note' && drag.id !== targetId) onPile(drag.id, targetId);
    else if (drag?.kind === 'pile') onPileOnto(drag.id, targetId);
    endDrag();
  };

  const targetProps = (items: RetroBoardItem[], targetId: string) => ({
    onDragOver: (e: React.DragEvent) => {
      if (!drag) return;
      e.preventDefault();
      e.stopPropagation();
      const zone = zoneOf(e);
      setOver((o) => (o?.id === targetId && o.zone === zone ? o : { id: targetId, zone }));
    },
    onDragLeave: () => setOver((o) => (o?.id === targetId ? null : o)),
    onDrop: (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      dropOnTarget(items, targetId, zoneOf(e));
    },
  });

  const zoneFor = (id: string): Zone | null => (over?.id === id ? over.zone : null);

  const pileNotes = openPile ? notes.filter((n) => n.revealed && n.pileId === openPile) : [];
  useEffect(() => {
    if (openPile && pileNotes.length < 2) setOpenPile(null);
  }, [openPile, pileNotes.length]);

  return (
    <div className="grid flex-1 grid-cols-1 gap-3 overflow-y-auto p-4 md:grid-cols-[minmax(0,2fr)_minmax(190px,1fr)] md:grid-rows-2 md:overflow-hidden">
      {RETRO_CATEGORIES.map((cat) => {
        const catNotes = notes.filter((n) => n.category === cat.key);
        const items = boardItems(sortBoardNotes(catNotes, groupByAuthor));
        const treatedCount = catNotes.filter((n) => n.revealed && n.treated).length;
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
              <span
                className="ml-auto rounded-full bg-white/70 px-2 py-0.5 text-xs font-bold text-navy"
                title={treatedCount > 0 ? `${treatedCount} abordée${treatedCount > 1 ? 's' : ''} sur ${catNotes.length}` : undefined}
              >
                {treatedCount > 0 ? `${treatedCount} / ${catNotes.length}` : catNotes.length}
              </span>
            </header>

            <ul
              className={`flex min-h-0 flex-1 flex-wrap content-start items-start gap-1.5 overflow-y-auto p-3 ${
                // Laisse la place au lien « En mode récré ! » posé en bas à droite.
                cat.key === 'question' ? 'pb-14' : ''
              }`}
              aria-live="polite"
            >
              {items.map((item, i) => {
                // Regroupées : le nom de la personne en tête de son groupe (hors notes abordées, rangées en bas).
                const first = itemNotes(item)[0];
                const label = groupByAuthor && !itemTreated(item)
                  && (i === 0 || itemAuthor(items[i - 1]) !== first.authorId || itemTreated(items[i - 1]));
                const card = item.kind === 'note' ? (
                <RetroNoteCard
                  key={item.note.id}
                  note={item.note}
                  myId={myId}
                  zone={zoneFor(item.note.id)}
                  fresh={fresh.has(item.note.id)}
                  onLike={onLike}
                  onEdit={onEdit}
                  onTreated={onTreated}
                  onDragStart={() => setDrag({ kind: 'note', id: item.note.id })}
                  onDragEnd={endDrag}
                  dropProps={item.note.revealed ? targetProps(items, item.note.id) : {}}
                />
              ) : (
                <RetroPileCard
                  key={item.pileId}
                  notes={item.notes}
                  color={cat.color}
                  zone={zoneFor(item.notes[0].id)}
                  onOpen={() => setOpenPile(item.pileId)}
                  onTreated={onTreated}
                  onDragStart={() => setDrag({ kind: 'pile', id: item.pileId })}
                  onDragEnd={endDrag}
                  dropProps={targetProps(items, item.notes[0].id)}
                />
                );
                if (!label) return card;
                return (
                  <React.Fragment key={`groupe-${first.authorId}-${item.kind === 'note' ? item.note.id : item.pileId}`}>
                    <li className="flex basis-full items-center gap-1.5 pt-1 text-[11px] font-bold text-navy first:pt-0" aria-hidden>
                      <span className="h-2 w-2 rounded-full" style={{ background: first.authorColor }} />
                      {first.authorName}
                    </li>
                    {card}
                  </React.Fragment>
                );
              })}
            </ul>
          </section>
        );
      })}

      {openPile && pileNotes.length > 1 && (
        <RetroPileModal
          notes={sortBoardNotes(pileNotes, groupByAuthor)}
          myId={myId}
          onLike={onLike}
          onEdit={onEdit}
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

/** Repère de dépôt : barre avant/après, ou contour pour empiler. */
const DropMarker: React.FC<{ zone: Zone | null }> = ({ zone }) => {
  if (zone === 'before' || zone === 'after') {
    return (
      <span
        className={`pointer-events-none absolute top-0 z-10 h-full w-[3px] rounded-full bg-teal ${
          zone === 'before' ? '-left-[5px]' : '-right-[5px]'
        }`}
        aria-hidden
      />
    );
  }
  return null;
};

/** Bouton « abordée » : visible au survol, toujours visible une fois cochée. */
const TreatedButton: React.FC<{ treated: boolean; onClick: () => void }> = ({ treated, onClick }) => (
  <button
    type="button"
    onClick={(e) => { e.stopPropagation(); onClick(); }}
    aria-pressed={treated}
    aria-label={treated ? 'Remettre parmi les notes à aborder' : 'Marquer comme abordée'}
    title={treated ? 'Remettre parmi les notes à aborder' : 'Marquer comme abordée'}
    className={`flex h-[18px] w-[18px] items-center justify-center rounded-full border transition-colors ${
      treated
        ? 'border-[#047857] bg-[#047857] text-white'
        : 'border-line bg-white text-muted hover:border-[#047857] hover:text-[#047857]'
    }`}
  >
    <Check className="h-3 w-3" strokeWidth={3} aria-hidden />
  </button>
);

const RetroNoteCard: React.FC<{
  note: RetroNote;
  myId: string;
  zone: Zone | null;
  fresh: boolean;
  onLike: (id: string) => void;
  onEdit: (id: string) => void;
  onTreated: (ids: string[], treated: boolean) => void;
  onDragStart: () => void;
  onDragEnd: () => void;
  dropProps: DropProps;
}> = ({ note, myId, zone, fresh, onLike, onEdit, onTreated, onDragStart, onDragEnd, dropProps }) => {
  const ref = useRef<HTMLLIElement>(null);
  useEffect(() => {
    if (fresh) ref.current?.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'smooth' });
  }, [fresh]);

  if (!note.revealed) {
    return (
      <li
        className="h-[46px] w-[128px] rounded-md border-l-4 bg-white/55 shadow-sm"
        style={{ borderLeftColor: note.authorColor }}
        aria-label="Note masquée (non révélée)"
      />
    );
  }

  const treated = !!note.treated;
  const mine = note.authorId === myId;
  return (
    <li
      ref={ref}
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      {...dropProps}
      title="Glissez sur le bord d'une note pour la ranger, au centre pour les empiler"
      className={`group relative w-[128px] cursor-grab rounded-md border-l-4 bg-white px-2 py-1.5 shadow-sm transition-[box-shadow,opacity] hover:shadow-md active:cursor-grabbing ${
        zone === 'pile' ? 'ring-2 ring-teal' : ''
      } ${treated ? 'opacity-55 hover:opacity-100' : ''} ${fresh ? 'retro-fraiche' : ''}`}
      style={{
        borderLeftColor: note.authorColor,
        ['--halo' as string]: `${note.authorColor}66`,
      }}
    >
      <DropMarker zone={zone} />
      {fresh && (
        <span
          className="absolute -top-2 left-1.5 rounded-full px-1.5 text-[9px] font-bold uppercase tracking-wide text-white shadow-sm"
          style={{ background: note.authorColor }}
        >
          Nouveau
        </span>
      )}
      <p className={`break-words pr-3 text-xs leading-snug ${treated ? 'text-muted line-through' : 'text-navy'}`}>{note.text}</p>
      <div className="mt-1 flex items-center gap-1">
        <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: note.authorColor }} aria-hidden />
        <span className="truncate text-[10px] font-semibold text-muted">{note.authorName}</span>
        <LikeButton note={note} myId={myId} onLike={onLike} />
      </div>
      <span
        className={`absolute right-1 top-1 flex items-center gap-0.5 ${
          treated ? '' : 'opacity-0 focus-within:opacity-100 group-hover:opacity-100'
        }`}
      >
        {mine && (
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onEdit(note.id); }}
            aria-label="Modifier ma note"
            title="Modifier ma note"
            className={`flex h-[18px] w-[18px] items-center justify-center rounded-full border border-line bg-white text-muted transition-colors hover:text-navy ${
              treated ? 'opacity-0 focus-visible:opacity-100 group-hover:opacity-100' : ''
            }`}
          >
            <Pencil className="h-2.5 w-2.5" aria-hidden />
          </button>
        )}
        <TreatedButton treated={treated} onClick={() => onTreated([note.id], !treated)} />
      </span>
    </li>
  );
};

const RetroPileCard: React.FC<{
  notes: RetroNote[];
  color: string;
  zone: Zone | null;
  onOpen: () => void;
  onTreated: (ids: string[], treated: boolean) => void;
  onDragStart: () => void;
  onDragEnd: () => void;
  dropProps: DropProps;
}> = ({ notes, color, zone, onOpen, onTreated, onDragStart, onDragEnd, dropProps }) => {
  const likes = notes.reduce((sum, n) => sum + n.likedBy.length, 0);
  const treated = notes.every((n) => n.treated);
  return (
    <li
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      {...dropProps}
      className={`group relative w-[128px] cursor-grab transition-opacity active:cursor-grabbing ${
        treated ? 'opacity-55 hover:opacity-100' : ''
      }`}
    >
      <DropMarker zone={zone} />
      <span className="absolute inset-0 translate-x-[3px] translate-y-[-2px] rotate-[3deg] rounded-md bg-white/70 shadow-sm" aria-hidden />
      <span className="absolute inset-0 translate-x-[-2px] translate-y-[2px] rotate-[-2deg] rounded-md bg-white/55 shadow-sm" aria-hidden />
      <button
        type="button"
        onClick={onOpen}
        aria-label={`Tas de ${notes.length} notes : ${notes[0].text}. Ouvrir`}
        className={`relative block w-full rounded-md border-l-4 bg-white px-2 py-1.5 text-left shadow-sm transition-shadow hover:shadow-md ${
          zone === 'pile' ? 'ring-2 ring-teal' : ''
        }`}
        style={{ borderLeftColor: color }}
      >
        <p className={`line-clamp-3 break-words pr-3 text-xs leading-snug ${treated ? 'text-muted line-through' : 'text-navy'}`}>{notes[0].text}</p>
        <span className="mt-1 flex items-center gap-1 text-[10px] font-bold" style={{ color }}>
          <Layers className="h-3 w-3" aria-hidden /> {notes.length} notes
          {likes > 0 && (
            <span className="ml-auto inline-flex items-center gap-0.5 text-[#ec4899]">
              <Heart className="h-3 w-3" style={{ fill: '#ec4899' }} aria-hidden /> {likes}
            </span>
          )}
        </span>
      </button>
      <span className={`absolute right-1 top-1 ${treated ? '' : 'opacity-0 focus-within:opacity-100 group-hover:opacity-100'}`}>
        <TreatedButton treated={treated} onClick={() => onTreated(notes.map((n) => n.id), !treated)} />
      </span>
    </li>
  );
};

const RetroPileModal: React.FC<{
  notes: RetroNote[];
  myId: string;
  onLike: (id: string) => void;
  onEdit: (id: string) => void;
  onUnpile: (id: string) => void;
  onClose: () => void;
}> = ({ notes, myId, onLike, onEdit, onUnpile, onClose }) => {
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
              <p className={`text-sm leading-snug ${n.treated ? 'text-muted line-through' : 'text-navy'}`}>{n.text}</p>
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
                {n.authorId === myId && (
                  <button
                    type="button"
                    onClick={() => onEdit(n.id)}
                    className="ml-3 text-[11px] font-semibold text-muted underline-offset-2 transition-colors hover:text-navy hover:underline"
                  >
                    Modifier
                  </button>
                )}
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
