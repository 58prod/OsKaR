import React from 'react';
import { Clock, CheckSquare, FileText } from 'lucide-react';
import { ModuleLanding, type Repere } from '@/components/layout/ModuleLanding';

/** Transposition de vision.html. */
const ETAPES = [
  'Sens',
  'Cibles & Acteurs',
  'Réalité',
  'Projection',
  'Valeurs',
  'Synthèse',
  'Objectifs',
  'Récap',
] as const;

const REPERES: Repere[] = [
  {
    icon: Clock,
    valeur: '~1h30',
    libelle: 'Durée estimée',
    texte: 'À votre rythme, en une ou plusieurs sessions.',
  },
  {
    icon: CheckSquare,
    valeur: '8 étapes',
    libelle: 'Parcours structuré',
    texte: 'Sens · Cibles · Réalité · Projection · Valeurs · Synthèse · Objectifs · Récap',
  },
  {
    icon: FileText,
    valeur: 'PDF',
    libelle: 'Export inclus',
    texte: 'Téléchargez votre fiche de cap à la fin de l’atelier.',
  },
];

export default function VisionPage() {
  return (
    <ModuleLanding
      pilier="vision"
      numero="01"
      nom="OSKAR Vision"
      titreOnglet="OSKAR Vision · Clarifiez votre cap | Oskar"
      titre={
        <>
          Clarifiez votre cap,
          <br />
          transformez-le en <span className="text-teal">objectifs concrets</span>
        </>
      }
      description="Un parcours guidé en 8 étapes pour formaliser votre vision, cartographier vos cibles et acteurs, définir vos valeurs et poser les 3 objectifs qui comptent vraiment."
      reperes={REPERES}
      etapes={ETAPES}
      ctaTitre="Prêt à construire votre vision ?"
      ctaSousTitre="Répondez aux questions étape par étape. Vous pouvez naviguer librement entre les étapes à tout moment."
      ctaHref="/app/vision"
    />
  );
}
