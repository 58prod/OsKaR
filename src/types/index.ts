// Types principaux pour Oskar

export interface User {
  id: string;
  name: string;
  email: string;
  company?: string;
  role?: string;
  createdAt: Date;
  lastLoginAt: Date;
  companyProfile?: CompanyProfile;
  subscription?: Subscription;
  settings?: UserSettings;
}

export interface UserSettings {
  /** Suivi de l'onboarding spécifique à chaque module/pilier (ex. okr). */
  onboarding?: {
    okr?: boolean;
    [module: string]: boolean | undefined;
  };
  [key: string]: unknown;
}

// Types pour les abonnements
export type SubscriptionPlanType = 'free' | 'pro' | 'team' | 'unlimited';
export type SubscriptionStatus = 'active' | 'cancelled' | 'expired' | 'trialing';

export interface SubscriptionPlan {
  id: string;
  planType: SubscriptionPlanType;
  displayName: string;
  description?: string;
  priceMonthly: number;
  priceYearly?: number;
  maxUsers: number; // -1 = illimité
  maxAmbitions: number; // -1 = illimité
  features: SubscriptionFeatures;
  stripePriceIdMonthly?: string;
  stripePriceIdYearly?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface SubscriptionFeatures {
  export_pdf: 'basic' | 'advanced';
  support: 'community' | 'email' | 'priority';
  ai_coach_suggestions: number; // -1 = illimité
  analytics: boolean | 'basic' | 'advanced';
  integrations: boolean | 'basic' | 'advanced';
  priority_support: boolean;
  quarterly_objectives_per_ambition?: number; // -1 = illimité
  roles_permissions?: boolean;
  custom_features?: boolean;
}

export interface Subscription {
  id: string;
  userId: string;
  planType: SubscriptionPlanType;
  status: SubscriptionStatus;
  startedAt: Date;
  expiresAt?: Date;
  cancelledAt?: Date;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  stripePriceId?: string;
  billingCycle?: 'monthly' | 'yearly';
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
  plan?: SubscriptionPlan;
}

export interface SubscriptionUsage {
  currentUsers: number;
  maxUsers: number;
  currentAmbitions: number;
  maxAmbitions: number;
  canAddUser: boolean;
  canCreateAmbition: boolean;
}

export interface CompanyProfile {
  name: string;
  industry: string;
  size: CompanySize;
  stage: CompanyStage;
  mainChallenges: string[];
  currentGoals: string[];
  marketPosition: string;
  targetMarket: string;
  businessModel: string;
}

export interface Ambition {
  id: string;
  userId: string;
  title: string;
  description: string;
  year: number;
  category: AmbitionCategory;
  priority: Priority;
  status: Status;
  /** Cible chiffrée de l'objectif annuel (colonne `target_value`), ex. 500. */
  target?: number | null;
  /** Unité de la cible (colonne `unit`), ex. « k€ de CA ». */
  unit?: string | null;
  /** Position dans le parcours OKR (colonne `order_index`). */
  orderIndex?: number;
  createdAt: Date;
  updatedAt: Date;
  aiValidation?: AIValidation;
}

export interface KeyResult {
  id: string;
  ambitionId: string;
  title: string;
  description: string;
  target: number;
  current: number;
  unit: string;
  deadline: Date;
  priority: Priority;
  status: Status;
  createdAt: Date;
  updatedAt: Date;
  aiValidation?: AIValidation;
}

export interface OKR {
  id: string;
  keyResultId: string;
  quarter: Quarter;
  year: number;
  objective: string;
  keyResults: OKRKeyResult[];
  status: Status;
  progress: number;
  createdAt: Date;
  updatedAt: Date;
  aiValidation?: AIValidation;
}

export interface OKRKeyResult {
  id: string;
  title: string;
  target: number;
  current: number;
  unit: string;
  weight: number; // Pondération sur 100
}

// Types pour les actions (remplacent les tâches)
export interface Action {
  id: string;
  title: string;
  description?: string;
  quarterlyKeyResultId: string; // Lié au KR trimestriel
  status: ActionStatus;
  priority: Priority;
  labels: string[];
  deadline?: Date;
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
  order_index: number; // Position dans le Kanban
  assignees?: ActionAssignee[]; // NOUVEAU: Liste des assignés
}

// NOUVEAU: Types pour l'affectation d'actions
export interface ActionAssignee {
  id: string;
  actionId: string;
  assigneeType: 'internal' | 'external';
  userId?: string; // Si type = internal
  externalContactId?: string; // Si type = external
  assignedAt: Date;
  assignedBy: string;
  // Données jointes optionnelles (remplies par JOIN)
  userName?: string;
  userEmail?: string;
  externalContact?: ExternalContact;
}

// NOUVEAU: Types pour les contacts externes (partagés au niveau entreprise)
export interface ExternalContact {
  id: string;
  companyId: string;
  firstName: string;
  lastName: string;
  email: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  lastUsedAt?: Date;
}

// Types pour les objectifs trimestriels
export interface QuarterlyObjective {
  id: string;
  title: string;
  description: string;
  ambitionId: string; // Rattachement à l'ambition
  quarter: Quarter;
  year: number;
  keyResults: QuarterlyKeyResult[];
  actions: Action[];
  status: Status;
  createdAt: Date;
  updatedAt: Date;
}

// Types pour les Key Results trimestriels (différents des KR d'ambition)
export interface QuarterlyKeyResult {
  id: string;
  title: string;
  description: string;
  quarterlyObjectiveId: string;
  target: number;
  current: number;
  unit: string;
  deadline: Date;
  status: Status;
  createdAt: Date;
  updatedAt: Date;
}

export interface Progress {
  id: string;
  entityId: string; // ID de l'entité (Ambition, KR, OKR, Action)
  entityType: EntityType;
  value: number;
  note?: string;
  recordedAt: Date;
  recordedBy: string;
}

export interface AIValidation {
  isValid: boolean;
  confidence: number; // 0-100
  suggestions: string[];
  warnings: string[];
  category: ValidationCategory;
  validatedAt: Date;
}

export interface SmartAnalysis {
  specific: boolean;
  measurable: boolean;
  achievable: boolean;
  relevant: boolean;
  timeBound: boolean;
  score: number; // 0-100
  recommendations: string[];
}

export interface Report {
  id: string;
  userId: string;
  type: ReportType;
  period: ReportPeriod;
  data: any;
  generatedAt: Date;
  format: ReportFormat;
}

// Enums
export enum AmbitionCategory {
  REVENUE = 'revenue',
  GROWTH = 'growth',
  PRODUCT = 'product',
  TEAM = 'team',
  MARKET = 'market',
  OPERATIONAL = 'operational',
  PERSONAL = 'personal'
}

export enum Priority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

export enum Status {
  DRAFT = 'draft',
  ACTIVE = 'active',
  ON_TRACK = 'on_track',
  AT_RISK = 'at_risk',
  BEHIND = 'behind',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled'
}

// Enum pour les trimestres
export enum Quarter {
  Q1 = 'Q1',
  Q2 = 'Q2',
  Q3 = 'Q3',
  Q4 = 'Q4'
}

// Enum pour le statut des actions dans le kanban
export enum ActionStatus {
  TODO = 'todo',
  IN_PROGRESS = 'in_progress',
  DONE = 'done'
}



export enum CompanySize {
  STARTUP = 'startup',
  SMALL = 'small',
  MEDIUM = 'medium',
  LARGE = 'large',
  ENTERPRISE = 'enterprise'
}

export enum CompanyStage {
  IDEA = 'idea',
  PROTOTYPE = 'prototype',
  EARLY_STAGE = 'early_stage',
  GROWTH = 'growth',
  MATURE = 'mature',
  SCALE_UP = 'scale_up'
}

export enum EntityType {
  AMBITION = 'ambition',
  KEY_RESULT = 'key_result',
  OKR = 'okr',
  ACTION = 'action',
  QUARTERLY_OBJECTIVE = 'quarterly_objective',
  QUARTERLY_KEY_RESULT = 'quarterly_key_result'
}

export enum ValidationCategory {
  AMBITION = 'ambition',
  OBJECTIVE = 'objective',
  KEY_RESULT = 'key_result',
  ACTION = 'action',
  QUARTERLY_OBJECTIVE = 'quarterly_objective',
  QUARTERLY_KEY_RESULT = 'quarterly_key_result'
}

export enum ReportType {
  MONTHLY = 'monthly',
  QUARTERLY = 'quarterly',
  ANNUAL = 'annual',
  CUSTOM = 'custom'
}

export enum ReportPeriod {
  CURRENT_MONTH = 'current_month',
  CURRENT_QUARTER = 'current_quarter',
  CURRENT_YEAR = 'current_year',
  LAST_MONTH = 'last_month',
  LAST_QUARTER = 'last_quarter',
  LAST_YEAR = 'last_year'
}

export enum ReportFormat {
  PDF = 'pdf',
  EXCEL = 'excel',
  JSON = 'json'
}

// Types pour les composants UI
export interface CanvasStep {
  id: number;
  title: string;
  description: string;
  component: string;
  isCompleted: boolean;
  isActive: boolean;
}

export interface DashboardMetrics {
  totalAmbitions: number;
  activeOKRs: number;
  completedActions: number;
  overallProgress: number;
  monthlyProgress: number;
  upcomingDeadlines: number;
}

export interface ChartData {
  name: string;
  value: number;
  color?: string;
}

// Types pour les formulaires
export interface AmbitionFormData {
  title: string;
  description: string;
  category: AmbitionCategory;
  priority: Priority;
  year: number;
}

export interface KeyResultFormData {
  title: string;
  description: string;
  target: number;
  unit: string;
  deadline: string;
  priority: Priority;
}

export interface OKRFormData {
  quarter: Quarter;
  year: number;
  objective: string;
  keyResults: Omit<OKRKeyResult, 'id'>[];
}



// Types pour les formulaires des objectifs trimestriels
export interface QuarterlyObjectiveFormData {
  title: string;
  description: string;
  ambitionId: string;
  quarter: Quarter;
  year: number;
}

// Types pour les formulaires des actions
export interface ActionFormData {
  title: string;
  description?: string;
  priority: Priority;
  labels: string; // Chaîne séparée par des virgules
  deadline?: string;
  quarterlyKeyResultId?: string; // Lié au KR trimestriel
  assignees?: ActionAssigneeFormData[]; // NOUVEAU
}

// NOUVEAU: Types pour affectation dans les formulaires
export interface ActionAssigneeFormData {
  type: 'internal' | 'external';
  userId?: string;
  externalContactId?: string;
}

// NOUVEAU: Types pour les formulaires de contacts externes
export interface ExternalContactFormData {
  firstName: string;
  lastName: string;
  email: string;
}

// Types pour les formulaires des objectifs trimestriels
export interface QuarterlyObjectiveFormData {
  title: string;
  description: string;
  ambitionId: string;
  quarter: Quarter;
  year: number;
}

// Types pour les formulaires des KR trimestriels
export interface QuarterlyKeyResultFormData {
  title: string;
  description: string;
  target: number;
  current: number;
  unit: string;
  deadline: string; // ISO string in form
}

// ============================================
// COLLABORATION TYPES (Future feature)
// ============================================

export enum TeamRole {
  OWNER = 'owner',
  ADMIN = 'admin',
  MEMBER = 'member',
  VIEWER = 'viewer'
}

export enum InvitationStatus {
  PENDING = 'pending',
  ACCEPTED = 'accepted',
  DECLINED = 'declined',
  EXPIRED = 'expired'
}

export enum SharePermission {
  VIEW = 'view',
  EDIT = 'edit'
}

export enum NotificationType {
  TEAM_INVITATION = 'team_invitation',
  OBJECTIVE_SHARED = 'objective_shared',
  COMMENT_MENTION = 'comment_mention',
  OBJECTIVE_UPDATED = 'objective_updated',
  DEADLINE_APPROACHING = 'deadline_approaching',
  MILESTONE_ACHIEVED = 'milestone_achieved',
  TEAM_MEMBER_JOINED = 'team_member_joined'
}

export interface Team {
  id: string;
  name: string;
  description?: string;
  ownerId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface TeamMember {
  id: string;
  teamId: string;
  userId: string;
  role: TeamRole;
  joinedAt: Date;
  // Informations utilisateur (optionnelles, remplies par JOIN)
  userEmail?: string;
  userName?: string;
  userAvatarUrl?: string;
}

export interface Invitation {
  id: string;
  teamId: string;
  email: string;
  role: TeamRole;
  invitedBy: string;
  token: string;
  status: InvitationStatus;
  expiresAt: Date;
  acceptedAt?: Date;
  createdAt: Date;
}

export interface SharedObjective {
  id: string;
  objectiveId: string;
  objectiveType: 'ambition' | 'quarterly_objective';
  sharedWithUserId: string;
  sharedByUserId: string;
  permission: SharePermission;
  sharedAt: Date;
}

export interface Comment {
  id: string;
  objectiveId: string;
  objectiveType: 'ambition' | 'quarterly_objective' | 'quarterly_key_result';
  userId: string;
  content: string;
  mentions: string[]; // User IDs mentioned with @
  createdAt: Date;
  updatedAt: Date;
}

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  relatedId?: string; // ID of related entity (team, objective, etc.)
  isRead: boolean;
  createdAt: Date;
}
