import React from 'react';
import type { ToolParticipant } from '@/hooks/useToolSession';
import { aCarteEmoji, type PokerState } from './pokerLogic';
import { PokerCarteEmoji } from './PokerCarteEmoji';

interface PokerBoardProps {
  state: PokerState;
  /** En ligne, plus les votants dont la connexion a décroché (`online: false`). */
  participants: (ToolParticipant & { online?: boolean })[];
  myId: string;
  /** Emoji de la carte emoji (suite « Fibonacci + »), propre à chacun. */
  myEmoji: string;
  onVote: (value: string) => void;
  onChooseEmoji: (emoji: string) => void;
}

/** Cartes de vote et participants (la story est dans la barre du haut). */
export const PokerBoard: React.FC<PokerBoardProps> = ({ state, participants, myId, myEmoji, onVote, onChooseEmoji }) => {
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
            {aCarteEmoji(suiteKey) && (
              <PokerCarteEmoji
                emoji={myEmoji}
                selected={!!myVote && myVote === myEmoji}
                locked={revealed}
                onVote={onVote}
                onChoose={onChooseEmoji}
              />
            )}
          </div>
        </section>

        {/* Participants */}
        <section aria-labelledby="players-title">
          <h2 id="players-title" className="mb-3 text-xs font-bold uppercase tracking-wide text-muted">
            Participants
          </h2>
          <ul className="flex flex-wrap items-start gap-3" aria-live="polite">
            {participants.map((p) => {
              const voted = votes[p.id] !== undefined;
              const isMe = p.id === myId;
              return (
                <li key={p.id} className="flex flex-col items-center">
                  <div
                    className={[
                      'relative min-w-[130px] rounded-xl border-[1.5px] bg-white p-4 text-center shadow-card transition-all',
                      voted ? 'border-success-500 bg-success-50' : 'border-line',
                      isMe ? '!border-teal' : '',
                      p.online === false ? 'opacity-60' : '',
                    ].join(' ')}
                  >
                    {/* Pastille posée sur le bord : la carte garde la hauteur des autres. */}
                    {p.isHost && (
                      <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full border border-warning-200 bg-warning-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-warning-700">
                        Animateur
                      </span>
                    )}
                    <div
                      className="mx-auto mb-2 flex h-11 w-11 items-center justify-center rounded-full text-lg font-bold text-white"
                      style={{ background: voted ? '#22c55e' : isMe ? '#00d4b4' : p.color }}
                      aria-hidden
                    >
                      {p.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="mx-auto max-w-[160px] truncate text-sm font-bold text-navy" title={p.name}>
                      {p.name}
                    </div>
                    <div className="mt-1 text-xs text-muted">
                      {p.online === false ? (
                        'Hors ligne · a voté'
                      ) : revealed && !voted ? (
                        'Pas de vote'
                      ) : voted ? (
                        <span className="inline-flex items-center gap-1.5">
                          <span className="h-1.5 w-1.5 rounded-full bg-success-500" aria-hidden />
                          A voté
                        </span>
                      ) : (
                        'En attente…'
                      )}
                    </div>
                  </div>
                  {/* Une fois révélé, le vote s'affiche en grand sous la carte. */}
                  {revealed && voted && (
                    <span
                      className={`mt-2 font-black leading-none text-navy ${votes[p.id].length > 3 ? 'text-3xl' : 'text-5xl'}`}
                      aria-label={`Vote de ${p.name} : ${votes[p.id]}`}
                    >
                      {votes[p.id]}
                    </span>
                  )}
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
