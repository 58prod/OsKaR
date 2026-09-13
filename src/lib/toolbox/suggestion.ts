import { echapperHtml } from '@/lib/coachs/notification';

/*
 * Suggestion d'outil pour la Boîte à outils (modale « Suggérer un outil »,
 * route /api/suggest-tool) : lecture du formulaire et email envoyé à
 * l'équipe. Le formulaire est public : tout est borné et échappé.
 */

/** Destinataire par défaut (redirigé vers Christophe et Eric). */
export const SUGGESTIONS_EMAIL_DEFAUT = 'contact@oskar-coach.fr';

export const SUGGESTION_MAX = { nom: 80, description: 500, prenom: 30, email: 120 } as const;

export interface Suggestion {
  nom: string;
  description: string;
  prenom: string;
  email: string;
}

export function emailValide(email: string): boolean {
  return /^[^\s@<>()]+@[^\s@<>()]+\.[^\s@<>()]{2,}$/.test(email);
}

/** Ne garde que les champs attendus, nettoyés et bornés. */
export function suggestionDuCorps(corps: Record<string, unknown>): Suggestion {
  const texte = (cle: string, max: number) => {
    const v = corps[cle];
    return typeof v === 'string' ? v.trim().slice(0, max) : '';
  };
  return {
    nom: texte('name', SUGGESTION_MAX.nom),
    description: texte('description', SUGGESTION_MAX.description),
    prenom: texte('from', SUGGESTION_MAX.prenom),
    email: texte('email', SUGGESTION_MAX.email),
  };
}

/** Message d'erreur à afficher, ou null si la suggestion peut partir. */
export function problemeSuggestion(s: Suggestion): string | null {
  if (!s.nom) return "Le nom de l'outil est requis.";
  if (s.email && !emailValide(s.email)) return "L'adresse email ne semble pas valide.";
  return null;
}

export function emailSuggestionOutil(s: Suggestion): { sujet: string; html: string; texte: string } {
  const lignes: [string, string][] = [
    ['Proposé par', s.prenom],
    ['Email', s.email],
  ].filter((l): l is [string, string] => Boolean(l[1]));

  const html = `
  <div style="font-family:Arial,Helvetica,sans-serif;color:#1f2937;max-width:560px;margin:auto;">
    <div style="background:#1e2d7d;color:#fff;padding:20px 24px;border-radius:12px 12px 0 0;">
      <h1 style="margin:0;font-size:20px;">Nouvelle suggestion d'outil</h1>
    </div>
    <div style="border:1px solid #e5e7eb;border-top:0;padding:20px 24px;border-radius:0 0 12px 12px;">
      <p style="font-size:17px;font-weight:bold;color:#1e2d7d;margin:0 0 12px;">${echapperHtml(s.nom)}</p>
      ${
        s.description
          ? `<p style="background:#f5f6fa;border-radius:10px;padding:12px 14px;font-size:14px;line-height:1.6;white-space:pre-wrap;">${echapperHtml(s.description)}</p>`
          : ''
      }
      ${
        lignes.length
          ? `<table style="font-size:14px;border-collapse:collapse;">${lignes
            .map(([k, v]) => `<tr><td style="color:#6b7280;padding:3px 14px 3px 0;">${k}</td><td style="padding:3px 0;">${echapperHtml(v)}</td></tr>`)
            .join('')}</table>`
          : ''
      }
      <p style="color:#6b7280;font-size:13px;margin-top:20px;">${
        s.email
          ? `Répondre à cet email écrit directement à ${echapperHtml(s.prenom || s.email)}.`
          : 'Suggestion anonyme : aucune adresse laissée pour répondre.'
      }</p>
      <p style="color:#6b7280;font-size:13px;">— Boîte à outils Oskar</p>
    </div>
  </div>`;

  const texte = [
    `Nouvelle suggestion d'outil : ${s.nom}`,
    ...(s.description ? ['', s.description] : []),
    ...(lignes.length ? ['', ...lignes.map(([k, v]) => `${k} : ${v}`)] : []),
  ].join('\n');

  return { sujet: `Suggestion d'outil — ${s.nom}`, html, texte };
}
