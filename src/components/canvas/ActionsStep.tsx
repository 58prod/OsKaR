import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { Plus, Edit2, Trash2, Zap, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { useCanvasStore } from '@/store/useCanvasStore';
import { useAppStore } from '@/store/useAppStore';
import { FORM_OPTIONS } from '@/constants';
import { formatDate } from '@/utils';
import type { ActionFormData } from '@/types';
import { Priority, ActionStatus } from '@/types';
import { useQuarterlyKeyResultsByUser } from '@/hooks/useQuarterlyKeyResults';
import { useCreateAction } from '@/hooks/useActions';

const ActionsStep: React.FC = () => {
  const [isEditing, setIsEditing] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  const { user } = useAppStore();

  const {
    actionsData,
    addAction,
    updateAction,
    removeAction,
    completeStep
  } = useCanvasStore();

  // React Query - Données
  const { data: quarterlyKeyResults = [] } = useQuarterlyKeyResultsByUser(user?.id);

  // React Query - Mutations
  const createAction = useCreateAction();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
  } = useForm<ActionFormData>({
    defaultValues: {
      title: '',
      description: '',
      deadline: '',
      priority: Priority.MEDIUM,
      labels: '',
    },
  });

  const onSubmit = async (data: ActionFormData) => {
    if (!user) return;

    try {
      if (isEditing && editingIndex !== null) {
        updateAction(editingIndex, data);
        setEditingIndex(null);
      } else {
        // Ajouter au Canvas store pour le workflow
        addAction(data);

        // Créer l'action dans Supabase si elle est liée à un KR
        if (data.quarterlyKeyResultId) {
          await createAction.mutateAsync({
            action: {
              quarterlyKeyResultId: data.quarterlyKeyResultId,
              title: data.title,
              description: data.description,
              deadline: data.deadline ? new Date(data.deadline) : undefined,
              priority: data.priority,
              status: ActionStatus.TODO,
              labels: data.labels ? data.labels.split(',').map(l => l.trim()).filter(l => l) : [],
            },
            userId: user.id
          });
        }
      }

      reset();
      setIsEditing(false);
    } catch (error) {
      console.error('❌ Erreur lors de la sauvegarde de l\'action:', error);
      alert('Erreur lors de la sauvegarde de l\'action');
    }
  };

  const handleEdit = (action: ActionFormData, index: number) => {
    setValue('title', action.title);
    setValue('description', action.description);
    setValue('deadline', action.deadline);
    setValue('priority', action.priority);
    setValue('labels', Array.isArray(action.labels) ? action.labels.join(', ') : action.labels);
    setEditingIndex(index);
    setIsEditing(true);
  };

  const handleCancel = () => {
    reset();
    setIsEditing(false);
    setEditingIndex(null);
  };

  const handleDelete = (index: number) => {
    removeAction(index);
  };

  return (
    <div className="space-y-6">
      {/* Introduction */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-6 border border-purple-200"
      >
        <div className="flex items-start space-x-4">
          <div className="bg-purple-100 rounded-lg p-3">
            <Zap className="h-6 w-6 text-purple-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-purple-900 mb-2">
              Planifiez vos actions concrètes
            </h3>
            <p className="text-purple-700 text-sm leading-relaxed">
              Identifiez les actions spécifiques à mener pour atteindre vos OKRs. 
              Chaque action doit être claire, avec une échéance et un responsable défini.
            </p>
          </div>
        </div>
      </motion.div>

      {/* Formulaire */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <Card>
          <CardHeader>
            <CardTitle>
              {isEditing ? 'Modifier l\'action' : 'Créer une nouvelle action'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <Input
                    label="Titre de l'action *"
                    placeholder="Ex: Lancer une campagne marketing digitale"
                    error={errors.title?.message}
                    {...register('title', { required: 'Le titre est requis' })}
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description *
                  </label>
                  <textarea
                    className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm placeholder-gray-400 shadow-sm transition-colors focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                    rows={3}
                    placeholder="Décrivez les étapes et ressources nécessaires..."
                    {...register('description', { required: 'La description est requise' })}
                  />
                  {errors.description && (
                    <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
                  )}
                </div>

                <div>
                  <Input
                    label="Date limite *"
                    type="date"
                    error={errors.deadline?.message}
                    {...register('deadline', { required: 'La date limite est requise' })}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Priorité *
                  </label>
                  <select
                    className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm transition-colors focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                    {...register('priority')}
                  >
                    {FORM_OPTIONS.PRIORITIES.map((priority) => (
                      <option key={priority.value} value={priority.value}>
                        {priority.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <Input
                    label="Labels (séparés par des virgules)"
                    type="text"
                    placeholder="urgent, marketing, développement"
                    {...register('labels')}
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3">
                {isEditing && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleCancel}
                  >
                    Annuler
                  </Button>
                )}
                <Button
                  type="submit"
                  leftIcon={<Plus className="h-4 w-4" />}
                >
                  {isEditing ? 'Modifier' : 'Ajouter l\'action'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </motion.div>

      {/* Liste des actions */}
      {actionsData.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Card>
            <CardHeader>
              <CardTitle>Mes actions ({actionsData.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {actionsData.map((action, index) => (
                  <div
                    key={index}
                    className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900 mb-1">
                          {action.title}
                        </h4>
                        <p className="text-sm text-gray-600 mb-2">
                          {action.description}
                        </p>
                        <div className="flex items-center space-x-4 text-sm">
                          {action.deadline && (
                            <span className="text-gray-500 flex items-center">
                              <Calendar className="h-3 w-3 mr-1" />
                              {formatDate(new Date(action.deadline))}
                            </span>
                          )}
                          <Badge
                            variant={action.priority === 'critical' ? 'danger' :
                                   action.priority === 'high' ? 'warning' : 'secondary'}
                            size="sm"
                          >
                            {FORM_OPTIONS.PRIORITIES.find(p => p.value === action.priority)?.label}
                          </Badge>
                          {action.labels && Array.isArray(action.labels) && action.labels.length > 0 && (
                            <div className="flex space-x-1">
                              {action.labels.map((label, idx) => (
                                <Badge key={idx} variant="secondary" size="sm">
                                  {label}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex space-x-2 ml-4">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleEdit(action, index)}
                          leftIcon={<Edit2 className="h-3 w-3" />}
                        >
                          Modifier
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDelete(index)}
                          leftIcon={<Trash2 className="h-3 w-3" />}
                        >
                          Supprimer
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Bouton Terminer */}
          <div className="flex justify-end mt-6">
            <Button
              onClick={() => completeStep(3)}
              size="lg"
            >
              Terminer le Canvas
            </Button>
          </div>
        </motion.div>
      )}

      {/* Message d'encouragement */}
      {actionsData.length === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="text-center py-8"
        >
          <Zap className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Planifiez vos premières actions
          </h3>
          <p className="text-gray-500">
            Identifiez 3-5 actions concrètes qui vous rapprocheront de vos objectifs.
          </p>
        </motion.div>
      )}
    </div>
  );
};

export { ActionsStep };
