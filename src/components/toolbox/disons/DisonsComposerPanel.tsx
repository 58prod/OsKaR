import React, { useEffect, useState } from 'react';
import { AlertCircle, Heart, MessageSquare, Pencil, Play, Send, X } from 'lucide-react';
import type { BoardNote } from '@/components/toolbox/shared/boardNotes';
import { DISONS_ACCENT, DISONS_KINDS, DISONS_TEXT_MAX, getDisonsKind, type DisonsKind } from './disonsLogic';

interface DisonsComposerPanelProps {
  myName: string;
  myColor: string;
  myNotes: BoardNote[];
  anonymous: boolean;
  onAddDraft: (kind: DisonsKind, text: string) => void;
  onPublish: (ids: string[]) => void;
  onDeleteDraft: (id: string) => void;
}

/**
 * Panneau latéral « Mon espace » : rédiger une carte Frein ou Moteur en
 * privé, la modifier tant qu'elle est en brouillon, puis la publier dans
 * l'espace commun (avec confirmation légère).
 */
export const DisonsComposerPanel: React.FC<DisonsComposerPanelProps> = ({
  myName, myColor, myNotes, anonymous, onAddDraft, onPublish, onDeleteDraft,
}) => {
  const [kind, setKind] = useState<DisonsKind>('frein');
  const [text, setText] = useState('');
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const selected = getDisonsKind(kind);
  const drafts = myNotes.filter((n) => !n.revealed);

  // La demande de confirmation « Publier ? » expire après quelques secondes.
  useEffect(() => {
    if (!confirmId) return;
    const t = setTimeout(() => setConfirmId(null), 5000);
    return () => clearTimeout(t);
  }, [confirmId]);

  const submit = () => {
    if (!text.trim()) return;
    onAddDraft(kind, text);
    setText('');
  };

  /** Remet un brouillon dans la zone de saisie pour le retravailler. */
  const edit = (n: BoardNote) => {
    setText(n.text);
    setKind(getDisonsKind(n.category).key);
    onDeleteDraft(n.id);
  };

  return (
    <aside className="relative flex w-[300px] shrink-0 flex-col overflow-hidden border-r border-line bg-white" aria-label="Mon espace">
      <div className="border-b border-line px-4 py-3">
        <p className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-muted">
          <MessageSquare className="h-4 w-4" style={{ color: DISONS_ACCENT }} aria-hidden /> Mon espace
        </p>
        <p className="mt-1 flex items-center gap-2 text-sm font-bold text-navy">
          <span className="h-2.5 w-2.5 rounded-full" style={{ background: myColor }} aria-hidden />
          {myName}
        </p>
      </div>

      <div className="flex flex-1 flex-col gap-4 overflow-y-auto p-4">
        {/* Composer */}
        <div>
          <div className="mb-2 grid grid-cols-2 gap-1.5" role="radiogroup" aria-label="Type de carte">
            {DISONS_KINDS.map((k) => {
              const sel = k.key === kind;
              const Icon = k.key === 'frein' ? AlertCircle : Play;
              return (
                <button
                  key={k.key}
                  type="button"
                  role="radio"
                  aria-checked={sel}
                  onClick={() => setKind(k.key)}
                  className="inline-flex items-center justify-center gap-1.5 rounded-lg border px-2 py-1.5 text-xs font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal"
                  style={sel
                    ? { borderColor: k.color, background: k.bg, color: k.color }
                    : { borderColor: '#e2e8f0', color: '#64748b' }}
                >
                  <Icon className="h-3.5 w-3.5" aria-hidden />
                  {k.label}
                </button>
              );
            })}
          </div>
          <label htmlFor="disons-text" className="mb-1.5 block text-xs font-bold uppercase tracking-wide" style={{ color: selected.color }}>
            {selected.columnTitle}
          </label>
          <textarea
            id="disons-text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); submit(); } }}
            placeholder={selected.placeholder}
            rows={3}
            maxLength={DISONS_TEXT_MAX}
            className="w-full resize-none rounded-lg border border-line p-2.5 text-sm text-navy outline-none placeholder:text-muted/60 focus:border-teal"
          />
          <p className="text-right text-[11px] text-muted">{text.length} / {DISONS_TEXT_MAX}</p>
          <button
            type="button"
            onClick={submit}
            disabled={!text.trim()}
            className="mt-1 w-full rounded-lg px-3 py-2 text-sm font-bold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
            style={{ background: selected.color }}
          >
            Ajouter à mes brouillons
          </button>
          <p className="mt-1 text-center text-[11px] text-muted">
            Ctrl+Entrée pour ajouter · personne ne voit vos brouillons{anonymous ? ' · cartes publiées sans votre nom' : ''}
          </p>
        </div>

        {/* Mes cartes */}
        {myNotes.length > 0 && (
          <div>
            <div className="mb-1.5 flex items-center gap-2">
              <p className="text-xs font-bold uppercase tracking-wide text-muted">Mes cartes</p>
              {drafts.length > 1 && (
                <button
                  type="button"
                  onClick={() => onPublish(drafts.map((n) => n.id))}
                  className="ml-auto inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-bold text-white transition-opacity hover:opacity-90"
                  style={{ background: DISONS_ACCENT }}
                >
                  <Send className="h-3 w-3" aria-hidden /> Tout publier ({drafts.length})
                </button>
              )}
            </div>
            <ul className="flex flex-col gap-1.5">
              {myNotes.map((n) => {
                const k = getDisonsKind(n.category);
                return (
                  <li key={n.id} className="rounded-lg border-l-4 bg-surface p-2 text-sm" style={{ borderLeftColor: k.color }}>
                    <div className="flex items-start justify-between gap-1">
                      <span className={`rounded px-1.5 py-0.5 text-[10px] font-bold uppercase ${
                        n.revealed ? 'bg-teal-light text-teal-dark' : 'bg-line/60 text-muted'
                      }`}>
                        {n.revealed ? 'Publiée' : 'Brouillon'}
                      </span>
                      {n.revealed ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold" style={{ color: '#ec4899' }}>
                          <Heart className="h-3 w-3" style={{ fill: '#ec4899' }} aria-hidden /> {n.likedBy.length}
                          {n.retained && <span className="ml-1 text-warning-700">· retenue</span>}
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
                    <p className="mt-1 text-[11px] font-bold" style={{ color: k.color }}>{k.label}</p>
                    <p className="mt-0.5 break-words leading-snug text-navy">{n.text}</p>
                    {!n.revealed && (confirmId === n.id ? (
                      <div className="mt-1.5 flex items-center gap-1.5" aria-live="polite">
                        <span className="text-[11px] font-semibold text-muted">Visible par tous ?</span>
                        <button
                          type="button"
                          onClick={() => { onPublish([n.id]); setConfirmId(null); }}
                          className="rounded-md bg-teal px-2.5 py-1 text-xs font-bold text-navy transition-colors hover:bg-teal-dark"
                        >
                          Publier
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmId(null)}
                          className="rounded-md border border-line px-2 py-1 text-xs font-semibold text-navy transition-colors hover:bg-surface"
                        >
                          Annuler
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setConfirmId(n.id)}
                        className="mt-1.5 rounded-md bg-navy px-2.5 py-1 text-xs font-bold text-white transition-colors hover:bg-navy-light"
                      >
                        Publier
                      </button>
                    ))}
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </div>
    </aside>
  );
};

export default DisonsComposerPanel;
