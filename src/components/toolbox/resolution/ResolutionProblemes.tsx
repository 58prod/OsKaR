import React, { useEffect, useMemo, useState } from 'react';
import { Check, EyeOff, Heart, Link2, MessageSquareWarning, Trash2, Unlink } from 'lucide-react';
import { TexteSynchro } from '@/components/toolbox/shared/TexteSynchro';
import {
  MAX_RETENUS, QUESTION_MAX, RESOLUTION_ACCENT, aDonneCoeur, authorLabel,
  type GroupeProblemes, type ResolutionState,
} from './resolutionLogic';
import type { ResolutionActions } from './useResolutionSession';

/* ── Étape 1 : les problèmes, face cachée ── */

/**
 * Pendant que chacun écrit, le tableau montre seulement combien de problèmes
 * ont été notés, face cachée : personne n'est influencé par les premiers.
 */
export const ProblemesCaches: React.FC<{ state: ResolutionState; myId: string }> = ({ state, myId }) => {
  const n = state.problems.length;
  const auteurs = new Set(state.problems.map((p) => p.authorId)).size;
  return (
    <div className="flex-1 overflow-y-auto p-4">
      <div className="mb-4 flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <h2 className="text-base font-bold text-navy">Problèmes notés</h2>
        <p className="text-sm text-muted" aria-live="polite">
          {n === 0
            ? 'Aucun pour l’instant.'
            : `${n} problème${n > 1 ? 's' : ''} noté${n > 1 ? 's' : ''} par ${auteurs} personne${auteurs > 1 ? 's' : ''} · dévoilés à l’étape « Choix »`}
        </p>
      </div>
      {n === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 p-10 text-center text-muted">
          <MessageSquareWarning className="h-12 w-12 opacity-30" aria-hidden />
          <p className="text-sm leading-relaxed">
            Les problèmes notés par l’équipe apparaîtront ici, face cachée.<br />
            Notez les vôtres dans « Mon espace ».
          </p>
        </div>
      ) : (
        <ul className="grid grid-cols-[repeat(auto-fill,minmax(150px,1fr))] gap-3">
          {state.problems.map((p) => (
            <li
              key={p.id}
              className="flex h-24 flex-col items-center justify-center gap-1.5 rounded-xl px-2 text-center text-white shadow-sm"
              style={{ background: `repeating-linear-gradient(135deg, ${RESOLUTION_ACCENT} 0 10px, #d9531a 10px 20px)` }}
            >
              <EyeOff className="h-5 w-5 opacity-80" aria-hidden />
              <span className="line-clamp-2 text-[11px] font-semibold">
                {p.authorId === myId ? 'Votre problème' : state.anonymous ? 'Face cachée' : p.authorName}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

/* ── Étape 2 : choisir les problèmes ── */

interface ProblemesChoixProps {
  state: ResolutionState;
  groupes: GroupeProblemes[];
  retenus: GroupeProblemes[];
  myId: string;
  isFacilitator: boolean;
  votesLeft: number | null;
  actions: ResolutionActions;
}

/**
 * Tous les problèmes découverts : cœurs, regroupement des doublons et choix
 * des problèmes à traiter (3 au plus) par l'animateur, qui peut les
 * reformuler en « Comment pourrions-nous… ? ».
 */
export const ProblemesChoix: React.FC<ProblemesChoixProps> = ({
  state, groupes, retenus, myId, isFacilitator, votesLeft, actions,
}) => {
  const [tri, setTri] = useState<'arrivee' | 'coeurs'>('arrivee');
  const [regroupant, setRegroupant] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  // La demande de confirmation de suppression expire après quelques secondes.
  useEffect(() => {
    if (!confirmDelete) return;
    const t = setTimeout(() => setConfirmDelete(null), 4000);
    return () => clearTimeout(t);
  }, [confirmDelete]);

  // Échap annule un regroupement en cours ; il s'annule aussi si le problème disparaît.
  useEffect(() => {
    if (!regroupant) return;
    if (!groupes.some((g) => g.racine.id === regroupant)) { setRegroupant(null); return; }
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') setRegroupant(null); };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [regroupant, groupes]);

  const rangs = useMemo(() => new Map(retenus.map((g, i) => [g.racine.id, i + 1])), [retenus]);
  const affiches = useMemo(
    () => (tri === 'coeurs' ? [...groupes].sort((a, b) => b.voix.length - a.voix.length) : groupes),
    [groupes, tri],
  );

  const regrouperIci = (into: string) => {
    if (regroupant) actions.merge(regroupant, into);
    setRegroupant(null);
  };

  return (
    <div className="flex flex-1 overflow-hidden">
      <div className="flex flex-1 flex-col overflow-hidden">
        <div className="flex flex-wrap items-center gap-2.5 border-b border-line bg-surface px-4 py-2.5">
          <span className="text-xs font-bold uppercase tracking-wide text-muted">Tri</span>
          <Pastille label="Ordre d’arrivée" selected={tri === 'arrivee'} onClick={() => setTri('arrivee')} />
          <Pastille label="Cœurs" selected={tri === 'coeurs'} onClick={() => setTri('coeurs')} />
          {votesLeft !== null && (
            <p
              className={`ml-auto inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold ${votesLeft === 0 ? 'bg-danger-50 text-danger-600' : 'bg-white text-navy'}`}
              aria-live="polite"
            >
              <Heart className="h-3.5 w-3.5" style={{ fill: '#ec4899', color: '#ec4899' }} aria-hidden />
              Cœurs restants : {votesLeft} / {state.voteLimit}
            </p>
          )}
        </div>

        {regroupant && (
          <div className="flex items-center gap-3 border-b px-4 py-2 text-sm font-semibold" style={{ background: '#fff7ed', borderColor: '#fed7aa', color: RESOLUTION_ACCENT }} role="status">
            <Link2 className="h-4 w-4" aria-hidden />
            Cliquez sur le problème qui accueille celui-ci.
            <button
              type="button"
              onClick={() => setRegroupant(null)}
              className="ml-auto rounded-md border border-line bg-white px-2.5 py-1 text-xs font-bold text-navy hover:bg-surface"
            >
              Annuler
            </button>
          </div>
        )}

        <div className="relative flex-1 overflow-y-auto p-4">
          {groupes.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center gap-3 p-10 text-center text-muted">
              <MessageSquareWarning className="h-12 w-12 opacity-30" aria-hidden />
              <p className="text-sm leading-relaxed">Aucun problème noté. L’animateur peut revenir à l’étape « Problèmes ».</p>
            </div>
          ) : (
            <ul className="grid grid-cols-[repeat(auto-fill,minmax(240px,1fr))] content-start gap-3.5" aria-live="polite">
              {affiches.map((g) => (
                <GroupeCard
                  key={g.racine.id}
                  groupe={g}
                  rang={rangs.get(g.racine.id)}
                  voted={[g.racine, ...g.membres].some((p) => aDonneCoeur(state, p.id, myId))}
                  anonymous={state.anonymous}
                  myId={myId}
                  isFacilitator={isFacilitator}
                  outOfVotes={votesLeft === 0}
                  retenusPleins={retenus.length >= MAX_RETENUS}
                  regroupant={regroupant}
                  confirmingDelete={confirmDelete === g.racine.id}
                  onLike={() => actions.likeGroupe(g)}
                  onRetain={(on) => actions.retain(g.racine.id, on)}
                  onStartMerge={() => setRegroupant(g.racine.id)}
                  onMergeHere={() => regrouperIci(g.racine.id)}
                  onDetach={(id) => actions.merge(id, null)}
                  onDelete={() => {
                    if (confirmDelete === g.racine.id) { actions.deleteItem(g.racine.id); setConfirmDelete(null); }
                    else setConfirmDelete(g.racine.id);
                  }}
                />
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Colonne des problèmes retenus */}
      <aside
        className="relative flex w-[300px] shrink-0 flex-col overflow-hidden border-l-2"
        style={{ borderColor: '#fed7aa', background: '#fff7ed' }}
        aria-label="Problèmes retenus"
      >
        <div className="flex items-center gap-1.5 border-b px-4 py-3" style={{ borderColor: '#fed7aa' }}>
          <Check className="h-4 w-4" style={{ color: RESOLUTION_ACCENT }} aria-hidden />
          <h3 className="text-xs font-bold uppercase tracking-wide" style={{ color: RESOLUTION_ACCENT }}>Problèmes retenus</h3>
          <span className="ml-auto rounded-full px-2 py-0.5 text-[11px] font-bold text-white" style={{ background: RESOLUTION_ACCENT }}>
            {retenus.length} / {MAX_RETENUS}
          </span>
        </div>
        <div className="flex flex-1 flex-col gap-2.5 overflow-y-auto p-3" aria-live="polite">
          {retenus.length === 0 ? (
            <p className="m-auto px-4 text-center text-xs leading-relaxed" style={{ color: '#9a3412' }}>
              L’animateur retient ici {MAX_RETENUS} problèmes au plus, en s’appuyant sur les cœurs.
            </p>
          ) : retenus.map((g, i) => {
            const question = state.questions[g.racine.id]?.text ?? '';
            return (
              <div key={g.racine.id} className="rounded-lg border-l-4 bg-white p-3 shadow-sm" style={{ borderLeftColor: RESOLUTION_ACCENT }}>
                <div className="flex items-center gap-1.5">
                  <span className="rounded px-1.5 py-0.5 text-[10px] font-bold text-white" style={{ background: RESOLUTION_ACCENT }}>P{i + 1}</span>
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold" style={{ color: '#ec4899' }}>
                    <Heart className="h-3 w-3" style={{ fill: '#ec4899' }} aria-hidden /> {g.voix.length}
                  </span>
                  {isFacilitator && (
                    <button
                      type="button"
                      onClick={() => actions.retain(g.racine.id, false)}
                      className="ml-auto rounded-md border px-1.5 py-0.5 text-[10px] font-bold transition-colors hover:border-danger-500 hover:bg-danger-50 hover:text-danger-600"
                      style={{ borderColor: '#fed7aa', color: '#9a3412' }}
                    >
                      Retirer
                    </button>
                  )}
                </div>
                {!isFacilitator && question && <p className="mt-1.5 break-words text-[13px] font-bold leading-snug text-navy">{question}</p>}
                <p className={`mt-1.5 break-words leading-snug ${!isFacilitator && question ? 'text-xs text-muted' : 'text-[13px] text-navy'}`}>
                  {g.racine.text}
                </p>
                {isFacilitator && (
                  <div className="mt-2">
                    <TexteSynchro
                      value={question}
                      onCommit={(t) => actions.setQuestion(g.racine.id, t)}
                      label={`Reformulation du problème ${i + 1}`}
                      placeholder="Comment pourrions-nous… ?"
                      maxLength={QUESTION_MAX}
                      multiline
                      rows={2}
                      className="text-[13px]"
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
        {isFacilitator && (
          <p className="border-t px-4 py-2.5 text-[11px] leading-snug" style={{ borderColor: '#fed7aa', color: '#9a3412' }}>
            Reformuler en « Comment pourrions-nous… ? » tourne l’équipe vers les solutions.
          </p>
        )}
      </aside>
    </div>
  );
};

/** Pastille de tri (état pressé = fond navy). */
const Pastille: React.FC<{ label: string; selected: boolean; onClick: () => void }> = ({ label, selected, onClick }) => (
  <button
    type="button"
    aria-pressed={selected}
    onClick={onClick}
    className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal ${
      selected ? 'border-navy bg-navy text-white' : 'border-line bg-white text-muted hover:text-navy'
    }`}
  >
    {label}
  </button>
);

/** Carte d'un problème (et des doublons regroupés dedans). */
const GroupeCard: React.FC<{
  groupe: GroupeProblemes;
  rang?: number;
  /** J'ai mis un cœur sur ce problème ou sur un des problèmes regroupés dedans. */
  voted: boolean;
  anonymous: boolean;
  myId: string;
  isFacilitator: boolean;
  outOfVotes: boolean;
  retenusPleins: boolean;
  regroupant: string | null;
  confirmingDelete: boolean;
  onLike: () => void;
  onRetain: (on: boolean) => void;
  onStartMerge: () => void;
  onMergeHere: () => void;
  onDetach: (id: string) => void;
  onDelete: () => void;
}> = ({
  groupe, rang, voted, anonymous, myId, isFacilitator, outOfVotes, retenusPleins, regroupant, confirmingDelete,
  onLike, onRetain, onStartMerge, onMergeHere, onDetach, onDelete,
}) => {
  const { racine: p, membres, voix } = groupe;
  const mine = p.authorId === myId;
  const enRegroupement = regroupant === p.id;
  const cible = !!regroupant && !enRegroupement;

  return (
    <li
      className="relative flex flex-col gap-2 rounded-xl bg-white p-3.5 shadow-sm transition-shadow hover:shadow-md"
      style={rang || enRegroupement ? { outline: `2px solid ${RESOLUTION_ACCENT}`, outlineOffset: 0 } : undefined}
    >
      {rang && (
        <span className="absolute -top-2 right-2.5 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white" style={{ background: RESOLUTION_ACCENT }}>
          Retenu · P{rang}
        </span>
      )}
      <p className="flex-1 break-words text-sm leading-snug text-navy">{p.text}</p>
      <span className="inline-flex items-center gap-1 text-[11px] font-semibold" style={{ color: anonymous && !mine ? '#94a3b8' : p.authorColor }}>
        {!(anonymous && !mine) && <span className="h-2 w-2 rounded-full" style={{ background: p.authorColor }} aria-hidden />}
        {authorLabel(p, anonymous, myId)}
      </span>

      {membres.length > 0 && (
        <ul className="flex flex-col gap-1 rounded-lg bg-surface p-2" aria-label="Problèmes regroupés">
          {membres.map((m) => (
            <li key={m.id} className="flex items-start gap-1.5 text-xs leading-snug text-muted">
              <Link2 className="mt-0.5 h-3 w-3 shrink-0" aria-hidden />
              <span className="flex-1 break-words">
                {m.text}
                <span className="font-semibold"> — {authorLabel(m, anonymous, myId)}</span>
              </span>
              {isFacilitator && (
                <button
                  type="button"
                  onClick={() => onDetach(m.id)}
                  aria-label={`Détacher : « ${m.text} »`}
                  title="Détacher"
                  className="rounded p-0.5 text-muted hover:text-navy"
                >
                  <Unlink className="h-3 w-3" aria-hidden />
                </button>
              )}
            </li>
          ))}
        </ul>
      )}

      <div className="flex flex-wrap items-center gap-1.5">
        <button
          type="button"
          onClick={onLike}
          disabled={mine && !voted}
          aria-pressed={voted}
          title={mine && !voted ? 'On ne vote pas pour son propre problème' : outOfVotes && !voted ? 'Plus de cœurs disponibles' : undefined}
          aria-label={voted ? `Retirer mon cœur (${voix.length})` : `Donner un cœur (${voix.length})`}
          className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-bold transition-colors disabled:cursor-default disabled:opacity-40 ${
            voted ? 'border-pink-200 bg-pink-50' : 'border-line hover:border-pink-200'
          } ${outOfVotes && !voted && !mine ? 'opacity-50' : ''}`}
          style={{ color: voted ? '#ec4899' : '#94a3b8' }}
        >
          <Heart className="h-3.5 w-3.5" style={{ fill: voted ? '#ec4899' : 'none' }} aria-hidden />
          {voix.length}
        </button>
        {isFacilitator && (
          <div className="ml-auto flex items-center gap-1">
            <button
              type="button"
              onClick={onDelete}
              aria-label={confirmingDelete ? 'Confirmer la suppression' : 'Supprimer ce problème'}
              title="Supprimer (modération)"
              className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-bold transition-colors ${
                confirmingDelete ? 'bg-danger-600 text-white' : 'text-muted hover:bg-danger-50 hover:text-danger-600'
              }`}
            >
              <Trash2 className="h-3.5 w-3.5" aria-hidden /> {confirmingDelete && 'Supprimer ?'}
            </button>
            <button
              type="button"
              onClick={onStartMerge}
              title="Regrouper avec un autre problème"
              className="inline-flex items-center gap-1 rounded-md bg-surface px-2 py-1 text-[11px] font-bold text-muted transition-colors hover:text-navy"
            >
              <Link2 className="h-3.5 w-3.5" aria-hidden /> Regrouper
            </button>
            <button
              type="button"
              onClick={() => onRetain(!rang)}
              disabled={!rang && retenusPleins}
              title={!rang && retenusPleins ? `${MAX_RETENUS} problèmes déjà retenus` : undefined}
              className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-bold transition-colors disabled:cursor-not-allowed disabled:opacity-40"
              style={rang ? { background: RESOLUTION_ACCENT, color: '#fff' } : { background: '#fff7ed', color: RESOLUTION_ACCENT }}
            >
              <Check className="h-3.5 w-3.5" aria-hidden /> {rang ? 'Retenu' : 'Retenir'}
            </button>
          </div>
        )}
      </div>

      {cible && (
        <button
          type="button"
          onClick={onMergeHere}
          className="absolute inset-0 flex items-center justify-center gap-1.5 rounded-xl border-2 border-dashed bg-white/85 text-sm font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal"
          style={{ borderColor: RESOLUTION_ACCENT, color: RESOLUTION_ACCENT }}
        >
          <Link2 className="h-4 w-4" aria-hidden /> Regrouper ici
        </button>
      )}
    </li>
  );
};
