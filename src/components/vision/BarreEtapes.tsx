import React from 'react';
import { ETAPES_VISION, type EtapeVision } from '@/lib/vision/types';

/*
 * Barre d'étapes de `vision-atelier.html`, aux valeurs relevées sur la maquette
 * (styles calculés) :
 *   conteneur   carte blanche, bord 1px #e2e4f0, rayon 12px, ombre carte,
 *               padding 0 24px, marge basse 24px
 *   étape       colonne centrée, écart 5px, padding 16px 4px,
 *               bordure basse 2px navy quand elle est active
 *   point       7px, rond ; #0ea5e9 si active, #e2e4f0 sinon
 *   libellé     11.5px / 600 / interlettrage 0.92px / majuscules,
 *               #0ea5e9 si active, #6b7280 sinon
 *
 * Sept étapes seulement : la synthèse finale ne figure pas dans la barre, on y
 * arrive par le bouton « Suivant » de l'étape 7, comme dans la maquette.
 */

/** Libellés tels qu'ils s'affichent dans la barre. */
export const LIBELLES_BARRE: Record<EtapeVision, string> = {
  sens: 'Sens',
  cibles: 'Cibles & acteurs',
  probleme: 'Réalité',
  projection: 'Projection',
  valeurs: 'Valeurs',
  vision: 'Synthèse',
  objectifs: 'Objectifs',
  synthese: 'Récapitulatif',
};

const ETAPES_VISIBLES = ETAPES_VISION.filter((e) => e !== 'synthese');

interface BarreEtapesProps {
  etape: EtapeVision;
  onChange: (e: EtapeVision) => void;
}

export const BarreEtapes: React.FC<BarreEtapesProps> = ({ etape, onChange }) => (
  <nav
    aria-label="Étapes de l’atelier Vision"
    className="bg-white border border-line rounded-card shadow-card mb-6 px-6 flex flex-wrap"
  >
    {ETAPES_VISIBLES.map((e) => {
      const active = e === etape;
      return (
        <button
          key={e}
          type="button"
          onClick={() => onChange(e)}
          aria-current={active ? 'step' : undefined}
          className={`flex-1 min-w-[92px] flex flex-col items-center gap-[5px] px-1 py-4 border-b-2 transition-colors ${
            active ? 'border-navy' : 'border-transparent hover:border-line'
          }`}
        >
          <span
            className={`w-[7px] h-[7px] rounded-full shrink-0 ${active ? 'bg-vision' : 'bg-line'}`}
            aria-hidden
          />
          <span
            className={`text-11.5 font-semibold uppercase tracking-[0.92px] text-center leading-tight ${
              active ? 'text-vision' : 'text-muted'
            }`}
          >
            {LIBELLES_BARRE[e]}
          </span>
        </button>
      );
    })}
  </nav>
);

export default BarreEtapes;
