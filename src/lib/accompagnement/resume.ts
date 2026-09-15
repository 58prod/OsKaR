import { echapperHtml } from '@/lib/coachs/notification';
import { COULEURS_PILIERS } from '@/constants/piliers';
import type { ActiviteJour, ResumeCoach } from './types';

/*
 * Le résumé envoyé chaque matin à 8 h (heure de Paris) à chaque coach : ce que
 * ses dirigeants ont fait la veille. Route /api/resume-coachs, appelée par la
 * fonction planifiée Netlify `resume-coachs` à 6 h et 7 h UTC : l'une des deux
 * tombe à 8 h à Paris, en heure d'été comme en heure d'hiver.
 */

export const HEURE_RESUME = 8;

/** La date (AAAA-MM-JJ) et l'heure à Paris. */
export function partiesParis(d: Date): { jour: string; heure: number } {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Europe/Paris',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(d);
  const v = (type: string) => parts.find((p) => p.type === type)?.value ?? '';
  return { jour: `${v('year')}-${v('month')}-${v('day')}`, heure: Number(v('hour')) };
}

export function estLHeureDuResume(maintenant: Date): boolean {
  return partiesParis(maintenant).heure === HEURE_RESUME;
}

/** La veille, à Paris : la journée que résume l'email du matin. */
export function veilleParis(maintenant: Date): string {
  const [a, m, j] = partiesParis(maintenant).jour.split('-').map(Number);
  return new Date(Date.UTC(a, m - 1, j - 1)).toISOString().slice(0, 10);
}

/** « lundi 14 septembre ». */
export function jourEnToutesLettres(jour: string): string {
  return new Date(`${jour}T12:00:00Z`).toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    timeZone: 'Europe/Paris',
  });
}

const s = (n: number, mot: string) => `${n} ${mot}${n > 1 ? 's' : ''}`;

/** Ce qui a bougé, sujet par sujet, avec la couleur du pilier. */
export function sujetsDuJour(a: ActiviteJour): { libelle: string; couleur: string }[] {
  const liste: { libelle: string; couleur: string }[] = [];
  if (a.vision) liste.push({ libelle: 'Vision', couleur: COULEURS_PILIERS.vision.dark });
  if (a.fit) liste.push({ libelle: 'Market Fit', couleur: COULEURS_PILIERS.fit.dark });
  if (a.finance) liste.push({ libelle: 'Finance', couleur: COULEURS_PILIERS.finance.dark });
  if (a.okr > 0) liste.push({ libelle: `OKR (${s(a.okr, 'élément')})`, couleur: COULEURS_PILIERS.okr.dark });
  if (a.team) liste.push({ libelle: 'Team', couleur: COULEURS_PILIERS.team.dark });
  if (a.bilans > 0) liste.push({ libelle: s(a.bilans, 'bilan'), couleur: '#1e2d7d' });
  return liste;
}

export function emailResumeQuotidien(
  r: ResumeCoach,
  jour: string,
  base: string
): { sujet: string; html: string; texte: string } {
  const date = jourEnToutesLettres(jour);
  const n = r.dirigeants.length;
  const prenom = r.coachNom?.trim().split(/\s+/)[0] ?? '';
  const urlReglages = `${base}/app/mes-dirigeants#reglages`;
  const nom = (d: ResumeCoach['dirigeants'][number]) => d.nom?.trim() || d.email;

  const blocs = r.dirigeants
    .map((d) => {
      const sujets = sujetsDuJour(d.activite)
        .map(
          (x) =>
            `<span style="display:inline-block;margin:0 6px 6px 0;padding:3px 10px;border-radius:20px;font-size:13px;font-weight:bold;color:${x.couleur};border:1.5px solid ${x.couleur};">${echapperHtml(x.libelle)}</span>`
        )
        .join('');
      return `
      <div style="border:1px solid #e2e4f0;border-radius:12px;padding:16px 18px;margin-bottom:12px;">
        <p style="margin:0;font-size:16px;font-weight:bold;color:#1e2d7d;">${echapperHtml(nom(d))}</p>
        ${d.entreprise ? `<p style="margin:2px 0 0;font-size:14px;color:#6b7280;">${echapperHtml(d.entreprise)}</p>` : ''}
        <div style="margin-top:10px;">${sujets}</div>
        <p style="margin:8px 0 0;"><a href="${base}/app/mes-dirigeants/${d.id}" style="color:#1e2d7d;font-weight:bold;font-size:14px;">Voir ce qui a changé →</a></p>
      </div>`;
    })
    .join('');

  const html = `
  <div style="font-family:Arial,Helvetica,sans-serif;color:#1f2937;max-width:560px;margin:auto;">
    <div style="background:#1e2d7d;color:#fff;padding:20px 24px;border-radius:12px 12px 0 0;">
      <h1 style="margin:0;font-size:20px;">Vos dirigeants hier</h1>
      <p style="margin:4px 0 0;font-size:14px;opacity:.8;">${echapperHtml(date)}</p>
    </div>
    <div style="border:1px solid #e5e7eb;border-top:0;padding:20px 24px;border-radius:0 0 12px 12px;">
      <p style="font-size:15px;line-height:1.6;margin:0 0 16px;">
        ${prenom ? `Bonjour ${echapperHtml(prenom)},` : 'Bonjour,'}<br />
        ${n > 1 ? `${n} dirigeants que vous accompagnez ont avancé` : 'Un dirigeant que vous accompagnez a avancé'} sur Oskar ${echapperHtml(date)}.
      </p>
      ${blocs}
      <p style="color:#6b7280;font-size:12.5px;line-height:1.6;margin-top:20px;">
        Vous recevez ce résumé parce que vous accompagnez ces dirigeants sur Oskar.
        Pour ne plus le recevoir, ou en retirer un dirigeant : <a href="${urlReglages}" style="color:#6b7280;">vos réglages</a>.
      </p>
    </div>
  </div>`;

  const texte = [
    prenom ? `Bonjour ${prenom},` : 'Bonjour,',
    '',
    `Ce que vos dirigeants ont fait sur Oskar ${date} :`,
    '',
    ...r.dirigeants.flatMap((d) => [
      `• ${nom(d)}${d.entreprise ? ` (${d.entreprise})` : ''} : ${sujetsDuJour(d.activite)
        .map((x) => x.libelle)
        .join(', ')}`,
      `  ${base}/app/mes-dirigeants/${d.id}`,
    ]),
    '',
    `Ne plus recevoir ce résumé : ${urlReglages}`,
  ].join('\n');

  return {
    sujet: n > 1 ? `Oskar — ${n} dirigeants ont avancé ${date}` : `Oskar — ${nom(r.dirigeants[0])} a avancé ${date}`,
    html,
    texte,
  };
}
