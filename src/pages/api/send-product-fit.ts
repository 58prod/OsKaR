import type { NextApiRequest, NextApiResponse } from 'next';
import { Resend } from 'resend';
import { generateProductFitPdf } from '@/lib/productFit/pdf';
import type { ProductFitAnalysis, ProductFitProject } from '@/lib/productFit/types';

/*
 * Envoi par email de la synthèse « Potentiel Produit », sur le même modèle que
 * `send-diagnostic` : un PDF en pièce jointe, un résumé dans le corps du message.
 */

type ApiResponse = { ok: true } | { error: string };

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function getRequestBody(req: NextApiRequest) {
  if (typeof req.body === 'string') {
    try {
      return JSON.parse(req.body);
    } catch {
      return null;
    }
  }
  return req.body;
}

function buildEmailHtml(analysis: ProductFitAnalysis, nomProjet?: string): string {
  const lignes = analysis.personasResults
    .map(
      (p) =>
        `<li style="margin:2px 0;">${p.personaName} — <strong>${p.scoreOn10}/10</strong>${
          p.isPriorityTarget ? ' (à viser en premier)' : ''
        }</li>`
    )
    .join('');
  const titre = nomProjet ? `Potentiel de « ${nomProjet} »` : 'Votre bilan Potentiel Produit';
  return `
  <div style="font-family:Arial,Helvetica,sans-serif;color:#1f2937;max-width:560px;margin:auto;">
    <div style="background:#1e2d7d;color:#fff;padding:20px 24px;border-radius:12px 12px 0 0;">
      <h1 style="margin:0;font-size:20px;">${titre}</h1>
    </div>
    <div style="border:1px solid #e5e7eb;border-top:0;padding:20px 24px;border-radius:0 0 12px 12px;">
      <p>Bonjour,</p>
      <p>Votre produit obtient <strong>${analysis.globalScoreOn10}/10</strong> — ${analysis.verdictLabel}.</p>
      <ul style="padding-left:18px;">${lignes}</ul>
      <p>Le détail — par qui commencer, vos atouts, ce qu'il faut surveiller et les prochaines étapes — se trouve dans le PDF joint.</p>
      <p style="color:#6b7280;font-size:13px;margin-top:24px;">— L'équipe OSKAR</p>
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

  const body = getRequestBody(req) as
    | { email?: string; analysis?: ProductFitAnalysis; project?: ProductFitProject }
    | null;
  const email = body?.email?.trim();
  const analysis = body?.analysis;

  if (!email || !EMAIL_RE.test(email)) {
    return res.status(400).json({ error: 'Adresse email invalide.' });
  }
  if (!analysis || typeof analysis.globalScoreOn10 !== 'number' || !Array.isArray(analysis.personasResults)) {
    return res.status(400).json({ error: 'Bilan invalide ou incomplet.' });
  }

  try {
    const pdf = Buffer.from(generateProductFitPdf(analysis, body?.project));
    const resend = new Resend(apiKey);
    const from = process.env.RESEND_FROM_EMAIL || 'OSKAR <onboarding@resend.dev>';

    const { error } = await resend.emails.send({
      from,
      to: email,
      subject: 'Votre bilan Potentiel Produit OSKAR',
      html: buildEmailHtml(analysis, body?.project?.projectName),
      attachments: [{ filename: 'potentiel-produit-oskar.pdf', content: pdf }],
    });

    if (error) {
      console.error('[send-product-fit] Resend a renvoyé une erreur:', error.message);
      return res.status(502).json({ error: `Resend : ${error.message}` });
    }

    return res.status(200).json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[send-product-fit] échec:', message);
    return res.status(502).json({ error: `Génération/envoi impossible : ${message}` });
  }
}
