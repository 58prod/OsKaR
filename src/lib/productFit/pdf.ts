import { jsPDF } from 'jspdf';
import type { ProductFitAnalysis, ProductFitProject } from './types';

/*
 * Synthèse PDF du bilan « Potentiel Produit ».
 * Même facture que le PDF du Diagnostic (`lib/diagnostic/pdf.ts`) : bandeau
 * navy, note en gros, sections à filet turquoise. Utilisable côté serveur.
 */

const NAVY = '#1e2d7d';
const TEAL = '#00d4b4';
const INK = '#1f2937';
const MUTED = '#6b7280';
const CORAL = '#e2653f';

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '');
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
}

/** Couleur du verdict, alignée sur l'écran. */
function couleurTon(ton: ProductFitAnalysis['verdictTone']): string {
  if (ton === 'success') return '#00806e';
  if (ton === 'info') return '#0369a1';
  if (ton === 'warning') return '#b45309';
  return CORAL;
}

export function generateProductFitPdf(
  analysis: ProductFitAnalysis,
  projet?: Pick<ProductFitProject, 'projectName' | 'pitch'>
): ArrayBuffer {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();
  const margin = 16;
  const maxW = W - margin * 2;
  let y = 0;

  const fill = (hex: string) => doc.setFillColor(...hexToRgb(hex));
  const ink = (hex: string) => doc.setTextColor(...hexToRgb(hex));
  const guard = (needed: number) => {
    if (y + needed > H - margin) {
      doc.addPage();
      y = margin;
    }
  };

  const section = (title: string) => {
    guard(16);
    y += 4;
    fill(TEAL);
    doc.rect(margin, y - 3.5, 3, 5, 'F');
    ink(NAVY);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text(title, margin + 6, y);
    y += 7;
  };

  const paragraph = (text: string, size = 10, color = INK, bold = false) => {
    doc.setFont('helvetica', bold ? 'bold' : 'normal');
    doc.setFontSize(size);
    ink(color);
    const lines = doc.splitTextToSize(text, maxW) as string[];
    lines.forEach((line) => {
      guard(size * 0.5);
      doc.text(line, margin, y);
      y += size * 0.5 + 0.6;
    });
  };

  // En-tête
  fill(NAVY);
  doc.rect(0, 0, W, 34, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(19);
  doc.text('OSKAR — Potentiel Produit', margin, 15);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  const date = new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });
  const nom = projet?.projectName?.trim();
  doc.text(nom ? `${nom} · ${date}` : date, margin, 24);
  y = 46;

  // Note et verdict
  ink(NAVY);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(40);
  const note = String(analysis.globalScoreOn10);
  doc.text(note, margin, y + 6);
  const largeur = doc.getTextWidth(note);
  ink(MUTED);
  doc.setFontSize(14);
  doc.text('/ 10', margin + largeur + 2, y + 6);
  ink(couleurTon(analysis.verdictTone));
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text(analysis.verdictLabel.toUpperCase(), margin, y + 13);
  y += 20;
  paragraph(analysis.verdictDescription, 10, INK);
  y += 2;

  if (projet?.pitch?.trim()) {
    section('Votre produit');
    paragraph(projet.pitch.trim(), 10, INK);
  }

  // Le premier client
  if (analysis.priorityPersona) {
    section('Par qui commencer');
    paragraph(analysis.priorityPersona.personaName, 11, NAVY, true);
    if (analysis.priorityPersona.role) paragraph(analysis.priorityPersona.role, 9.5, MUTED);
    paragraph(analysis.priorityPersona.priorityExplanation, 9.5, INK);
  }

  // Comparaison
  if (analysis.personasResults.length) {
    section('Vos profils, comparés');
    analysis.personasResults.forEach((p) => {
      guard(7);
      ink(INK);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.text(p.personaName, margin, y);
      ink(p.isPriorityTarget ? NAVY : MUTED);
      doc.setFont('helvetica', 'bold');
      doc.text(`${p.scoreOn10} / 10`, W - margin, y, { align: 'right' });
      y += 6.5;
    });
  }

  if (analysis.strengths.length) {
    section('Vos atouts');
    analysis.strengths.forEach((t) => paragraph(`• ${t}`, 9.5, INK));
  }

  if (analysis.vulnerabilities.length) {
    section('À surveiller');
    analysis.vulnerabilities.forEach((t) => paragraph(`• ${t}`, 9.5, INK));
  }

  if (analysis.actionRecommendations.length) {
    section('Et maintenant ?');
    analysis.actionRecommendations.forEach((r) => {
      paragraph(r.title, 10, NAVY, true);
      paragraph(r.advice, 9.5, MUTED);
      y += 1.5;
    });
  }

  return doc.output('arraybuffer');
}
