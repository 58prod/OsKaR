import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ActionsService } from '@/services/db';
import type { Action } from '@/types';
import { ActionStatus } from '@/types';

/**
 * Hook pour récupérer toutes les actions d'un utilisateur
 */
export function useActions(userId: string | undefined, status?: ActionStatus) {
  return useQuery({
    queryKey: ['actions', userId, status],
    queryFn: () => ActionsService.getAll(userId!, status),
    enabled: !!userId,
    staleTime: 1000 * 60 * 5,
  });
}

/**
 * Hook pour récupérer les actions d'un Key Result trimestriel
 */
export function useActionsByKeyResult(keyResultId: string | undefined, userId: string | undefined) {
  return useQuery({
    queryKey: ['actions', 'keyResult', keyResultId],
    queryFn: () => ActionsService.getByKeyResultId(keyResultId!, userId!),
    enabled: !!keyResultId && !!userId,
    staleTime: 1000 * 60 * 5,
  });
}

/**
 * Hook pour récupérer les actions par statut (pour le Kanban)
 */
export function useActionsByStatus(userId: string | undefined) {
  return useQuery({
    queryKey: ['actions', 'status', userId],
    queryFn: () => ActionsService.getByStatus(userId!),
    enabled: !!userId,
    staleTime: 1000 * 60 * 5,
  });
}

/**
 * Hook pour récupérer une action par son ID
 */
export function useAction(id: string | undefined, userId: string | undefined) {
  return useQuery({
    queryKey: ['actions', id],
    queryFn: () => ActionsService.getById(id!, userId!),
    enabled: !!id && !!userId,
    staleTime: 1000 * 60 * 5,
  });
}

/**
 * Hook pour créer une action
 */
export function useCreateAction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { action: Partial<Action>; userId: string }) =>
      ActionsService.create(data.action, data.userId),
    onSuccess: () => {
      // Invalider TOUTES les queries d'actions
      queryClient.invalidateQueries({ queryKey: ['actions'] });
    },
  });
}

/**
 * Hook pour mettre à jour une action
 */
export function useUpdateAction(userId?: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { id: string; updates: Partial<Action> }) =>
      ActionsService.update(data.id, data.updates, userId!),
    onSuccess: (updatedAction) => {
      queryClient.setQueryData(['actions', updatedAction.id], updatedAction);
      queryClient.invalidateQueries({ queryKey: ['actions'] });
    },
  });
}

/**
 * Hook pour mettre à jour le statut d'une action (Kanban)
 */
export function useUpdateActionStatus(userId?: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { id: string; status: ActionStatus }) =>
      ActionsService.updateStatus(data.id, data.status, userId!),
    onMutate: async (data) => {
      // Annuler les requêtes en cours pour éviter les conflits
      await queryClient.cancelQueries({ queryKey: ['actions'] });

      // Sauvegarder l'état précédent
      const previousActions = queryClient.getQueryData<Action[]>(['actions', userId, undefined]);

      // Optimistic update
      if (previousActions) {
        queryClient.setQueryData<Action[]>(['actions', userId, undefined], (old) =>
          old?.map((action) =>
            action.id === data.id
              ? { ...action, status: data.status, completedAt: data.status === ActionStatus.DONE ? new Date() : undefined }
              : action
          ) || []
        );
      }

      return { previousActions };
    },
    onError: (err, data, context) => {
      // Rollback en cas d'erreur
      if (context?.previousActions) {
        queryClient.setQueryData(['actions', userId, undefined], context.previousActions);
      }
    },
    onSettled: () => {
      // Rafraîchir les données après la mutation
      queryClient.invalidateQueries({ queryKey: ['actions'] });
    },
  });
}

/**
 * Hook pour supprimer une action
 */
export function useDeleteAction(userId?: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => ActionsService.delete(id, userId!),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['actions'] });
      queryClient.removeQueries({ queryKey: ['actions', id] });
    },
  });
}

/**
 * Hook pour mettre à jour l'ordre des actions (batch)
 */
export function useUpdateActionsOrder(userId?: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (updates: { id: string; order_index: number }[]) => {
      try {
        const result = await ActionsService.updateOrder(updates, userId!);
        return result;
      } catch (error) {
        console.error('❌ useUpdateActionsOrder - Erreur:', error);
        throw error;
      }
    },
    onMutate: async (updates) => {
      // Annuler les requêtes en cours
      await queryClient.cancelQueries({ queryKey: ['actions'] });

      // Sauvegarder l'état précédent
      const previousActions = queryClient.getQueryData<Action[]>(['actions', userId, undefined]);

      // Optimistic update
      if (previousActions) {
        queryClient.setQueryData<Action[]>(['actions', userId, undefined], (old) => {
          if (!old) return [];

          // Créer une map des nouveaux order_index
          const orderMap = new Map(updates.map(u => [u.id, u.order_index]));

          // Mettre à jour les order_index sans toucher aux autres propriétés
          // (notamment le statut qui peut avoir été modifié par une mutation précédente)
          const updated = old.map(action => {
            const newOrder = orderMap.get(action.id);
            return newOrder !== undefined ? { ...action, order_index: newOrder } : action;
          });

          // Trier par order_index
          return updated.sort((a, b) => a.order_index - b.order_index);
        });
      }

      return { previousActions };
    },
    onError: (err, updates, context) => {
      console.error('❌ useUpdateActionsOrder - onError:', {
        error: err,
        updatesCount: updates.length,
        hasContext: !!context?.previousActions
      });

      // Rollback en cas d'erreur
      if (context?.previousActions) {
        queryClient.setQueryData(['actions', userId, undefined], context.previousActions);
      }

      // Afficher un message d'erreur à l'utilisateur
      if (typeof window !== 'undefined') {
        alert(`Erreur lors de la réorganisation: ${err instanceof Error ? err.message : 'Erreur inconnue'}`);
      }
    },
    onSettled: () => {
      // Rafraîchir les données après la mutation
      queryClient.invalidateQueries({ queryKey: ['actions'] });
    },
  });
}

/**
 * Hook pour déplacer une action (statut + position en une seule opération)
 */
export function useMoveAction(userId?: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      actionId: string;
      newStatus: ActionStatus;
      orderUpdates: { id: string; order_index: number }[];
    }) => {
      try {
        const result = await ActionsService.moveAction(data.actionId, data.newStatus, data.orderUpdates, userId!);
        return result;
      } catch (error) {
        console.error('❌ useMoveAction - Erreur:', error);
        throw error;
      }
    },
    onMutate: async (data) => {
      // Annuler les requêtes en cours pour toutes les variantes de la query
      await queryClient.cancelQueries({ queryKey: ['actions'] });

      // Sauvegarder l'état précédent (la clé complète inclut userId et status)
      const previousActions = queryClient.getQueryData<Action[]>(['actions', userId, undefined]);

      // Optimistic update combiné
      if (previousActions) {
        queryClient.setQueryData<Action[]>(['actions', userId, undefined], (old) => {
          if (!old) return [];

          // Créer une map des nouveaux order_index
          const orderMap = new Map(data.orderUpdates.map(u => [u.id, u.order_index]));

          // Mettre à jour le statut ET les order_index
          const updated = old.map(action => {
            const newOrder = orderMap.get(action.id);

            if (action.id === data.actionId) {
              // L'action déplacée : changer statut + order_index
              return {
                ...action,
                status: data.newStatus,
                completedAt: data.newStatus === ActionStatus.DONE ? new Date() : undefined,
                order_index: newOrder !== undefined ? newOrder : action.order_index,
              };
            } else if (newOrder !== undefined) {
              // Les autres actions affectées : juste l'order_index
              return { ...action, order_index: newOrder };
            }

            return action;
          });

          // Trier par order_index
          return updated.sort((a, b) => a.order_index - b.order_index);
        });
      }

      return { previousActions };
    },
    onError: (err, data, context) => {
      console.error('❌ useMoveAction - onError:', {
        error: err,
        data,
        hasContext: !!context?.previousActions
      });

      // Rollback en cas d'erreur
      if (context?.previousActions) {
        queryClient.setQueryData(['actions', userId, undefined], context.previousActions);
      }

      // Afficher un message d'erreur à l'utilisateur
      if (typeof window !== 'undefined') {
        alert(`Erreur lors du déplacement de l'action: ${err instanceof Error ? err.message : 'Erreur inconnue'}`);
      }
    },
    // Pas de onSuccess ni d'invalidation : le cache a déjà été mis à jour dans
    // onMutate, et un refetch écraserait l'optimistic update.
  });
}
