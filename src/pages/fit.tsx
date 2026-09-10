import React from 'react';
import { Clock, CheckSquare, FileText } from 'lucide-react';
import { EncartLien, ModuleLanding, type Repere } from '@/components/layout/ModuleLanding';

/** Transposition de fit.html. */
const ETAPES = ['Offre', 'Différenciation', 'Concurrence', 'Signaux', 'Diagnostic'] as const;

const REPERES: Repere[] = [
  {
    icon: Clock,
    valeur: '~2h',
    libelle: 'Durée estimée',
    texte: 'À votre rythme, en une ou plusieurs sessions.',
  },
  {
    icon: CheckSquare,
    valeur: '4 étapes',
    libelle: 'Parcours structuré',
    texte: 'Offre · Différenciation · Concurrence · Signaux',
  },
  {
    icon: FileText,
    valeur: 'PDF',
    libelle: 'Export inclus',
    texte: 'Téléchargez votre diagnostic FIT à la fin de l’atelier.',
  },
];

export default function FitPage() {
  return (
    <ModuleLanding
      pilier="fit"
      numero="02"
      nom="OsKaR Fit"
      titreOnglet="OsKaR Fit · Market Fit | OsKaR"
      titre={
        <>
          Vérifiez que votre offre
          <br />
          correspond à un <span className="text-teal">vrai besoin marché</span>
        </>
      }
      description="Un parcours guidé en 4 étapes pour analyser votre offre, affirmer votre différenciation, cartographier votre environnement concurrentiel et mesurer vos signaux terrain."
      reperes={REPERES}
      etapes={ETAPES}
      profilAide="Ces informations nous permettent d’adapter les exemples et conseils tout au long de l’atelier."
      ctaTitre="Prêt à analyser votre Market Fit ?"
      ctaSousTitre="Répondez aux questions étape par étape. Vous pouvez naviguer librement entre les étapes à tout moment."
      ctaHref="/app/fit"
    >
      <EncartLien titre="Ce module complète OsKaR Vision" icone="navy" href="/vision" libelle="Voir Vision →">
        La Vision a défini <strong>pour qui</strong> vous travaillez et <strong>quel problème</strong> vous
        résolvez. Le Fit vérifie que votre <strong>offre concrète</strong>, votre <strong>positionnement</strong>{' '}
        et vos <strong>signaux terrain</strong> confirment cette adéquation. Commencez par Vision si ce n’est pas
        encore fait.
      </EncartLien>
    </ModuleLanding>
  );
}
