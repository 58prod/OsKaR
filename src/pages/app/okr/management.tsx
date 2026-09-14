import React, { useState } from 'react';
import {
  Filter,
  Plus,
  Target,
  Building2,
  Zap
} from 'lucide-react';
import { OkrShell } from '@/components/layout/OkrShell';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { HierarchicalTreeView } from '@/components/ui/HierarchicalTreeView';
import { FilterPanel, FilterState } from '@/components/ui/FilterPanel';
import { ProgressUpdateModal } from '@/components/ui/ProgressUpdateModal';
import { ProgressHistoryPanel } from '@/components/ui/ProgressHistoryPanel';
import { UpgradeModal } from '@/components/subscription/UpgradeModal';
import { AmbitionForm, AmbitionFormData } from '@/components/forms/AmbitionForm';
import { KeyResultForm } from '@/components/forms/KeyResultForm';
import { QuarterlyObjectiveForm } from '@/components/forms/QuarterlyObjectiveForm';
import { QuarterlyKeyResultForm } from '@/components/forms/QuarterlyKeyResultForm';
import { ActionForm } from '@/components/forms/ActionForm';
import { useAppStore } from '@/store/useAppStore';
import { useSubscription } from '@/hooks/useSubscription';
import { useAmbitions, useCreateAmbition, useUpdateAmbition, useDeleteAmbition } from '@/hooks/useAmbitions';
import { useKeyResultsByUser, useCreateKeyResult, useUpdateKeyResult, useDeleteKeyResult } from '@/hooks/useKeyResults';
import { useQuarterlyObjectives, useCreateQuarterlyObjective, useUpdateQuarterlyObjective, useDeleteQuarterlyObjective } from '@/hooks/useQuarterlyObjectives';
import { useQuarterlyKeyResultsByUser, useCreateQuarterlyKeyResult, useUpdateQuarterlyKeyResult, useUpdateQuarterlyKeyResultProgress, useDeleteQuarterlyKeyResult } from '@/hooks/useQuarterlyKeyResults';
import { useActions, useCreateAction, useUpdateAction, useDeleteAction } from '@/hooks/useActions';
import { useFilters, useHasActiveFilters, useActiveFiltersDescription } from '@/hooks/useFilters';
import { geminiService } from '@/services/gemini';
import { shareService } from '@/services/share';
import { SubscriptionsService } from '@/services/db/subscriptions';
import {
  Ambition,
  KeyResult,
  QuarterlyObjective,
  QuarterlyKeyResult,
  Action,
  ActionStatus,
  Status,
  Priority,
  QuarterlyObjectiveFormData,
  QuarterlyKeyResultFormData,
  ActionFormData
} from '@/types';
import { KeyResultFormData } from '@/components/forms/KeyResultForm';

type FormMode = 'ambition' | 'key-result' | 'quarterly-objective' | 'quarterly-key-result' | 'action' | null;

const ManagementPage: React.FC = () => {
  const [showFilters, setShowFilters] = useState(false);
  const [formMode, setFormMode] = useState<FormMode>(null);
  const [selectedObjectiveId, setSelectedObjectiveId] = useState<string | null>(null);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [selectedKR, setSelectedKR] = useState<QuarterlyKeyResult | null>(null);
  const [isProgressModalOpen, setIsProgressModalOpen] = useState(false);
  const [isHistoryPanelOpen, setIsHistoryPanelOpen] = useState(false);
  const [historyKR, setHistoryKR] = useState<QuarterlyKeyResult | null>(null);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  const { user } = useAppStore();
  const { data: subscription } = useSubscription(user?.id);

  // React Query - Données
  const { data: ambitions = [], isLoading: ambitionsLoading, isError: ambitionsError } = useAmbitions(user?.id);
  const { data: keyResults = [], isLoading: keyResultsLoading, isError: keyResultsError } = useKeyResultsByUser(user?.id);
  const { data: quarterlyObjectives = [], isLoading: objectivesLoading, isError: objectivesError } = useQuarterlyObjectives(user?.id);
  const { data: quarterlyKeyResults = [], isLoading: quarterlyKeyResultsLoading, isError: quarterlyKeyResultsError } = useQuarterlyKeyResultsByUser(user?.id);
  const { data: actions = [], isLoading: actionsLoading, isError: actionsError } = useActions(user?.id);

  // React Query - Mutations Ambitions
  const createAmbition = useCreateAmbition();
  const updateAmbitionMutation = useUpdateAmbition();
  const deleteAmbitionMutation = useDeleteAmbition();

  // React Query - Mutations Key Results (annuels)
  const createKeyResult = useCreateKeyResult();
  const updateKeyResultMutation = useUpdateKeyResult();
  const deleteKeyResultMutation = useDeleteKeyResult();

  // React Query - Mutations Objectifs
  const createObjective = useCreateQuarterlyObjective();
  const updateObjectiveMutation = useUpdateQuarterlyObjective();
  const deleteObjectiveMutation = useDeleteQuarterlyObjective();

  // React Query - Mutations Key Results (trimestriels)
  const createQuarterlyKeyResult = useCreateQuarterlyKeyResult();
  const updateQuarterlyKeyResultMutation = useUpdateQuarterlyKeyResult();
  const updateKeyResultProgressMutation = useUpdateQuarterlyKeyResultProgress();
  const deleteQuarterlyKeyResultMutation = useDeleteQuarterlyKeyResult();

  // React Query - Mutations Actions
  const createAction = useCreateAction();
  const updateActionMutation = useUpdateAction(user?.id);
  const deleteActionMutation = useDeleteAction(user?.id);

  const [filters, setFilters] = useState<FilterState>({
    ambitionIds: [],
    quarters: [],
    years: [],
    objectiveIds: [],
    priorities: [],
    statuses: [],
    labels: [],
  });

  const {
    filteredActions,
    filteredAmbitions,
    filteredQuarterlyObjectives,
    availableLabels,
    availableYears,
  } = useFilters({
    actions,
    ambitions,
    quarterlyObjectives,
    quarterlyKeyResults,
    filters,
  });

  const hasActiveFilters = useHasActiveFilters(filters);
  const filtersDescription = useActiveFiltersDescription(filters, ambitions, quarterlyObjectives);

  // État de chargement — on ne bloque pas la page si une query est en erreur
  const isLoading = (ambitionsLoading && !ambitionsError) ||
    (keyResultsLoading && !keyResultsError) ||
    (objectivesLoading && !objectivesError) ||
    (quarterlyKeyResultsLoading && !quarterlyKeyResultsError) ||
    (actionsLoading && !actionsError);



  // Handlers pour les formulaires
  const handleAddAmbition = async () => {
    if (!user) return;

    // Vérifier les limites avant d'ouvrir le formulaire
    const canCreate = await SubscriptionsService.canCreateAmbition(user.id);
    if (!canCreate) {
      setShowUpgradeModal(true);
      return;
    }

    setEditingItem(null);
    setFormMode('ambition');
  };

  const handleEditAmbition = (ambition: Ambition) => {
    setEditingItem(ambition);
    setFormMode('ambition');
  };

  const handleAddKeyResult = (ambitionId: string) => {
    setSelectedObjectiveId(ambitionId); // Réutilise la variable pour stocker l'ambition ID
    setEditingItem(null);
    setFormMode('key-result');
  };

  const handleEditKeyResult = (keyResult: KeyResult) => {
    setEditingItem(keyResult);
    setFormMode('key-result');
  };

  const handleAddQuarterlyObjective = (ambitionId?: string) => {
    setSelectedObjectiveId(ambitionId || null);
    setEditingItem(null);
    setFormMode('quarterly-objective');
  };

  const handleEditQuarterlyObjective = (objective: QuarterlyObjective) => {
    setEditingItem(objective);
    setFormMode('quarterly-objective');
  };

  const handleAddQuarterlyKeyResult = (objectiveId: string) => {
    setSelectedObjectiveId(objectiveId);
    setEditingItem(null);
    setFormMode('quarterly-key-result');
  };

  const handleEditQuarterlyKeyResult = (keyResult: QuarterlyKeyResult) => {
    setEditingItem(keyResult);
    setFormMode('quarterly-key-result');
  };

  const handleAddAction = (keyResultId?: string) => {
    setSelectedObjectiveId(keyResultId || null); // Réutilise la variable pour stocker le KR ID
    setEditingItem(null);
    setFormMode('action');
  };

  const handleEditAction = (action: Action) => {
    setEditingItem(action);
    setFormMode('action');
  };

  // Handlers pour les soumissions de formulaires
  const handleAmbitionSubmit = async (data: AmbitionFormData) => {
    if (!user) return;

    try {
      if (editingItem) {
        await updateAmbitionMutation.mutateAsync({
          id: editingItem.id,
          updates: data,
          userId: user.id
        });
      } else {
        await createAmbition.mutateAsync({
          ambition: {
            ...data,
            status: Status.ACTIVE,
          },
          userId: user.id
        });
      }
      setFormMode(null);
      setEditingItem(null);
    } catch (error) {
      console.error('❌ Erreur lors de la sauvegarde de l\'objectif annuel:', error);
      alert('Erreur lors de la sauvegarde de l\'objectif annuel');
    }
  };

  const handleKeyResultSubmit = async (data: KeyResultFormData) => {
    if (!user) return;

    try {
      if (editingItem) {
        await updateKeyResultMutation.mutateAsync({
          id: editingItem.id,
          updates: data,
        });
      } else {
        await createKeyResult.mutateAsync({
          keyResult: {
            ...data,
            status: Status.ACTIVE,
          },
          userId: user.id
        });
      }
      setFormMode(null);
      setEditingItem(null);
      setSelectedObjectiveId(null);
    } catch (error) {
      console.error('❌ Erreur lors de la sauvegarde du résultat clé:', error);
      alert('Erreur lors de la sauvegarde du résultat clé');
    }
  };

  const handleQuarterlyObjectiveSubmit = async (data: QuarterlyObjectiveFormData) => {
    if (!user) return;

    try {
      if (editingItem) {
        await updateObjectiveMutation.mutateAsync({
          id: editingItem.id,
          updates: data,
          userId: user.id
        });
      } else {
        await createObjective.mutateAsync({
          objective: {
            ...data,
            status: Status.DRAFT,
          },
          userId: user.id
        });
      }
      setFormMode(null);
      setEditingItem(null);
      setSelectedObjectiveId(null);
    } catch (error) {
      console.error('❌ Erreur lors de la sauvegarde de l\'objectif:', error);
      alert('Erreur lors de la sauvegarde de l\'objectif');
    }
  };

  const handleQuarterlyKeyResultSubmit = async (data: QuarterlyKeyResultFormData) => {
    if (!user) return;

    try {
      // Convertir la deadline de string à Date
      const updates: Partial<QuarterlyKeyResult> = {
        ...data,
        deadline: data.deadline ? new Date(data.deadline) : undefined,
      };

      if (editingItem) {
        await updateQuarterlyKeyResultMutation.mutateAsync({
          id: editingItem.id,
          updates,
        });
      } else if (selectedObjectiveId) {
        await createQuarterlyKeyResult.mutateAsync({
          keyResult: {
            ...updates,
            quarterlyObjectiveId: selectedObjectiveId,
          } as Omit<QuarterlyKeyResult, 'id' | 'createdAt' | 'updatedAt'>,
          userId: user.id
        });
      }
      setFormMode(null);
      setEditingItem(null);
      setSelectedObjectiveId(null);
    } catch (error) {
      console.error('❌ Erreur lors de la sauvegarde du Key Result:', error);
      alert('Erreur lors de la sauvegarde du Key Result');
    }
  };

  const handleActionSubmit = async (data: ActionFormData) => {
    if (!user) return;

    try {
      // Extraire assignees des données pour les gérer séparément
      const { assignees: _assignees, ...actionData } = data;

      if (editingItem) {
        await updateActionMutation.mutateAsync({
          id: editingItem.id,
          updates: {
            ...actionData,
            deadline: actionData.deadline ? new Date(actionData.deadline) : undefined,
            labels: actionData.labels ? actionData.labels.split(',').map(l => l.trim()).filter(l => l) : [],
          }
        });
      } else {
        // Utiliser le KR du formulaire, ou celui présélectionné
        const keyResultId = actionData.quarterlyKeyResultId || selectedObjectiveId;

        if (!keyResultId) {
          alert('Veuillez sélectionner un Key Result');
          return;
        }

        await createAction.mutateAsync({
          action: {
            ...actionData,
            quarterlyKeyResultId: keyResultId,
            status: ActionStatus.TODO,
            deadline: actionData.deadline ? new Date(actionData.deadline) : undefined,
            labels: actionData.labels ? actionData.labels.split(',').map(l => l.trim()).filter(l => l) : [],
          },
          userId: user.id
        });
      }
      setFormMode(null);
      setEditingItem(null);
      setSelectedObjectiveId(null);
    } catch (error) {
      console.error('❌ Erreur lors de la sauvegarde de l\'action:', error);
      alert('Erreur lors de la sauvegarde de l\'action');
    }
  };

  const handleCancelForm = () => {
    setFormMode(null);
    setEditingItem(null);
    setSelectedObjectiveId(null);
  };

  // G e9n e9ration d'un plan d'actions  e0 partir d'un KR
  const handleGenerateActionPlan = async (kr: QuarterlyKeyResult) => {
    if (!user) return;

    try {
      const advices = await geminiService.generateKeyResultAdvice(kr);
      const ideas = advices.map(s => s.replace(/^\d+\.|\*\*|:/g, '').trim()).filter(Boolean).slice(0, 5);
      if (ideas.length === 0) {
        const fallback = [
          `D e9composer ${kr.title} en sous- e9tapes`,
          `Bloquer 60 min focus sur ${kr.title}`,
          `Identifier et lever 1 blocage`
        ];
        ideas.push(...fallback);
      }
      ideas.forEach(async (title) => {
        await createAction.mutateAsync({
          action: {
            title: title.substring(0, 120),
            quarterlyKeyResultId: kr.id,
            priority: Priority.MEDIUM,
            labels: ['plan'],
          },
          userId: user.id
        });
      });
    } catch {
      const fallback = [
        `D e9composer ${kr.title} en sous- e9tapes`,
        `Bloquer 60 min focus sur ${kr.title}`,
        `Identifier et lever 1 blocage`
      ];
      fallback.forEach(async (title) => {
        await createAction.mutateAsync({
          action: {
            title,
            quarterlyKeyResultId: kr.id,
            priority: Priority.MEDIUM,
            labels: ['plan'],
          },
          userId: user.id
        });
      });
    }
  };

  // Partage public (RO)
  const handleShareObjective = (objectiveId: string) => {
    const objective = quarterlyObjectives?.find(o => o.id === objectiveId);
    if (!objective) {
      alert('Objectif introuvable.');
      return;
    }

    const keyResults = quarterlyKeyResults?.filter(kr => kr.quarterlyObjectiveId === objectiveId) || [];
    const krIds = keyResults.map(kr => kr.id);
    const objectiveActions = actions?.filter(a => krIds.includes(a.quarterlyKeyResultId || '')) || [];

    const link = shareService.buildShareLinkForObjective(objective, keyResults, objectiveActions);
    if (link) {
      navigator.clipboard.writeText(link).then(() => {
        alert('Lien de partage (objectif) copié !');
      });
    } else {
      alert('Impossible de générer le lien de partage.');
    }
  };

  const handleShareKR = (krId: string) => {
    const kr = quarterlyKeyResults?.find(k => k.id === krId);
    if (!kr) {
      alert('KR introuvable.');
      return;
    }

    const krActions = actions?.filter(a => a.quarterlyKeyResultId === krId) || [];

    const link = shareService.buildShareLinkForKR(kr, krActions);
    if (link) {
      navigator.clipboard.writeText(link).then(() => {
        alert('Lien de partage (KR) copié !');
      });
    } else {
      alert('Impossible de générer le lien de partage.');
    }
  };


  // Handler pour mettre à jour la progression d'un KR
  const handleOpenProgressModal = (kr: QuarterlyKeyResult) => {
    setSelectedKR(kr);
    setIsProgressModalOpen(true);
  };

  const handleUpdateProgress = async (newCurrent: number, note?: string) => {
    if (!selectedKR) return;

    try {
      await updateKeyResultProgressMutation.mutateAsync({
        id: selectedKR.id,
        current: newCurrent,
        note,
      });
      setIsProgressModalOpen(false);
      setSelectedKR(null);
    } catch (error) {
      console.error('❌ Erreur lors de la mise à jour de la progression:', error);
      alert('Erreur lors de la mise à jour de la progression');
    }
  };

  const handleOpenHistoryPanel = (kr: QuarterlyKeyResult) => {
    setHistoryKR(kr);
    setIsHistoryPanelOpen(true);
  };

  // Affichage des formulaires
  if (formMode) {
    const selectedObjective = selectedObjectiveId
      ? quarterlyObjectives.find(obj => obj.id === selectedObjectiveId)
      : null;

    return (
      <OkrShell title="Gestion des Objectifs" topbarTitle="Gestion" topbarSubtitle="Structurez vos objectifs et actions">
        <div className="py-2">
          {formMode === 'ambition' && (
            <AmbitionForm
              initialData={editingItem}
              onSubmit={handleAmbitionSubmit}
              onCancel={handleCancelForm}
            />
          )}
          {formMode === 'key-result' && (
            <KeyResultForm
              initialData={editingItem}
              ambitionId={selectedObjectiveId}
              onSubmit={handleKeyResultSubmit}
              onCancel={handleCancelForm}
            />
          )}
          {formMode === 'quarterly-objective' && (
            <QuarterlyObjectiveForm
              initialData={editingItem || (selectedObjectiveId ? { ambitionId: selectedObjectiveId } : undefined)}
              onSubmit={handleQuarterlyObjectiveSubmit}
              onCancel={handleCancelForm}
              ambitions={ambitions}
            />
          )}
          {formMode === 'quarterly-key-result' && (
            <QuarterlyKeyResultForm
              initialData={editingItem}
              quarterlyObjectiveTitle={selectedObjective?.title}
              onSubmit={handleQuarterlyKeyResultSubmit}
              onCancel={handleCancelForm}
            />
          )}
          {formMode === 'action' && (
            <ActionForm
              initialData={editingItem || (selectedObjectiveId ? { quarterlyKeyResultId: selectedObjectiveId } : undefined)}
              quarterlyKeyResultTitle={quarterlyKeyResults.find(kr => kr.id === selectedObjectiveId)?.title}
              quarterlyKeyResults={quarterlyKeyResults}
              allowKeyResultSelection={!selectedObjectiveId}
              onSubmit={handleActionSubmit}
              onCancel={handleCancelForm}
            />
          )}
        </div>
      </OkrShell>
    );
  }

  if (isLoading) {
    return (
      <OkrShell title="Gestion des Objectifs" topbarTitle="Gestion" topbarSubtitle="Structurez vos objectifs et actions">
        <div className="flex items-center justify-center py-40">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-teal"></div>
        </div>
      </OkrShell>
    );
  }

  return (
    <OkrShell title="Gestion des Objectifs" topbarTitle="Gestion" topbarSubtitle="Structurez vos objectifs et actions" contentPadding="p-0">
      <div>
        {/* En-tête */}
        <div className="bg-white shadow-sm border-b border-line">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-navy">
                  Gestion des Objectifs
                </h1>
                {/* Statistiques */}
                <div className="flex items-center space-x-4 text-sm text-muted mt-2">
                  <div className="flex items-center space-x-1">
                    <Building2 className="h-4 w-4" />
                    <span>{filteredAmbitions.length} objectifs annuels</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Target className="h-4 w-4" />
                    <span>{filteredQuarterlyObjectives.length} objectifs</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Zap className="h-4 w-4" />
                    <span>{filteredActions.length} actions</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <Button onClick={() => handleAddAmbition()}>
                  <Plus className="h-4 w-4 mr-2" />
                  Nouvel Objectif Annuel
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowFilters(true)}
                  className={hasActiveFilters ? 'ring-2 ring-blue-500' : ''}
                >
                  <Filter className="h-4 w-4 mr-2" />
                  Filtres
                  {hasActiveFilters && (
                    <Badge variant="info" size="sm" className="ml-2">
                      {Object.values(filters).reduce((count, arr) => count + arr.length, 0)}
                    </Badge>
                  )}
                </Button>
              </div>
            </div>

            {/* Description des filtres actifs */}
            {hasActiveFilters && (
              <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>Filtres actifs:</strong> {filtersDescription}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Contenu principal */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="space-y-6">
            <HierarchicalTreeView
              ambitions={filteredAmbitions}
              keyResults={keyResults}
              quarterlyObjectives={filteredQuarterlyObjectives}
              quarterlyKeyResults={quarterlyKeyResults}
              actions={filteredActions}
              onAddAmbition={handleAddAmbition}
              onEditAmbition={handleEditAmbition}
              onDeleteAmbition={async (id) => {
                if (!user) return;
                if (window.confirm('Êtes-vous sûr de vouloir supprimer cet objectif annuel ? Tous les objectifs trimestriels associés seront également supprimés.')) {
                  try {
                    await deleteAmbitionMutation.mutateAsync({ id, userId: user.id });
                  } catch (error) {
                    console.error('❌ Erreur lors de la suppression:', error);
                    alert('Erreur lors de la suppression de l\'objectif annuel');
                  }
                }
              }}
              onAddKeyResult={handleAddKeyResult}
              onEditKeyResult={handleEditKeyResult}
              onDeleteKeyResult={async (id) => {
                try {
                  await deleteKeyResultMutation.mutateAsync(id);
                } catch (error) {
                  console.error('❌ Erreur lors de la suppression:', error);
                  alert('Erreur lors de la suppression du résultat clé');
                }
              }}
              onAddQuarterlyObjective={handleAddQuarterlyObjective}
              onEditQuarterlyObjective={handleEditQuarterlyObjective}
              onDeleteQuarterlyObjective={async (id) => {
                if (!user) return;
                try {
                  await deleteObjectiveMutation.mutateAsync({ id, userId: user.id });
                } catch (error) {
                  console.error('❌ Erreur lors de la suppression:', error);
                  alert('Erreur lors de la suppression de l\'objectif');
                }
              }}
              onAddQuarterlyKeyResult={handleAddQuarterlyKeyResult}
              onEditQuarterlyKeyResult={handleEditQuarterlyKeyResult}
              onDeleteQuarterlyKeyResult={async (id) => {
                try {
                  await deleteQuarterlyKeyResultMutation.mutateAsync(id);
                } catch (error) {
                  console.error('❌ Erreur lors de la suppression:', error);
                  alert('Erreur lors de la suppression du Key Result');
                }
              }}
              onAddAction={handleAddAction}
              onEditAction={handleEditAction}
              onDeleteAction={async (id) => {
                if (!user) return;
                try {
                  await deleteActionMutation.mutateAsync(id);
                } catch (error) {
                  console.error('❌ Erreur lors de la suppression:', error);
                  alert('Erreur lors de la suppression de l\'action');
                }
              }}
              onGenerateActionPlan={handleGenerateActionPlan}
              onShareQuarterlyObjective={handleShareObjective}
              onShareQuarterlyKeyResult={handleShareKR}
              onUpdateQuarterlyKeyResultProgress={handleOpenProgressModal}
              onViewQuarterlyKeyResultHistory={handleOpenHistoryPanel}
            />
          </div>
        </div>

        {/* Panel de filtres */}
        <FilterPanel
          isOpen={showFilters}
          onClose={() => setShowFilters(false)}
          filters={filters}
          onFiltersChange={setFilters}
          ambitions={ambitions}
          quarterlyObjectives={quarterlyObjectives}
          availableLabels={availableLabels}
          availableYears={availableYears}
        />

        {/* Modal de mise à jour de progression */}
        {selectedKR && (
          <ProgressUpdateModal
            isOpen={isProgressModalOpen}
            onClose={() => {
              setIsProgressModalOpen(false);
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

        {/* Upgrade Modal */}
        <UpgradeModal
          isOpen={showUpgradeModal}
          onClose={() => setShowUpgradeModal(false)}
          reason="ambitions"
          currentPlan={subscription?.planType}
        />
      </div>
    </OkrShell>
  );
};

export default ManagementPage;
