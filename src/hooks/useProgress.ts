import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ProgressService } from '@/services/db';
import type { EntityType } from '@/types';

/**
 * Hook pour récupérer l'historique de progression d'une entité
 */
export function useProgressHistory(
  entityId: string | undefined,
  userId: string | undefined
) {
  return useQuery({
    queryKey: ['progress', entityId, userId],
    queryFn: () => ProgressService.getByEntityId(entityId!, userId!),
    enabled: !!entityId && !!userId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

/**
 * Hook pour récupérer toutes les progressions d'un type d'entité
 */
export function useProgressByType(
  entityType: EntityType | undefined,
  userId: string | undefined
) {
  return useQuery({
    queryKey: ['progress', 'type', entityType, userId],
    queryFn: () => ProgressService.getByUserId(userId!, entityType),
    enabled: !!entityType && !!userId,
    staleTime: 1000 * 60 * 5,
  });
}

/**
 * Hook pour enregistrer une nouvelle progression
 */
export function useRecordProgress() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: {
      entityId: string;
      entityType: EntityType;
      value: number;
      userId: string;
      note?: string;
    }) => ProgressService.record(data.entityId, data.entityType, data.value, data.userId, data.note),
    onSuccess: (_, variables) => {
      // Invalider les queries de progression pour cette entité
      queryClient.invalidateQueries({
        queryKey: ['progress', variables.entityId, variables.entityType],
      });
      // Invalider aussi les queries par type
      queryClient.invalidateQueries({
        queryKey: ['progress', 'type', variables.entityType],
      });
    },
  });
}

