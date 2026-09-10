/**
 * Modal pour inviter l'utilisateur à upgrader son plan
 */

import React from 'react';
import { useRouter } from 'next/router';
import { X, TrendingUp, Zap, Users, Target, Crown } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { motion, AnimatePresence } from 'framer-motion';

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  reason: 'ambitions' | 'users' | 'feature';
  currentPlan?: string;
  featureName?: string;
}

export const UpgradeModal: React.FC<UpgradeModalProps> = ({
  isOpen,
  onClose,
  reason,
  currentPlan = 'free',
  featureName,
}) => {
  const router = useRouter();

  const handleUpgrade = () => {
    onClose();
    router.push('/pricing');
  };

  const getContent = () => {
    switch (reason) {
      case 'ambitions':
        return {
          icon: <Target className="h-12 w-12 text-orange-500" />,
          title: 'Limite d\'objectifs annuels atteinte',
          description: 'Vous avez atteint le nombre maximum d\'objectifs annuels pour votre plan actuel.',
          benefits: [
            'Objectifs annuels illimités',
            'IA coach illimitée',
            'Exports avancés',
            'Analytics détaillés',
          ],
          suggestedPlan: 'Pro',
          suggestedPrice: '19€/mois',
        };
      case 'users':
        return {
          icon: <Users className="h-12 w-12 text-blue-500" />,
          title: 'Limite d\'utilisateurs atteinte',
          description: 'Vous avez atteint le nombre maximum d\'utilisateurs pour votre plan actuel.',
          benefits: [
            currentPlan === 'free' ? 'Jusqu\'à 5 utilisateurs' : 'Jusqu\'à 20 utilisateurs',
            'Rôles et permissions',
            'Collaboration avancée',
            'Support prioritaire',
          ],
          suggestedPlan: currentPlan === 'free' ? 'Pro' : 'Team',
          suggestedPrice: currentPlan === 'free' ? '19€/mois' : '49€/mois',
        };
      case 'feature':
        return {
          icon: <Zap className="h-12 w-12 text-purple-500" />,
          title: `Fonctionnalité ${featureName || ''} non disponible`,
          description: `Cette fonctionnalité n'est pas incluse dans votre plan ${currentPlan}.`,
          benefits: [
            'Toutes les fonctionnalités',
            'Analytics avancés',
            'Intégrations',
            'Support prioritaire',
          ],
          suggestedPlan: 'Pro',
          suggestedPrice: '19€/mois',
        };
      default:
        return {
          icon: <Crown className="h-12 w-12 text-yellow-500" />,
          title: 'Passez au niveau supérieur',
          description: 'Débloquez toutes les fonctionnalités d\'Oskar.',
          benefits: [
            'Fonctionnalités illimitées',
            'Support prioritaire',
            'Analytics avancés',
            'Intégrations',
          ],
          suggestedPlan: 'Pro',
          suggestedPrice: '19€/mois',
        };
    }
  };

  const content = getContent();

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black bg-opacity-50 z-50"
          />

          {/* Modal */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden"
            >
              {/* Header */}
              <div className="relative bg-gradient-to-br from-blue-50 to-purple-50 p-6 pb-8">
                <button
                  onClick={onClose}
                  className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>

                <div className="flex flex-col items-center text-center">
                  <div className="mb-4 p-3 bg-white rounded-full shadow-md">
                    {content.icon}
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    {content.title}
                  </h2>
                  <p className="text-gray-600">
                    {content.description}
                  </p>
                </div>
              </div>

              {/* Content */}
              <div className="p-6">
                {/* Plan suggéré */}
                <div className="mb-6 p-4 bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl text-white">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <div className="flex items-center space-x-2 mb-1">
                        <h3 className="text-lg font-bold">Plan {content.suggestedPlan}</h3>
                        <Badge className="bg-white bg-opacity-20 text-white border-white border">
                          Recommandé
                        </Badge>
                      </div>
                      <p className="text-blue-100 text-sm">
                        Parfait pour votre croissance
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold">{content.suggestedPrice}</div>
                    </div>
                  </div>
                </div>

                {/* Bénéfices */}
                <div className="mb-6">
                  <h4 className="text-sm font-semibold text-gray-900 mb-3">
                    Ce que vous débloquez :
                  </h4>
                  <ul className="space-y-2">
                    {content.benefits.map((benefit, index) => (
                      <li key={index} className="flex items-start">
                        <svg
                          className="w-5 h-5 text-green-500 mr-2 flex-shrink-0 mt-0.5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                        <span className="text-sm text-gray-700">{benefit}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Actions */}
                <div className="space-y-3">
                  <Button
                    onClick={handleUpgrade}
                    variant="primary"
                    size="lg"
                    className="w-full"
                    rightIcon={<TrendingUp className="h-5 w-5" />}
                  >
                    Voir les plans
                  </Button>
                  <Button
                    onClick={onClose}
                    variant="ghost"
                    size="lg"
                    className="w-full"
                  >
                    Plus tard
                  </Button>
                </div>

                {/* Note */}
                <p className="mt-4 text-xs text-center text-gray-500">
                  14 jours d'essai gratuit • Annulation à tout moment
                </p>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
};

