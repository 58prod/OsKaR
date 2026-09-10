import React from 'react';
import type { Ton } from '@/lib/finance/types';

/*
 * Tableaux éditables et cases de résultat de `finance-atelier.html`, aux
 * valeurs relevées sur la maquette servie :
 *   cadre       rayon 11.5, bord 1px, fond blanc, 8px dessous
 *   en-tête     navy, 12px / 700 / interlettrage 0.72px, padding 10/12
 *   ligne       48.5px, filet 1px, survol #fffbf0
 *   cellule     padding 4/8 ; saisie sans cadre 15px, soulignée orange au focus ;
 *               menus 14px avec chevron ; cellule calculée 14px / 700 navy
 *               sur #fafbff
 *   résultats   3 cases, écart 12, 18px au-dessus, 14px dessous ; case rayon
 *               11.5 padding 16/14 ; valeur 26px / 800 ; libellé 12px / 600
 *               gris en majuscules
 */

export const CHEVRON =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 12 12' fill='none' stroke='%237b82a0' stroke-width='1.8' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M2 4l4 4 4-4'/%3E%3C/svg%3E\")";

/** Saisie de texte dans une cellule (40px, comme les champs texte de la maquette). */
export const CELLULE_TEXTE =
  'w-full h-10 border-0 bg-transparent text-15 text-ink outline-none px-1 py-1.5 placeholder:text-muted placeholder:text-15 focus:border-b-[1.5px] focus:border-finance';

/** Saisie d'un montant dans une cellule. */
export const CELLULE_NOMBRE =
  'w-full border-0 bg-transparent text-15 leading-[normal] text-ink outline-none px-1 py-1.5 placeholder:text-muted placeholder:text-15 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none focus:border-b-[1.5px] focus:border-finance';

/** Menu déroulant dans une cellule. */
export const CELLULE_MENU =
  'w-full border-0 bg-transparent text-14 leading-[normal] text-ink cursor-pointer outline-none pl-1 pr-5 py-1.5 appearance-none bg-no-repeat bg-[length:10px] bg-[position:right_4px_center]';

export const TD = 'px-2 py-1 align-middle';
export const TD_CALCUL = 'px-3 py-2 align-middle text-14 font-bold text-navy bg-[#fafbff]';

export const Tableau: React.FC<{ colonnes: { titre: string; largeur: string }[]; children: React.ReactNode }> = ({
  colonnes,
  children,
}) => (
  <div className="overflow-x-auto rounded-[11.5px] border border-line bg-white mb-2">
    <table className="w-full border-collapse text-15">
      <thead>
        <tr className="bg-navy text-white">
          {colonnes.map((c, i) => (
            <th
              key={c.titre}
              scope="col"
              className={`${c.largeur} px-3 py-2.5 text-12 font-bold tracking-[0.72px] text-left ${
                i === 0 ? 'rounded-tl-[10px]' : i === colonnes.length - 1 ? 'rounded-tr-[10px]' : ''
              }`}
            >
              {c.titre}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>{children}</tbody>
    </table>
  </div>
);

export const Ligne: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <tr className="border-b border-line last:border-b-0 transition-colors hover:bg-[#fffbf0]">{children}</tr>
);

/** Menu déroulant d'une cellule. */
export const MenuCellule: React.FC<{
  value: string;
  onChange: (v: string) => void;
  options: readonly { valeur: string; libelle: string }[];
  label: string;
}> = ({ value, onChange, options, label }) => (
  <select
    className={CELLULE_MENU}
    style={{ backgroundImage: CHEVRON }}
    value={value}
    onChange={(e) => onChange(e.target.value)}
    aria-label={label}
  >
    {options.map((o) => (
      <option key={o.valeur} value={o.valeur}>
        {o.libelle}
      </option>
    ))}
  </select>
);

/** « + Ajouter… » sous un tableau (`.ca-add-btn`). */
export const BoutonAjout: React.FC<{ onClick: () => void; children: React.ReactNode }> = ({ onClick, children }) => (
  <button
    type="button"
    onClick={onClick}
    className="mt-2 w-full bg-transparent border-[1.5px] border-dashed border-line rounded-[10.5px] text-muted text-14.5 leading-[normal] font-semibold px-4 py-[7px] cursor-pointer transition-all hover:border-teal hover:text-navy hover:bg-[#f0faf8]"
  >
    {children}
  </button>
);

const TONS: Record<Ton, string> = {
  navy: 'text-navy',
  pos: 'text-[#16a34a]',
  neg: 'text-[#dc2626]',
  warn: 'text-finance-dark',
};

/** Les trois cases de résultat (`.finance-result-grid`). */
export const Resultats: React.FC<{
  cases: { valeur: string; libelle: string; ton: Ton }[];
  className?: string;
}> = ({ cases, className = 'mb-3.5' }) => (
  <div className={`grid grid-cols-1 sm:grid-cols-3 gap-3 ${className}`}>
    {cases.map((c) => (
      <div
        key={c.libelle}
        className="bg-white border border-line rounded-[11.5px] px-3.5 py-4 shadow-card text-center"
        aria-live="polite"
      >
        <div className={`text-[26px] font-extrabold leading-none ${TONS[c.ton]}`}>{c.valeur}</div>
        <div className="text-12 font-semibold uppercase tracking-[0.6px] text-muted mt-[5px]">{c.libelle}</div>
      </div>
    ))}
  </div>
);
