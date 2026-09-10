import React from 'react';
import type { EtapeFit } from '@/lib/fit/types';
import type { JeuExemples } from '@/lib/exemples';
import { IconeConcurrence, IconeDiagnostic, IconeDifferenciation, IconeOffre, IconeSignaux } from './icones';

/*
 * Colonne « Conseils pour cette étape » de `fit-atelier.html`.
 *
 * L'intro et les points clés relèvent de la méthode : ils sont repris mot pour
 * mot de la maquette. L'encart « Exemple » des étapes 1 à 4 est construit à
 * partir des exemples du métier déclaré ; celui du diagnostic est un conseil
 * de méthode, identique pour tous.
 *
 * Valeurs relevées : panneau navy foncé rayon 18.5 ; en-tête sur voile vert
 * Fit 10 %, titre 15px teal ; corps padding 20.5 ; pictogramme 34px rayon 10.5
 * sur vert 12 %, trait teal ; numéro 12.5px blanc 40 % ; titre 17px blanc ;
 * intro 15px blanc 70 % interligne 1.65 ; puces 14.5px blanc 75 % précédées
 * d'une flèche teal, filet blanc 5 % ; exemple 14px italique blanc 60 % sur
 * blanc 5 %, liseré gauche teal 2px.
 */

interface Conseil {
  numero: string;
  titre: string;
  icone: React.ReactNode;
  intro: string;
  puces: string[];
  exemple: (e: JeuExemples) => string;
}

const minuscule = (t: string) => t.charAt(0).toLowerCase() + t.slice(1);

const CONSEILS: Record<EtapeFit, Conseil> = {
  offre: {
    numero: 'Étape 1',
    titre: 'L’offre',
    icone: <IconeOffre />,
    intro:
      'Une offre claire est la base du Market Fit. Si vous ne pouvez pas l’expliquer simplement, vos clients ne peuvent pas la choisir clairement non plus.',
    puces: [
      'Parlez bénéfice, pas fonctionnalité. « Gain de temps » n’est pas un bénéfice — « 2h libérées par semaine pour se concentrer sur la stratégie » en est un.',
      'Le périmètre négatif est aussi important que le périmètre positif — savoir ce que vous ne faites pas rassure et crédibilise.',
      'Testez votre pitch sur quelqu’un qui ne vous connaît pas. S’il pose des questions de clarification, reformulez.',
      'La lisibilité est un signal d’adéquation : une offre floue génère rarement un Fort FIT.',
    ],
    exemple: (e) => `Avant : « ${e.fit.offre.avant} » → Après : « ${e.fit.offre.pitch}. »`,
  },
  differenciation: {
    numero: 'Étape 2',
    titre: 'La différenciation',
    icone: <IconeDifferenciation />,
    intro:
      'La vraie différenciation, c’est ce que vos clients disent quand ils vous recommandent — pas ce que vous écrivez sur votre site.',
    puces: [
      'Un avantage doit être perçu par le client, pas seulement revendiqué par vous.',
      'La durabilité compte : si votre concurrent peut vous copier en 6 mois, ce n’est pas un avantage stratégique.',
      'Les meilleurs avantages sont souvent liés à votre approche, votre méthode ou votre positionnement — pas à une fonctionnalité.',
      'Demandez à vos clients : « Pourquoi continuez-vous avec nous ? » Leurs réponses valent plus que vos analyses.',
    ],
    exemple: (e) => `Différenciation perçue : ${e.fit.differencePercue}`,
  },
  concurrence: {
    numero: 'Étape 3',
    titre: 'La concurrence',
    icone: <IconeConcurrence />,
    intro:
      'Connaître vos concurrents vous permet de vous positionner clairement — et d’éviter de réinventer ce qui existe déjà ou de vous battre sur des terrains défavorables.',
    puces: [
      'Le concurrent le plus redoutable, c’est souvent le statu quo : « on continue comme avant, sans rien changer ».',
      'Les alternatives indirectes comptent autant que les concurrents directs — incluez-les.',
      'Ce que votre concurrent fait bien est une information précieuse : ne le minimisez pas.',
      'Votre avantage face à eux doit être spécifique, pas générique (« plus humain », « plus flexible » ne suffisent pas).',
    ],
    exemple: (e) =>
      `Alternative principale : ${minuscule(e.fit.concurrent.nom)} (${minuscule(e.fit.concurrent.bien)}). Notre avantage : ${minuscule(e.fit.concurrent.avantage)}.`,
  },
  signaux: {
    numero: 'Étape 4',
    titre: 'Les signaux',
    icone: <IconeSignaux />,
    intro:
      'Les signaux terrain sont les preuves objectives de votre Market Fit. Ils compensent les biais d’auto-évaluation et ancrent votre analyse dans la réalité.',
    puces: [
      'La rétention est le signal le plus fort : si les clients restent et reviennent, c’est que vous créez de la valeur réelle.',
      'Le bouche-à-oreille spontané indique que vos clients perçoivent suffisamment de valeur pour engager leur réputation.',
      'Un NPS élevé (>40) est un bon signe de FIT — mais sans rétention, il ne suffit pas.',
      'Si vous devez pousser fort pour chaque vente, c’est un signal faible. Un bon FIT génère de l’attraction naturelle.',
    ],
    exemple: (e) =>
      `Signaux positifs : ${minuscule(e.fit.signaux.retention)}, ${minuscule(e.fit.signaux.organique)}, ${e.fit.signaux.nps}.`,
  },
  diagnostic: {
    numero: 'Étape 5',
    titre: 'Diagnostic FIT',
    icone: <IconeDiagnostic />,
    intro:
      'Le diagnostic FIT n’est pas une note définitive — c’est une photographie de votre position actuelle, à revisiter chaque trimestre.',
    puces: [
      'Un FIT « En construction » n’est pas un échec — c’est une direction de travail claire.',
      'Partagez cette fiche avec votre équipe ou vos associés : la lucidité collective vaut mieux que la certitude solitaire.',
      'Le FIT évolue avec le marché — ce qui était vrai il y a 2 ans peut ne plus l’être aujourd’hui.',
      'Prochaine étape naturelle : traduire votre FIT en OKR concrets avec le module OSKAR OKR.',
    ],
    exemple: () =>
      'FIT Confirmé ne signifie pas qu’on arrête de questionner. Le marché évolue, la concurrence aussi. Revoyez ce diagnostic chaque trimestre.',
  },
};

export const ConseilsFit: React.FC<{ etape: EtapeFit; exemples: JeuExemples }> = ({ etape, exemples }) => {
  const conseil = CONSEILS[etape];
  if (!conseil) return null;

  return (
    <aside className="lg:sticky lg:top-20" aria-label="Conseils pour cette étape">
      <div className="rounded-[18.5px] overflow-hidden bg-navy-dark">
        <div className="bg-fit/10 border-b border-white/[0.08] px-[18px] py-[18.5px]">
          <div className="text-15 font-bold text-teal">Conseils pour cette étape</div>
        </div>

        <div className="p-[20.5px]">
          <div className="flex items-center gap-3.5 mb-3">
            <span className="w-[34px] h-[34px] rounded-[10.5px] bg-fit/[0.12] text-teal flex items-center justify-center shrink-0">
              {conseil.icone}
            </span>
            <div>
              <div className="text-12.5 font-semibold text-white/40">{conseil.numero}</div>
              <div className="text-17 font-bold text-white">{conseil.titre}</div>
            </div>
          </div>

          <p className="text-15 text-white/70 leading-[1.65] mb-3.5">{conseil.intro}</p>

          <div className="text-12.5 font-bold uppercase tracking-[0.8px] text-teal mb-2">Points clés</div>
          <ul className="mb-3.5">
            {conseil.puces.map((puce) => (
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

          <div className="text-12.5 font-bold uppercase tracking-[0.8px] text-white/40 mb-[7px]">Exemple</div>
          <p className="rounded-[10.5px] bg-white/5 border-l-2 border-teal px-3 py-[11.5px] text-14 italic text-white/60 leading-[1.6]">
            {conseil.exemple(exemples)}
          </p>
        </div>
      </div>
    </aside>
  );
};

export default ConseilsFit;
