import React, { useEffect, useState } from 'react';
import { Heart, Lightbulb, Pencil, Send, X } from 'lucide-react';
import type { BoardNote } from '@/components/toolbox/shared/boardNotes';
import { IDEABOX_ACCENT, IDEA_CATEGORIES, IDEA_MAX, getIdeaCategory, type IdeaCategoryKey } from './ideaboxLogic';

interface IdeaboxComposerPanelProps {
  myName: string;
  myColor: string;
  myNotes: BoardNote[];
  anonymous: boolean;
  onAddDraft: (category: IdeaCategoryKey, text: string) => void;
  onPublish: (ids: string[]) => void;
  onDeleteDraft: (id: string) => void;
}

/**
 * Panneau latéral « Mon espace » : rédiger une idée en privé, choisir sa
 * catégorie, la modifier tant qu'elle est en brouillon, puis la publier
 * dans l'espace commun (confirmation légère).
 */
export const IdeaboxComposerPanel: React.FC<IdeaboxComposerPanelProps> = ({
  myName, myColor, myNotes, anonymous, onAddDraft, onPublish, onDeleteDraft,
}) => {
  const [category, setCategory] = useState<IdeaCategoryKey>('process');
  const [text, setText] = useState('');
  const [confirmId, setConfirmId] = useState<string | null>(null);

  // La demande de confirmation « Publier ? » expire après quelques secondes.
  useEffect(() => {
    if (!confirmId) return;
    const t = setTimeout(() => setConfirmId(null), 4000);
    return () => clearTimeout(t);
  }, [confirmId]);

  const drafts = myNotes.filter((n) => !n.revealed);

  const submit = () => {
    if (!text.trim()) return;
    onAddDraft(category, text);
    setText('');
  };

  /** Remet un brouillon dans la zone de saisie pour le retravailler. */
  const edit = (n: BoardNote) => {
    setText(n.text);
    setCategory(getIdeaCategory(n.category).key);
    onDeleteDraft(n.id);
  };

  return (
    <aside className="relative flex w-[300px] shrink-0 flex-col overflow-hidden border-r border-line bg-white" aria-label="Mon espace">
      <div className="border-b border-line px-4 py-3">
        <p className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-muted">
          <Lightbulb className="h-4 w-4" style={{ color: IDEABOX_ACCENT }} aria-hidden /> Mon espace
        </p>
        <p className="mt-1 flex items-center gap-2 text-sm font-bold text-navy">
          <span className="h-2.5 w-2.5 rounded-full" style={{ background: myColor }} aria-hidden />
          {myName}
        </p>
      </div>

      <div className="flex flex-1 flex-col gap-4 overflow-y-auto p-4">
        {/* Composer */}
        <div>
          <label htmlFor="ideabox-text" className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-muted">Nouvelle idée</label>
          <textarea
            id="ideabox-text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); submit(); } }}
            placeholder="Décrivez votre idée…"
            rows={3}
            maxLength={IDEA_MAX}
            className="w-full resize-none rounded-lg border border-line p-2.5 text-sm text-navy outline-none placeholder:text-muted/60 focus:border-teal"
          />
          <p className="text-right text-[11px] text-muted">{text.length} / {IDEA_MAX}</p>
          <p className="mb-1.5 text-xs font-bold uppercase tracking-wide text-muted">Catégorie</p>
          <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-label="Catégorie de l'idée">
            {IDEA_CATEGORIES.map((cat) => {
              const selected = cat.key === category;
              return (
                <button
                  key={cat.key}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  onClick={() => setCategory(cat.key)}
                  className="rounded-full border px-2.5 py-1 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal"
                  style={selected
                    ? { borderColor: 'transparent', background: cat.color, color: '#fff' }
                    : { borderColor: '#e2e8f0', color: '#64748b' }}
                >
                  {cat.label}
                </button>
              );
            })}
          </div>
          <button
            type="button"
            onClick={submit}
            disabled={!text.trim()}
            className="mt-3 w-full rounded-lg bg-navy px-3 py-2 text-sm font-bold text-white transition-colors hover:bg-navy-light disabled:cursor-not-allowed disabled:opacity-40"
          >
            Ajouter à mes brouillons
          </button>
          <p className="mt-1 text-center text-[11px] text-muted">
            Ctrl+Entrée pour ajouter · personne ne voit vos brouillons{anonymous ? ' · idées publiées sans votre nom' : ''}
          </p>
        </div>

        {/* Mes idées */}
        {myNotes.length > 0 && (
          <div>
            <div className="mb-1.5 flex items-center gap-2">
              <p className="text-xs font-bold uppercase tracking-wide text-muted">Mes idées</p>
              {drafts.length > 1 && (
                <button
                  type="button"
                  onClick={() => onPublish(drafts.map((n) => n.id))}
                  className="ml-auto inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-bold text-white transition-opacity hover:opacity-90"
                  style={{ background: IDEABOX_ACCENT }}
                >
                  <Send className="h-3 w-3" aria-hidden /> Tout publier ({drafts.length})
                </button>
              )}
            </div>
            <ul className="flex flex-col gap-1.5">
              {myNotes.map((n) => {
                const cat = getIdeaCategory(n.category);
                return (
                  <li key={n.id} className="rounded-lg border-l-4 bg-surface p-2 text-sm" style={{ borderLeftColor: cat.color }}>
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
                    <p className="mt-1 text-[11px] font-bold" style={{ color: cat.color }}>{cat.label}</p>
                    <p className="mt-0.5 break-words leading-snug text-navy">{n.text}</p>
                    {!n.revealed && (
                      <button
                        type="button"
                        onClick={() => {
                          if (confirmId === n.id) { onPublish([n.id]); setConfirmId(null); }
                          else setConfirmId(n.id);
                        }}
                        className={`mt-1.5 rounded-md px-2.5 py-1 text-xs font-bold transition-colors ${
                          confirmId === n.id
                            ? 'bg-teal text-navy hover:bg-teal-dark'
                            : 'bg-navy text-white hover:bg-navy-light'
                        }`}
                      >
                        {confirmId === n.id ? 'Visible par tous : confirmer' : 'Publier'}
                      </button>
                    )}
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

export default IdeaboxComposerPanel;
