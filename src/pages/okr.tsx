import React from 'react';
import { Clock, ListChecks, Repeat } from 'lucide-react';
import { ModuleLanding, type Repere } from '@/components/layout/ModuleLanding';

/*
 * Page de présentation du pilier OKR — libre d'accès, comme celles de Vision,
 * Fit, Finance et Team.
 *
 * L'atelier lui-même vit sur /app/okr : il demande un compte, et ses étapes 2
 * et 3 font partie des formules. Cette page-ci n'a donc aucune restriction :
 * c'est elle qui doit donner envie d'aller plus loin.
 */

const ETAPES = ['Objectifs annuels', 'Trimestre', 'Actions'] as const;

const REPERES: Repere[] = [
  {
    icon: Clock,
    valeur: '~45 min',
    libelle: 'Pour démarrer',
    texte: 'Trois objectifs pour l’année, puis votre premier trimestre.',
  },
  {
    icon: ListChecks,
    valeur: '3 étapes',
    libelle: 'Parcours guidé',
    texte: 'Objectifs annuels · Trimestre et résultats clés · Plan d’actions',
  },
  {
    icon: Repeat,
    valeur: 'Chaque trimestre',
    libelle: 'Un rythme qui tient',
    texte: 'Vous reprenez le parcours à chaque trimestre, sans repartir de zéro.',
  },
];

export default function OkrPresentationPage() {
  return (
    <ModuleLanding
      pilier="okr"
      numero="04"
      nom="OsKaR OKR"
      titreOnglet="OsKaR OKR · Transformez vos ambitions en résultats | OsKaR"
      sousTitreBarre="Trois objectifs pour l’année, un trimestre à la fois"
      titre={
        <>
          Trois objectifs pour l’année. Des résultats{' '}
          <span className="text-teal">que vous mesurez</span>.
        </>
      }
      description="Un parcours en 3 étapes pour fixer vos objectifs de l’année avec une cible chiffrée, les décliner en résultats clés chaque trimestre, puis piloter vos actions au quotidien."
      reperes={REPERES}
      etapes={ETAPES}
      ctaTitre="Prêt à poser vos objectifs ?"
      ctaSousTitre="La première étape est offerte avec un compte gratuit : vos trois objectifs annuels, à garder et à reprendre quand vous voulez."
      ctaHref="/app/okr"
    />
  );
}
