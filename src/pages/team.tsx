import React from 'react';
import { Clock, ListChecks, FileDown } from 'lucide-react';
import { ModuleLanding, type Repere } from '@/components/layout/ModuleLanding';

/** Transposition de team.html. */
const ETAPES = [
  'Diagnostic',
  'Rôles',
  'Cohésion',
  'Rituels',
  'Feedback',
  'Plan d’action',
] as const;

const REPERES: Repere[] = [
  {
    icon: Clock,
    valeur: '~1h',
    libelle: 'Durée estimée',
    texte: 'À votre rythme, en une ou plusieurs sessions.',
  },
  {
    icon: ListChecks,
    valeur: '6 étapes',
    libelle: 'Parcours structuré',
    texte: 'Diagnostic · Rôles · Cohésion · Rituels · Feedback · Plan d’action',
  },
  {
    icon: FileDown,
    valeur: 'PDF',
    libelle: 'Export inclus',
    texte: 'Téléchargez votre feuille de route Team à la fin de l’atelier.',
  },
];

export default function TeamPillarPage() {
  return (
    <ModuleLanding
      pilier="team"
      numero="05"
      nom="OsKaR Team"
      titreOnglet="OsKaR Team · Faire avancer vos équipes ensemble | OsKaR"
      sousTitreBarre="Diagnostiquez la dynamique de votre équipe et posez les rituels qui la font avancer"
      titre={
        <>
          Unir ses équipes pour qu’elles se sentent{' '}
          <span className="text-teal">utiles et avancent ensemble</span>
        </>
      }
      description="Un parcours structuré pour diagnostiquer la dynamique de votre équipe, clarifier les rôles, renforcer la cohésion et mettre en place les rituels qui font avancer collectivement."
      reperes={REPERES}
      etapes={ETAPES}
      ctaTitre="Prêt à faire grandir votre équipe ?"
      ctaSousTitre="Ce module arrive bientôt. Commencez par les piliers Vision, Fit, Finance et OKR pour poser des bases solides."
      ctaIndisponible
      ctaMentionIndispo="Bientôt disponible"
    />
  );
}
