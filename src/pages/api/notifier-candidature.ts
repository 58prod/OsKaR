import type { NextApiRequest, NextApiResponse } from 'next';
import { Resend } from 'resend';
import {
  CANDIDATURE_VIDE,
  LONGUEURS_MAX,
  PILIERS_COACH,
  problemeCandidature,
  type Candidature,
} from '@/lib/coachs/candidature';
import { emailNouvelleCandidature } from '@/lib/coachs/notification';

/*
 * Prévient l'équipe d'une nouvelle candidature à l'annuaire des coachs.
 * Appelée par le formulaire de /coachs une fois la candidature enregistrée.
 *
 * Destinataire : CANDIDATURES_EMAIL, sinon contact@oskar-coach.fr (redirigée
 * vers Christophe et Eric). « Répondre » écrit directement au candidat.
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

/** Ne garde que les champs attendus, bornés comme dans le formulaire. */
function candidatureDuCorps(corps: Record<string, unknown>): Candidature {
  const texte = (cle: keyof typeof LONGUEURS_MAX) => {
    const v = corps[cle];
    return typeof v === 'string' ? v.slice(0, LONGUEURS_MAX[cle]) : '';
  };
  const piliers = Array.isArray(corps.piliers) ? corps.piliers : [];
  return {
    ...CANDIDATURE_VIDE,
    prenom: texte('prenom'),
    nom: texte('nom'),
    email: texte('email'),
    zone: texte('zone'),
    structure: texte('structure'),
    site: texte('site'),
    approche: texte('approche'),
    piliers: PILIERS_COACH.map((p) => p.id).filter((id) => piliers.includes(id)),
    labelRpr: corps.labelRpr === true,
  };
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

  const corps = lireCorps(req);
  if (!corps) return res.status(400).json({ error: 'Candidature invalide.' });

  const c = candidatureDuCorps(corps);
  const probleme = problemeCandidature(c);
  if (probleme) return res.status(400).json({ error: probleme });

  const base = process.env.NEXT_PUBLIC_APP_URL || 'https://oskar-coach.fr';
  const { sujet, html, texte } = emailNouvelleCandidature(c, `${base}/admin/candidatures`);

  try {
    const resend = new Resend(apiKey);
    const { error } = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'Oskar <onboarding@resend.dev>',
      to: process.env.CANDIDATURES_EMAIL || 'contact@oskar-coach.fr',
      replyTo: c.email.trim(),
      subject: sujet,
      html,
      text: texte,
    });
    if (error) {
      console.error('[notifier-candidature] Resend a renvoyé une erreur:', error.message);
      return res.status(502).json({ error: `Resend : ${error.message}` });
    }
    return res.status(200).json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[notifier-candidature] échec:', message);
    return res.status(502).json({ error: `Envoi impossible : ${message}` });
  }
}
