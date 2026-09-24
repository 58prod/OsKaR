import type { NextApiRequest, NextApiResponse } from 'next';
import { Resend } from 'resend';
import { generateDiagnosticPdf } from '@/lib/diagnostic/pdf';
import { buildAnalysis, fmt, stateLabel } from '@/lib/diagnostic';
import type { AnalysisResult } from '@/lib/diagnostic';
import { etatDiagnosticDuCorps } from '@/lib/diagnostic/validation';
import { echapperHtml } from '@/lib/coachs/notification';
import { analyser4 } from '@/lib/diagnostic4/calcul';
import { OPTIONS_DIAGNOSTIC, estBilan4, etat4Depuis } from '@/lib/diagnostic4/bilan';
import { genererPdfDiagnostic4 } from '@/lib/diagnostic4/pdf';
import { emailBilan4 } from '@/lib/diagnostic4/email';

/*
 * Envoi par email du bilan de maturité, avec le PDF en pièce jointe. La route
 * est libre d'accès (le Diagnostic ne demande pas de compte) : le navigateur
 * n'envoie que les réponses, et c'est ici que l'analyse est recalculée. Le
 * message ne contient donc que nos propres textes.
 *
 * Deux versions : le Diagnostic actuel (réponses marquées `__version: 4`) et
 * l'ancien, toujours servi par /diagnostic-classique.
 */

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
    .map((r) => `<li style="margin:2px 0;">${echapperHtml(r.label)} —<strong>${fmt(r.score)}/10</strong> (${stateLabel(r.state)})</li>`)
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

  const body = getRequestBody(req) as { email?: unknown; responses?: unknown } | null;
  const email = typeof body?.email === 'string' ? body.email.trim().slice(0, 254) : '';

  if (!email || !EMAIL_RE.test(email)) {
    return res.status(400).json({ error: 'Adresse email invalide.' });
  }
  // Le PDF est produit dans le try : une erreur de génération répond 502, comme avant.
  let message: { subject: string; html: string; pdf: () => ArrayBuffer };
  if (estBilan4(body?.responses)) {
    const etat4 = etat4Depuis(body?.responses);
    const analyse = etat4 ? analyser4(etat4, OPTIONS_DIAGNOSTIC) : null;
    if (!analyse?.complet) return res.status(400).json({ error: 'Bilan invalide ou incomplet.' });
    const base = process.env.NEXT_PUBLIC_APP_URL || 'https://oskar-coach.fr';
    message = { subject: 'Votre diagnostic Oskar', html: emailBilan4(analyse, base), pdf: () => genererPdfDiagnostic4(analyse, base) };
  } else {
    const etat = etatDiagnosticDuCorps(body?.responses);
    const scores = etat ? buildAnalysis(etat) : null;
    if (!scores) {
      return res.status(400).json({ error: 'Bilan invalide ou incomplet.' });
    }
    message = { subject: 'Votre bilan de maturité Oskar', html: buildEmailHtml(scores), pdf: () => generateDiagnosticPdf(scores) };
  }

  try {
    const pdf = Buffer.from(message.pdf());
    const resend = new Resend(apiKey);
    const from = process.env.RESEND_FROM_EMAIL || 'Oskar <onboarding@resend.dev>';

    const { error } = await resend.emails.send({
      from,
      to: email,
      subject: message.subject,
      html: message.html,
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
