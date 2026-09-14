import { supabase } from '@/lib/supabaseClient';
import type { Database } from '@/types/supabase';
import type { TeamMember } from '@/types';
import { TeamRole } from '@/types';

type TeamMemberInsert = Database['public']['Tables']['team_members']['Insert'];

const roleToDb = (role: TeamRole): string => {
  const mapping: Record<TeamRole, string> = {
    [TeamRole.OWNER]: 'OWNER',
    [TeamRole.ADMIN]: 'ADMIN',
    [TeamRole.MEMBER]: 'MEMBER',
    [TeamRole.VIEWER]: 'VIEWER',
  };
  return mapping[role];
};

const roleFromDb = (role: string): TeamRole => {
  const mapping: Record<string, TeamRole> = {
    OWNER: TeamRole.OWNER,
    ADMIN: TeamRole.ADMIN,
    MEMBER: TeamRole.MEMBER,
    VIEWER: TeamRole.VIEWER,
  };
  return mapping[role] || TeamRole.MEMBER;
};

export class TeamMembersService {
  private static rowToTeamMember(row: any): TeamMember {
    return {
      id: row.id,
      teamId: row.team_id,
      userId: row.user_id,
      role: roleFromDb(row.role as string),
      joinedAt: new Date(row.joined_at),
      // Informations utilisateur (si JOIN avec profiles)
      userEmail: row.profiles?.email || row.user_email,
      userName: row.profiles?.name || row.user_name,
      userAvatarUrl: row.profiles?.avatar_url || row.user_avatar_url,
    };
  }

  private static teamMemberToInsert(member: Partial<TeamMember>): TeamMemberInsert {
    return {
      team_id: member.teamId || '',
      user_id: member.userId || '',
      role: roleToDb(member.role || TeamRole.MEMBER) as any,
    };
  }

  static async create(member: Partial<TeamMember>): Promise<TeamMember> {
    const id = crypto.randomUUID();
    const insertData = this.teamMemberToInsert(member);

    const { data, error } = await (supabase as any)
      .from('team_members')
      .insert({ id, ...insertData })
      .select()
      .single();

    if (error) {
      if ((error as any).code === '23505') {
        const { data: existing, error: selErr } = await supabase
          .from('team_members')
          .select('*')
          .eq('id', id)
          .single();
        if (selErr) throw selErr;
        return this.rowToTeamMember(existing);
      }
      throw error;
    }

    return this.rowToTeamMember(data);
  }

  static async getByTeamId(teamId: string): Promise<TeamMember[]> {
    const { data, error } = await supabase
      .from('team_members')
      .select(`
        *,
        profiles:user_id (
          email,
          name,
          avatar_url
        )
      `)
      .eq('team_id', teamId)
      .order('joined_at', { ascending: true });

    if (error) throw error;
    return (data || []).map((row: any) => this.rowToTeamMember(row));
  }

  static async getByUserId(userId: string): Promise<TeamMember[]> {
    const { data, error } = await supabase
      .from('team_members')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []).map((row: any) => this.rowToTeamMember(row));
  }

  static async updateRole(id: string, role: TeamRole): Promise<TeamMember> {
    const { data, error } = await (supabase as any)
      .from('team_members')
      .update({ role: roleToDb(role) })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return this.rowToTeamMember(data);
  }

  static async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('team_members')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  static async add(member: Partial<TeamMember>): Promise<TeamMember> {
    return this.create(member);
  }
}
