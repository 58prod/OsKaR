import React from 'react';
import { useRouter } from 'next/router';
import { ArrowRight, Clock, ListChecks, FileDown, Layers } from 'lucide-react';
import { ModuleLanding, type Repere } from '@/components/layout/ModuleLanding';

/** Transposition de finance.html. */
const ETAPES = ['Revenus', 'Coûts & Marge', 'Rentabilité', 'Décisions'] as const;

const REPERES: Repere[] = [
  {
    icon: Clock,
    valeur: '~90 min',
    libelle: 'Durée estimée',
    texte: 'À votre rythme, en une ou plusieurs sessions.',
  },
  {
    icon: ListChecks,
    valeur: '4 étapes',
    libelle: 'Parcours structuré',
    texte: 'Revenus · Coûts & Marge · Rentabilité · Décisions',
  },
  {
    icon: FileDown,
    valeur: 'PDF',
    libelle: 'Export inclus',
    texte: 'Téléchargez votre synthèse financière à la fin de l’atelier.',
  },
];

export default function FinancePage() {
  const router = useRouter();

  return (
    <ModuleLanding
      pilier="finance"
      numero="03"
      nom="OsKaR Finance"
      titreOnglet="OsKaR Finance · Solidifiez votre modèle économique | OsKaR"
      sousTitreBarre="Maîtrisez votre marge et vérifiez la viabilité de votre modèle économique"
      titre={
        <>
          Maîtrisez votre marge. Solidifiez votre{' '}
          <span className="text-teal">modèle économique</span>.
        </>
      }
      description="Un parcours guidé en 4 étapes pour cartographier vos revenus, analyser vos coûts, calculer votre seuil de rentabilité et prendre des décisions financières structurantes."
      reperes={REPERES}
      etapes={ETAPES}
      ctaTitre="Prêt à piloter par les chiffres ?"
      ctaSousTitre="Répondez aux questions étape par étape. Vous pouvez naviguer librement entre les étapes à tout moment."
      ctaIndisponible
    >
      {/* Bloc propre au module Finance : l'enchaînement avec Vision et Fit. */}
      <div className="bg-white rounded-2xl border border-line px-[22px] py-[23px] sm:p-8 shadow-card">
        <div className="flex flex-col sm:flex-row gap-5">
          <div className="w-10 h-10 shrink-0 rounded-[11.5px] bg-finance-light text-finance-dark flex items-center justify-center">
            <Layers className="h-5 w-5" aria-hidden />
          </div>
          <div className="flex-1">
            <h2 className="text-18.5 font-bold text-navy mb-1.5">
              Ce module s&rsquo;appuie sur OsKaR Vision et OsKaR Fit
            </h2>
            <p className="text-15 text-ink mb-4">
              Vision a défini <strong className="font-bold">pour qui</strong> vous travaillez et
              quel problème vous résolvez. Fit a confirmé l&rsquo;adéquation offre-marché. Finance
              vérifie que votre <strong className="font-bold">modèle économique est viable</strong>{' '}
              : vos revenus couvrent vos coûts, votre marge est saine et vos décisions sont fondées
              sur des chiffres réels.
            </p>
            <div className="flex flex-wrap gap-5">
              <button
                onClick={() => router.push('/vision')}
                className="inline-flex items-center gap-1.5 text-15 font-bold text-navy hover:text-navy-light transition-colors"
              >
                Voir Vision <ArrowRight className="h-4 w-4" aria-hidden />
              </button>
              <button
                onClick={() => router.push('/fit')}
                className="inline-flex items-center gap-1.5 text-15 font-bold text-navy hover:text-navy-light transition-colors"
              >
                Voir Fit <ArrowRight className="h-4 w-4" aria-hidden />
              </button>
            </div>
          </div>
        </div>
      </div>
    </ModuleLanding>
  );
}
