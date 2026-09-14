import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format, formatDistanceToNow, isAfter, isBefore } from 'date-fns';
import { fr } from 'date-fns/locale';
import type { Priority, Status } from '@/types';
import { Quarter } from '@/types';

// Utilitaire pour combiner les classes CSS
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Génération d'ID unique
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// Formatage des dates
export function formatDate(date: Date | string, formatStr: string = 'dd/MM/yyyy'): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return format(dateObj, formatStr, { locale: fr });
}

export function formatRelativeDate(date: Date | string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return formatDistanceToNow(dateObj, { addSuffix: true, locale: fr });
}

// Validation des dates
export function isDateInFuture(date: Date | string): boolean {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return isAfter(dateObj, new Date());
}

export function isDateInPast(date: Date | string): boolean {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return isBefore(dateObj, new Date());
}

export function getDaysUntilDeadline(deadline: Date | string): number {
  const deadlineObj = typeof deadline === 'string' ? new Date(deadline) : deadline;
  const now = new Date();
  const diffTime = deadlineObj.getTime() - now.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

// Utilitaires de couleurs pour les priorités
export function getPriorityColor(priority: Priority): string {
  const colors = {
    low: 'text-gray-500 bg-gray-100',
    medium: 'text-yellow-600 bg-yellow-100',
    high: 'text-orange-600 bg-orange-100',
    critical: 'text-red-600 bg-red-100',
  };
  return colors[priority] || colors.medium;
}

export function getPriorityBadgeColor(priority: Priority): string {
  const colors = {
    low: 'bg-gray-100 text-gray-800',
    medium: 'bg-yellow-100 text-yellow-800',
    high: 'bg-orange-100 text-orange-800',
    critical: 'bg-red-100 text-red-800',
  };
  return colors[priority] || colors.medium;
}

// Utilitaires de couleurs pour les statuts
export function getStatusColor(status: Status): string {
  const colors = {
    draft: 'text-gray-500 bg-gray-100',
    active: 'text-blue-600 bg-blue-100',
    on_track: 'text-green-600 bg-green-100',
    at_risk: 'text-yellow-600 bg-yellow-100',
    behind: 'text-orange-600 bg-orange-100',
    completed: 'text-green-600 bg-green-100',
    cancelled: 'text-red-600 bg-red-100',
  };
  return colors[status] || colors.draft;
}

export function getStatusLabel(status: Status): string {
  const labels = {
    draft: 'Brouillon',
    active: 'Actif',
    on_track: 'En bonne voie',
    at_risk: 'À risque',
    behind: 'En retard',
    completed: 'Terminé',
    cancelled: 'Annulé',
  };
  return labels[status] || status;
}

// Utilitaires pour les progrès
export function getProgressColor(progress: number): string {
  if (progress >= 90) return 'text-green-600 bg-green-100';
  if (progress >= 70) return 'text-blue-600 bg-blue-100';
  if (progress >= 50) return 'text-yellow-600 bg-yellow-100';
  if (progress >= 30) return 'text-orange-600 bg-orange-100';
  return 'text-red-600 bg-red-100';
}

export function getProgressBarColor(progress: number): string {
  if (progress >= 90) return 'bg-green-500';
  if (progress >= 70) return 'bg-blue-500';
  if (progress >= 50) return 'bg-yellow-500';
  if (progress >= 30) return 'bg-orange-500';
  return 'bg-red-500';
}

// Calcul du trimestre actuel
export function getCurrentQuarter(): Quarter {
  const month = new Date().getMonth();
  if (month < 3) return Quarter.Q1;
  if (month < 6) return Quarter.Q2;
  if (month < 9) return Quarter.Q3;
  return Quarter.Q4;
}

export function getQuarterLabel(quarter: Quarter): string {
  const labels = {
    [Quarter.Q1]: 'T1 (Jan-Mar)',
    [Quarter.Q2]: 'T2 (Avr-Juin)',
    [Quarter.Q3]: 'T3 (Juil-Sep)',
    [Quarter.Q4]: 'T4 (Oct-Déc)',
  };
  return labels[quarter];
}

export function getQuarterMonths(quarter: Quarter): number[] {
  const months = {
    [Quarter.Q1]: [0, 1, 2],
    [Quarter.Q2]: [3, 4, 5],
    [Quarter.Q3]: [6, 7, 8],
    [Quarter.Q4]: [9, 10, 11],
  };
  return months[quarter];
}

// Validation des formulaires
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function validateRequired(value: any): boolean {
  if (typeof value === 'string') {
    return value.trim().length > 0;
  }
  return value !== null && value !== undefined;
}

export function validateMinLength(value: string, minLength: number): boolean {
  return value.trim().length >= minLength;
}

export function validateMaxLength(value: string, maxLength: number): boolean {
  return value.trim().length <= maxLength;
}

export function validateNumber(value: any): boolean {
  return !isNaN(Number(value)) && isFinite(Number(value));
}

export function validatePositiveNumber(value: any): boolean {
  return validateNumber(value) && Number(value) > 0;
}

// Formatage des nombres
export function formatNumber(value: number, decimals: number = 0): string {
  return new Intl.NumberFormat('fr-FR', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

export function formatCurrency(value: number, currency: string = 'EUR'): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency,
  }).format(value);
}

export function formatPercentage(value: number, decimals: number = 1): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'percent',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value / 100);
}

// Utilitaires pour les textes
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - 3) + '...';
}

export function capitalizeFirst(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Supprimer les accents
    .replace(/[^a-z0-9 -]/g, '') // Supprimer les caractères spéciaux
    .replace(/\s+/g, '-') // Remplacer les espaces par des tirets
    .replace(/-+/g, '-') // Supprimer les tirets multiples
    .trim();
}

// Utilitaires pour les tableaux
export function sortByProperty<T>(array: T[], property: keyof T, direction: 'asc' | 'desc' = 'asc'): T[] {
  return [...array].sort((a, b) => {
    const aValue = a[property];
    const bValue = b[property];
    
    if (aValue < bValue) return direction === 'asc' ? -1 : 1;
    if (aValue > bValue) return direction === 'asc' ? 1 : -1;
    return 0;
  });
}

export function groupBy<T>(array: T[], key: keyof T): { [key: string]: T[] } {
  return array.reduce((groups, item) => {
    const group = String(item[key]);
    if (!groups[group]) {
      groups[group] = [];
    }
    groups[group].push(item);
    return groups;
  }, {} as { [key: string]: T[] });
}

export function filterBy<T>(array: T[], filters: Partial<T>): T[] {
  return array.filter(item => {
    return Object.entries(filters).every(([key, value]) => {
      if (value === undefined || value === null) return true;
      return item[key as keyof T] === value;
    });
  });
}

// Utilitaires pour le localStorage
export function safeJsonParse<T>(json: string, fallback: T): T {
  try {
    return JSON.parse(json);
  } catch {
    return fallback;
  }
}

export function safeJsonStringify(obj: any): string {
  try {
    return JSON.stringify(obj);
  } catch {
    return '{}';
  }
}

// Utilitaires pour les erreurs
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  return 'Une erreur inconnue s\'est produite';
}

// Utilitaires pour les délais
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

// Utilitaires pour les promesses
export function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export async function retry<T>(
  fn: () => Promise<T>,
  maxAttempts: number = 3,
  delayMs: number = 1000
): Promise<T> {
  let lastError: Error;
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      
      if (attempt === maxAttempts) {
        throw lastError;
      }
      
      await delay(delayMs * attempt);
    }
  }
  
  throw lastError!;
}
