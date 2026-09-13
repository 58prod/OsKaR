import React from 'react';
import Link from 'next/link';
import { Fiche, PageLegale } from '@/components/legal/PageLegale';
import { TRACEURS, libelleCle } from '@/lib/legal/traceurs';

export default function CookiesPage() {
  return (
    <PageLegale
      titre="Cookies"
      description="Oskar n’utilise que des traceurs strictement nécessaires : aucune publicité, aucune mesure d’audience."
      chapeau={
        <p>
          Oskar n’utilise ni cookie publicitaire, ni mesure d’audience, ni bouton de réseau social. Seuls quelques
          éléments indispensables au fonctionnement sont enregistrés dans votre navigateur.
        </p>
      }
    >
      <h2>Ce qui est enregistré</h2>
      <p>
        Ces éléments sont stockés dans votre navigateur (stockage local), jamais partagés avec des tiers, et restent sur
        votre appareil jusqu’à ce que vous les effaciez ou que vous vous déconnectiez.
      </p>
      <Fiche lignes={TRACEURS.map((t) => ({ libelle: libelleCle(t), valeur: t.finalite }))} />

      <h2>Pourquoi aucun consentement n’est demandé</h2>
      <p>
        Ces traceurs sont strictement nécessaires au service que vous utilisez. La loi (article 82 de la loi Informatique
        et Libertés) les dispense de consentement. Si Oskar venait à utiliser d’autres traceurs, votre accord vous serait
        demandé au préalable.
      </p>

      <h2>Garder la main</h2>
      <p>
        La page <Link href="/legal/parametres-cookies">Paramètres des cookies</Link> montre ce qui est enregistré sur votre
        appareil et permet de l’effacer. Vous pouvez aussi vider le stockage du site depuis les réglages de votre
        navigateur.
      </p>
    </PageLegale>
  );
}
