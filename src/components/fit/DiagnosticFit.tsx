import React from 'react';
import { EnTeteEtapeFit } from './champs';
import { IconeConcurrence, IconeDifferenciation, IconeOffre, IconeSignaux } from './icones';
import { detailsFit, recapFit, scoreFit, statutFit, type AtelierFit } from '@/lib/fit/types';

/*
 * Étape 5 de `fit-atelier.html` : « Votre diagnostic FIT ».
 * Statut calculé sur les réponses, quatre cases de récapitulatif, le détail
 * par dimension, puis la prochaine étape recommandée.
 *
 * Valeurs relevées : carte de statut bord 2px de la couleur du statut, rayon
 * 16, padding 24/24/20 ; pastille 22px / 800 rayon 10 ; grille de 4 cases
 * (2 sous 700 px) écart 12 ; case centrée rayon 12 padding 16/14 ; détail en
 * cartes de 27.5 ; encart final navy foncé, bord 2px du statut, rayon 14.
 */

const CASES = [
  { cle: 'offre', titre: 'Offre', Icone: IconeOffre },
  { cle: 'differenciation', titre: 'Différenciation', Icone: IconeDifferenciation },
  { cle: 'concurrence', titre: 'Concurrence', Icone: IconeConcurrence },
  { cle: 'signaux', titre: 'Signaux', Icone: IconeSignaux },
] as const;

const DETAILS = [
  { cle: 'offre', titre: 'Offre' },
  { cle: 'differenciation', titre: 'Différenciation' },
  { cle: 'concurrence', titre: 'Environnement concurrentiel' },
  { cle: 'signaux', titre: 'Signaux marché' },
] as const;

export const DiagnosticFit: React.FC<{ atelier: AtelierFit }> = ({ atelier }) => {
  const statut = statutFit(scoreFit(atelier));
  const recap = recapFit(atelier);
  const details = detailsFit(atelier);

  return (
    <div>
      <EnTeteEtapeFit
        titre="Votre diagnostic FIT"
        aide="Synthèse de votre adéquation produit/marché — à partager avec votre équipe et à revisiter régulièrement."
      />

      <section
        className="border-2 rounded-2xl pt-6 px-6 pb-5 bg-white mb-4 shadow-card transition-colors"
        style={{ borderColor: statut.couleur }}
        aria-label="Statut Market Fit"
      >
        <div className="text-12 font-bold uppercase tracking-[1px] text-muted mb-2">Statut Market Fit</div>
        <div
          className="inline-block text-22 leading-[1.6] font-extrabold px-4 py-2 rounded-[10px] mb-2.5"
          style={{ color: statut.couleur, background: statut.fond }}
        >
          {statut.libelle}
        </div>
        <p className="text-15 text-muted leading-[1.6]">{statut.description}</p>
      </section>

      <div className="grid grid-cols-2 min-[700px]:grid-cols-4 gap-3 mb-4">
        {CASES.map(({ cle, titre, Icone }) => (
          <div key={cle} className="bg-white border border-line rounded-card px-3.5 py-4 shadow-card text-center">
            <div className="w-9 h-9 rounded-[10px] bg-[#eef0fb] text-navy flex items-center justify-center mx-auto mb-2">
              <Icone className="w-[18px] h-[18px]" />
            </div>
            <div className="text-12 font-bold uppercase tracking-[0.8px] text-muted mb-1.5">{titre}</div>
            <div className="text-13 font-semibold text-ink leading-[1.4]">{recap[cle]}</div>
          </div>
        ))}
      </div>

      {DETAILS.map(({ cle, titre }, i) => (
        <div
          key={cle}
          className={`bg-white border border-line rounded-card p-[27.5px] shadow-card transition-colors hover:border-[#c8ccec] ${
            i === DETAILS.length - 1 ? 'mb-[18px]' : 'mb-3'
          }`}
        >
          <div className="text-12 font-bold uppercase tracking-[1px] text-muted mb-3.5">{titre}</div>
          <div className="text-15.5 text-ink leading-[1.6]">{details[cle]}</div>
        </div>
      ))}

      <section
        className="border-2 rounded-[14px] px-[22px] py-5 bg-navy-dark mb-1 transition-colors"
        style={{ borderColor: statut.couleur }}
        aria-label="Prochaine étape recommandée"
      >
        <div className="text-11 font-bold uppercase tracking-[1.2px] text-teal mb-2">Prochaine étape recommandée</div>
        <p className="text-15 text-white/85 leading-[1.6]">{statut.prochaineEtape}</p>
      </section>
    </div>
  );
};

export default DiagnosticFit;
