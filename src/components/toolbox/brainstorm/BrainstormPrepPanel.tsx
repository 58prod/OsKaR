import React, { useState } from 'react';
import { Eye, EyeOff, Heart, NotebookPen, Pencil, X } from 'lucide-react';
import type { BoardNote } from '@/components/toolbox/shared/boardNotes';
import {
  BRAINSTORM_ACCENT, BRAINSTORM_COLORS, BRAINSTORM_TEXT_MAX, getBrainstormColor, type BrainstormColorKey,
} from './brainstormLogic';

interface BrainstormPrepPanelProps {
  myName: string;
  myColor: string;
  myNotes: BoardNote[];
  onAddNote: (colorKey: BrainstormColorKey, text: string) => void;
  onDeleteNote: (id: string) => void;
  onRevealNext: () => void;
  onRevealAll: () => void;
  onUnreveal: () => void;
}

/**
 * Panneau latéral « Ma préparation » : composer une idée en privé (choix de
 * la couleur du post-it), la modifier tant qu'elle n'est pas révélée, puis
 * révéler ses idées une à une (ou toutes).
 */
export const BrainstormPrepPanel: React.FC<BrainstormPrepPanelProps> = ({
  myName, myColor, myNotes, onAddNote, onDeleteNote, onRevealNext, onRevealAll, onUnreveal,
}) => {
  const [colorKey, setColorKey] = useState<BrainstormColorKey>('cy');
  const [text, setText] = useState('');
  const pending = myNotes.filter((n) => !n.revealed);
  const revealedCount = myNotes.length - pending.length;

  const submit = () => {
    if (!text.trim()) return;
    onAddNote(colorKey, text);
    setText('');
  };

  /** Remet une idée préparée dans la zone de saisie pour la retravailler. */
  const edit = (n: BoardNote) => {
    setText(n.text);
    setColorKey(getBrainstormColor(n.category).key);
    onDeleteNote(n.id);
  };

  return (
    <aside className="relative flex w-[300px] shrink-0 flex-col overflow-hidden border-r border-line bg-white" aria-label="Ma préparation">
      <div className="border-b border-line px-4 py-3">
        <p className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-muted">
          <NotebookPen className="h-4 w-4" style={{ color: BRAINSTORM_ACCENT }} aria-hidden /> Ma préparation
        </p>
        <p className="mt-1 flex items-center gap-2 text-sm font-bold text-navy">
          <span className="h-2.5 w-2.5 rounded-full" style={{ background: myColor }} aria-hidden />
          {myName}
        </p>
      </div>

      <div className="flex flex-1 flex-col gap-4 overflow-y-auto p-4">
        {/* Composer */}
        <div>
          <label htmlFor="brainstorm-text" className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-muted">Nouvelle idée</label>
          <div className="mb-2 flex items-center gap-1.5" role="radiogroup" aria-label="Couleur du post-it">
            {BRAINSTORM_COLORS.map((c) => {
              const selected = c.key === colorKey;
              return (
                <button
                  key={c.key}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  aria-label={`Post-it ${c.label.toLowerCase()}`}
                  onClick={() => setColorKey(c.key)}
                  className={`h-6 w-6 rounded-full transition-transform focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal ${
                    selected ? 'scale-110 ring-2 ring-navy ring-offset-1' : 'hover:scale-110'
                  }`}
                  style={{ background: c.dot }}
                />
              );
            })}
          </div>
          <textarea
            id="brainstorm-text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); submit(); } }}
            placeholder="Votre idée…"
            rows={3}
            maxLength={BRAINSTORM_TEXT_MAX}
            className="w-full resize-none rounded-lg border border-line p-2.5 text-sm text-navy outline-none placeholder:text-muted/60 focus:border-teal"
            style={{ background: getBrainstormColor(colorKey).bg }}
          />
          <p className="text-right text-[11px] text-muted">{text.length} / {BRAINSTORM_TEXT_MAX}</p>
          <button
            type="button"
            onClick={submit}
            disabled={!text.trim()}
            className="mt-1 w-full rounded-lg bg-navy px-3 py-2 text-sm font-bold text-white transition-colors hover:bg-navy-light disabled:cursor-not-allowed disabled:opacity-40"
          >
            Préparer
          </button>
          <p className="mt-1 text-center text-[11px] text-muted">Ctrl+Entrée pour préparer · personne ne voit vos idées avant révélation</p>
        </div>

        {/* File d'attente */}
        {myNotes.length > 0 && (
          <div>
            <p className="mb-1.5 text-xs font-bold uppercase tracking-wide text-muted">
              Mes idées ({revealedCount}/{myNotes.length} révélée{revealedCount > 1 ? 's' : ''})
            </p>
            <ul className="flex flex-col gap-1.5">
              {myNotes.map((n) => {
                const c = getBrainstormColor(n.category);
                return (
                  <li
                    key={n.id}
                    className={`rounded-lg border-l-4 p-2 text-sm text-navy ${n.revealed ? 'opacity-60' : ''}`}
                    style={{ borderLeftColor: c.dot, background: c.bg }}
                  >
                    <div className="flex items-start justify-between gap-1">
                      <p className="break-words leading-snug">{n.text}</p>
                      {n.revealed ? (
                        <span className="inline-flex shrink-0 items-center gap-0.5 text-[11px] font-bold" style={{ color: '#ec4899' }}>
                          <Heart className="h-3 w-3" style={{ fill: '#ec4899' }} aria-hidden /> {n.likedBy.length}
                        </span>
                      ) : (
                        <span className="flex shrink-0 items-center gap-0.5">
                          <button
                            type="button"
                            onClick={() => edit(n)}
                            aria-label="Modifier l'idée"
                            title="Modifier"
                            className="rounded p-0.5 text-muted hover:text-navy"
                          >
                            <Pencil className="h-3.5 w-3.5" aria-hidden />
                          </button>
                          <button
                            type="button"
                            onClick={() => onDeleteNote(n.id)}
                            aria-label="Supprimer l'idée"
                            title="Supprimer"
                            className="rounded p-0.5 text-muted hover:text-danger-600"
                          >
                            <X className="h-3.5 w-3.5" aria-hidden />
                          </button>
                        </span>
                      )}
                    </div>
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
          {myNotes.length === 0 ? 'Aucune idée préparée' : `${pending.length} idée${pending.length > 1 ? 's' : ''} à révéler`}
        </p>
        <div className="flex gap-1.5">
          <button
            type="button"
            onClick={onRevealNext}
            disabled={pending.length === 0}
            className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-sm font-bold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
            style={{ background: BRAINSTORM_ACCENT }}
          >
            <Eye className="h-4 w-4" aria-hidden /> Révéler la suivante
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
            <EyeOff className="h-3.5 w-3.5" aria-hidden /> Reprendre mes idées révélées
          </button>
        )}
      </div>
    </aside>
  );
};

export default BrainstormPrepPanel;
