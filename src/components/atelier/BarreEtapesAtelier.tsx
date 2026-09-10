import React from 'react';

/*
 * Barre d'étapes des ateliers Fit et Finance (`.progress-wrap` / `.pstep`),
 * valeurs relevées sur `fit-atelier.html` et `finance-atelier.html` :
 *   conteneur   carte blanche, bord 1px, rayon 12, padding 0 24, marge basse 24
 *   étape       colonne centrée, écart 5, padding 16/4, bordure basse 2px :
 *               navy si active, navy 20 % si passée, transparente sinon
 *   point       7px ; couleur du pilier agrandie ×1.4 si actif, couleur du
 *               pilier si passé, #e2e4f0 sinon
 *   libellé     11.5px / 600 / interlettrage 0.92px / majuscules ;
 *               teinte foncée du pilier si actif, navy 40 % si passé, gris sinon
 *
 * Toutes les étapes y figurent, écran final compris.
 */

type PilierBarre = 'fit' | 'finance';

/** Classes écrites en toutes lettres : Tailwind ne résout pas les noms construits. */
const COULEURS: Record<PilierBarre, { point: string; libelle: string }> = {
  fit: { point: 'bg-fit', libelle: 'text-fit-dark' },
  finance: { point: 'bg-finance', libelle: 'text-finance-dark' },
};

export function BarreEtapesAtelier<E extends string>({
  pilier,
  nom,
  etapes,
  libelles,
  etape,
  onChange,
}: {
  pilier: PilierBarre;
  /** Nom de l'atelier, pour l'étiquette d'accessibilité. */
  nom: string;
  etapes: readonly E[];
  libelles: Record<E, string>;
  etape: E;
  onChange: (e: E) => void;
}) {
  const c = COULEURS[pilier];
  const courante = etapes.indexOf(etape);
  return (
    <nav
      aria-label={`Étapes de l’atelier ${nom}`}
      className="bg-white border border-line rounded-card shadow-card mb-6 px-6 flex"
    >
      {etapes.map((e, i) => {
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
                active ? `${c.point} scale-[1.4]` : passee ? c.point : 'bg-line'
              }`}
              aria-hidden
            />
            <span
              className={`text-11.5 font-semibold uppercase tracking-[0.92px] text-center leading-[1.6] ${
                active ? c.libelle : passee ? 'text-navy/40' : 'text-muted'
              }`}
            >
              {libelles[e]}
            </span>
          </button>
        );
      })}
    </nav>
  );
}

export default BarreEtapesAtelier;
