import jsPDF from 'jspdf';
import * as ExcelJS from 'exceljs';
import { analyticsService } from './analytics';
import { ReportType } from '@/types';
import type { ReportFormat, Ambition, KeyResult, OKR, Action, QuarterlyObjective, QuarterlyKeyResult, Progress } from '@/types';

// Interface pour les données d'export
export interface ExportData {
  ambitions: Ambition[];
  keyResults: KeyResult[];
  okrs: OKR[];
  actions: Action[];
  quarterlyObjectives: QuarterlyObjective[];
  quarterlyKeyResults: QuarterlyKeyResult[];
  progress?: Progress[];
}

// Service d'export et de génération de rapports
export class ExportService {
  private static instance: ExportService;

  private constructor() {}

  public static getInstance(): ExportService {
    if (!ExportService.instance) {
      ExportService.instance = new ExportService();
    }
    return ExportService.instance;
  }

  // Export PDF
  public async exportToPDF(data: ExportData, reportType: ReportType = ReportType.MONTHLY): Promise<void> {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;

    // Utiliser les données passées en paramètre
    const { ambitions, okrs, actions, quarterlyObjectives, quarterlyKeyResults } = data;

    // Configuration
    const margin = 20;
    const lineHeight = 7;
    let yPosition = margin;

    // Couleurs
    const primaryColor: [number, number, number] = [14, 165, 233]; // #0ea5e9
    const successColor: [number, number, number] = [34, 197, 94]; // #22c55e
    const warningColor: [number, number, number] = [245, 158, 11]; // #f59e0b
    const grayColor: [number, number, number] = [107, 114, 128]; // #6b7280
    const lightGray: [number, number, number] = [243, 244, 246]; // #f3f4f6

    // Bannière d'en-tête avec fond coloré
    doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.rect(0, 0, pageWidth, 40, 'F');

    // Logo/Titre en blanc
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.text('📊 Rapport Oskar', pageWidth / 2, 20, { align: 'center' });

    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.text(this.getReportTypeLabel(reportType), pageWidth / 2, 30, { align: 'center' });

    // Reset couleur texte
    doc.setTextColor(0, 0, 0);
    yPosition = 50;

    // Encadré info date
    doc.setFillColor(lightGray[0], lightGray[1], lightGray[2]);
    doc.roundedRect(margin, yPosition, pageWidth - 2 * margin, 12, 2, 2, 'F');
    doc.setFontSize(10);
    doc.setTextColor(grayColor[0], grayColor[1], grayColor[2]);
    doc.text(`📅 Généré le ${new Date().toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}`, margin + 5, yPosition + 8);
    doc.setTextColor(0, 0, 0);
    yPosition += 20;

    // Métriques principales - Section avec fond
    const metrics = analyticsService.getDashboardMetrics(ambitions, okrs, actions, quarterlyObjectives, quarterlyKeyResults);

    // Titre de section
    doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.rect(margin, yPosition, 4, 10, 'F');
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text('📈 Métriques principales', margin + 8, yPosition + 7);
    doc.setTextColor(0, 0, 0);
    yPosition += 18;

    // Cartes métriques (2 colonnes)
    const cardWidth = (pageWidth - 2 * margin - 10) / 2;
    const cardHeight = 22;
    const metricsData = [
      { label: 'Objectifs annuels', value: metrics.totalAmbitions, icon: '🎯' },
      { label: 'OKRs actifs', value: metrics.activeOKRs, icon: '📊' },
      { label: 'Actions complétées', value: metrics.completedActions, icon: '✅' },
      { label: 'Échéances à venir', value: metrics.upcomingDeadlines, icon: '⏰' },
    ];

    metricsData.forEach((metric, index) => {
      const col = index % 2;
      const row = Math.floor(index / 2);
      const x = margin + col * (cardWidth + 10);
      const y = yPosition + row * (cardHeight + 5);

      // Fond carte
      doc.setFillColor(lightGray[0], lightGray[1], lightGray[2]);
      doc.roundedRect(x, y, cardWidth, cardHeight, 2, 2, 'F');

      // Icône et label
      doc.setFontSize(10);
      doc.setTextColor(grayColor[0], grayColor[1], grayColor[2]);
      doc.text(`${metric.icon} ${metric.label}`, x + 5, y + 8);

      // Valeur
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.text(metric.value.toString(), x + 5, y + 18);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(0, 0, 0);
    });
    yPosition += Math.ceil(metricsData.length / 2) * (cardHeight + 5) + 10;

    // Barre de progrès global
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('Progrès global', margin, yPosition);
    yPosition += 8;

    const progressBarWidth = pageWidth - 2 * margin;
    const progressBarHeight = 12;

    // Fond barre
    doc.setFillColor(230, 230, 230);
    doc.roundedRect(margin, yPosition, progressBarWidth, progressBarHeight, 2, 2, 'F');

    // Barre de progression
    const progressWidth = (metrics.overallProgress / 100) * progressBarWidth;
    const progressColor: [number, number, number] = metrics.overallProgress >= 75 ? successColor : metrics.overallProgress >= 50 ? warningColor : [239, 68, 68];
    doc.setFillColor(progressColor[0], progressColor[1], progressColor[2]);
    doc.roundedRect(margin, yPosition, progressWidth, progressBarHeight, 2, 2, 'F');

    // Texte pourcentage
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(255, 255, 255);
    if (progressWidth > 20) {
      doc.text(`${metrics.overallProgress}%`, margin + progressWidth - 15, yPosition + 8);
    } else {
      doc.setTextColor(0, 0, 0);
      doc.text(`${metrics.overallProgress}%`, margin + progressWidth + 5, yPosition + 8);
    }
    doc.setTextColor(0, 0, 0);
    yPosition += 20;

    // Objectifs annuels
    if (ambitions.length > 0) {
      // Titre de section
      doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.rect(margin, yPosition, 4, 10, 'F');
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.text('🎯 Objectifs Annuels', margin + 8, yPosition + 7);
      doc.setTextColor(0, 0, 0);
      yPosition += 18;

      ambitions.forEach((ambition, index) => {
        if (yPosition > pageHeight - 60) {
          doc.addPage();
          yPosition = margin + 10;
        }

        const progress = analyticsService.calculateAmbitionProgress(ambition.id);

        // Encadré ambition
        doc.setFillColor(lightGray[0], lightGray[1], lightGray[2]);
        const boxHeight = 35 + (ambition.description ? 15 : 0);
        doc.roundedRect(margin, yPosition, pageWidth - 2 * margin, boxHeight, 2, 2, 'F');

        // Numéro + Titre
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(0, 0, 0);
        doc.text(`${index + 1}. ${ambition.title}`, margin + 5, yPosition + 8);

        // Badges catégorie et statut
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.setFillColor(200, 200, 255);
        doc.roundedRect(margin + 5, yPosition + 12, 30, 6, 1, 1, 'F');
        doc.text(ambition.category, margin + 7, yPosition + 16);

        const statusColor: [number, number, number] = ambition.status === 'active' ? successColor : grayColor;
        doc.setFillColor(statusColor[0], statusColor[1], statusColor[2]);
        doc.roundedRect(margin + 38, yPosition + 12, 20, 6, 1, 1, 'F');
        doc.setTextColor(255, 255, 255);
        doc.text(ambition.status, margin + 40, yPosition + 16);
        doc.setTextColor(0, 0, 0);

        // Barre de progrès mini
        const miniBarY = yPosition + 22;
        const miniBarWidth = pageWidth - 2 * margin - 10;
        doc.setFillColor(220, 220, 220);
        doc.roundedRect(margin + 5, miniBarY, miniBarWidth, 6, 1, 1, 'F');

        const miniProgress = (progress / 100) * miniBarWidth;
        const miniColor: [number, number, number] = progress >= 75 ? successColor : progress >= 50 ? warningColor : [239, 68, 68];
        doc.setFillColor(miniColor[0], miniColor[1], miniColor[2]);
        doc.roundedRect(margin + 5, miniBarY, miniProgress, 6, 1, 1, 'F');

        doc.setFontSize(7);
        doc.setFont('helvetica', 'bold');
        doc.text(`${progress}%`, margin + 5 + miniBarWidth + 3, miniBarY + 4);

        // Description
        if (ambition.description) {
          doc.setFontSize(9);
          doc.setFont('helvetica', 'normal');
          doc.setTextColor(grayColor[0], grayColor[1], grayColor[2]);
          const lines = doc.splitTextToSize(ambition.description, pageWidth - 2 * margin - 15);
          doc.text(lines.slice(0, 2), margin + 5, yPosition + 32);
          doc.setTextColor(0, 0, 0);
        }

        yPosition += boxHeight + 8;
      });
      yPosition += 5;
    }

    // OKRs du trimestre actuel
    const currentQuarter = this.getCurrentQuarter();
    const currentYear = new Date().getFullYear();
    const currentOKRs = okrs.filter(
      okr => okr.quarter === currentQuarter && okr.year === currentYear
    );

    if (currentOKRs.length > 0) {
      if (yPosition > pageHeight - 60) {
        doc.addPage();
        yPosition = margin + 10;
      }

      // Titre de section
      doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.rect(margin, yPosition, 4, 10, 'F');
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.text(`📊 OKRs ${currentQuarter} ${currentYear}`, margin + 8, yPosition + 7);
      doc.setTextColor(0, 0, 0);
      yPosition += 18;

      currentOKRs.forEach((okr, index) => {
        if (yPosition > pageHeight - 70) {
          doc.addPage();
          yPosition = margin + 10;
        }

        const progress = analyticsService.calculateOKRProgress(okr.id);
        const krCount = okr.keyResults.length;
        const boxHeight = 25 + krCount * 10;

        // Encadré OKR
        doc.setFillColor(250, 250, 255);
        doc.roundedRect(margin, yPosition, pageWidth - 2 * margin, boxHeight, 2, 2, 'F');

        // Bordure gauche colorée
        const borderColor: [number, number, number] = progress >= 75 ? successColor : progress >= 50 ? warningColor : [239, 68, 68];
        doc.setFillColor(borderColor[0], borderColor[1], borderColor[2]);
        doc.rect(margin, yPosition, 3, boxHeight, 'F');

        // Titre OKR
        doc.setFontSize(11);
        doc.setFont('helvetica', 'bold');
        doc.text(`${index + 1}. ${okr.objective}`, margin + 8, yPosition + 8);

        // Badge progrès
        doc.setFontSize(8);
        doc.setFillColor(borderColor[0], borderColor[1], borderColor[2]);
        doc.roundedRect(pageWidth - margin - 35, yPosition + 4, 30, 7, 1, 1, 'F');
        doc.setTextColor(255, 255, 255);
        doc.text(`${progress}%`, pageWidth - margin - 28, yPosition + 9);
        doc.setTextColor(0, 0, 0);

        // Key Results
        let krY = yPosition + 16;
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        okr.keyResults.forEach((kr, krIndex) => {
          const krProgress = kr.target > 0 ? (kr.current / kr.target) * 100 : 0;

          // Puce
          doc.setFillColor(grayColor[0], grayColor[1], grayColor[2]);
          doc.circle(margin + 10, krY - 1, 1, 'F');

          // Texte KR
          doc.setTextColor(grayColor[0], grayColor[1], grayColor[2]);
          const krText = `${kr.title}: ${kr.current}/${kr.target} ${kr.unit}`;
          doc.text(krText, margin + 14, krY);

          // Mini barre
          const miniBarWidth = 30;
          const miniBarX = pageWidth - margin - miniBarWidth - 5;
          doc.setFillColor(230, 230, 230);
          doc.rect(miniBarX, krY - 3, miniBarWidth, 4, 'F');
          doc.setFillColor(borderColor[0], borderColor[1], borderColor[2]);
          doc.rect(miniBarX, krY - 3, (krProgress / 100) * miniBarWidth, 4, 'F');

          krY += 10;
        });
        doc.setTextColor(0, 0, 0);

        yPosition += boxHeight + 8;
      });
      yPosition += 5;
    }

    // Pied de page avec design
    const totalPages = doc.internal.pages.length - 1;
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);

      // Ligne de séparation
      doc.setDrawColor(grayColor[0], grayColor[1], grayColor[2]);
      doc.setLineWidth(0.5);
      doc.line(margin, pageHeight - 18, pageWidth - margin, pageHeight - 18);

      // Texte pied de page
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(grayColor[0], grayColor[1], grayColor[2]);
      doc.text('📊 Généré par Oskar', margin, pageHeight - 10);
      doc.text(`Page ${i} / ${totalPages}`, pageWidth - margin, pageHeight - 10, { align: 'right' });
      doc.setTextColor(0, 0, 0);
    }

    // Téléchargement
    const fileName = `okarina-rapport-${reportType}-${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(fileName);
  }

  // Export Excel
  public async exportToExcel(data: ExportData, reportType: ReportType = ReportType.MONTHLY): Promise<void> {
    const workbook = new ExcelJS.Workbook();

    // Configuration du workbook
    workbook.creator = 'Oskar';
    workbook.lastModifiedBy = 'Oskar';
    workbook.created = new Date();
    workbook.modified = new Date();

    // Utiliser les données passées en paramètre
    const { ambitions, okrs, actions, quarterlyObjectives, quarterlyKeyResults, keyResults } = data;

    // Feuille 1: Métriques
    const metrics = analyticsService.getDashboardMetrics(ambitions, okrs, actions, quarterlyObjectives, quarterlyKeyResults);
    const metricsData = [
      ['Métrique', 'Valeur'],
      ['Objectifs annuels totaux', metrics.totalAmbitions],
      ['OKRs actifs', metrics.activeOKRs],
      ['Actions complétées', metrics.completedActions],
      ['Progrès global (%)', metrics.overallProgress],
      ['Progrès mensuel (%)', metrics.monthlyProgress],
      ['Échéances à venir', metrics.upcomingDeadlines],
    ];
    const metricsSheet = workbook.addWorksheet('Métriques');
    metricsSheet.addRows(metricsData);

    // Formatage de l'en-tête
    metricsSheet.getRow(1).font = { bold: true };
    metricsSheet.columns = [
      { width: 25 },
      { width: 15 }
    ];

    // Feuille 2: Objectifs annuels
    const ambitionsData = [
      ['Titre', 'Description', 'Catégorie', 'Priorité', 'Statut', 'Progrès (%)', 'Créé le']
    ];

    ambitions.forEach(ambition => {
      const progress = analyticsService.calculateAmbitionProgress(ambition.id);
      ambitionsData.push([
        ambition.title,
        ambition.description,
        ambition.category,
        ambition.priority,
        ambition.status,
        progress.toString(),
        new Date(ambition.createdAt).toLocaleDateString('fr-FR')
      ]);
    });

    const ambitionsSheet = workbook.addWorksheet('Objectifs annuels');
    ambitionsSheet.addRows(ambitionsData);

    // Formatage de l'en-tête
    ambitionsSheet.getRow(1).font = { bold: true };
    ambitionsSheet.columns = [
      { width: 20 }, // Titre
      { width: 30 }, // Description
      { width: 15 }, // Catégorie
      { width: 12 }, // Priorité
      { width: 12 }, // Statut
      { width: 12 }, // Progrès
      { width: 12 }  // Créé le
    ];

    // Feuille 3: Résultats Clés
    const keyResultsData = [
      ['Titre', 'Valeur Actuelle', 'Valeur Cible', 'Unité', 'Progrès (%)', 'Échéance', 'SMART']
    ];

    keyResults.forEach(kr => {
      const progress = kr.target > 0 ? (kr.current / kr.target) * 100 : 0;
      keyResultsData.push([
        kr.title,
        kr.current.toString(),
        kr.target.toString(),
        kr.unit,
        Math.round(progress).toString(),
        new Date(kr.deadline).toLocaleDateString('fr-FR'),
        'N/A' // isSmartCompliant removed
      ]);
    });

    const keyResultsSheet = workbook.addWorksheet('Résultats Clés');
    keyResultsSheet.addRows(keyResultsData);

    // Formatage de l'en-tête
    keyResultsSheet.getRow(1).font = { bold: true };
    keyResultsSheet.columns = [
      { width: 25 }, // Titre
      { width: 15 }, // Valeur Actuelle
      { width: 15 }, // Valeur Cible
      { width: 10 }, // Unité
      { width: 12 }, // Progrès
      { width: 12 }, // Échéance
      { width: 8 }   // SMART
    ];

    // Feuille 4: OKRs
    const okrsData = [
      ['Objectif', 'Trimestre', 'Année', 'Progrès (%)', 'Statut', 'Nb KRs']
    ];

    okrs.forEach(okr => {
      const progress = analyticsService.calculateOKRProgress(okr.id);
      okrsData.push([
        okr.objective,
        okr.quarter,
        okr.year.toString(),
        progress.toString(),
        okr.status,
        okr.keyResults.length.toString()
      ]);
    });

    const okrsSheet = workbook.addWorksheet('OKRs');
    okrsSheet.addRows(okrsData);

    // Formatage de l'en-tête
    okrsSheet.getRow(1).font = { bold: true };
    okrsSheet.columns = [
      { width: 30 }, // Objectif
      { width: 12 }, // Trimestre
      { width: 8 },  // Année
      { width: 12 }, // Progrès
      { width: 12 }, // Statut
      { width: 8 }   // Nb KRs
    ];

    // Feuille 5: Actions
    const actionsData = [
      ['Titre', 'Description', 'Échéance', 'Statut', 'Priorité', 'Labels', 'Date de Création']
    ];

    actions.forEach(action => {
      actionsData.push([
        action.title,
        action.description || '',
        action.deadline ? new Date(action.deadline).toLocaleDateString('fr-FR') : '',
        action.status,
        action.priority,
        action.labels.join(', '),
        action.createdAt.toLocaleDateString('fr-FR')
      ]);
    });

    const actionsSheet = workbook.addWorksheet('Actions');
    actionsSheet.addRows(actionsData);

    // Formatage de l'en-tête
    actionsSheet.getRow(1).font = { bold: true };
    actionsSheet.columns = [
      { width: 25 }, // Titre
      { width: 30 }, // Description
      { width: 12 }, // Échéance
      { width: 12 }, // Statut
      { width: 12 }, // Priorité
      { width: 15 }, // Heures Estimées
      { width: 15 }  // Heures Réelles
    ];

    // Génération et téléchargement du fichier
    const fileName = `okarina-donnees-${reportType}-${new Date().toISOString().split('T')[0]}.xlsx`;
    const buffer = await workbook.xlsx.writeBuffer();

    // Création du blob et téléchargement
    const blob = new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);
  }

  // Export JSON (données complètes)
  public exportToJSON(data: ExportData): void {
    const jsonData = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = `okarina-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);
  }

  // Génération de rapport personnalisé
  public generateCustomReport(data: ExportData, options: {
    includeAmbitions: boolean;
    includeOKRs: boolean;
    includeActions: boolean;
    includeTasks: boolean;
    includeProgress: boolean;
    format: ReportFormat;
    dateRange?: { start: Date; end: Date };
  }): void {
    switch (options.format) {
      case 'pdf':
        this.generateCustomPDF(data, options);
        break;
      case 'excel':
        this.generateCustomExcel(data, options);
        break;
      case 'json':
        this.generateCustomJSON(data, options);
        break;
    }
  }

  // Méthodes utilitaires privées
  private getReportTypeLabel(type: ReportType): string {
    const labels = {
      [ReportType.MONTHLY]: 'Mensuel',
      [ReportType.QUARTERLY]: 'Trimestriel',
      [ReportType.ANNUAL]: 'Annuel',
      [ReportType.CUSTOM]: 'Personnalisé'
    };
    return labels[type] || type;
  }

  private getCurrentQuarter(): string {
    const month = new Date().getMonth();
    if (month < 3) return 'Q1';
    if (month < 6) return 'Q2';
    if (month < 9) return 'Q3';
    return 'Q4';
  }

  private generateCustomPDF(data: ExportData, options: any): void {
    // Implémentation simplifiée pour le PDF personnalisé
    this.exportToPDF(data, ReportType.CUSTOM);
  }

  private generateCustomExcel(data: ExportData, options: any): void {
    // Implémentation simplifiée pour l'Excel personnalisé
    this.exportToExcel(data, ReportType.CUSTOM);
  }

  private generateCustomJSON(data: ExportData, options: any): void {
    // Implémentation simplifiée pour le JSON personnalisé
    this.exportToJSON(data);
  }
}

// Instance singleton
export const exportService = ExportService.getInstance();
