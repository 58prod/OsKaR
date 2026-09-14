import React, { useEffect, useState } from 'react';
import Link from 'next/link';

/*
 * Information cookies.
 *
 * Oskar ne dépose que des traceurs strictement nécessaires (session de
 * connexion, préférences d'affichage) et, depuis le 2026-09-14, un numéro
 * de mesure d'audience anonyme : tous sont exemptés de consentement.
 * Le bandeau d'origine proposait d'accepter Google Analytics, qui n'a jamais
 * été chargé ; il est remplacé par un simple message d'information, affiché
 * une fois (2026-09-13). Détail sur /legal/cookies-policy, réglages sur
 * /legal/parametres-cookies.
 */

export const COOKIE_CONSENT_KEY = 'oskar_cookie_consent';
export const COOKIE_PREFERENCES_KEY = 'oskar_cookie_preferences';
export const COOKIE_CONSENT_DATE_KEY = 'oskar_consent_date';

const lire = (cle: string): string | null => {
  try {
    return localStorage.getItem(cle);
  } catch {
    return null;
  }
};

/** Mène à la page « Paramètres des cookies » (liens de pied de page). */
export const openCookieSettings = () => {
  if (typeof window !== 'undefined') {
    window.location.assign('/legal/parametres-cookies');
  }
};

export const CookieBanner: React.FC = () => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (lire(COOKIE_CONSENT_KEY)) return;
    const minuteur = setTimeout(() => setVisible(true), 1000);
    return () => clearTimeout(minuteur);
  }, []);

  const fermer = () => {
    try {
      localStorage.setItem(COOKIE_CONSENT_KEY, 'true');
      localStorage.setItem(COOKIE_CONSENT_DATE_KEY, new Date().toISOString());
    } catch {
      /* stockage indisponible : le message réapparaîtra, sans conséquence */
    }
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div
      role="region"
      aria-label="Information sur les cookies"
      className="fixed bottom-4 left-4 right-4 min-[640px]:right-auto min-[640px]:max-w-[420px] z-50 bg-white border border-line shadow-card-hover rounded-[14px] p-5"
    >
      <p className="text-14.5 font-bold text-navy mb-1.5">Des cookies réduits au strict nécessaire</p>
      <p className="text-13.5 leading-[1.6] text-muted mb-4">
        Oskar n’utilise que les cookies indispensables à son fonctionnement et compte ses visites de façon anonyme :
        aucune publicité, aucun outil tiers. Il n’y a rien à accepter.
      </p>
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={fermer}
          className="px-4 py-2 rounded-[10px] bg-navy text-white text-14 font-semibold hover:bg-navy-light transition-colors"
        >
          J’ai compris
        </button>
        <Link href="/legal/cookies-policy" onClick={fermer} className="text-14 font-semibold text-navy underline hover:text-teal-dark">
          En savoir plus
        </Link>
      </div>
    </div>
  );
};

/** Conservé pour compatibilité : seuls les traceurs nécessaires existent. */
export const useCookieConsent = () => {
  const [hasConsent, setHasConsent] = useState(false);
  useEffect(() => setHasConsent(!!lire(COOKIE_CONSENT_KEY)), []);
  return { hasConsent, preferences: { necessary: true, analytics: false, functional: false } };
};
