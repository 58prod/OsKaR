/*
 * Chaque matin, déclenche le résumé envoyé aux coachs (route
 * /api/resume-coachs de l'application).
 *
 * Planifiée à 6 h et 7 h UTC : 8 h à Paris tombe à 6 h UTC en heure d'été et
 * à 7 h UTC en heure d'hiver. La route vérifie l'heure de Paris et n'envoie
 * qu'une fois ; la base empêche tout doublon.
 *
 * Ne fait rien sur un site sans RESUME_COACHS_SECRET (le site d'Eric, branché
 * sur le même dépôt, par exemple). Les fonctions planifiées ne tournent que
 * sur la version publiée, jamais sur les aperçus de déploiement.
 */

export default async () => {
  const base = process.env.URL;
  const secret = process.env.RESUME_COACHS_SECRET;
  if (!base || !secret) {
    console.log('[resume-coachs] RESUME_COACHS_SECRET absent : rien à faire sur ce site.');
    return;
  }

  const res = await fetch(`${base}/api/resume-coachs/`, {
    method: 'POST',
    headers: { 'x-oskar-secret': secret },
  });
  console.log(`[resume-coachs] ${res.status} ${await res.text()}`);
};

export const config = {
  schedule: '0 6,7 * * *',
};
