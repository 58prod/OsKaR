import React, { useMemo, useRef, useState } from 'react';
import { Heart, Pencil, Puzzle, X } from 'lucide-react';
import type { ExemplesResolution } from '@/lib/exemplesResolution';
import {
  PHASES, PROBLEME_MAX, RESOLUTION_ACCENT, SOLUTION_KINDS, SOLUTION_MAX,
  coeursParProbleme, getSolutionKind, intituleProbleme, monVote, phaseIndex, racine,
  type GroupeProblemes, type ResolutionState, type SolutionKind,
} from './resolutionLogic';
import type { ResolutionActions } from './useResolutionSession';

interface ResolutionMyPanelProps {
  state: ResolutionState;
  retenus: GroupeProblemes[];
  myId: string;
  myName: string;
  myColor: string;
  votesLeft: number | null;
  exemples: ExemplesResolution;
  actions: ResolutionActions;
}

const champ = 'w-full resize-none rounded-lg border border-line p-2.5 text-sm text-navy outline-none placeholder:text-muted/60 focus:border-teal';
const bouton = 'mt-1 w-full rounded-lg bg-navy px-3 py-2 text-sm font-bold text-white transition-colors hover:bg-navy-light disabled:cursor-not-allowed disabled:opacity-40';

/**
 * Panneau latéral « Mon espace » : la consigne de l'étape, puis ce que
 * chacun y fait seul — noter ses problèmes, proposer ses solutions — et le
 * suivi de ses cœurs et de ses votes.
 */
export const ResolutionMyPanel: React.FC<ResolutionMyPanelProps> = ({
  state, retenus, myId, myName, myColor, votesLeft, exemples, actions,
}) => {
  const { phase } = state;
  const idx = phaseIndex(phase);
  const info = PHASES[idx];
  const myProblems = state.problems.filter((p) => p.authorId === myId);
  const mySolutions = state.solutions.filter((s) => s.authorId === myId);
  const coeurs = useMemo(() => coeursParProbleme(state), [state]);

  const [probleme, setProbleme] = useState('');
  const [solution, setSolution] = useState('');
  const [kind, setKind] = useState<SolutionKind>('idee');
  const [choisi, setChoisi] = useState<string | null>(null);
  const problemeRef = useRef<HTMLTextAreaElement>(null);
  const solutionRef = useRef<HTMLTextAreaElement>(null);

  // Un problème retiré entre-temps : on revient au premier de la liste.
  const problemId = retenus.some((g) => g.racine.id === choisi) ? choisi : retenus[0]?.racine.id ?? null;
  const rang = (id: string) => retenus.findIndex((g) => g.racine.id === racine(state, id)) + 1;

  const ajouterProbleme = () => {
    if (!probleme.trim()) return;
    actions.addProblem(probleme);
    setProbleme('');
  };

  const ajouterSolution = () => {
    if (!solution.trim() || !problemId) return;
    actions.addSolution(problemId, kind, solution);
    setSolution('');
  };

  const surCtrlEntree = (fn: () => void) => (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); fn(); }
  };

  return (
    <aside className="relative flex w-[300px] shrink-0 flex-col overflow-hidden border-r border-line bg-white" aria-label="Mon espace">
      <div className="border-b border-line px-4 py-3">
        <p className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-muted">
          <Puzzle className="h-4 w-4" style={{ color: RESOLUTION_ACCENT }} aria-hidden /> Mon espace
        </p>
        <p className="mt-1 flex items-center gap-2 text-sm font-bold text-navy">
          <span className="h-2.5 w-2.5 rounded-full" style={{ background: myColor }} aria-hidden />
          {myName}
        </p>
      </div>

      <div className="flex flex-1 flex-col gap-4 overflow-y-auto p-4">
        <section className="rounded-xl border p-3" style={{ borderColor: '#fed7aa', background: '#fff7ed' }} aria-live="polite">
          <p className="text-[11px] font-bold uppercase tracking-wide" style={{ color: RESOLUTION_ACCENT }}>
            Étape {idx + 1} sur {PHASES.length} · {info.label}
          </p>
          <p className="mt-1 text-[13px] leading-snug text-navy">{info.consigne}</p>
        </section>

        {phase === 'problemes' && (
          <div>
            <label htmlFor="resolution-probleme" className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-muted">
              Nouveau problème
            </label>
            <textarea
              ref={problemeRef}
              id="resolution-probleme"
              value={probleme}
              onChange={(e) => setProbleme(e.target.value)}
              onKeyDown={surCtrlEntree(ajouterProbleme)}
              placeholder={`Quand…, alors…\nEx : ${exemples.probleme}`}
              rows={4}
              maxLength={PROBLEME_MAX}
              className={champ}
            />
            <p className="text-right text-[11px] text-muted">{probleme.length} / {PROBLEME_MAX}</p>
            <button type="button" onClick={ajouterProbleme} disabled={!probleme.trim()} className={bouton}>
              Ajouter le problème
            </button>
            <p className="mt-1 text-center text-[11px] leading-snug text-muted">
              Ctrl+Entrée pour ajouter · une situation, pas une personne{state.anonymous ? ' · affichés sans votre nom' : ''}
            </p>
          </div>
        )}

        {(phase === 'solutions' || phase === 'echange') && (
          retenus.length === 0 ? (
            <p className="text-sm italic text-muted">Aucun problème retenu pour l’instant.</p>
          ) : (
            <div>
              <p className="mb-1.5 text-xs font-bold uppercase tracking-wide text-muted">Pour le problème</p>
              <div className="flex flex-col gap-1.5" role="radiogroup" aria-label="Problème visé">
                {retenus.map((g, i) => {
                  const selected = g.racine.id === problemId;
                  return (
                    <button
                      key={g.racine.id}
                      type="button"
                      role="radio"
                      aria-checked={selected}
                      onClick={() => setChoisi(g.racine.id)}
                      className="flex items-start gap-2 rounded-lg border-2 p-2 text-left text-xs leading-snug text-navy transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal"
                      style={{ borderColor: selected ? RESOLUTION_ACCENT : '#e2e8f0', background: selected ? '#fff7ed' : '#fff' }}
                    >
                      <span className="shrink-0 rounded px-1.5 py-0.5 text-[10px] font-bold text-white" style={{ background: selected ? RESOLUTION_ACCENT : '#94a3b8' }}>
                        P{i + 1}
                      </span>
                      <span className="line-clamp-3 break-words">{intituleProbleme(state, g.racine)}</span>
                    </button>
                  );
                })}
              </div>

              <p className="mb-1.5 mt-3 text-xs font-bold uppercase tracking-wide text-muted">Ma solution</p>
              <div className="mb-2 flex gap-1.5" role="radiogroup" aria-label="Type de solution">
                {SOLUTION_KINDS.map((k) => {
                  const selected = k.key === kind;
                  return (
                    <button
                      key={k.key}
                      type="button"
                      role="radio"
                      aria-checked={selected}
                      onClick={() => setKind(k.key)}
                      className="flex-1 rounded-full border px-2.5 py-1 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal"
                      style={selected
                        ? { borderColor: 'transparent', background: k.color, color: '#fff' }
                        : { borderColor: '#e2e8f0', color: '#64748b' }}
                    >
                      {k.label}
                    </button>
                  );
                })}
              </div>
              <label htmlFor="resolution-solution" className="sr-only">Texte de la solution</label>
              <textarea
                ref={solutionRef}
                id="resolution-solution"
                value={solution}
                onChange={(e) => setSolution(e.target.value)}
                onKeyDown={surCtrlEntree(ajouterSolution)}
                placeholder={kind === 'teste' ? 'Ce que vous avez déjà essayé, et ce que ça a donné' : `Ex : ${exemples.solution}`}
                rows={3}
                maxLength={SOLUTION_MAX}
                className={champ}
              />
              <p className="text-right text-[11px] text-muted">{solution.length} / {SOLUTION_MAX}</p>
              <button type="button" onClick={ajouterSolution} disabled={!solution.trim()} className={bouton}>
                Ajouter la solution
              </button>
              <p className="mt-1 text-center text-[11px] leading-snug text-muted">
                Ctrl+Entrée pour ajouter · {phase === 'echange' ? 'visible tout de suite par l’équipe' : 'personne ne voit vos solutions avant l’échange'}
                {state.anonymous ? ' · sans votre nom' : ''}
              </p>
            </div>
          )
        )}

        {phase === 'choix' && votesLeft !== null && (
          <p
            className={`inline-flex items-center gap-1.5 self-start rounded-full px-3 py-1 text-xs font-bold ${votesLeft === 0 ? 'bg-danger-50 text-danger-600' : 'bg-surface text-navy'}`}
            aria-live="polite"
          >
            <Heart className="h-3.5 w-3.5" style={{ fill: '#ec4899', color: '#ec4899' }} aria-hidden />
            Cœurs restants : {votesLeft} / {state.voteLimit}
          </p>
        )}

        {phase === 'vote' && (
          <p className="text-sm leading-snug text-navy">
            Vous avez voté pour <strong>{retenus.filter((g) => monVote(state, g.racine.id, myId)).length}</strong>
            {' '}problème{retenus.length > 1 ? 's' : ''} sur {retenus.length}. Vous pouvez changer d’avis tant que les résultats ne sont pas dévoilés.
          </p>
        )}

        {phase === 'plan' && (
          <p className="text-sm leading-snug text-muted">
            L’animateur et le rapporteur de chaque problème complètent le premier pas. La synthèse de l’atelier se copie ou s’exporte en haut du tableau.
          </p>
        )}

        {idx <= phaseIndex('choix') && myProblems.length > 0 && (
          <div>
            <p className="mb-1.5 text-xs font-bold uppercase tracking-wide text-muted">Mes problèmes ({myProblems.length})</p>
            <ul className="flex flex-col gap-1.5">
              {myProblems.map((p) => (
                <MonItem
                  key={p.id}
                  text={p.text}
                  aside={phase === 'choix' && (
                    <span className="mr-1 inline-flex items-center gap-1 text-[11px] font-bold" style={{ color: '#ec4899' }}>
                      <Heart className="h-3 w-3" style={{ fill: '#ec4899' }} aria-hidden /> {coeurs.get(p.id)?.length ?? 0}
                    </span>
                  )}
                  onEdit={phase === 'problemes' ? () => {
                    setProbleme(p.text);
                    actions.deleteItem(p.id);
                    problemeRef.current?.focus();
                  } : undefined}
                  onDelete={() => actions.deleteItem(p.id)}
                />
              ))}
            </ul>
          </div>
        )}

        {(phase === 'solutions' || phase === 'echange') && mySolutions.length > 0 && (
          <div>
            <p className="mb-1.5 text-xs font-bold uppercase tracking-wide text-muted">Mes solutions ({mySolutions.length})</p>
            <ul className="flex flex-col gap-1.5">
              {mySolutions.map((sol) => {
                const k = getSolutionKind(sol.kind);
                const r = rang(sol.problemId);
                return (
                  <MonItem
                    key={sol.id}
                    text={sol.text}
                    badge={(
                      <span className="flex items-center gap-1">
                        {r > 0 && <span className="rounded px-1.5 py-0.5 text-[10px] font-bold text-white" style={{ background: RESOLUTION_ACCENT }}>P{r}</span>}
                        <span className="rounded px-1.5 py-0.5 text-[10px] font-bold" style={{ background: k.bg, color: k.color }}>{k.label}</span>
                      </span>
                    )}
                    onEdit={phase === 'solutions' ? () => {
                      setSolution(sol.text);
                      setKind(sol.kind);
                      setChoisi(racine(state, sol.problemId));
                      actions.deleteItem(sol.id);
                      solutionRef.current?.focus();
                    } : undefined}
                    onDelete={() => actions.deleteItem(sol.id)}
                  />
                );
              })}
            </ul>
          </div>
        )}
      </div>
    </aside>
  );
};

/** Un de mes problèmes ou une de mes solutions (modifiable tant qu'il est caché). */
const MonItem: React.FC<{
  text: string;
  badge?: React.ReactNode;
  aside?: React.ReactNode;
  onEdit?: () => void;
  onDelete: () => void;
}> = ({ text, badge, aside, onEdit, onDelete }) => (
  <li className="rounded-lg border-l-4 bg-surface p-2 text-sm" style={{ borderLeftColor: RESOLUTION_ACCENT }}>
    <div className="mb-1 flex items-start justify-between gap-1">
      {badge ?? <span />}
      <span className="flex items-center gap-0.5">
        {aside}
        {onEdit && (
          <button
            type="button"
            onClick={onEdit}
            aria-label={`Modifier : « ${text} »`}
            title="Modifier"
            className="rounded p-0.5 text-muted hover:text-navy"
          >
            <Pencil className="h-3.5 w-3.5" aria-hidden />
          </button>
        )}
        <button
          type="button"
          onClick={onDelete}
          aria-label={`Supprimer : « ${text} »`}
          title="Supprimer"
          className="rounded p-0.5 text-muted hover:text-danger-600"
        >
          <X className="h-3.5 w-3.5" aria-hidden />
        </button>
      </span>
    </div>
    <p className="break-words leading-snug text-navy">{text}</p>
  </li>
);

export default ResolutionMyPanel;
