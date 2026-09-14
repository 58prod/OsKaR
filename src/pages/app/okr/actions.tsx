import React, { useState } from 'react';
import { OkrShell } from '@/components/layout/OkrShell';
import { KanbanBoard } from '@/components/ui/KanbanBoard';
import { ActionsTableView } from '@/components/ui/ActionsTableView';
import { ActionsChecklistView } from '@/components/ui/ActionsChecklistView';
import { ActionForm } from '@/components/forms/ActionForm';
import { FilterPanel, FilterState } from '@/components/ui/FilterPanel';
import { Button } from '@/components/ui/Button';
import { Plus, Filter, LayoutGrid, Table, ListChecks } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { useFilters } from '@/hooks/useFilters';
import type { Action, ActionFormData, ActionStatus } from '@/types';
import { useAmbitions } from '@/hooks/useAmbitions';
import { useQuarterlyObjectives } from '@/hooks/useQuarterlyObjectives';
import { useQuarterlyKeyResultsByUser } from '@/hooks/useQuarterlyKeyResults';
import { useActions, useCreateAction, useUpdateAction, useDeleteAction, useUpdateActionsOrder, useMoveAction } from '@/hooks/useActions';
import { useAssignMultiple, useReplaceAllAssignees } from '@/hooks/useActionAssignees';

type ViewMode = 'kanban' | 'table' | 'checklist';

const ActionsPage: React.FC = () => {
  const { user } = useAppStore();

  // React Query - Données
  const { data: ambitions = [] } = useAmbitions(user?.id);
  const { data: quarterlyObjectives = [] } = useQuarterlyObjectives(user?.id);
  const { data: quarterlyKeyResults = [] } = useQuarterlyKeyResultsByUser(user?.id);
  const { data: actions = [] } = useActions(user?.id);

  // React Query - Mutations
  const createAction = useCreateAction();
  const updateActionMutation = useUpdateAction(user?.id);
  const updateActionsOrder = useUpdateActionsOrder(user?.id);
  const moveAction = useMoveAction(user?.id);
  const deleteActionMutation = useDeleteAction(user?.id);

  const [formMode, setFormMode] = useState<'action' | null>(null);
  const [editingAction, setEditingAction] = useState<Action | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('kanban');

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
    availableLabels,
    availableYears,
  } = useFilters({
    actions,
    ambitions,
    quarterlyObjectives,
    quarterlyKeyResults,
    filters,
  });

  const handleAddAction = () => {
    setEditingAction(null);
    setFormMode('action');
  };

  const handleEditAction = (action: Action) => {
    setEditingAction(action);
    setFormMode('action');
  };

  // Hooks pour assignation
  const assignMultiple = useAssignMultiple();
  const replaceAssignees = useReplaceAllAssignees();

  const handleActionSubmit = async (data: ActionFormData) => {
    if (!user) return;

    try {
      let actionId: string;

      // Séparer assignees du rest
      const { assignees, ...actionData } = data;

      if (editingAction) {
        // Mise à jour de l'action existante
        await updateActionMutation.mutateAsync({
          id: editingAction.id,
          updates: {
            ...actionData,
            deadline: actionData.deadline ? new Date(actionData.deadline) : undefined,
            labels: actionData.labels ? actionData.labels.split(',').map(l => l.trim()).filter(l => l) : [],
          },
        });
        actionId = editingAction.id;

        // Remplacer les assignés
        if (assignees && assignees.length > 0) {
          await replaceAssignees.mutateAsync({
            actionId,
            newAssignees: assignees,
            assignedBy: user.id,
          });
        }
      } else {
        // Création d'une nouvelle action
        const newAction = await createAction.mutateAsync({
          action: {
            ...actionData,
            quarterlyKeyResultId: actionData.quarterlyKeyResultId || quarterlyKeyResults[0]?.id || '',
            deadline: actionData.deadline ? new Date(actionData.deadline) : undefined,
            labels: actionData.labels ? actionData.labels.split(',').map(l => l.trim()).filter(l => l) : [],
          },
          userId: user.id
        });
        actionId = newAction.id;

        // Affecter les personnes sélectionnées
        if (assignees && assignees.length > 0) {
          await assignMultiple.mutateAsync({
            actionId,
            assignees: assignees,
            assignedBy: user.id,
          });
        }
      }

      setFormMode(null);
      setEditingAction(null);
    } catch (error) {
      console.error('❌ Erreur lors de la sauvegarde de l\'action:', error);
      alert('Erreur lors de la sauvegarde de l\'action');
    }
  };

  const handleCancelForm = () => {
    setFormMode(null);
    setEditingAction(null);
  };

  const handleActionMove = async (
    actionId: string,
    newStatus: ActionStatus,
    orderUpdates: { id: string; order_index: number }[]
  ) => {
    try {
      // Utiliser la mutation combinée pour éviter les conflits
      moveAction.mutate({ actionId, newStatus, orderUpdates });
    } catch (error) {
      console.error('❌ Erreur lors du déplacement de l\'action:', error);
      alert('Erreur lors du déplacement de l\'action');
    }
  };

  // Wrapper pour les vues Table et Checklist qui n'ont pas besoin des orderUpdates
  const handleActionStatusChange = async (actionId: string, newStatus: ActionStatus) => {
    try {
      moveAction.mutate({ actionId, newStatus, orderUpdates: [] });
    } catch (error) {
      console.error('❌ Erreur lors du changement de statut:', error);
      alert('Erreur lors du changement de statut');
    }
  };

  const handleActionReorder = async (updates: { id: string; order_index: number }[]) => {
    try {
      // Ne pas attendre la fin de la mutation pour que l'optimistic update fonctionne
      updateActionsOrder.mutate(updates);
    } catch (error) {
      console.error('❌ actions.tsx - Erreur lors de la réorganisation des actions:', error);
      alert('Erreur lors de la réorganisation des actions');
    }
  };

  // Compter les actions filtrées
  const activeFiltersCount =
    filters.ambitionIds.length +
    filters.quarters.length +
    filters.years.length +
    filters.objectiveIds.length +
    filters.priorities.length +
    filters.statuses.length +
    filters.labels.length;

  // Calculer les statistiques par statut
  const todoCount = filteredActions.filter(a => a.status === 'todo').length;
  const inProgressCount = filteredActions.filter(a => a.status === 'in_progress').length;
  const doneCount = filteredActions.filter(a => a.status === 'done').length;

  // Convertir Action en ActionFormData pour le formulaire
  const actionToFormData = (action: Action | null): Partial<ActionFormData> | undefined => {
    if (!action) return undefined;
    return {
      title: action.title,
      description: action.description,
      priority: action.priority,
      labels: action.labels.join(', '),
      deadline: action.deadline ? action.deadline.toISOString().split('T')[0] : undefined,
      quarterlyKeyResultId: action.quarterlyKeyResultId,
      assignees: action.assignees?.map(a => ({
        type: a.assigneeType,
        userId: a.userId,
        externalContactId: a.externalContactId,
      })) || [],
    };
  };

  return (
    <OkrShell title="Actions" topbarTitle="Actions" topbarSubtitle="Pilotez l'exécution de vos OKR" contentPadding="p-0">
      <div className="py-8">
        {formMode === 'action' && (
          <ActionForm
            initialData={actionToFormData(editingAction)}
            quarterlyKeyResults={quarterlyKeyResults}
            allowKeyResultSelection={true}
            onSubmit={handleActionSubmit}
            onCancel={handleCancelForm}
          />
        )}

        {/* En-tête */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Actions</h1>
              <p className="mt-2 text-gray-600">
                Organisez et suivez toutes vos actions
              </p>
            </div>

            <div className="flex items-center space-x-4">
              {/* Sélecteur de vue */}
              <div className="flex items-center bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('kanban')}
                  className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${viewMode === 'kanban'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                    }`}
                >
                  <LayoutGrid className="h-4 w-4 mr-2" />
                  Kanban
                </button>
                <button
                  onClick={() => setViewMode('table')}
                  className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${viewMode === 'table'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                    }`}
                >
                  <Table className="h-4 w-4 mr-2" />
                  Tableau
                </button>
                <button
                  onClick={() => setViewMode('checklist')}
                  className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${viewMode === 'checklist'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                    }`}
                >
                  <ListChecks className="h-4 w-4 mr-2" />
                  Checklist
                </button>
              </div>

              {/* Bouton Filtres */}
              <Button
                variant="outline"
                onClick={() => setShowFilters(true)}
              >
                <Filter className="h-4 w-4 mr-2" />
                Filtres
                {activeFiltersCount > 0 && (
                  <span className="ml-2 bg-navy/10 text-navy px-2 py-0.5 rounded-full text-xs font-medium">
                    {activeFiltersCount}
                  </span>
                )}
              </Button>

              {/* Bouton Nouvelle Action */}
              <Button onClick={handleAddAction}>
                <Plus className="h-4 w-4 mr-2" />
                Nouvelle Action
              </Button>
            </div>
          </div>

          {/* Statistiques */}
          {activeFiltersCount > 0 && (
            <div className="mt-4 flex items-center space-x-4 text-sm text-gray-600">
              <span>
                {filteredActions.length} action{filteredActions.length > 1 ? 's' : ''} affichée{filteredActions.length > 1 ? 's' : ''}
              </span>
              <>
                <span className="text-gray-300">•</span>
                <span>{todoCount} à faire</span>
                <span className="text-gray-300">•</span>
                <span>{inProgressCount} en cours</span>
                <span className="text-gray-300">•</span>
                <span>{doneCount} terminées</span>
              </>
            </div>
          )}
        </div>

        {/* Contenu principal */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-lg shadow-sm border p-6">
            {viewMode === 'kanban' && (
              <KanbanBoard
                actions={filteredActions}
                onActionMove={handleActionMove}
                onActionReorder={handleActionReorder}
                onActionEdit={handleEditAction}
                onActionDelete={async (id) => {
                  if (window.confirm('Êtes-vous sûr de vouloir supprimer cette action ?')) {
                    try {
                      await deleteActionMutation.mutateAsync(id);
                    } catch (error) {
                      console.error('❌ Erreur lors de la suppression:', error);
                      alert('Erreur lors de la suppression de l\'action');
                    }
                  }
                }}
                onAddAction={handleAddAction}
                quarterlyKeyResults={quarterlyKeyResults}
                quarterlyObjectives={quarterlyObjectives}
                selectedAmbition={filters.ambitionIds[0]}
                selectedQuarter={filters.quarters[0]}
                selectedYear={filters.years[0]}
              />
            )}

            {viewMode === 'table' && (
              <ActionsTableView
                actions={filteredActions}
                onActionEdit={handleEditAction}
                onActionDelete={async (id) => {
                  if (window.confirm('Êtes-vous sûr de vouloir supprimer cette action ?')) {
                    try {
                      await deleteActionMutation.mutateAsync(id);
                    } catch (error) {
                      console.error('❌ Erreur lors de la suppression:', error);
                      alert('Erreur lors de la suppression de l\'action');
                    }
                  }
                }}
                onActionStatusChange={handleActionStatusChange}
                quarterlyKeyResults={quarterlyKeyResults}
                quarterlyObjectives={quarterlyObjectives}
              />
            )}

            {viewMode === 'checklist' && (
              <ActionsChecklistView
                actions={filteredActions}
                onActionEdit={handleEditAction}
                onActionDelete={async (id) => {
                  if (window.confirm('Êtes-vous sûr de vouloir supprimer cette action ?')) {
                    try {
                      await deleteActionMutation.mutateAsync(id);
                    } catch (error) {
                      console.error('❌ Erreur lors de la suppression:', error);
                      alert('Erreur lors de la suppression de l\'action');
                    }
                  }
                }}
                onActionStatusChange={handleActionStatusChange}
                quarterlyKeyResults={quarterlyKeyResults}
                quarterlyObjectives={quarterlyObjectives}
              />
            )}
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
      </div>
    </OkrShell>
  );
};

export default ActionsPage;

