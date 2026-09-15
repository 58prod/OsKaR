import type { NextApiRequest, NextApiResponse } from 'next';
import { timingSafeEqual } from 'crypto';
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';
import { emailResumeQuotidien, estLHeureDuResume, veilleParis } from '@/lib/accompagnement/resume';
import { versResume } from '@/services/db/accompagnements';

/*
 * Le résumé de 8 h : un email par coach, avec ce que ses dirigeants ont fait
 * la veille. Appelée chaque matin par la fonction planifiée Netlify
 * `netlify/functions/resume-coachs.mts`, à 6 h et 7 h UTC ; elle n'envoie qu'à
 * 8 h, heure de Paris (l'un des deux appels, selon l'heure d'été ou d'hiver).
 *
 * Protégée par le secret RESUME_COACHS_SECRET (en-tête `x-oskar-secret`),
 * le même que celui rangé dans la base par la migration 20260915_accompagnements.
 * La base ne répond qu'avec ce secret et n'envoie jamais deux fois le même
 * jour à un coach.
 *
 * Pour tester à la main (hors 8 h) : POST /api/resume-coachs/?forcer=1,
 * éventuellement &jour=AAAA-MM-JJ pour une autre journée que la veille.
 */

type ApiResponse =
  | { ok: true; jour?: string; envoyes: number; echecs: number; raison?: string }
  | { error: string };

function secretsEgaux(recu: string, attendu: string): boolean {
  const a = Buffer.from(recu);
  const b = Buffer.from(attendu);
  return a.length === b.length && timingSafeEqual(a, b);
}

const pause = (ms: number) => new Promise((r) => setTimeout(r, ms));

export default async function handler(req: NextApiRequest, res: NextApiResponse<ApiResponse>) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Méthode non autorisée.' });
  }

  const secret = process.env.RESUME_COACHS_SECRET;
  if (!secret) return res.status(503).json({ error: 'Le résumé des coachs n’est pas configuré sur ce site.' });

  const recu = req.headers['x-oskar-secret'];
  if (typeof recu !== 'string' || !secretsEgaux(recu, secret)) {
    return res.status(401).json({ error: 'Accès refusé.' });
  }

  const maintenant = new Date();
  const forcer = req.query.forcer === '1';
  if (!forcer && !estLHeureDuResume(maintenant)) {
    return res.status(200).json({ ok: true, envoyes: 0, echecs: 0, raison: 'Il n’est pas 8 h à Paris.' });
  }
  const jour =
    typeof req.query.jour === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(req.query.jour)
      ? req.query.jour
      : veilleParis(maintenant);

  const apiKey = process.env.RESEND_API_KEY;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const cle = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!apiKey || apiKey === 'your_resend_api_key_here' || !url || !cle) {
    return res.status(503).json({ error: "L'envoi d'email n'est pas configuré pour cet environnement." });
  }

  const client = createClient(url, cle, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data, error } = await client.rpc('resume_coachs', { p_secret: secret, p_jour: jour });
  if (error) {
    console.error('[resume-coachs] lecture impossible:', error.message);
    return res.status(502).json({ error: `Base : ${error.message}` });
  }

  const base = process.env.NEXT_PUBLIC_APP_URL || 'https://oskar-coach.fr';
  const resend = new Resend(apiKey);
  let envoyes = 0;
  let echecs = 0;

  for (const ligne of (data ?? []) as Record<string, unknown>[]) {
    const resume = versResume(ligne);
    const { sujet, html, texte } = emailResumeQuotidien(resume, jour, base);
    try {
      const { error: erreurEnvoi } = await resend.emails.send({
        from: process.env.RESEND_FROM_EMAIL || 'Oskar <onboarding@resend.dev>',
        to: resume.coachEmail,
        subject: sujet,
        html,
        text: texte,
      });
      if (erreurEnvoi) throw new Error(erreurEnvoi.message);
      await client.rpc('resume_coachs_marquer', { p_secret: secret, p_coach_id: resume.coachId, p_jour: jour });
      envoyes += 1;
    } catch (err) {
      echecs += 1;
      console.error('[resume-coachs] envoi impossible:', err instanceof Error ? err.message : String(err));
    }
    // Resend limite le nombre d'envois par seconde.
    await pause(600);
  }

  return res.status(200).json({ ok: true, jour, envoyes, echecs });
}
