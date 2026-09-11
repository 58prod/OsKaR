import { echapperHtml } from '@/lib/coachs/notification';
import { OBJETS_DEMANDE, comptesDeLaDemande, estSurMesure, type DemandeFormule } from './formules';

/*
 * L'email envoyé à l'équipe à chaque nouvelle demande de formule (route
 * /api/notifier-demande-formule). Tout ce que la personne a saisi est échappé :
 * le formulaire est public.
 */

export function emailNouvelleDemande(
  d: DemandeFormule,
  urlAdmin: string
): { sujet: string; html: string; texte: string } {
  const nom = `${d.prenom.trim()} ${d.nom.trim()}`;
  const objet = OBJETS_DEMANDE.find((o) => o.id === d.objet);
  const comptes = comptesDeLaDemande(d);
  const lignes: [string, string][] = [
    ['Formule', objet ? `${objet.libelle} (${objet.detail})` : d.objet],
    [d.objet === 'reseau' ? 'Réseau' : 'Entreprise', d.entreprise.trim()],
    ['Email', d.email.trim()],
    [d.objet === 'reseau' ? 'Adhérents' : 'Comptes', comptes ? String(comptes) : ''],
  ].filter((l): l is [string, string] => Boolean(l[1]));

  const titre = estSurMesure(d.objet) ? 'Nouvelle demande sur mesure' : 'Nouvelle demande de formule';

  const html = `
  <div style="font-family:Arial,Helvetica,sans-serif;color:#1f2937;max-width:560px;margin:auto;">
    <div style="background:#1e2d7d;color:#fff;padding:20px 24px;border-radius:12px 12px 0 0;">
      <h1 style="margin:0;font-size:20px;">${titre}</h1>
    </div>
    <div style="border:1px solid #e5e7eb;border-top:0;padding:20px 24px;border-radius:0 0 12px 12px;">
      <p style="font-size:17px;font-weight:bold;color:#1e2d7d;margin:0 0 12px;">${echapperHtml(nom)}</p>
      <table style="font-size:14px;border-collapse:collapse;">
        ${lignes
          .map(
            ([k, v]) =>
              `<tr><td style="color:#6b7280;padding:3px 14px 3px 0;vertical-align:top;">${k}</td><td style="padding:3px 0;">${echapperHtml(v)}</td></tr>`
          )
          .join('')}
      </table>
      ${
        d.message.trim()
          ? `<p style="background:#f5f6fa;border-radius:10px;padding:12px 14px;font-size:14px;line-height:1.6;white-space:pre-wrap;">${echapperHtml(d.message.trim())}</p>`
          : ''
      }
      <p style="margin-top:20px;"><a href="${urlAdmin}" style="background:#00d4b4;color:#151f5e;font-weight:bold;text-decoration:none;padding:10px 16px;border-radius:9px;display:inline-block;">Traiter la demande</a></p>
      <p style="color:#6b7280;font-size:13px;margin-top:20px;">Répondre à cet email écrit directement à ${echapperHtml(d.prenom.trim())}.</p>
    </div>
  </div>`;

  const texte = [
    `${titre} : ${nom}`,
    '',
    ...lignes.map(([k, v]) => `${k} : ${v}`),
    ...(d.message.trim() ? ['', d.message.trim()] : []),
    '',
    `Traiter la demande : ${urlAdmin}`,
  ].join('\n');

  return { sujet: `${titre} — ${d.entreprise.trim()} (${nom})`, html, texte };
}
