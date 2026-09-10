import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronDown,
  ChevronRight,
  Plus,
  Target,
  TrendingUp,
  Calendar,
  Building2,
  Edit2,
  Trash2,
  MoreHorizontal,
  Sparkles,
  Share2,
  RefreshCw,
  History,
} from 'lucide-react';
import { CommentList } from '@/components/ui/CommentList';
import { MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Card, CardContent } from '@/components/ui/Card';
import {
  Ambition,
  KeyResult,
  QuarterlyObjective,
  QuarterlyKeyResult,
  Action,
  Quarter,
  Priority,
  ActionStatus
} from '@/types';

interface HierarchicalTreeViewProps {
  ambitions: Ambition[];
  keyResults: KeyResult[];
  quarterlyObjectives: QuarterlyObjective[];
  quarterlyKeyResults: QuarterlyKeyResult[];
  actions: Action[];
  onAddAmbition: () => void;
  onEditAmbition: (ambition: Ambition) => void;
  onDeleteAmbition: (ambitionId: string) => void;
  onAddKeyResult: (ambitionId: string) => void;
  onEditKeyResult: (keyResult: KeyResult) => void;
  onDeleteKeyResult: (keyResultId: string) => void;
  onAddQuarterlyObjective: (ambitionId: string) => void;
  onEditQuarterlyObjective: (objective: QuarterlyObjective) => void;
  onDeleteQuarterlyObjective: (objectiveId: string) => void;
  onAddQuarterlyKeyResult: (objectiveId: string) => void;
  onEditQuarterlyKeyResult: (keyResult: QuarterlyKeyResult) => void;
  onDeleteQuarterlyKeyResult: (keyResultId: string) => void;
  onAddAction: (keyResultId: string) => void;
  onEditAction: (action: Action) => void;
  onDeleteAction: (actionId: string) => void;
  onGenerateActionPlan?: (keyResult: QuarterlyKeyResult) => void;
  onShareQuarterlyObjective?: (objectiveId: string) => void;
  onShareQuarterlyKeyResult?: (keyResultId: string) => void;
  onUpdateQuarterlyKeyResultProgress?: (keyResult: QuarterlyKeyResult) => void;
  onViewQuarterlyKeyResultHistory?: (keyResult: QuarterlyKeyResult) => void;
}

export const HierarchicalTreeView: React.FC<HierarchicalTreeViewProps> = ({
  ambitions,
  keyResults,
  quarterlyObjectives,
  quarterlyKeyResults,
  actions,
  onAddAmbition,
  onEditAmbition,
  onDeleteAmbition,
  onAddKeyResult,
  onEditKeyResult,
  onDeleteKeyResult,
  onAddQuarterlyObjective,
  onEditQuarterlyObjective,
  onDeleteQuarterlyObjective,
  onAddQuarterlyKeyResult,
  onEditQuarterlyKeyResult,
  onDeleteQuarterlyKeyResult,
  onAddAction,
  onEditAction,
  onDeleteAction,
  onGenerateActionPlan,
  onShareQuarterlyObjective,
  onShareQuarterlyKeyResult,
  onUpdateQuarterlyKeyResultProgress,
  onViewQuarterlyKeyResultHistory,
}) => {
  const [expandedAmbitions, setExpandedAmbitions] = useState<Set<string>>(new Set());
  const [expandedObjectives, setExpandedObjectives] = useState<Set<string>>(new Set());
  const [expandedKeyResults, setExpandedKeyResults] = useState<Set<string>>(new Set());
  const [openObjectiveComments, setOpenObjectiveComments] = useState<Set<string>>(new Set());
  const [openKRComments, setOpenKRComments] = useState<Set<string>>(new Set());
  const [hasInitialized, setHasInitialized] = useState(false);

  // Déplier automatiquement les deux premiers niveaux au chargement
  useEffect(() => {
    if (!hasInitialized && ambitions.length > 0) {
      // Niveau 1 : Toutes les ambitions (objectifs annuels)
      const allAmbitionIds = new Set(ambitions.map(a => a.id));
      setExpandedAmbitions(allAmbitionIds);

      // Niveau 2 : Tous les objectifs trimestriels
      const allObjectiveIds = new Set(quarterlyObjectives.map(o => o.id));
      setExpandedObjectives(allObjectiveIds);

      setHasInitialized(true);
    }
  }, [ambitions, quarterlyObjectives, hasInitialized]);

  const toggleAmbition = (ambitionId: string) => {
    const newExpanded = new Set(expandedAmbitions);
    if (newExpanded.has(ambitionId)) {
      newExpanded.delete(ambitionId);
    } else {
      newExpanded.add(ambitionId);
    }
    setExpandedAmbitions(newExpanded);
  };

  const toggleObjective = (objectiveId: string) => {
    const newExpanded = new Set(expandedObjectives);
    if (newExpanded.has(objectiveId)) {
      newExpanded.delete(objectiveId);
    } else {
      newExpanded.add(objectiveId);
    }
    setExpandedObjectives(newExpanded);
  };

  const toggleKeyResult = (keyResultId: string) => {
    const newExpanded = new Set(expandedKeyResults);
    if (newExpanded.has(keyResultId)) {
      newExpanded.delete(keyResultId);
    } else {
      newExpanded.add(keyResultId);
    }
    setExpandedKeyResults(newExpanded);
  };

  /**
 * Etat d'un resultat cle d'apres sa progression.
 * Les maquettes ecrivent l'etat en dur (pas de seuil declare) ; les valeurs
 * qu'elles affichent le revelent : 0 % et 20 % en retard, 33 % a risque,
 * 67 % et 78 % dans les temps. D'ou les bornes ci-dessous.
 * Couleurs : fit (vert) / finance (ambre) / rouge, comme .kr-bar dans
 * okr-objectifs.html.
 */
const statutKR = (progression: number): { barre: string; texte: string } => {
  if (progression >= 60) return { barre: 'bg-fit', texte: 'text-fit-dark' };
  if (progression >= 30) return { barre: 'bg-finance', texte: 'text-finance-dark' };
  return { barre: 'bg-[#ef4444]', texte: 'text-[#ef4444]' };
};

const quarterLabels = {
    [Quarter.Q1]: 'T1',
    [Quarter.Q2]: 'T2',
    [Quarter.Q3]: 'T3',
    [Quarter.Q4]: 'T4',
  };

  // Pastilles : memes couples fond clair / texte fonce que .obj-badge dans
  // okr-objectifs.html, pris dans les jetons Oskar plutot que dans les
  // echelles Tailwind generiques.
  const priorityColors = {
    [Priority.LOW]: 'bg-surface text-muted',
    [Priority.MEDIUM]: 'bg-okr-light text-okr-dark',
    [Priority.HIGH]: 'bg-finance-light text-finance-dark',
    [Priority.CRITICAL]: 'bg-[#fee2e2] text-[#dc2626]',
  };

  const statusColors = {
    [ActionStatus.TODO]: 'bg-surface text-muted',
    [ActionStatus.IN_PROGRESS]: 'bg-okr-light text-okr-dark',
    [ActionStatus.DONE]: 'bg-fit-light text-fit-dark',
  };

  const getKeyResultsForAmbition = (ambitionId: string) =>
    keyResults.filter(kr => kr.ambitionId === ambitionId);

  const getObjectivesForAmbition = (ambitionId: string) =>
    quarterlyObjectives.filter(obj => obj.ambitionId === ambitionId);

  const getKeyResultsForObjective = (objectiveId: string) =>
    quarterlyKeyResults.filter(kr => kr.quarterlyObjectiveId === objectiveId);

  const getActionsForKeyResult = (keyResultId: string) =>
    actions.filter(action => action.quarterlyKeyResultId === keyResultId);

  const getActionStatsForObjective = (objectiveId: string) => {
    const keyResults = getKeyResultsForObjective(objectiveId);
    const allActions = keyResults.flatMap(kr => getActionsForKeyResult(kr.id));
    return {
      total: allActions.length,
      todo: allActions.filter(a => a.status === ActionStatus.TODO).length,
      inProgress: allActions.filter(a => a.status === ActionStatus.IN_PROGRESS).length,
      done: allActions.filter(a => a.status === ActionStatus.DONE).length,
    };
  };

  return (
    <div className="space-y-4">
      {/* Arbre hiérarchique */}
      <div className="space-y-3">
        {ambitions.map((ambition) => {
          const isExpanded = expandedAmbitions.has(ambition.id);
          const ambitionKeyResults = getKeyResultsForAmbition(ambition.id);
          const objectives = getObjectivesForAmbition(ambition.id);

          return (
            <Card key={ambition.id} className="overflow-hidden">
              <CardContent className="p-0">
                {/* Niveau Ambition */}
                <div className={`relative bg-white p-4 border-l-4 transition-colors ${isExpanded ? 'border-okr' : 'border-transparent'}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3 flex-1">
                      <button
                        onClick={() => toggleAmbition(ambition.id)}
                        className="p-1 hover:bg-surface rounded transition-colors"
                      >
                        {isExpanded ? (
                          <ChevronDown className="h-4 w-4 text-muted" />
                        ) : (
                          <ChevronRight className="h-4 w-4 text-muted" />
                        )}
                      </button>
                      <Building2 className="h-5 w-5 text-okr" />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="text-15.5 font-bold text-navy">{ambition.title}</h3>
                          <span className="text-11.5 font-bold uppercase tracking-[0.5px] text-muted">Objectif annuel</span>
                        </div>
                        <p className="text-12.5 text-muted">{ambition.description}</p>
                      </div>
                      <Badge variant="info" size="sm">
                        {ambition.category}
                      </Badge>
                      <Badge variant="secondary" size="sm">
                        {objectives.length} objectifs
                      </Badge>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => onAddKeyResult(ambition.id)}
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Ajouter un KR
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => onAddQuarterlyObjective(ambition.id)}
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Ajouter un objectif trimestriel
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => onEditAmbition(ambition)}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => onDeleteAmbition(ambition.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>

                {/* KR d'Ambition (annuels) */}
                <AnimatePresence>
                  {isExpanded && ambitionKeyResults.length > 0 && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="overflow-hidden bg-surface"
                    >
                      <div className="pl-8 pr-4 py-3 space-y-2">
                        <div className="text-11.5 font-bold text-muted uppercase tracking-[0.5px] mb-2">
                          Résultats Clés Annuels ({ambitionKeyResults.length})
                        </div>
                        {ambitionKeyResults.map((kr) => {
                          const progress = kr.current && kr.target ? Math.round((kr.current / kr.target) * 100) : 0;

                          return (
                            <div
                              key={kr.id}
                              className="bg-white border border-line rounded-[10px] p-3 hover:shadow-card transition-shadow"
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-3 flex-1">
                                  <TrendingUp className="h-4 w-4 text-muted" />
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                      <h5 className="text-13.5 font-medium text-ink">{kr.title}</h5>
                                      <span className="text-11.5 font-bold uppercase tracking-[0.5px] text-muted">KR annuel</span>
                                    </div>
                                    <p className="text-12.5 text-muted">{kr.description}</p>
                                    <div className="flex items-center gap-4 mt-2">
                                      <div className="text-12 text-muted">
                                        <span className="font-medium">{kr.current}</span> / {kr.target} {kr.unit}
                                      </div>
                                      <div className="w-[88px] shrink-0">
                                        <div className="w-full bg-[#eef0f8] rounded-full h-[5px]">
                                          <div
                                            className={`${statutKR(progress).barre} h-[5px] rounded-full transition-all`}
                                            style={{ width: `${Math.min(progress, 100)}%` }}
                                          />
                                        </div>
                                      </div>
                                      <span className={`text-12 font-bold ${statutKR(progress).texte}`}>{progress}%</span>
                                    </div>
                                  </div>
                                </div>
                                <div className="flex items-center space-x-1">
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => onEditKeyResult(kr)}
                                  >
                                    <Edit2 className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => onDeleteKeyResult(kr.id)}
                                    className="text-red-600 hover:text-red-700"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Objectifs Trimestriels */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="overflow-hidden"
                    >
                      <div className="pl-8 space-y-2 py-2">
                        {objectives.map((objective) => {
                          const isObjectiveExpanded = expandedObjectives.has(objective.id);
                          const keyResults = getKeyResultsForObjective(objective.id);
                          const actionStats = getActionStatsForObjective(objective.id);

                          return (
                            <div key={objective.id} className="bg-white border border-line rounded-[10px]">
                              {/* Niveau Objectif Trimestriel */}
                              <div className="p-3">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center space-x-3 flex-1">
                                    <button
                                      onClick={() => toggleObjective(objective.id)}
                                      className="p-1 hover:bg-surface rounded transition-colors"
                                    >
                                      {isObjectiveExpanded ? (
                                        <ChevronDown className="h-4 w-4 text-muted" />
                                      ) : (
                                        <ChevronRight className="h-4 w-4 text-muted" />
                                      )}
                                    </button>
                                    <Target className="h-4 w-4 text-okr" />
                                    <div className="flex-1">
                                      <div className="flex items-center gap-2">
                                        <h4 className="text-15 font-bold text-navy">{objective.title}</h4>
                                        <span className="text-11 font-bold uppercase tracking-[0.8px] text-muted">Objectif trimestriel</span>
                                      </div>
                                      <p className="text-12.5 text-muted">{objective.description}</p>
                                    </div>
                                    <Badge variant="secondary" size="sm">
                                      {quarterLabels[objective.quarter]} {objective.year}
                                    </Badge>
                                    <Badge variant="info" size="sm">
                                      {keyResults.length} KR
                                    </Badge>
                                    <Badge variant="success" size="sm">
                                      {actionStats.total} actions
                                    </Badge>
                                  </div>
                                  <div className="flex items-center space-x-1">
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={() => onAddQuarterlyKeyResult(objective.id)}
                                    >
                                      <Plus className="h-3 w-3 mr-1" />
                                      Ajouter un KR
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={() => onEditQuarterlyObjective(objective)}
                                    >
                                      <Edit2 className="h-3 w-3" />
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={() => onShareQuarterlyObjective && onShareQuarterlyObjective(objective.id)}
                                    >
                                      <Share2 className="h-3 w-3" />
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={() => {
                                        const s = new Set(openObjectiveComments);
                                        s.has(objective.id) ? s.delete(objective.id) : s.add(objective.id);
                                        setOpenObjectiveComments(s);
                                      }}
                                    >
                                      <MessageSquare className="h-3 w-3" />
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={() => onDeleteQuarterlyObjective(objective.id)}
                                      className="text-red-600 hover:text-red-700"
                                    >
                                      <Trash2 className="h-3 w-3" />
                                    </Button>
                                  </div>
                                </div>

                                {/* Statistiques des actions */}
                                {actionStats.total > 0 && (
                                  <div className="flex items-center space-x-2 mt-2 text-xs">
                                    <span className="text-gray-600">Actions:</span>
                                    <Badge className={statusColors[ActionStatus.TODO]} size="sm">
                                      {actionStats.todo} à faire
                                    </Badge>
                                    <Badge className={statusColors[ActionStatus.IN_PROGRESS]} size="sm">
                                      {actionStats.inProgress} en cours
                                    </Badge>
                                    <Badge className={statusColors[ActionStatus.DONE]} size="sm">
                                      {actionStats.done} terminées
                                    </Badge>
                                  </div>
                                )}
                              </div>

                              {/* Commentaires Objectif (toggle) */}
                              {openObjectiveComments.has(objective.id) && (
                                <div className="px-3 pb-3">
                                  <CommentList entityId={objective.id} entityType={'quarterly_objective'} />
                                </div>
                              )}

                              {/* KR et Actions */}
                              <AnimatePresence>
                                {isObjectiveExpanded && (
                                  <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    transition={{ duration: 0.2 }}
                                    className="overflow-hidden"
                                  >
                                    <div className="pl-6 pb-3 space-y-2">
                                      {/* Key Results */}
                                      {keyResults.map((kr) => {
                                        const isKRExpanded = expandedKeyResults.has(kr.id);
                                        const krActions = getActionsForKeyResult(kr.id);

                                        return (
                                          <div key={kr.id} className="bg-white border border-line rounded-[10px]">
                                            <div className="p-2">
                                              <div className="flex items-center justify-between">
                                                <div className="flex items-center space-x-2 flex-1">
                                                  <button
                                                    onClick={() => toggleKeyResult(kr.id)}
                                                    className="p-1 hover:bg-surface rounded transition-colors"
                                                  >
                                                    {isKRExpanded ? (
                                                      <ChevronDown className="h-3 w-3 text-muted" />
                                                    ) : (
                                                      <ChevronRight className="h-3 w-3 text-muted" />
                                                    )}
                                                  </button>
                                                  <TrendingUp className="h-3 w-3 text-muted" />
                                                  <span className="text-13.5 font-medium text-ink">{kr.title}</span>
                                                  <span className="text-11 font-bold uppercase tracking-[0.8px] text-muted">KR</span>
                                                  <span className="text-12 text-muted">
                                                    {kr.current}/{kr.target} {kr.unit}
                                                  </span>
                                                  <Badge variant="success" size="sm">
                                                    {krActions.length} actions
                                                  </Badge>
                                                </div>
                                                <div className="flex items-center space-x-1">
                                                  <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => onUpdateQuarterlyKeyResultProgress && onUpdateQuarterlyKeyResultProgress(kr)}
                                                  >
                                                    <RefreshCw className="h-3 w-3 mr-1" />
                                                    Mettre à jour
                                                  </Button>
                                                  <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    onClick={() => onViewQuarterlyKeyResultHistory && onViewQuarterlyKeyResultHistory(kr)}
                                                  >
                                                    <History className="h-3 w-3 mr-1" />
                                                    Historique
                                                  </Button>
                                                  <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    onClick={() => onAddAction(kr.id)}
                                                  >
                                                    <Plus className="h-3 w-3 mr-1" />
                                                    Ajouter une action
                                                  </Button>
                                                  <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    onClick={() => onGenerateActionPlan && onGenerateActionPlan(kr)}
                                                  >
                                                    <Sparkles className="h-3 w-3 mr-1" />
                                                    Générer un plan
                                                  </Button>
                                                  <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    onClick={() => onEditQuarterlyKeyResult(kr)}
                                                  >
                                                    <Edit2 className="h-3 w-3" />
                                                  </Button>
                                                  <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    onClick={() => onShareQuarterlyKeyResult && onShareQuarterlyKeyResult(kr.id)}
                                                  >
                                                    <Share2 className="h-3 w-3" />
                                                  </Button>
                                                  <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    onClick={() => {
                                                      const s = new Set(openKRComments);
                                                      s.has(kr.id) ? s.delete(kr.id) : s.add(kr.id);
                                                      setOpenKRComments(s);
                                                    }}
                                                  >
                                                    <MessageSquare className="h-3 w-3" />
                                                  </Button>
                                                  <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    onClick={() => onDeleteQuarterlyKeyResult(kr.id)}
                                                    className="text-red-600 hover:text-red-700"
                                                  >
                                                    <Trash2 className="h-3 w-3" />
                                                  </Button>
                                                </div>
                                              </div>
                                            </div>

                                            {/* Actions du KR */}
                                            <AnimatePresence>
                                              {isKRExpanded && (
                                                <motion.div
                                                  initial={{ height: 0, opacity: 0 }}
                                                  animate={{ height: 'auto', opacity: 1 }}
                                                  exit={{ height: 0, opacity: 0 }}
                                                  transition={{ duration: 0.2 }}
                                                  className="overflow-hidden"
                                                >
                                                  <div className="pl-6 pr-2 pb-2 space-y-1">
                                                    {openKRComments.has(kr.id) && (
                                                      <div className="mb-2">
                                                        <CommentList entityId={kr.id} entityType={'quarterly_key_result'} />
                                                      </div>
                                                    )}
                                                    {krActions.map((action) => (
                                                      <div key={action.id} className="bg-orange-50 border-l-2 border-orange-400 p-2 rounded-r">
                                                        <div className="flex items-center justify-between">
                                                          <div className="flex items-center space-x-2 flex-1">
                                                            <Calendar className="h-3 w-3 text-orange-600" />
                                                            <span className="text-sm font-medium text-orange-900">{action.title}</span>
                                                            <span className="text-xs text-orange-400 font-normal">Action</span>
                                                            <Badge
                                                              variant={action.status === ActionStatus.DONE ? 'success' : action.status === ActionStatus.IN_PROGRESS ? 'info' : 'secondary'}
                                                              size="sm"
                                                            >
                                                              {action.status === ActionStatus.TODO ? 'À faire' : action.status === ActionStatus.IN_PROGRESS ? 'En cours' : 'Terminé'}
                                                            </Badge>
                                                            <Badge variant="secondary" size="sm">
                                                              {action.priority}
                                                            </Badge>
                                                          </div>
                                                          <div className="flex items-center space-x-1">
                                                            <Button
                                                              size="sm"
                                                              variant="ghost"
                                                              onClick={() => onEditAction(action)}
                                                            >
                                                              <Edit2 className="h-3 w-3" />
                                                            </Button>
                                                            <Button
                                                              size="sm"
                                                              variant="ghost"
                                                              onClick={() => onDeleteAction(action.id)}
                                                              className="text-red-600 hover:text-red-700"
                                                            >
                                                              <Trash2 className="h-3 w-3" />
                                                            </Button>
                                                          </div>
                                                        </div>
                                                      </div>
                                                    ))}
                                                    {krActions.length === 0 && (
                                                      <div className="text-center py-2 text-gray-500">
                                                        <p className="text-xs">Aucune action</p>
                                                      </div>
                                                    )}
                                                  </div>
                                                </motion.div>
                                              )}
                                            </AnimatePresence>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </div>
                          );
                        })}

                        {objectives.length === 0 && (
                          <div className="text-center py-4 text-gray-500">
                            <p className="text-sm">Aucun objectif trimestriel</p>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => onAddQuarterlyObjective(ambition.id)}
                              className="mt-2"
                            >
                              <Plus className="h-3 w-3 mr-2" />
                              Créer le premier objectif
                            </Button>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </CardContent>
            </Card>
          );
        })}

        {ambitions.length === 0 && (
          <Card>
            <CardContent className="text-center py-12">
              <Building2 className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Aucun objectif annuel défini
              </h3>
              <p className="text-gray-600 mb-4">
                Commencez par créer votre premier objectif annuel pour structurer vos objectifs.
              </p>
              <Button onClick={onAddAmbition}>
                <Plus className="h-4 w-4 mr-2" />
                Créer mon premier objectif annuel
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};
