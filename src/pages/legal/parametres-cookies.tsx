import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { PageLegale } from '@/components/legal/PageLegale';
import { TRACEURS, correspond, libelleCle, type Traceur } from '@/lib/legal/traceurs';
import { CLE_REFUS, CLE_VISITEUR } from '@/lib/statistiques/mesure';

/*
 * Paramètres des cookies — remplace le panneau du bandeau d'origine, qui
 * proposait d'activer une mesure d'audience jamais chargée. Montre, pour
 * cet appareil, quels traceurs sont présents, permet d'effacer les
 * préférences (pas la session : on se déconnecte pour cela) et de refuser
 * la mesure de fréquentation anonyme (2026-09-14).
 */

const clesPresentes = (): string[] => {
  try {
    return Object.keys(localStorage);
  } catch {
    return [];
  }
};

const BOUTON =
  'px-4 py-2.5 rounded-[10px] bg-navy text-white text-14.5 font-semibold hover:bg-navy-light transition-colors';

export default function ParametresCookiesPage() {
  const [cles, setCles] = useState<string[] | null>(null);
  const [efface, setEfface] = useState(false);

  const relire = useCallback(() => setCles(clesPresentes()), []);
  useEffect(relire, [relire]);

  const present = (t: Traceur) => (cles ?? []).some((c) => correspond(t, c));
  const refusee = (cles ?? []).includes(CLE_REFUS);

  const effacer = () => {
    try {
      clesPresentes()
        .filter((c) => TRACEURS.some((t) => t.effacable && correspond(t, c)))
        .forEach((c) => localStorage.removeItem(c));
    } catch {
      /* stockage indisponible : rien à effacer */
    }
    relire();
    setEfface(true);
  };

  const basculerMesure = () => {
    try {
      if (refusee) {
        localStorage.removeItem(CLE_REFUS);
      } else {
        localStorage.setItem(CLE_REFUS, '1');
        localStorage.removeItem(CLE_VISITEUR);
      }
    } catch {
      /* stockage indisponible : la mesure ne peut de toute façon pas vous reconnaître */
    }
    relire();
  };

  return (
    <PageLegale
      titre="Paramètres des cookies"
      description="Ce qu’Oskar enregistre sur votre appareil, et comment l’effacer."
      chapeau={
        <p>
          Oskar n’utilise aucun traceur publicitaire. La mesure de fréquentation est anonyme et dispensée de consentement ;
          vous pouvez tout de même la refuser. Voici ce qui est enregistré sur cet appareil.
        </p>
      }
    >
      <h2>Sur cet appareil</h2>
      <ul className="!list-none !pl-0 !gap-0 border-t border-line mb-5">
        {TRACEURS.map((t) => {
          const actif = present(t);
          return (
            <li key={t.cle} className="flex items-start justify-between gap-4 py-3 border-b border-line">
              <span>
                <strong className="block">{t.finalite}</strong>
                <code className="text-12.5 text-muted">{libelleCle(t)}</code>
              </span>
              <span
                className={`shrink-0 text-12 font-bold px-2.5 py-[3px] rounded-[20px] ${
                  cles === null ? 'invisible' : actif ? 'bg-teal-light text-teal-dark' : 'bg-surface text-muted'
                }`}
              >
                {actif ? 'Enregistré' : 'Absent'}
              </span>
            </li>
          );
        })}
      </ul>

      <h2>Mesure de fréquentation</h2>
      <p>
        {refusee
          ? 'Vous avez refusé la mesure : vos visites ne sont pas comptées sur cet appareil.'
          : 'Vos visites sont comptées de façon anonyme, sans lien avec votre compte. Le refus vaut pour cet appareil et ce navigateur.'}
      </p>
      <div className="flex flex-wrap items-center gap-4">
        <button type="button" onClick={basculerMesure} className={BOUTON} aria-pressed={refusee}>
          {refusee ? 'Accepter à nouveau la mesure' : 'Refuser la mesure de fréquentation'}
        </button>
      </div>

      <h2>Effacer</h2>
      <p>
        Ce bouton efface vos préférences d’affichage, votre identité dans les outils d’équipe et le numéro de mesure de
        fréquentation. Votre session de connexion n’est pas touchée : pour la supprimer, déconnectez-vous.
      </p>
      <div className="flex flex-wrap items-center gap-4">
        <button type="button" onClick={effacer} className={BOUTON}>
          Effacer mes préférences
        </button>
        {efface && (
          <span role="status" className="text-14 font-semibold text-teal-dark">
            Préférences effacées sur cet appareil.
          </span>
        )}
      </div>

      <h2>En savoir plus</h2>
      <p>
        Le rôle de chaque élément est détaillé dans la <Link href="/legal/cookies-policy">politique cookies</Link>.
      </p>
    </PageLegale>
  );
}
