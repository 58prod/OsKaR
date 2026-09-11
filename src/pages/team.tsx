import React from 'react';
import { Clock, ListChecks, FileText } from 'lucide-react';
import { ModuleLanding, type Repere } from '@/components/layout/ModuleLanding';

/*
 * Page de présentation du pilier Team. La maquette team.html annonçait un
 * atelier en 6 étapes, abandonné le 2026-09-11 : Team sera un ensemble de
 * conseils au dirigeant, rangés en 5 familles, chacun appuyé d'un document
 * ou d'un lien vers un outil (contenus : Oskar/team/contenus-team.md).
 */
const FAMILLES = [
  'Donner le cap',
  'Donner le rythme',
  'Faire confiance',
  'Entretenir le lien',
  'Désamorcer les tensions',
] as const;

const REPERES: Repere[] = [
  {
    icon: Clock,
    valeur: '~15 min',
    libelle: 'Pour tout lire',
    texte: 'Puis choisissez 3 conseils à appliquer dès cette semaine.',
  },
  {
    icon: ListChecks,
    valeur: '13 conseils',
    libelle: 'En 5 familles',
    texte: 'Cap · Rythme · Confiance · Lien · Tensions',
  },
  {
    icon: FileText,
    valeur: '10 documents',
    libelle: 'Prêts à l’emploi',
    texte: 'Pré-remplis avec vos objectifs et votre roadmap, à télécharger.',
  },
];

export default function TeamPillarPage() {
  return (
    <ModuleLanding
      pilier="team"
      numero="05"
      nom="OSKAR Team"
      titreOnglet="OSKAR Team · Des équipes motivées qui avancent ensemble | Oskar"
      titre={
        <>
          Des gens heureux de travailler
          <br />
          <span className="text-teal">produisent plus</span>
        </>
      }
      description="Des conseils simples pour garder votre équipe motivée, avancer ensemble et désamorcer les tensions, avec les documents prêts à l’emploi pour les appliquer dès cette semaine."
      reperes={REPERES}
      etapes={FAMILLES}
      profilAide="Ces informations nous permettent d’adapter les exemples des conseils à votre métier."
      ctaTitre="Prêt à faire grandir votre équipe ?"
      ctaSousTitre="Ce module arrive bientôt. En attendant, posez vos objectifs dans OSKAR OKR : ce sont eux que vous afficherez devant votre équipe."
      ctaLibelle="Voir les conseils"
      ctaIndisponible
    />
  );
}
