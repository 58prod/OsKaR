import React, { useState } from 'react';
import {
  CalendarDays, CheckCircle2, ClipboardCopy, Download, Eye, EyeOff, Heart, PenLine, Send, UserRound, X,
} from 'lucide-react';
import type { ToolIdentity } from '@/hooks/useToolSession';
import type { ExemplesResolution } from '@/lib/exemplesResolution';
import { TexteSynchro } from '@/components/toolbox/shared/TexteSynchro';
import {
  COMMENTAIRE_MAX, COMMENT_KINDS, PLAN_MAX, RESOLUTION_ACCENT, SYNTHESE, SYNTHESE_MAX,
  authorLabel, candidats, commentairesDe, dateCourte, getCommentKind, getSolutionKind, intituleProbleme,
  monVote, planDe, resultatVote, solutionValidee, solutionsDe,
  type Candidat, type CommentKind, type GroupeProblemes, type ResolutionPhase, type ResolutionState, type Solution,
} from './resolutionLogic';
import type { ResolutionActions } from './useResolutionSession';

/* Étapes 3 à 6 : une colonne par problème retenu. */

interface ColonnesProps {
  state: ResolutionState;
  retenus: GroupeProblemes[];
  myId: string;
  isFacilitator: boolean;
  actions: ResolutionActions;
}

const VERT = '#15803d';

/** Cadre commun : bandeau d'étape (titre, aide, boutons) puis colonnes. */
const Colonnes: React.FC<{
  titre: string;
  aide?: React.ReactNode;
  boutons?: React.ReactNode;
  retenus: GroupeProblemes[];
  isFacilitator: boolean;
  onGo: (phase: ResolutionPhase) => void;
  children: React.ReactNode;
}> = ({ titre, aide, boutons, retenus, isFacilitator, onGo, children }) => (
  <div className="flex-1 overflow-y-auto p-4">
    <div className="mb-4 flex flex-wrap items-center gap-x-3 gap-y-2">
      <h2 className="text-base font-bold text-navy">{titre}</h2>
      {aide && <p className="text-sm text-muted" aria-live="polite">{aide}</p>}
      {boutons && <div className="ml-auto flex flex-wrap items-center gap-2">{boutons}</div>}
    </div>
    {retenus.length === 0 ? (
      <div className="flex flex-col items-center justify-center gap-3 p-10 text-center text-muted">
        <p className="text-sm leading-relaxed">Aucun problème retenu. Revenez à l’étape « Choix » pour en retenir.</p>
        {isFacilitator && (
          <button
            type="button"
            onClick={() => onGo('choix')}
            className="rounded-lg px-3 py-1.5 text-sm font-bold text-white"
            style={{ background: RESOLUTION_ACCENT }}
          >
            Revenir au choix des problèmes
          </button>
        )}
      </div>
    ) : (
      <div className="grid items-start gap-4 [grid-template-columns:repeat(auto-fit,minmax(280px,1fr))]">{children}</div>
    )}
  </div>
);

const Colonne: React.FC<{ children: React.ReactNode; label: string }> = ({ children, label }) => (
  <section className="flex min-w-0 flex-col gap-3 rounded-2xl bg-white p-4 shadow-sm" aria-label={label}>{children}</section>
);

/** En-tête d'une colonne : rang, intitulé (reformulé ou non), cœurs. */
const EnTeteProbleme: React.FC<{ state: ResolutionState; groupe: GroupeProblemes; rang: number }> = ({ state, groupe, rang }) => {
  const question = state.questions[groupe.racine.id]?.text;
  return (
    <header className="flex items-start gap-2.5">
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-xs font-bold text-white" style={{ background: RESOLUTION_ACCENT }}>
        P{rang}
      </span>
      <div className="min-w-0 flex-1">
        <h3 className="break-words text-sm font-bold leading-snug text-navy">{intituleProbleme(state, groupe.racine)}</h3>
        {question && <p className="mt-0.5 break-words text-xs leading-snug text-muted">{groupe.racine.text}</p>}
        {groupe.membres.length > 0 && (
          <p className="mt-0.5 text-[11px] text-muted">
            + {groupe.membres.length} problème{groupe.membres.length > 1 ? 's' : ''} regroupé{groupe.membres.length > 1 ? 's' : ''}
          </p>
        )}
      </div>
      <span className="inline-flex shrink-0 items-center gap-1 text-[11px] font-bold" style={{ color: '#ec4899' }} title="Cœurs reçus à l’étape Choix">
        <Heart className="h-3 w-3" style={{ fill: '#ec4899' }} aria-hidden /> {groupe.voix.length}
      </span>
    </header>
  );
};

const BadgeKind: React.FC<{ kind: Candidat['kind'] }> = ({ kind }) => {
  if (kind === SYNTHESE) {
    return <span className="rounded px-1.5 py-0.5 text-[10px] font-bold text-white" style={{ background: RESOLUTION_ACCENT }}>Solution du groupe</span>;
  }
  const k = getSolutionKind(kind);
  return <span className="rounded px-1.5 py-0.5 text-[10px] font-bold" style={{ background: k.bg, color: k.color }}>{k.label}</span>;
};

const Auteur: React.FC<{ item: Solution; anonymous: boolean; myId: string }> = ({ item, anonymous, myId }) => {
  const cache = anonymous && item.authorId !== myId;
  return (
    <span className="inline-flex items-center gap-1 text-[11px] font-semibold" style={{ color: cache ? '#94a3b8' : item.authorColor }}>
      {!cache && <span className="h-2 w-2 rounded-full" style={{ background: item.authorColor }} aria-hidden />}
      {authorLabel(item, anonymous, myId)}
    </span>
  );
};

/* ── Étape 3 : les solutions, face cachée ── */

export const SolutionsCachees: React.FC<ColonnesProps> = ({ state, retenus, myId, isFacilitator, actions }) => (
  <Colonnes
    titre="Solutions proposées"
    aide="Elles seront dévoilées à l’étape « Échange »."
    retenus={retenus}
    isFacilitator={isFacilitator}
    onGo={actions.goToPhase}
  >
    {retenus.map((g, i) => {
      const sols = solutionsDe(state, g.racine.id);
      return (
        <Colonne key={g.racine.id} label={`Problème ${i + 1}`}>
          <EnTeteProbleme state={state} groupe={g} rang={i + 1} />
          <p className="text-xs font-semibold text-muted" aria-live="polite">
            {sols.length === 0 ? 'Aucune solution pour l’instant' : `${sols.length} solution${sols.length > 1 ? 's' : ''} proposée${sols.length > 1 ? 's' : ''}`}
          </p>
          {sols.length > 0 && (
            <ul className="flex flex-wrap gap-2">
              {sols.map((sol) => (
                <li
                  key={sol.id}
                  className="flex h-12 min-w-[84px] flex-1 items-center justify-center rounded-lg px-2 text-center text-[11px] font-semibold text-white"
                  style={{ background: `repeating-linear-gradient(135deg, ${RESOLUTION_ACCENT} 0 8px, #d9531a 8px 16px)` }}
                >
                  {sol.authorId === myId ? 'Votre solution' : state.anonymous ? 'Face cachée' : sol.authorName}
                </li>
              ))}
            </ul>
          )}
        </Colonne>
      );
    })}
  </Colonnes>
);

/* ── Étape 4 : échanger ── */

export const EchangeColonnes: React.FC<ColonnesProps & { identity: ToolIdentity | null }> = ({
  state, retenus, myId, isFacilitator, actions, identity,
}) => (
  <Colonnes
    titre="Échange"
    aide={<>Commentez : <strong style={{ color: VERT }}>+</strong> j’ajoute, <strong style={{ color: '#0369a1' }}>?</strong> je m’interroge, <strong style={{ color: '#b91c1c' }}>!</strong> attention.</>}
    retenus={retenus}
    isFacilitator={isFacilitator}
    onGo={actions.goToPhase}
  >
    {retenus.map((g, i) => {
      const sols = solutionsDe(state, g.racine.id);
      return (
        <Colonne key={g.racine.id} label={`Problème ${i + 1}`}>
          <EnTeteProbleme state={state} groupe={g} rang={i + 1} />
          <SyntheseBox state={state} problemId={g.racine.id} myId={myId} identity={identity} isFacilitator={isFacilitator} actions={actions} />
          <p className="text-xs font-bold uppercase tracking-wide text-muted">Solutions proposées ({sols.length})</p>
          {sols.length === 0 ? (
            <p className="text-sm italic text-muted">Aucune solution : proposez-en une dans « Mon espace ».</p>
          ) : (
            <ul className="flex flex-col gap-2.5">
              {sols.map((sol) => (
                <SolutionCard key={sol.id} state={state} solution={sol} myId={myId} isFacilitator={isFacilitator} actions={actions} />
              ))}
            </ul>
          )}
        </Colonne>
      );
    })}
  </Colonnes>
);

/** Rapporteur et solution du groupe, rédigée pendant l'échange. */
const SyntheseBox: React.FC<{
  state: ResolutionState;
  problemId: string;
  myId: string;
  identity: ToolIdentity | null;
  isFacilitator: boolean;
  actions: ResolutionActions;
}> = ({ state, problemId, myId, identity, isFacilitator, actions }) => {
  const rap = state.rapporteurs[problemId];
  const synthese = state.syntheses[problemId]?.text ?? '';
  const peutEcrire = isFacilitator || (!!rap?.id && rap.id === myId);

  return (
    <div className="rounded-xl border p-3" style={{ borderColor: '#fed7aa', background: '#fff7ed' }}>
      <div className="mb-2 flex flex-wrap items-center gap-2">
        <PenLine className="h-4 w-4" style={{ color: RESOLUTION_ACCENT }} aria-hidden />
        <p className="text-xs font-bold uppercase tracking-wide" style={{ color: RESOLUTION_ACCENT }}>Solution du groupe</p>
        <span className="ml-auto flex items-center gap-1.5 text-[11px] font-semibold text-navy">
          {rap?.id ? (
            <>
              Rapporteur :
              <span className="h-2 w-2 rounded-full" style={{ background: rap.color || '#94a3b8' }} aria-hidden />
              {rap.id === myId ? 'vous' : rap.name}
              {(rap.id === myId || isFacilitator) && (
                <button
                  type="button"
                  onClick={() => actions.setRapporteur(problemId, null)}
                  aria-label={rap.id === myId ? 'Laisser la place de rapporteur' : `Retirer ${rap.name} du rôle de rapporteur`}
                  title={rap.id === myId ? 'Laisser la place' : 'Retirer le rapporteur'}
                  className="rounded p-0.5 text-muted hover:text-danger-600"
                >
                  <X className="h-3 w-3" aria-hidden />
                </button>
              )}
            </>
          ) : identity && (
            <button
              type="button"
              onClick={() => actions.setRapporteur(problemId, identity)}
              className="rounded-md bg-white px-2 py-1 text-[11px] font-bold shadow-sm transition-colors hover:bg-surface"
              style={{ color: RESOLUTION_ACCENT }}
            >
              Je suis rapporteur
            </button>
          )}
        </span>
      </div>
      {peutEcrire ? (
        <TexteSynchro
          value={synthese}
          onCommit={(t) => actions.setSynthese(problemId, t)}
          label="Solution du groupe"
          placeholder="Résumez la solution qui se dégage de l’échange"
          maxLength={SYNTHESE_MAX}
          multiline
          rows={4}
        />
      ) : (
        <p className="whitespace-pre-wrap break-words text-sm leading-snug text-navy" aria-live="polite">
          {synthese || (
            <span className="italic text-muted">
              {rap?.id ? `${rap.name} rédige la solution du groupe…` : 'Un rapporteur rédige ici la solution qui se dégage de l’échange.'}
            </span>
          )}
        </p>
      )}
    </div>
  );
};

/** Solution dévoilée, avec ses commentaires. */
const SolutionCard: React.FC<{
  state: ResolutionState;
  solution: Solution;
  myId: string;
  isFacilitator: boolean;
  actions: ResolutionActions;
}> = ({ state, solution, myId, isFacilitator, actions }) => {
  const comments = commentairesDe(state, solution.id);
  return (
    <li className="rounded-xl border border-line p-3">
      <div className="flex items-center gap-2">
        <BadgeKind kind={solution.kind} />
        <span className="ml-auto"><Auteur item={solution} anonymous={state.anonymous} myId={myId} /></span>
        {(isFacilitator || solution.authorId === myId) && (
          <button
            type="button"
            onClick={() => actions.deleteItem(solution.id)}
            aria-label={`Supprimer la solution « ${solution.text} »`}
            title="Supprimer"
            className="rounded p-0.5 text-muted/60 hover:text-danger-600"
          >
            <X className="h-3.5 w-3.5" aria-hidden />
          </button>
        )}
      </div>
      <p className="mt-1.5 break-words text-sm leading-snug text-navy">{solution.text}</p>
      {comments.length > 0 && (
        <ul className="mt-2 flex flex-col gap-1 border-t border-line pt-2" aria-label="Commentaires">
          {comments.map((c) => {
            const k = getCommentKind(c.kind);
            return (
              <li key={c.id} className="flex items-start gap-1.5 text-xs leading-snug">
                <span className="w-3 shrink-0 text-center font-bold" style={{ color: k.color }} title={k.label} aria-label={k.label}>{k.signe}</span>
                <span className="min-w-0 flex-1 break-words text-navy">
                  {c.text}
                  <span className="text-muted"> — {authorLabel(c, state.anonymous, myId)}</span>
                </span>
                {(isFacilitator || c.authorId === myId) && (
                  <button
                    type="button"
                    onClick={() => actions.deleteItem(c.id)}
                    aria-label={`Supprimer le commentaire « ${c.text} »`}
                    title="Supprimer"
                    className="rounded p-0.5 text-muted/60 hover:text-danger-600"
                  >
                    <X className="h-3 w-3" aria-hidden />
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      )}
      <CommentForm onSend={(kind, text) => actions.addComment(solution.id, kind, text)} />
    </li>
  );
};

const CommentForm: React.FC<{ onSend: (kind: CommentKind, text: string) => void }> = ({ onSend }) => {
  const [kind, setKind] = useState<CommentKind>('plus');
  const [text, setText] = useState('');
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    onSend(kind, text);
    setText('');
  };
  return (
    <form onSubmit={submit} className="mt-2 flex items-center gap-1">
      <div className="flex shrink-0" role="radiogroup" aria-label="Type de commentaire">
        {COMMENT_KINDS.map((k) => {
          const selected = k.key === kind;
          return (
            <button
              key={k.key}
              type="button"
              role="radio"
              aria-checked={selected}
              aria-label={k.label}
              title={k.label}
              onClick={() => setKind(k.key)}
              className="h-7 w-7 rounded-md text-sm font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal"
              style={selected ? { background: k.color, color: '#fff' } : { color: k.color }}
            >
              {k.signe}
            </button>
          );
        })}
      </div>
      <input
        type="text"
        value={text}
        onChange={(e) => setText(e.target.value)}
        maxLength={COMMENTAIRE_MAX}
        placeholder={`${getCommentKind(kind).label}…`}
        aria-label="Votre commentaire"
        className="min-w-0 flex-1 rounded-md border border-line px-2 py-1 text-xs text-navy outline-none placeholder:text-muted/60 focus:border-teal"
      />
      <button
        type="submit"
        disabled={!text.trim()}
        aria-label="Envoyer le commentaire"
        className="rounded-md p-1.5 text-white transition-opacity disabled:opacity-30"
        style={{ background: RESOLUTION_ACCENT }}
      >
        <Send className="h-3.5 w-3.5" aria-hidden />
      </button>
    </form>
  );
};

/* ── Étape 5 : voter ── */

export const VoteColonnes: React.FC<ColonnesProps & { participantsCount: number }> = ({
  state, retenus, myId, isFacilitator, actions, participantsCount,
}) => {
  const revealed = !!state.votesRevealed.c;
  return (
    <Colonnes
      titre="Vote"
      aide={revealed ? 'Résultats dévoilés.' : 'Vote secret : une voix par problème, résultats dévoilés par l’animateur.'}
      boutons={isFacilitator && (
        <button
          type="button"
          onClick={() => actions.revealVotes(!revealed)}
          className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-bold text-white transition-opacity hover:opacity-90"
          style={{ background: revealed ? '#64748b' : RESOLUTION_ACCENT }}
        >
          {revealed ? <EyeOff className="h-4 w-4" aria-hidden /> : <Eye className="h-4 w-4" aria-hidden />}
          {revealed ? 'Masquer les résultats' : 'Dévoiler les résultats'}
        </button>
      )}
      retenus={retenus}
      isFacilitator={isFacilitator}
      onGo={actions.goToPhase}
    >
      {retenus.map((g, i) => {
        const pid = g.racine.id;
        const liste = candidats(state, pid);
        const res = resultatVote(state, pid);
        const mon = monVote(state, pid, myId);
        const valide = state.validated[pid]?.c ?? null;
        return (
          <Colonne key={pid} label={`Problème ${i + 1}`}>
            <EnTeteProbleme state={state} groupe={g} rang={i + 1} />
            {liste.length === 0 ? (
              <p className="text-sm italic text-muted">Aucune solution à départager.</p>
            ) : (
              <ul className="flex flex-col gap-2" role="radiogroup" aria-label={`Solutions pour le problème ${i + 1}`}>
                {liste.map((c) => {
                  const choisi = mon === c.id;
                  const n = res.voix[c.id] ?? 0;
                  const enTete = revealed && res.enTete.includes(c.id);
                  const estValidee = valide === c.id;
                  return (
                    <li key={c.id}>
                      <button
                        type="button"
                        role="radio"
                        aria-checked={choisi}
                        disabled={revealed}
                        onClick={() => actions.vote(pid, c.id)}
                        className="relative w-full overflow-hidden rounded-xl border-2 p-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal enabled:hover:bg-surface disabled:cursor-default"
                        style={{ borderColor: estValidee ? VERT : choisi ? RESOLUTION_ACCENT : '#e2e8f0' }}
                      >
                        {revealed && res.votants > 0 && (
                          <span
                            aria-hidden
                            className="absolute inset-y-0 left-0 transition-[width] duration-500"
                            style={{ width: `${(n / res.votants) * 100}%`, background: estValidee ? 'rgba(21,128,61,.10)' : 'rgba(194,65,12,.08)' }}
                          />
                        )}
                        <span className="relative flex flex-wrap items-center gap-1.5">
                          <BadgeKind kind={c.kind} />
                          {choisi && <span className="text-[11px] font-bold" style={{ color: RESOLUTION_ACCENT }}>Mon choix</span>}
                          {estValidee && (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold" style={{ color: VERT }}>
                              <CheckCircle2 className="h-3.5 w-3.5" aria-hidden /> Validée
                            </span>
                          )}
                          {revealed && (
                            <span className={`ml-auto text-sm font-bold ${enTete ? 'text-navy' : 'text-muted'}`}>
                              {n} voix{enTete && res.enTete.length === 1 ? ' · en tête' : ''}
                            </span>
                          )}
                        </span>
                        <span className="relative mt-1.5 block whitespace-pre-wrap break-words text-sm leading-snug text-navy">{c.text}</span>
                        {c.auteur && (
                          <span className="relative mt-1 block"><Auteur item={c.auteur} anonymous={state.anonymous} myId={myId} /></span>
                        )}
                      </button>
                      {revealed && isFacilitator && (
                        <button
                          type="button"
                          onClick={() => actions.validate(pid, estValidee ? null : c.id)}
                          className="mt-1 inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-bold transition-colors"
                          style={estValidee ? { color: '#64748b' } : { background: '#f0fdf4', color: VERT }}
                        >
                          <CheckCircle2 className="h-3.5 w-3.5" aria-hidden />
                          {estValidee ? 'Annuler la validation' : 'Valider cette solution'}
                        </button>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
            <p className="text-xs font-semibold text-muted" aria-live="polite">
              {revealed && res.enTete.length > 1
                ? 'Égalité : l’animateur tranche.'
                : `${res.votants} / ${Math.max(participantsCount, res.votants)} ont voté`}
            </p>
          </Colonne>
        );
      })}
    </Colonnes>
  );
};

/* ── Étape 6 : premier pas ── */

export const PlanColonnes: React.FC<ColonnesProps & { exemples: ExemplesResolution }> = ({
  state, retenus, myId, isFacilitator, actions, exemples,
}) => (
  <Colonnes
    titre="Premier pas"
    aide="Une action concrète par solution validée, avec la personne qui la porte et l’échéance."
    boutons={(
      <>
        <button
          type="button"
          onClick={() => { void actions.copySummary(); }}
          className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-white px-3 py-1.5 text-sm font-semibold text-navy transition-colors hover:bg-surface"
        >
          <ClipboardCopy className="h-4 w-4" aria-hidden /> Copier la synthèse
        </button>
        <button
          type="button"
          onClick={actions.exportSummary}
          className="inline-flex items-center gap-1.5 rounded-lg bg-navy px-3 py-1.5 text-sm font-bold text-white transition-colors hover:bg-navy-light"
        >
          <Download className="h-4 w-4" aria-hidden /> Exporter
        </button>
      </>
    )}
    retenus={retenus}
    isFacilitator={isFacilitator}
    onGo={actions.goToPhase}
  >
    {retenus.map((g, i) => {
      const pid = g.racine.id;
      const validee = solutionValidee(state, pid);
      const plan = planDe(state, pid);
      const rap = state.rapporteurs[pid];
      const peutEcrire = isFacilitator || (!!rap?.id && rap.id === myId);
      return (
        <Colonne key={pid} label={`Problème ${i + 1}`}>
          <EnTeteProbleme state={state} groupe={g} rang={i + 1} />
          <div className="rounded-xl border-2 p-3" style={{ borderColor: validee ? '#bbf7d0' : '#e2e8f0', background: validee ? '#f0fdf4' : '#f8fafc' }}>
            <p className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wide" style={{ color: validee ? VERT : '#64748b' }}>
              <CheckCircle2 className="h-3.5 w-3.5" aria-hidden /> Solution validée
            </p>
            <p className="mt-1 whitespace-pre-wrap break-words text-sm leading-snug text-navy">
              {validee ? validee.text : <span className="italic text-muted">Pas encore validée : revenez à l’étape « Vote ».</span>}
            </p>
          </div>

          {peutEcrire ? (
            <div className="flex flex-col gap-2.5">
              <label className="block">
                <span className="mb-1 block text-xs font-bold uppercase tracking-wide text-muted">Premier pas</span>
                <TexteSynchro
                  value={plan.premierPas.text}
                  onCommit={(t) => actions.setPlan(pid, 'premierPas', t)}
                  label={`Premier pas pour le problème ${i + 1}`}
                  placeholder={`Ex : ${exemples.premierPas}`}
                  maxLength={PLAN_MAX}
                  multiline
                  rows={2}
                />
              </label>
              <div className="flex flex-wrap gap-2">
                <label className="min-w-[140px] flex-1">
                  <span className="mb-1 block text-xs font-bold uppercase tracking-wide text-muted">Porteur</span>
                  <TexteSynchro
                    value={plan.porteur.text}
                    onCommit={(t) => actions.setPlan(pid, 'porteur', t)}
                    label={`Porteur du premier pas, problème ${i + 1}`}
                    placeholder="Prénom"
                    maxLength={60}
                    list="resolution-participants"
                  />
                </label>
                <label>
                  <span className="mb-1 block text-xs font-bold uppercase tracking-wide text-muted">Échéance</span>
                  <input
                    type="date"
                    value={plan.echeance.text}
                    onChange={(e) => actions.setPlan(pid, 'echeance', e.target.value)}
                    className="rounded-lg border border-line bg-white px-2.5 py-1.5 text-sm text-navy outline-none focus:border-teal"
                  />
                </label>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-1.5">
              <p className="text-xs font-bold uppercase tracking-wide text-muted">Premier pas</p>
              <p className="whitespace-pre-wrap break-words text-sm leading-snug text-navy">
                {plan.premierPas.text || <span className="italic text-muted">À définir</span>}
              </p>
              <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[11px] font-semibold">
                <span className={`inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 ${plan.porteur.text ? 'bg-surface text-navy' : 'text-muted'}`}>
                  <UserRound className="h-3 w-3" aria-hidden /> {plan.porteur.text || 'Porteur à définir'}
                </span>
                {plan.echeance.text && (
                  <span className="inline-flex items-center gap-1 rounded-md bg-surface px-1.5 py-0.5 text-navy">
                    <CalendarDays className="h-3 w-3" aria-hidden /> {dateCourte(plan.echeance.text)}
                  </span>
                )}
              </div>
            </div>
          )}
        </Colonne>
      );
    })}
  </Colonnes>
);
