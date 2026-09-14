import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, TrendingUp, TrendingDown, Calendar, FileText, Minus } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Card, CardContent } from '@/components/ui/Card';
import { useAppStore } from '@/store/useAppStore';
import { useProgressHistory } from '@/hooks/useProgress';
import { formatDate } from '@/utils';
import type { QuarterlyKeyResult } from '@/types';

interface ProgressHistoryPanelProps {
  isOpen: boolean;
  onClose: () => void;
  keyResult: QuarterlyKeyResult;
}

export const ProgressHistoryPanel: React.FC<ProgressHistoryPanelProps> = ({
  isOpen,
  onClose,
  keyResult,
}) => {
  const { user } = useAppStore();

  // Récupérer l'historique de progression pour ce KR
  const { data: krProgresses = [] } = useProgressHistory(
    keyResult.id,
    user?.id
  );

  const getTrendIcon = (index: number) => {
    if (index === krProgresses.length - 1) return null; // Pas de tendance pour la première entrée
    
    const current = krProgresses[index].value;
    const previous = krProgresses[index + 1].value;
    
    if (current > previous) {
      return <TrendingUp className="h-4 w-4 text-green-600" />;
    } else if (current < previous) {
      return <TrendingDown className="h-4 w-4 text-red-600" />;
    } else {
      return <Minus className="h-4 w-4 text-gray-400" />;
    }
  };

  const getTrendBadge = (index: number) => {
    if (index === krProgresses.length - 1) return null;
    
    const current = krProgresses[index].value;
    const previous = krProgresses[index + 1].value;
    const diff = current - previous;
    
    if (diff === 0) return null;
    
    return (
      <Badge
        variant={diff > 0 ? 'success' : 'danger'}
        size="sm"
      >
        {diff > 0 ? '+' : ''}{diff.toFixed(1)}%
      </Badge>
    );
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 z-40"
          />

          {/* Panel */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 h-full w-full max-w-2xl bg-white shadow-2xl z-50 overflow-y-auto"
          >
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10">
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  Historique des progressions
                </h2>
                <p className="text-sm text-gray-600 mt-1">{keyResult.title}</p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                leftIcon={<X className="h-5 w-5" />}
              >
                Fermer
              </Button>
            </div>

            <div className="px-6 py-6">
              {/* Informations du KR */}
              <Card className="mb-6">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className="text-sm text-gray-600">Progression actuelle</p>
                      <p className="text-3xl font-bold text-blue-600">
                        {keyResult.target > 0
                          ? ((keyResult.current / keyResult.target) * 100).toFixed(1)
                          : 0}%
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-600">Valeur actuelle</p>
                      <p className="text-2xl font-semibold text-gray-900">
                        {keyResult.current} / {keyResult.target} {keyResult.unit}
                      </p>
                    </div>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className="bg-blue-600 h-3 rounded-full transition-all duration-500"
                      style={{
                        width: `${Math.min(
                          100,
                          keyResult.target > 0
                            ? (keyResult.current / keyResult.target) * 100
                            : 0
                        )}%`,
                      }}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Historique */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                  <Calendar className="h-5 w-5 mr-2 text-gray-600" />
                  Historique ({krProgresses.length} {krProgresses.length > 1 ? 'mises à jour' : 'mise à jour'})
                </h3>

                {krProgresses.length === 0 ? (
                  <Card>
                    <CardContent className="pt-6 text-center text-gray-500">
                      <FileText className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                      <p>Aucune mise à jour enregistrée pour ce résultat clé.</p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-3">
                    {krProgresses.map((progress: any, index: number) => (
                      <motion.div
                        key={progress.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                      >
                        <Card className="hover:shadow-md transition-shadow">
                          <CardContent className="pt-4">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center space-x-2 mb-2">
                                  {getTrendIcon(index)}
                                  <span className="text-sm font-medium text-gray-900">
                                    {formatDate(new Date(progress.recordedAt))}
                                  </span>
                                  <span className="text-xs text-gray-500">
                                    {new Date(progress.recordedAt).toLocaleTimeString('fr-FR', {
                                      hour: '2-digit',
                                      minute: '2-digit',
                                    })}
                                  </span>
                                  {getTrendBadge(index)}
                                </div>

                                <div className="flex items-center space-x-3 mb-2">
                                  <Badge variant="secondary" size="sm">
                                    {progress.value.toFixed(1)}%
                                  </Badge>
                                  <span className="text-sm text-gray-600">
                                    Enregistré par {progress.recordedBy}
                                  </span>
                                </div>

                                {progress.note && (
                                  <div className="mt-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                                    <div className="flex items-start space-x-2">
                                      <FileText className="h-4 w-4 text-gray-500 mt-0.5 flex-shrink-0" />
                                      <p className="text-sm text-gray-700 whitespace-pre-wrap">
                                        {progress.note}
                                      </p>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

