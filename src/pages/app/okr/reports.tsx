import React, { useState, useMemo } from 'react';
import { OkrShell } from '@/components/layout/OkrShell';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useAppStore } from '@/store/useAppStore';
import { useQuarterlyObjectives } from '@/hooks/useQuarterlyObjectives';
import { useQuarterlyKeyResultsByUser } from '@/hooks/useQuarterlyKeyResults';
import { useActions } from '@/hooks/useActions';
import { FileText, Download, TrendingUp, Target, CheckCircle, BarChart3, FileJson } from 'lucide-react';
import { Quarter, ActionStatus } from '@/types';

type ReportType = 'quarterly' | 'annual' | 'custom';
type ExportFormat = 'pdf' | 'excel' | 'json';

const ReportsPage: React.FC = () => {
  const { user } = useAppStore();
  const [reportType, setReportType] = useState<ReportType>('quarterly');
  const [selectedQuarter, setSelectedQuarter] = useState<Quarter>(Quarter.Q1);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [exportFormat, setExportFormat] = useState<ExportFormat>('pdf');
  const [isGenerating, setIsGenerating] = useState(false);

  // Récupérer les données
  const { data: objectives = [] } = useQuarterlyObjectives(user?.id);
  const { data: keyResults = [] } = useQuarterlyKeyResultsByUser(user?.id);
  const { data: actions = [] } = useActions(user?.id);

  // Filtrer les données selon le type de rapport
  const filteredData = useMemo(() => {
    if (reportType === 'quarterly') {
      const filteredObjectives = objectives.filter(
        obj => obj.quarter === selectedQuarter && obj.year === selectedYear
      );
      const objectiveIds = filteredObjectives.map(obj => obj.id);
      const filteredKeyResults = keyResults.filter(kr => objectiveIds.includes(kr.quarterlyObjectiveId));
      const krIds = filteredKeyResults.map(kr => kr.id);
      const filteredActions = actions.filter(action => action.quarterlyKeyResultId && krIds.includes(action.quarterlyKeyResultId));

      return { objectives: filteredObjectives, keyResults: filteredKeyResults, actions: filteredActions };
    } else if (reportType === 'annual') {
      const filteredObjectives = objectives.filter(obj => obj.year === selectedYear);
      const objectiveIds = filteredObjectives.map(obj => obj.id);
      const filteredKeyResults = keyResults.filter(kr => objectiveIds.includes(kr.quarterlyObjectiveId));
      const krIds = filteredKeyResults.map(kr => kr.id);
      const filteredActions = actions.filter(action => action.quarterlyKeyResultId && krIds.includes(action.quarterlyKeyResultId));

      return { objectives: filteredObjectives, keyResults: filteredKeyResults, actions: filteredActions };
    } else {
      return { objectives, keyResults, actions };
    }
  }, [reportType, selectedQuarter, selectedYear, objectives, keyResults, actions]);

  // Calculer les statistiques
  const stats = useMemo(() => {
    const totalObjectives = filteredData.objectives.length;
    const totalKeyResults = filteredData.keyResults.length;
    const totalActions = filteredData.actions.length;

    const completedKRs = filteredData.keyResults.filter(kr => {
      const progress = kr.target > 0 ? (kr.current / kr.target) * 100 : 0;
      return progress >= 100;
    }).length;

    const avgProgress = filteredData.keyResults.length > 0
      ? filteredData.keyResults.reduce((sum, kr) => {
          const progress = kr.target > 0 ? (kr.current / kr.target) * 100 : 0;
          return sum + Math.min(progress, 100);
        }, 0) / filteredData.keyResults.length
      : 0;

    const completedActions = filteredData.actions.filter(a => a.status === ActionStatus.DONE).length;

    return {
      totalObjectives,
      totalKeyResults,
      totalActions,
      completedKRs,
      avgProgress,
      completedActions,
      krCompletionRate: totalKeyResults > 0 ? (completedKRs / totalKeyResults) * 100 : 0,
      actionCompletionRate: totalActions > 0 ? (completedActions / totalActions) * 100 : 0,
    };
  }, [filteredData]);

  const handleGenerateReport = async () => {
    setIsGenerating(true);

    try {
      if (exportFormat === 'pdf') {
        await generatePDFReport();
      } else if (exportFormat === 'json') {
        generateJSONReport();
      } else {
        alert('Export Excel à venir prochainement');
      }
    } catch (error) {
      console.error('Erreur lors de la génération du rapport:', error);
      alert('Erreur lors de la génération du rapport');
    } finally {
      setIsGenerating(false);
    }
  };

  const generatePDFReport = async () => {
    // Chargé à la demande : le générateur PDF pèse ~130 ko, inutile tant
    // qu'on ne clique pas sur « Générer ».
    const { jsPDF } = await import('jspdf');
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    let yPosition = 20;

    // Titre
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    const title = reportType === 'quarterly' 
      ? `Rapport ${selectedQuarter} ${selectedYear}`
      : reportType === 'annual'
      ? `Rapport Annuel ${selectedYear}`
      : 'Rapport Personnalisé';
    doc.text(title, pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 15;

    // Date de génération
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Généré le ${new Date().toLocaleDateString('fr-FR')}`, pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 15;

    // Statistiques
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Statistiques Globales', 20, yPosition);
    yPosition += 10;

    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.text(`• Objectifs : ${stats.totalObjectives}`, 25, yPosition);
    yPosition += 7;
    doc.text(`• Key Results : ${stats.completedKRs}/${stats.totalKeyResults} (${stats.krCompletionRate.toFixed(0)}%)`, 25, yPosition);
    yPosition += 7;
    doc.text(`• Progression moyenne : ${stats.avgProgress.toFixed(1)}%`, 25, yPosition);
    yPosition += 7;
    doc.text(`• Actions : ${stats.completedActions}/${stats.totalActions} (${stats.actionCompletionRate.toFixed(0)}%)`, 25, yPosition);
    yPosition += 15;

    // Objectifs
    if (filteredData.objectives.length > 0) {
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Objectifs', 20, yPosition);
      yPosition += 10;

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      filteredData.objectives.forEach((obj, index) => {
        if (yPosition > 270) {
          doc.addPage();
          yPosition = 20;
        }
        doc.text(`${index + 1}. ${obj.title}`, 25, yPosition);
        yPosition += 6;
        if (obj.description) {
          const lines = doc.splitTextToSize(obj.description, pageWidth - 50);
          doc.setFontSize(9);
          doc.setTextColor(100);
          lines.forEach((line: string) => {
            if (yPosition > 270) {
              doc.addPage();
              yPosition = 20;
            }
            doc.text(line, 30, yPosition);
            yPosition += 5;
          });
          doc.setFontSize(10);
          doc.setTextColor(0);
        }
        yPosition += 5;
      });
    }

    // Key Results
    if (filteredData.keyResults.length > 0 && yPosition < 250) {
      yPosition += 10;
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Key Results', 20, yPosition);
      yPosition += 10;

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      filteredData.keyResults.slice(0, 10).forEach((kr, index) => {
        if (yPosition > 270) {
          doc.addPage();
          yPosition = 20;
        }
        const progress = kr.target > 0 ? (kr.current / kr.target) * 100 : 0;
        doc.text(`${index + 1}. ${kr.title}`, 25, yPosition);
        yPosition += 6;
        doc.setFontSize(9);
        doc.setTextColor(100);
        doc.text(`   ${kr.current} / ${kr.target} ${kr.unit} (${progress.toFixed(0)}%)`, 30, yPosition);
        doc.setFontSize(10);
        doc.setTextColor(0);
        yPosition += 7;
      });
    }

    // Téléchargement
    const fileName = `oskar-rapport-${reportType}-${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(fileName);
  };

  const generateJSONReport = () => {
    const reportData = {
      type: reportType,
      period: reportType === 'quarterly' ? `${selectedQuarter} ${selectedYear}` : `${selectedYear}`,
      generatedAt: new Date().toISOString(),
      statistics: stats,
      data: filteredData,
    };

    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `oskar-rapport-${reportType}-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const quarters: Quarter[] = [Quarter.Q1, Quarter.Q2, Quarter.Q3, Quarter.Q4];
  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);

  if (!user) {
    return (
      <OkrShell title="Rapports" topbarTitle="Rapports" topbarSubtitle="Générez et exportez vos rapports de performance">
        <div className="flex items-center justify-center py-40">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-teal"></div>
        </div>
      </OkrShell>
    );
  }

  return (
    <OkrShell title="Rapports" topbarTitle="Rapports" topbarSubtitle="Générez et exportez vos rapports de performance">
      <div>
        {/* En-tête */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-navy flex items-center">
            <FileText className="h-8 w-8 mr-3 text-teal-dark" aria-hidden />
            Rapports
          </h1>
          <p className="mt-2 text-muted">
            Générez et exportez vos rapports de performance
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Configuration du rapport */}
          <div className="lg:col-span-1 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Configuration</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Type de rapport */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Type de rapport</label>
                  <div className="space-y-2">
                    <button
                      onClick={() => setReportType('quarterly')}
                      className={`w-full px-4 py-2 text-left rounded-lg border transition-colors ${
                        reportType === 'quarterly'
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-gray-300 hover:border-gray-400'
                      }`}
                    >
                      <div className="font-medium">Trimestriel</div>
                      <div className="text-xs text-gray-500">Rapport d'un trimestre</div>
                    </button>
                    <button
                      onClick={() => setReportType('annual')}
                      className={`w-full px-4 py-2 text-left rounded-lg border transition-colors ${
                        reportType === 'annual'
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-gray-300 hover:border-gray-400'
                      }`}
                    >
                      <div className="font-medium">Annuel</div>
                      <div className="text-xs text-gray-500">Rapport de l'année complète</div>
                    </button>
                  </div>
                </div>

                {/* Période */}
                {reportType === 'quarterly' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Trimestre</label>
                    <div className="grid grid-cols-2 gap-2">
                      {quarters.map(q => (
                        <button
                          key={q}
                          onClick={() => setSelectedQuarter(q)}
                          className={`px-3 py-2 rounded-lg border transition-colors ${
                            selectedQuarter === q
                              ? 'border-blue-500 bg-blue-50 text-blue-700'
                              : 'border-gray-300 hover:border-gray-400'
                          }`}
                        >
                          {q}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Année</label>
                  <select
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {years.map(year => (
                      <option key={year} value={year}>{year}</option>
                    ))}
                  </select>
                </div>

                {/* Format d'export */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Format d'export</label>
                  <div className="space-y-2">
                    <button
                      onClick={() => setExportFormat('pdf')}
                      className={`w-full px-4 py-2 text-left rounded-lg border transition-colors flex items-center ${
                        exportFormat === 'pdf'
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-gray-300 hover:border-gray-400'
                      }`}
                    >
                      <FileText className="h-4 w-4 mr-2" />
                      PDF
                    </button>
                    <button
                      onClick={() => setExportFormat('json')}
                      className={`w-full px-4 py-2 text-left rounded-lg border transition-colors flex items-center ${
                        exportFormat === 'json'
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-gray-300 hover:border-gray-400'
                      }`}
                    >
                      <FileJson className="h-4 w-4 mr-2" />
                      JSON
                    </button>
                  </div>
                </div>

                <Button
                  onClick={handleGenerateReport}
                  disabled={isGenerating}
                  leftIcon={<Download className="h-4 w-4" />}
                  className="w-full"
                >
                  {isGenerating ? 'Génération...' : 'Générer le rapport'}
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Aperçu des statistiques */}
          <div className="lg:col-span-2 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Objectifs</p>
                      <p className="text-2xl font-bold text-gray-900">{stats.totalObjectives}</p>
                    </div>
                    <Target className="h-8 w-8 text-blue-600" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Key Results</p>
                      <p className="text-2xl font-bold text-gray-900">{stats.completedKRs}/{stats.totalKeyResults}</p>
                      <p className="text-xs text-gray-500">{stats.krCompletionRate.toFixed(0)}% complétés</p>
                    </div>
                    <CheckCircle className="h-8 w-8 text-green-600" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Progression Moyenne</p>
                      <p className="text-2xl font-bold text-gray-900">{stats.avgProgress.toFixed(1)}%</p>
                    </div>
                    <TrendingUp className="h-8 w-8 text-purple-600" />
                  </div>
                  <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="h-2 rounded-full bg-purple-600"
                      style={{ width: `${Math.min(stats.avgProgress, 100)}%` }}
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Actions</p>
                      <p className="text-2xl font-bold text-gray-900">{stats.completedActions}/{stats.totalActions}</p>
                      <p className="text-xs text-gray-500">{stats.actionCompletionRate.toFixed(0)}% complétées</p>
                    </div>
                    <BarChart3 className="h-8 w-8 text-orange-600" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Aperçu des données */}
            <Card>
              <CardHeader>
                <CardTitle>Aperçu des données</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Objectifs ({filteredData.objectives.length})</h4>
                    {filteredData.objectives.length > 0 ? (
                      <ul className="space-y-1">
                        {filteredData.objectives.slice(0, 3).map(obj => (
                          <li key={obj.id} className="text-sm text-gray-600">• {obj.title}</li>
                        ))}
                        {filteredData.objectives.length > 3 && (
                          <li className="text-sm text-gray-400">... et {filteredData.objectives.length - 3} de plus</li>
                        )}
                      </ul>
                    ) : (
                      <p className="text-sm text-gray-400">Aucun objectif pour cette période</p>
                    )}
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Key Results ({filteredData.keyResults.length})</h4>
                    {filteredData.keyResults.length > 0 ? (
                      <ul className="space-y-1">
                        {filteredData.keyResults.slice(0, 3).map(kr => {
                          const progress = kr.target > 0 ? (kr.current / kr.target) * 100 : 0;
                          return (
                            <li key={kr.id} className="text-sm text-gray-600">
                              • {kr.title} ({progress.toFixed(0)}%)
                            </li>
                          );
                        })}
                        {filteredData.keyResults.length > 3 && (
                          <li className="text-sm text-gray-400">... et {filteredData.keyResults.length - 3} de plus</li>
                        )}
                      </ul>
                    ) : (
                      <p className="text-sm text-gray-400">Aucun Key Result pour cette période</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </OkrShell>
  );
};

export default ReportsPage;

