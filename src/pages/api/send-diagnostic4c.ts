import type { NextApiRequest, NextApiResponse } from 'next';
import { Resend } from 'resend';
import { analyser4c, etat4cDuCorps } from '@/lib/diagnostic4c/calcul';
import { emailBilan4c } from '@/lib/diagnostic4c/email';

/*
 * Envoi par email du bilan du Diagnostic 4c. Même principe que
 * /api/send-diagnostic : route libre d'accès, le navigateur n'envoie que les
 * réponses, l'analyse est recalculée ici. L'adresse sert uniquement à l'envoi :
 * rien n'est enregistré.
 */

type ApiResponse = { ok: true } | { error: string };

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function corpsDe(req: NextApiRequest) {
  if (typeof req.body === 'string') {
    try { return JSON.parse(req.body); } catch { return null; }
  }
  return req.body;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse<ApiResponse>) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Méthode non autorisée.' });
  }
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey || apiKey === 'your_resend_api_key_here') {
    return res.status(503).json({ error: "L'envoi d'email n'est pas configuré pour cet environnement." });
  }

  const corps = corpsDe(req) as { email?: unknown; etat?: unknown } | null;
  const email = typeof corps?.email === 'string' ? corps.email.trim().slice(0, 254) : '';
  if (!email || !EMAIL_RE.test(email)) return res.status(400).json({ error: 'Adresse email invalide.' });

  const etat = etat4cDuCorps(corps?.etat);
  const analyse = etat ? analyser4c(etat) : null;
  if (!analyse || !analyse.complet) return res.status(400).json({ error: 'Diagnostic invalide ou incomplet.' });

  try {
    const base = process.env.NEXT_PUBLIC_APP_URL || 'https://oskar-coach.fr';
    const { error } = await new Resend(apiKey).emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'Oskar <onboarding@resend.dev>',
      to: email,
      subject: `Votre diagnostic Oskar : ${analyse.profil?.nom ?? 'votre bilan'}`,
      html: emailBilan4c(analyse, base),
    });
    if (error) {
      console.error('[send-diagnostic4c] Resend a renvoyé une erreur:', error.message);
      return res.status(502).json({ error: `Resend : ${error.message}` });
    }
    return res.status(200).json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[send-diagnostic4c] échec:', message);
    return res.status(502).json({ error: `Envoi impossible : ${message}` });
  }
}
