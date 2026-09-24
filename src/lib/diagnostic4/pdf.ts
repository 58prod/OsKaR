import { jsPDF } from 'jspdf';
import { fmt, stateColor, stateLabel } from '@/lib/diagnostic';
import { libelleReponse4, type Analyse4 } from './calcul';

/*
 * Synthèse PDF du Diagnostic (version à 20 pratiques), jointe à l'email du
 * bilan. Même charte que l'ancienne synthèse (lib/diagnostic/pdf.ts) ; le
 * contenu suit la restitution de la page : profil, notes et couverture,
 * priorité, écarts, pistes d'action, pilier par pilier.
 */

const NAVY = '#1e2d7d';
const TEAL = '#00d4b4';
const INK = '#1f2937';
const MUTED = '#6b7280';

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '');
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
}

/** Les polices standard du PDF ne connaissent que le Latin-1 : on remplace les signes typographiques qui en sortent. */
export function textePdf(texte: string): string {
  return texte
    .replace(/[’‘]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/[—–]/g, '-')
    .replace(/…/g, '...')
    .replace(/[  ]/g, ' ');
}

export function genererPdfDiagnostic4(analyse: Analyse4, base = 'https://oskar-coach.fr'): ArrayBuffer {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();
  const marge = 16;
  const largeur = W - marge * 2;
  let y = 0;

  const fond = (hex: string) => doc.setFillColor(...hexToRgb(hex));
  const encre = (hex: string) => doc.setTextColor(...hexToRgb(hex));
  const place = (besoin: number) => { if (y + besoin > H - marge) { doc.addPage(); y = marge; } };

  const section = (titre: string) => {
    place(16);
    y += 4;
    fond(TEAL);
    doc.rect(marge, y - 3.5, 3, 5, 'F');
    encre(NAVY);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text(textePdf(titre), marge + 6, y);
    y += 7;
  };

  const paragraphe = (texte: string, taille = 10, couleur = INK, gras = false, retrait = 0) => {
    doc.setFont('helvetica', gras ? 'bold' : 'normal');
    doc.setFontSize(taille);
    encre(couleur);
    (doc.splitTextToSize(textePdf(texte), largeur - retrait) as string[]).forEach((ligne) => {
      place(taille * 0.5);
      doc.text(ligne, marge + retrait, y);
      y += taille * 0.5 + 0.6;
    });
  };

  // En-tête
  fond(NAVY);
  doc.rect(0, 0, W, 34, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(19);
  doc.text('OSKAR - Diagnostic de maturité', marge, 15);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  const date = new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });
  doc.text(`${analyse.notes.length}/${analyse.nbAttendu / 5} piliers notés · ${date}`, marge, 24);
  y = 46;

  // Score global et profil
  if (analyse.moyenne !== null && analyse.niveauGlobal) {
    encre(NAVY);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(40);
    doc.text(fmt(analyse.moyenne), marge, y + 6);
    const l = doc.getTextWidth(fmt(analyse.moyenne));
    encre(MUTED);
    doc.setFontSize(14);
    doc.text('/ 10', marge + l + 2, y + 6);
    encre(stateColor(analyse.niveauGlobal).c);
    doc.setFontSize(11);
    doc.text(stateLabel(analyse.niveauGlobal).toUpperCase(), marge, y + 13);
    encre(MUTED);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text(`Établi sur ${analyse.nbExploitables} pratiques sur ${analyse.nbAttendu / 5 * 4}`, marge, y + 18.5);
    y += 26;
  } else {
    paragraphe('Score global indisponible', 14, NAVY, true);
    paragraphe('Au moins un pilier a moins de deux pratiques renseignées. Clarifiez d’abord les réponses « Je ne sais pas » ou vérifiez les « Non applicable ».', 10, MUTED);
    y += 2;
  }
  if (analyse.profil) {
    paragraphe(`Votre profil : ${analyse.profil.nom}`, 12, NAVY, true);
    paragraphe(analyse.profil.texte, 10, INK);
  }

  // Notes par pilier
  section('Notes par pilier');
  analyse.verdicts.forEach((v) => {
    place(7);
    encre(INK);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text(textePdf(`${v.label} · perception ${v.perception}/10`), marge, y);
    if (v.note !== null && v.niveau) {
      encre(stateColor(v.niveau).c);
      doc.setFont('helvetica', 'bold');
      doc.text(textePdf(`${fmt(v.note)} · ${stateLabel(v.niveau)}`), W - marge, y, { align: 'right' });
    } else {
      encre(MUTED);
      doc.text('à clarifier', W - marge, y, { align: 'right' });
    }
    y += 6.5;
  });

  // Priorité
  if (analyse.priorite) {
    section(`Priorité proposée, à confirmer : ${analyse.priorite.label}`);
    paragraphe(analyse.priorite.titre, 9, MUTED);
    paragraphe(analyse.priorite.texte, 10, INK);
    y += 1;
    paragraphe(analyse.priorite.justification, 9.5, MUTED);
  }

  // Écarts
  if (analyse.ecarts.length) {
    section('Votre perception face aux pratiques déclarées');
    analyse.ecarts.forEach((e) => {
      paragraphe(`${e.label} : perception ${e.perception}/10, pratiques ${fmt(e.pratiques)}/10`, 10, NAVY, true);
      paragraphe(e.sens === 'superieure'
        ? 'Qu’est-ce qui explique cette perception plus favorable ? Examinez les éléments sur lesquels vous vous appuyez.'
        : 'Quelles difficultés expliquent cette perception plus réservée malgré les pratiques déclarées ?', 9.5, MUTED);
      y += 1;
    });
  }

  // Pistes d'action
  if (analyse.leviers.length) {
    section('Pistes d’action pour les 30 prochains jours');
    analyse.leviers.forEach((l, i) => {
      paragraphe(`${i + 1}. ${l.label} · ${l.verification}`, 10, NAVY, true);
      paragraphe(`${l.reponse === 'inconnu' ? 'À clarifier : ' : 'Action à adapter : '}${l.action}`, 9.5, INK, false, 4);
      y += 1.5;
    });
  }

  // Pilier par pilier
  section('Pilier par pilier');
  analyse.verdicts.forEach((v) => {
    paragraphe(`${v.label} · ${v.titre}`, 10, NAVY, true);
    paragraphe(v.texte, 9, MUTED);
    v.constats.forEach((c) => paragraphe(`${libelleReponse4(c.reponse)} · ${c.texte}`, 9, INK, false, 4));
    y += 2;
  });

  // Suite
  section('Et maintenant ?');
  if (analyse.priorite) {
    paragraphe(analyse.priorite.atelier.promesse, 10, INK);
    paragraphe(`${analyse.priorite.atelier.libelle} : ${base}${analyse.priorite.atelier.href}`, 10, NAVY, true);
  } else {
    paragraphe(`Choisissez un point à explorer, puis définissez une action adaptée à votre contexte : ${base}/app/okr`, 10, INK);
  }
  y += 2;
  paragraphe('Ce bilan repose sur vos déclarations, sans vérification externe. Les preuves sont à examiner avec votre coach. Refaites ce diagnostic dans trois mois pour mesurer vos progrès.', 8.5, MUTED);

  return doc.output('arraybuffer');
}
