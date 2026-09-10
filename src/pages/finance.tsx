import React from 'react';
import { Clock, CheckSquare, FileText } from 'lucide-react';
import { EncartLien, ModuleLanding, type Repere } from '@/components/layout/ModuleLanding';

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
    icon: CheckSquare,
    valeur: '4 étapes',
    libelle: 'Parcours structuré',
    texte: 'Revenus · Coûts & Marge · Rentabilité · Décisions',
  },
  {
    icon: FileText,
    valeur: 'PDF',
    libelle: 'Export inclus',
    texte: 'Téléchargez votre synthèse financière à la fin de l’atelier.',
  },
];

export default function FinancePage() {
  return (
    <ModuleLanding
      pilier="finance"
      numero="03"
      nom="OSKAR Finance"
      titreOnglet="OSKAR Finance · Solidifiez votre modèle économique | Oskar"
      titre={
        <>
          Maîtrisez votre marge.
          <br />
          Solidifiez votre <span className="text-teal">modèle économique.</span>
        </>
      }
      description="Un parcours guidé en 4 étapes pour cartographier vos revenus, analyser vos coûts, calculer votre seuil de rentabilité et prendre des décisions financières structurantes."
      reperes={REPERES}
      etapes={ETAPES}
      profilAide="Ces informations permettent d’adapter les exemples et repères chiffrés tout au long de l’atelier."
      ctaTitre="Prêt à piloter par les chiffres ?"
      ctaSousTitre="Répondez aux questions étape par étape. Vous pouvez naviguer librement entre les étapes à tout moment."
      ctaHref="/app/finance"
    >
      <EncartLien
        titre="Ce module s’appuie sur OSKAR Vision et OSKAR Market Fit"
        icone="finance"
        href="/fit"
        libelle="Voir Fit →"
      >
        Vision a défini <strong>pour qui</strong> vous travaillez et quel problème vous résolvez. Fit a confirmé
        l’adéquation offre-marché. Finance vérifie que votre <strong>modèle économique est viable</strong> : vos
        revenus couvrent vos coûts, votre marge est saine et vos décisions sont fondées sur des chiffres réels.
      </EncartLien>
    </ModuleLanding>
  );
}
