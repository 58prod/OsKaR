import React, { useState } from 'react';
import {
  Flame,
  Clock,
  Repeat,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import type { PersonaEvaluation } from '@/lib/productFit/types';

interface PersonaFormCardProps {
  index: number;
  persona: PersonaEvaluation;
  isPriority: boolean;
  onChange: (updated: PersonaEvaluation) => void;
}

export const PersonaFormCard: React.FC<PersonaFormCardProps> = ({
  index,
  persona,
  isPriority,
  onChange,
}) => {
  const [showContext, setShowContext] = useState(false);

  const rawScore =
    (persona.problemIntensity || 1) * (persona.urgency || 1) * (persona.frequency || 1);
  const scoreOn100 = Math.round((rawScore / 1000) * 1000) / 10;
  const scoreOn10 = Math.round((scoreOn100 / 10) * 10) / 10;

  const updateField = <K extends keyof PersonaEvaluation>(
    field: K,
    value: PersonaEvaluation[K]
  ) => {
    onChange({ ...persona, [field]: value });
  };

  return (
    <div
      className={`bg-white rounded-2xl border transition-all duration-200 shadow-xs overflow-hidden ${
        isPriority
          ? 'border-teal ring-2 ring-teal/30'
          : 'border-line hover:border-muted/50'
      }`}
    >
      {/* En-tête compact */}
      <div
        className={`px-4 py-2.5 border-b flex items-center justify-between gap-2 ${
          isPriority
            ? 'bg-gradient-to-r from-teal-light/50 to-surface border-teal/30'
            : 'bg-surface/50 border-line'
        }`}
      >
        <div className="flex items-center gap-2 min-w-0">
          <span
            className={`w-6 h-6 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 ${
              isPriority ? 'bg-teal text-navy-dark font-extrabold' : 'bg-navy/10 text-navy'
            }`}
          >
            #{index + 1}
          </span>
          <span className="text-xs font-bold text-navy truncate">
            {persona.name || `Persona ${index + 1}`}
          </span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {isPriority && (
            <span className="text-[10px] font-extrabold bg-teal text-navy-dark px-2 py-0.5 rounded-full">
              🎯 Cible n°1
            </span>
          )}
          <span className="text-xs font-black text-navy bg-white px-2 py-0.5 rounded border border-line">
            {scoreOn10}/10
          </span>
        </div>
      </div>

      <div className="p-4 space-y-3.5">
        {/* Identité express */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <input
            type="text"
            value={persona.name}
            onChange={(e) => updateField('name', e.target.value)}
            placeholder="Nom (ex: Claire)"
            className="w-full text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-line focus:ring-1 focus:ring-teal focus:border-teal transition-all bg-white"
          />
          <input
            type="text"
            value={persona.role}
            onChange={(e) => updateField('role', e.target.value)}
            placeholder="Rôle / Situation"
            className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-line focus:ring-1 focus:ring-teal focus:border-teal transition-all bg-white"
          />
        </div>

        {/* Sliders P x U x F compacts */}
        <div className="space-y-2.5 bg-surface/40 p-3 rounded-xl border border-line/60">
          {/* Problème */}
          <div>
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="font-semibold text-navy flex items-center gap-1 text-[11.5px]">
                <Flame className="h-3.5 w-3.5 text-red-500" />
                Intensité du Problème (P)
              </span>
              <span className="font-bold text-red-600 bg-red-50 px-1.5 py-0.2 rounded border border-red-100 text-[11px]">
                {persona.problemIntensity}/10
              </span>
            </div>
            <input
              type="range"
              min="1"
              max="10"
              value={persona.problemIntensity}
              onChange={(e) => updateField('problemIntensity', Number(e.target.value))}
              className="w-full accent-red-500 h-1 bg-gray-200 rounded cursor-pointer"
            />
            <div className="flex justify-between text-[9px] text-muted mt-0.5">
              <span>Faible (1)</span>
              <span>Bloquant (10)</span>
            </div>
          </div>

          {/* Urgence */}
          <div>
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="font-semibold text-navy flex items-center gap-1 text-[11.5px]">
                <Clock className="h-3.5 w-3.5 text-amber-500" />
                Degré d'Urgence (U)
              </span>
              <span className="font-bold text-amber-700 bg-amber-50 px-1.5 py-0.2 rounded border border-amber-100 text-[11px]">
                {persona.urgency}/10
              </span>
            </div>
            <input
              type="range"
              min="1"
              max="10"
              value={persona.urgency}
              onChange={(e) => updateField('urgency', Number(e.target.value))}
              className="w-full accent-amber-500 h-1 bg-gray-200 rounded cursor-pointer"
            />
            <div className="flex justify-between text-[9px] text-muted mt-0.5">
              <span>Peut attendre (1)</span>
              <span>Immédiat (10)</span>
            </div>
          </div>

          {/* Fréquence */}
          <div>
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="font-semibold text-navy flex items-center gap-1 text-[11.5px]">
                <Repeat className="h-3.5 w-3.5 text-blue-500" />
                Fréquence (F)
              </span>
              <span className="font-bold text-blue-700 bg-blue-50 px-1.5 py-0.2 rounded border border-blue-100 text-[11px]">
                {persona.frequency}/10
              </span>
            </div>
            <input
              type="range"
              min="1"
              max="10"
              value={persona.frequency}
              onChange={(e) => updateField('frequency', Number(e.target.value))}
              className="w-full accent-blue-500 h-1 bg-gray-200 rounded cursor-pointer"
            />
            <div className="flex justify-between text-[9px] text-muted mt-0.5">
              <span>Rare (1)</span>
              <span>Quotidien (10)</span>
            </div>
          </div>
        </div>

        {/* Accordéon qualitatif discret */}
        <div className="border border-line rounded-lg overflow-hidden">
          <button
            type="button"
            onClick={() => setShowContext(!showContext)}
            className="w-full px-3 py-1.5 bg-surface/30 hover:bg-surface flex items-center justify-between text-[11px] font-medium text-navy/80 transition-colors"
          >
            <span>Détails & contexte</span>
            {showContext ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
          </button>
          {showContext && (
            <div className="p-3 space-y-2 bg-white border-t border-line text-xs">
              <div>
                <label className="block text-[10px] font-semibold text-muted mb-0.5">
                  Douleur principale
                </label>
                <input
                  type="text"
                  value={persona.keyPainPoint || ''}
                  onChange={(e) => updateField('keyPainPoint', e.target.value)}
                  placeholder="Ex: Perd 3h par semaine..."
                  className="w-full text-xs px-2.5 py-1 rounded border border-line"
                />
              </div>
              <div>
                <label className="block text-[10px] font-semibold text-muted mb-0.5">
                  Alternative actuelle
                </label>
                <input
                  type="text"
                  value={persona.alternativeSolution || ''}
                  onChange={(e) => updateField('alternativeSolution', e.target.value)}
                  placeholder="Ex: Fait à la main / Excel..."
                  className="w-full text-xs px-2.5 py-1 rounded border border-line"
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
