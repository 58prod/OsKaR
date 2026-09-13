import type { NextApiRequest, NextApiResponse } from 'next';
import { Resend } from 'resend';
import {
  SUGGESTIONS_EMAIL_DEFAUT,
  emailSuggestionOutil,
  problemeSuggestion,
  suggestionDuCorps,
} from '@/lib/toolbox/suggestion';

/*
 * Réception d'une suggestion d'outil pour la Boîte à outils : transmet la
 * proposition par email (Resend) à l'équipe Oskar.
 *
 * Destinataire : SUGGESTIONS_EMAIL, sinon contact@oskar-coach.fr (redirigée
 * vers Christophe et Eric). Si la personne a laissé son adresse, « Répondre »
 * lui écrit directement.
 */

type ApiResponse = { ok: true } | { error: string };

function lireCorps(req: NextApiRequest): Record<string, unknown> | null {
  if (typeof req.body === 'string') {
    try {
      return JSON.parse(req.body);
    } catch {
      return null;
    }
  }
  return req.body && typeof req.body === 'object' ? req.body : null;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse<ApiResponse>) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Méthode non autorisée.' });
  }

  const corps = lireCorps(req);
  if (!corps) return res.status(400).json({ error: 'Suggestion invalide.' });

  // Champ piège invisible pour un humain : rempli, c'est un robot. On fait
  // comme si tout s'était bien passé, sans rien envoyer.
  if (typeof corps.site === 'string' && corps.site.trim()) return res.status(200).json({ ok: true });

  const s = suggestionDuCorps(corps);
  const probleme = problemeSuggestion(s);
  if (probleme) return res.status(400).json({ error: probleme });

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey || apiKey === 'your_resend_api_key_here') {
    return res.status(503).json({ error: "L'envoi de suggestions n'est pas configuré pour cet environnement." });
  }

  const { sujet, html, texte } = emailSuggestionOutil(s);

  try {
    const resend = new Resend(apiKey);
    const { error } = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'Oskar <onboarding@resend.dev>',
      to: process.env.SUGGESTIONS_EMAIL || SUGGESTIONS_EMAIL_DEFAUT,
      ...(s.email ? { replyTo: s.email } : {}),
      subject: sujet,
      html,
      text: texte,
    });
    if (error) {
      console.error('[suggest-tool] Resend a renvoyé une erreur:', error.message);
      return res.status(502).json({ error: `Resend : ${error.message}` });
    }
    return res.status(200).json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[suggest-tool] échec:', message);
    return res.status(502).json({ error: `Envoi impossible : ${message}` });
  }
}
