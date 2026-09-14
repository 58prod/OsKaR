import React from 'react';
import { X } from 'lucide-react';
import type { ActionAssignee } from '@/types';

interface AssigneeAvatarProps {
    assignees?: ActionAssignee[];
    maxDisplay?: number;
    size?: 'sm' | 'md' | 'lg';
    onRemove?: (assigneeId: string) => void;
    showNames?: boolean;
}

/**
 * Composant pour afficher les avatars des personnes assignées à une action
 */
export const AssigneeAvatar: React.FC<AssigneeAvatarProps> = ({
    assignees = [],
    maxDisplay = 3,
    size = 'md',
    onRemove,
    showNames = false,
}) => {

    if (assignees.length === 0) {
        return null;
    }

    const sizeClasses = {
        sm: 'w-6 h-6 text-xs',
        md: 'w-8 h-8 text-sm',
        lg: 'w-10 h-10 text-base',
    };

    const displayedAssignees = assignees.slice(0, maxDisplay);
    const remainingCount = assignees.length - maxDisplay;

    const getInitials = (name: string) => {
        return name
            .split(' ')
            .map(n => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);
    };

    const getAssigneeName = (assignee: ActionAssignee): string => {
        if (assignee.assigneeType === 'internal') {
            return assignee.userName || assignee.userEmail || 'Utilisateur';
        } else {
            const contact = assignee.externalContact;
            return contact ? `${contact.firstName} ${contact.lastName}` : 'Contact externe';
        }
    };

    const getAssigneeColor = (assignee: ActionAssignee, index: number): string => {
        const colors = [
            'bg-blue-500',
            'bg-green-500',
            'bg-purple-500',
            'bg-pink-500',
            'bg-yellow-500',
            'bg-indigo-500',
        ];
        return colors[index % colors.length];
    };

    return (
        <div className="flex items-center gap-2">
            <div className="flex -space-x-2">
                {displayedAssignees.map((assignee, index) => {
                    const name = getAssigneeName(assignee);
                    const initials = getInitials(name);
                    const colorClass = getAssigneeColor(assignee, index);

                    return (
                        <div
                            key={assignee.id}
                            className={`relative inline-flex items-center justify-center ${sizeClasses[size]} ${colorClass} text-white rounded-full border-2 border-white font-medium group`}
                            title={name}
                        >
                            {initials}
                            {onRemove && (
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onRemove(assignee.id);
                                    }}
                                    className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                    <X className="w-3 h-3 text-white" />
                                </button>
                            )}
                        </div>
                    );
                })}

                {remainingCount > 0 && (
                    <div
                        className={`inline-flex items-center justify-center ${sizeClasses[size]} bg-gray-300 text-gray-700 rounded-full border-2 border-white font-medium`}
                        title={`+${remainingCount} autres`}
                    >
                        +{remainingCount}
                    </div>
                )}
            </div>

            {showNames && displayedAssignees.length > 0 && (
                <div className="flex flex-col text-xs text-gray-600">
                    {displayedAssignees.map((assignee) => (
                        <span key={assignee.id}>{getAssigneeName(assignee)}</span>
                    ))}
                    {remainingCount > 0 && <span>+{remainingCount} autres</span>}
                </div>
            )}
        </div>
    );
};
