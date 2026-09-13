import React from 'react';
import { Check, Mic, SkipForward } from 'lucide-react';
import type { ToolParticipant } from '@/hooks/useToolSession';
import { DAILY_ACCENT, isActive, type DailyPerson, type DailyState } from './dailyLogic';

interface DailySidebarProps {
  state: DailyState;
  participants: ToolParticipant[];
  /** Personnes connues (en ligne ou du tour), avec leur statut de connexion. */
  people: Map<string, DailyPerson & { online: boolean }>;
  myId: string;
}

/** Liste latérale : ordre de passage et statut de chaque participant. */
export const DailySidebar: React.FC<DailySidebarProps> = ({ state, participants, people, myId }) => {
  const inRun = isActive(state.phase) || state.phase === 'done';
  // Ordre figé pendant la séance, sinon ordre de présence courant.
  const ids = inRun && state.order.length ? state.order : participants.map((p) => p.id);
  const speaking = state.phase === 'running' || state.phase === 'paused';

  return (
    <aside className="relative flex w-[280px] shrink-0 flex-col border-r border-line bg-white" aria-label="Ordre de passage">
      <div className="border-b border-line px-5 py-4">
        <h2 className="text-xs font-bold uppercase tracking-wide text-muted">Ordre de passage</h2>
        <p className="mt-0.5 text-sm text-navy">{ids.length} participant{ids.length > 1 ? 's' : ''}</p>
      </div>
      <ol className="flex-1 overflow-y-auto p-3">
        {ids.map((id, pos) => {
          const p = people.get(id);
          if (!p) return null;
          const isCurrent = speaking && pos === state.currentIdx;
          const isNext = state.phase === 'next' && pos === state.currentIdx + 1;
          const isSkipped = inRun && state.skipped.includes(id);
          const isDone = inRun && !isSkipped && (state.phase === 'done' || pos < state.currentIdx || (state.phase === 'next' && pos === state.currentIdx));
          const isSelf = id === myId;
          const status = isCurrent
            ? (state.phase === 'paused' ? 'En pause' : 'En cours…')
            : isNext ? 'À suivre' : isSkipped ? 'Passé' : isDone ? 'Terminé' : '';
          return (
            <li
              key={id}
              aria-current={isCurrent ? 'step' : undefined}
              className={[
                'mb-1.5 flex items-center gap-2.5 rounded-xl px-3 py-2.5 transition-colors',
                isCurrent ? 'bg-teal-light ring-1 ring-teal' : isNext ? 'ring-1 ring-line' : (isDone || isSkipped) ? 'opacity-60' : '',
                isSelf && !isCurrent ? 'bg-surface' : '',
              ].join(' ')}
            >
              {inRun && (
                <span className="w-4 shrink-0 text-right text-xs font-bold text-muted" aria-hidden>{pos + 1}</span>
              )}
              <span
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white ${p.online ? '' : 'opacity-50'}`}
                style={{ background: p.color }}
                aria-hidden
              >
                {p.name.charAt(0).toUpperCase()}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold text-navy">
                  {p.name}
                  {isSelf && <span className="ml-1 text-[11px] font-bold text-teal">vous</span>}
                </span>
                <span className="block text-[11px] text-muted">
                  {status}
                  {!p.online && <>{status ? ' · ' : ''}hors ligne</>}
                </span>
              </span>
              {isCurrent ? (
                <Mic className="h-4 w-4 shrink-0 text-teal" aria-hidden />
              ) : isNext ? (
                <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: DAILY_ACCENT }} aria-hidden />
              ) : isSkipped ? (
                <SkipForward className="h-4 w-4 shrink-0 text-muted" aria-hidden />
              ) : isDone ? (
                <Check className="h-4 w-4 shrink-0 text-success-600" aria-hidden />
              ) : null}
            </li>
          );
        })}
      </ol>
    </aside>
  );
};

export default DailySidebar;
