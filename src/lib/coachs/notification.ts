import { PILIERS_COACH, type Candidature } from './candidature';

/*
 * L'email envoyé à l'équipe à chaque nouvelle candidature à l'annuaire
 * (route /api/notifier-candidature). Tout ce que la personne a saisi est
 * échappé : le formulaire est public.
 */

export function echapperHtml(texte: string): string {
  return texte
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function emailNouvelleCandidature(
  c: Candidature,
  urlAdmin: string
): { sujet: string; html: string; texte: string } {
  const nom = `${c.prenom.trim()} ${c.nom.trim()}`;
  const piliers = PILIERS_COACH.filter((p) => c.piliers.includes(p.id)).map((p) => p.libelle).join(', ');
  const lignes: [string, string][] = [
    ['Email', c.email.trim()],
    ['Structure', c.structure.trim()],
    ['Zone', c.zone.trim()],
    ['Site', c.site.trim()],
    ['Piliers', piliers],
    ['Label Réunir pour Réussir', c.labelRpr ? 'Oui' : 'Non'],
  ].filter((l): l is [string, string] => Boolean(l[1]));

  const html = `
  <div style="font-family:Arial,Helvetica,sans-serif;color:#1f2937;max-width:560px;margin:auto;">
    <div style="background:#1e2d7d;color:#fff;padding:20px 24px;border-radius:12px 12px 0 0;">
      <h1 style="margin:0;font-size:20px;">Nouvelle candidature à l'annuaire</h1>
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
        c.approche.trim()
          ? `<p style="background:#f5f6fa;border-radius:10px;padding:12px 14px;font-size:14px;line-height:1.6;white-space:pre-wrap;">${echapperHtml(c.approche.trim())}</p>`
          : ''
      }
      <p style="margin-top:20px;"><a href="${urlAdmin}" style="background:#00d4b4;color:#151f5e;font-weight:bold;text-decoration:none;padding:10px 16px;border-radius:9px;display:inline-block;">Traiter la candidature</a></p>
      <p style="color:#6b7280;font-size:13px;margin-top:20px;">Répondre à cet email écrit directement à ${echapperHtml(c.prenom.trim())}.</p>
    </div>
  </div>`;

  const texte = [
    `Nouvelle candidature à l'annuaire : ${nom}`,
    '',
    ...lignes.map(([k, v]) => `${k} : ${v}`),
    ...(c.approche.trim() ? ['', c.approche.trim()] : []),
    '',
    `Traiter la candidature : ${urlAdmin}`,
  ].join('\n');

  return { sujet: `Nouvelle candidature coach — ${nom}`, html, texte };
}
