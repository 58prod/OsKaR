import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';
import { emailNouvelInscrit } from '@/lib/auth/notificationInscription';

/*
 * Prévient l'équipe d'un nouveau compte. Appelée par le formulaire
 * d'inscription juste après la création du compte, avec le jeton de la session.
 *
 * Rien ne vient du navigateur : l'identité est relue auprès de Supabase à
 * partir du jeton, et seul un compte créé il y a moins de 15 minutes déclenche
 * l'email. Personne ne peut donc s'en servir pour écrire à l'équipe.
 *
 * Destinataire : INSCRIPTIONS_EMAIL, sinon contact@oskar-coach.fr.
 */

type ApiResponse = { ok: true } | { error: string };

const FENETRE_MS = 15 * 60 * 1000;

export default async function handler(req: NextApiRequest, res: NextApiResponse<ApiResponse>) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Méthode non autorisée.' });
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey || apiKey === 'your_resend_api_key_here') {
    return res.status(503).json({ error: "L'envoi d'email n'est pas configuré pour cet environnement." });
  }

  const jeton = req.headers.authorization?.replace(/^Bearer\s+/i, '').trim();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const cle = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!jeton || !url || !cle) return res.status(401).json({ error: 'Session manquante.' });

  const { data, error: erreurSession } = await createClient(url, cle, {
    auth: { persistSession: false, autoRefreshToken: false },
  }).auth.getUser(jeton);
  const user = data?.user;
  if (erreurSession || !user?.email) return res.status(401).json({ error: 'Session invalide.' });

  if (Date.now() - new Date(user.created_at).getTime() > FENETRE_MS) {
    return res.status(409).json({ error: 'Ce compte n’est pas nouveau.' });
  }

  const meta = (user.user_metadata ?? {}) as Record<string, unknown>;
  const base = process.env.NEXT_PUBLIC_APP_URL || 'https://oskar-coach.fr';
  const { sujet, html, texte } = emailNouvelInscrit(
    {
      nom: typeof meta.name === 'string' ? meta.name : '',
      email: user.email,
      entreprise: typeof meta.company === 'string' ? meta.company : '',
    },
    `${base}/admin/comptes?compte=${user.id}`
  );

  try {
    const { error } = await new Resend(apiKey).emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'Oskar <onboarding@resend.dev>',
      to: process.env.INSCRIPTIONS_EMAIL || 'contact@oskar-coach.fr',
      replyTo: user.email,
      subject: sujet,
      html,
      text: texte,
    });
    if (error) {
      console.error('[notifier-inscription] Resend a renvoyé une erreur:', error.message);
      return res.status(502).json({ error: `Resend : ${error.message}` });
    }
    return res.status(200).json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[notifier-inscription] échec:', message);
    return res.status(502).json({ error: `Envoi impossible : ${message}` });
  }
}
