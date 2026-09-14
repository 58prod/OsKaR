import { supabase } from '@/lib/supabaseClient';
import type { Database } from '@/types/supabase';
import type { ExternalContact, ExternalContactFormData } from '@/types';

type ExternalContactRow = Database['public']['Tables']['external_contacts']['Row'];
type ExternalContactInsert = Database['public']['Tables']['external_contacts']['Insert'];
type ExternalContactUpdate = Database['public']['Tables']['external_contacts']['Update'];

/**
 * Service de gestion des contacts externes (partagés au niveau entreprise)
 */
export class ExternalContactsService {
    /**
     * Convertir une row Supabase en ExternalContact
     */
    private static rowToContact(row: ExternalContactRow): ExternalContact {
        return {
            id: row.id,
            companyId: row.company_id,
            firstName: row.first_name,
            lastName: row.last_name,
            email: row.email,
            createdBy: row.created_by,
            createdAt: new Date(row.created_at),
            updatedAt: new Date(row.updated_at),
            lastUsedAt: row.last_used_at ? new Date(row.last_used_at) : undefined,
        };
    }

    /**
     * Récupérer tous les contacts externes de l'entreprise
     */
    static async getByCompany(companyId: string): Promise<ExternalContact[]> {
        const { data, error } = await supabase
            .from('external_contacts')
            .select('*')
            .eq('company_id', companyId)
            .order('last_used_at', { ascending: false, nullsFirst: false })
            .order('last_name', { ascending: true });

        if (error) {
            console.error('❌ Erreur lors de la récupération des contacts:', error);
            throw error;
        }

        return (data || []).map((row: ExternalContactRow) => this.rowToContact(row));
    }

    /**
     * Rechercher des contacts par nom ou email
     */
    static async search(companyId: string, query: string): Promise<ExternalContact[]> {
        const searchTerm = `%${query}%`;

        const { data, error } = await supabase
            .from('external_contacts')
            .select('*')
            .eq('company_id', companyId)
            .or(`first_name.ilike.${searchTerm},last_name.ilike.${searchTerm},email.ilike.${searchTerm}`)
            .order('last_used_at', { ascending: false, nullsFirst: false })
            .limit(10);

        if (error) {
            console.error('❌ Erreur lors de la recherche de contacts:', error);
            throw error;
        }

        return (data || []).map((row: ExternalContactRow) => this.rowToContact(row));
    }

    /**
     * Créer un nouveau contact externe
     */
    static async create(
        contact: ExternalContactFormData,
        companyId: string,
        userId: string
    ): Promise<ExternalContact> {
        const insertData: ExternalContactInsert = {
            company_id: companyId,
            first_name: contact.firstName,
            last_name: contact.lastName,
            email: contact.email.toLowerCase(),
            created_by: userId,
        };

        const { data, error } = await supabase
            .from('external_contacts')
            .insert(insertData)
            .select()
            .single();

        if (error) {
            // Gérer l'erreur de doublon d'email
            if (error.code === '23505') {
                throw new Error(`Un contact avec l'email ${contact.email} existe déjà dans votre entreprise`);
            }
            console.error('❌ Erreur lors de la création du contact:', error);
            throw error;
        }

        return this.rowToContact(data);
    }

    /**
     * Mettre à jour un contact externe
     */
    static async update(
        contactId: string,
        updates: Partial<ExternalContactFormData>
    ): Promise<ExternalContact> {
        const updateData: ExternalContactUpdate = {};

        if (updates.firstName) updateData.first_name = updates.firstName;
        if (updates.lastName) updateData.last_name = updates.lastName;
        if (updates.email) updateData.email = updates.email.toLowerCase();

        const { data, error } = await supabase
            .from('external_contacts')
            .update(updateData)
            .eq('id', contactId)
            .select()
            .single();

        if (error) {
            console.error('❌ Erreur lors de la mise à jour du contact:', error);
            throw error;
        }

        return this.rowToContact(data);
    }

    /**
     * Supprimer un contact externe
     */
    static async delete(contactId: string): Promise<void> {
        const { error } = await supabase
            .from('external_contacts')
            .delete()
            .eq('id', contactId);

        if (error) {
            console.error('❌ Erreur lors de la suppression du contact:', error);
            throw error;
        }
    }

    /**
     * Marquer un contact comme récemment utilisé
     */
    static async markAsUsed(contactId: string): Promise<void> {
        const { error } = await supabase
            .from('external_contacts')
            .update({ last_used_at: new Date().toISOString() })
            .eq('id', contactId);

        if (error) {
            console.error('❌ Erreur lors de la mise à jour de last_used_at:', error);
            // Ne pas throw, c'est pas critique
        }
    }

    /**
     * Récupérer un contact par email (pour éviter les doublons)
     */
    static async getByEmail(companyId: string, email: string): Promise<ExternalContact | null> {
        const { data, error } = await supabase
            .from('external_contacts')
            .select('*')
            .eq('company_id', companyId)
            .eq('email', email.toLowerCase())
            .single();

        if (error) {
            if (error.code === 'PGRST116') {
                return null; // Pas trouvé
            }
            console.error('❌ Erreur lors de la récupération du contact par email:', error);
            throw error;
        }

        return this.rowToContact(data);
    }
}
