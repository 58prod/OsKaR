import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { AlarmClock, Target, Sparkles, RefreshCw, History } from 'lucide-react';
import { OkrShell } from '@/components/layout/OkrShell';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { ProgressUpdateModal } from '@/components/ui/ProgressUpdateModal';
import { ProgressHistoryPanel } from '@/components/ui/ProgressHistoryPanel';
import { useAppStore } from '@/store/useAppStore';
import { geminiService } from '@/services/gemini';
import { AISuggestionsPanel } from '@/components/canvas/AISuggestionsPanel';
import { getDaysUntilDeadline, formatDate } from '@/utils';
import type { QuarterlyKeyResult } from '@/types';
import { Priority } from '@/types';
import { useQuarterlyKeyResultsByUser } from '@/hooks/useQuarterlyKeyResults';
import { useCreateAction } from '@/hooks/useActions';

const MAX_SUGGESTIONS = 3;

const computeKRScore = (kr: QuarterlyKeyResult) => {
  const progress = kr.target > 0 ? (kr.current / kr.target) : 0;
  const progressPenalty = 1 - Math.min(progress, 1);
  const days = kr.deadline ? getDaysUntilDeadline(kr.deadline) : 30;
  const urgency = days <= 0 ? 1.2 : days <= 3 ? 1.0 : days <= 7 ? 0.8 : days <= 14 ? 0.5 : 0.2;
  return progressPenalty * 0.7 + urgency * 0.3;
};

const fallbackActionIdeas = (kr: QuarterlyKeyResult): string[] => {
  const base = kr.title.split(' ').slice(0, 4).join(' ');
  return [
    `Décomposer ${base} en 3 sous-étapes et fixer des mini-deadlines`,
    `Bloquer 60 minutes focus pour avancer sur ${base}`,
    `Identifier 1 blocage clé et demander un support rapide`,
  ];
};

export default function CheckInPage() {
  const { user } = useAppStore();
  const { data: quarterlyKeyResults = [], isLoading, error } = useQuarterlyKeyResultsByUser(user?.id);
  const createAction = useCreateAction();

  const [loadingKrId, setLoadingKrId] = useState<string | null>(null);
  const [suggestionsByKr, setSuggestionsByKr] = useState<Record<string, string[]>>({});
  const [selectedKR, setSelectedKR] = useState<QuarterlyKeyResult | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isHistoryPanelOpen, setIsHistoryPanelOpen] = useState(false);
  const [historyKR, setHistoryKR] = useState<QuarterlyKeyResult | null>(null);

  const rankedKRs = useMemo(
    () => [...(quarterlyKeyResults || [])]
      .sort((a, b) => computeKRScore(b) - computeKRScore(a))
      .slice(0, 5),
    [quarterlyKeyResults]
  );

  const proposeNextActions = async (kr: QuarterlyKeyResult) => {
    setLoadingKrId(kr.id);
    try {
      const advices = await geminiService.generateKeyResultAdvice(kr);
      const cleaned = advices
        .map((s) => s.replace(/^\d+\.|\*\*|\*|:/g, '').trim())
        .filter(Boolean)
        .slice(0, MAX_SUGGESTIONS);
      setSuggestionsByKr((prev) => ({ ...prev, [kr.id]: cleaned.length ? cleaned : fallbackActionIdeas(kr) }));
    } catch {
      setSuggestionsByKr((prev) => ({ ...prev, [kr.id]: fallbackActionIdeas(kr) }));
    } finally {
      setLoadingKrId(null);
    }
  };

  const createActionFromSuggestion = async (kr: QuarterlyKeyResult, text: string) => {
    if (!user) return;

    const title = text.substring(0, 120);
    await createAction.mutateAsync({
      action: {
        title,
        description: `Issue du check-in hebdo du ${formatDate(new Date())}`,
        quarterlyKeyResultId: kr.id,
        priority: Priority.MEDIUM,
        labels: ['check-in'],
      },
      userId: user.id
    });
  };

  const handleOpenProgressModal = (kr: QuarterlyKeyResult) => {
    setSelectedKR(kr);
    setIsModalOpen(true);
  };

  const handleUpdateProgress = (newCurrent: number, note?: string) => {
    if (selectedKR) {
      // TODO: Implémenter updateQuarterlyKeyResultProgress avec React Query
      // updateQuarterlyKeyResultProgress(selectedKR.id, newCurrent, note);
      setIsModalOpen(false);
      setSelectedKR(null);
    }
  };

  const handleOpenHistoryPanel = (kr: QuarterlyKeyResult) => {
    setHistoryKR(kr);
    setIsHistoryPanelOpen(true);
  };

  return (
    <OkrShell title="Check-in hebdomadaire" topbarTitle="Check-in" topbarSubtitle="Faites le point sur vos Key Results">
      <div>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* En-tête */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-8"
          >
            <div className="flex items-center space-x-4">
              <div className="bg-navy rounded-lg p-3">
                <AlarmClock className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Check-in hebdomadaire</h1>
                <p className="text-gray-600 mt-1">En 5 minutes, alignez vos priorités et créez les prochaines actions.</p>
              </div>
            </div>
          </motion.div>

          {/* KR prioritaires */}
          {isLoading ? (
            <Card>
              <CardContent className="py-12">
                <div className="text-center text-gray-500">
                  <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-teal mx-auto mb-4"></div>
                  <p>Chargement des Key Results...</p>
                </div>
              </CardContent>
            </Card>
          ) : error ? (
            <Card>
              <CardContent className="py-12">
                <div className="text-center text-red-500">
                  <p>Erreur lors du chargement des Key Results</p>
                  <p className="text-sm mt-2">{error.message}</p>
                </div>
              </CardContent>
            </Card>
          ) : rankedKRs.length === 0 ? (
            <Card>
              <CardContent className="py-12">
                <div className="text-center text-gray-500">
                  <Target className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun Key Result trouvé</h3>
                  <p className="mb-2">Créez des objectifs trimestriels et des Key Results dans la page Gestion</p>
                  <Button onClick={() => window.location.href = '/management'}>
                    Aller à la Gestion
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {rankedKRs.map((kr) => {
                const progress = kr.target > 0 ? Math.min(100, Math.round((kr.current / kr.target) * 100)) : 0;
                const days = kr.deadline ? getDaysUntilDeadline(kr.deadline) : undefined;
                const ideas = suggestionsByKr[kr.id];

                return (
                  <Card key={kr.id}>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center">
                      <Target className="h-5 w-5 text-teal-dark mr-2" aria-hidden />
                      {kr.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-2">
                        <Badge variant="secondary" size="sm">{progress}%</Badge>
                        {typeof days === 'number' && (
                          <span className={`text-sm ${days < 0 ? 'text-red-600' : days <= 7 ? 'text-orange-600' : 'text-gray-500'}`}>
                            {days < 0 ? `En retard de ${Math.abs(days)} j` : days === 0 ? 'Aujourd\'hui' : `Échéance dans ${days} j`}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          leftIcon={<RefreshCw className="h-3 w-3" />}
                          onClick={() => handleOpenProgressModal(kr)}
                        >
                          Mettre à jour
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          leftIcon={<History className="h-3 w-3" />}
                          onClick={() => handleOpenHistoryPanel(kr)}
                        >
                          Historique
                        </Button>
                      </div>
                    </div>

                    {!ideas ? (
                      <Button
                        onClick={() => proposeNextActions(kr)}
                        disabled={loadingKrId === kr.id}
                        leftIcon={<Sparkles className="h-4 w-4" />}
                      >
                        {loadingKrId === kr.id ? 'Proposition en cours…' : 'Proposer 3 actions'}
                      </Button>
                    ) : (
                      <div className="space-y-3">
                        <AISuggestionsPanel
                          suggestions={ideas}
                          onAdd={(text) => createActionFromSuggestion(kr, text)}
                          enableCopy
                          showToggleAll
                        />
                        <div className="flex items-center space-x-2">
                          <Button variant="ghost" onClick={() => proposeNextActions(kr)}>
                            Re-générer
                          </Button>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
            </div>
          )}
        </div>
      </div>

      {/* Modal de mise à jour de progression */}
      {selectedKR && (
        <ProgressUpdateModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedKR(null);
          }}
          keyResult={selectedKR}
          onUpdate={handleUpdateProgress}
        />
      )}

      {/* Panneau d'historique */}
      {historyKR && (
        <ProgressHistoryPanel
          isOpen={isHistoryPanelOpen}
          onClose={() => {
            setIsHistoryPanelOpen(false);
            setHistoryKR(null);
          }}
          keyResult={historyKR}
        />
      )}
    </OkrShell>
  );
}

