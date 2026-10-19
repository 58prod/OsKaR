import React, { useEffect, useRef, useState } from 'react';
import { Pencil, X } from 'lucide-react';
import { RETRO_CATEGORIES, getRetroCategory, type RetroCategoryKey, type RetroNote } from './retroLogic';

interface RetroEditNoteProps {
  note: RetroNote;
  onSave: (text: string, category: RetroCategoryKey) => void;
  onClose: () => void;
}

/**
 * Modifier une de ses notes. Tant qu'elle n'est pas révélée, on peut aussi
 * changer de quadrant ; ensuite, on la déplace en la glissant sur le tableau.
 */
export const RetroEditNote: React.FC<RetroEditNoteProps> = ({ note, onSave, onClose }) => {
  const [text, setText] = useState(note.text);
  const [category, setCategory] = useState<RetroCategoryKey>(getRetroCategory(note.category).key);
  const field = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const el = field.current;
    if (el) { el.focus(); el.setSelectionRange(el.value.length, el.value.length); }
  }, []);

  useEffect(() => {
    // En capture : Échap ferme cette fenêtre seulement, pas le tas ouvert dessous.
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      e.stopPropagation();
      onClose();
    };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, [onClose]);

  const save = () => {
    if (!text.trim()) return;
    onSave(text, category);
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="retro-edit-title"
      className="fixed inset-0 z-[210] flex items-center justify-center bg-navy/60 p-6"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-card-hover">
        <div className="flex items-center gap-2">
          <Pencil className="h-4 w-4 text-navy" aria-hidden />
          <h2 id="retro-edit-title" className="text-base font-bold text-navy">Modifier la note</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer"
            className="ml-auto rounded-md p-1 text-muted transition-colors hover:bg-surface hover:text-navy"
          >
            <X className="h-4 w-4" aria-hidden />
          </button>
        </div>

        {!note.revealed && (
          <div className="mt-4 grid grid-cols-2 gap-1.5" role="radiogroup" aria-label="Quadrant de la note">
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
                    : { borderColor: '#e2e8f0', color: '#64748b' }}
                >
                  <span className="mr-1 font-bold">{cat.symbol}</span>
                  {cat.label}
                </button>
              );
            })}
          </div>
        )}

        <textarea
          ref={field}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) save(); }}
          rows={4}
          maxLength={280}
          aria-label="Texte de la note"
          className="mt-4 w-full resize-none rounded-lg border border-line p-2.5 text-sm text-navy outline-none focus:border-teal"
        />
        {note.revealed && (
          <p className="mt-1 text-xs text-muted">La note est déjà révélée : tout le monde verra la modification.</p>
        )}

        <div className="mt-4 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-line px-3 py-2 text-sm font-semibold text-navy transition-colors hover:bg-surface"
          >
            Annuler
          </button>
          <button
            type="button"
            onClick={save}
            disabled={!text.trim()}
            className="rounded-lg bg-navy px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-navy-light disabled:cursor-not-allowed disabled:opacity-40"
          >
            Enregistrer
          </button>
        </div>
      </div>
    </div>
  );
};

export default RetroEditNote;
