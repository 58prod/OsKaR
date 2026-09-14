import React, { useState } from 'react';
import { Edit2, Trash2, Calendar, Flag, Tag } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { AssigneeAvatar } from '@/components/ui/AssigneeAvatar';
import type { Action, QuarterlyKeyResult, QuarterlyObjective, ActionStatus } from '@/types';
import { Priority } from '@/types';
import { formatDate } from '@/utils';

interface ActionsTableViewProps {
  actions: Action[];
  onActionEdit: (action: Action) => void;
  onActionDelete: (actionId: string) => void;
  onActionStatusChange: (actionId: string, newStatus: ActionStatus) => void;
  quarterlyKeyResults?: QuarterlyKeyResult[];
  quarterlyObjectives?: QuarterlyObjective[];
}

export const ActionsTableView: React.FC<ActionsTableViewProps> = ({
  actions,
  onActionEdit,
  onActionDelete,
  onActionStatusChange,
  quarterlyKeyResults = [],
  quarterlyObjectives = [],
}) => {
  const [sortBy, setSortBy] = useState<'title' | 'status' | 'priority' | 'deadline'>('title');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  const getKRTitle = (krId: string) => {
    const kr = quarterlyKeyResults.find(k => k.id === krId);
    return kr?.title || 'N/A';
  };

  const getObjectiveTitle = (krId: string) => {
    const kr = quarterlyKeyResults.find(k => k.id === krId);
    if (!kr) return 'N/A';
    const objective = quarterlyObjectives.find(o => o.id === kr.quarterlyObjectiveId);
    return objective?.title || 'N/A';
  };

  const statusColors: Record<string, string> = {
    todo: 'bg-gray-100 text-gray-700',
    in_progress: 'bg-blue-100 text-blue-700',
    done: 'bg-green-100 text-green-700',
  };

  const priorityColors: Record<Priority, string> = {
    [Priority.LOW]: 'bg-gray-100 text-gray-600',
    [Priority.MEDIUM]: 'bg-yellow-100 text-yellow-700',
    [Priority.HIGH]: 'bg-red-100 text-red-700',
    [Priority.CRITICAL]: 'bg-purple-100 text-purple-700',
  };

  const priorityLabels: Record<Priority, string> = {
    [Priority.LOW]: 'Basse',
    [Priority.MEDIUM]: 'Moyenne',
    [Priority.HIGH]: 'Haute',
    [Priority.CRITICAL]: 'Critique',
  };

  const handleSort = (column: 'title' | 'status' | 'priority' | 'deadline') => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('asc');
    }
  };

  const sortedActions = [...actions].sort((a, b) => {
    let comparison = 0;

    switch (sortBy) {
      case 'title':
        comparison = a.title.localeCompare(b.title);
        break;
      case 'status':
        comparison = a.status.localeCompare(b.status);
        break;
      case 'priority':
        const priorityOrder: Record<Priority, number> = {
          [Priority.CRITICAL]: 4,
          [Priority.HIGH]: 3,
          [Priority.MEDIUM]: 2,
          [Priority.LOW]: 1,
        };
        comparison = priorityOrder[a.priority] - priorityOrder[b.priority];
        break;
      case 'deadline':
        const aDate = a.deadline ? new Date(a.deadline).getTime() : 0;
        const bDate = b.deadline ? new Date(b.deadline).getTime() : 0;
        comparison = aDate - bDate;
        break;
    }

    return sortOrder === 'asc' ? comparison : -comparison;
  });

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th
              onClick={() => handleSort('title')}
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
            >
              Action {sortBy === 'title' && (sortOrder === 'asc' ? '↑' : '↓')}
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Résultat Clé
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Objectif
            </th>
            <th
              onClick={() => handleSort('status')}
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
            >
              Statut {sortBy === 'status' && (sortOrder === 'asc' ? '↑' : '↓')}
            </th>
            <th
              onClick={() => handleSort('priority')}
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
            >
              Priorité {sortBy === 'priority' && (sortOrder === 'asc' ? '↑' : '↓')}
            </th>
            <th
              onClick={() => handleSort('deadline')}
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
            >
              Échéance {sortBy === 'deadline' && (sortOrder === 'asc' ? '↑' : '↓')}
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Labels
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Assignés
            </th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {sortedActions.map((action) => (
            <tr key={action.id} className="hover:bg-gray-50">
              <td className="px-6 py-4">
                <div className="text-sm font-medium text-gray-900">{action.title}</div>
                {action.description && (
                  <div className="text-sm text-gray-500 mt-1">{action.description}</div>
                )}
              </td>
              <td className="px-6 py-4 text-sm text-gray-500">
                {getKRTitle(action.quarterlyKeyResultId)}
              </td>
              <td className="px-6 py-4 text-sm text-gray-500">
                {getObjectiveTitle(action.quarterlyKeyResultId)}
              </td>
              <td className="px-6 py-4">
                <select
                  value={action.status}
                  onChange={(e) => onActionStatusChange(action.id, e.target.value as ActionStatus)}
                  className={`text-xs font-medium px-2 py-1 rounded-full border-0 ${statusColors[action.status]}`}
                >
                  <option value="todo">À faire</option>
                  <option value="in_progress">En cours</option>
                  <option value="done">Terminé</option>
                </select>
              </td>
              <td className="px-6 py-4">
                <Badge className={priorityColors[action.priority]} size="sm">
                  <Flag className="h-3 w-3 mr-1" />
                  {priorityLabels[action.priority]}
                </Badge>
              </td>
              <td className="px-6 py-4 text-sm text-gray-500">
                {action.deadline ? (
                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 mr-1 text-gray-400" />
                    {formatDate(action.deadline)}
                  </div>
                ) : (
                  <span className="text-gray-400">-</span>
                )}
              </td>
              <td className="px-6 py-4">
                <div className="flex flex-wrap gap-1">
                  {action.labels && action.labels.length > 0 ? (
                    action.labels.map((label, idx) => (
                      <Badge key={idx} variant="secondary" size="sm">
                        <Tag className="h-3 w-3 mr-1" />
                        {label}
                      </Badge>
                    ))
                  ) : (
                    <span className="text-gray-400 text-sm">-</span>
                  )}
                </div>
              </td>
              <td className="px-6 py-4">
                {action.assignees && action.assignees.length > 0 ? (
                  <AssigneeAvatar assignees={action.assignees} maxDisplay={2} size="sm" />
                ) : (
                  <span className="text-gray-400 text-sm">-</span>
                )}
              </td>
              <td className="px-6 py-4 text-right text-sm font-medium">
                <div className="flex items-center justify-end space-x-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onActionEdit(action)}
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onActionDelete(action.id)}
                  >
                    <Trash2 className="h-4 w-4 text-red-600" />
                  </Button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {sortedActions.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <p>Aucune action à afficher</p>
        </div>
      )}
    </div>
  );
};

