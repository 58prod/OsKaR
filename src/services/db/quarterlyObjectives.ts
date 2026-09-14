import { supabase } from '@/lib/supabaseClient';
import type { Database } from '@/types/supabase';
import type { QuarterlyObjective, Quarter } from '@/types';
import { Status } from '@/types';

type QuarterlyObjectiveRow = Database['public']['Tables']['quarterly_objectives']['Row'];
type QuarterlyObjectiveInsert = Database['public']['Tables']['quarterly_objectives']['Insert'];

export class QuarterlyObjectivesService {
  private static rowToQuarterlyObjective(row: QuarterlyObjectiveRow): QuarterlyObjective {
    return {
      id: row.id,
      ambitionId: row.ambition_id || '',
      title: row.title,
      description: row.description || '',
      quarter: row.quarter as Quarter,
      year: row.year,
      keyResults: [],
      actions: [],
      status: Status.ACTIVE,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    };
  }

  private static quarterlyObjectiveToInsert(qo: Partial<QuarterlyObjective>, userId: string): QuarterlyObjectiveInsert {
    return {
      user_id: userId,
      ambition_id: qo.ambitionId || null,
      title: qo.title || '',
      description: qo.description || null,
      quarter: qo.quarter || 'Q1',
      year: qo.year || new Date().getFullYear(),
      order_index: 0,
    };
  }

  static async create(qo: Partial<QuarterlyObjective>, userId: string): Promise<QuarterlyObjective> {
    const id = crypto.randomUUID();
    const insertData = this.quarterlyObjectiveToInsert(qo, userId);

    const { data, error } = await (supabase as any)
      .from('quarterly_objectives')
      .insert({ id, ...insertData })
      .select()
      .single();

    if (error) {
      if ((error as any).code === '23505') {
        const { data: existing, error: selErr } = await supabase
          .from('quarterly_objectives')
          .select('*')
          .eq('id', id)
          .single();
        if (selErr) throw selErr;
        return this.rowToQuarterlyObjective(existing);
      }
      throw error;
    }

    return this.rowToQuarterlyObjective(data);
  }

  static async getAll(userId: string, filters?: { quarter?: Quarter; year?: number; ambitionId?: string }): Promise<QuarterlyObjective[]> {
    let query = supabase
      .from('quarterly_objectives')
      .select('*')
      .eq('user_id', userId);

    if (filters?.quarter) {
      query = query.eq('quarter', filters.quarter);
    }
    if (filters?.year) {
      query = query.eq('year', filters.year);
    }
    if (filters?.ambitionId) {
      query = query.eq('ambition_id', filters.ambitionId);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []).map((row: any) => this.rowToQuarterlyObjective(row));
  }

  static async getById(id: string): Promise<QuarterlyObjective | null> {
    const { data, error } = await supabase
      .from('quarterly_objectives')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if ((error as any).code === 'PGRST116') return null;
      throw error;
    }

    return this.rowToQuarterlyObjective(data);
  }

  static async getByAmbitionId(ambitionId: string, userId: string): Promise<QuarterlyObjective[]> {
    const { data, error } = await supabase
      .from('quarterly_objectives')
      .select('*')
      .eq('ambition_id', ambitionId)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []).map((row: any) => this.rowToQuarterlyObjective(row));
  }

  static async update(id: string, updates: Partial<QuarterlyObjective>): Promise<QuarterlyObjective> {
    const updateData: any = {};
    if (updates.title !== undefined) updateData.title = updates.title;
    if (updates.description !== undefined) updateData.description = updates.description;
    if (updates.quarter !== undefined) updateData.quarter = updates.quarter;
    if (updates.year !== undefined) updateData.year = updates.year;

    const { data, error } = await (supabase as any)
      .from('quarterly_objectives')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return this.rowToQuarterlyObjective(data);
  }

  static async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('quarterly_objectives')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }
}
