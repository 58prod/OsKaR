import { echapperHtml } from '@/lib/coachs/notification';

/*
 * L'email qui prévient la personne invitée (route /api/notifier-accompagnement).
 * Les informations viennent de la base (fonction accompagnement_a_notifier),
 * jamais du navigateur. Noms et entreprises sont saisis par les comptes : échappés.
 */

export interface InvitationANotifier {
  sens: 'coach_vers_dirigeant' | 'dirigeant_vers_coach';
  destinataireEmail: string;
  destinataireNom: string | null;
  /** Le dirigeant invité a-t-il déjà un compte ? */
  aUnCompte: boolean;
  auteurNom: string | null;
  auteurEmail: string;
  /** Structure du coach, entreprise du dirigeant. */
  auteurPrecision: string | null;
}

export function versInvitation(r: Record<string, unknown> | null): InvitationANotifier | null {
  if (!r || typeof r.destinataire_email !== 'string' || typeof r.auteur_email !== 'string') return null;
  const texte = (v: unknown) => (typeof v === 'string' && v.trim() ? v.trim() : null);
  return {
    sens: r.sens === 'dirigeant_vers_coach' ? 'dirigeant_vers_coach' : 'coach_vers_dirigeant',
    destinataireEmail: r.destinataire_email,
    destinataireNom: texte(r.destinataire_nom),
    aUnCompte: r.a_un_compte === true,
    auteurNom: texte(r.auteur_nom),
    auteurEmail: r.auteur_email,
    auteurPrecision: texte(r.auteur_structure) ?? texte(r.auteur_entreprise),
  };
}

export function emailInvitation(
  i: InvitationANotifier,
  base: string
): { sujet: string; html: string; texte: string } {
  const auteur = i.auteurNom || i.auteurEmail;
  const qui = i.auteurPrecision ? `${auteur} (${i.auteurPrecision})` : auteur;
  const prenom = i.destinataireNom?.split(/\s+/)[0];
  const bonjour = prenom ? `Bonjour ${prenom},` : 'Bonjour,';

  const versDirigeant = i.sens === 'coach_vers_dirigeant';
  const titre = versDirigeant ? 'Une invitation de votre coach' : 'Une demande d’accompagnement';
  const sujet = versDirigeant
    ? `${auteur} vous propose de vous accompagner sur Oskar`
    : `${auteur} vous demande de l’accompagner sur Oskar`;
  const paragraphes = versDirigeant
    ? [
        `${qui} souhaite vous accompagner sur Oskar.`,
        `En acceptant, vous lui donnez accès à tout ce que vous saisissez dans Oskar — ateliers, OKR, bilans — et votre coach reçoit chaque matin un résumé de vos avancées de la veille. Vous pouvez y mettre fin à tout moment.`,
        ...(i.aUnCompte
          ? []
          : [`Créez votre compte avec cette adresse (${i.destinataireEmail}) : l’invitation vous y attendra.`]),
      ]
    : [
        `${qui} souhaite que vous l’accompagniez sur Oskar.`,
        `Si vous acceptez, vous verrez tout ce qu’il ou elle saisit dans Oskar — ateliers, OKR, bilans — et vous recevrez chaque matin à 8 h le résumé de la veille.`,
      ];
  const url = `${base}${versDirigeant ? '/app/mes-coachs' : '/app/mes-dirigeants'}`;
  const bouton = versDirigeant ? (i.aUnCompte ? 'Répondre à l’invitation' : 'Créer mon compte et répondre') : 'Répondre à la demande';

  const html = `
  <div style="font-family:Arial,Helvetica,sans-serif;color:#1f2937;max-width:560px;margin:auto;">
    <div style="background:#1e2d7d;color:#fff;padding:20px 24px;border-radius:12px 12px 0 0;">
      <h1 style="margin:0;font-size:20px;">${titre}</h1>
    </div>
    <div style="border:1px solid #e5e7eb;border-top:0;padding:20px 24px;border-radius:0 0 12px 12px;font-size:15px;line-height:1.6;">
      <p style="margin:0 0 12px;">${echapperHtml(bonjour)}</p>
      ${paragraphes.map((p) => `<p style="margin:0 0 12px;">${echapperHtml(p)}</p>`).join('')}
      <p style="margin-top:20px;"><a href="${url}" style="background:#00d4b4;color:#151f5e;font-weight:bold;text-decoration:none;padding:10px 16px;border-radius:9px;display:inline-block;">${bouton}</a></p>
      <p style="color:#6b7280;font-size:13px;margin-top:20px;">Répondre à cet email écrit directement à ${echapperHtml(auteur)}.</p>
    </div>
  </div>`;

  const texte = [bonjour, '', ...paragraphes.flatMap((p) => [p, '']), `${bouton} : ${url}`].join('\n');

  return { sujet, html, texte };
}
