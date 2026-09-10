import React from 'react';

/*
 * Briques de saisie de l'atelier Vision, aux mesures de `vision-atelier.html` :
 *   carte        blanche, bord 1px, rayon 12px, padding 20px, ombre carte
 *   préfixe      13px / 700 / navy, au-dessus du champ
 *   champ        14.5px, bord 1.5px, rayon 9px, fond #fafbff, focus vision
 *   note         12.5px / gris, sous le champ
 *   en-tête      titre 24px / 800, promesse 14.5px teal, aide 14.5px gris
 */

export const CHAMP =
  'w-full text-14.5 text-ink px-3.5 py-2.5 rounded-[9px] border-[1.5px] border-line bg-[#fafbff] outline-none transition-colors focus:border-vision focus:bg-white focus:ring-2 focus:ring-vision/15 placeholder:text-muted/60';

/** En-tête d'étape : titre, promesse, phrase d'aide. */
export const EnTeteEtape: React.FC<{ titre: string; promesse: string; aide?: string }> = ({
  titre,
  promesse,
  aide,
}) => (
  <header className="mb-6">
    <div className="flex flex-wrap items-baseline gap-3">
      <h1 className="text-[24px] leading-[1.25] font-extrabold text-navy">{titre}</h1>
      <span className="text-14.5 font-semibold text-vision">{promesse}</span>
    </div>
    {aide && <p className="text-14.5 text-muted mt-1.5 max-w-2xl leading-[1.6]">{aide}</p>}
  </header>
);

/** Carte de saisie avec préfixe, badge éventuel et note explicative. */
export const CarteChamp: React.FC<{
  prefixe: string;
  badge?: string;
  note?: string;
  children: React.ReactNode;
}> = ({ prefixe, badge, note, children }) => (
  <div className="bg-white border border-line rounded-card shadow-card p-5 mb-3">
    {badge && (
      <span className="inline-block text-[10px] font-extrabold tracking-[1.2px] uppercase text-vision-dark bg-vision-light px-2 py-0.5 rounded mb-2">
        {badge}
      </span>
    )}
    <span className="block text-13 font-bold text-navy mb-2">{prefixe}</span>
    {children}
    {note && <p className="text-12.5 text-muted mt-2 leading-[1.5]">{note}</p>}
  </div>
);

/** Champ court avec son intitulé. */
export const ChampTexte: React.FC<{
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}> = ({ id, label, value, onChange, placeholder }) => (
  <div>
    <label htmlFor={id} className="block text-12.5 font-bold text-navy mb-1.5">
      {label}
    </label>
    <input
      id={id}
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={CHAMP}
    />
  </div>
);
