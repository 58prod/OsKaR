import { fmt, stateLabel } from '@/lib/diagnostic';
import { echapperHtml } from '@/lib/coachs/notification';
import type { Analyse4c } from './calcul';

/** Corps HTML du bilan : tous les textes viennent de lib/diagnostic4c, échappés par principe. */
export function emailBilan4c(a: Analyse4c, base: string): string {
  const e = echapperHtml;
  const lignes = a.notes
    .map((n) => `<tr><td style="padding:4px 12px 4px 0;">${e(n.label)}</td><td style="padding:4px 0;"><strong>${fmt(n.note)}/10</strong> · ${stateLabel(n.niveau)}</td></tr>`)
    .join('');
  const actions = a.actions
    .map((x) => `<li style="margin:0 0 10px;"><strong>${e(x.label)}</strong> — ${e(x.action)}<br/><a href="${base}${x.outil.href}" style="color:#1e2d7d;">${e(x.outil.libelle)} →</a></li>`)
    .join('');
  const priorite = a.priorite
    ? `<h2 style="font-size:16px;color:#1e2d7d;margin:24px 0 6px;">Votre priorité : ${e(a.priorite.label)}</h2>
       <p style="margin:0 0 4px;"><strong>${e(a.priorite.titre)}</strong></p>
       <p style="margin:0 0 8px;color:#4b5563;">${e(a.priorite.texte)}</p>
       ${a.domino ? `<p style="margin:0 0 8px;color:#4b5563;">${e(a.domino.texte)}</p>` : ''}
       <p style="margin:12px 0 0;"><a href="${base}${a.priorite.atelier.href}" style="display:inline-block;background:#00d4b4;color:#0f1a4d;font-weight:bold;padding:10px 16px;border-radius:8px;text-decoration:none;">${e(a.priorite.atelier.libelle)} →</a></p>`
    : '';
  const ecarts = a.ecarts.length
    ? `<h2 style="font-size:16px;color:#1e2d7d;margin:24px 0 6px;">Votre perception face à vos pratiques</h2>
       <ul style="padding-left:18px;margin:0;">${a.ecarts.map((x) => `<li>${x.sens === 'angle-mort' ? 'Angle mort' : 'Force sous-estimée'} · ${e(x.label)} : perception ${x.perception}/10, pratiques ${fmt(x.note)}/10.</li>`).join('')}</ul>`
    : '';
  return `
  <div style="font-family:Arial,Helvetica,sans-serif;color:#1f2937;max-width:560px;margin:auto;font-size:14px;line-height:1.5;">
    <div style="background:#1e2d7d;color:#fff;padding:20px 24px;border-radius:12px 12px 0 0;">
      <div style="font-size:12px;letter-spacing:.1em;text-transform:uppercase;color:#00d4b4;">Votre diagnostic Oskar</div>
      <h1 style="margin:6px 0 0;font-size:22px;">${e(a.profil?.nom ?? '')} · ${a.moyenne !== null ? fmt(a.moyenne) : '—'}/10</h1>
    </div>
    <div style="border:1px solid #e5e7eb;border-top:0;padding:20px 24px;border-radius:0 0 12px 12px;">
      <p style="margin:0 0 16px;">${e(a.profil?.texte ?? '')}</p>
      <table style="border-collapse:collapse;">${lignes}</table>
      ${priorite}
      ${ecarts}
      ${actions ? `<h2 style="font-size:16px;color:#1e2d7d;margin:24px 0 8px;">Vos actions pour les 30 prochains jours</h2><ol style="padding-left:18px;margin:0;">${actions}</ol>` : ''}
      <p style="margin:24px 0 0;">Refaites le diagnostic dans trois mois pour mesurer vos progrès : <a href="${base}/diagnostic4c" style="color:#1e2d7d;">${base.replace(/^https?:\/\//, '')}/diagnostic4c</a></p>
      <p style="color:#6b7280;font-size:12px;margin-top:20px;">Ce bilan repose sur vos réponses, sans vérification. Votre adresse n’a servi qu’à cet envoi. — L’équipe Oskar</p>
    </div>
  </div>`;
}
