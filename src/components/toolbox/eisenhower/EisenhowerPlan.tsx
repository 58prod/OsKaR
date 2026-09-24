import React from 'react';
import { Layers } from 'lucide-react';
import { TexteSynchro } from '@/components/toolbox/shared/TexteSynchro';
import {
  EISENHOWER_PORTEUR_MAX, QUADRANTS, groupesDuQuadrant,
  type EisenhowerState, type EisenhowerTicket, type GroupeTickets,
} from './eisenhowerLogic';

interface EisenhowerPlanProps {
  state: EisenhowerState;
  groupes: GroupeTickets[];
  myId: string;
  texteDe: (t: EisenhowerTicket) => string;
  onOpen: (id: string) => void;
  onPorteur: (id: string, text: string) => void;
  onEcheance: (id: string, text: string) => void;
}

const aujourdhui = () => new Date().toISOString().slice(0, 10);

/**
 * Le plan d'action : les tickets quadrant par quadrant, du plus prioritaire
 * au moins prioritaire (d'après leur place sur la matrice), avec leur
 * porteur et leur échéance, modifiables sur place.
 */
export const EisenhowerPlan: React.FC<EisenhowerPlanProps> = ({
  state, groupes, myId, texteDe, onOpen, onPorteur, onEcheance,
}) => {
  const echu = aujourdhui();
  const auteur = (t: EisenhowerTicket) => (t.authorId === myId ? 'Vous' : state.anonymous ? 'Anonyme' : t.authorName);

  return (
    <div className="relative flex-1 overflow-auto bg-surface p-4">
      <div className="mx-auto grid max-w-[1100px] gap-4 lg:grid-cols-2">
        {QUADRANTS.map((z) => {
          const liste = groupesDuQuadrant(groupes, z.key);
          const suivi = z.key !== 'abandonner';
          return (
            <section key={z.key} className="rounded-xl border border-line border-t-4 bg-white p-4 shadow-card" style={{ borderTopColor: z.color }} aria-labelledby={`plan-${z.key}`}>
              <h2 id={`plan-${z.key}`} className="text-base font-extrabold" style={{ color: z.color }}>
                {z.rang}. {z.verbe}
                <span className="ml-2 text-xs font-semibold text-muted">{z.criteres} · {liste.length}</span>
              </h2>
              <p className="mt-0.5 text-xs text-muted">{z.desc}</p>

              {liste.length === 0 ? (
                <p className="mt-3 rounded-lg bg-surface px-3 py-2 text-sm text-muted">Aucun ticket dans ce quadrant.</p>
              ) : (
                <ol className="mt-3 flex flex-col gap-2">
                  {liste.map((g, i) => {
                    const echeance = state.echeances[g.tete.id]?.text ?? '';
                    return (
                      <li key={g.tete.id} className="rounded-lg border border-line p-2.5">
                        <div className="flex items-start gap-2">
                          <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-white" style={{ background: z.color }}>
                            {i + 1}
                          </span>
                          <button
                            type="button"
                            onClick={() => onOpen(g.tete.id)}
                            className="min-w-0 flex-1 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal"
                          >
                            <span className={`block break-words text-sm font-semibold leading-snug ${suivi ? 'text-navy' : 'text-muted'}`}>{texteDe(g.tete)}</span>
                            <span className="text-[11px] text-muted">{auteur(g.tete)}</span>
                            {g.membres.length > 0 && (
                              <span className="mt-1 flex flex-col gap-0.5">
                                {g.membres.map((m) => (
                                  <span key={m.id} className="inline-flex items-start gap-1 text-xs leading-snug text-muted">
                                    <Layers className="mt-0.5 h-3 w-3 shrink-0" aria-hidden /> {texteDe(m)}
                                  </span>
                                ))}
                              </span>
                            )}
                          </button>
                        </div>
                        {suivi && (
                          <div className="mt-2 grid grid-cols-[1fr_auto] gap-2 pl-7">
                            <TexteSynchro
                              value={state.porteurs[g.tete.id]?.text ?? ''}
                              onCommit={(text) => onPorteur(g.tete.id, text)}
                              label={z.qui}
                              placeholder={z.qui}
                              maxLength={EISENHOWER_PORTEUR_MAX}
                              className="py-1 text-xs"
                            />
                            <input
                              type="date"
                              aria-label={z.quand}
                              title={z.quand}
                              value={echeance}
                              onChange={(e) => onEcheance(g.tete.id, e.target.value)}
                              className={`rounded-lg border border-line bg-white px-2 py-1 text-xs outline-none focus:border-teal ${
                                echeance && echeance < echu ? 'text-danger-600' : 'text-navy'
                              }`}
                            />
                          </div>
                        )}
                      </li>
                    );
                  })}
                </ol>
              )}
            </section>
          );
        })}
      </div>
    </div>
  );
};

export default EisenhowerPlan;
