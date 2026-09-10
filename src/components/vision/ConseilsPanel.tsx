import React from 'react';
import { Layers, Users, AlertCircle, TrendingUp, Heart, Compass, Target, CheckCircle2 } from 'lucide-react';
import type { EtapeVision } from '@/lib/vision/types';
import type { JeuExemples } from '@/lib/exemples';

/*
 * Colonne « Conseils pour cette étape » — l'aside bleu de
 * `vision-atelier.html`, à droite du formulaire.
 *
 * L'intro et les puces relèvent de la méthode : elles sont les mêmes pour tout
 * le monde, reprises mot pour mot de la maquette. L'encart « Exemple », lui,
 * est construit à partir du jeu d'exemples du métier déclaré, selon la règle
 * qui vaut pour toute l'application.
 */

interface Conseil {
  numero: string;
  titre: string;
  icone: React.ReactNode;
  intro: string;
  puces: string[];
  /** L'exemple dépend du métier : il est calculé, pas écrit en dur. */
  exemple: (e: JeuExemples) => string;
}

const CONSEILS: Record<EtapeVision, Conseil> = {
  sens: {
    numero: 'Étape 1',
    titre: 'Le sens',
    icone: <Layers className="h-4 w-4" aria-hidden />,
    intro:
      'La raison d’être est le cœur de votre vision. Elle répond à la question : pourquoi existez-vous, au-delà de gagner de l’argent ?',
    puces: [
      'Le pourquoi doit résister à la question « et alors ? » posée trois fois de suite.',
      'Évitez les généralités : « aider les entreprises à grandir » est trop vague.',
      'Le comment est votre différence réelle — ce que vous faites autrement que les autres.',
      'Le quoi découle logiquement des deux premiers.',
    ],
    exemple: (e) => `Pourquoi : ${e.vision.pourquoi}. Comment : ${e.vision.comment}. Quoi : ${e.vision.quoi}.`,
  },
  cibles: {
    numero: 'Étape 2',
    titre: 'Cibles & acteurs',
    icone: <Users className="h-4 w-4" aria-hidden />,
    intro:
      'Cartographier vos cibles et vos acteurs vous aide à prioriser vos efforts et à comprendre votre écosystème.',
    puces: [
      'Une cible bien définie vaut mieux que cinq cibles floues.',
      'Distinguez vos cibles principales de celles qui viendront plus tard.',
      'Les acteurs à fort pouvoir et fort intérêt sont vos alliés.',
      'Les acteurs à fort pouvoir mais faible intérêt sont à surveiller.',
    ],
    exemple: (e) => `Cible principale : ${e.vision.cible}. Acteur clé : ${e.vision.acteur}.`,
  },
  probleme: {
    numero: 'Étape 3',
    titre: 'Le problème',
    icone: <AlertCircle className="h-4 w-4" aria-hidden />,
    intro:
      'Un diagnostic honnête de la situation actuelle est le point de départ indispensable de toute vision crédible.',
    puces: [
      'Soyez honnête : une vision construite sur des illusions ne tient pas.',
      'Décrivez ce que vivent vos clients, pas la solution que vous vendez.',
      'L’écart entre la réalité et la vision crée l’énergie du changement.',
      'Faites valider votre perception par vos clients actuels.',
    ],
    exemple: (e) => `Vos clients rencontrent ${e.vision.probleme}.`,
  },
  projection: {
    numero: 'Étape 4',
    titre: 'La projection',
    icone: <TrendingUp className="h-4 w-4" aria-hidden />,
    intro:
      'Visualiser votre organisation dans un an, chiffres à l’appui, rend la vision utilisable au quotidien.',
    puces: [
      'Soyez ambitieux mais crédible : une projection atteignable motive plus qu’un rêve.',
      'Pensez aux deux dimensions, l’entreprise et vous. Les deux comptent.',
      'Les chiffres ancrent la vision dans le réel.',
      'La partie personnelle protège de l’épuisement : quelle vie voulez-vous ?',
    ],
    exemple: (e) =>
      `Entreprise : ${e.vision.projection.ca}, ${e.vision.projection.clients}, ${e.vision.projection.offre}, ${e.vision.projection.organisation}. Personnel : 4 jours par semaine, pas de rendez-vous le vendredi.`,
  },
  valeurs: {
    numero: 'Étape 5',
    titre: 'Les valeurs',
    icone: <Heart className="h-4 w-4" aria-hidden />,
    intro:
      'Les valeurs ne sont pas des mots sur un mur : ce sont des règles de décision concrètes qui guident vos choix.',
    puces: [
      'Trois valeurs au maximum : au-delà, aucune n’est vraiment prioritaire.',
      'Chaque valeur doit avoir une règle observable.',
      'Testez-la : « si je dois choisir entre ceci et cette valeur, que fais-je ? »',
      'Une valeur doit parfois coûter quelque chose, sinon c’est un vœu pieux.',
    ],
    exemple: (e) =>
      e.vision.valeurs
        .slice(0, 2)
        .map((v) => `${v.nom} → ${v.traduction}`)
        .join('. '),
  },
  vision: {
    numero: 'Étape 6',
    titre: 'La synthèse',
    icone: <Compass className="h-4 w-4" aria-hidden />,
    intro:
      'C’est le moment de cristalliser votre vision en une formule claire, que vous et votre équipe pouvez retenir.',
    puces: [
      'Une bonne vision tient en une ou deux phrases.',
      'Elle doit inspirer autant qu’informer : c’est une boussole, pas un plan.',
      'Testez-la : quelqu’un qui ne vous connaît pas comprend-il tout de suite ?',
      'Relisez-la dans six mois — elle doit encore sonner juste.',
    ],
    exemple: (e) => `« ${e.vision.pourquoi}. ${e.vision.comment}. »`,
  },
  objectifs: {
    numero: 'Étape 7',
    titre: 'Les objectifs',
    icone: <Target className="h-4 w-4" aria-hidden />,
    intro:
      'Les objectifs annuels transforment la vision en actions. Que devez-vous accomplir cette année pour avancer vers elle ?',
    puces: [
      'Trois objectifs au maximum : au-delà, vous vous dispersez.',
      'Chaque objectif doit être relié à votre vision.',
      'La mesure est indispensable : « augmenter le chiffre d’affaires » n’est pas un objectif.',
      'Équilibrez l’entreprise et le personnel : les deux se nourrissent.',
    ],
    exemple: (e) => {
      const o = e.objectifs[0];
      return `${o.titre}. Mesure : ${o.cible} ${o.unite} au 31/12.`;
    },
  },
  synthese: {
    numero: 'Étape 8',
    titre: 'Récapitulatif',
    icone: <CheckCircle2 className="h-4 w-4" aria-hidden />,
    intro: 'Votre fiche de cap est prête. C’est votre boussole pour les prochains mois.',
    puces: [
      'Partagez-la avec votre équipe ou vos associés.',
      'Affichez-la dans votre espace de travail : la visibilité crée la discipline.',
      'Reprenez-la chaque trimestre, lors de vos points stratégiques.',
      'Imprimez-la et envoyez-la à votre coach OsKaR.',
    ],
    exemple: () =>
      'Prochaine étape : transformer ces trois objectifs en OKR trimestriels avec le pilier OsKaR OKR.',
  },
};

export const ConseilsPanel: React.FC<{ etape: EtapeVision; exemples: JeuExemples }> = ({ etape, exemples }) => {
  const conseil = CONSEILS[etape];
  if (!conseil) return null;

  return (
    <aside className="lg:sticky lg:top-24" aria-label="Conseils pour cette étape">
      <div className="rounded-card overflow-hidden border border-vision/20 shadow-card">
        <div className="bg-[linear-gradient(135deg,#151f5e_0%,#1e2d7d_100%)] px-5 py-3.5">
          <div className="text-13 font-bold text-white">Conseils pour cette étape</div>
        </div>
        <div className="bg-white p-5">
          <div className="flex items-center gap-2.5 mb-3">
            <span className="w-9 h-9 rounded-lg bg-vision-light text-vision-dark flex items-center justify-center shrink-0">
              {conseil.icone}
            </span>
            <div>
              <div className="text-11 font-bold uppercase tracking-wider text-muted">{conseil.numero}</div>
              <div className="text-15.5 font-bold text-navy">{conseil.titre}</div>
            </div>
          </div>

          <p className="text-13.5 text-ink leading-[1.6] mb-4">{conseil.intro}</p>

          <ul className="space-y-2 mb-4">
            {conseil.puces.map((puce) => (
              <li key={puce} className="flex items-start gap-2 text-13 text-muted leading-[1.5]">
                <span className="text-vision font-bold shrink-0" aria-hidden>
                  •
                </span>
                <span>{puce}</span>
              </li>
            ))}
          </ul>

          <div className="rounded-lg bg-vision-light/50 border border-vision/20 p-3.5">
            <div className="text-11 font-bold uppercase tracking-wider text-vision-dark mb-1.5">Exemple</div>
            <p className="text-13 text-ink leading-[1.6]">{conseil.exemple(exemples)}</p>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default ConseilsPanel;
