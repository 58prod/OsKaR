import { supabase } from '@/lib/supabaseClient';
import type { Database } from '@/types/supabase';
import type { ActionAssignee, ActionAssigneeFormData } from '@/types';

type ActionAssigneeRow = Database['public']['Tables']['action_assignees']['Row'];
type ActionAssigneeInsert = Database['public']['Tables']['action_assignees']['Insert'];

/**
 * Service de gestion des affectations d'actions
 */
export class ActionAssigneesService {
    /**
     * Convertir une row Supabase en ActionAssignee
     */
    private static rowToAssignee(row: ActionAssigneeRow, joinedData?: any): ActionAssignee {
        return {
            id: row.id,
            actionId: row.action_id,
            assigneeType: row.assignee_type as 'internal' | 'external',
            userId: row.user_id || undefined,
            externalContactId: row.external_contact_id || undefined,
            assignedAt: new Date(row.assigned_at),
            assignedBy: row.assigned_by,
            // Données jointes
            userName: joinedData?.userName,
            userEmail: joinedData?.userEmail,
            externalContact: joinedData?.externalContact,
        };
    }

    /**
     * Récupérer tous les assignés d'une action
     */
    static async getByAction(actionId: string): Promise<ActionAssignee[]> {
        // Requête avec JOIN pour récupérer les données complètes
        const { data, error } = await supabase
            .from('action_assignees')
            .select(`
        *,
        profiles:user_id (name, email),
        external_contacts:external_contact_id (id, first_name, last_name, email, company_id)
      `)
            .eq('action_id', actionId);

        if (error) {
            console.error('❌ Erreur lors de la récupération des assignés:', error);
            throw error;
        }

        return (data || []).map((row: any) => {
            const joinedData: any = {};

            if (row.assignee_type === 'internal' && row.profiles) {
                const profile = row.profiles;
                joinedData.userName = profile.name;
                joinedData.userEmail = profile.email;
            }

            if (row.assignee_type === 'external' && row.external_contacts) {
                const contact = row.external_contacts;
                joinedData.externalContact = {
                    id: contact.id,
                    companyId: contact.company_id,
                    firstName: contact.first_name,
                    lastName: contact.last_name,
                    email: contact.email,
                    createdBy: '',
                    createdAt: new Date(),
                    updatedAt: new Date(),
                };
            }

            return this.rowToAssignee(row, joinedData);
        });
    }

    /**
     * Affecter une action à un utilisateur interne
     */
    static async assignToUser(
        actionId: string,
        userId: string,
        assignedBy: string
    ): Promise<ActionAssignee> {
        const insertData: ActionAssigneeInsert = {
            action_id: actionId,
            assignee_type: 'internal',
            user_id: userId,
            external_contact_id: null,
            assigned_by: assignedBy,
        };

        const { data, error } = await supabase
            .from('action_assignees')
            .insert(insertData)
            .select()
            .single();

        if (error) {
            if (error.code === '23505') {
                throw new Error('Cet utilisateur est déjà assigné à cette action');
            }
            console.error('❌ Erreur lors de l\'affectation à un utilisateur:', error);
            throw error;
        }

        return this.rowToAssignee(data);
    }

    /**
     * Affecter une action à un contact externe
     */
    static async assignToExternalContact(
        actionId: string,
        externalContactId: string,
        assignedBy: string
    ): Promise<ActionAssignee> {
        const insertData: ActionAssigneeInsert = {
            action_id: actionId,
            assignee_type: 'external',
            user_id: null,
            external_contact_id: externalContactId,
            assigned_by: assignedBy,
        };

        const { data, error } = await supabase
            .from('action_assignees')
            .insert(insertData)
            .select()
            .single();

        if (error) {
            if (error.code === '23505') {
                throw new Error('Ce contact est déjà assigné à cette action');
            }
            console.error('❌ Erreur lors de l\'affectation à un contact externe:', error);
            throw error;
        }

        return this.rowToAssignee(data);
    }

    /**
     * Affecter plusieurs personnes à une action en une fois
     */
    static async assignMultiple(
        actionId: string,
        assignees: ActionAssigneeFormData[],
        assignedBy: string
    ): Promise<ActionAssignee[]> {
        const insertData: ActionAssigneeInsert[] = assignees.map(assignee => ({
            action_id: actionId,
            assignee_type: assignee.type,
            user_id: assignee.type === 'internal' ? assignee.userId! : null,
            external_contact_id: assignee.type === 'external' ? assignee.externalContactId! : null,
            assigned_by: assignedBy,
        }));

        const { data, error } = await supabase
            .from('action_assignees')
            .insert(insertData)
            .select();

        if (error) {
            console.error('❌ Erreur lors de l\'affectation multiple:', error);
            throw error;
        }

        return (data || []).map((row: ActionAssigneeRow) => this.rowToAssignee(row));
    }

    /**
     * Retirer une affectation
     */
    static async unassign(assigneeId: string): Promise<void> {
        const { error } = await supabase
            .from('action_assignees')
            .delete()
            .eq('id', assigneeId);

        if (error) {
            console.error('❌ Erreur lors du retrait de l\'affectation:', error);
            throw error;
        }
    }

    /**
     * Remplacer toutes les affectations d'une action
     */
    static async replaceAll(
        actionId: string,
        newAssignees: ActionAssigneeFormData[],
        assignedBy: string
    ): Promise<ActionAssignee[]> {
        // 1. Supprimer toutes les affectations existantes
        const { error: deleteError } = await supabase
            .from('action_assignees')
            .delete()
            .eq('action_id', actionId);

        if (deleteError) {
            console.error('❌ Erreur lors de la suppression des affectations:', deleteError);
            throw deleteError;
        }

        // 2. Créer les nouvelles affectations
        if (newAssignees.length === 0) {
            return [];
        }

        return this.assignMultiple(actionId, newAssignees, assignedBy);
    }

    /**
     * Récupérer toutes les actions assignées à un utilisateur
     */
    static async getActionsByUser(userId: string): Promise<string[]> {
        const { data, error } = await supabase
            .from('action_assignees')
            .select('action_id')
            .eq('assignee_type', 'internal')
            .eq('user_id', userId);

        if (error) {
            console.error('❌ Erreur lors de la récupération des actions par utilisateur:', error);
            throw error;
        }

        return (data || []).map((row: { action_id: string }) => row.action_id);
    }
}
