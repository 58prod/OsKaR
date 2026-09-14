import type {
  Ambition,
  KeyResult,
  OKR,
  Action,
  QuarterlyObjective,
  QuarterlyKeyResult,
  DashboardMetrics,
  ChartData,
} from '@/types';
import { Status, Quarter } from '@/types';

// Service d'analytics et de calcul des métriques
export class AnalyticsService {
  private static instance: AnalyticsService;

  private constructor() {}

  public static getInstance(): AnalyticsService {
    if (!AnalyticsService.instance) {
      AnalyticsService.instance = new AnalyticsService();
    }
    return AnalyticsService.instance;
  }

  // Calcul des métriques du dashboard
  public getDashboardMetrics(
    ambitions: Ambition[],
    okrs: OKR[],
    actions: Action[],
    quarterlyObjectives: QuarterlyObjective[],
    quarterlyKeyResults: QuarterlyKeyResult[]
  ): DashboardMetrics {
    const totalAmbitions = ambitions.length;
    const activeOKRs = okrs.filter(okr => okr.status === Status.ACTIVE).length;
    const completedActions = actions.filter(action => action.status === 'done').length;

    const overallProgress = this.calculateOverallProgress(quarterlyKeyResults);
    const monthlyProgress = this.calculateMonthlyProgress(quarterlyKeyResults);
    const upcomingDeadlines = this.getUpcomingDeadlinesCount(actions);

    return {
      totalAmbitions,
      activeOKRs,
      completedActions,
      overallProgress,
      monthlyProgress,
      upcomingDeadlines,
    };
  }

  // Calcul du progrès global
  public calculateOverallProgress(quarterlyKeyResults: QuarterlyKeyResult[]): number {
    if (quarterlyKeyResults.length === 0) return 0;

    let totalProgress = 0;
    quarterlyKeyResults.forEach(qkr => {
      const progress = qkr.target > 0 ? (qkr.current / qkr.target) * 100 : 0;
      totalProgress += Math.min(progress, 100);
    });

    return Math.round(totalProgress / quarterlyKeyResults.length);
  }

  // Calcul du progrès d'une ambition
  public calculateAmbitionProgress(ambitionId: string, quarterlyObjectives: QuarterlyObjective[] = [], quarterlyKeyResults: QuarterlyKeyResult[] = []): number {
    const objectives = quarterlyObjectives.filter(qo => qo.ambitionId === ambitionId);
    if (objectives.length === 0) return 0;

    let totalProgress = 0;
    objectives.forEach(obj => {
      const objKRs = quarterlyKeyResults.filter(qkr => qkr.quarterlyObjectiveId === obj.id);
      if (objKRs.length > 0) {
        let objProgress = 0;
        objKRs.forEach(qkr => {
          const progress = qkr.target > 0 ? (qkr.current / qkr.target) * 100 : 0;
          objProgress += Math.min(progress, 100);
        });
        totalProgress += objProgress / objKRs.length;
      }
    });

    return objectives.length > 0 ? Math.round(totalProgress / objectives.length) : 0;
  }

  // Calcul du progrès d'un OKR
  public calculateOKRProgress(okrId: string, okrs: OKR[] = []): number {
    const okr = okrs.find(o => o.id === okrId);
    if (!okr || !okr.keyResults.length) return 0;

    let totalProgress = 0;
    let totalWeight = 0;

    okr.keyResults.forEach(kr => {
      const progress = kr.target > 0 ? (kr.current / kr.target) * 100 : 0;
      const weight = kr.weight / 100;
      totalProgress += Math.min(progress, 100) * weight;
      totalWeight += weight;
    });

    return totalWeight > 0 ? Math.round(totalProgress / totalWeight) : 0;
  }

  // Calcul du progrès mensuel
  public calculateMonthlyProgress(quarterlyKeyResults: QuarterlyKeyResult[]): number {
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();

    // Filtrer les KR du mois en cours
    const currentMonthKRs = quarterlyKeyResults.filter(qkr => {
      const createdDate = new Date(qkr.createdAt);
      return createdDate.getMonth() === currentMonth && createdDate.getFullYear() === currentYear;
    });

    if (currentMonthKRs.length === 0) return 0;

    let totalProgress = 0;
    currentMonthKRs.forEach(qkr => {
      const progress = qkr.target > 0 ? (qkr.current / qkr.target) * 100 : 0;
      totalProgress += Math.min(progress, 100);
    });

    return Math.round(totalProgress / currentMonthKRs.length);
  }

  // Nombre d'échéances à venir (7 prochains jours)
  public getUpcomingDeadlinesCount(actions: Action[]): number {
    const now = new Date();
    const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    let count = 0;

    actions.forEach(action => {
      if (action.deadline) {
        const deadline = new Date(action.deadline);
        if (deadline >= now && deadline <= nextWeek) count++;
      }
    });

    return count;
  }

  // Données pour graphique de progression par catégorie
  public getProgressByCategory(ambitions: Ambition[], quarterlyObjectives: QuarterlyObjective[], quarterlyKeyResults: QuarterlyKeyResult[]): ChartData[] {
    const categoryProgress: { [key: string]: { total: number; count: number } } = {};

    ambitions.forEach(ambition => {
      const progress = this.calculateAmbitionProgress(ambition.id, quarterlyObjectives, quarterlyKeyResults);
      const category = ambition.category;

      if (!categoryProgress[category]) {
        categoryProgress[category] = { total: 0, count: 0 };
      }

      categoryProgress[category].total += progress;
      categoryProgress[category].count += 1;
    });

    return Object.entries(categoryProgress).map(([category, data]) => ({
      name: this.getCategoryLabel(category),
      value: data.count > 0 ? Math.round(data.total / data.count) : 0,
    }));
  }

  // Données pour graphique de progression trimestrielle
  public getQuarterlyProgress(quarterlyObjectives: QuarterlyObjective[], quarterlyKeyResults: QuarterlyKeyResult[]): ChartData[] {
    const currentYear = new Date().getFullYear();

    const quarterProgress: { [key: string]: { total: number; count: number } } = {};

    quarterlyObjectives.filter(qo => qo.year === currentYear).forEach(qo => {
      const qoKRs = quarterlyKeyResults.filter(qkr => qkr.quarterlyObjectiveId === qo.id);
      if (qoKRs.length > 0) {
        let qoProgress = 0;
        qoKRs.forEach(qkr => {
          const progress = qkr.target > 0 ? (qkr.current / qkr.target) * 100 : 0;
          qoProgress += Math.min(progress, 100);
        });
        const avgProgress = qoProgress / qoKRs.length;
        const quarter = qo.quarter;

        if (!quarterProgress[quarter]) {
          quarterProgress[quarter] = { total: 0, count: 0 };
        }

        quarterProgress[quarter].total += avgProgress;
        quarterProgress[quarter].count += 1;
      }
    });

    return Object.values(Quarter).map(quarter => ({
      name: quarter,
      value: quarterProgress[quarter]
        ? Math.round(quarterProgress[quarter].total / quarterProgress[quarter].count)
        : 0,
    }));
  }

  // Évolution du progrès dans le temps
  public getProgressEvolution(quarterlyKeyResults: QuarterlyKeyResult[], days: number = 30): ChartData[] {
    const now = new Date();
    const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

    const dailyProgress: { [key: string]: number[] } = {};

    quarterlyKeyResults
      .filter(qkr => new Date(qkr.updatedAt) >= startDate)
      .forEach(qkr => {
        const date = new Date(qkr.updatedAt).toISOString().split('T')[0];
        const progress = qkr.target > 0 ? (qkr.current / qkr.target) * 100 : 0;
        if (!dailyProgress[date]) {
          dailyProgress[date] = [];
        }
        dailyProgress[date].push(Math.min(progress, 100));
      });

    const result: ChartData[] = [];
    for (let i = 0; i < days; i++) {
      const date = new Date(startDate.getTime() + i * 24 * 60 * 60 * 1000);
      const dateStr = date.toISOString().split('T')[0];
      const dayProgress = dailyProgress[dateStr] || [];
      const avgProgress = dayProgress.length > 0
        ? dayProgress.reduce((sum, val) => sum + val, 0) / dayProgress.length
        : 0;

      result.push({
        name: date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' }),
        value: Math.round(avgProgress),
      });
    }

    return result;
  }

  // Analyse des tendances
  public getTrendAnalysis(quarterlyKeyResults: QuarterlyKeyResult[]): {
    trend: 'up' | 'down' | 'stable';
    percentage: number;
    message: string;
  } {
    const last7Days = this.getProgressEvolution(quarterlyKeyResults, 7);
    const last14Days = this.getProgressEvolution(quarterlyKeyResults, 14);

    if (last7Days.length < 2 || last14Days.length < 2) {
      return {
        trend: 'stable',
        percentage: 0,
        message: 'Pas assez de données pour analyser la tendance',
      };
    }

    const recentAvg = last7Days.slice(-3).reduce((sum, d) => sum + d.value, 0) / 3;
    const previousAvg = last14Days.slice(-7, -4).reduce((sum, d) => sum + d.value, 0) / 3;

    const difference = recentAvg - previousAvg;
    const percentage = previousAvg > 0 ? Math.abs(difference / previousAvg) * 100 : 0;

    let trend: 'up' | 'down' | 'stable' = 'stable';
    let message = '';

    if (Math.abs(difference) < 2) {
      trend = 'stable';
      message = 'Votre progression est stable';
    } else if (difference > 0) {
      trend = 'up';
      message = `Excellente progression ! +${percentage.toFixed(1)}% cette semaine`;
    } else {
      trend = 'down';
      message = `Attention, ralentissement de ${percentage.toFixed(1)}% cette semaine`;
    }

    return { trend, percentage: Math.round(percentage), message };
  }

  // Statistiques détaillées
  public getDetailedStats(
    ambitions: Ambition[],
    keyResults: KeyResult[],
    okrs: OKR[],
    actions: Action[],
    quarterlyObjectives: QuarterlyObjective[],
    quarterlyKeyResults: QuarterlyKeyResult[]
  ) {
    return {
      ambitions: {
        total: ambitions.length,
        byStatus: this.groupByStatus(ambitions),
        byCategory: this.groupByCategory(ambitions),
      },
      keyResults: {
        total: keyResults.length,
        completed: keyResults.filter(kr => kr.current >= kr.target).length,
        averageProgress: this.calculateAverageKRProgress(keyResults),
      },
      okrs: {
        total: okrs.length,
        byQuarter: this.groupOKRsByQuarter(okrs),
        averageProgress: this.calculateAverageOKRProgress(okrs),
      },
      actions: {
        total: actions.length,
        completed: actions.filter(a => a.status === 'done').length,
        overdue: this.getOverdueActions(actions).length,
      },
      quarterlyObjectives: {
        total: quarterlyObjectives.length,
        byStatus: this.groupByStatus(quarterlyObjectives),
      },
      quarterlyKeyResults: {
        total: quarterlyKeyResults.length,
        completed: quarterlyKeyResults.filter(qkr => qkr.current >= qkr.target).length,
        averageProgress: this.calculateAverageQKRProgress(quarterlyKeyResults),
      },
    };
  }

  // Méthodes utilitaires privées
  private getCategoryLabel(category: string): string {
    const labels: { [key: string]: string } = {
      revenue: 'Chiffre d\'affaires',
      growth: 'Croissance',
      product: 'Produit',
      team: 'Équipe',
      market: 'Marché',
      operational: 'Opérationnel',
      personal: 'Personnel',
    };
    return labels[category] || category;
  }

  private groupByStatus(items: any[]): { [key: string]: number } {
    return items.reduce((acc, item) => {
      acc[item.status] = (acc[item.status] || 0) + 1;
      return acc;
    }, {});
  }

  private groupByCategory(ambitions: Ambition[]): { [key: string]: number } {
    return ambitions.reduce((acc, ambition) => {
      acc[ambition.category] = (acc[ambition.category] || 0) + 1;
      return acc;
    }, {} as { [key: string]: number });
  }

  private groupOKRsByQuarter(okrs: OKR[]): { [key: string]: number } {
    return okrs.reduce((acc, okr) => {
      acc[okr.quarter] = (acc[okr.quarter] || 0) + 1;
      return acc;
    }, {} as { [key: string]: number });
  }

  private calculateAverageKRProgress(keyResults: KeyResult[]): number {
    if (keyResults.length === 0) return 0;

    const totalProgress = keyResults.reduce((sum, kr) => {
      const progress = kr.target > 0 ? (kr.current / kr.target) * 100 : 0;
      return sum + Math.min(progress, 100);
    }, 0);

    return Math.round(totalProgress / keyResults.length);
  }

  private calculateAverageQKRProgress(quarterlyKeyResults: QuarterlyKeyResult[]): number {
    if (quarterlyKeyResults.length === 0) return 0;

    const totalProgress = quarterlyKeyResults.reduce((sum, qkr) => {
      const progress = qkr.target > 0 ? (qkr.current / qkr.target) * 100 : 0;
      return sum + Math.min(progress, 100);
    }, 0);

    return Math.round(totalProgress / quarterlyKeyResults.length);
  }

  private calculateAverageOKRProgress(okrs: OKR[]): number {
    if (okrs.length === 0) return 0;

    const totalProgress = okrs.reduce((sum, okr) => {
      return sum + this.calculateOKRProgress(okr.id, okrs);
    }, 0);

    return Math.round(totalProgress / okrs.length);
  }

  private getOverdueActions(actions: Action[]): Action[] {
    const now = new Date();
    return actions.filter(action => {
      return action.deadline && new Date(action.deadline) < now && action.status !== 'done';
    });
  }

  // ===== Health score & risques (MVP) =====
  public calculateQuarterlyKRHealth(kr: QuarterlyKeyResult, actions: Action[]): number {
    const progress = kr.target > 0 ? Math.min(kr.current / kr.target, 1) : 0; // 0..1
    const now = new Date();
    const deadline = kr.deadline ? new Date(kr.deadline) : null;
    const days = deadline ? Math.ceil((+deadline - +now) / (1000 * 60 * 60 * 24)) : 30;
    const timeBuffer = Math.max(0, Math.min(days / 30, 1)); // 0..1 (≥30j => 1)

    // Pénalités basées sur actions en retard
    const krActions = actions.filter(a => a.quarterlyKeyResultId === kr.id);
    const overdue = krActions.filter(a => a.deadline && new Date(a.deadline) < now && a.status !== 'done').length;
    const overdueRatio = krActions.length > 0 ? overdue / krActions.length : 0;

    let score = 0.6 * progress + 0.4 * timeBuffer; // pondération simple
    score = score * (1 - 0.2 * overdueRatio); // pénalité max -20%
    return Math.round(score * 100);
  }

  public getKRHealthOverview(quarterlyKeyResults: QuarterlyKeyResult[], actions: Action[]): { averageHealth: number; items: Array<{ kr: QuarterlyKeyResult; health: number; riskLevel: 'high'|'medium'|'low'; reasons: string[] }>; } {
    if (quarterlyKeyResults.length === 0) {
      return { averageHealth: 0, items: [] };
    }
    const items = quarterlyKeyResults.map(kr => {
      const health = this.calculateQuarterlyKRHealth(kr, actions);
      const reasons: string[] = [];
      const now = new Date();
      const days = kr.deadline ? Math.ceil((+new Date(kr.deadline) - +now) / (1000*60*60*24)) : 30;
      const progress = kr.target > 0 ? Math.min(kr.current / kr.target, 1) : 0;
      if (days <= 7 && progress < 0.5) reasons.push('Échéance proche avec progression faible');
      const krActions = actions.filter(a => a.quarterlyKeyResultId === kr.id);
      const overdue = krActions.filter(a => a.deadline && new Date(a.deadline) < now && a.status !== 'done').length;
      if (overdue > 0) reasons.push(`${overdue} action(s) en retard`);
      const riskLevel: 'high'|'medium'|'low' = health < 50 ? 'high' : health < 70 ? 'medium' : 'low';
      return { kr, health, riskLevel, reasons };
    });
    const averageHealth = Math.round(items.reduce((s, i) => s + i.health, 0) / items.length);
    return { averageHealth, items };
  }

  public getRiskAlerts(quarterlyKeyResults: QuarterlyKeyResult[], actions: Action[]): Array<{ kr: QuarterlyKeyResult; level: 'high'|'medium'; reasons: string[] }>{
    const { items } = this.getKRHealthOverview(quarterlyKeyResults, actions);
    return items
      .filter(i => i.riskLevel !== 'low')
      .sort((a,b) => a.health - b.health)
      .slice(0, 5)
      .map(i => ({ kr: i.kr, level: i.riskLevel as 'high'|'medium', reasons: i.reasons }));
  }

}

// Instance singleton
export const analyticsService = AnalyticsService.getInstance();
