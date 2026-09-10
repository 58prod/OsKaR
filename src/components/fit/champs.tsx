import React from 'react';

/*
 * Briques de saisie de l'atelier Fit, aux valeurs relevées sur
 * `fit-atelier.html` servie (styles calculés, fenêtre de 1400 px) :
 *   carte        blanche, bord 1px #e2e4f0, rayon 12, padding 27.5, marge 12
 *   préfixe      14px / 700 / gris / majuscules / interlettrage 0.8px
 *   intitulé     14.5px / 600 / navy, 5px au-dessus du champ
 *   champ        16px, fond #f5f6fa, bord 1.5px, rayon 10.5, padding 11.5/14,
 *                40px de haut ; au focus bord teal et halo teal 10 %
 *   note         12.5px / italique / gris, 5px sous le champ
 *   choix        15px, bord 1.5px, rayon 9, padding 8/12, écart 8 ;
 *                coché ou survolé : bord teal sur fond teal clair
 *   en-tête      titre 27.5px / 800 / navy, promesse 12.5px teal foncé,
 *                aide 16px gris interligne 1.65
 */

export const CHAMP_FIT =
  'w-full bg-surface border-[1.5px] border-line rounded-[10.5px] px-3.5 py-[11.5px] text-16 leading-[1.6] text-ink outline-none transition-[border-color,box-shadow] focus:border-teal focus:bg-white focus:shadow-[0_0_0_3px_rgba(0,212,180,0.1)] placeholder:text-muted placeholder:text-15';

/** Bouton principal des pieds d'étape (`.btn-navy`) : l'atelier Fit ne le recolore pas.
 *  Interligne « normal » comme les boutons de la maquette (41px de haut). */
export const BTN_NAVY =
  'inline-flex items-center gap-1.5 px-[18px] py-[10.5px] rounded-[10.5px] bg-navy text-white text-15.5 leading-[normal] font-semibold transition-all hover:bg-navy-dark';

/** Bouton discret (`.btn-ghost`), celui de « Exporter PDF ». */
export const BTN_GHOST =
  'inline-flex items-center gap-1.5 px-[18px] py-[10.5px] rounded-[10.5px] bg-transparent border-[1.5px] border-line text-muted text-15.5 leading-[normal] font-semibold transition-all hover:border-navy hover:text-navy';

/** En-tête d'étape : titre, promesse éventuelle, phrase d'aide. */
export const EnTeteEtapeFit: React.FC<{ titre: string; promesse?: string; aide: string }> = ({
  titre,
  promesse,
  aide,
}) => (
  <header className="mb-6">
    <h2 className="text-27.5 font-extrabold text-navy tracking-[-0.55px] leading-[1.2] mb-1">{titre}</h2>
    {promesse && (
      <div className="text-12.5 font-bold uppercase tracking-[1.25px] text-teal-dark mb-1.5">{promesse}</div>
    )}
    <p className="text-16 text-muted leading-[1.65]">{aide}</p>
  </header>
);

/** Carte blanche, avec le préfixe en majuscules de la maquette. */
export const CarteFit: React.FC<{
  prefixe?: string;
  /** La maquette espace un peu plus le préfixe à l'étape « Signaux ». */
  prefixeAere?: boolean;
  className?: string;
  children: React.ReactNode;
}> = ({ prefixe, prefixeAere, className = 'mb-3', children }) => (
  <div
    className={`bg-white border border-line rounded-card p-[27.5px] shadow-card transition-colors hover:border-[#c8ccec] ${className}`}
  >
    {prefixe && (
      <span
        className={`block text-14 font-bold uppercase tracking-[0.8px] text-muted ${prefixeAere ? 'mb-3.5' : 'mb-2.5'}`}
      >
        {prefixe}
      </span>
    )}
    {children}
  </div>
);

/** Un champ : intitulé, saisie, note facultative. */
export const ChampFit: React.FC<{
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  /** Nombre de lignes : zone de texte si renseigné, champ court sinon. */
  lignes?: number;
  note?: string;
  className?: string;
}> = ({ id, label, value, onChange, placeholder, lignes, note, className = 'mb-3 last:mb-0' }) => (
  <div className={className}>
    <label htmlFor={id} className="block text-14.5 font-semibold text-navy mb-[5px]">
      {label}
    </label>
    {lignes ? (
      <textarea
        id={id}
        rows={lignes}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`${CHAMP_FIT} min-h-[80px] resize-y`}
      />
    ) : (
      <input
        id={id}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`${CHAMP_FIT} h-10 resize-none`}
      />
    )}
    {note && <p className="text-12.5 italic text-muted mt-[5px]">{note}</p>}
  </div>
);

/** Question à choix unique, présentée en cartouches empilés (`.fit-radio-group`). */
export function ChoixFit<T extends string>({
  name,
  label,
  value,
  onChange,
  options,
}: {
  name: string;
  label: string;
  value: T | '';
  onChange: (v: T) => void;
  options: { valeur: T; libelle: string }[];
}) {
  return (
    <div>
      <div id={`${name}-label`} className="block text-14.5 font-semibold text-navy mb-[5px]">
        {label}
      </div>
      <div role="radiogroup" aria-labelledby={`${name}-label`} className="flex flex-col gap-2 mt-2">
        {options.map((o) => {
          const coche = value === o.valeur;
          return (
            <label
              key={o.valeur}
              className={`flex items-center gap-[9px] text-15 text-ink cursor-pointer px-3 py-2 rounded-[9px] border-[1.5px] transition-colors ${
                coche ? 'border-teal bg-teal-light font-semibold' : 'border-line hover:border-teal hover:bg-teal-light'
              }`}
            >
              <input
                type="radio"
                name={name}
                value={o.valeur}
                checked={coche}
                onChange={() => onChange(o.valeur)}
                className="w-4 h-4 m-0 shrink-0 accent-teal"
              />
              {o.libelle}
            </label>
          );
        })}
      </div>
    </div>
  );
}
