import React from 'react';
import { AlertCircle, Loader2, Search } from 'lucide-react';
import { dateCourte, type FormuleCompte, type GenreFormule } from '@/lib/admin/formule';
import { PILIERS_ADMIN, type PilierAdmin } from '@/lib/admin/types';

/*
 * Briques des écrans d'administration, relevées sur plateforme/admin.html
 * (styles locaux de la maquette + oskar.css) :
 *   carte        blanc, bord #e2e4f0, rayon 12, padding 27.5, ombre carte
 *   titre carte  12.5px / 700 / interlettrage .1em, capitales grises, filet dessous
 *   puces        14px / 600, padding 8/14, rayon 22, bord 1.5 ; active : navy plein
 *   tableau      en-têtes 12px / 700 capitales sur #fafbfd, cellules 13/16
 *   pastilles    11px, écart 5, couleur du pilier quand l'atelier est commencé
 *   étiquettes   12.5px / 700, padding 3/10, rayon 20
 */

const PASTILLE: Record<PilierAdmin, string> = {
  vision: 'bg-vision',
  fit: 'bg-fit',
  finance: 'bg-finance',
  okr: 'bg-okr',
  team: 'bg-team',
};

export const FOND_PILIER = PASTILLE;

/** Les 5 pastilles des piliers : allumées pour les ateliers commencés. */
export const Pastilles: React.FC<{ ateliers: Record<PilierAdmin, boolean> }> = ({ ateliers }) => {
  const commences = PILIERS_ADMIN.filter((p) => ateliers[p.id]).map((p) => p.nom);
  return (
    <span className="inline-flex gap-[5px]" role="img" aria-label={`Ateliers commencés : ${commences.join(', ') || 'aucun'}`}>
      {PILIERS_ADMIN.map((p) => (
        <span
          key={p.id}
          title={p.nom}
          className={`w-[11px] h-[11px] rounded-full ${ateliers[p.id] ? PASTILLE[p.id] : 'bg-line'}`}
        />
      ))}
    </span>
  );
};

export const TAG = 'inline-flex items-center gap-[5px] text-12.5 font-bold leading-[1.6] px-2.5 py-[3px] rounded-[20px] whitespace-nowrap';

const TON_FORMULE: Record<GenreFormule, string> = {
  gratuit: 'bg-surface text-muted border border-line',
  offerte: 'bg-teal-light text-teal-dark',
  abonne: 'bg-[#f0f2ff] text-navy',
  demo: 'bg-finance-light text-finance-dark',
};

export const TagFormule: React.FC<{ formule: FormuleCompte; sansDate?: boolean }> = ({ formule, sansDate }) => (
  <span className={`${TAG} ${TON_FORMULE[formule.genre]}`}>
    {formule.libelle}
    {!sansDate && formule.jusquAu ? ` · ${dateCourte(formule.jusquAu)}` : ''}
  </span>
);

/** Petite étiquette de pilier (`.tag-pill.badge-*`). */
export const TON_PILIER: Record<PilierAdmin, string> = {
  vision: 'bg-vision-light text-vision-dark',
  fit: 'bg-fit-light text-fit-dark',
  finance: 'bg-finance-light text-finance-dark',
  okr: 'bg-okr-light text-okr-dark',
  team: 'bg-team-light text-team-dark',
};
export const PILULE = 'inline-block text-12 font-bold leading-[1.6] px-[9px] py-0.5 rounded-[20px] whitespace-nowrap';

export const Carte: React.FC<{
  titre?: React.ReactNode;
  compacte?: boolean;
  className?: string;
  children: React.ReactNode;
}> = ({ titre, compacte, className = '', children }) => (
  <section
    className={`bg-white border border-line rounded-card shadow-card transition-colors hover:border-[#c8ccec] ${
      compacte ? 'px-[22px] py-5 mb-3.5' : 'p-[27.5px] mb-3.5'
    } ${className}`}
  >
    {titre && (
      <h2 className="flex items-center gap-[10.5px] text-12.5 font-bold leading-[1.6] tracking-[.1em] uppercase text-muted pb-3.5 border-b border-line mb-[18px]">
        {titre}
      </h2>
    )}
    {children}
  </section>
);

export interface OptionPuce<T extends string> {
  id: T;
  libelle: string;
  nombre: number;
}

export function Puces<T extends string>({
  options,
  valeur,
  onChange,
  libelle,
}: {
  options: OptionPuce<T>[];
  valeur: T;
  onChange: (v: T) => void;
  libelle: string;
}) {
  return (
    <div className="flex gap-1.5 flex-wrap" role="group" aria-label={libelle}>
      {options.map((o) => {
        const actif = o.id === valeur;
        return (
          <button
            key={o.id}
            type="button"
            aria-pressed={actif}
            onClick={() => onChange(o.id)}
            className={`text-14 font-semibold leading-[normal] px-3.5 py-2 rounded-[22px] border-[1.5px] transition-all ${
              actif ? 'bg-navy border-navy text-white' : 'bg-white border-line text-muted hover:border-navy hover:text-navy'
            }`}
          >
            {o.libelle}
            <span className="opacity-60 ml-1 font-bold">{o.nombre}</span>
          </button>
        );
      })}
    </div>
  );
}

export const Recherche: React.FC<{ valeur: string; onChange: (v: string) => void; placeholder: string }> = ({
  valeur,
  onChange,
  placeholder,
}) => (
  <div className="relative flex-1 min-w-[240px]">
    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-[17px] h-[17px] text-muted" aria-hidden />
    <input
      type="search"
      value={valeur}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      aria-label={placeholder}
      className="w-full pl-10 pr-3.5 py-[11px] border-[1.5px] border-line rounded-[10.5px] bg-white text-15 leading-[normal] text-ink placeholder:text-muted outline-none focus:border-navy"
    />
  </div>
);

export const BarreOutils: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="flex items-center gap-3 mb-4 flex-wrap">{children}</div>
);

export const TH = 'text-left text-12 font-bold leading-[1.6] tracking-[.08em] uppercase text-muted bg-[#fafbfd] px-4 py-3 border-b border-line whitespace-nowrap';
export const TD = 'px-4 py-[13px] border-b border-line align-middle';
export const LIGNE_CLIQUABLE = 'cursor-pointer transition-colors hover:bg-[#f7f8fd] focus-visible:outline-none focus-visible:bg-[#f0f2ff]';

export const CadreTableau: React.FC<{ pied?: React.ReactNode; children: React.ReactNode }> = ({ pied, children }) => (
  <div className="bg-white border border-line rounded-card shadow-card overflow-hidden">
    <div className="overflow-x-auto">{children}</div>
    {pied && (
      <div className="flex flex-wrap gap-2 justify-between items-center px-4 py-3 text-13.5 text-muted border-t border-line bg-[#fafbfd]">
        {pied}
      </div>
    )}
  </div>
);

/** Encadré d'information (`.info-band`) : liseré navy, ou turquoise pour le RGPD. */
export const Bandeau: React.FC<{ ton?: 'navy' | 'teal'; icone: React.ReactNode; children: React.ReactNode }> = ({
  ton = 'navy',
  icone,
  children,
}) => (
  <div
    className={`flex gap-[13px] items-start bg-white border border-line border-l-4 ${
      ton === 'teal' ? 'border-l-teal' : 'border-l-navy-light'
    } rounded-[11px] px-[18px] py-3.5 mb-[18px] text-14.5 leading-[1.6] text-ink`}
  >
    <span className={`shrink-0 mt-px [&>svg]:w-5 [&>svg]:h-5 ${ton === 'teal' ? 'text-teal-dark' : 'text-navy-light'}`}>
      {icone}
    </span>
    <div>{children}</div>
  </div>
);

export const Chargement: React.FC<{ texte?: string }> = ({ texte = 'Chargement…' }) => (
  <div className="flex items-center justify-center gap-2.5 py-16 text-14.5 text-muted" role="status">
    <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
    {texte}
  </div>
);

export const Erreur: React.FC<{ message?: string }> = ({ message }) => (
  <div className="flex items-start gap-3 bg-coral-light border border-coral/50 rounded-[11px] px-4 py-3.5 text-14.5 text-coral-dark" role="alert">
    <AlertCircle className="h-5 w-5 shrink-0 mt-px" aria-hidden />
    <div>
      <strong className="font-bold">Les données n&rsquo;ont pas pu être chargées.</strong>
      {message && <div className="text-13.5 mt-0.5 opacity-90">{message}</div>}
    </div>
  </div>
);

/** « 1 compte », « 3 comptes ». */
export function pluriel(n: number, singulier: string, plurielForme = `${singulier}s`): string {
  return `${n} ${n > 1 ? plurielForme : singulier}`;
}

/** Note sur 10, virgule décimale : « 5,8 ». */
export function noteSur10(note: number): string {
  return String(Math.round(note * 10) / 10).replace('.', ',');
}
