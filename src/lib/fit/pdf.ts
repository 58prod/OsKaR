import { jsPDF } from 'jspdf';
import { detailsFit, scoreFit, signauxResumes, statutFit, type AtelierFit } from './types';

/*
 * « Télécharger PDF » de l'atelier Fit : transposition de `exportFitPDF` dans
 * `fit-atelier.html` — bandeau navy, statut, quatre sections à filet navy,
 * encart « Prochaine étape recommandée », pied de page daté.
 *
 * Seul écart volontaire : l'emoji du statut est retiré, la police Helvetica de
 * jsPDF ne sait pas le dessiner (la maquette imprimait des caractères parasites).
 */

const NAVY: [number, number, number] = [30, 45, 125];
const TEAL: [number, number, number] = [0, 212, 180];

/** « ✅ FIT Confirmé » → « FIT Confirmé ». */
const sansEmoji = (texte: string) => texte.replace(/^[^\p{L}]+/u, '');

export function telechargerPdfFit(atelier: AtelierFit): void {
  const statut = statutFit(scoreFit(atelier));
  const details = detailsFit(atelier);
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  const W = 210;
  const M = 18;
  const CW = W - M * 2;

  // En-tête
  doc.setFillColor(...NAVY);
  doc.rect(0, 0, W, 38, 'F');
  doc.setTextColor(...TEAL);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('MODULE 02 — OSKAR FIT', M, 13);
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(20);
  doc.text('Diagnostic Market Fit', M, 27);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text('hasenso.fr/oskar', W - M, 13, { align: 'right' });

  let y = 48;

  // Statut
  doc.setFillColor(240, 242, 248);
  doc.roundedRect(M, y, CW, 22, 3, 3, 'F');
  doc.setTextColor(...NAVY);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('Statut FIT', M + 6, y + 8);
  doc.setFontSize(13);
  doc.text(sansEmoji(statut.libelle), M + 6, y + 17);
  y += 30;

  const section = (titre: string, contenu: string) => {
    doc.setDrawColor(...NAVY);
    doc.setLineWidth(0.5);
    doc.line(M, y, M + CW, y);
    y += 6;
    doc.setTextColor(...NAVY);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text(titre.toUpperCase(), M, y);
    y += 5;
    doc.setTextColor(60, 60, 80);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    const lignes = doc.splitTextToSize(contenu, CW);
    doc.text(lignes, M, y);
    y += lignes.length * 5 + 6;
  };

  section('Offre', details.offre);
  section('Différenciation', details.differenciation);
  section('Positionnement concurrentiel', details.concurrence);
  section('Signaux marché', signauxResumes(atelier, false) || '—');

  // Prochaine étape
  y += 4;
  doc.setFillColor(...NAVY);
  doc.roundedRect(M, y, CW, 24, 3, 3, 'F');
  doc.setTextColor(...TEAL);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text('PROCHAINE ÉTAPE RECOMMANDÉE', M + 6, y + 7);
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(doc.splitTextToSize(statut.prochaineEtapePdf, CW - 12), M + 6, y + 14);

  // Pied de page
  doc.setTextColor(150, 150, 160);
  doc.setFontSize(8);
  doc.text('OSKAR — Hasenso · hasenso.fr/oskar', M, 290);
  doc.text(new Date().toLocaleDateString('fr-FR'), W - M, 290, { align: 'right' });

  doc.save('oskar-fit-diagnostic.pdf');
}
