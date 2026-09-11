import { echapperHtml } from '@/lib/coachs/notification';

/*
 * L'email envoyé à l'équipe à chaque nouveau compte (route
 * /api/notifier-inscription). Nom et entreprise viennent du formulaire
 * d'inscription, public : ils sont échappés.
 */

export interface NouvelInscrit {
  nom: string;
  email: string;
  entreprise: string;
}

export function emailNouvelInscrit(
  i: NouvelInscrit,
  urlFiche: string
): { sujet: string; html: string; texte: string } {
  const nom = i.nom.trim() || i.email;
  const lignes: [string, string][] = [
    ['Email', i.email.trim()],
    ['Entreprise', i.entreprise.trim()],
  ].filter((l): l is [string, string] => Boolean(l[1]));

  const html = `
  <div style="font-family:Arial,Helvetica,sans-serif;color:#1f2937;max-width:560px;margin:auto;">
    <div style="background:#1e2d7d;color:#fff;padding:20px 24px;border-radius:12px 12px 0 0;">
      <h1 style="margin:0;font-size:20px;">Nouveau compte sur Oskar</h1>
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
      <p style="margin-top:20px;"><a href="${urlFiche}" style="background:#00d4b4;color:#151f5e;font-weight:bold;text-decoration:none;padding:10px 16px;border-radius:9px;display:inline-block;">Voir sa fiche</a></p>
      <p style="color:#6b7280;font-size:13px;margin-top:20px;">Répondre à cet email écrit directement à ${echapperHtml(nom)}.</p>
    </div>
  </div>`;

  const texte = [
    `Nouveau compte sur Oskar : ${nom}`,
    '',
    ...lignes.map(([k, v]) => `${k} : ${v}`),
    '',
    `Voir sa fiche : ${urlFiche}`,
  ].join('\n');

  const suffixe = i.entreprise.trim() ? ` (${i.entreprise.trim()})` : '';
  return { sujet: `Nouveau compte — ${nom}${suffixe}`, html, texte };
}
