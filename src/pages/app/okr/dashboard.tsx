import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/router';
import { motion } from 'framer-motion';
import {
  Target,
  TrendingUp,
  Calendar,
  CheckCircle,
  Clock,
  Plus,
  BarChart3,
  Users,
  Zap,
} from 'lucide-react';
import { OkrShell } from '@/components/layout/OkrShell';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { UpgradeModal } from '@/components/subscription/UpgradeModal';
import { useAppStore } from '@/store/useAppStore';
import { useSubscription } from '@/hooks/useSubscription';
import { useAmbitions } from '@/hooks/useAmbitions';
import { useQuarterlyObjectives } from '@/hooks/useQuarterlyObjectives';
import { useQuarterlyKeyResultsByUser } from '@/hooks/useQuarterlyKeyResults';
import { useActions } from '@/hooks/useActions';
import { SubscriptionsService } from '@/services/db/subscriptions';
import { formatRelativeDate, getDaysUntilDeadline } from '@/utils';
import type { DashboardMetrics } from '@/types';

const DashboardPage: React.FC = () => {
  const router = useRouter();
  const { user } = useAppStore();
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  // React Query hooks
  const { data: subscription } = useSubscription(user?.id);
  const { data: ambitions = [], isLoading: ambitionsLoading } = useAmbitions(user?.id);
  const { data: quarterlyObjectives = [], isLoading: objectivesLoading } = useQuarterlyObjectives(user?.id);
  const { data: quarterlyKeyResults = [] } = useQuarterlyKeyResultsByUser(user?.id);
  const { data: actions = [], isLoading: actionsLoading } = useActions(user?.id);

  const [trendAnalysis] = useState<any>(null);

  // Handler pour créer une nouvelle ambition avec vérification des limites
  const handleCreateAmbition = async () => {
    if (!user) return;

    // Vérifier les limites avant de rediriger
    const canCreate = await SubscriptionsService.canCreateAmbition(user.id);
    if (!canCreate) {
      setShowUpgradeModal(true);
      return;
    }

    // Rediriger vers la page de gestion
    router.push('/app/okr/management');
  };

  // Calculer les métriques à partir des données React Query
  const metrics = useMemo<DashboardMetrics>(() => {
    if (!ambitions || !quarterlyObjectives || !actions) {
      return {
        totalAmbitions: 0,
        activeOKRs: 0,
        completedActions: 0,
        overallProgress: 0,
        monthlyProgress: 0,
        upcomingDeadlines: 0,
      };
    }

    // Calculer les métriques
    const totalAmbitions = ambitions.filter(a => a.status === 'active').length;
    const activeOKRs = quarterlyObjectives.filter(o => o.status === 'active').length;
    const completedActions = actions.filter(a => a.status === 'done').length;

    // Calculer la progression globale (moyenne des KRs)
    const overallProgress = quarterlyKeyResults.length > 0
      ? quarterlyKeyResults.reduce((sum, kr) => {
        const progress = kr.target > 0 ? (kr.current / kr.target) * 100 : 0;
        return sum + Math.min(progress, 100);
      }, 0) / quarterlyKeyResults.length
      : 0;

    // Échéances à venir (7 prochains jours)
    const upcomingDeadlines = actions.filter(
      a => a.deadline && getDaysUntilDeadline(a.deadline) <= 7 && getDaysUntilDeadline(a.deadline) > 0
    ).length;

    return {
      totalAmbitions,
      activeOKRs,
      completedActions,
      overallProgress,
      monthlyProgress: 0, // TODO: Calculer à partir de l'historique
      upcomingDeadlines,
    };
  }, [ambitions, quarterlyObjectives, actions]);

  // Prochaines échéances
  const upcomingDeadlines = useMemo(() => {
    return actions
      .filter(action => action.deadline && getDaysUntilDeadline(action.deadline) <= 7 && getDaysUntilDeadline(action.deadline) > 0)
      .map(action => ({
        id: action.id,
        title: action.title,
        type: 'Action',
        deadline: action.deadline!,
        daysLeft: getDaysUntilDeadline(action.deadline!),
      }))
      .sort((a, b) => a.daysLeft - b.daysLeft);
  }, [actions]);

  // Actions récentes
  const recentActions = useMemo(() => {
    return actions
      .filter(action => action.status === 'done')
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      .slice(0, 5);
  }, [actions]);

  const metricCards = [
    {
      title: 'Objectifs annuels',
      value: metrics.totalAmbitions,
      icon: Target,
      color: 'text-navy',
      bgColor: 'bg-navy/10',
      change: '+2 ce mois',
    },
    {
      title: 'OKRs Actifs',
      value: metrics.activeOKRs,
      icon: BarChart3,
      color: 'text-teal-dark',
      bgColor: 'bg-teal/10',
      change: '+1 ce trimestre',
    },
    {
      title: 'Actions Terminées',
      value: metrics.completedActions,
      icon: CheckCircle,
      color: 'text-teal-dark',
      bgColor: 'bg-teal/10',
      change: '+5 cette semaine',
    },
    {
      title: 'Échéances à venir',
      value: metrics.upcomingDeadlines,
      icon: Clock,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100',
      change: '7 prochains jours',
    },
  ];

  // État de chargement
  const isLoading = ambitionsLoading || objectivesLoading || actionsLoading;

  if (!user || isLoading) {
    return (
      <OkrShell title="Dashboard" topbarTitle="Dashboard OKR" topbarSubtitle="Vue d'ensemble de vos objectifs">
        <div className="flex items-center justify-center py-40">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-teal"></div>
        </div>
      </OkrShell>
    );
  }

  return (
    <OkrShell title="Dashboard" topbarTitle="Dashboard OKR" topbarSubtitle="Vue d'ensemble de vos objectifs">
      <div>
        {/* En-tête */}
        <div className="mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="text-3xl font-bold text-navy mb-2">
              Bonjour {user.name} ! 👋
            </h1>
            <p className="text-lg text-muted">
              Voici un aperçu de vos objectifs et de votre progression.
            </p>
          </motion.div>
        </div>

        {/* Métriques principales */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {metricCards.map((metric, index) => {
            const Icon = metric.icon;
            return (
              <motion.div
                key={metric.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
              >
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600 mb-1">
                          {metric.title}
                        </p>
                        <p className="text-3xl font-bold text-gray-900">
                          {metric.value}
                        </p>
                        <p className="text-sm text-gray-500 mt-1">
                          {metric.change}
                        </p>
                      </div>
                      <div className={`p-3 rounded-lg ${metric.bgColor}`}>
                        <Icon className={`h-6 w-6 ${metric.color}`} />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Colonne principale */}
          <div className="lg:col-span-2 space-y-8">
            {/* Progrès global */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center text-navy">
                    <TrendingUp className="h-5 w-5 mr-2 text-teal-dark" aria-hidden />
                    Progrès Global
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium text-gray-700">
                          Progression générale
                        </span>
                        <span className="text-sm text-gray-500">
                          {Math.round(metrics.overallProgress)}%
                        </span>
                      </div>
                      <ProgressBar
                        value={metrics.overallProgress}
                        size="lg"
                        animated
                      />
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium text-gray-700">
                          Progrès mensuel
                        </span>
                        <span className="text-sm text-gray-500">
                          {Math.round(metrics.monthlyProgress)}%
                        </span>
                      </div>
                      <ProgressBar
                        value={metrics.monthlyProgress}
                        size="md"
                      />
                    </div>

                    {trendAnalysis && (
                      <div className="flex items-center space-x-2 pt-2">
                        <div className={`p-1 rounded-full ${trendAnalysis.trend === 'up' ? 'bg-green-100' :
                            trendAnalysis.trend === 'down' ? 'bg-red-100' : 'bg-gray-100'
                          }`}>
                          <TrendingUp className={`h-4 w-4 ${trendAnalysis.trend === 'up' ? 'text-green-600' :
                              trendAnalysis.trend === 'down' ? 'text-red-600 rotate-180' : 'text-gray-600'
                            }`} />
                        </div>
                        <span className="text-sm text-gray-600">
                          {trendAnalysis.message}
                        </span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Objectifs annuels actifs */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.5 }}
            >
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <CardTitle className="flex items-center text-navy">
                      <Target className="h-5 w-5 mr-2 text-teal-dark" aria-hidden />
                      Mes Objectifs Annuels
                    </CardTitle>
                    <Button
                      size="sm"
                      onClick={handleCreateAmbition}
                      leftIcon={<Plus className="h-4 w-4" />}
                    >
                      Nouvel objectif annuel
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {ambitions.length > 0 ? (
                    <div className="space-y-4">
                      {ambitions.slice(0, 3).map((ambition) => {
                        // TODO: Calculer la progression réelle à partir des KR
                        const progress = 0;
                        return (
                          <div key={ambition.id} className="border rounded-lg p-4">
                            <div className="flex justify-between items-start mb-2">
                              <h4 className="font-medium text-gray-900">
                                {ambition.title}
                              </h4>
                              <Badge variant="info" size="sm">
                                {ambition.category}
                              </Badge>
                            </div>
                            <p className="text-sm text-gray-600 mb-3">
                              {ambition.description}
                            </p>
                            <ProgressBar
                              value={progress}
                              showLabel
                              label={`${progress}% complété`}
                            />
                          </div>
                        );
                      })}
                      {ambitions.length > 3 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => router.push('/app/okr/management')}
                          className="w-full"
                        >
                          Voir tous les objectifs annuels ({ambitions.length})
                        </Button>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Target className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">
                        Aucun objectif annuel défini
                      </h3>
                      <p className="text-gray-500 mb-4">
                        Commencez par définir vos objectifs pour cette année.
                      </p>
                      <Button
                        onClick={handleCreateAmbition}
                        leftIcon={<Plus className="h-4 w-4" />}
                      >
                        Créer mon premier objectif annuel
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Colonne latérale */}
          <div className="space-y-8">
            {/* Échéances à venir */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.6 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Calendar className="h-5 w-5 mr-2 text-orange-600" />
                    Échéances à venir
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {upcomingDeadlines.length > 0 ? (
                    <div className="space-y-3">
                      {upcomingDeadlines.slice(0, 5).map((item) => (
                        <div key={item.id} className="flex items-center space-x-3">
                          <div className={`p-1 rounded-full ${item.daysLeft <= 1 ? 'bg-red-100' :
                              item.daysLeft <= 3 ? 'bg-orange-100' : 'bg-yellow-100'
                            }`}>
                            <Clock className={`h-3 w-3 ${item.daysLeft <= 1 ? 'text-red-600' :
                                item.daysLeft <= 3 ? 'text-orange-600' : 'text-yellow-600'
                              }`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {item.title}
                            </p>
                            <p className="text-xs text-gray-500">
                              {item.type} • {item.daysLeft} jour{item.daysLeft > 1 ? 's' : ''}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-4">
                      <CheckCircle className="h-8 w-8 text-green-500 mx-auto mb-2" />
                      <p className="text-sm text-gray-500">
                        Aucune échéance urgente
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            {/* Actions récentes */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.7 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Zap className="h-5 w-5 mr-2 text-green-600" />
                    Actions récentes
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {recentActions.length > 0 ? (
                    <div className="space-y-3">
                      {recentActions.map((action) => (
                        <div key={action.id} className="flex items-center space-x-3">
                          <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {action.title}
                            </p>
                            <p className="text-xs text-gray-500">
                              Terminée {formatRelativeDate(action.updatedAt)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-4">
                      <Clock className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                      <p className="text-sm text-gray-500">
                        Aucune action récente
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>

            {/* Conseil IA du jour */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.8 }}
            >
              <Card className="bg-navy border-navy text-white">
                <CardHeader>
                  <CardTitle className="flex items-center text-teal">
                    <Users className="h-5 w-5 mr-2" aria-hidden />
                    Conseil IA du jour
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-white/80">
                    💡 Concentrez-vous sur vos 3 actions les plus importantes aujourd'hui.
                    La productivité vient de la prioritisation, pas de la multiplication des tâches.
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>

        {/* Upgrade Modal */}
        <UpgradeModal
          isOpen={showUpgradeModal}
          onClose={() => setShowUpgradeModal(false)}
          reason="ambitions"
          currentPlan={subscription?.planType}
        />
      </div>
    </OkrShell>
  );
};

export default DashboardPage;
