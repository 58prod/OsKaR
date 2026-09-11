import React from 'react';
import type { ToolParticipant } from '@/hooks/useToolSession';
import type { PokerState } from './pokerLogic';

interface PokerBoardProps {
  state: PokerState;
  /** En ligne, plus les votants dont la connexion a décroché (`online: false`). */
  participants: (ToolParticipant & { online?: boolean })[];
  myId: string;
  onVote: (value: string) => void;
}

/** Cartes de vote et participants (la story est dans la barre du haut). */
export const PokerBoard: React.FC<PokerBoardProps> = ({ state, participants, myId, onVote }) => {
  const { suite, suiteKey, votes, revealed } = state;
  const myVote = votes[myId];
  const isTshirt = suiteKey === 'tshirt';

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <div className="flex flex-1 flex-col gap-6 overflow-y-auto p-6">
        {/* Vote zone */}
        <section aria-labelledby="vote-title">
          <h2 id="vote-title" className="mb-3 text-xs font-bold uppercase tracking-wide text-muted">
            Voter
          </h2>
          <div className="flex flex-wrap gap-3.5" role="group" aria-label="Cartes de vote">
            {suite.map((val) => {
              const selected = myVote === val;
              const locked = revealed;
              return (
                <button
                  key={val}
                  type="button"
                  onClick={() => !locked && onVote(val)}
                  disabled={locked}
                  aria-pressed={selected}
                  className={[
                    'flex items-center justify-center rounded-xl border-2 font-extrabold transition-all',
                    'h-[122px] w-[90px] shadow-card',
                    isTshirt ? 'text-lg' : 'text-3xl',
                    selected
                      ? 'border-navy bg-navy text-white -translate-y-2.5 scale-105'
                      : 'border-line bg-white text-navy hover:-translate-y-2 hover:border-navy',
                    locked ? 'cursor-not-allowed opacity-40 hover:translate-y-0' : 'cursor-pointer',
                  ].join(' ')}
                >
                  {val}
                </button>
              );
            })}
          </div>
        </section>

        {/* Participants */}
        <section aria-labelledby="players-title">
          <h2 id="players-title" className="mb-3 text-xs font-bold uppercase tracking-wide text-muted">
            Participants
          </h2>
          <ul className="flex flex-wrap gap-3" aria-live="polite">
            {participants.map((p) => {
              const voted = votes[p.id] !== undefined;
              const isMe = p.id === myId;
              return (
                <li
                  key={p.id}
                  className={[
                    'min-w-[130px] rounded-xl border-[1.5px] bg-white p-4 text-center shadow-card transition-all',
                    voted ? 'border-success-500 bg-success-50' : 'border-line',
                    isMe ? '!border-teal' : '',
                    p.online === false ? 'opacity-60' : '',
                  ].join(' ')}
                >
                  <div
                    className="mx-auto mb-2 flex h-11 w-11 items-center justify-center rounded-full text-lg font-bold text-white"
                    style={{ background: voted ? '#22c55e' : isMe ? '#00d4b4' : p.color }}
                    aria-hidden
                  >
                    {p.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="text-sm font-bold text-navy">
                    {p.name}
                    {p.isHost && (
                      <span className="ml-1 block text-[11px] font-bold text-warning-700">animateur</span>
                    )}
                    {p.online === false && (
                      <span className="ml-1 block text-[11px] font-semibold text-muted">hors ligne</span>
                    )}
                  </div>
                  <div className="mt-1 text-xs text-muted">
                    {revealed && voted ? (
                      <span className="text-xl font-black text-navy">{votes[p.id]}</span>
                    ) : voted ? (
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

export default PokerBoard;
