import React, { useState } from 'react';
import { Check, ChevronDown, Eye, EyeOff, GripVertical, NotebookPen, Pencil, X } from 'lucide-react';
import { ChoixCouleur } from '@/components/toolbox/ChoixCouleur';
import { RETRO_CATEGORIES, getRetroCategory, type RetroCategoryKey, type RetroNote } from './retroLogic';
import { RetroPanelCollapse } from './RetroPanelTab';

interface RetroPrepPanelProps {
  myName: string;
  myColor: string;
  /** Couleurs déjà prises par les autres participants en ligne. */
  takenColors: { color: string; name: string }[];
  onColorChange: (color: string) => void;
  /** Ses notes dans l'ordre de sa file : révélées d'abord, puis à révéler. */
  myNotes: RetroNote[];
  onAddNote: (category: RetroCategoryKey, text: string) => void;
  onDeleteNote: (id: string) => void;
  onEditNote: (id: string) => void;
  onMoveInQueue: (id: string, dir: -1 | 1) => void;
  onPlaceInQueue: (id: string, targetId: string, side: 'before' | 'after') => void;
  onRevealOne: (id: string) => void;
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
  myName, myColor, takenColors, onColorChange, myNotes, onAddNote, onDeleteNote, onEditNote,
  onMoveInQueue, onPlaceInQueue, onRevealOne, onRevealNext, onRevealAll, onUnreveal, onCollapse,
}) => {
  const [category, setCategory] = useState<RetroCategoryKey>('plus');
  const [text, setText] = useState('');
  const [colorsOpen, setColorsOpen] = useState(false);
  // Glisser-déposer dans la file : note tenue, et repère avant/après la note survolée.
  const [dragId, setDragId] = useState<string | null>(null);
  const [over, setOver] = useState<{ id: string; side: 'before' | 'after' } | null>(null);
  const sideOf = (e: React.DragEvent): 'before' | 'after' => {
    const r = (e.currentTarget as HTMLElement).getBoundingClientRect();
    return e.clientY < r.top + r.height / 2 ? 'before' : 'after';
  };
  const endDrag = () => { setDragId(null); setOver(null); };
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
        <div className="mt-1 flex items-center gap-2 text-sm font-bold text-navy">
          <button
            type="button"
            onClick={() => setColorsOpen((o) => !o)}
            aria-expanded={colorsOpen}
            title="Changer ma couleur"
            className="inline-flex items-center gap-1 rounded-full py-0.5 pl-0.5 pr-1 transition-colors hover:bg-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal"
          >
            <span className="h-3.5 w-3.5 rounded-full" style={{ background: myColor }} aria-hidden />
            <ChevronDown className="h-3 w-3 text-muted" aria-hidden />
            <span className="sr-only">Changer ma couleur</span>
          </button>
          {myName}
        </div>
        {colorsOpen && (
          <div className="mt-2 rounded-lg border border-line bg-surface p-2">
            <ChoixCouleur
              value={myColor}
              onChange={(c) => { onColorChange(c); setColorsOpen(false); }}
              taken={takenColors}
              label="Ma couleur"
              offsetClass="ring-offset-surface"
            />
            <p className="mt-1.5 text-[11px] text-muted">Les couleurs pâles sont déjà prises.</p>
          </div>
        )}
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
                const pendingIndex = pending.indexOf(n);
                const isNext = pendingIndex === 0;
                return (
                  <li
                    key={n.id}
                    draggable={!n.revealed && pending.length > 1}
                    onDragStart={(e) => { e.dataTransfer.effectAllowed = 'move'; setDragId(n.id); }}
                    onDragEnd={endDrag}
                    onDragOver={(e) => {
                      if (!dragId || n.revealed) return;
                      e.preventDefault();
                      const side = sideOf(e);
                      setOver((o) => (o?.id === n.id && o.side === side ? o : { id: n.id, side }));
                    }}
                    onDragLeave={() => setOver((o) => (o?.id === n.id ? null : o))}
                    onDrop={(e) => {
                      e.preventDefault();
                      if (dragId && !n.revealed) onPlaceInQueue(dragId, n.id, sideOf(e));
                      endDrag();
                    }}
                    className={`relative rounded-lg border-l-4 p-2 text-sm text-navy ${
                      n.revealed ? 'bg-surface/60' : 'cursor-grab bg-surface active:cursor-grabbing'
                    } ${isNext ? 'ring-2 ring-teal' : ''} ${dragId === n.id ? 'opacity-40' : ''}`}
                    style={{ borderLeftColor: cat.color }}
                  >
                    {over?.id === n.id && over.id !== dragId && (
                      <span
                        className={`pointer-events-none absolute inset-x-0 h-[3px] rounded-full bg-teal ${
                          over.side === 'before' ? '-top-[4px]' : '-bottom-[4px]'
                        }`}
                        aria-hidden
                      />
                    )}
                    <div className="flex items-center gap-1">
                      <span className="text-[11px] font-bold" style={{ color: cat.color }}>{cat.label}</span>
                      {n.revealed && (
                        <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-muted">
                          <Check className="h-3 w-3" aria-hidden /> révélée
                        </span>
                      )}
                      {isNext && <span className="text-[10px] font-bold text-[#047857]">Prochaine</span>}
                    </div>
                    <p className={`mt-0.5 leading-snug ${n.revealed ? 'text-muted line-through decoration-1' : ''}`}>{n.text}</p>
                    <div className="mt-1 flex items-center justify-end gap-0.5">
                      {!n.revealed && pending.length > 1 && (
                        <span
                          role="button"
                          tabIndex={0}
                          aria-label="Glisser pour changer l'ordre (ou flèches haut et bas)"
                          title="Glisser pour changer l'ordre de révélation"
                          onKeyDown={(e) => {
                            if (e.key === 'ArrowUp') { e.preventDefault(); onMoveInQueue(n.id, -1); }
                            if (e.key === 'ArrowDown') { e.preventDefault(); onMoveInQueue(n.id, 1); }
                          }}
                          className="mr-auto cursor-grab rounded p-0.5 text-muted hover:text-navy focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal"
                        >
                          <GripVertical className="h-3.5 w-3.5" aria-hidden />
                        </span>
                      )}
                      {!n.revealed && (
                        <IconButton label="Révéler cette note" onClick={() => onRevealOne(n.id)}>
                          <Eye className="h-3.5 w-3.5" aria-hidden />
                        </IconButton>
                      )}
                      <IconButton label="Modifier la note" onClick={() => onEditNote(n.id)}>
                        <Pencil className="h-3.5 w-3.5" aria-hidden />
                      </IconButton>
                      {!n.revealed && (
                        <IconButton label="Supprimer la note" onClick={() => onDeleteNote(n.id)} danger>
                          <X className="h-3.5 w-3.5" aria-hidden />
                        </IconButton>
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

const IconButton: React.FC<{
  label: string;
  onClick: () => void;
  disabled?: boolean;
  danger?: boolean;
  children: React.ReactNode;
}> = ({ label, onClick, disabled, danger, children }) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    aria-label={label}
    title={label}
    className={`rounded p-0.5 text-muted transition-colors disabled:cursor-default disabled:opacity-25 ${
      danger ? 'hover:text-danger-600' : 'hover:text-navy'
    }`}
  >
    {children}
  </button>
);

export default RetroPrepPanel;
