/**
 * Utilitaires de conversion entre les enums de l'app (minuscules) 
 * et les enums Supabase (MAJUSCULES)
 */

import type { ActionStatus } from '@/types';
import type { AmbitionCategory as DbAmbitionCategory, PriorityEnum, ActionStatus as DbActionStatus } from '@/types/supabase';

/**
 * Convertir une catégorie d'ambition de l'app vers Supabase
 * app: 'growth' -> Supabase: 'GROWTH'
 */
export function categoryToDb(category: string): DbAmbitionCategory {
  const upper = category.toUpperCase();
  
  // Mapping des valeurs de l'app vers Supabase
  const mapping: Record<string, DbAmbitionCategory> = {
    'REVENUE': 'FINANCIAL',
    'GROWTH': 'GROWTH',
    'PRODUCT': 'PRODUCT',
    'TEAM': 'TEAM',
    'MARKET': 'CUSTOMER',
    'OPERATIONAL': 'EFFICIENCY',
    'PERSONAL': 'OTHER',
    'INNOVATION': 'INNOVATION',
    'EFFICIENCY': 'EFFICIENCY',
    'CUSTOMER': 'CUSTOMER',
    'FINANCIAL': 'FINANCIAL',
    'OTHER': 'OTHER',
  };
  
  return mapping[upper] || 'OTHER';
}

/**
 * Convertir une catégorie d'ambition de Supabase vers l'app
 * Supabase: 'GROWTH' -> app: 'growth'
 */
export function categoryFromDb(category: DbAmbitionCategory): string {
  return category.toLowerCase();
}

/**
 * Convertir une priorité de l'app vers Supabase
 * app: 'high' -> Supabase: 'HIGH'
 */
export function priorityToDb(priority: string): PriorityEnum {
  const upper = priority.toUpperCase();
  
  if (upper === 'LOW' || upper === 'MEDIUM' || upper === 'HIGH' || upper === 'CRITICAL') {
    return upper as PriorityEnum;
  }
  
  return 'MEDIUM';
}

/**
 * Convertir une priorité de Supabase vers l'app
 * Supabase: 'HIGH' -> app: 'high'
 */
export function priorityFromDb(priority: PriorityEnum): string {
  return priority.toLowerCase();
}

/**
 * Convertir un statut d'action de l'app vers Supabase
 * app: 'todo' -> Supabase: 'TODO'
 */
export function actionStatusToDb(status: ActionStatus | string): DbActionStatus {
  const upper = (typeof status === 'string' ? status : status).toUpperCase();

  if (upper === 'TODO' || upper === 'IN_PROGRESS' || upper === 'DONE' || upper === 'BLOCKED' || upper === 'CANCELLED') {
    return upper as DbActionStatus;
  }

  return 'TODO';
}

/**
 * Convertir un statut d'action de Supabase vers l'app
 * Supabase: 'TODO' -> app: 'todo'
 */
export function actionStatusFromDb(status: DbActionStatus): ActionStatus {
  return status.toLowerCase() as ActionStatus;
}

