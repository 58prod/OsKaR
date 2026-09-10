import React from 'react';
import { SECTEURS } from '@/lib/secteurs';

/*
 * Liste déroulante du domaine d'activité, telle que les maquettes la posent :
 * un seul menu, les métiers rangés par famille. Composant unique, pour que
 * l'onboarding et le profil d'entreprise proposent exactement le même choix.
 */

interface ChoixSecteurProps {
  id?: string;
  value: string;
  onChange: (valeur: string) => void;
  /** Première ligne, quand rien n'est choisi. */
  placeholder?: string;
  required?: boolean;
  className?: string;
  style?: React.CSSProperties;
  'aria-describedby'?: string;
}

export const ChoixSecteur: React.FC<ChoixSecteurProps> = ({
  id = 'secteur',
  value,
  onChange,
  placeholder = '— Sélectionnez votre secteur —',
  required = false,
  className = '',
  ...rest
}) => (
  <select
    id={id}
    value={value}
    onChange={(e) => onChange(e.target.value)}
    required={required}
    className={
      className ||
      'w-full text-sm text-ink px-3 py-2.5 rounded-lg border border-line bg-white transition-colors focus:border-teal focus:outline-none focus:ring-2 focus:ring-teal/20'
    }
    {...rest}
  >
    <option value="">{placeholder}</option>
    {SECTEURS.map(({ famille, activites }) => (
      <optgroup key={famille} label={famille}>
        {activites.map((activite) => (
          <option key={activite} value={activite}>
            {activite}
          </option>
        ))}
      </optgroup>
    ))}
  </select>
);

export default ChoixSecteur;
