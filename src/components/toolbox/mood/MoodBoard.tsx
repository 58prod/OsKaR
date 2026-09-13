import React, { useEffect, useState } from 'react';
import { Check, Pencil } from 'lucide-react';
import type { ToolParticipant } from '@/hooks/useToolSession';
import {
  INITIAL_MOOD_SCORES, MOOD_ACCENT, MOOD_DIMS, averageOf, formatNote, type MoodScores, type MoodState,
} from './moodLogic';

interface MoodBoardProps {
  state: MoodState;
  /** En ligne, plus les votants dont la connexion a décroché (`online: false`). */
  participants: (ToolParticipant & { online?: boolean })[];
  myId: string;
  onVote: (dims: MoodScores) => void;
}

/** Vote Team Mood (5 curseurs de 1 à 10) et participants. */
export const MoodBoard: React.FC<MoodBoardProps> = ({ state, participants, myId, onVote }) => {
  const myVote = state.votes[myId];
  const myKey = myVote ? MOOD_DIMS.map((d) => myVote.dims[d.key]).join(',') : '';

  const [scores, setScores] = useState<MoodScores>(myVote?.dims ?? INITIAL_MOOD_SCORES);
  const [editing, setEditing] = useState(false);

  // Retrouve ses notes après un rafraîchissement ; pas pendant une modification.
  useEffect(() => {
    if (myVote && !editing) setScores(myVote.dims);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [myKey, editing]);

  const voted = myVote !== undefined;
  const locked = state.revealed || (voted && !editing);

  const submit = () => {
    if (state.revealed) return;
    onVote(scores);
    setEditing(false);
  };

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <div className="flex flex-1 flex-col gap-6 overflow-y-auto p-6">
        <section aria-labelledby="mood-vote-title">
          <h2 id="mood-vote-title" className="mb-3 text-xs font-bold uppercase tracking-wide text-muted">
            Vos notes
          </h2>
          <div className="max-w-xl rounded-card border border-line bg-white p-5 shadow-card">
            <p className="text-base font-bold text-navy">Comment vous sentez-vous ?</p>
            <p className="mt-1 text-sm text-muted">
              Notez chaque dimension de 1 à 10. Vos notes restent masquées jusqu’à la révélation
              {state.anonymous ? ', puis seules les moyennes de l’équipe sont montrées.' : '.'}
            </p>

            <div className="mt-5 flex flex-col gap-5">
              {MOOD_DIMS.map((d) => {
                const val = scores[d.key];
                const pct = ((val - 1) / 9) * 100;
                return (
                  <div key={d.key}>
                    <div className="flex items-center gap-2">
                      <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: d.color }} aria-hidden />
                      <label htmlFor={`mood-${d.key}`} className="flex-1 text-sm font-bold text-navy">{d.label}</label>
                      <span className="text-sm font-extrabold" style={{ color: d.color }}>{val}</span>
                    </div>
                    <p className="mb-1.5 ml-[18px] text-xs text-muted">{d.sub}</p>
                    <input
                      id={`mood-${d.key}`}
                      type="range"
                      min={1}
                      max={10}
                      value={val}
                      disabled={locked}
                      onChange={(e) => setScores((s) => ({ ...s, [d.key]: Number(e.target.value) }))}
                      aria-valuetext={`${val} sur 10`}
                      className="h-2 w-full cursor-pointer appearance-none rounded-full outline-none focus-visible:ring-2 focus-visible:ring-teal disabled:cursor-not-allowed disabled:opacity-70"
                      style={{ background: `linear-gradient(to right, ${d.color} ${pct}%, #e2e8f0 ${pct}%)`, accentColor: d.color }}
                    />
                  </div>
                );
              })}
            </div>

            {state.revealed ? (
              <p className="mt-5 text-center text-sm font-semibold text-muted">
                {voted ? 'Les résultats sont révélés : merci pour vos notes !' : 'Les résultats sont révélés : le vote est clos.'}
              </p>
            ) : voted && !editing ? (
              <div className="mt-5 flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-lg bg-success-50 px-3 py-2 text-sm font-bold text-success-700">
                  <Check className="h-4 w-4" aria-hidden /> Vos notes sont enregistrées
                </span>
                <button
                  type="button"
                  onClick={() => setEditing(true)}
                  className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold text-muted transition-colors hover:bg-surface hover:text-navy focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal"
                >
                  <Pencil className="h-3.5 w-3.5" aria-hidden /> Modifier mes notes
                </button>
              </div>
            ) : (
              <div className="mt-5 flex gap-2">
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
                  className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold text-white transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal"
                  style={{ background: MOOD_ACCENT }}
                >
                  <Check className="h-4 w-4" aria-hidden /> {editing ? 'Mettre à jour mes notes' : 'Enregistrer mes notes'}
                </button>
              </div>
            )}
          </div>
        </section>

        {/* Participants */}
        <section aria-labelledby="mood-players">
          <h2 id="mood-players" className="mb-3 text-xs font-bold uppercase tracking-wide text-muted">Participants</h2>
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
                    {p.isHost && <span className="ml-1 block text-[11px] font-bold text-warning-700">animateur</span>}
                    {p.online === false && <span className="ml-1 block text-[11px] font-semibold text-muted">hors ligne</span>}
                  </div>
                  <div className="mt-1 text-xs text-muted">
                    {state.revealed && v && !state.anonymous ? (
                      <span className="text-base font-black text-navy">
                        {formatNote(averageOf(MOOD_DIMS.map((d) => v.dims[d.key])))}
                        <span className="text-xs font-semibold text-muted"> / 10</span>
                      </span>
                    ) : hasVoted ? (
                      <span className="inline-flex items-center gap-1.5">
                        <span className="h-1.5 w-1.5 rounded-full bg-success-500" aria-hidden /> A voté
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

export default MoodBoard;
