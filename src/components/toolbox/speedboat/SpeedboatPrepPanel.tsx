import React, { useState } from 'react';
import { Anchor, Heart, Pencil, Send, X } from 'lucide-react';
import type { BoardNote } from '@/components/toolbox/shared/boardNotes';
import {
  SPEEDBOAT_ACCENT, SPEEDBOAT_TEXT_MAX, SPEEDBOAT_ZONES, getSpeedboatZone, type SpeedboatZoneKey,
} from './speedboatLogic';

interface SpeedboatPrepPanelProps {
  myName: string;
  myColor: string;
  myNotes: BoardNote[];
  anonymous: boolean;
  onAddDraft: (zone: SpeedboatZoneKey, text: string) => void;
  onPublish: (ids: string[]) => void;
  onDeleteDraft: (id: string) => void;
}

/**
 * Panneau latéral « Mon espace » : choisir une zone, rédiger un ticket en
 * privé, le modifier tant qu'il est en brouillon, puis le placer sur le
 * tableau (avec confirmation).
 */
export const SpeedboatPrepPanel: React.FC<SpeedboatPrepPanelProps> = ({
  myName, myColor, myNotes, anonymous, onAddDraft, onPublish, onDeleteDraft,
}) => {
  const [zone, setZone] = useState<SpeedboatZoneKey>('vent');
  const [text, setText] = useState('');
  const [confirmIds, setConfirmIds] = useState<string[] | null>(null);
  const selected = getSpeedboatZone(zone);
  const drafts = myNotes.filter((n) => !n.revealed);

  const submit = () => {
    if (!text.trim()) return;
    onAddDraft(zone, text);
    setText('');
  };

  /** Remet un brouillon dans la zone de saisie pour le retravailler. */
  const edit = (n: BoardNote) => {
    setText(n.text);
    setZone(getSpeedboatZone(n.category).key);
    onDeleteDraft(n.id);
  };

  return (
    <aside className="relative flex w-[300px] shrink-0 flex-col overflow-hidden border-r border-line bg-white" aria-label="Mon espace">
      <div className="border-b border-line px-4 py-3">
        <p className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-muted">
          <Anchor className="h-4 w-4" style={{ color: SPEEDBOAT_ACCENT }} aria-hidden /> Mon espace
        </p>
        <p className="mt-1 flex items-center gap-2 text-sm font-bold text-navy">
          <span className="h-2.5 w-2.5 rounded-full" style={{ background: myColor }} aria-hidden />
          {myName}
        </p>
      </div>

      <div className="flex flex-1 flex-col gap-4 overflow-y-auto p-4">
        <div>
          <p className="mb-1.5 text-xs font-bold uppercase tracking-wide text-muted">Zone du ticket</p>
          <div className="grid grid-cols-2 gap-1.5" role="radiogroup" aria-label="Zone du ticket">
            {SPEEDBOAT_ZONES.map((z) => {
              const sel = z.key === zone;
              return (
                <button
                  key={z.key}
                  type="button"
                  role="radio"
                  aria-checked={sel}
                  onClick={() => setZone(z.key)}
                  className="flex items-center gap-1.5 rounded-lg border px-2 py-1.5 text-left text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal"
                  style={sel
                    ? { borderColor: z.color, color: z.color, background: `${z.color}14` }
                    : { borderColor: '#e2e8f0', color: '#64748b' }}
                >
                  <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: z.color }} aria-hidden />
                  {z.name}
                </button>
              );
            })}
          </div>
          <p className="mt-1.5 text-xs leading-relaxed text-muted">{selected.desc}</p>
        </div>

        <div>
          <label htmlFor="speedboat-text" className="mb-1.5 block text-xs font-bold" style={{ color: selected.color }}>{selected.name}</label>
          <textarea
            id="speedboat-text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); submit(); } }}
            placeholder={selected.placeholder}
            rows={3}
            maxLength={SPEEDBOAT_TEXT_MAX}
            className="w-full resize-none rounded-lg border border-line p-2.5 text-sm text-navy outline-none placeholder:text-muted/60 focus:border-teal"
          />
          <p className="text-right text-[11px] text-muted">{text.length} / {SPEEDBOAT_TEXT_MAX}</p>
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

        {myNotes.length > 0 && (
          <div>
            <div className="mb-1.5 flex items-center gap-2">
              <p className="text-xs font-bold uppercase tracking-wide text-muted">Mes tickets</p>
              {drafts.length > 1 && (
                <button
                  type="button"
                  onClick={() => setConfirmIds(drafts.map((n) => n.id))}
                  className="ml-auto inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-bold text-white transition-opacity hover:opacity-90"
                  style={{ background: SPEEDBOAT_ACCENT }}
                >
                  <Send className="h-3 w-3" aria-hidden /> Tout placer ({drafts.length})
                </button>
              )}
            </div>
            <ul className="flex flex-col gap-1.5">
              {myNotes.map((n) => {
                const z = getSpeedboatZone(n.category);
                return (
                  <li key={n.id} className="rounded-lg border-l-4 bg-surface p-2 text-sm" style={{ borderLeftColor: z.color }}>
                    <div className="flex items-start justify-between gap-1">
                      <span className={`rounded px-1.5 py-0.5 text-[10px] font-bold uppercase ${
                        n.revealed ? 'bg-teal-light text-teal-dark' : 'bg-line/60 text-muted'
                      }`}>
                        {n.revealed ? 'Placé' : 'Brouillon'}
                      </span>
                      {n.revealed ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold" style={{ color: '#ec4899' }}>
                          <Heart className="h-3 w-3" style={{ fill: '#ec4899' }} aria-hidden /> {n.likedBy.length}
                          {n.retained && <span className="ml-1 text-warning-700">· retenu</span>}
                        </span>
                      ) : (
                        <span className="flex items-center gap-0.5">
                          <button
                            type="button"
                            onClick={() => edit(n)}
                            aria-label="Modifier le brouillon"
                            title="Modifier"
                            className="rounded p-0.5 text-muted hover:text-navy"
                          >
                            <Pencil className="h-3.5 w-3.5" aria-hidden />
                          </button>
                          <button
                            type="button"
                            onClick={() => onDeleteDraft(n.id)}
                            aria-label="Supprimer le brouillon"
                            title="Supprimer"
                            className="rounded p-0.5 text-muted hover:text-danger-600"
                          >
                            <X className="h-3.5 w-3.5" aria-hidden />
                          </button>
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-[11px] font-bold" style={{ color: z.color }}>{z.name}</p>
                    <p className="mt-0.5 break-words leading-snug text-navy">{n.text}</p>
                    {!n.revealed && (
                      <button
                        type="button"
                        onClick={() => setConfirmIds([n.id])}
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
          aria-labelledby="speedboat-confirm-publish-title"
          className="fixed inset-0 z-[210] flex items-center justify-center bg-navy/60 p-6"
          onClick={(e) => { if (e.target === e.currentTarget) setConfirmIds(null); }}
        >
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-card-hover">
            <h2 id="speedboat-confirm-publish-title" className="text-base font-bold text-navy">
              {confirmIds.length > 1 ? `Placer vos ${confirmIds.length} tickets sur le tableau ?` : 'Placer ce ticket sur le tableau ?'}
            </h2>
            <p className="mt-2 text-sm text-muted">
              {confirmIds.length > 1 ? 'Ils seront visibles' : 'Il sera visible'} par tous les participants{anonymous ? ', sans votre nom' : ''}.
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

export default SpeedboatPrepPanel;
