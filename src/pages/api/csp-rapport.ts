import type { NextApiRequest, NextApiResponse } from 'next';

/*
 * Reçoit les signalements de la politique de sécurité du contenu (CSP) :
 * quand un navigateur bloque une ressource sur une page d'Oskar, il le
 * signale ici. On l'écrit simplement dans les journaux (Netlify → Logs →
 * Functions), pour repérer ce qui serait bloqué à tort sans rien stocker.
 *
 * Deux formats coexistent selon les navigateurs :
 *   - `report-uri` : { "csp-report": { "violated-directive", "blocked-uri", … } }
 *   - `report-to`  : [ { type: "csp-violation", body: { effectiveDirective, blockedURL, … } } ]
 * Aucune donnée personnelle n'est lue : seulement la règle, la ressource
 * bloquée et la page concernée.
 */

const TAILLE_MAX = 10_000;
const MAX_SIGNALEMENTS = 10;

type Signalement = { regle: string; bloque: string; page: string };

function lire(corps: unknown): Signalement[] {
  const texte = (v: unknown) => (typeof v === 'string' ? v.slice(0, 300) : '');
  const liste = Array.isArray(corps) ? corps : [corps];
  return liste.slice(0, MAX_SIGNALEMENTS).flatMap((r) => {
    if (!r || typeof r !== 'object') return [];
    const o = r as Record<string, unknown>;
    const ancien = o['csp-report'] as Record<string, unknown> | undefined;
    if (ancien && typeof ancien === 'object') {
      return [{
        regle: texte(ancien['effective-directive'] ?? ancien['violated-directive']),
        bloque: texte(ancien['blocked-uri']),
        page: texte(ancien['document-uri']),
      }];
    }
    const b = o.body as Record<string, unknown> | undefined;
    if (o.type === 'csp-violation' && b && typeof b === 'object') {
      return [{ regle: texte(b.effectiveDirective), bloque: texte(b.blockedURL), page: texte(b.documentURL) }];
    }
    return [];
  });
}

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).end();
  }
  let corps: unknown = req.body;
  if (typeof corps === 'string') {
    if (corps.length > TAILLE_MAX) return res.status(413).end();
    try {
      corps = JSON.parse(corps);
    } catch {
      return res.status(400).end();
    }
  }
  for (const s of lire(corps)) {
    console.warn(`[csp] bloqué : ${s.regle} → ${s.bloque || '(inline)'} sur ${s.page}`);
  }
  return res.status(204).end();
}
