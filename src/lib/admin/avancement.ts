import { ETAPES_VISION, NB_ETAPES_VISION, etapeRemplie, fusionnerVision } from '@/lib/vision/types';
import { ETAPES_FIT, etapeFitRemplie, fusionnerFit } from '@/lib/fit/types';
import { ETAPES_FINANCE, etapeFinanceRemplie, fusionnerFinance } from '@/lib/finance/types';
import type { FicheCompte, PilierAdmin } from './types';

/*
 * Où en est un compte dans chaque atelier, pour la fiche de l'administration.
 * Les étapes sont comptées avec les mêmes fonctions que les barres d'étapes
 * des ateliers : ce que voit l'administrateur est ce que voit la personne.
 * La synthèse (Vision, Finance) et le diagnostic (Fit) ne comptent pas : ils se
 * calculent, ils ne se remplissent pas.
 */

export interface AvancementPilier {
  commence: boolean;
  faites: number;
  /** Nombre d'étapes à remplir ; null quand l'atelier n'a pas encore d'étapes. */
  total: number | null;
}

export function avancementDuCompte(f: FicheCompte): Record<PilierAdmin, AvancementPilier> {
  const vision = f.vision ? fusionnerVision(f.vision) : null;
  const fit = f.fit ? fusionnerFit(f.fit) : null;
  const finance = f.finance ? fusionnerFinance(f.finance) : null;
  const okr = [f.okr.ambitions, f.okr.objectifs, f.okr.actions].filter((n) => n > 0).length;

  return {
    vision: {
      commence: !!vision,
      faites: vision ? ETAPES_VISION.slice(0, NB_ETAPES_VISION).filter((e) => etapeRemplie(vision, e)).length : 0,
      total: NB_ETAPES_VISION,
    },
    fit: {
      commence: !!fit,
      faites: fit ? ETAPES_FIT.filter((e) => e !== 'diagnostic' && etapeFitRemplie(fit, e)).length : 0,
      total: ETAPES_FIT.length - 1,
    },
    finance: {
      commence: !!finance,
      faites: finance ? ETAPES_FINANCE.filter((e) => e !== 'synthese' && etapeFinanceRemplie(finance, e)).length : 0,
      total: ETAPES_FINANCE.length - 1,
    },
    okr: { commence: okr > 0, faites: okr, total: 3 },
    team: { commence: f.team != null, faites: 0, total: null },
  };
}
