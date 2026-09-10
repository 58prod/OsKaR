import React from 'react';
import { LIBELLES_ETAPES_FINANCE, ETAPES_FINANCE, type EtapeFinance } from '@/lib/finance/types';

/*
 * Colonne « Conseils Coach » de `finance-atelier.html`.
 *
 * Elle diffère de celle de Fit : le pictogramme et le numéro d'étape sont
 * dans l'en-tête, et la plupart des étapes montrent des repères chiffrés
 * (seuils, marges par secteur) plutôt qu'un exemple. Ces repères relèvent de
 * la méthode : ils sont repris mot pour mot de la maquette, identiques pour
 * tous.
 *
 * Valeurs relevées : panneau navy foncé rayon 18.5 ; en-tête sur voile orange
 * 10 %, pictogramme 34px rayon 10.5 sur orange 12 %, titre 15px / 700 orange,
 * numéro 12.5px blanc 40 % ; corps padding 20.5 ; intro 15px blanc 70 % ;
 * titres 12.5px / 700 orange en majuscules ; puces 14.5px blanc 75 % à flèche
 * teal ; encart 14px italique sur blanc 5 %, liseré gauche orange ; repères
 * 13px blanc 70 % avec pastilles 11px / 700 vertes ou ambre.
 */

type Repere = [libelle: string, valeur: string, ton: 'bon' | 'vigilance'];

type Section =
  | { titre: string; discret?: boolean; puces: string[] }
  | { titre: string; discret?: boolean; reperes: Repere[] }
  | { titre: string; discret?: boolean; texte: React.ReactNode };

const CONSEILS: Record<EtapeFinance, { intro: string; sections: Section[] }> = {
  revenus: {
    intro:
      'Un modèle sain repose sur des revenus prévisibles. Distinguer récurrent et ponctuel change tout dans la façon de piloter.',
    sections: [
      {
        titre: 'Points de vigilance',
        puces: [
          'Visez 60-70% de revenus récurrents pour un modèle stable',
          'Si un seul client représente +30% du CA, c’est un risque à traiter',
          'Ne confondez pas CA facturé et CA encaissé',
        ],
      },
      {
        titre: 'Repères sectoriels',
        discret: true,
        reperes: [
          ['Revenus récurrents', '≥ 60%', 'bon'],
          ['Concentration client', '≤ 30%', 'vigilance'],
          ['Nb sources', '≥ 3', 'bon'],
        ],
      },
    ],
  },
  couts: {
    intro: 'La marge brute révèle la véritable rentabilité de votre activité, avant les charges de structure.',
    sections: [
      {
        titre: 'Marge brute cible par secteur',
        reperes: [
          ['Services / Conseil', '60-80%', 'bon'],
          ['SaaS / Digital', '70-85%', 'bon'],
          ['Commerce / Produit', '30-50%', 'vigilance'],
          ['Industrie', '20-40%', 'vigilance'],
        ],
      },
      {
        titre: 'À ne pas oublier',
        puces: [
          'Le temps dirigeant est un coût souvent omis',
          'Calculez la marge par offre, pas seulement globale',
          'Un coût fixe élevé = risque si le CA baisse',
        ],
      },
    ],
  },
  rentabilite: {
    intro:
      'Connaître son point mort transforme la façon de prendre des décisions. C’est un indicateur de survie autant que de pilotage.',
    sections: [
      {
        titre: 'Seuils de vigilance',
        reperes: [
          ['Runway', '≥ 6 mois', 'bon'],
          ['Marge de sécurité', '≥ 20%', 'bon'],
          ['Charges fixes / CA', '≤ 40%', 'vigilance'],
        ],
      },
      {
        titre: 'Règle des 6 mois',
        puces: [
          'Runway < 6 mois → action immédiate requise',
          '6 à 12 mois → vigilance accrue',
          '+12 mois → marge pour investir sereinement',
        ],
      },
    ],
  },
  decisions: {
    intro: 'Au-delà de 3 priorités, rien ne bouge. Choisissez les actions à plus fort impact, pas les plus faciles.',
    sections: [
      {
        titre: 'Critère de sélection',
        puces: [
          'Chaque décision doit solidifier le modèle en 90 jours',
          'Un responsable = une action — jamais « l’équipe »',
          'Quantifiez l’impact attendu, même approximativement',
        ],
      },
      {
        titre: 'Prochain rituel',
        texte: (
          <>
            Programmez un <strong className="text-white">Cash Flash</strong> hebdomadaire de 15 min pour suivre
            l’impact de ces décisions dès la semaine prochaine.
          </>
        ),
      },
    ],
  },
  synthese: {
    intro:
      'Félicitations ! Vous avez complété l’atelier Finance. Votre modèle économique est maintenant documenté et vos priorités sont claires.',
    sections: [
      {
        titre: 'La suite recommandée',
        puces: [
          'Partagez ce bilan avec votre équipe de direction',
          'Programmez un Cash Flash cette semaine',
          'Passez au module OKR pour traduire ces décisions en objectifs mesurables',
        ],
      },
    ],
  },
};

const ENCART =
  'rounded-[10.5px] bg-white/5 border-l-2 border-finance px-3 py-[11.5px] text-14 italic text-white/60 leading-[1.6]';

export const ConseilsFinance: React.FC<{ etape: EtapeFinance }> = ({ etape }) => {
  const conseil = CONSEILS[etape];
  const numero = ETAPES_FINANCE.indexOf(etape) + 1;

  return (
    <aside className="lg:sticky lg:top-20" aria-label="Conseils Coach">
      <div className="rounded-[18.5px] overflow-hidden bg-navy-dark">
        <div className="flex items-center gap-[11.5px] bg-finance/10 border-b border-white/[0.08] px-[18px] py-[18.5px]">
          <span className="w-[34px] h-[34px] rounded-[10.5px] bg-finance/[0.12] text-finance-dark flex items-center justify-center shrink-0">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.8}
              strokeLinecap="round"
              strokeLinejoin="round"
              className="w-4 h-4"
              aria-hidden
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          </span>
          <div>
            <div className="text-15 font-bold text-finance">Conseils Coach</div>
            <div className="text-12.5 font-semibold text-white/40">
              Étape {numero} · {LIBELLES_ETAPES_FINANCE[etape]}
            </div>
          </div>
        </div>

        <div className="p-[20.5px]">
          <p className="text-15 text-white/70 leading-[1.65] mb-3.5">{conseil.intro}</p>

          {conseil.sections.map((s, i) => {
            // Un titre qui suit un encart (sans marge basse) est décalé de 14px.
            const precedent = conseil.sections[i - 1];
            const apresEncart = precedent !== undefined && !('puces' in precedent);
            return (
              <div key={s.titre}>
                <div
                  className={`text-12.5 font-bold uppercase tracking-[0.8px] ${
                    s.discret ? 'text-white/40 mb-[7px]' : 'text-finance mb-2'
                  } ${apresEncart ? 'mt-3.5' : ''}`}
                >
                  {s.titre}
                </div>
                {'puces' in s && (
                  <ul className="mb-3.5">
                    {s.puces.map((puce) => (
                      <li
                        key={puce}
                        className="relative pl-3.5 py-[5px] text-14.5 text-white/75 leading-[1.55] border-b border-white/5 last:border-b-0"
                      >
                        <span className="absolute left-0 top-[5px] text-12.5 font-bold text-teal" aria-hidden>
                          →
                        </span>
                        {puce}
                      </li>
                    ))}
                  </ul>
                )}
                {'reperes' in s && (
                  <div className={ENCART}>
                    {s.reperes.map(([libelle, valeur, ton]) => (
                      <div
                        key={libelle}
                        className="flex justify-between items-center py-[5px] text-13 text-white/70 border-b border-white/[0.08] last:border-b-0"
                      >
                        {libelle}
                        <span
                          className={`text-11 font-bold px-2 py-0.5 rounded-[20px] ${
                            ton === 'bon' ? 'bg-[#dcfce7] text-[#15803d]' : 'bg-[#fef3c7] text-[#92400e]'
                          }`}
                        >
                          {valeur}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
                {'texte' in s && <p className={ENCART}>{s.texte}</p>}
              </div>
            );
          })}
        </div>
      </div>
    </aside>
  );
};

export default ConseilsFinance;
