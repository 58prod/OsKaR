import React, { useEffect, useState } from 'react';
import { Check, Pencil, Star } from 'lucide-react';
import type { ToolParticipant } from '@/hooks/useToolSession';
import { StarRow } from './RotiResults';
import { ROTI_COMMENT_MAX, STAR_COLORS, STAR_LABELS, type RotiState } from './rotiLogic';

interface RotiBoardProps {
  state: RotiState;
  /** En ligne, plus les votants dont la connexion a décroché (`online: false`). */
  participants: (ToolParticipant & { online?: boolean })[];
  myId: string;
  onVote: (star: number, comment: string) => void;
}

/**
 * Vote ROTI (note de 1 à 5 étoiles + commentaire facultatif) et
 * participants ; la séance évaluée est dans la barre du haut.
 */
export const RotiBoard: React.FC<RotiBoardProps> = ({ state, participants, myId, onVote }) => {
  const myVote = state.votes[myId];
  const myStar = myVote?.star;
  const myComment = myVote?.comment;

  const [selected, setSelected] = useState(myStar ?? 0);
  const [comment, setComment] = useState(myComment ?? '');
  const [hover, setHover] = useState(0);
  const [editing, setEditing] = useState(false);

  // Retrouve son vote après un rafraîchissement ; pas pendant une modification.
  useEffect(() => {
    if (myStar !== undefined && !editing) {
      setSelected(myStar);
      setComment(myComment ?? '');
    }
  }, [myStar, myComment, editing]);

  const voted = myVote !== undefined;
  const locked = state.revealed || (voted && !editing);
  const display = (!locked && hover) || selected;
  const color = STAR_COLORS[display] || '#cbd5e1';

  const submit = () => {
    if (selected === 0 || state.revealed) return;
    onVote(selected, comment.trim());
    setEditing(false);
  };

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <div className="flex flex-1 flex-col gap-6 overflow-y-auto p-6">
        <section aria-labelledby="roti-vote-title">
          <h2 id="roti-vote-title" className="mb-3 text-xs font-bold uppercase tracking-wide text-muted">
            Votre note
          </h2>
          <div className="max-w-xl rounded-card border border-line bg-white p-5 shadow-card">
            <p className="text-center text-sm text-muted">Quel a été votre retour sur le temps investi ?</p>

            <div className="mt-3 flex justify-center gap-2" role="radiogroup" aria-label="Note de 1 à 5 étoiles">
              {[1, 2, 3, 4, 5].map((v) => {
                const filled = v <= display;
                return (
                  <button
                    key={v}
                    type="button"
                    role="radio"
                    aria-checked={selected === v}
                    aria-label={`${v} étoile${v > 1 ? 's' : ''} — ${STAR_LABELS[v]}`}
                    disabled={locked}
                    onMouseEnter={() => setHover(v)}
                    onMouseLeave={() => setHover(0)}
                    onFocus={() => setHover(v)}
                    onBlur={() => setHover(0)}
                    onClick={() => !locked && setSelected(v)}
                    className="rounded-lg p-1 transition-transform hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal disabled:cursor-not-allowed disabled:hover:scale-100"
                  >
                    <Star
                      className="h-10 w-10 transition-colors"
                      style={{ color, fill: filled ? color : 'none' }}
                      aria-hidden
                    />
                  </button>
                );
              })}
            </div>
            <p className="mt-2 h-5 text-center text-sm font-semibold" style={{ color: STAR_COLORS[display] || 'transparent' }}>
              {display ? STAR_LABELS[display] : ''}
            </p>

            <label htmlFor="roti-comment" className="mt-4 block text-xs font-bold uppercase tracking-wide text-muted">
              Commentaire (facultatif)
            </label>
            <textarea
              id="roti-comment"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              disabled={locked}
              maxLength={ROTI_COMMENT_MAX}
              rows={3}
              placeholder="Ce qui vous a le plus apporté, ou ce qu'on pourrait améliorer…"
              className="mt-1.5 w-full resize-none rounded-xl border border-line bg-white p-3 text-sm text-navy outline-none focus:border-teal disabled:cursor-not-allowed disabled:bg-surface"
            />

            {state.revealed ? (
              <p className="mt-3 text-center text-sm font-semibold text-muted">
                {voted ? 'Les notes sont révélées : merci pour votre vote !' : 'Les notes sont révélées : le vote est clos.'}
              </p>
            ) : voted && !editing ? (
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-lg bg-success-50 px-3 py-2 text-sm font-bold text-success-700">
                  <Check className="h-4 w-4" aria-hidden /> Vote enregistré
                </span>
                <button
                  type="button"
                  onClick={() => setEditing(true)}
                  className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold text-muted transition-colors hover:bg-surface hover:text-navy focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal"
                >
                  <Pencil className="h-3.5 w-3.5" aria-hidden /> Modifier mon vote
                </button>
              </div>
            ) : (
              <div className="mt-3 flex gap-2">
                {editing && (
                  <button
                    type="button"
                    onClick={() => setEditing(false)}
                    className="rounded-xl border border-line px-4 py-2.5 text-sm font-semibold text-navy transition-colors hover:bg-surface"
                  >
                    Annuler
                  </button>
                )}
                <button
                  type="button"
                  onClick={submit}
                  disabled={selected === 0}
                  className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-navy px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-navy-light focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <Check className="h-4 w-4" aria-hidden /> {editing ? 'Mettre à jour mon vote' : 'Enregistrer mon vote'}
                </button>
              </div>
            )}
          </div>
        </section>

        {/* Participants */}
        <section aria-labelledby="roti-players">
          <h2 id="roti-players" className="mb-3 text-xs font-bold uppercase tracking-wide text-muted">
            Participants
          </h2>
          <ul className="flex flex-wrap gap-3" aria-live="polite">
            {participants.map((p) => {
              const v = state.votes[p.id];
              const hasVoted = v !== undefined;
              const isMe = p.id === myId;
              return (
                <li
                  key={p.id}
                  className={[
                    'min-w-[130px] rounded-xl border-[1.5px] bg-white p-4 text-center shadow-card transition-all',
                    hasVoted ? 'border-success-500 bg-success-50' : 'border-line',
                    isMe ? '!border-teal' : '',
                    p.online === false ? 'opacity-60' : '',
                  ].join(' ')}
                >
                  <div
                    className="mx-auto mb-2 flex h-11 w-11 items-center justify-center rounded-full text-lg font-bold text-white"
                    style={{ background: hasVoted ? '#22c55e' : isMe ? '#00d4b4' : p.color }}
                    aria-hidden
                  >
                    {p.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="text-sm font-bold text-navy">
                    {p.name}{isMe ? ' (vous)' : ''}
                    {p.isHost && (
                      <span className="ml-1 block text-[11px] font-bold text-warning-700">animateur</span>
                    )}
                    {p.online === false && (
                      <span className="ml-1 block text-[11px] font-semibold text-muted">hors ligne</span>
                    )}
                  </div>
                  <div className="mt-1 text-xs text-muted">
                    {state.revealed && v ? (
                      <span className="inline-flex" aria-label={`${v.star} sur 5`}>
                        <StarRow value={v.star} size={14} color={STAR_COLORS[v.star]} />
                      </span>
                    ) : hasVoted ? (
                      <span className="inline-flex items-center gap-1.5">
                        <span className="h-1.5 w-1.5 rounded-full bg-success-500" aria-hidden />
                        A voté
                      </span>
                    ) : (
                      'En attente…'
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      </div>
    </div>
  );
};

export default RotiBoard;
