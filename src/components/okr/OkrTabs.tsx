import React from 'react';
import { ETAPES, type Etape } from './okrFlux';

/*
 * Navigation « pilule » des 3 étapes (okr-tab-nav de okr.html) :
 *   conteneur blanc, bord, rayon 12px, ombre carte, padding 6px, écart 4px
 *   onglet    14px / 600, rayon 9px, padding 12/16
 *   actif     fond OKR clair, texte OKR foncé, pastille OKR pleine
 *   passé     texte OKR foncé à 65 %, pastille OKR pleine avec coche
 *   à venir   gris, pastille OKR à 10 %
 */

interface OkrTabsProps {
  etape: Etape;
  libelles: Record<Etape, string>;
  onChange: (e: Etape) => void;
}

const Coche = () => (
  <svg viewBox="0 0 20 20" fill="currentColor" className="w-3 h-3" aria-hidden>
    <path
      fillRule="evenodd"
      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
      clipRule="evenodd"
    />
  </svg>
);

export const OkrTabs: React.FC<OkrTabsProps> = ({ etape, libelles, onChange }) => {
  const courante = ETAPES.indexOf(etape);

  return (
    <nav
      aria-label="Étapes du parcours OKR"
      className="flex bg-white border border-line rounded-card shadow-card mb-7 p-1.5 gap-1"
    >
      {ETAPES.map((e, i) => {
        const active = i === courante;
        const passee = i < courante;
        return (
          <React.Fragment key={e}>
            {i > 0 && <div className="w-px bg-line self-stretch my-1.5 shrink-0" aria-hidden />}
            <button
              type="button"
              onClick={() => onChange(e)}
              aria-current={active ? 'step' : undefined}
              className={`flex-1 flex items-center justify-center gap-2.5 px-4 py-3 rounded-[9px] text-14 font-semibold transition-all ${
                active
                  ? 'bg-okr-light text-okr-dark'
                  : passee
                    ? 'text-okr-dark opacity-65 hover:opacity-100 hover:bg-surface'
                    : 'text-muted hover:bg-surface hover:text-navy'
              }`}
            >
              <span
                className={`w-[26px] h-[26px] rounded-full flex items-center justify-center text-13 font-extrabold shrink-0 transition-all ${
                  active || passee ? 'bg-okr text-white' : 'bg-okr/10 text-okr-dark'
                }`}
              >
                {passee ? <Coche /> : i + 1}
              </span>
              <span className="truncate">{libelles[e]}</span>
            </button>
          </React.Fragment>
        );
      })}
    </nav>
  );
};

export default OkrTabs;
