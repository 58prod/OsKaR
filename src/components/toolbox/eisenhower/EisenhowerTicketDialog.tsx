import React, { useEffect, useState } from 'react';
import { Layers, Trash2, Unlink, X } from 'lucide-react';
import { TexteSynchro } from '@/components/toolbox/shared/TexteSynchro';
import {
  EISENHOWER_ACCENT, EISENHOWER_PORTEUR_MAX, EISENHOWER_TEXT_MAX, QUADRANTS, getQuadrant,
  type EisenhowerState, type EisenhowerTicket, type GroupeTickets, type QuadrantKey,
} from './eisenhowerLogic';

interface EisenhowerTicketDialogProps {
  groupe: GroupeTickets;
  state: EisenhowerState;
  myId: string;
  isFacilitator: boolean;
  /** Prénoms des participants, proposés pour le porteur. */
  noms: string[];
  texteDe: (t: EisenhowerTicket) => string;
  onClose: () => void;
  onEditText: (id: string, text: string) => void;
  onPorteur: (id: string, text: string) => void;
  onEcheance: (id: string, text: string) => void;
  onMoveToQuadrant: (id: string, q: QuadrantKey) => void;
  onDetach: (id: string) => void;
  onStartMerge: (id: string) => void;
  onDelete: (id: string) => void;
}

/**
 * Un ticket ouvert : son texte, son quadrant, son suivi (porteur et
 * échéance, libellés selon le quadrant) et les tickets regroupés dessous.
 */
export const EisenhowerTicketDialog: React.FC<EisenhowerTicketDialogProps> = ({
  groupe, state, myId, isFacilitator, noms, texteDe, onClose, onEditText, onPorteur, onEcheance,
  onMoveToQuadrant, onDetach, onStartMerge, onDelete,
}) => {
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const { tete, membres, placement } = groupe;
  const z = getQuadrant(placement.q);
  const peutModifier = (t: EisenhowerTicket) => isFacilitator || t.authorId === myId;
  const auteur = (t: EisenhowerTicket) => (t.authorId === myId ? 'Vous' : state.anonymous ? 'Anonyme' : t.authorName);

  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [onClose]);

  const supprimer = (id: string) => {
    if (confirmDelete !== id) { setConfirmDelete(id); return; }
    onDelete(id);
    setConfirmDelete(null);
    if (id === tete.id && membres.length === 0) onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="eisenhower-ticket-title"
      className="fixed inset-0 z-[210] flex items-center justify-center bg-navy/60 p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border-t-[6px] bg-white p-5 shadow-card-hover" style={{ borderTopColor: z.color }}>
        <div className="flex items-start gap-2">
          <h2 id="eisenhower-ticket-title" className="text-sm font-extrabold" style={{ color: z.color }}>
            {z.rang}. {z.verbe} <span className="font-semibold text-muted">— {z.criteres.toLowerCase()}</span>
          </h2>
          <button type="button" onClick={onClose} aria-label="Fermer" className="ml-auto rounded p-1 text-muted hover:bg-surface hover:text-navy">
            <X className="h-4 w-4" aria-hidden />
          </button>
        </div>

        <div className="mt-3">
          {peutModifier(tete) ? (
            <TexteSynchro
              value={texteDe(tete)}
              onCommit={(text) => onEditText(tete.id, text)}
              label="Texte du ticket"
              maxLength={EISENHOWER_TEXT_MAX}
              multiline
              rows={3}
            />
          ) : (
            <p className="break-words text-base font-semibold leading-snug text-navy">{texteDe(tete)}</p>
          )}
          <p className="mt-1 text-xs text-muted">Écrit par {auteur(tete)}</p>
        </div>

        <div className="mt-4">
          <p className="mb-1.5 text-xs font-bold uppercase tracking-wide text-muted">Quadrant</p>
          <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-4">
            {QUADRANTS.map((q) => {
              const sel = q.key === z.key;
              return (
                <button
                  key={q.key}
                  type="button"
                  aria-pressed={sel}
                  onClick={() => onMoveToQuadrant(tete.id, q.key)}
                  className="rounded-lg border px-2 py-1.5 text-xs font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal"
                  style={sel
                    ? { borderColor: q.color, background: `${q.color}14`, color: q.color }
                    : { borderColor: '#e2e8f0', color: '#64748b' }}
                >
                  {q.rang}. {q.verbe}
                </button>
              );
            })}
          </div>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <label className="block">
            <span className="mb-1 block text-xs font-bold text-navy">{z.qui}</span>
            <TexteSynchro
              value={state.porteurs[tete.id]?.text ?? ''}
              onCommit={(text) => onPorteur(tete.id, text)}
              label={z.qui}
              placeholder="Prénom"
              maxLength={EISENHOWER_PORTEUR_MAX}
              list="eisenhower-noms"
            />
            <datalist id="eisenhower-noms">
              {noms.map((n) => <option key={n} value={n} />)}
            </datalist>
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-bold text-navy">{z.quand}</span>
            <input
              type="date"
              value={state.echeances[tete.id]?.text ?? ''}
              onChange={(e) => onEcheance(tete.id, e.target.value)}
              className="w-full rounded-lg border border-line bg-white px-2.5 py-1.5 text-sm text-navy outline-none focus:border-teal"
            />
          </label>
        </div>

        {membres.length > 0 && (
          <div className="mt-4">
            <p className="mb-1.5 inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-muted">
              <Layers className="h-3.5 w-3.5" style={{ color: EISENHOWER_ACCENT }} aria-hidden />
              Regroupés avec ce ticket ({membres.length})
            </p>
            <ul className="flex flex-col gap-1.5">
              {membres.map((m) => (
                <li key={m.id} className="flex items-start gap-2 rounded-lg bg-surface p-2 text-sm">
                  <div className="min-w-0 flex-1">
                    <p className="break-words leading-snug text-navy">{texteDe(m)}</p>
                    <p className="text-[11px] text-muted">{auteur(m)}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => onDetach(m.id)}
                    className="inline-flex shrink-0 items-center gap-1 rounded-md border border-line bg-white px-2 py-1 text-[11px] font-semibold text-navy hover:bg-surface"
                  >
                    <Unlink className="h-3 w-3" aria-hidden /> Détacher
                  </button>
                  {peutModifier(m) && (
                    <button
                      type="button"
                      onClick={() => supprimer(m.id)}
                      aria-label={confirmDelete === m.id ? 'Confirmer la suppression' : 'Supprimer ce ticket'}
                      className={`inline-flex shrink-0 items-center gap-1 rounded-md px-1.5 py-1 text-[11px] font-bold ${
                        confirmDelete === m.id ? 'bg-danger-600 text-white' : 'text-muted hover:text-danger-600'
                      }`}
                    >
                      <Trash2 className="h-3 w-3" aria-hidden /> {confirmDelete === m.id && 'Supprimer ?'}
                    </button>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-line pt-4">
          <button
            type="button"
            onClick={() => { onStartMerge(tete.id); onClose(); }}
            className="inline-flex items-center gap-1.5 rounded-lg border border-line px-3 py-1.5 text-sm font-semibold text-navy transition-colors hover:bg-surface"
          >
            <Layers className="h-4 w-4" aria-hidden /> Regrouper avec un autre ticket
          </button>
          {peutModifier(tete) && (
            <button
              type="button"
              onClick={() => supprimer(tete.id)}
              className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-semibold transition-colors ${
                confirmDelete === tete.id ? 'bg-danger-600 text-white hover:bg-danger-700' : 'text-muted hover:text-danger-600'
              }`}
            >
              <Trash2 className="h-4 w-4" aria-hidden /> {confirmDelete === tete.id ? 'Confirmer la suppression' : 'Supprimer'}
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="ml-auto rounded-lg bg-navy px-4 py-1.5 text-sm font-bold text-white transition-colors hover:bg-navy-light"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};

export default EisenhowerTicketDialog;
