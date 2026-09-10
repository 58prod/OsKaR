import React from 'react';
import { ETAPES_FIT, LIBELLES_ETAPES_FIT, type EtapeFit } from '@/lib/fit/types';

/*
 * Barre d'étapes de `fit-atelier.html`, valeurs relevées sur la maquette :
 *   conteneur   carte blanche, bord 1px, rayon 12, padding 0 24, marge basse 24
 *   étape       colonne centrée, écart 5, padding 16/4, bordure basse 2px :
 *               navy si active, navy 20 % si passée, transparente sinon
 *   point       7px ; vert Fit agrandi ×1.4 si actif, vert Fit si passé,
 *               #e2e4f0 sinon
 *   libellé     11.5px / 600 / interlettrage 0.92px / majuscules ;
 *               vert Fit foncé si actif, navy 40 % si passé, gris sinon
 *
 * Les cinq étapes y figurent, diagnostic compris.
 */

export const BarreEtapesFit: React.FC<{ etape: EtapeFit; onChange: (e: EtapeFit) => void }> = ({
  etape,
  onChange,
}) => {
  const courante = ETAPES_FIT.indexOf(etape);
  return (
    <nav
      aria-label="Étapes de l’atelier Fit"
      className="bg-white border border-line rounded-card shadow-card mb-6 px-6 flex"
    >
      {ETAPES_FIT.map((e, i) => {
        const active = i === courante;
        const passee = i < courante;
        return (
          <button
            key={e}
            type="button"
            onClick={() => onChange(e)}
            aria-current={active ? 'step' : undefined}
            className={`flex-1 min-w-0 flex flex-col items-center gap-[5px] px-1 py-4 border-b-2 transition-colors ${
              active ? 'border-navy' : passee ? 'border-navy/20' : 'border-transparent hover:border-line'
            }`}
          >
            <span
              className={`w-[7px] h-[7px] rounded-full shrink-0 transition-transform ${
                active ? 'bg-fit scale-[1.4]' : passee ? 'bg-fit' : 'bg-line'
              }`}
              aria-hidden
            />
            <span
              className={`text-11.5 font-semibold uppercase tracking-[0.92px] text-center leading-[1.6] ${
                active ? 'text-fit-dark' : passee ? 'text-navy/40' : 'text-muted'
              }`}
            >
              {LIBELLES_ETAPES_FIT[e]}
            </span>
          </button>
        );
      })}
    </nav>
  );
};

export default BarreEtapesFit;
