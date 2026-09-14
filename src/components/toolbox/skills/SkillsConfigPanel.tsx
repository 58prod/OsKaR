import React, { useEffect, useState } from 'react';
import { ListChecks, Plus, X } from 'lucide-react';
import { MAX_SKILLS, MIN_SKILLS, SKILLS_ACCENT, SKILL_NAME_MAX, type Skill } from './skillsLogic';

interface SkillsConfigPanelProps {
  skills: Skill[];
  isFacilitator: boolean;
  onAdd: (name: string) => void;
  onRename: (id: string, name: string) => void;
  onDelete: (id: string) => void;
}

/**
 * Panneau latéral « Compétences évaluées » : liste partagée des compétences.
 * L'animateur peut renommer, supprimer (min. 3, avec confirmation, car les
 * notes données sont perdues) et ajouter (max. 10) ; les autres
 * participants voient la liste en lecture seule.
 */
export const SkillsConfigPanel: React.FC<SkillsConfigPanelProps> = ({
  skills, isFacilitator, onAdd, onRename, onDelete,
}) => {
  const [newName, setNewName] = useState('');
  const [confirmId, setConfirmId] = useState<string | null>(null);

  useEffect(() => {
    if (!confirmId) return;
    const t = setTimeout(() => setConfirmId(null), 4000);
    return () => clearTimeout(t);
  }, [confirmId]);

  const submit = () => {
    if (!newName.trim()) return;
    onAdd(newName);
    setNewName('');
  };

  return (
    <aside className="relative flex w-[260px] shrink-0 flex-col overflow-hidden border-r border-line bg-white" aria-label="Compétences évaluées">
      <div className="border-b border-line px-4 py-3">
        <p className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-muted">
          <ListChecks className="h-4 w-4" style={{ color: SKILLS_ACCENT }} aria-hidden /> Compétences évaluées
        </p>
        <p className="mt-1 text-xs text-muted">
          {isFacilitator
            ? 'Modifiez la liste avant que chacun se note.'
            : "Liste définie par l'animateur."}
        </p>
      </div>

      <ul className="flex flex-1 flex-col gap-1.5 overflow-y-auto p-3">
        {skills.map((s, idx) => (
          <li key={s.id} className="flex items-center gap-1.5 rounded-lg border border-line bg-surface px-2 py-1.5">
            <span className="w-4 shrink-0 text-center text-[11px] font-bold text-muted" aria-hidden>{idx + 1}</span>
            {isFacilitator ? (
              <input
                // La clé suit le nom : un renommage reçu d'un autre écran remplace la saisie.
                key={s.name}
                type="text"
                defaultValue={s.name}
                maxLength={SKILL_NAME_MAX}
                aria-label={`Renommer « ${s.name} »`}
                onBlur={(e) => { if (e.target.value.trim() && e.target.value !== s.name) onRename(s.id, e.target.value); }}
                onKeyDown={(e) => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); }}
                className="min-w-0 flex-1 bg-transparent text-sm font-semibold text-navy outline-none focus:text-teal-dark"
              />
            ) : (
              <span className="min-w-0 flex-1 truncate text-sm font-semibold text-navy">{s.name}</span>
            )}
            {isFacilitator && skills.length > MIN_SKILLS && (
              confirmId === s.id ? (
                <button
                  type="button"
                  onClick={() => { onDelete(s.id); setConfirmId(null); }}
                  className="shrink-0 rounded bg-danger-600 px-1.5 py-0.5 text-[10px] font-bold text-white"
                >
                  Supprimer ?
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setConfirmId(s.id)}
                  aria-label={`Supprimer « ${s.name} »`}
                  title="Supprimer (les notes données sur cette compétence seront effacées)"
                  className="rounded p-0.5 text-muted transition-colors hover:text-danger-600"
                >
                  <X className="h-3.5 w-3.5" aria-hidden />
                </button>
              )
            )}
          </li>
        ))}
      </ul>

      {isFacilitator && (
        <div className="border-t border-line p-3">
          {skills.length >= MAX_SKILLS ? (
            <p className="text-center text-xs text-muted">Maximum de {MAX_SKILLS} compétences atteint.</p>
          ) : (
            <div className="flex gap-1.5">
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') submit(); }}
                placeholder="Ajouter une compétence…"
                maxLength={SKILL_NAME_MAX}
                className="min-w-0 flex-1 rounded-lg border border-line px-2.5 py-1.5 text-sm text-navy outline-none placeholder:text-muted/60 focus:border-teal"
              />
              <button
                type="button"
                onClick={submit}
                disabled={!newName.trim()}
                aria-label="Ajouter la compétence"
                className="rounded-lg bg-navy px-2.5 text-white transition-colors hover:bg-navy-light disabled:cursor-not-allowed disabled:opacity-40"
              >
                <Plus className="h-4 w-4" aria-hidden />
              </button>
            </div>
          )}
        </div>
      )}
    </aside>
  );
};

export default SkillsConfigPanel;
