/**
 * Service de gestion des abonnements (Subscriptions)
 * Gère les plans Free, Pro, Team, Unlimited
 */

import { supabase } from '@/lib/supabaseClient';
import { supabaseRead } from '@/lib/supabaseHelpers';
import type { Database } from '@/types/supabase';
import type { Subscription, SubscriptionPlan, SubscriptionUsage } from '@/types';

type SubscriptionRow = Database['public']['Tables']['subscriptions']['Row'];
type SubscriptionUpdate = Database['public']['Tables']['subscriptions']['Update'];
type SubscriptionPlanRow = Database['public']['Tables']['subscription_plans']['Row'];

/**
 * Convertir une row Supabase en Subscription
 */
function rowToSubscription(row: SubscriptionRow & { subscription_plans?: SubscriptionPlanRow }): Subscription {
  return {
    id: row.id,
    userId: row.user_id,
    planType: row.plan_type as Subscription['planType'],
    status: row.status as Subscription['status'],
    startedAt: new Date(row.started_at),
    expiresAt: row.expires_at ? new Date(row.expires_at) : undefined,
    cancelledAt: row.cancelled_at ? new Date(row.cancelled_at) : undefined,
    stripeCustomerId: row.stripe_customer_id || undefined,
    stripeSubscriptionId: row.stripe_subscription_id || undefined,
    stripePriceId: row.stripe_price_id || undefined,
    billingCycle: row.billing_cycle as 'monthly' | 'yearly' | undefined,
    metadata: row.metadata as Record<string, any>,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
    plan: row.subscription_plans ? rowToPlan(row.subscription_plans) : undefined,
  };
}

/**
 * Convertir une row Supabase en SubscriptionPlan
 */
function rowToPlan(row: SubscriptionPlanRow): SubscriptionPlan {
  return {
    id: row.id,
    planType: row.plan_type as SubscriptionPlan['planType'],
    displayName: row.display_name,
    description: row.description || undefined,
    priceMonthly: Number(row.price_monthly),
    priceYearly: row.price_yearly ? Number(row.price_yearly) : undefined,
    maxUsers: row.max_users,
    maxAmbitions: row.max_ambitions,
    features: row.features as unknown as SubscriptionPlan['features'],
    stripePriceIdMonthly: row.stripe_price_id_monthly || undefined,
    stripePriceIdYearly: row.stripe_price_id_yearly || undefined,
    isActive: row.is_active,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}

export const SubscriptionsService = {
  /**
   * Récupérer l'abonnement d'un utilisateur
   */
  async getUserSubscription(userId: string): Promise<Subscription | null> {
    try {
      // Récupérer l'abonnement
      const { data: subscriptionData, error: subError } = await (supabase
        .from('subscriptions') as any)
        .select('*')
        .eq('user_id', userId)
        .single();

      if (subError || !subscriptionData) {
        console.error('Error fetching user subscription:', subError);
        return null;
      }

      // Récupérer le plan associé
      const { data: planData, error: planError } = await (supabase
        .from('subscription_plans') as any)
        .select('*')
        .eq('plan_type', subscriptionData.plan_type)
        .single();

      if (planError || !planData) {
        console.error('Error fetching subscription plan:', planError);
        return null;
      }

      // Combiner les données
      const combined = {
        ...subscriptionData,
        subscription_plans: planData
      };

      return rowToSubscription(combined as any);
    } catch (error) {
      console.error('Error in getUserSubscription:', error);
      return null;
    }
  },

  /**
   * Récupérer tous les plans disponibles
   */
  async getAvailablePlans(): Promise<SubscriptionPlan[]> {
    try {
      const { data, error } = await (supabase
        .from('subscription_plans') as any)
        .select('*')
        .eq('is_active', true)
        .order('price_monthly', { ascending: true });

      if (error) {
        console.error('Error fetching subscription plans:', error);
        console.warn('⚠️ Fallback to hardcoded plans');
        return this.getHardcodedPlans();
      }

      if (!data || data.length === 0) {
        console.warn('⚠️ No subscription plans found in database');
        console.warn('⚠️ Fallback to hardcoded plans');
        return this.getHardcodedPlans();
      }

      return data.map(rowToPlan);
    } catch (error) {
      console.error('Exception in getAvailablePlans:', error);
      console.warn('⚠️ Fallback to hardcoded plans');
      return this.getHardcodedPlans();
    }
  },

  /**
   * Plans hardcodés en fallback si Supabase n'est pas disponible
   */
  getHardcodedPlans(): SubscriptionPlan[] {
    return [
      {
        id: 'hardcoded-free',
        planType: 'free',
        displayName: 'Free',
        description: 'Parfait pour tester la méthodologie OKR',
        priceMonthly: 0,
        priceYearly: 0,
        maxUsers: 1,
        maxAmbitions: 3,
        features: {
          export_pdf: 'basic',
          support: 'community',
          ai_coach_suggestions: 10,
          analytics: false,
          integrations: false,
          priority_support: false,
        },
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'hardcoded-pro',
        planType: 'pro',
        displayName: 'Pro',
        description: 'Sweet spot pour les PME',
        priceMonthly: 19,
        priceYearly: 190,
        maxUsers: 5,
        maxAmbitions: -1,
        features: {
          export_pdf: 'advanced',
          support: 'email',
          ai_coach_suggestions: -1,
          analytics: 'basic',
          integrations: 'basic',
          priority_support: false,
          quarterly_objectives_per_ambition: 1,
        },
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'hardcoded-team',
        planType: 'team',
        displayName: 'Team',
        description: 'Pour les équipes en croissance',
        priceMonthly: 49,
        priceYearly: 490,
        maxUsers: 20,
        maxAmbitions: -1,
        features: {
          export_pdf: 'advanced',
          support: 'priority',
          ai_coach_suggestions: -1,
          analytics: 'advanced',
          integrations: 'advanced',
          priority_support: true,
          quarterly_objectives_per_ambition: -1,
          roles_permissions: true,
        },
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];
  },

  /**
   * Récupérer un plan spécifique
   */
  async getPlan(planType: string): Promise<SubscriptionPlan | null> {
    const { data, error } = await supabaseRead(
      () => (supabase
        .from('subscription_plans') as any)
        .select('*')
        .eq('plan_type', planType)
        .single(),
      'getPlan'
    ) as any;

    if (error) {
      console.error('Error fetching subscription plan:', error);
      return null;
    }

    return data ? rowToPlan(data) : null;
  },

  /**
   * Mettre à jour l'abonnement d'un utilisateur
   */
  async updateSubscription(
    userId: string,
    updates: Partial<SubscriptionUpdate>
  ): Promise<Subscription | null> {
    const { data, error } = await (supabase
      .from('subscriptions') as any)
      .update(updates)
      .eq('user_id', userId)
      .select(`
        *,
        subscription_plans (*)
      `)
      .single();

    if (error) {
      console.error('Error updating subscription:', error);
      return null;
    }

    return data ? rowToSubscription(data as any) : null;
  },

  /**
   * Changer le plan d'un utilisateur
   */
  async changePlan(
    userId: string,
    newPlanType: string,
    stripeSubscriptionId?: string
  ): Promise<Subscription | null> {
    const updates: SubscriptionUpdate = {
      plan_type: newPlanType as any,
      updated_at: new Date().toISOString(),
    };

    if (stripeSubscriptionId) {
      updates.stripe_subscription_id = stripeSubscriptionId;
    }

    return this.updateSubscription(userId, updates);
  },

  /**
   * Annuler un abonnement
   */
  async cancelSubscription(userId: string): Promise<Subscription | null> {
    return this.updateSubscription(userId, {
      status: 'cancelled',
      cancelled_at: new Date().toISOString(),
    });
  },

  /**
   * Réactiver un abonnement
   */
  async reactivateSubscription(userId: string): Promise<Subscription | null> {
    return this.updateSubscription(userId, {
      status: 'active',
      cancelled_at: null,
    });
  },

  /**
   * Vérifier si un utilisateur peut créer une ambition
   */
  async canCreateAmbition(userId: string): Promise<boolean> {
    const { data, error } = await (supabase as any).rpc('can_create_ambition', {
      p_user_id: userId,
    });

    if (error) {
      console.error('Error checking can create ambition:', error);
      return false;
    }

    return data === true;
  },

  /**
   * Vérifier si un utilisateur peut ajouter un membre à son équipe
   */
  async canAddTeamMember(userId: string, teamId: string): Promise<boolean> {
    const { data, error } = await (supabase as any).rpc('can_add_team_member', {
      p_user_id: userId,
      p_team_id: teamId,
    });

    if (error) {
      console.error('Error checking can add team member:', error);
      return false;
    }

    return data === true;
  },

  /**
   * Récupérer l'usage actuel d'un utilisateur
   */
  async getUsage(userId: string): Promise<SubscriptionUsage | null> {
    const subscription = await this.getUserSubscription(userId);
    if (!subscription || !subscription.plan) {
      return null;
    }

    // Compter les ambitions
    const { count: ambitionsCount } = await supabase
      .from('ambitions')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    // Compter les membres d'équipe (si l'utilisateur a une équipe)
    const { data: teams } = await (supabase
      .from('teams') as any)
      .select('id')
      .eq('owner_id', userId)
      .limit(1)
      .single();

    let membersCount = 1; // L'utilisateur lui-même
    if (teams) {
      const { count } = await (supabase
        .from('team_members') as any)
        .select('*', { count: 'exact', head: true })
        .eq('team_id', teams.id);
      membersCount = count || 1;
    }

    const maxUsers = subscription.plan.maxUsers;
    const maxAmbitions = subscription.plan.maxAmbitions;

    return {
      currentUsers: membersCount,
      maxUsers: maxUsers === -1 ? Infinity : maxUsers,
      currentAmbitions: ambitionsCount || 0,
      maxAmbitions: maxAmbitions === -1 ? Infinity : maxAmbitions,
      canAddUser: maxUsers === -1 || membersCount < maxUsers,
      canCreateAmbition: maxAmbitions === -1 || (ambitionsCount || 0) < maxAmbitions,
    };
  },

  /**
   * Créer un abonnement Stripe (préparation)
   */
  async createStripeSubscription(
    userId: string,
    planType: string,
    stripeCustomerId: string,
    stripeSubscriptionId: string,
    stripePriceId: string,
    billingCycle: 'monthly' | 'yearly'
  ): Promise<Subscription | null> {
    return this.updateSubscription(userId, {
      plan_type: planType as any,
      stripe_customer_id: stripeCustomerId,
      stripe_subscription_id: stripeSubscriptionId,
      stripe_price_id: stripePriceId,
      billing_cycle: billingCycle,
      status: 'active',
    });
  },
};

