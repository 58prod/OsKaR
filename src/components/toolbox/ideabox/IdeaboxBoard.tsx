import React, { useEffect, useMemo, useState } from 'react';
import { Check, Heart, Lightbulb, Trash2 } from 'lucide-react';
import type { BoardNote } from '@/components/toolbox/shared/boardNotes';
import {
  IDEA_CATEGORIES, authorLabel, getIdeaCategory, sortIdeas, type IdeaCategoryKey, type IdeaSort,
} from './ideaboxLogic';

interface IdeaboxBoardProps {
  notes: BoardNote[];
  myId: string;
  isFacilitator: boolean;
  anonymous: boolean;
  voteLimit: number;
  /** Cœurs restants (null = illimité). */
  votesLeft: number | null;
  onVote: (id: string) => void;
  onRetain: (id: string) => void;
  onDelete: (id: string) => void;
}

/**
 * Espace commun de la Boîte à idées : filtres par catégorie et tri (état
 * local), grille des idées publiées avec votes cœurs, badge « Populaire »
 * et colonne des idées retenues par l'animateur (visible par tous).
 */
export const IdeaboxBoard: React.FC<IdeaboxBoardProps> = ({
  notes, myId, isFacilitator, anonymous, voteLimit, votesLeft, onVote, onRetain, onDelete,
}) => {
  const [filter, setFilter] = useState<'all' | IdeaCategoryKey>('all');
  const [sort, setSort] = useState<IdeaSort>('votes');
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  // La demande de confirmation de suppression expire après quelques secondes.
  useEffect(() => {
    if (!confirmDelete) return;
    const t = setTimeout(() => setConfirmDelete(null), 4000);
    return () => clearTimeout(t);
  }, [confirmDelete]);

  const published = useMemo(() => notes.filter((n) => n.revealed), [notes]);
  const retained = useMemo(() => sortIdeas(published.filter((n) => n.retained), 'votes'), [published]);
  const pool = useMemo(() => {
    const base = published.filter((n) => !n.retained);
    return sortIdeas(filter === 'all' ? base : base.filter((n) => n.category === filter), sort);
  }, [published, filter, sort]);
  const maxVotes = published.filter((n) => !n.retained).reduce((max, n) => Math.max(max, n.likedBy.length), 0);
  // « Populaire » ne distingue que la tête du classement : pas de badge si trop d'idées sont à égalité.
  const topCount = published.filter((n) => !n.retained && n.likedBy.length === maxVotes).length;
  const showPopular = maxVotes >= 2 && topCount <= 3;
  const countBy = (key: IdeaCategoryKey) => published.filter((n) => !n.retained && n.category === key).length;

  const askDelete = (id: string) => {
    if (confirmDelete === id) { onDelete(id); setConfirmDelete(null); } else setConfirmDelete(id);
  };

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      {/* Barre filtres / tri */}
      <div className="flex flex-wrap items-center gap-2.5 border-b border-line bg-surface px-4 py-2.5">
        <span className="text-xs font-bold uppercase tracking-wide text-muted">Filtre</span>
        <div className="flex flex-wrap gap-1.5" role="group" aria-label="Filtrer par catégorie">
          <FilterPill label="Toutes" selected={filter === 'all'} onClick={() => setFilter('all')} />
          {IDEA_CATEGORIES.map((cat) => (
            <FilterPill
              key={cat.key}
              label={cat.label}
              count={countBy(cat.key)}
              dotColor={cat.color}
              selected={filter === cat.key}
              onClick={() => setFilter(cat.key)}
            />
          ))}
        </div>
        <div className="ml-auto flex items-center gap-1.5">
          <span className="text-xs font-bold uppercase tracking-wide text-muted">Tri</span>
          <FilterPill label="Popularité" selected={sort === 'votes'} onClick={() => setSort('votes')} />
          <FilterPill label="Récence" selected={sort === 'date'} onClick={() => setSort('date')} />
        </div>
        {votesLeft !== null && (
          <p
            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold ${votesLeft === 0 ? 'bg-danger-50 text-danger-600' : 'bg-white text-navy'}`}
            aria-live="polite"
          >
            <Heart className="h-3.5 w-3.5" style={{ fill: '#ec4899', color: '#ec4899' }} aria-hidden />
            Cœurs restants : {votesLeft} / {voteLimit}
          </p>
        )}
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Grille des idées publiées */}
        <div className="relative flex-1 overflow-y-auto p-4">
          {pool.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center gap-3 p-10 text-center text-muted">
              <Lightbulb className="h-12 w-12 opacity-30" aria-hidden />
              <p className="text-sm leading-relaxed">
                {published.length > 0 && filter !== 'all'
                  ? 'Aucune idée dans cette catégorie pour l’instant.'
                  : <>Les idées publiées par l’équipe apparaîtront ici.<br />Votez pour celles qui vous inspirent !</>}
              </p>
            </div>
          ) : (
            <ul className="grid grid-cols-[repeat(auto-fill,minmax(240px,1fr))] content-start gap-3.5" aria-live="polite">
              {pool.map((n) => (
                <IdeaCard
                  key={n.id}
                  note={n}
                  myId={myId}
                  anonymous={anonymous}
                  isFacilitator={isFacilitator}
                  isTopVoted={showPopular && n.likedBy.length === maxVotes}
                  outOfVotes={votesLeft === 0}
                  confirmingDelete={confirmDelete === n.id}
                  onVote={onVote}
                  onRetain={onRetain}
                  onDelete={askDelete}
                />
              ))}
            </ul>
          )}
        </div>

        {/* Colonne des idées retenues */}
        <aside className="relative flex w-[280px] shrink-0 flex-col overflow-hidden border-l-2 border-warning-200 bg-warning-50" aria-label="Idées retenues">
          <div className="flex items-center gap-1.5 border-b border-warning-200 px-4 py-3">
            <Check className="h-4 w-4 text-warning-700" aria-hidden />
            <h3 className="text-xs font-bold uppercase tracking-wide text-warning-700">Idées retenues</h3>
            <span className="ml-auto rounded-full bg-warning-500 px-2 py-0.5 text-[11px] font-bold text-white">
              {retained.length}
            </span>
          </div>
          <div className="flex flex-1 flex-col gap-2.5 overflow-y-auto p-3" aria-live="polite">
            {retained.length === 0 ? (
              <p className="m-auto px-4 text-center text-xs leading-relaxed text-warning-700/70">
                L’animateur retiendra ici les meilleures idées.
              </p>
            ) : (
              retained.map((n) => {
                const cat = getIdeaCategory(n.category);
                return (
                  <div key={n.id} className="rounded-lg border-l-4 bg-white p-3 shadow-sm" style={{ borderLeftColor: '#f59e0b' }}>
                    <span className="rounded-full px-2 py-0.5 text-[10px] font-bold text-white" style={{ background: cat.color }}>
                      {cat.label}
                    </span>
                    <p className="mt-1.5 break-words text-[13px] leading-snug text-navy">{n.text}</p>
                    <div className="mt-1.5 flex items-center gap-1.5">
                      {!anonymous && <span className="h-2 w-2 rounded-full" style={{ background: n.authorColor }} aria-hidden />}
                      <span className="text-[11px] font-semibold" style={{ color: anonymous ? '#94a3b8' : n.authorColor }}>
                        {authorLabel(n, anonymous)}
                      </span>
                      <span className="ml-auto inline-flex items-center gap-1 text-[11px] font-bold" style={{ color: '#ec4899' }}>
                        <Heart className="h-3 w-3" style={{ fill: '#ec4899' }} aria-hidden />
                        {n.likedBy.length}
                      </span>
                      {isFacilitator && (
                        <button
                          type="button"
                          onClick={() => onRetain(n.id)}
                          className="rounded-md border border-warning-200 px-1.5 py-0.5 text-[10px] font-bold text-warning-700 transition-colors hover:border-danger-500 hover:bg-danger-50 hover:text-danger-600"
                        >
                          Retirer
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </aside>
      </div>
    </div>
  );
};

/** Pastille de filtre / tri (état pressé = fond navy). */
const FilterPill: React.FC<{
  label: string;
  selected: boolean;
  count?: number;
  dotColor?: string;
  onClick: () => void;
}> = ({ label, selected, count, dotColor, onClick }) => (
  <button
    type="button"
    aria-pressed={selected}
    onClick={onClick}
    className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal ${
      selected ? 'border-navy bg-navy text-white' : 'border-line bg-white text-muted hover:text-navy'
    }`}
  >
    {dotColor && <span className="h-1.5 w-1.5 rounded-full" style={{ background: dotColor }} aria-hidden />}
    {label}
    {count ? <span className={selected ? 'text-white/70' : 'text-muted/70'}>{count}</span> : null}
  </button>
);

/** Carte d'idée publiée : badge catégorie, auteur, vote cœur, « Retenir » et suppression (animateur). */
const IdeaCard: React.FC<{
  note: BoardNote;
  myId: string;
  anonymous: boolean;
  isFacilitator: boolean;
  isTopVoted: boolean;
  outOfVotes: boolean;
  confirmingDelete: boolean;
  onVote: (id: string) => void;
  onRetain: (id: string) => void;
  onDelete: (id: string) => void;
}> = ({ note, myId, anonymous, isFacilitator, isTopVoted, outOfVotes, confirmingDelete, onVote, onRetain, onDelete }) => {
  const cat = getIdeaCategory(note.category);
  const voted = note.likedBy.includes(myId);
  const mine = note.authorId === myId;

  return (
    <li className={`relative flex flex-col gap-2 rounded-xl bg-white p-3.5 shadow-sm transition-shadow hover:shadow-md ${
      isTopVoted ? 'border-2 border-teal' : ''
    }`}>
      {isTopVoted && (
        <span className="absolute -top-2 right-2.5 rounded-full bg-teal px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-navy">
          ★ Populaire
        </span>
      )}
      <div className="flex items-center gap-2">
        <span className="rounded-full px-2 py-0.5 text-[10px] font-bold text-white" style={{ background: cat.color }}>
          {cat.label}
        </span>
        <span
          className="ml-auto inline-flex items-center gap-1 text-[11px] font-semibold"
          style={{ color: anonymous && !mine ? '#94a3b8' : note.authorColor }}
        >
          {!(anonymous && !mine) && <span className="h-2 w-2 rounded-full" style={{ background: note.authorColor }} aria-hidden />}
          {mine ? 'Votre idée' : authorLabel(note, anonymous)}
        </span>
      </div>
      <p className="flex-1 break-words text-sm leading-snug text-navy">{note.text}</p>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => onVote(note.id)}
          disabled={mine}
          aria-pressed={voted}
          title={mine ? 'On ne vote pas pour ses propres idées' : outOfVotes && !voted ? 'Plus de cœurs disponibles' : undefined}
          aria-label={voted ? `Retirer mon vote (${note.likedBy.length})` : `Voter (${note.likedBy.length})`}
          className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-bold transition-colors disabled:cursor-default disabled:opacity-40 ${
            voted ? 'border-pink-200 bg-pink-50' : 'border-line hover:border-pink-200'
          } ${outOfVotes && !voted && !mine ? 'opacity-50' : ''}`}
          style={{ color: voted ? '#ec4899' : '#94a3b8' }}
        >
          <Heart className="h-3.5 w-3.5" style={{ fill: voted ? '#ec4899' : 'none' }} aria-hidden />
          {note.likedBy.length}
        </button>
        {isFacilitator && (
          <div className="ml-auto flex items-center gap-1">
            <button
              type="button"
              onClick={() => onDelete(note.id)}
              aria-label={confirmingDelete ? 'Confirmer la suppression' : 'Supprimer cette idée'}
              title="Supprimer (modération)"
              className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-bold transition-colors ${
                confirmingDelete ? 'bg-danger-600 text-white' : 'text-muted hover:bg-danger-50 hover:text-danger-600'
              }`}
            >
              <Trash2 className="h-3.5 w-3.5" aria-hidden /> {confirmingDelete && 'Supprimer ?'}
            </button>
            <button
              type="button"
              onClick={() => onRetain(note.id)}
              className="inline-flex items-center gap-1 rounded-md bg-surface px-2 py-1 text-[11px] font-bold text-muted transition-colors hover:bg-warning-100 hover:text-warning-700"
            >
              <Check className="h-3.5 w-3.5" aria-hidden /> Retenir
            </button>
          </div>
        )}
      </div>
    </li>
  );
};

export default IdeaboxBoard;
