import React from 'react';
import { Sparkles, RotateCcw } from 'lucide-react';
import { PRESET_CASES } from '@/lib/productFit/presets';
import type { PresetCase } from '@/lib/productFit/types';

interface PresetSelectorProps {
  selectedPresetId: string | null;
  onSelectPreset: (preset: PresetCase) => void;
  onResetToEmpty: () => void;
}

export const PresetSelector: React.FC<PresetSelectorProps> = ({
  selectedPresetId,
  onSelectPreset,
  onResetToEmpty,
}) => {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 bg-white px-4 py-2.5 rounded-2xl border border-line shadow-xs">
      <div className="flex flex-wrap items-center gap-2">
        <span className="flex items-center gap-1.5 text-xs font-bold text-navy mr-1">
          <Sparkles className="h-3.5 w-3.5 text-teal-dark" />
          Exemples :
        </span>

        {PRESET_CASES.map((preset) => {
          const isSelected = selectedPresetId === preset.id;
          return (
            <button
              key={preset.id}
              type="button"
              onClick={() => onSelectPreset(preset)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
                isSelected
                  ? 'bg-navy text-teal font-bold shadow-xs'
                  : 'bg-surface text-navy/70 hover:bg-surface-hover hover:text-navy'
              }`}
            >
              <span>{preset.name}</span>
            </button>
          );
        })}
      </div>

      <button
        type="button"
        onClick={onResetToEmpty}
        className="inline-flex items-center gap-1.5 text-xs font-medium text-muted hover:text-navy px-2.5 py-1 rounded-lg hover:bg-surface transition-colors"
      >
        <RotateCcw className="h-3.5 w-3.5" />
        Vierge
      </button>
    </div>
  );
};
