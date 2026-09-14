/**
 * Onglet de gestion de l'abonnement dans les settings
 */

import React from 'react';
import { useRouter } from 'next/router';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { useSubscription, useSubscriptionUsage } from '@/hooks/useSubscription';
import { CreditCard, TrendingUp, Users, Target, Zap, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

interface SubscriptionTabProps {
  userId: string;
}

export const SubscriptionTab: React.FC<SubscriptionTabProps> = ({ userId }) => {
  const router = useRouter();
  const { data: subscription, isLoading: subscriptionLoading } = useSubscription(userId);
  const { data: usage, isLoading: usageLoading } = useSubscriptionUsage(userId);

  const isLoading = subscriptionLoading || usageLoading;

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!subscription) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-gray-600">Aucun abonnement trouvé</p>
        </CardContent>
      </Card>
    );
  }

  const planColors = {
    free: 'bg-gray-100 text-gray-800',
    pro: 'bg-blue-100 text-blue-800',
    team: 'bg-purple-100 text-purple-800',
    unlimited: 'bg-gradient-to-r from-yellow-100 to-orange-100 text-orange-800',
  };

  const planNames = {
    free: 'Free',
    pro: 'Pro',
    team: 'Team',
    unlimited: 'Unlimited',
  };

  const getUsagePercentage = (current: number, max: number) => {
    if (max === Infinity || max === -1) return 0;
    return Math.min((current / max) * 100, 100);
  };

  const getUsageColor = (percentage: number) => {
    if (percentage >= 90) return 'bg-red-500';
    if (percentage >= 70) return 'bg-orange-500';
    return 'bg-green-500';
  };

  return (
    <div className="space-y-6">
      {/* Plan actuel */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <CreditCard className="h-5 w-5 mr-2" />
            Plan actuel
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-6">
            <div>
              <div className="flex items-center space-x-3 mb-2">
                <h3 className="text-2xl font-bold text-gray-900">
                  {planNames[subscription.planType as keyof typeof planNames]}
                </h3>
                <Badge className={planColors[subscription.planType as keyof typeof planColors]}>
                  {subscription.status === 'active' ? 'Actif' : subscription.status}
                </Badge>
              </div>
              {subscription.plan && (
                <p className="text-gray-600">{subscription.plan.description}</p>
              )}
            </div>
            {subscription.plan && subscription.plan.priceMonthly > 0 && (
              <div className="text-right">
                <div className="text-3xl font-bold text-gray-900">
                  {subscription.plan.priceMonthly}€
                </div>
                <div className="text-sm text-gray-600">par mois</div>
              </div>
            )}
          </div>

          {/* Informations de facturation */}
          {subscription.stripeSubscriptionId && (
            <div className="border-t border-gray-200 pt-4 mt-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Cycle de facturation</span>
                  <p className="font-medium text-gray-900">
                    {subscription.billingCycle === 'yearly' ? 'Annuel' : 'Mensuel'}
                  </p>
                </div>
                <div>
                  <span className="text-gray-600">Début de l'abonnement</span>
                  <p className="font-medium text-gray-900">
                    {new Date(subscription.startedAt).toLocaleDateString('fr-FR')}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex space-x-3 mt-6">
            <Button
              onClick={() => router.push('/pricing')}
              variant="primary"
              leftIcon={<TrendingUp className="h-4 w-4" />}
            >
              Changer de plan
            </Button>
            {subscription.planType !== 'free' && (
              <Button
                variant="outline"
                onClick={() => {
                  // TODO: Implémenter la gestion de l'abonnement Stripe
                  alert('Gestion de l\'abonnement Stripe à venir');
                }}
              >
                Gérer la facturation
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Utilisation */}
      {usage && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Zap className="h-5 w-5 mr-2" />
              Utilisation
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Objectifs annuels */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center">
                  <Target className="h-5 w-5 text-gray-400 mr-2" />
                  <span className="font-medium text-gray-900">Objectifs annuels</span>
                </div>
                <span className="text-sm text-gray-600">
                  {usage.currentAmbitions} / {usage.maxAmbitions === Infinity ? '∞' : usage.maxAmbitions}
                </span>
              </div>
              {usage.maxAmbitions !== Infinity && (
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${getUsagePercentage(usage.currentAmbitions, usage.maxAmbitions)}%` }}
                    transition={{ duration: 0.5 }}
                    className={`h-2 rounded-full ${getUsageColor(getUsagePercentage(usage.currentAmbitions, usage.maxAmbitions))}`}
                  />
                </div>
              )}
              {!usage.canCreateAmbition && (
                <p className="text-sm text-orange-600 mt-2">
                  ⚠️ Limite atteinte. Passez à un plan supérieur pour créer plus d'objectifs annuels.
                </p>
              )}
            </div>

            {/* Utilisateurs */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center">
                  <Users className="h-5 w-5 text-gray-400 mr-2" />
                  <span className="font-medium text-gray-900">Utilisateurs</span>
                </div>
                <span className="text-sm text-gray-600">
                  {usage.currentUsers} / {usage.maxUsers === Infinity ? '∞' : usage.maxUsers}
                </span>
              </div>
              {usage.maxUsers !== Infinity && (
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${getUsagePercentage(usage.currentUsers, usage.maxUsers)}%` }}
                    transition={{ duration: 0.5 }}
                    className={`h-2 rounded-full ${getUsageColor(getUsagePercentage(usage.currentUsers, usage.maxUsers))}`}
                  />
                </div>
              )}
              {!usage.canAddUser && (
                <p className="text-sm text-orange-600 mt-2">
                  ⚠️ Limite atteinte. Passez à un plan supérieur pour ajouter plus d'utilisateurs.
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Features disponibles */}
      {subscription.plan && (
        <Card>
          <CardHeader>
            <CardTitle>Fonctionnalités incluses</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries(subscription.plan.features).map(([key, value]) => {
                let displayValue = value;
                const displayKey = key.replace(/_/g, ' ');

                // Formater les valeurs
                if (typeof value === 'boolean') {
                  displayValue = value ? '✓ Inclus' : '✗ Non inclus';
                } else if (typeof value === 'number') {
                  displayValue = value === -1 ? 'Illimité' : value;
                } else if (typeof value === 'string') {
                  displayValue = value.charAt(0).toUpperCase() + value.slice(1);
                }

                return (
                  <div key={key} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm text-gray-700 capitalize">{displayKey}</span>
                    <span className="text-sm font-medium text-gray-900">{String(displayValue)}</span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* CTA Upgrade */}
      {subscription.planType === 'free' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl p-8 text-white"
        >
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-2xl font-bold mb-2">Passez au plan Pro</h3>
              <p className="text-blue-100 mb-4">
                Débloquez toutes les fonctionnalités et boostez votre productivité
              </p>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center">
                  <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  Objectifs annuels illimités
                </li>
                <li className="flex items-center">
                  <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  IA coach illimitée
                </li>
                <li className="flex items-center">
                  <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  Jusqu'à 5 utilisateurs
                </li>
              </ul>
            </div>
            <Button
              onClick={() => router.push('/pricing')}
              variant="secondary"
              size="lg"
              rightIcon={<ArrowRight className="h-5 w-5" />}
              className="bg-white text-blue-600 hover:bg-gray-100"
            >
              Voir les plans
            </Button>
          </div>
        </motion.div>
      )}
    </div>
  );
};

