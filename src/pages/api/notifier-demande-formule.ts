import type { NextApiRequest, NextApiResponse } from 'next';
import { Resend } from 'resend';
import {
  DEMANDE_VIDE,
  LONGUEURS_MAX_DEMANDE,
  OBJETS_DEMANDE,
  problemeDemande,
  type DemandeFormule,
} from '@/lib/tarifs/formules';
import { emailNouvelleDemande } from '@/lib/tarifs/notification';

/*
 * Prévient l'équipe d'une nouvelle demande de formule.
 * Appelée par le formulaire de la page Tarifs une fois la demande enregistrée.
 *
 * Destinataire : DEMANDES_EMAIL, sinon contact@oskar-coach.fr (redirigée vers
 * Christophe et Eric). « Répondre » écrit directement à la personne.
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
function demandeDuCorps(corps: Record<string, unknown>): DemandeFormule {
  const texte = (cle: keyof typeof LONGUEURS_MAX_DEMANDE) => {
    const v = corps[cle];
    return typeof v === 'string' ? v.slice(0, LONGUEURS_MAX_DEMANDE[cle]) : '';
  };
  const objet = OBJETS_DEMANDE.find((o) => o.id === corps.objet)?.id ?? DEMANDE_VIDE.objet;
  return {
    prenom: texte('prenom'),
    nom: texte('nom'),
    email: texte('email'),
    entreprise: texte('entreprise'),
    message: texte('message'),
    objet,
    comptes: typeof corps.comptes === 'string' ? corps.comptes.slice(0, 12) : '',
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
  if (!corps) return res.status(400).json({ error: 'Demande invalide.' });

  const d = demandeDuCorps(corps);
  const probleme = problemeDemande(d);
  if (probleme) return res.status(400).json({ error: probleme });

  const base = process.env.NEXT_PUBLIC_APP_URL || 'https://oskar-coach.fr';
  const { sujet, html, texte } = emailNouvelleDemande(d, `${base}/admin/demandes`);

  try {
    const resend = new Resend(apiKey);
    const { error } = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'Oskar <onboarding@resend.dev>',
      to: process.env.DEMANDES_EMAIL || 'contact@oskar-coach.fr',
      replyTo: d.email.trim(),
      subject: sujet,
      html,
      text: texte,
    });
    if (error) {
      console.error('[notifier-demande-formule] Resend a renvoyé une erreur:', error.message);
      return res.status(502).json({ error: `Resend : ${error.message}` });
    }
    return res.status(200).json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[notifier-demande-formule] échec:', message);
    return res.status(502).json({ error: `Envoi impossible : ${message}` });
  }
}
