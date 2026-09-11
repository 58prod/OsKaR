import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAppStore } from '@/store/useAppStore';
import { AdminService } from '@/services/db/admin';
import type { StatutCandidature } from '@/lib/admin/types';

/*
 * Données de l'administration. Chaque requête ne part que pour un
 * administrateur : `useEstAdmin` d'abord, le reste ensuite.
 */

/** L'utilisateur connecté est-il administrateur ? */
export function useEstAdmin() {
  const { user, authReady, isAuthenticated } = useAppStore();
  const actif = authReady && isAuthenticated && !!user?.id;
  const q = useQuery({
    queryKey: ['admin', 'est-admin', user?.id],
    queryFn: () => AdminService.estAdmin(),
    enabled: actif,
    staleTime: 10 * 60 * 1000,
  });
  return {
    estAdmin: actif && q.data === true,
    /** Vrai tant qu'on ne sait pas encore répondre. */
    enCours: !authReady || (actif && q.isLoading),
  };
}

export function useComptesAdmin(actif: boolean) {
  return useQuery({
    queryKey: ['admin', 'comptes'],
    queryFn: () => AdminService.comptes(),
    enabled: actif,
    staleTime: 60 * 1000,
  });
}

export function useFicheCompte(userId: string | null) {
  return useQuery({
    queryKey: ['admin', 'fiche', userId],
    queryFn: () => AdminService.fiche(userId as string),
    enabled: !!userId,
    staleTime: 60 * 1000,
  });
}

export function useBilansAdmin(actif: boolean) {
  return useQuery({
    queryKey: ['admin', 'bilans'],
    queryFn: () => AdminService.bilans(),
    enabled: actif,
    staleTime: 60 * 1000,
  });
}

export function useCandidaturesAdmin(actif: boolean) {
  return useQuery({
    queryKey: ['admin', 'candidatures'],
    queryFn: () => AdminService.candidatures(),
    enabled: actif,
    staleTime: 60 * 1000,
  });
}

export function useMajCandidature() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, statut, notes }: { id: string; statut: StatutCandidature; notes: string }) =>
      AdminService.majCandidature(id, statut, notes),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'candidatures'] }),
  });
}

export function useOffrirFormule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, jusquAu, motif }: { userId: string; jusquAu: string; motif: string }) =>
      AdminService.offrirFormule(userId, jusquAu, motif),
    onSuccess: (_d, { userId }) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'comptes'] });
      queryClient.invalidateQueries({ queryKey: ['subscription', userId] });
    },
  });
}

export function useRetirerFormule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) => AdminService.retirerFormule(userId),
    onSuccess: (_d, userId) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'comptes'] });
      queryClient.invalidateQueries({ queryKey: ['subscription', userId] });
    },
  });
}
