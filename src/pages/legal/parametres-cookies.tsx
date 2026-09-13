import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { PageLegale } from '@/components/legal/PageLegale';
import { TRACEURS, correspond, libelleCle, type Traceur } from '@/lib/legal/traceurs';

/*
 * Paramètres des cookies — remplace le panneau du bandeau d'origine, qui
 * proposait d'activer une mesure d'audience jamais chargée. Montre, pour
 * cet appareil, quels traceurs sont présents et permet d'effacer les
 * préférences (pas la session : on se déconnecte pour cela).
 */

const clesPresentes = (): string[] => {
  try {
    return Object.keys(localStorage);
  } catch {
    return [];
  }
};

export default function ParametresCookiesPage() {
  const [cles, setCles] = useState<string[] | null>(null);
  const [efface, setEfface] = useState(false);

  const relire = useCallback(() => setCles(clesPresentes()), []);
  useEffect(relire, [relire]);

  const present = (t: Traceur) => (cles ?? []).some((c) => correspond(t, c));

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

  return (
    <PageLegale
      titre="Paramètres des cookies"
      description="Ce qu’Oskar enregistre sur votre appareil, et comment l’effacer."
      chapeau={
        <p>
          Oskar n’utilise aucun traceur optionnel : il n’y a rien à accepter ni à refuser. Voici ce qui est enregistré sur
          cet appareil.
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

      <h2>Effacer</h2>
      <p>
        Ce bouton efface vos préférences d’affichage et votre identité dans les outils d’équipe. Votre session de
        connexion n’est pas touchée : pour la supprimer, déconnectez-vous.
      </p>
      <div className="flex flex-wrap items-center gap-4">
        <button
          type="button"
          onClick={effacer}
          className="px-4 py-2.5 rounded-[10px] bg-navy text-white text-14.5 font-semibold hover:bg-navy-light transition-colors"
        >
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
