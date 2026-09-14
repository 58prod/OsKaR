import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ActionAssigneesService } from '@/services/db/actionAssignees';
import type { ActionAssigneeFormData } from '@/types';

/**
 * Hook pour récupérer tous les assignés d'une action
 */
export function useActionAssignees(actionId: string | undefined) {
    return useQuery({
        queryKey: ['actionAssignees', actionId],
        queryFn: () => ActionAssigneesService.getByAction(actionId!),
        enabled: !!actionId,
        staleTime: 1000 * 60 * 5, // 5 minutes
    });
}

/**
 * Hook pour affecter une action à un utilisateur interne
 */
export function useAssignToUser() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: {
            actionId: string;
            userId: string;
            assignedBy: string;
        }) => ActionAssigneesService.assignToUser(data.actionId, data.userId, data.assignedBy),
        onSuccess: (_, variables) => {
            // Invalider les assignés de cette action
            queryClient.invalidateQueries({ queryKey: ['actionAssignees', variables.actionId] });
            // Invalider aussi les actions pour rafraîchir l'affichage
            queryClient.invalidateQueries({ queryKey: ['actions'] });
        },
    });
}

/**
 * Hook pour affecter une action à un contact externe
 */
export function useAssignToExternalContact() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: {
            actionId: string;
            externalContactId: string;
            assignedBy: string;
        }) => ActionAssigneesService.assignToExternalContact(
            data.actionId,
            data.externalContactId,
            data.assignedBy
        ),
        onSuccess: (_, variables) => {
            // Invalider les assignés de cette action
            queryClient.invalidateQueries({ queryKey: ['actionAssignees', variables.actionId] });
            // Invalider aussi les actions
            queryClient.invalidateQueries({ queryKey: ['actions'] });
        },
    });
}

/**
 * Hook pour affecter plusieurs personnes en une fois
 */
export function useAssignMultiple() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: {
            actionId: string;
            assignees: ActionAssigneeFormData[];
            assignedBy: string;
        }) => ActionAssigneesService.assignMultiple(data.actionId, data.assignees, data.assignedBy),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['actionAssignees', variables.actionId] });
            queryClient.invalidateQueries({ queryKey: ['actions'] });
        },
    });
}

/**
 * Hook pour retirer une affectation
 */
export function useUnassign() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: {
            assigneeId: string;
            actionId: string; // Pour l'invalidation
        }) => ActionAssigneesService.unassign(data.assigneeId),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['actionAssignees', variables.actionId] });
            queryClient.invalidateQueries({ queryKey: ['actions'] });
        },
    });
}

/**
 * Hook pour remplacer toutes les affectations d'une action
 * Utilisé lors de l'édition d'une action avec le formulaire
 */
export function useReplaceAllAssignees() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: {
            actionId: string;
            newAssignees: ActionAssigneeFormData[];
            assignedBy: string;
        }) => ActionAssigneesService.replaceAll(data.actionId, data.newAssignees, data.assignedBy),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['actionAssignees', variables.actionId] });
            queryClient.invalidateQueries({ queryKey: ['actions'] });
        },
    });
}

/**
 * Hook pour récupérer toutes les actions assignées à un utilisateur
 */
export function useActionsByAssignee(userId: string | undefined) {
    return useQuery({
        queryKey: ['actionAssignees', 'byUser', userId],
        queryFn: () => ActionAssigneesService.getActionsByUser(userId!),
        enabled: !!userId,
        staleTime: 1000 * 60 * 5,
    });
}
