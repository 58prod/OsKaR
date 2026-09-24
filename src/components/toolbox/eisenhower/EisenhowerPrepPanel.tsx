import React, { useState } from 'react';
import { Grid2x2, Pencil, Send, X } from 'lucide-react';
import type { ExemplesEisenhower } from '@/lib/exemplesEisenhower';
import {
  EISENHOWER_ACCENT, EISENHOWER_TEXT_MAX, QUADRANTS, getQuadrant,
  type EisenhowerTicket, type Placement, type QuadrantKey,
} from './eisenhowerLogic';

interface EisenhowerPrepPanelProps {
  myName: string;
  myColor: string;
  myTickets: EisenhowerTicket[];
  placements: Record<string, Placement>;
  anonymous: boolean;
  /** Exemples de tâches par quadrant, adaptés au métier. */
  exemples: ExemplesEisenhower;
  /** Texte affiché d'un ticket (retouché s'il l'a été). */
  texteDe: (t: EisenhowerTicket) => string;
  onAddDraft: (quadrant: QuadrantKey, text: string) => void;
  onPublish: (ids: string[]) => void;
  onDeleteDraft: (id: string) => void;
}

/**
 * Panneau latéral « Mon espace » : choisir un quadrant sur une petite
 * matrice, rédiger un ticket en privé, le retravailler tant qu'il est en
 * brouillon, puis le placer sur la matrice partagée.
 */
export const EisenhowerPrepPanel: React.FC<EisenhowerPrepPanelProps> = ({
  myName, myColor, myTickets, placements, anonymous, exemples, texteDe, onAddDraft, onPublish, onDeleteDraft,
}) => {
  const [quadrant, setQuadrant] = useState<QuadrantKey>('faire');
  const [text, setText] = useState('');
  const [confirmIds, setConfirmIds] = useState<string[] | null>(null);
  const selected = getQuadrant(quadrant);
  const drafts = myTickets.filter((t) => !t.revealed);

  const submit = () => {
    if (!text.trim()) return;
    onAddDraft(quadrant, text);
    setText('');
  };

  /** Remet un brouillon dans la zone de saisie pour le retravailler. */
  const edit = (t: EisenhowerTicket) => {
    setText(t.text);
    setQuadrant(t.quadrant);
    onDeleteDraft(t.id);
  };

  return (
    <aside className="relative flex w-[300px] shrink-0 flex-col overflow-hidden border-r border-line bg-white" aria-label="Mon espace">
      <div className="border-b border-line px-4 py-3">
        <p className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-muted">
          <Grid2x2 className="h-4 w-4" style={{ color: EISENHOWER_ACCENT }} aria-hidden /> Mon espace
        </p>
        <p className="mt-1 flex items-center gap-2 text-sm font-bold text-navy">
          <span className="h-2.5 w-2.5 rounded-full" style={{ background: myColor }} aria-hidden />
          {myName}
        </p>
      </div>

      <div className="flex flex-1 flex-col gap-4 overflow-y-auto p-4">
        <div>
          <p className="mb-1.5 text-xs font-bold uppercase tracking-wide text-muted">Où va ce ticket ?</p>
          <div className="grid grid-cols-[auto_1fr_1fr] gap-1 text-[10px] font-bold uppercase tracking-wide text-muted" role="radiogroup" aria-label="Quadrant du ticket">
            <span />
            <span className="text-center">Urgent</span>
            <span className="text-center">Pas urgent</span>
            {(['Important', 'Pas important'] as const).map((ligne, i) => (
              <React.Fragment key={ligne}>
                <span className="flex items-center justify-end pr-0.5 [writing-mode:vertical-rl] rotate-180">{ligne}</span>
                {QUADRANTS.slice(i * 2, i * 2 + 2).map((z) => {
                  const sel = z.key === quadrant;
                  return (
                    <button
                      key={z.key}
                      type="button"
                      role="radio"
                      aria-checked={sel}
                      onClick={() => setQuadrant(z.key)}
                      className="flex min-h-[52px] flex-col items-center justify-center rounded-lg border px-1 py-1.5 text-center normal-case tracking-normal transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal"
                      style={sel
                        ? { borderColor: z.color, background: `${z.color}14`, color: z.color, boxShadow: `inset 0 0 0 1px ${z.color}` }
                        : { borderColor: '#e2e8f0', background: `${z.color}08`, color: '#64748b' }}
                    >
                      <span className="text-sm font-bold" style={{ color: z.color }}>{z.rang}. {z.verbe}</span>
                    </button>
                  );
                })}
              </React.Fragment>
            ))}
          </div>
          <p className="mt-1.5 text-xs leading-relaxed text-muted">
            <strong style={{ color: selected.color }}>{selected.criteres}.</strong> {selected.desc}
          </p>
        </div>

        <div>
          <label htmlFor="eisenhower-text" className="mb-1.5 block text-xs font-bold" style={{ color: selected.color }}>
            {selected.rang}. {selected.verbe}
          </label>
          <textarea
            id="eisenhower-text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); submit(); } }}
            placeholder={`Ex : ${exemples[quadrant]}`}
            rows={3}
            maxLength={EISENHOWER_TEXT_MAX}
            className="w-full resize-none rounded-lg border border-line p-2.5 text-sm text-navy outline-none placeholder:text-muted/60 focus:border-teal"
          />
          <p className="text-right text-[11px] text-muted">{text.length} / {EISENHOWER_TEXT_MAX}</p>
          <button
            type="button"
            onClick={submit}
            disabled={!text.trim()}
            className="mt-1 w-full rounded-lg px-3 py-2 text-sm font-bold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
            style={{ background: selected.color }}
          >
            Préparer
          </button>
          <p className="mt-1 text-center text-[11px] text-muted">
            Ctrl+Entrée pour préparer · personne ne voit vos brouillons{anonymous ? ' · tickets placés sans votre nom' : ''}
          </p>
        </div>

        {myTickets.length > 0 && (
          <div>
            <div className="mb-1.5 flex items-center gap-2">
              <p className="text-xs font-bold uppercase tracking-wide text-muted">Mes tickets</p>
              {drafts.length > 1 && (
                <button
                  type="button"
                  onClick={() => setConfirmIds(drafts.map((t) => t.id))}
                  className="ml-auto inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-bold text-white transition-opacity hover:opacity-90"
                  style={{ background: EISENHOWER_ACCENT }}
                >
                  <Send className="h-3 w-3" aria-hidden /> Tout placer ({drafts.length})
                </button>
              )}
            </div>
            <ul className="flex flex-col gap-1.5">
              {myTickets.map((t) => {
                // Placé, le ticket suit le quadrant où l'équipe l'a mis.
                const z = getQuadrant(t.revealed ? placements[t.id]?.q ?? t.quadrant : t.quadrant);
                return (
                  <li key={t.id} className="rounded-lg border-l-4 bg-surface p-2 text-sm" style={{ borderLeftColor: z.color }}>
                    <div className="flex items-start justify-between gap-1">
                      <span className={`rounded px-1.5 py-0.5 text-[10px] font-bold uppercase ${
                        t.revealed ? 'bg-teal-light text-teal-dark' : 'bg-line/60 text-muted'
                      }`}>
                        {t.revealed ? 'Placé' : 'Brouillon'}
                      </span>
                      {!t.revealed && (
                        <span className="flex items-center gap-0.5">
                          <button
                            type="button"
                            onClick={() => edit(t)}
                            aria-label="Modifier le brouillon"
                            title="Modifier"
                            className="rounded p-0.5 text-muted hover:text-navy"
                          >
                            <Pencil className="h-3.5 w-3.5" aria-hidden />
                          </button>
                          <button
                            type="button"
                            onClick={() => onDeleteDraft(t.id)}
                            aria-label="Supprimer le brouillon"
                            title="Supprimer"
                            className="rounded p-0.5 text-muted hover:text-danger-600"
                          >
                            <X className="h-3.5 w-3.5" aria-hidden />
                          </button>
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-[11px] font-bold" style={{ color: z.color }}>{z.rang}. {z.verbe}</p>
                    <p className="mt-0.5 break-words leading-snug text-navy">{texteDe(t)}</p>
                    {!t.revealed && (
                      <button
                        type="button"
                        onClick={() => setConfirmIds([t.id])}
                        className="mt-1.5 rounded-md bg-navy px-2.5 py-1 text-xs font-bold text-white transition-colors hover:bg-navy-light"
                      >
                        Placer
                      </button>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </div>

      {confirmIds && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="eisenhower-confirm-publish-title"
          className="fixed inset-0 z-[210] flex items-center justify-center bg-navy/60 p-6"
          onClick={(e) => { if (e.target === e.currentTarget) setConfirmIds(null); }}
        >
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-card-hover">
            <h2 id="eisenhower-confirm-publish-title" className="text-base font-bold text-navy">
              {confirmIds.length > 1 ? `Placer vos ${confirmIds.length} tickets sur la matrice ?` : 'Placer ce ticket sur la matrice ?'}
            </h2>
            <p className="mt-2 text-sm text-muted">
              {confirmIds.length > 1 ? 'Ils seront visibles' : 'Il sera visible'} par tous les participants{anonymous ? ', sans votre nom' : ''}.
              Vous pourrez ensuite {confirmIds.length > 1 ? 'les' : 'le'} déplacer sur la matrice.
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setConfirmIds(null)}
                className="rounded-lg border border-line px-3 py-1.5 text-sm font-semibold text-navy transition-colors hover:bg-surface"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={() => { onPublish(confirmIds); setConfirmIds(null); }}
                className="rounded-lg bg-teal px-3 py-1.5 text-sm font-bold text-navy transition-colors hover:bg-teal-dark"
              >
                Placer
              </button>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
};

export default EisenhowerPrepPanel;
