import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { DiagnosticsService, type DiagnosticPayload } from '@/services/db/diagnostics';

/**
 * Hook pour récupérer tous les diagnostics d'un utilisateur.
 */
export function useDiagnostics(userId: string | undefined) {
  return useQuery({
    queryKey: ['diagnostics', userId],
    queryFn: () => DiagnosticsService.getByUser(userId!),
    enabled: !!userId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

/**
 * Hook pour récupérer le dernier diagnostic d'un utilisateur.
 */
export function useLatestDiagnostic(userId: string | undefined) {
  return useQuery({
    queryKey: ['diagnostics', 'latest', userId],
    queryFn: () => DiagnosticsService.getLatestByUser(userId!),
    enabled: !!userId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

/**
 * Hook pour enregistrer un diagnostic.
 */
export function useCreateDiagnostic() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: DiagnosticPayload) => DiagnosticsService.create(payload),
    onSuccess: (record) => {
      if (record.userId) {
        queryClient.invalidateQueries({ queryKey: ['diagnostics', record.userId] });
        queryClient.invalidateQueries({ queryKey: ['diagnostics', 'latest', record.userId] });
      }
    },
    onError: (error) => {
      console.error('❌ Erreur enregistrement diagnostic:', error);
    },
  });
}

/**
 * Hook pour supprimer un diagnostic.
 */
export function useDeleteDiagnostic() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (diagnosticId: string) => DiagnosticsService.delete(diagnosticId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['diagnostics'] });
    },
  });
}
