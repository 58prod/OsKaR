import type { NextApiRequest, NextApiResponse } from 'next';
import { Resend } from 'resend';
import { generateDiagnosticPdf } from '@/lib/diagnostic/pdf';
import { fmt, stateLabel } from '@/lib/diagnostic';
import type { AnalysisResult } from '@/lib/diagnostic';

type ApiResponse = { ok: true } | { error: string };

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function getRequestBody(req: NextApiRequest) {
  if (typeof req.body === 'string') {
    try { return JSON.parse(req.body); } catch { return null; }
  }
  return req.body;
}

/** Corps HTML de l'email accompagnant le PDF. */
function buildEmailHtml(result: AnalysisResult): string {
  const rows = result.recap
    .map((r) => `<li style="margin:2px 0;">${r.label} — <strong>${fmt(r.score)}/10</strong> (${stateLabel(r.state)})</li>`)
    .join('');
  return `
  <div style="font-family:Arial,Helvetica,sans-serif;color:#1f2937;max-width:560px;margin:auto;">
    <div style="background:#1e2d7d;color:#fff;padding:20px 24px;border-radius:12px 12px 0 0;">
      <h1 style="margin:0;font-size:20px;">Votre bilan de maturité Oskar</h1>
    </div>
    <div style="border:1px solid #e5e7eb;border-top:0;padding:20px 24px;border-radius:0 0 12px 12px;">
      <p>Bonjour,</p>
      <p>Voici la synthèse de votre bilan (<strong>${result.evaluatedCount}/5 piliers évalués</strong>).
      Score global : <strong>${fmt(result.average)}/10</strong> — ${stateLabel(result.averageState)}.</p>
      <ul style="padding-left:18px;">${rows}</ul>
      <p>Le détail complet (axes prioritaires, points d'appui et recommandations) se trouve dans le PDF joint.</p>
      <p style="color:#6b7280;font-size:13px;margin-top:24px;">— L'équipe Oskar</p>
    </div>
  </div>
  <br/><br/>`;
  

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

  const body = getRequestBody(req) as { email?: string; scores?: AnalysisResult } | null;
  const email = body?.email?.trim();
  const scores = body?.scores;

  if (!email || !EMAIL_RE.test(email)) {
    return res.status(400).json({ error: 'Adresse email invalide.' });
  }
  if (!scores || typeof scores.average !== 'number' || !Array.isArray(scores.recap)) {
    return res.status(400).json({ error: 'Bilan invalide ou incomplet.' });
  }

  try {
    const pdf = Buffer.from(generateDiagnosticPdf(scores));
    const resend = new Resend(apiKey);
    const from = process.env.RESEND_FROM_EMAIL || 'Oskar <onboarding@resend.dev>';

    const { error } = await resend.emails.send({
      from,
      to: email,
      subject: 'Votre bilan de maturité Oskar',
      html: buildEmailHtml(scores),
      attachments: [{ filename: 'bilan-oskar.pdf', content: pdf }],
    });

    if (error) {
      console.error('[send-diagnostic] Resend a renvoyé une erreur:', error.message);
      return res.status(502).json({ error: `Resend : ${error.message}` });
    }

    return res.status(200).json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[send-diagnostic] échec:', message);
    return res.status(502).json({ error: `Génération/envoi impossible : ${message}` });
  }
}
