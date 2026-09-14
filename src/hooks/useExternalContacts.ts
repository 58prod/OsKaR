import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ExternalContactsService } from '@/services/db/externalContacts';
import type { ExternalContactFormData } from '@/types';

/**
 * Hook pour récupérer tous les contacts externes de l'entreprise
 */
export function useExternalContacts(companyId: string | undefined) {
    return useQuery({
        queryKey: ['externalContacts', companyId],
        queryFn: () => ExternalContactsService.getByCompany(companyId!),
        enabled: !!companyId,
        staleTime: 1000 * 60 * 5, // 5 minutes
    });
}

/**
 * Hook pour rechercher des contacts externes
 */
export function useSearchExternalContacts(companyId: string | undefined, query: string) {
    return useQuery({
        queryKey: ['externalContacts', 'search', companyId, query],
        queryFn: () => ExternalContactsService.search(companyId!, query),
        enabled: !!companyId && query.length >= 2, // Au moins 2 caractères pour rechercher
        staleTime: 1000 * 30, // 30 secondes
    });
}

/**
 * Hook pour créer un contact externe
 */
export function useCreateExternalContact() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: {
            contact: ExternalContactFormData;
            companyId: string;
            userId: string;
        }) => ExternalContactsService.create(data.contact, data.companyId, data.userId),
        onSuccess: (newContact) => {
            // Invalider la liste des contacts
            queryClient.invalidateQueries({ queryKey: ['externalContacts', newContact.companyId] });
        },
        onError: (error) => {
            console.error('❌ Erreur création contact externe:', error);
        },
    });
}

/**
 * Hook pour mettre à jour un contact externe
 */
export function useUpdateExternalContact() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: {
            contactId: string;
            updates: Partial<ExternalContactFormData>;
        }) => ExternalContactsService.update(data.contactId, data.updates),
        onSuccess: (updatedContact) => {
            // Invalider la liste des contacts
            queryClient.invalidateQueries({ queryKey: ['externalContacts', updatedContact.companyId] });
        },
    });
}

/**
 * Hook pour supprimer un contact externe
 */
export function useDeleteExternalContact() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (contactId: string) => ExternalContactsService.delete(contactId),
        onSuccess: () => {
            // Invalider toutes les requêtes de contacts
            queryClient.invalidateQueries({ queryKey: ['externalContacts'] });
        },
    });
}

/**
 * Hook pour marquer un contact comme récemment utilisé
 */
export function useMarkContactAsUsed() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (contactId: string) => ExternalContactsService.markAsUsed(contactId),
        onSuccess: () => {
            // Invalider pour rafraîchir l'ordre (tri par last_used_at)
            queryClient.invalidateQueries({ queryKey: ['externalContacts'] });
        },
    });
}

/**
 * Hook pour vérifier si un email existe déjà
 */
export function useCheckEmailExists(companyId: string | undefined, email: string) {
    return useQuery({
        queryKey: ['externalContacts', 'checkEmail', companyId, email],
        queryFn: () => ExternalContactsService.getByEmail(companyId!, email),
        enabled: !!companyId && !!email && email.includes('@'),
        staleTime: 0, // Toujours frais pour la validation
    });
}
