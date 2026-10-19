import React, { useEffect, useRef } from 'react';
import { Plus } from 'lucide-react';
import { PARTICIPANT_COLORS, PARTICIPANT_PALETTE, couleurLisible } from '@/utils/toolIdentity';

interface ChoixCouleurProps {
  value: string;
  onChange: (color: string) => void;
  /** Couleurs déjà prises par d'autres participants : affichées pâles, non cliquables. */
  taken?: { color: string; name: string }[];
  label: string;
  /** Anneau de sélection décalé sur ce fond (classe Tailwind `ring-offset-…`). */
  offsetClass?: string;
}

/**
 * Choix de la couleur d'un participant : les 12 couleurs de la palette, et
 * une pastille « + » qui ouvre le sélecteur du système pour n'importe quelle
 * autre couleur (assombrie si elle est trop claire pour rester lisible).
 */
export const ChoixCouleur: React.FC<ChoixCouleurProps> = ({
  value, onChange, taken = [], label, offsetClass = 'ring-offset-white',
}) => {
  const libre = !!value && !PARTICIPANT_PALETTE.includes(value);
  const champ = useRef<HTMLInputElement>(null);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  // « change » (et non « input ») : une seule fois, quand le sélecteur se referme.
  useEffect(() => {
    const el = champ.current;
    if (!el) return undefined;
    const valider = () => onChangeRef.current(couleurLisible(el.value));
    el.addEventListener('change', valider);
    return () => el.removeEventListener('change', valider);
  }, []);

  const anneau = `ring-2 ring-navy ring-offset-2 ${offsetClass}`;

  return (
    <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-label={label}>
      {PARTICIPANT_COLORS.map((c) => {
        const prise = taken.find((t) => t.color === c.valeur);
        const selected = c.valeur === value;
        return (
          <button
            key={c.valeur}
            type="button"
            role="radio"
            aria-checked={selected}
            disabled={!!prise}
            aria-label={prise ? `${c.nom} (prise par ${prise.name})` : c.nom}
            title={prise ? `${c.nom} — prise par ${prise.name}` : c.nom}
            onClick={() => onChange(c.valeur)}
            className={`h-6 w-6 rounded-full transition-transform focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal disabled:cursor-not-allowed disabled:opacity-25 ${
              selected ? anneau : 'enabled:hover:scale-110'
            }`}
            style={{ background: c.valeur }}
          />
        );
      })}
      <label
        title="Choisir une autre couleur"
        className={`relative flex h-6 w-6 cursor-pointer items-center justify-center rounded-full transition-transform focus-within:ring-2 focus-within:ring-teal ${
          libre ? anneau : 'hover:scale-110'
        }`}
        style={{ background: libre ? value : 'conic-gradient(#ef4444, #f59e0b, #84cc16, #06b6d4, #2563eb, #c026d3, #ef4444)' }}
      >
        {!libre && <Plus className="h-3.5 w-3.5 text-white drop-shadow" strokeWidth={3} aria-hidden />}
        <input
          ref={champ}
          type="color"
          defaultValue={libre ? value : '#2563eb'}
          aria-label="Choisir une autre couleur"
          className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
        />
      </label>
    </div>
  );
};

export default ChoixCouleur;
