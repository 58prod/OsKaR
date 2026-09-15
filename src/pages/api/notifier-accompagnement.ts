import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';
import { emailInvitation, versInvitation } from '@/lib/accompagnement/emails';

/*
 * Prévient par email la personne invitée à un accompagnement : le dirigeant
 * qu'un coach invite, ou le coach à qui un dirigeant fait une demande.
 * Appelée par l'application juste après l'invitation, avec le jeton de session.
 *
 * Rien ne vient du navigateur, sauf l'identifiant de l'invitation : la base
 * (fonction accompagnement_a_notifier) ne donne les informations qu'à l'auteur
 * de l'invitation, une seule fois, dans le quart d'heure qui suit. La route ne
 * peut donc pas servir à écrire à n'importe qui, ni deux fois.
 */

type ApiResponse = { ok: true } | { error: string };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function idDuCorps(body: unknown): string | null {
  let corps = body;
  if (typeof corps === 'string') {
    try {
      corps = JSON.parse(corps);
    } catch {
      return null;
    }
  }
  const id = corps && typeof corps === 'object' ? (corps as Record<string, unknown>).id : null;
  return typeof id === 'string' && UUID.test(id) ? id : null;
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

  const jeton = req.headers.authorization?.replace(/^Bearer\s+/i, '').trim();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const cle = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!jeton || !url || !cle) return res.status(401).json({ error: 'Session invalide.' });

  const id = idDuCorps(req.body);
  if (!id) return res.status(400).json({ error: 'Invitation invalide.' });

  // Client au nom de la personne connectée : la base sait qui appelle.
  const client = createClient(url, cle, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { Authorization: `Bearer ${jeton}` } },
  });
  const { data, error } = await client.rpc('accompagnement_a_notifier', { p_id: id });
  if (error) return res.status(401).json({ error: 'Session invalide.' });

  const invitation = versInvitation(data as Record<string, unknown> | null);
  if (!invitation) return res.status(409).json({ error: 'Aucun email à envoyer pour cette invitation.' });

  const base = process.env.NEXT_PUBLIC_APP_URL || 'https://oskar-coach.fr';
  const { sujet, html, texte } = emailInvitation(invitation, base);

  try {
    const { error: erreurEnvoi } = await new Resend(apiKey).emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'Oskar <onboarding@resend.dev>',
      to: invitation.destinataireEmail,
      replyTo: invitation.auteurEmail,
      subject: sujet,
      html,
      text: texte,
    });
    if (erreurEnvoi) {
      console.error('[notifier-accompagnement] Resend a renvoyé une erreur:', erreurEnvoi.message);
      return res.status(502).json({ error: `Resend : ${erreurEnvoi.message}` });
    }
    return res.status(200).json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[notifier-accompagnement] échec:', message);
    return res.status(502).json({ error: `Envoi impossible : ${message}` });
  }
}
