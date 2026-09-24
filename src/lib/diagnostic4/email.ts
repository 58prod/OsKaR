import { fmt, stateLabel } from '@/lib/diagnostic';
import { echapperHtml } from '@/lib/coachs/notification';
import type { Analyse4 } from './calcul';

/** Corps de l'email qui accompagne la synthèse PDF du Diagnostic. Tout est échappé par principe. */
export function emailBilan4(a: Analyse4, base: string): string {
  const e = echapperHtml;
  const lignes = a.verdicts
    .map((v) => `<li style="margin:2px 0;">${e(v.label)} — <strong>${v.note === null ? 'à clarifier' : `${fmt(v.note)}/10`}</strong>${v.niveau ? ` (${stateLabel(v.niveau)})` : ''}</li>`)
    .join('');
  const global = a.moyenne !== null && a.niveauGlobal
    ? `Score global : <strong>${fmt(a.moyenne)}/10</strong> — ${stateLabel(a.niveauGlobal)}${a.profil ? `, profil <strong>${e(a.profil.nom)}</strong>` : ''}.`
    : 'Score global indisponible : au moins un pilier reste à clarifier.';
  const priorite = a.priorite
    ? `<p>Priorité proposée, à confirmer : <strong>${e(a.priorite.label)}</strong>.<br/>
       <a href="${base}${a.priorite.atelier.href}" style="color:#1e2d7d;">${e(a.priorite.atelier.libelle)} →</a></p>`
    : '';
  return `
  <div style="font-family:Arial,Helvetica,sans-serif;color:#1f2937;max-width:560px;margin:auto;">
    <div style="background:#1e2d7d;color:#fff;padding:20px 24px;border-radius:12px 12px 0 0;">
      <h1 style="margin:0;font-size:20px;">Votre diagnostic Oskar</h1>
    </div>
    <div style="border:1px solid #e5e7eb;border-top:0;padding:20px 24px;border-radius:0 0 12px 12px;">
      <p>Bonjour,</p>
      <p>${global}</p>
      <ul style="padding-left:18px;">${lignes}</ul>
      ${priorite}
      <p>Le détail (écarts entre perception et pratiques, pistes d’action, pilier par pilier) se trouve dans le PDF joint.</p>
      <p style="color:#6b7280;font-size:13px;margin-top:24px;">— L’équipe Oskar</p>
    </div>
  </div>
  <br/><br/>`;
}
