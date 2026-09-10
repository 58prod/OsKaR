import React from 'react';
import Link from 'next/link';
import { Clock, CheckSquare, FileText } from 'lucide-react';
import { ModuleLanding, type Repere } from '@/components/layout/ModuleLanding';

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

/*
 * Encart « Ce module complète OsKaR Vision », entre les repères et le bloc
 * final. Valeurs relevées sur fit.html : carte blanche rayon 18.5px, padding
 * 32px ; pictogramme 40px rayon 11px sur #eef0fb ; titre 18.5px / 700 navy ;
 * texte 15px gris interligne 1.5 ; lien 14px / 600 navy, bord 1.5px rayon 9px.
 */
const LienVision: React.FC = () => (
  <div className="bg-white border border-line rounded-[18.5px] p-8 shadow-card">
    <div className="flex flex-col sm:flex-row items-start gap-[18px]">
      <div className="shrink-0 w-10 h-10 rounded-[11px] bg-[#eef0fb] text-navy flex items-center justify-center mt-0.5">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.8}
          strokeLinecap="round"
          strokeLinejoin="round"
          className="w-5 h-5"
          aria-hidden
        >
          <path d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
      <div className="flex-1">
        <h2 className="text-18.5 font-bold text-navy mb-1.5">Ce module complète OsKaR Vision</h2>
        <p className="text-15 leading-[1.5] text-muted">
          La Vision a défini <strong>pour qui</strong> vous travaillez et <strong>quel problème</strong> vous
          résolvez. Le Fit vérifie que votre <strong>offre concrète</strong>, votre{' '}
          <strong>positionnement</strong> et vos <strong>signaux terrain</strong> confirment cette adéquation.
          Commencez par Vision si ce n’est pas encore fait.
        </p>
      </div>
      <Link
        href="/vision"
        className="shrink-0 text-14 font-semibold text-navy border-[1.5px] border-line rounded-[9px] px-3.5 py-2 whitespace-nowrap transition-colors hover:border-teal"
      >
        Voir Vision →
      </Link>
    </div>
  </div>
);

export default function FitPage() {
  return (
    <ModuleLanding
      pilier="fit"
      numero="02"
      nom="OsKaR Fit"
      titreOnglet="OsKaR Fit · Market Fit | OsKaR"
      sousTitreBarre="Vérifiez que votre offre correspond à un vrai besoin marché"
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
      ctaTitre="Prêt à analyser votre Market Fit ?"
      ctaSousTitre="Répondez aux questions étape par étape. Vous pouvez naviguer librement entre les étapes à tout moment."
      ctaHref="/app/fit"
    >
      <LienVision />
    </ModuleLanding>
  );
}
