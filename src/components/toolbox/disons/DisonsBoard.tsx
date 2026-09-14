import React, { useEffect, useState } from 'react';
import { AlertCircle, Check, Heart, Play, Trash2, Undo2 } from 'lucide-react';
import type { BoardNote } from '@/components/toolbox/shared/boardNotes';
import { DISONS_KINDS, cardAuthor, columnCards, type DisonsKindInfo } from './disonsLogic';

interface DisonsBoardProps {
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
 * Tableau partagé à deux colonnes (Freins / Moteurs) : cartes publiées,
 * retenues en tête puis triées par cœurs ; vote, « Retenir » et
 * suppression confirmée pour l'animateur.
 */
export const DisonsBoard: React.FC<DisonsBoardProps> = ({
  notes, myId, isFacilitator, anonymous, voteLimit, votesLeft, onVote, onRetain, onDelete,
}) => {
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  // La demande de confirmation de suppression expire après quelques secondes.
  useEffect(() => {
    if (!confirmDelete) return;
    const t = setTimeout(() => setConfirmDelete(null), 4000);
    return () => clearTimeout(t);
  }, [confirmDelete]);

  const askDelete = (id: string) => {
    if (confirmDelete === id) { onDelete(id); setConfirmDelete(null); } else setConfirmDelete(id);
  };

  return (
    <div className="relative flex flex-1 flex-col overflow-hidden">
      {votesLeft !== null && (
        <div className="flex items-center justify-end border-b border-line bg-surface px-4 py-2">
          <p
            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold ${votesLeft === 0 ? 'bg-danger-50 text-danger-600' : 'bg-white text-navy'}`}
            aria-live="polite"
          >
            <Heart className="h-3.5 w-3.5" style={{ fill: '#ec4899', color: '#ec4899' }} aria-hidden />
            Cœurs restants : {votesLeft} / {voteLimit}
          </p>
        </div>
      )}
      <div className="grid flex-1 grid-cols-1 gap-3 overflow-y-auto p-4 md:grid-cols-2">
        {DISONS_KINDS.map((kind) => {
          const Icon = kind.key === 'frein' ? AlertCircle : Play;
          const pool = columnCards(notes, kind.key);
          return (
            <section
              key={kind.key}
              aria-label={kind.columnTitle}
              className="flex min-h-[220px] flex-col overflow-hidden rounded-xl"
              style={{ background: kind.bg }}
            >
              <header className="flex items-center gap-2 px-3.5 pt-3">
                <span
                  className="flex h-6 w-6 items-center justify-center rounded-md text-white"
                  style={{ background: kind.color }}
                  aria-hidden
                >
                  <Icon className="h-3.5 w-3.5" />
                </span>
                <h3 className="text-sm font-bold" style={{ color: kind.color }}>{kind.columnTitle}</h3>
                <span className="ml-auto rounded-full bg-white/70 px-2 py-0.5 text-xs font-bold text-navy">
                  {pool.length}
                </span>
              </header>

              {pool.length === 0 ? (
                <p className="flex flex-1 items-center justify-center p-6 text-center text-sm font-semibold" style={{ color: `${kind.color}88` }}>
                  {kind.key === 'frein' ? 'Les freins publiés apparaîtront ici.' : 'Les moteurs publiés apparaîtront ici.'}
                </p>
              ) : (
                <ul className="flex flex-1 flex-col content-start gap-2 p-3.5" aria-live="polite">
                  {pool.map((n) => (
                    <DisonsCard
                      key={n.id}
                      note={n}
                      kind={kind}
                      myId={myId}
                      anonymous={anonymous}
                      isFacilitator={isFacilitator}
                      outOfVotes={votesLeft === 0}
                      confirmingDelete={confirmDelete === n.id}
                      onVote={onVote}
                      onRetain={onRetain}
                      onDelete={askDelete}
                    />
                  ))}
                </ul>
              )}
            </section>
          );
        })}
      </div>
    </div>
  );
};

const DisonsCard: React.FC<{
  note: BoardNote;
  kind: DisonsKindInfo;
  myId: string;
  anonymous: boolean;
  isFacilitator: boolean;
  outOfVotes: boolean;
  confirmingDelete: boolean;
  onVote: (id: string) => void;
  onRetain: (id: string) => void;
  onDelete: (id: string) => void;
}> = ({ note, kind, myId, anonymous, isFacilitator, outOfVotes, confirmingDelete, onVote, onRetain, onDelete }) => {
  const voted = note.likedBy.includes(myId);
  const mine = note.authorId === myId;
  return (
    <li
      className={`relative rounded-lg border-l-4 bg-white p-2.5 shadow-sm transition-shadow hover:shadow-md ${
        note.retained ? 'outline outline-2 outline-warning-500' : ''
      }`}
      style={{ borderLeftColor: kind.color }}
    >
      {note.retained && (
        <span className="absolute -top-2 right-2 inline-flex items-center gap-0.5 rounded-full bg-warning-500 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
          <Check className="h-3 w-3" aria-hidden /> Retenue
        </span>
      )}
      <p className="break-words text-[13px] leading-snug text-navy">{note.text}</p>
      <div className="mt-1.5 flex items-center gap-1.5">
        {!(anonymous && !mine) && <span className="h-2 w-2 rounded-full" style={{ background: note.authorColor }} aria-hidden />}
        <span className="text-[11px] font-semibold text-muted">{mine ? 'Votre carte' : cardAuthor(note, anonymous)}</span>
        <button
          type="button"
          onClick={() => onVote(note.id)}
          disabled={mine}
          aria-pressed={voted}
          title={mine ? 'On ne vote pas pour ses propres cartes' : outOfVotes && !voted ? 'Plus de cœurs disponibles' : undefined}
          aria-label={voted ? `Retirer mon vote (${note.likedBy.length})` : `Voter (${note.likedBy.length})`}
          className={`ml-auto inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[11px] font-bold transition-colors disabled:cursor-default disabled:opacity-40 ${
            outOfVotes && !voted && !mine ? 'opacity-50' : ''
          }`}
          style={{ color: voted ? '#ec4899' : '#94a3b8' }}
        >
          <Heart className="h-3 w-3" style={{ fill: voted ? '#ec4899' : 'none' }} aria-hidden />
          {note.likedBy.length}
        </button>
        {isFacilitator && (
          <span className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => onRetain(note.id)}
              className={`inline-flex items-center gap-0.5 rounded px-1.5 py-0.5 text-[10px] font-bold transition-colors ${
                note.retained ? 'bg-warning-100 text-warning-700' : 'bg-surface text-muted hover:text-navy'
              }`}
            >
              {note.retained ? <><Undo2 className="h-3 w-3" aria-hidden /> Annuler</> : <><Check className="h-3 w-3" aria-hidden /> Retenir</>}
            </button>
            <button
              type="button"
              onClick={() => onDelete(note.id)}
              title="Supprimer (modération)"
              aria-label={confirmingDelete ? 'Confirmer la suppression' : 'Supprimer la carte'}
              className={`inline-flex items-center gap-0.5 rounded px-1 py-0.5 text-[10px] font-bold transition-colors ${
                confirmingDelete ? 'bg-danger-600 text-white' : 'text-muted hover:text-danger-600'
              }`}
            >
              <Trash2 className="h-3 w-3" aria-hidden /> {confirmingDelete && 'Supprimer ?'}
            </button>
          </span>
        )}
      </div>
    </li>
  );
};

export default DisonsBoard;
