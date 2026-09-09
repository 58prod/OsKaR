import { supabase } from '@/lib/supabaseClient';
import type { Database } from '@/types/supabase';
import type { Action, ActionStatus } from '@/types';
import { priorityToDb, priorityFromDb, actionStatusToDb, actionStatusFromDb } from './enumConverters';

type ActionRow = Database['public']['Tables']['actions']['Row'];
type ActionInsert = Database['public']['Tables']['actions']['Insert'];
type ActionUpdate = Database['public']['Tables']['actions']['Update'];

/**
 * Service de gestion des Actions dans Supabase (Kanban)
 */
export class ActionsService {
  /**
   * Convertir une row Supabase en Action de l'app
   */
  private static rowToAction(row: any): Action {
    const metadata = row.metadata as any || {};

    // Mapper les assignés
    const assignees = row.action_assignees?.map((aa: any) => ({
      id: aa.id,
      actionId: aa.action_id,
      assigneeType: aa.assignee_type,
      userId: aa.user_id,
      externalContactId: aa.external_contact_id,
      assignedAt: new Date(aa.assigned_at),
      assignedBy: aa.assigned_by,
      // Données jointes
      userName: aa.profiles?.name,
      userEmail: aa.profiles?.email,
      externalContact: aa.external_contacts ? {
        id: aa.external_contacts.id,
        companyId: aa.external_contacts.company_id,
        firstName: aa.external_contacts.first_name,
        lastName: aa.external_contacts.last_name,
        email: aa.external_contacts.email,
        createdBy: aa.external_contacts.created_by,
        createdAt: new Date(aa.external_contacts.created_at),
        updatedAt: new Date(aa.external_contacts.updated_at),
        lastUsedAt: aa.external_contacts.last_used_at ? new Date(aa.external_contacts.last_used_at) : undefined,
      } : undefined,
    })) || [];

    return {
      id: row.id,
      title: row.title,
      description: row.description || undefined,
      quarterlyKeyResultId: row.key_result_id || '',
      status: actionStatusFromDb(row.status),
      priority: priorityFromDb(row.priority) as any,
      labels: metadata.labels || [],
      deadline: row.deadline ? new Date(row.deadline) : undefined,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
      completedAt: row.completed_at ? new Date(row.completed_at) : undefined,
      order_index: row.order_index ?? 0,
      assignees,
    };
  }

  /**
   * Convertir une Action de l'app en Insert Supabase
   */
  private static actionToInsert(action: Partial<Action>, userId: string): ActionInsert {
    return {
      user_id: userId,
      key_result_id: action.quarterlyKeyResultId || null,
      title: action.title || '',
      description: action.description || null,
      status: actionStatusToDb(action.status || 'TODO'),
      priority: priorityToDb(action.priority || 'medium'),
      deadline: action.deadline ? (typeof action.deadline === 'string' ? action.deadline : action.deadline.toISOString()) : null,
      metadata: { labels: action.labels || [] },
      order_index: 0,
    };
  }

  /**
   * Créer une nouvelle action
   */
  static async create(action: Partial<Action>, userId: string): Promise<Action> {
    const insertData = this.actionToInsert(action, userId);

    const id = crypto.randomUUID();
    const row: any = { id, ...insertData };

    const { data, error } = await supabase
      .from('actions')
      .insert(row)
      .select()
      .single();

    if (error) {
      if ((error as any).code === '23505') {
        const { data: existing, error: selErr } = await supabase
          .from('actions')
          .select('*')
          .eq('id', id)
          .single();
        if (selErr) throw selErr;
        return this.rowToAction(existing!);
      }
      console.error('❌ Erreur lors de la création de l\'action:', error);
      throw error;
    }

    return this.rowToAction(data!);
  }

  /**
   * Récupérer toutes les actions de l'utilisateur
   */
  static async getAll(userId: string, status?: ActionStatus): Promise<Action[]> {
    let query = supabase
      .from('actions')
      .select(`
        *,
        action_assignees (
          id,
          action_id,
          assignee_type,
          user_id,
          external_contact_id,
          assigned_at,
          assigned_by,
          profiles:user_id (
            name,
            email
          ),
          external_contacts:external_contact_id (
            id,
            company_id,
            first_name,
            last_name,
            email,
            created_by,
            created_at,
            updated_at,
            last_used_at
          )
        )
      `)
      .eq('user_id', userId)
      .order('order_index', { ascending: true });

    if (status) {
      query = query.eq('status', actionStatusToDb(status));
    }

    const { data, error } = await query;

    if (error) {
      console.error('❌ Erreur lors de la récupération des actions:', error);
      throw error;
    }

    return (data || []).map((row: any) => this.rowToAction(row));
  }

  /**
   * Récupérer les actions d'un Key Result trimestriel
   */
  static async getByKeyResultId(keyResultId: string, userId: string): Promise<Action[]> {
    const { data, error } = await supabase
      .from('actions')
      .select('*')
      .eq('user_id', userId)
      .eq('key_result_id', keyResultId)
      .order('order_index', { ascending: true });

    if (error) {
      console.error('❌ Erreur lors de la récupération des actions par KR:', error);
      throw error;
    }

    return (data || []).map((row: any) => this.rowToAction(row));
  }

  /**
   * Récupérer une action par son ID
   */
  static async getById(id: string, userId: string): Promise<Action | null> {
    const { data, error } = await supabase
      .from('actions')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      console.error('❌ Erreur lors de la récupération de l\'action:', error);
      throw error;
    }

    if (!data) return null;
    return this.rowToAction(data);
  }

  /**
   * Mettre à jour une action
   */
  static async update(id: string, updates: Partial<Action>, userId: string): Promise<Action> {
    const updateData: ActionUpdate = {};

    if (updates.title !== undefined) updateData.title = updates.title;
    if (updates.description !== undefined) updateData.description = updates.description || null;
    if (updates.status !== undefined) updateData.status = actionStatusToDb(updates.status);
    if (updates.priority !== undefined) updateData.priority = priorityToDb(updates.priority);
    if (updates.deadline !== undefined) {
      updateData.deadline = updates.deadline
        ? (typeof updates.deadline === 'string' ? updates.deadline : updates.deadline.toISOString())
        : null;
    }
    if (updates.labels !== undefined) updateData.metadata = { labels: updates.labels };
    if (updates.quarterlyKeyResultId !== undefined) updateData.key_result_id = updates.quarterlyKeyResultId || null;

    // Si le statut passe à DONE, enregistrer la date de complétion
    if (updates.status && (typeof updates.status === 'string' ? updates.status.toUpperCase() : String(updates.status).toUpperCase()) === 'DONE') {
      updateData.completed_at = new Date().toISOString();
    }

    const result = await (supabase as any)
      .from('actions')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single();

    const { data, error } = result;

    if (error) {
      console.error('❌ Erreur lors de la mise à jour de l\'action:', error);
      throw error;
    }

    console.log('✅ Action mise à jour:', data.id);
    return this.rowToAction(data);
  }

  /**
   * Changer le statut d'une action (Kanban)
   */
  static async updateStatus(id: string, status: ActionStatus, userId: string): Promise<Action> {
    console.log('🚀 ActionsService.updateStatus - Début:', { id, status, userId });

    const updateData: ActionUpdate = { status: actionStatusToDb(status) };

    if ((typeof status === 'string' ? status.toUpperCase() : String(status).toUpperCase()) === 'DONE') {
      updateData.completed_at = new Date().toISOString();
    }

    console.log('📝 ActionsService.updateStatus - Données à mettre à jour:', updateData);

    const result = await (supabase as any)
      .from('actions')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single();

    const { data, error } = result;

    if (error) {
      console.error('❌ ActionsService.updateStatus - Erreur Supabase:', {
        error,
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint
      });
      throw error;
    }

    console.log('✅ ActionsService.updateStatus - Succès:', data);
    return this.rowToAction(data);
  }

  /**
   * Supprimer une action
   */
  static async delete(id: string, userId: string): Promise<void> {
    const { error } = await supabase
      .from('actions')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (error) {
      console.error('❌ Erreur lors de la suppression de l\'action:', error);
      throw error;
    }
  }

  /**
   * Mettre à jour l'ordre des actions (drag & drop Kanban)
   */
  static async updateOrder(actions: { id: string; order_index: number }[], userId: string): Promise<void> {
    console.log('🚀 ActionsService.updateOrder - Début:', {
      actionsCount: actions.length,
      actions,
      userId
    });

    const updates = actions.map(({ id, order_index }) =>
      (supabase as any)
        .from('actions')
        .update({ order_index })
        .eq('id', id)
        .eq('user_id', userId)
    );

    const results = await Promise.all(updates);
    const errors = results.filter((r: any) => r.error);

    if (errors.length > 0) {
      console.error('❌ ActionsService.updateOrder - Erreurs Supabase:', {
        errorsCount: errors.length,
        errors: errors.map((r: any) => ({
          error: r.error,
          code: r.error?.code,
          message: r.error?.message,
          details: r.error?.details
        }))
      });
      throw new Error('Erreur lors de la mise à jour de l\'ordre des actions');
    }

    console.log('✅ ActionsService.updateOrder - Succès');
  }

  /**
   * Déplacer une action (changement de statut + position)
   * Opération atomique pour éviter les conflits lors du drag & drop
   */
  static async moveAction(
    actionId: string,
    newStatus: ActionStatus,
    orderUpdates: { id: string; order_index: number }[],
    userId: string
  ): Promise<Action> {
    console.log('🚀 ActionsService.moveAction - Début:', {
      actionId,
      newStatus,
      orderUpdatesCount: orderUpdates.length,
      userId
    });

    try {
      // 1. Mettre à jour le statut de l'action déplacée
      console.log('📝 ActionsService.moveAction - Mise à jour du statut...');
      const statusUpdate = await this.updateStatus(actionId, newStatus, userId);
      console.log('✅ ActionsService.moveAction - Statut mis à jour:', statusUpdate);

      // 2. Mettre à jour les order_index de toutes les actions concernées
      if (orderUpdates.length > 0) {
        console.log('📝 ActionsService.moveAction - Mise à jour des order_index...', orderUpdates);
        await this.updateOrder(orderUpdates, userId);
        console.log('✅ ActionsService.moveAction - Order_index mis à jour');
      }

      console.log('✅ ActionsService.moveAction - Terminé avec succès');
      return statusUpdate;
    } catch (error) {
      console.error('❌ ActionsService.moveAction - Erreur:', error);
      throw error;
    }
  }

  /**
   * Récupérer les actions par statut (pour le Kanban)
   */
  static async getByStatus(userId: string): Promise<Record<ActionStatus, Action[]>> {
    const { data, error } = await supabase
      .from('actions')
      .select('*')
      .eq('user_id', userId)
      .order('order_index', { ascending: true });

    if (error) {
      console.error('❌ Erreur lors de la récupération des actions par statut:', error);
      throw error;
    }

    const actions = (data || []).map((row: any) => this.rowToAction(row));

    return {
      todo: actions.filter((a: Action) => a.status === 'todo'),
      in_progress: actions.filter((a: Action) => a.status === 'in_progress'),
      done: actions.filter((a: Action) => a.status === 'done'),
    } as Record<ActionStatus, Action[]>;
  }
}

