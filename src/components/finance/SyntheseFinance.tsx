import React from 'react';
import Link from 'next/link';
import { BTN_OUTLINE, BTN_PRIMARY } from '@/components/okr/okrFlux';
import { BTN_GHOST, BTN_NAVY } from '@/components/atelier/champs';

/*
 * Étape 5 de `finance-atelier.html` : « Atelier Finance terminé ! », puis le
 * bandeau « Prochaine étape OSKAR » vers le pilier OKR.
 *
 * Valeurs relevées : bloc centré padding 60/40 ; pastille 64px orange clair,
 * coche 28px ; titre 28px / 800 navy ; texte 16px gris borné à 440px, 28px
 * dessous ; boutons espacés de 12. Bandeau navy rayon 12, padding 23/24,
 * halo vert en haut à droite ; surtitre 11.5px / 700 blanc 40 % ; texte
 * 17px / 700 blanc, « OSKAR OKR » en teal.
 */

export const SyntheseFinance: React.FC<{ onRevoir: () => void; onPdf: () => void }> = ({ onRevoir, onPdf }) => (
  <div>
    <div className="text-center px-10 py-[60px]">
      <div className="w-16 h-16 rounded-full bg-finance-light text-finance-dark flex items-center justify-center mx-auto mb-5">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          className="w-7 h-7"
          aria-hidden
        >
          <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
          <polyline points="22 4 12 14.01 9 11.01" />
        </svg>
      </div>
      <h2 className="text-[28px] leading-[1.6] font-extrabold text-navy mb-2.5">Atelier Finance terminé !</h2>
      <p className="text-16 leading-[1.6] text-muted max-w-[440px] mx-auto mb-7">
        Vous avez cartographié vos revenus, analysé vos coûts, calculé votre seuil de rentabilité et formalisé vos
        décisions prioritaires. Votre modèle économique est maintenant plus lisible.
      </p>
      <div className="flex gap-3 justify-center flex-wrap">
        <button type="button" onClick={onRevoir} className={BTN_GHOST}>
          ← Revoir l’atelier
        </button>
        <button type="button" onClick={onPdf} className={BTN_OUTLINE}>
          Exporter PDF
        </button>
        <Link href="/app/okr" className={BTN_NAVY}>
          Module suivant — OKR →
        </Link>
      </div>
    </div>

    <div className="relative overflow-hidden rounded-card px-6 py-[23px] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-[18.5px] bg-[linear-gradient(135deg,#151f5e,#1e2d7d)]">
      <span
        className="absolute -right-[30px] -top-[30px] w-[140px] h-[140px] rounded-full bg-[radial-gradient(circle,rgba(34,197,94,0.15)_0%,transparent_70%)]"
        aria-hidden
      />
      <div className="relative z-[1]">
        <div className="text-11.5 font-bold uppercase tracking-[1.38px] text-white/40 mb-1">Prochaine étape Oskar</div>
        <div className="text-17 font-bold text-white">
          Passez au module <span className="text-teal">OSKAR OKR</span> — Transformer vos ambitions en résultats
          mesurables
        </div>
      </div>
      <Link href="/app/okr" className={`${BTN_PRIMARY} relative z-[1] shrink-0`}>
        Démarrer OKR →
      </Link>
    </div>
  </div>
);

export default SyntheseFinance;
