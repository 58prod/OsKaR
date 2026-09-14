import { useEffect, useRef } from 'react';
import Router from 'next/router';
import { useAppStore } from '@/store/useAppStore';
import { useEstAdmin } from '@/hooks/useAdmin';
import {
  CLE_REFUS,
  Chrono,
  appareil,
  cheminMesurable,
  hoteMesure,
  identifiantVisite,
  identifiantVisiteur,
  mesureAutorisee,
  provenance,
  uuid,
  type Stockage,
} from '@/lib/statistiques/mesure';

/*
 * Mesure d'audience (écran /admin/statistiques, migration 20260914_statistiques).
 * Une ligne par page affichée, puis le temps passé dessus, envoyé quand on
 * change de page ou que l'onglet passe en arrière-plan.
 *
 * Appels directs à l'API de la base, avec la seule clé publique : `keepalive`
 * laisse partir la durée même quand l'onglet se ferme. Aucune erreur n'est
 * jamais montrée : la mesure ne doit pas gêner la navigation.
 * Pas de mesure pour les administrateurs, ni avant de savoir si on l'est.
 */

const URL_API = process.env.NEXT_PUBLIC_SUPABASE_URL;
const CLE_API = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

function envoyer(fonction: string, corps: Record<string, unknown>) {
  if (!URL_API || !CLE_API) return;
  fetch(`${URL_API}/rest/v1/rpc/${fonction}`, {
    method: 'POST',
    headers: { apikey: CLE_API, Authorization: `Bearer ${CLE_API}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(corps),
    keepalive: true,
  }).catch(() => {
    /* hors ligne, bloqueur… : tant pis pour cette page */
  });
}

const MUET: Stockage = { getItem: () => null, setItem: () => undefined };
const stockage = (quel: 'localStorage' | 'sessionStorage'): Stockage => {
  try {
    return window[quel] ?? MUET;
  } catch {
    return MUET;
  }
};

function autorisee(): boolean {
  const nav = navigator as Navigator & { globalPrivacyControl?: boolean };
  return mesureAutorisee({
    hote: window.location.hostname,
    refus: stockage('localStorage').getItem(CLE_REFUS) === '1',
    gpc: nav.globalPrivacyControl === true,
    dnt: nav.doNotTrack,
    robot: nav.webdriver === true,
  });
}

export function MesureAudience() {
  const authReady = useAppStore((s) => s.authReady);
  const { estAdmin, enCours } = useEstAdmin();
  const pret = authReady && !enCours;
  // Gardée d'un rendu à l'autre : une connexion ne recompte pas la page affichée.
  const vue = useRef<{ id: string; chemin: string; chrono: Chrono } | null>(null);

  useEffect(() => {
    if (!pret || estAdmin) return;

    const terminer = () => {
      const v = vue.current;
      if (!v) return;
      const secondes = v.chrono.secondes(Date.now());
      if (secondes > 0) envoyer('terminer_vue', { p_id: v.id, p_duree: secondes });
    };

    const commencer = () => {
      const chemin = Router.pathname;
      if (vue.current?.chemin === chemin) return;
      terminer();
      vue.current = null;
      if (!cheminMesurable(chemin) || !autorisee()) return;

      const maintenant = Date.now();
      const hote = hoteMesure(window.location.hostname);
      const visite = identifiantVisite(stockage('sessionStorage'), maintenant, uuid);
      const id = uuid();
      vue.current = { id, chemin, chrono: new Chrono(maintenant, document.visibilityState === 'visible') };
      envoyer('enregistrer_vue', {
        p_id: id,
        p_hote: hote,
        p_chemin: chemin,
        p_visiteur: identifiantVisiteur(stockage('localStorage'), maintenant, uuid),
        p_visite: visite.id,
        p_provenance: visite.nouvelle ? provenance(document.referrer, hote, window.location.search) : null,
        p_appareil: appareil(window.innerWidth),
        p_connecte: useAppStore.getState().isAuthenticated,
      });
    };

    const surVisibilite = () => {
      const v = vue.current;
      if (!v) return;
      if (document.visibilityState === 'hidden') {
        v.chrono.pause(Date.now());
        terminer();
      } else {
        v.chrono.reprise(Date.now());
      }
    };

    commencer();
    Router.events.on('routeChangeComplete', commencer);
    document.addEventListener('visibilitychange', surVisibilite);
    window.addEventListener('pagehide', terminer);
    return () => {
      Router.events.off('routeChangeComplete', commencer);
      document.removeEventListener('visibilitychange', surVisibilite);
      window.removeEventListener('pagehide', terminer);
      terminer();
    };
  }, [pret, estAdmin]);

  return null;
}

export default MesureAudience;
