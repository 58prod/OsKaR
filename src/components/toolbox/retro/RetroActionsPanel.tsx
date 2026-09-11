import React, { useRef } from 'react';
import {
  CalendarDays, CheckCircle2, ClipboardList, Circle, FileDown, FileUp, Trash2, UserRound,
} from 'lucide-react';
import { useToast } from '@/hooks/useToast';
import type { BoardNote } from '@/components/toolbox/shared/boardNotes';
import {
  formatRetroDate, todayISO, type RetroActionMeta, type RetroPastAction,
} from './retroLogic';
import { RetroPanelCollapse } from './RetroPanelTab';

interface RetroActionsPanelProps {
  actions: BoardNote[];
  actionMeta: Record<string, RetroActionMeta>;
  pastActions: RetroPastAction[];
  isFacilitator: boolean;
  onMetaChange: (id: string, patch: Partial<RetroActionMeta>) => void;
  onPastChange: (id: string, patch: Partial<RetroActionMeta>) => void;
  onPastDelete: (id: string) => void;
  onExport: () => void;
  /** Ajoute les actions d'un fichier CSV ; renvoie le nombre d'actions ajoutées. */
  onImport: (csv: string) => number;
  onCollapse: () => void;
}

const EMPTY_META: RetroActionMeta = { resp: '', deadline: '', done: false };

/**
 * Panneau « Actions à démarrer » : les notes révélées du quadrant ★
 * deviennent des actions avec responsable, échéance et statut. Tout le monde
 * voit ce que l'animateur renseigne ; les actions des rétros précédentes
 * restent en dessous pour le suivi.
 */
export const RetroActionsPanel: React.FC<RetroActionsPanelProps> = ({
  actions, actionMeta, pastActions, isFacilitator,
  onMetaChange, onPastChange, onPastDelete, onExport, onImport, onCollapse,
}) => {
  const toast = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const activeCount = actions.filter((a) => !actionMeta[a.id]?.done).length
    + pastActions.filter((a) => !a.done).length;

  // Rétros précédentes, de la plus récente à la plus ancienne.
  const pastDates = Array.from(new Set(pastActions.map((a) => a.retroDate)))
    .sort((a, b) => b.localeCompare(a));

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    const added = onImport(await file.text());
    if (added > 0) toast.success(`${added} action${added > 1 ? 's' : ''} importée${added > 1 ? 's' : ''}`);
    else toast.info('Aucune nouvelle action dans ce fichier.');
  };

  return (
    <aside className="flex w-[300px] shrink-0 flex-col overflow-hidden border-l border-line bg-white" aria-label="Actions à démarrer">
      <div className="flex items-center gap-2 border-b border-line px-4 py-3">
        <ClipboardList className="h-4 w-4 text-[#6366f1]" aria-hidden />
        <h3 className="text-sm font-bold text-navy">Actions à démarrer</h3>
        <span className="ml-auto text-xs font-semibold text-muted" aria-live="polite">
          {activeCount} active{activeCount > 1 ? 's' : ''}
        </span>
        <RetroPanelCollapse side="right" onClose={onCollapse} />
      </div>

      <div className="flex-1 overflow-y-auto p-3">
        <SectionTitle label="Cette rétrospective" count={actions.length} highlight />
        {actions.length === 0 ? (
          <p className="px-2 pb-3 text-center text-xs text-muted">
            Les notes révélées du quadrant « À démarrer » apparaîtront ici.
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {actions.map((a) => (
              <ActionCard
                key={a.id}
                text={a.text}
                authorName={a.authorName}
                authorColor={a.authorColor}
                meta={actionMeta[a.id] ?? EMPTY_META}
                isFacilitator={isFacilitator}
                onChange={(patch) => onMetaChange(a.id, patch)}
              />
            ))}
          </ul>
        )}

        {pastActions.length > 0 && (
          <div className="mt-5">
            <SectionTitle label="Suivi des rétros précédentes" count={pastActions.filter((a) => !a.done).length} />
            {pastDates.map((date) => {
              const group = pastActions
                .filter((a) => a.retroDate === date)
                .sort((a, b) => Number(a.done) - Number(b.done));
              return (
                <div key={date || 'sans-date'} className="mb-3">
                  <p className="my-2 flex items-center gap-2 text-[11px] font-semibold text-muted before:h-px before:flex-1 before:bg-line after:h-px after:flex-1 after:bg-line">
                    {date ? `Rétro du ${formatRetroDate(date)}` : 'Actions importées'}
                  </p>
                  <ul className="flex flex-col gap-2">
                    {group.map((a) => (
                      <ActionCard
                        key={a.id}
                        text={a.text}
                        authorName={a.authorName}
                        authorColor={a.authorColor}
                        meta={a}
                        isFacilitator={isFacilitator}
                        onChange={(patch) => onPastChange(a.id, patch)}
                        onDelete={() => onPastDelete(a.id)}
                      />
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="flex gap-2 border-t border-line p-3">
        <button
          type="button"
          onClick={onExport}
          disabled={actions.length + pastActions.length === 0}
          className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-md border border-line px-2 py-1.5 text-xs font-bold text-navy transition-colors hover:bg-surface disabled:cursor-not-allowed disabled:opacity-50"
        >
          <FileDown className="h-3.5 w-3.5" aria-hidden /> Exporter les actions
        </button>
        {isFacilitator && (
          <>
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-md border border-line px-2 py-1.5 text-xs font-bold text-navy transition-colors hover:bg-surface"
            >
              <FileUp className="h-3.5 w-3.5" aria-hidden /> Importer
            </button>
            <input
              ref={fileRef}
              type="file"
              accept=".csv,text/csv"
              onChange={handleFile}
              className="hidden"
              aria-label="Fichier d'actions à importer (CSV)"
            />
          </>
        )}
      </div>
    </aside>
  );
};

const SectionTitle: React.FC<{ label: string; count: number; highlight?: boolean }> = ({ label, count, highlight }) => (
  <p className="flex items-center gap-1.5 pb-2 text-[11px] font-bold uppercase tracking-wide text-muted">
    <span className="flex-1">{label}</span>
    <span
      className={`rounded-full px-1.5 py-px text-[10px] font-bold ${
        highlight ? 'bg-[#eef2ff] text-[#6366f1]' : 'bg-surface text-muted'
      }`}
    >
      {count}
    </span>
  </p>
);

/** Date courte « 3 oct. » à partir de « 2026-10-03 ». */
function shortDate(iso: string): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return iso;
  return new Date(`${iso}T12:00:00`).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
}

const ActionCard: React.FC<{
  text: string;
  authorName: string;
  authorColor: string;
  meta: RetroActionMeta;
  isFacilitator: boolean;
  onChange: (patch: Partial<RetroActionMeta>) => void;
  onDelete?: () => void;
}> = ({ text, authorName, authorColor, meta, isFacilitator, onChange, onDelete }) => {
  const late = !meta.done && !!meta.deadline && meta.deadline < todayISO();
  return (
    <li
      className={`rounded-lg border border-l-[3px] border-line p-2.5 ${meta.done ? 'opacity-55' : ''}`}
      style={{ borderLeftColor: meta.done ? '#22c55e' : '#6366f1' }}
    >
      <p className={`text-sm leading-snug text-navy ${meta.done ? 'line-through' : ''}`}>{text}</p>
      <p className="mt-1 flex items-center gap-1.5 text-[11px] font-semibold text-muted">
        {authorName && (
          <>
            <span className="h-2 w-2 rounded-full" style={{ background: authorColor }} aria-hidden />
            {authorName}
          </>
        )}
        {isFacilitator && onDelete && (
          <button
            type="button"
            onClick={onDelete}
            aria-label={`Supprimer l'action « ${text} »`}
            title="Supprimer du suivi"
            className="ml-auto rounded p-0.5 text-line transition-colors hover:text-danger-600"
          >
            <Trash2 className="h-3 w-3" aria-hidden />
          </button>
        )}
      </p>

      {isFacilitator ? (
        <div className="mt-2 flex flex-col gap-1.5">
          <div className="flex gap-1.5">
            <label className="min-w-0 flex-1">
              <span className="sr-only">Responsable</span>
              <input
                type="text"
                value={meta.resp}
                onChange={(e) => onChange({ resp: e.target.value })}
                placeholder="Responsable"
                className="w-full rounded-md border border-line px-2 py-1 text-xs text-navy outline-none focus:border-teal"
              />
            </label>
            <label>
              <span className="sr-only">Échéance</span>
              <input
                type="date"
                value={meta.deadline}
                onChange={(e) => onChange({ deadline: e.target.value })}
                className={`rounded-md border px-2 py-1 text-xs outline-none focus:border-teal ${
                  late ? 'border-danger-600 text-danger-600' : 'border-line text-navy'
                }`}
              />
            </label>
          </div>
          <button
            type="button"
            onClick={() => onChange({ done: !meta.done })}
            className={`inline-flex items-center justify-center gap-1.5 rounded-md px-2 py-1 text-xs font-bold transition-colors ${
              meta.done
                ? 'bg-teal-light text-teal-dark'
                : 'border border-line text-navy hover:bg-surface'
            }`}
          >
            {meta.done
              ? <><CheckCircle2 className="h-3.5 w-3.5" aria-hidden /> Fait</>
              : <><Circle className="h-3.5 w-3.5" aria-hidden /> Marquer fait</>}
          </button>
        </div>
      ) : (
        <div className="mt-2 flex flex-wrap items-center gap-1.5 text-[11px] font-semibold">
          <span className={`inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 ${meta.resp ? 'bg-surface text-navy' : 'text-muted'}`}>
            <UserRound className="h-3 w-3" aria-hidden />
            {meta.resp || 'Responsable à définir'}
          </span>
          {meta.deadline && (
            <span
              className={`inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 ${
                late ? 'bg-danger-50 text-danger-600' : 'bg-surface text-navy'
              }`}
            >
              <CalendarDays className="h-3 w-3" aria-hidden />
              {shortDate(meta.deadline)}{late && ' · en retard'}
            </span>
          )}
          {meta.done && (
            <span className="inline-flex items-center gap-1 rounded-md bg-teal-light px-1.5 py-0.5 text-teal-dark">
              <CheckCircle2 className="h-3 w-3" aria-hidden /> Fait
            </span>
          )}
        </div>
      )}
    </li>
  );
};

export default RetroActionsPanel;
