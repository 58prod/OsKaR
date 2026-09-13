import React from 'react';
import Link from 'next/link';
import { PageLegale } from '@/components/legal/PageLegale';
import { EDITEUR, EMAIL_DONNEES } from '@/lib/legal/editeur';

export default function DroitsRgpdPage() {
  return (
    <PageLegale
      titre="Vos droits RGPD"
      description="Les droits dont vous disposez sur vos données personnelles et la manière de les exercer auprès d’Oskar."
      chapeau={
        <p>
          Vos données vous appartiennent. Le Règlement général sur la protection des données (RGPD) vous donne des droits
          simples à exercer, et nous y répondons sous un mois.
        </p>
      }
    >
      <h2>Vos droits</h2>
      <ul>
        <li>
          <strong>Accès</strong> : savoir quelles données nous détenons sur vous et en obtenir une copie.
        </li>
        <li>
          <strong>Rectification</strong> : corriger une donnée inexacte ou incomplète.
        </li>
        <li>
          <strong>Effacement</strong> : faire supprimer vos données.
        </li>
        <li>
          <strong>Portabilité</strong> : récupérer vos données dans un format réutilisable.
        </li>
        <li>
          <strong>Opposition et limitation</strong> : vous opposer à un traitement ou en demander la suspension.
        </li>
        <li>
          <strong>Directives</strong> : indiquer ce que deviennent vos données après votre décès.
        </li>
      </ul>

      <h2>Comment les exercer</h2>
      <ul>
        <li>
          Vos informations de compte se modifient directement dans vos <Link href="/settings">paramètres</Link>, d’où
          vous pouvez aussi supprimer votre compte.
        </li>
        <li>
          Pour toute autre demande, dont l’effacement complet de vos données ou leur copie, écrivez à{' '}
          <a href={`mailto:${EMAIL_DONNEES}`}>{EMAIL_DONNEES}</a> depuis l’adresse de votre compte.
        </li>
      </ul>
      <p>
        Nous vous répondons dans un délai d’un mois. Un justificatif d’identité ne vous sera demandé qu’en cas de doute
        raisonnable sur votre identité.
      </p>

      <h2>Réclamation</h2>
      <p>
        Si vous estimez que vos droits ne sont pas respectés, vous pouvez adresser une réclamation à la Commission
        nationale de l’informatique et des libertés (CNIL) sur{' '}
        <a href="https://www.cnil.fr/fr/plaintes" target="_blank" rel="noopener noreferrer">
          cnil.fr
        </a>
        . N’hésitez pas à nous écrire d’abord : la plupart des questions se règlent simplement.
      </p>

      <h2>Responsable du traitement</h2>
      <p>
        {EDITEUR.nom}, {EDITEUR.siege} — <a href={`mailto:${EMAIL_DONNEES}`}>{EMAIL_DONNEES}</a>.
      </p>
    </PageLegale>
  );
}
