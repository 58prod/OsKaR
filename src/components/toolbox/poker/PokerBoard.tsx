import React from 'react';
import type { ToolParticipant } from '@/hooks/useToolSession';
import { Eye } from 'lucide-react';
import { CARTE_EMOJI, type PokerState } from './pokerLogic';

/** Couleur des observateurs : liseré de leur carte et pastille. */
export const OBSERVATEUR_COULEUR = '#0284c7';
import { PokerCarteEmoji } from './PokerCarteEmoji';

interface PokerBoardProps {
  state: PokerState;
  /** En ligne, plus les votants dont la connexion a décroché (`online: false`). */
  participants: (ToolParticipant & { online?: boolean; observateur?: boolean })[];
  myId: string;
  /** Emoji de la carte emoji (suite « Fibonacci + »), propre à chacun. */
  myEmoji: string;
  onVote: (value: string) => void;
  onChooseEmoji: (emoji: string) => void;
  /** La personne suit la séance en observateur (ne vote pas). */
  jeSuisObservateur: boolean;
  onToggleObservateur: (value: boolean) => void;
}

/** Cartes de vote et participants (le ticket est dans la barre du haut). */
export const PokerBoard: React.FC<PokerBoardProps> = ({
  state, participants, myId, myEmoji, onVote, onChooseEmoji, jeSuisObservateur, onToggleObservateur,
}) => {
  const { suite, suiteKey, votes, revealed } = state;
  const myVote = votes[myId];
  const isTshirt = suiteKey === 'tshirt';

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <div className="flex flex-1 flex-col gap-6 overflow-y-auto p-6">
        {/* Vote zone */}
        <section aria-labelledby="vote-title">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <h2 id="vote-title" className="text-xs font-bold uppercase tracking-wide text-muted">
              {jeSuisObservateur ? 'Vous observez' : 'Voter'}
            </h2>
            {/* Observateur : suit la séance sans voter (choix de chacun). */}
            <label
              className="inline-flex cursor-pointer select-none items-center gap-2"
              title="En observateur, vous suivez la séance sans voter : on n’attend pas votre vote pour révéler."
            >
              <span className="inline-flex items-center gap-1 text-xs font-semibold" style={{ color: OBSERVATEUR_COULEUR }}>
                <Eye className="h-3.5 w-3.5" aria-hidden /> Observateur
              </span>
              <span className="relative inline-flex h-[18px] w-8 items-center">
                <input
                  type="checkbox"
                  role="switch"
                  checked={jeSuisObservateur}
                  onChange={(e) => onToggleObservateur(e.target.checked)}
                  className="peer h-full w-full cursor-pointer appearance-none rounded-full bg-line transition-colors checked:bg-[#0284c7] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal focus-visible:ring-offset-1"
                />
                <span
                  aria-hidden
                  className="pointer-events-none absolute left-[2px] h-[14px] w-[14px] rounded-full bg-white shadow transition-transform peer-checked:translate-x-[14px]"
                />
              </span>
            </label>
          </div>
          {jeSuisObservateur && (
            <p className="mb-3 text-sm text-muted">
              Vous suivez la séance sans voter. Désactivez « Observateur » pour voter.
            </p>
          )}
          <div className="flex flex-wrap gap-3.5" role="group" aria-label="Cartes de vote">
            {suite.map((val) => {
              const locked = revealed || jeSuisObservateur;
              if (val === CARTE_EMOJI) {
                return (
                  <PokerCarteEmoji
                    key={val}
                    emoji={myEmoji}
                    selected={!!myVote && myVote === myEmoji}
                    locked={locked}
                    onVote={onVote}
                    onChoose={onChooseEmoji}
                  />
                );
              }
              const selected = myVote === val;
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
          <ul className="flex flex-wrap items-start gap-3" aria-live="polite">
            {participants.map((p) => {
              const voted = votes[p.id] !== undefined;
              const isMe = p.id === myId;
              const obs = !!p.observateur;
              return (
                <li key={p.id} className="flex flex-col items-center">
                  <div
                    className={[
                      'relative min-w-[130px] rounded-xl border-[1.5px] bg-white p-4 text-center shadow-card transition-all',
                      voted ? 'border-success-500 bg-success-50' : 'border-line',
                      isMe && !obs ? '!border-teal' : '',
                      p.online === false ? 'opacity-60' : '',
                    ].join(' ')}
                    style={obs ? { borderColor: OBSERVATEUR_COULEUR, borderWidth: 2 } : undefined}
                  >
                    {/* Pastilles posées sur le bord : la carte garde la hauteur des autres. */}
                    {(p.isHost || obs) && (
                      <span className="absolute -top-2.5 left-1/2 flex -translate-x-1/2 gap-1">
                        {p.isHost && (
                          <span className="whitespace-nowrap rounded-full border border-warning-200 bg-warning-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-warning-700">
                            Animateur
                          </span>
                        )}
                        {obs && (
                          <span
                            className="whitespace-nowrap rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide"
                            style={{ borderColor: '#bae6fd', background: '#f0f9ff', color: OBSERVATEUR_COULEUR }}
                          >
                            Observateur
                          </span>
                        )}
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
                      ) : obs ? (
                        <span style={{ color: OBSERVATEUR_COULEUR }}>Observe</span>
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
