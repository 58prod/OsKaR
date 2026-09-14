import React from 'react';
import Link from 'next/link';
import { Fiche, PageLegale } from '@/components/legal/PageLegale';
import { TRACEURS, libelleCle } from '@/lib/legal/traceurs';

export default function CookiesPage() {
  return (
    <PageLegale
      titre="Cookies"
      description="Oskar n’utilise aucun cookie publicitaire : seulement des traceurs nécessaires et une mesure de fréquentation anonyme."
      chapeau={
        <p>
          Oskar n’utilise ni cookie publicitaire, ni bouton de réseau social, ni outil de mesure d’un tiers. Seuls quelques
          éléments indispensables au fonctionnement, et un numéro anonyme qui sert à compter les visites, sont enregistrés
          dans votre navigateur.
        </p>
      }
    >
      <h2>Ce qui est enregistré</h2>
      <p>
        Ces éléments sont stockés dans votre navigateur (stockage local), jamais partagés avec des tiers, et restent sur
        votre appareil jusqu’à ce que vous les effaciez ou que vous vous déconnectiez.
      </p>
      <Fiche lignes={TRACEURS.map((t) => ({ libelle: libelleCle(t), valeur: t.finalite }))} />

      <h2>La mesure de fréquentation</h2>
      <p>
        Pour savoir quelles pages sont utiles et améliorer le service, Oskar compte lui-même les pages consultées et le
        temps passé dessus. Cette mesure est faite dans les conditions fixées par la CNIL pour être dispensée de
        consentement :
      </p>
      <ul>
        <li>le numéro qui distingue votre navigateur est tiré au hasard, et renouvelé tous les 13 mois ;</li>
        <li>il n’est jamais relié à votre compte ni à votre adresse IP, qui n’est pas enregistrée ;</li>
        <li>
          seuls sont gardés la page consultée, le site d’où vous arrivez, le type d’appareil et le temps passé ; un numéro
          de visite, effacé à la fermeture de l’onglet, regroupe les pages d’une même visite ;
        </li>
        <li>les résultats ne servent qu’à des statistiques d’ensemble, ne sont confiés à personne, et sont effacés au bout de 25 mois.</li>
      </ul>
      <p>
        Vous pouvez la refuser depuis la page <Link href="/legal/parametres-cookies">Paramètres des cookies</Link>. Elle est
        aussi coupée si votre navigateur envoie le signal « Global Privacy Control » ou « Do Not Track ».
      </p>

      <h2>Pourquoi aucun consentement n’est demandé</h2>
      <p>
        Ces traceurs sont strictement nécessaires au service que vous utilisez, ou servent uniquement à la mesure
        d’audience décrite ci-dessus. La loi (article 82 de la loi Informatique et Libertés) les dispense de consentement.
        Si Oskar venait à utiliser d’autres traceurs, votre accord vous serait demandé au préalable.
      </p>

      <h2>Garder la main</h2>
      <p>
        La page <Link href="/legal/parametres-cookies">Paramètres des cookies</Link> montre ce qui est enregistré sur votre
        appareil, permet de l’effacer et de refuser la mesure de fréquentation. Vous pouvez aussi vider le stockage du site
        depuis les réglages de votre navigateur.
      </p>
    </PageLegale>
  );
}
