import React from 'react';
import { RotateCcw } from 'lucide-react';
import { PRESET_CASES } from '@/lib/productFit/presets';
import type { PresetCase } from '@/lib/productFit/types';

/*
 * Exemples prêts à charger. Même échelle de texte que la page Diagnostic
 * (14px pour le libellé, 12px pour les pastilles).
 */

interface PresetSelectorProps {
  selectedPresetId: string | null;
  onSelectPreset: (preset: PresetCase) => void;
  onResetToEmpty: () => void;
}

export const PresetSelector: React.FC<PresetSelectorProps> = ({
  selectedPresetId,
  onSelectPreset,
  onResetToEmpty,
}) => (
  <div className="flex flex-wrap items-center gap-2">
    <span className="text-sm font-semibold text-ink mr-1">Voir un exemple&nbsp;:</span>

    {PRESET_CASES.map((preset) => {
      const choisi = selectedPresetId === preset.id;
      return (
        <button
          key={preset.id}
          type="button"
          onClick={() => onSelectPreset(preset)}
          aria-pressed={choisi}
          // Le nom annonce d'abord le texte visible : un lecteur d'écran doit
          // dire ce que l'utilisateur lit, la description venant ensuite.
          aria-label={`${preset.name} — ${preset.tagline}`}
          title={preset.tagline}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
            choisi ? 'bg-navy text-white' : 'bg-surface text-navy hover:bg-line'
          }`}
        >
          {preset.name}
        </button>
      );
    })}

    <button
      type="button"
      onClick={onResetToEmpty}
      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-muted hover:text-navy hover:bg-surface transition-colors"
    >
      <RotateCcw className="h-3.5 w-3.5" aria-hidden />
      Repartir de zéro
    </button>
  </div>
);

export default PresetSelector;
