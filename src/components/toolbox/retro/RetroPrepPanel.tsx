import React, { useState } from 'react';
import { Eye, EyeOff, NotebookPen, X } from 'lucide-react';
import type { BoardNote } from '@/components/toolbox/shared/boardNotes';
import { RETRO_CATEGORIES, getRetroCategory, type RetroCategoryKey } from './retroLogic';
import { RetroPanelCollapse } from './RetroPanelTab';

interface RetroPrepPanelProps {
  myName: string;
  myColor: string;
  myNotes: BoardNote[];
  onAddNote: (category: RetroCategoryKey, text: string) => void;
  onDeleteNote: (id: string) => void;
  onRevealNext: () => void;
  onRevealAll: () => void;
  onUnreveal: () => void;
  onCollapse: () => void;
}

/**
 * Panneau latéral « Ma préparation » : composer une note en privé,
 * gérer sa file d'attente puis révéler ses notes une à une (ou toutes).
 */
export const RetroPrepPanel: React.FC<RetroPrepPanelProps> = ({
  myName, myColor, myNotes, onAddNote, onDeleteNote, onRevealNext, onRevealAll, onUnreveal, onCollapse,
}) => {
  const [category, setCategory] = useState<RetroCategoryKey>('plus');
  const [text, setText] = useState('');
  const pending = myNotes.filter((n) => !n.revealed);
  const revealedCount = myNotes.length - pending.length;

  const submit = () => {
    if (!text.trim()) return;
    onAddNote(category, text);
    setText('');
  };

  return (
    <aside className="flex w-[300px] shrink-0 flex-col overflow-hidden border-r border-line bg-white" aria-label="Ma préparation">
      <div className="border-b border-line px-4 py-3">
        <div className="flex items-center">
          <p className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-muted">
            <NotebookPen className="h-4 w-4" aria-hidden /> Ma préparation
          </p>
          <span className="ml-auto"><RetroPanelCollapse side="left" onClose={onCollapse} /></span>
        </div>
        <p className="mt-1 flex items-center gap-2 text-sm font-bold text-navy">
          <span className="h-2.5 w-2.5 rounded-full" style={{ background: myColor }} aria-hidden />
          {myName}
        </p>
      </div>

      <div className="flex flex-1 flex-col gap-4 overflow-y-auto p-4">
        {/* Composer */}
        <div>
          <p className="mb-1.5 text-xs font-bold uppercase tracking-wide text-muted">Nouvelle note</p>
          <div className="mb-2 grid grid-cols-2 gap-1.5" role="radiogroup" aria-label="Quadrant de la note">
            {RETRO_CATEGORIES.map((cat) => {
              const selected = cat.key === category;
              return (
                <button
                  key={cat.key}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  onClick={() => setCategory(cat.key)}
                  className="rounded-lg border px-2 py-1.5 text-left text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal"
                  style={selected
                    ? { borderColor: cat.color, background: cat.bg, color: cat.color }
                    : { borderColor: 'var(--tw-border, #e2e8f0)', color: '#64748b' }}
                >
                  <span className="mr-1 font-bold">{cat.symbol}</span>
                  {cat.label}
                </button>
              );
            })}
          </div>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) submit(); }}
            placeholder={getRetroCategory(category).placeholder}
            rows={3}
            maxLength={280}
            className="w-full resize-none rounded-lg border border-line p-2.5 text-sm text-navy outline-none placeholder:text-muted/60 focus:border-teal"
          />
          <button
            type="button"
            onClick={submit}
            disabled={!text.trim()}
            className="mt-1.5 w-full rounded-lg bg-navy px-3 py-2 text-sm font-bold text-white transition-colors hover:bg-navy-light disabled:cursor-not-allowed disabled:opacity-40"
          >
            Préparer
          </button>
        </div>

        {/* File d'attente */}
        {myNotes.length > 0 && (
          <div>
            <p className="mb-1.5 text-xs font-bold uppercase tracking-wide text-muted">
              Mes notes ({revealedCount}/{myNotes.length} révélées)
            </p>
            <ul className="flex flex-col gap-1.5">
              {myNotes.map((n) => {
                const cat = getRetroCategory(n.category);
                return (
                  <li
                    key={n.id}
                    className={`rounded-lg border-l-4 bg-surface p-2 text-sm text-navy ${n.revealed ? 'opacity-55' : ''}`}
                    style={{ borderLeftColor: cat.color }}
                  >
                    <div className="flex items-start justify-between gap-1">
                      <span className="text-[11px] font-bold" style={{ color: cat.color }}>{cat.label}</span>
                      {!n.revealed && (
                        <button
                          type="button"
                          onClick={() => onDeleteNote(n.id)}
                          aria-label="Supprimer la note"
                          className="rounded p-0.5 text-muted hover:text-danger-600"
                        >
                          <X className="h-3.5 w-3.5" aria-hidden />
                        </button>
                      )}
                    </div>
                    <p className="mt-0.5 leading-snug">{n.text}</p>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </div>

      {/* Zone de révélation */}
      <div className="border-t border-line p-4">
        <p className="mb-2 text-center text-xs text-muted" aria-live="polite">
          {myNotes.length === 0 ? 'Aucune note préparée' : `${revealedCount} / ${myNotes.length} révélée${revealedCount > 1 ? 's' : ''}`}
        </p>
        <div className="flex gap-1.5">
          <button
            type="button"
            onClick={onRevealNext}
            disabled={pending.length === 0}
            className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-teal px-3 py-2 text-sm font-bold text-navy transition-colors hover:bg-teal-dark disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Eye className="h-4 w-4" aria-hidden /> Révéler suivante
          </button>
          <button
            type="button"
            onClick={onRevealAll}
            disabled={pending.length === 0}
            className="rounded-lg border border-line px-3 py-2 text-sm font-semibold text-navy transition-colors hover:bg-surface disabled:cursor-not-allowed disabled:opacity-40"
          >
            Tout
          </button>
        </div>
        {revealedCount > 0 && (
          <button
            type="button"
            onClick={onUnreveal}
            className="mt-1.5 inline-flex w-full items-center justify-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold text-muted transition-colors hover:text-navy"
          >
            <EyeOff className="h-3.5 w-3.5" aria-hidden /> Annuler ma révélation
          </button>
        )}
      </div>
    </aside>
  );
};

export default RetroPrepPanel;
