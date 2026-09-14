import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import { Zap, Calendar, Tag, AlertTriangle, Save, X, Users } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { AssigneeSelector } from '@/components/ui/AssigneeSelector';
import { ActionFormData, Priority, QuarterlyKeyResult, ActionAssigneeFormData } from '@/types';

// Schéma de validation
const actionSchema = z.object({
  title: z.string().min(3, 'Le titre doit contenir au moins 3 caractères'),
  description: z.string().optional(),
  priority: z.nativeEnum(Priority),
  labels: z.string().optional(),
  deadline: z.string().optional(),
  quarterlyKeyResultId: z.string().optional(),
  assignees: z.array(z.any()).optional(),
});

interface ActionFormProps {
  initialData?: Partial<ActionFormData>;
  onSubmit: (data: ActionFormData) => void;
  onCancel: () => void;
  isLoading?: boolean;
  quarterlyKeyResultTitle?: string;
  quarterlyKeyResults?: QuarterlyKeyResult[];
  allowKeyResultSelection?: boolean;
}

export const ActionForm: React.FC<ActionFormProps> = ({
  initialData,
  onSubmit,
  onCancel,
  isLoading = false,
  quarterlyKeyResultTitle,
  quarterlyKeyResults = [],
  allowKeyResultSelection = true,
}) => {
  // Convertir labels array en string si nécessaire
  const labelsString = initialData?.labels
    ? (Array.isArray(initialData.labels)
      ? initialData.labels.join(', ')
      : initialData.labels)
    : '';

  // État pour les assignés
  const [assignees, setAssignees] = useState<ActionAssigneeFormData[]>(initialData?.assignees || []);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isValid },
  } = useForm<ActionFormData>({
    resolver: zodResolver(actionSchema),
    defaultValues: {
      title: initialData?.title || '',
      description: initialData?.description || '',
      priority: initialData?.priority || Priority.MEDIUM,
      labels: labelsString,
      deadline: initialData?.deadline || '',
      quarterlyKeyResultId: initialData?.quarterlyKeyResultId || quarterlyKeyResults[0]?.id || '',
      assignees: initialData?.assignees || [],
    },
    mode: 'onChange',
  });

  // Handler de soumission avec assignés
  const handleFormSubmit = (data: ActionFormData) => {
    onSubmit({ ...data, assignees });
  };

  const priorityColors = {
    [Priority.LOW]: 'bg-gray-100 text-gray-800',
    [Priority.MEDIUM]: 'bg-blue-100 text-blue-800',
    [Priority.HIGH]: 'bg-orange-100 text-orange-800',
    [Priority.CRITICAL]: 'bg-red-100 text-red-800',
  };

  const priorityLabels = {
    [Priority.LOW]: 'Faible',
    [Priority.MEDIUM]: 'Moyenne',
    [Priority.HIGH]: 'Haute',
    [Priority.CRITICAL]: 'Critique',
  };

  // Suggestions de labels communes
  const commonLabels = [
    'marketing', 'ventes', 'développement', 'design', 'support', 'formation',
    'recherche', 'analyse', 'communication', 'stratégie', 'opérations', 'finance'
  ];

  const labelsValue = watch('labels');
  const selectedLabels = (typeof labelsValue === 'string' && labelsValue)
    ? labelsValue.split(',').map(l => l.trim()).filter(l => l)
    : [];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Zap className="h-5 w-5 text-green-600" />
            <span>
              {initialData ? 'Modifier l\'action' : 'Nouvelle action'}
            </span>
          </CardTitle>
          {quarterlyKeyResultTitle && (
            <p className="text-sm text-gray-600 mt-1">
              Pour le résultat clé: {quarterlyKeyResultTitle}
            </p>
          )}
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
            {/* Titre */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Titre de l'action *
              </label>
              <input
                type="text"
                {...register('title')}
                placeholder="Ex: Créer une campagne email pour les prospects"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
              {errors.title && (
                <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>
              )}
            </div>

            {/* Sélection de résultat clé trimestriel */}
            {allowKeyResultSelection && quarterlyKeyResults.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Résultat Clé (KR) (optionnel)
                </label>
                <select
                  {...register('quarterlyKeyResultId')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  <option value="">Sélectionner un résultat clé</option>
                  {quarterlyKeyResults.map((kr) => (
                    <option key={kr.id} value={kr.id}>
                      {kr.title} ({kr.current}/{kr.target} {kr.unit})
                    </option>
                  ))}
                </select>
                {errors.quarterlyKeyResultId && (
                  <p className="mt-1 text-sm text-red-600">{errors.quarterlyKeyResultId.message}</p>
                )}
              </div>
            )}

            {/* Affichage du KR sélectionné si pas de sélection */}
            {!allowKeyResultSelection && quarterlyKeyResultTitle && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <p className="text-sm text-green-800">
                  <strong>Résultat Clé :</strong> {quarterlyKeyResultTitle}
                </p>
              </div>
            )}

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description (optionnelle)
              </label>
              <textarea
                {...register('description')}
                rows={3}
                placeholder="Détails sur cette action, étapes à suivre, ressources nécessaires..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
              {errors.description && (
                <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
              )}
            </div>

            {/* Priorité */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <AlertTriangle className="inline h-4 w-4 mr-1" />
                Priorité *
              </label>
              <select
                {...register('priority')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                {Object.entries(priorityLabels).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
              {errors.priority && (
                <p className="mt-1 text-sm text-red-600">{errors.priority.message}</p>
              )}
              <div className="mt-2">
                <Badge className={priorityColors[watch('priority')]} size="sm">
                  {priorityLabels[watch('priority')]}
                </Badge>
              </div>
            </div>

            {/* Labels */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Tag className="inline h-4 w-4 mr-1" />
                Labels (optionnels)
              </label>
              <input
                type="text"
                {...register('labels')}
                placeholder="marketing, urgent, client-prioritaire (séparés par des virgules)"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
              <div className="mt-2 flex flex-wrap gap-1">
                {commonLabels.map((label) => (
                  <button
                    key={label}
                    type="button"
                    onClick={() => {
                      const currentLabels = watch('labels') || '';
                      const labelsArray = currentLabels.split(',').map(l => l.trim()).filter(l => l);
                      if (!labelsArray.includes(label)) {
                        const newLabels = [...labelsArray, label].join(', ');
                        setValue('labels', newLabels);
                      }
                    }}
                    className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded hover:bg-gray-200 transition-colors"
                  >
                    + {label}
                  </button>
                ))}
              </div>
              {selectedLabels.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {selectedLabels.map((label, index) => (
                    <Badge key={index} variant="secondary" size="sm">
                      {label}
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            {/* Date d'échéance */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Calendar className="inline h-4 w-4 mr-1" />
                Date d'échéance (optionnelle)
              </label>
              <input
                type="date"
                {...register('deadline')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
              {errors.deadline && (
                <p className="mt-1 text-sm text-red-600">{errors.deadline.message}</p>
              )}
            </div>

            {/* Assignés */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Users className="inline h-4 w-4 mr-1" />
                Affecter à (optionnel)
              </label>
              <AssigneeSelector
                value={assignees}
                onChange={setAssignees}
                className="mt-2"
              />
            </div>

            {/* Aperçu */}
            {watch('title') && (
              <div className="bg-green-50 p-4 rounded-lg">
                <h4 className="font-medium text-green-900 mb-2">Aperçu de l'action</h4>
                <div className="text-sm text-green-800">
                  <p><strong>Action:</strong> {watch('title')}</p>
                  <p><strong>Priorité:</strong> {priorityLabels[watch('priority')]}</p>
                  {selectedLabels.length > 0 && (
                    <p><strong>Labels:</strong> {selectedLabels.join(', ')}</p>
                  )}
                  {watch('deadline') && (
                    <p><strong>Échéance:</strong> {new Date(watch('deadline')!).toLocaleDateString('fr-FR')}</p>
                  )}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-end space-x-3 pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={isLoading}
              >
                <X className="h-4 w-4 mr-2" />
                Annuler
              </Button>
              <Button
                type="submit"
                disabled={!isValid || isLoading}
                isLoading={isLoading}
              >
                <Save className="h-4 w-4 mr-2" />
                {initialData ? 'Mettre à jour' : 'Créer l\'action'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </motion.div>
  );
};
