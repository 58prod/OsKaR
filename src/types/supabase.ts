// Types générés pour Supabase (OskarDB)
// Ces types correspondent au schéma SQL défini dans supabase/schema.sql

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type TeamRole = 'OWNER' | 'ADMIN' | 'MEMBER' | 'VIEWER';
export type InvitationStatus = 'PENDING' | 'ACCEPTED' | 'DECLINED' | 'EXPIRED';
export type AmbitionCategory = 'GROWTH' | 'INNOVATION' | 'EFFICIENCY' | 'CUSTOMER' | 'TEAM' | 'FINANCIAL' | 'PRODUCT' | 'OTHER';
export type QuarterEnum = 'Q1' | 'Q2' | 'Q3' | 'Q4';
export type PriorityEnum = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type ActionStatus = 'TODO' | 'IN_PROGRESS' | 'DONE' | 'BLOCKED' | 'CANCELLED';
export type CommentEntityType = 'AMBITION' | 'KEY_RESULT' | 'OBJECTIVE' | 'ACTION';
export type NotificationType = 'TEAM_INVITATION' | 'MEMBER_JOINED' | 'OBJECTIVE_SHARED' | 'COMMENT_MENTION' | 'DEADLINE_APPROACHING' | 'PROGRESS_UPDATE' | 'ACHIEVEMENT';
export type SharePermission = 'VIEW' | 'EDIT';
export type SubscriptionPlanType = 'free' | 'pro' | 'team' | 'unlimited';
export type SubscriptionStatus = 'active' | 'cancelled' | 'expired' | 'trialing';

export interface Database {
  public: {
    Tables: {
      tool_sessions: {
        Row: {
          id: string;
          code: string;
          tool_type: string;
          host_id: string | null;
          state: Json;
          created_at: string;
          updated_at: string;
          expires_at: string;
        };
        Insert: {
          id?: string;
          code: string;
          tool_type: string;
          host_id?: string | null;
          state?: Json;
          created_at?: string;
          updated_at?: string;
          expires_at: string;
        };
        Update: {
          id?: string;
          code?: string;
          tool_type?: string;
          host_id?: string | null;
          state?: Json;
          created_at?: string;
          updated_at?: string;
          expires_at?: string;
        };
      };
      profiles: {
        Row: {
          id: string;
          email: string;
          name: string | null;
          company: string | null;
          role: string | null;
          avatar_url: string | null;
          company_profile: Json | null;
          settings: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          name?: string | null;
          company?: string | null;
          role?: string | null;
          avatar_url?: string | null;
          company_profile?: Json | null;
          settings?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          name?: string | null;
          company?: string | null;
          role?: string | null;
          avatar_url?: string | null;
          company_profile?: Json | null;
          settings?: Json;
          created_at?: string;
          updated_at?: string;
        };
      };
      teams: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          owner_id: string;
          settings: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          owner_id: string;
          settings?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string | null;
          owner_id?: string;
          settings?: Json;
          created_at?: string;
          updated_at?: string;
        };
      };
      team_members: {
        Row: {
          id: string;
          team_id: string;
          user_id: string;
          role: TeamRole;
          joined_at: string;
        };
        Insert: {
          id?: string;
          team_id: string;
          user_id: string;
          role?: TeamRole;
          joined_at?: string;
        };
        Update: {
          id?: string;
          team_id?: string;
          user_id?: string;
          role?: TeamRole;
          joined_at?: string;
        };
      };
      invitations: {
        Row: {
          id: string;
          team_id: string;
          email: string;
          role: TeamRole;
          invited_by: string;
          token: string;
          status: InvitationStatus;
          expires_at: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          team_id: string;
          email: string;
          role?: TeamRole;
          invited_by: string;
          token: string;
          status?: InvitationStatus;
          expires_at: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          team_id?: string;
          email?: string;
          role?: TeamRole;
          invited_by?: string;
          token?: string;
          status?: InvitationStatus;
          expires_at?: string;
          created_at?: string;
        };
      };
      ambitions: {
        Row: {
          id: string;
          user_id: string;
          team_id: string | null;
          title: string;
          description: string | null;
          category: AmbitionCategory;
          year: number;
          target_value: number | null;
          current_value: number;
          unit: string | null;
          color: string | null;
          order_index: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          team_id?: string | null;
          title: string;
          description?: string | null;
          category: AmbitionCategory;
          year: number;
          target_value?: number | null;
          current_value?: number;
          unit?: string | null;
          color?: string | null;
          order_index?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          team_id?: string | null;
          title?: string;
          description?: string | null;
          category?: AmbitionCategory;
          year?: number;
          target_value?: number | null;
          current_value?: number;
          unit?: string | null;
          color?: string | null;
          order_index?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      key_results: {
        Row: {
          id: string;
          ambition_id: string;
          title: string;
          description: string | null;
          target_value: number;
          current_value: number;
          unit: string | null;
          deadline: string | null;
          order_index: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          ambition_id: string;
          title: string;
          description?: string | null;
          target_value: number;
          current_value?: number;
          unit?: string | null;
          deadline?: string | null;
          order_index?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          ambition_id?: string;
          title?: string;
          description?: string | null;
          target_value?: number;
          current_value?: number;
          unit?: string | null;
          deadline?: string | null;
          order_index?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      quarterly_objectives: {
        Row: {
          id: string;
          user_id: string;
          team_id: string | null;
          ambition_id: string | null;
          title: string;
          description: string | null;
          quarter: QuarterEnum;
          year: number;
          priority: PriorityEnum;
          order_index: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          team_id?: string | null;
          ambition_id?: string | null;
          title: string;
          description?: string | null;
          quarter: QuarterEnum;
          year: number;
          priority?: PriorityEnum;
          order_index?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          team_id?: string | null;
          ambition_id?: string | null;
          title?: string;
          description?: string | null;
          quarter?: QuarterEnum;
          year?: number;
          priority?: PriorityEnum;
          order_index?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      quarterly_key_results: {
        Row: {
          id: string;
          objective_id: string;
          title: string;
          description: string | null;
          target_value: number;
          current_value: number;
          unit: string | null;
          deadline: string | null;
          order_index: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          objective_id: string;
          title: string;
          description?: string | null;
          target_value: number;
          current_value?: number;
          unit?: string | null;
          deadline?: string | null;
          order_index?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          objective_id?: string;
          title?: string;
          description?: string | null;
          target_value?: number;
          current_value?: number;
          unit?: string | null;
          deadline?: string | null;
          order_index?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      actions: {
        Row: {
          id: string;
          user_id: string;
          team_id: string | null;
          objective_id: string | null;
          key_result_id: string | null;
          title: string;
          description: string | null;
          status: ActionStatus;
          priority: PriorityEnum;
          deadline: string | null;
          assigned_to: string | null;
          order_index: number;
          metadata: Json;
          created_at: string;
          updated_at: string;
          completed_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          team_id?: string | null;
          objective_id?: string | null;
          key_result_id?: string | null;
          title: string;
          description?: string | null;
          status?: ActionStatus;
          priority?: PriorityEnum;
          deadline?: string | null;
          assigned_to?: string | null;
          order_index?: number;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
          completed_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          team_id?: string | null;
          objective_id?: string | null;
          key_result_id?: string | null;
          title?: string;
          description?: string | null;
          status?: ActionStatus;
          priority?: PriorityEnum;
          deadline?: string | null;
          assigned_to?: string | null;
          order_index?: number;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
          completed_at?: string | null;
        };
      };
      external_contacts: {
        Row: {
          id: string;
          company_id: string;
          first_name: string;
          last_name: string;
          email: string;
          created_by: string;
          created_at: string;
          updated_at: string;
          last_used_at: string | null;
        };
        Insert: {
          id?: string;
          company_id: string;
          first_name: string;
          last_name: string;
          email: string;
          created_by: string;
          created_at?: string;
          updated_at?: string;
          last_used_at?: string | null;
        };
        Update: {
          id?: string;
          company_id?: string;
          first_name?: string;
          last_name?: string;
          email?: string;
          created_by?: string;
          created_at?: string;
          updated_at?: string;
          last_used_at?: string | null;
        };
      };
      diagnostics: {
        Row: {
          id: string;
          user_id: string | null;
          email: string | null;
          scores: Json;
          responses: Json;
          accepte_recontact: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          email?: string | null;
          scores?: Json;
          responses?: Json;
          accepte_recontact?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          email?: string | null;
          scores?: Json;
          responses?: Json;
          accepte_recontact?: boolean;
          created_at?: string;
        };
      };
      action_assignees: {
        Row: {
          id: string;
          action_id: string;
          assignee_type: 'internal' | 'external';
          user_id: string | null;
          external_contact_id: string | null;
          assigned_at: string;
          assigned_by: string;
        };
        Insert: {
          id?: string;
          action_id: string;
          assignee_type: 'internal' | 'external';
          user_id?: string | null;
          external_contact_id?: string | null;
          assigned_at?: string;
          assigned_by: string;
        };
        Update: {
          id?: string;
          action_id?: string;
          assignee_type?: 'internal' | 'external';
          user_id?: string | null;
          external_contact_id?: string | null;
          assigned_at?: string;
          assigned_by?: string;
        };
      };
      subscription_plans: {
        Row: {
          id: string;
          plan_type: SubscriptionPlanType;
          display_name: string;
          description: string | null;
          price_monthly: number;
          price_yearly: number | null;
          max_users: number;
          max_ambitions: number;
          features: Json;
          stripe_price_id_monthly: string | null;
          stripe_price_id_yearly: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          plan_type: SubscriptionPlanType;
          display_name: string;
          description?: string | null;
          price_monthly?: number;
          price_yearly?: number | null;
          max_users?: number;
          max_ambitions?: number;
          features?: Json;
          stripe_price_id_monthly?: string | null;
          stripe_price_id_yearly?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          plan_type?: SubscriptionPlanType;
          display_name?: string;
          description?: string | null;
          price_monthly?: number;
          price_yearly?: number | null;
          max_users?: number;
          max_ambitions?: number;
          features?: Json;
          stripe_price_id_monthly?: string | null;
          stripe_price_id_yearly?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      subscriptions: {
        Row: {
          id: string;
          user_id: string;
          plan_type: SubscriptionPlanType;
          status: SubscriptionStatus;
          started_at: string;
          expires_at: string | null;
          cancelled_at: string | null;
          stripe_customer_id: string | null;
          stripe_subscription_id: string | null;
          stripe_price_id: string | null;
          billing_cycle: string | null;
          metadata: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          plan_type?: SubscriptionPlanType;
          status?: SubscriptionStatus;
          started_at?: string;
          expires_at?: string | null;
          cancelled_at?: string | null;
          stripe_customer_id?: string | null;
          stripe_subscription_id?: string | null;
          stripe_price_id?: string | null;
          billing_cycle?: string | null;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          plan_type?: SubscriptionPlanType;
          status?: SubscriptionStatus;
          started_at?: string;
          expires_at?: string | null;
          cancelled_at?: string | null;
          stripe_customer_id?: string | null;
          stripe_subscription_id?: string | null;
          stripe_price_id?: string | null;
          billing_cycle?: string | null;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      calculate_progress_percentage: {
        Args: {
          current_val: number;
          target_val: number;
        };
        Returns: number;
      };
    };
    Enums: {
      team_role: TeamRole;
      invitation_status: InvitationStatus;
      ambition_category: AmbitionCategory;
      quarter_enum: QuarterEnum;
      priority_enum: PriorityEnum;
      action_status: ActionStatus;
      comment_entity_type: CommentEntityType;
      notification_type: NotificationType;
      share_permission: SharePermission;
      subscription_plan_type: SubscriptionPlanType;
      subscription_status: SubscriptionStatus;
    };
  };
}

