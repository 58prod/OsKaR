import type { NextApiRequest, NextApiResponse } from 'next';
import { Resend } from 'resend';

type ApiResponse = { ok: true } | { error: string };

function getRequestBody(req: NextApiRequest) {
  if (typeof req.body === 'string') {
    try { return JSON.parse(req.body); } catch { return null; }
  }
  return req.body;
}

/** Échappe le HTML des champs saisis par l'utilisateur. */
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * Réception d'une suggestion d'outil pour la Boîte à outils :
 * transmet la proposition par email (Resend) à l'équipe Oskar.
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse<ApiResponse>) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Méthode non autorisée.' });
  }

  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.SUGGESTIONS_EMAIL || process.env.NEXT_PUBLIC_CONTACT_EMAIL;
  if (!apiKey || apiKey === 'your_resend_api_key_here' || !to) {
    return res.status(503).json({ error: "L'envoi de suggestions n'est pas configuré pour cet environnement." });
  }

  const body = getRequestBody(req) as { name?: string; description?: string; from?: string } | null;
  const name = body?.name?.trim().slice(0, 80);
  const description = body?.description?.trim().slice(0, 500) ?? '';
  const from = body?.from?.trim().slice(0, 30) ?? '';

  if (!name) {
    return res.status(400).json({ error: "Le nom de l'outil est requis." });
  }

  const html = `
  <div style="font-family:Arial,Helvetica,sans-serif;color:#1f2937;max-width:560px;margin:auto;">
    <div style="background:#1e2d7d;color:#fff;padding:20px 24px;border-radius:12px 12px 0 0;">
      <h1 style="margin:0;font-size:20px;">Nouvelle suggestion d'outil</h1>
    </div>
    <div style="border:1px solid #e5e7eb;border-top:0;padding:20px 24px;border-radius:0 0 12px 12px;">
      <p><strong>Outil / rituel :</strong> ${escapeHtml(name)}</p>
      ${description ? `<p><strong>Description :</strong><br/>${escapeHtml(description).replace(/\n/g, '<br/>')}</p>` : ''}
      ${from ? `<p><strong>Proposé par :</strong> ${escapeHtml(from)}</p>` : ''}
      <p style="color:#6b7280;font-size:13px;margin-top:24px;">— Boîte à outils Oskar</p>
    </div>
  </div>`;

  try {
    const resend = new Resend(apiKey);
    const sender = process.env.RESEND_FROM_EMAIL || 'Oskar <onboarding@resend.dev>';
    const { error } = await resend.emails.send({
      from: sender,
      to,
      subject: `Suggestion d'outil : ${name}`,
      html,
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
