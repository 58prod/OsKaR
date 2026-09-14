import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { motion } from 'framer-motion';
import {
  Calendar,
  AlertTriangle,
  Edit2,
  Trash2,
  Target,
  Clock,
} from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { AssigneeAvatar } from '@/components/ui/AssigneeAvatar';
import { Action, Priority, Quarter } from '@/types';
import { formatDate, getDaysUntilDeadline } from '@/utils';

interface KanbanCardProps {
  action: Action;
  onEdit: () => void;
  onDelete: () => void;
  quarterlyObjective?: {
    id: string;
    title: string;
    quarter: Quarter;
    year: number;
  };
  isDragging?: boolean;
}

export const KanbanCard: React.FC<KanbanCardProps> = ({
  action,
  onEdit,
  onDelete,
  quarterlyObjective,
  isDragging = false,
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging,
  } = useSortable({ id: action.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const priorityColors = {
    [Priority.LOW]: 'bg-gray-100 text-gray-800 border-gray-300',
    [Priority.MEDIUM]: 'bg-blue-100 text-blue-800 border-blue-300',
    [Priority.HIGH]: 'bg-orange-100 text-orange-800 border-orange-300',
    [Priority.CRITICAL]: 'bg-red-100 text-red-800 border-red-300',
  };

  const priorityLabels = {
    [Priority.LOW]: 'Faible',
    [Priority.MEDIUM]: 'Moyenne',
    [Priority.HIGH]: 'Haute',
    [Priority.CRITICAL]: 'Critique',
  };

  const quarterLabels = {
    [Quarter.Q1]: 'T1',
    [Quarter.Q2]: 'T2',
    [Quarter.Q3]: 'T3',
    [Quarter.Q4]: 'T4',
  };

  // Calculer les jours jusqu'à l'échéance
  const daysUntilDeadline = action.deadline ? getDaysUntilDeadline(action.deadline) : null;
  const isOverdue = daysUntilDeadline !== null && daysUntilDeadline < 0;
  const isUrgent = daysUntilDeadline !== null && daysUntilDeadline <= 3 && daysUntilDeadline >= 0;

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: isDragging ? 1 : 1.02 }}
      className={`
        bg-white rounded-lg border p-4 cursor-grab active:cursor-grabbing group
        transition-all duration-200 transform-gpu will-change-transform
        hover:shadow-md
        ${isSortableDragging ? 'opacity-0' : ''}
        ${isDragging ? 'scale-[1.03] shadow-2xl ring-2 ring-blue-300' : 'shadow-sm'}
        ${isOverdue ? 'border-red-300 bg-red-50' : ''}
        ${isUrgent ? 'border-orange-300 bg-orange-50' : ''}
      `}
    >
      {/* En-tête avec titre et actions */}
      <div className="flex items-start justify-between mb-3">
        <h4 className="font-medium text-gray-900 text-sm leading-tight flex-1 pr-2">
          {action.title}
        </h4>
        <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            size="sm"
            variant="ghost"
            onClick={(e) => {
              e.stopPropagation();
              onEdit();
            }}
            className="h-6 w-6 p-0"
          >
            <Edit2 className="h-3 w-3" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="h-6 w-6 p-0 text-red-600 hover:text-red-700"
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </div>

      {/* Description */}
      {action.description && (
        <p className="text-xs text-gray-600 mb-3 line-clamp-2">
          {action.description}
        </p>
      )}

      {/* Objectif trimestriel */}
      {quarterlyObjective && (
        <div className="flex items-center text-xs text-gray-500 mb-2">
          <Target className="h-3 w-3 mr-1" />
          <span className="truncate">
            {quarterlyObjective.title}
          </span>
          <Badge variant="secondary" size="sm" className="ml-2">
            {quarterLabels[quarterlyObjective.quarter]} {quarterlyObjective.year}
          </Badge>
        </div>
      )}

      {/* Labels */}
      {action.labels.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3">
          {action.labels.slice(0, 3).map((label, index) => (
            <Badge key={index} variant="secondary" size="sm" className="text-xs">
              {label}
            </Badge>
          ))}
          {action.labels.length > 3 && (
            <Badge variant="secondary" size="sm" className="text-xs">
              +{action.labels.length - 3}
            </Badge>
          )}
        </div>
      )}

      {/* Assignés */}
      {action.assignees && action.assignees.length > 0 && (
        <div className="mb-3">
          <AssigneeAvatar assignees={action.assignees} maxDisplay={3} size="sm" />
        </div>
      )}

      {/* Footer avec priorité et échéance */}
      <div className="flex items-center justify-between">
        {/* Priorité */}
        <Badge
          className={`${priorityColors[action.priority]} text-xs border`}
          size="sm"
        >
          <AlertTriangle className="h-3 w-3 mr-1" />
          {priorityLabels[action.priority]}
        </Badge>

        {/* Échéance */}
        {action.deadline && (
          <div className={`
            flex items-center text-xs
            ${isOverdue ? 'text-red-600' : isUrgent ? 'text-orange-600' : 'text-gray-500'}
          `}>
            <Calendar className="h-3 w-3 mr-1" />
            <span>
              {daysUntilDeadline !== null && (
                <>
                  {isOverdue ? (
                    `En retard de ${Math.abs(daysUntilDeadline)} j`
                  ) : daysUntilDeadline === 0 ? (
                    'Aujourd\'hui'
                  ) : daysUntilDeadline === 1 ? (
                    'Demain'
                  ) : (
                    `Dans ${daysUntilDeadline} j`
                  )}
                </>
              )}
            </span>
          </div>
        )}
      </div>

      {/* Indicateur de temps de création */}
      <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-100">
        <div className="flex items-center text-xs text-gray-400">
          <Clock className="h-3 w-3 mr-1" />
          <span>
            Créé le {formatDate(action.createdAt)}
          </span>
        </div>

        {action.completedAt && (
          <div className="flex items-center text-xs text-green-600">
            <span>
              Terminé le {formatDate(action.completedAt)}
            </span>
          </div>
        )}
      </div>
    </motion.div>
  );
};
