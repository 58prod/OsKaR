import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Edit2, Trash2, Target, Calendar, Building2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { useCanvasStore } from '@/store/useCanvasStore';
import { useAppStore } from '@/store/useAppStore';
import type { QuarterlyObjectiveFormData, Quarter } from '@/types';
import { Status } from '@/types';
import { QuarterlyObjectiveForm } from '@/components/forms/QuarterlyObjectiveForm';
import { QuarterlyKeyResultForm } from '@/components/forms/QuarterlyKeyResultForm';
import { useAmbitions } from '@/hooks/useAmbitions';
import { useCreateQuarterlyObjective } from '@/hooks/useQuarterlyObjectives';
import { useCreateQuarterlyKeyResult } from '@/hooks/useQuarterlyKeyResults';

const QuarterlyObjectivesStep: React.FC = () => {
  const [isEditing, setIsEditing] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [showKRForm, setShowKRForm] = useState(false);
  const [selectedObjectiveIndex, setSelectedObjectiveIndex] = useState<number | null>(null);

  const { user } = useAppStore();

  const {
    quarterlyObjectivesData,
    quarterlyKeyResultsData,
    addQuarterlyObjective,
    updateQuarterlyObjective,
    removeQuarterlyObjective,
    addQuarterlyKeyResult,
    completeStep
  } = useCanvasStore();

  // React Query - Données
  const { data: ambitions = [] } = useAmbitions(user?.id);

  // React Query - Mutations
  const createObjective = useCreateQuarterlyObjective();
  const createKeyResult = useCreateQuarterlyKeyResult();

  const quarterLabels = {
    Q1: 'T1 (Jan-Mar)',
    Q2: 'T2 (Avr-Juin)',
    Q3: 'T3 (Juil-Sep)',
    Q4: 'T4 (Oct-Déc)',
  };

  const onSubmitObjective = async (data: QuarterlyObjectiveFormData) => {
    if (!user) return;

    try {
      if (isEditing && editingIndex !== null) {
        updateQuarterlyObjective(editingIndex, data);
        setEditingIndex(null);
      } else {
        // Créer l'objectif dans Supabase via React Query
        const newObjective = await createObjective.mutateAsync({
          objective: {
            ...data,
            status: Status.DRAFT,
          },
          userId: user.id
        });

        // Ajouter aussi au Canvas store pour le workflow
        addQuarterlyObjective({ ...data, id: newObjective.id });
      }

      setIsEditing(false);
    } catch (error) {
      console.error('❌ Erreur lors de la sauvegarde de l\'objectif:', error);
      alert('Erreur lors de la sauvegarde de l\'objectif');
    }
  };

  const onSubmitKeyResult = async (data: any) => {
    if (!user || selectedObjectiveIndex === null) return;

    try {
      // Récupérer l'objectif trimestriel correspondant
      const selectedObjective = quarterlyObjectivesData[selectedObjectiveIndex];

      // Vérifier que l'objectif a un ID
      if (!selectedObjective.id) {
        console.error('L\'objectif trimestriel n\'a pas d\'ID');
        return;
      }

      // Créer le KR dans Supabase via React Query
      await createKeyResult.mutateAsync({
        keyResult: {
          ...data,
          quarterlyObjectiveId: selectedObjective.id,
          deadline: new Date(data.deadline),
        },
        userId: user.id
      });

      // Ajouter aussi au Canvas store pour le workflow
      addQuarterlyKeyResult(selectedObjectiveIndex, data);

      setShowKRForm(false);
      setSelectedObjectiveIndex(null);
    } catch (error) {
      console.error('❌ Erreur lors de la sauvegarde du KR:', error);
      alert('Erreur lors de la sauvegarde du KR');
    }
  };

  const handleEdit = (index: number) => {
    setEditingIndex(index);
    setIsEditing(true);
  };

  const handleDelete = (index: number) => {
    removeQuarterlyObjective(index);
  };

  const handleAddKeyResult = (objectiveIndex: number) => {
    setSelectedObjectiveIndex(objectiveIndex);
    setShowKRForm(true);
  };

  const handleComplete = () => {
    if (quarterlyObjectivesData.length > 0) {
      completeStep(2); // Étape 2 = Objectifs Trimestriels
    }
  };

  const getAmbitionTitle = (ambitionId: string) => {
    const ambition = ambitions.find((a: { id: string }) => a.id === ambitionId);
    return ambition?.title || 'Objectif annuel inconnu';
  };

  if (isEditing || !isEditing && quarterlyObjectivesData.length === 0) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <QuarterlyObjectiveForm
          initialData={editingIndex !== null ? quarterlyObjectivesData[editingIndex] : undefined}
          ambitions={ambitions}
          onSubmit={onSubmitObjective}
          onCancel={() => {
            setIsEditing(false);
            setEditingIndex(null);
          }}
        />
      </div>
    );
  }

  if (showKRForm && selectedObjectiveIndex !== null) {
    const selectedObjective = quarterlyObjectivesData[selectedObjectiveIndex];
    return (
      <div className="max-w-4xl mx-auto p-6">
        <QuarterlyKeyResultForm
          quarterlyObjectiveTitle={selectedObjective?.title}
          onSubmit={onSubmitKeyResult}
          onCancel={() => {
            setShowKRForm(false);
            setSelectedObjectiveIndex(null);
          }}
        />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* En-tête */}
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Vos Objectifs Trimestriels
          </h2>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            Déclinez vos ambitions en objectifs trimestriels concrets avec leurs propres résultats clés.
            Ces objectifs vous permettront de structurer votre progression tout au long de l'année.
          </p>
        </div>

        {/* Alerte si plus de 3 objectifs */}
        {quarterlyObjectivesData.length > 3 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6"
          >
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-amber-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <h3 className="text-sm font-medium text-amber-800">
                  Attention : Trop d'objectifs trimestriels
                </h3>
                <p className="text-sm text-amber-700 mt-1">
                  Vous avez défini {quarterlyObjectivesData.length} objectifs trimestriels. Il est recommandé de ne pas dépasser 3 objectifs par trimestre pour maintenir un focus efficace et éviter la dispersion.
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Liste des objectifs trimestriels */}
        <div className="space-y-6">
          {quarterlyObjectivesData.map((objective, index) => {
            const keyResults = quarterlyKeyResultsData[index] || [];

            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="border-l-4 border-blue-500">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="flex items-center space-x-2 mb-2">
                          <Target className="h-5 w-5 text-blue-600" />
                          <span>{objective.title}</span>
                        </CardTitle>
                        <p className="text-gray-600 mb-3">{objective.description}</p>

                        <div className="flex items-center space-x-3">
                          <Badge variant="info" size="sm">
                            <Building2 className="h-3 w-3 mr-1" />
                            {getAmbitionTitle(objective.ambitionId)}
                          </Badge>
                          <Badge variant="secondary" size="sm">
                            <Calendar className="h-3 w-3 mr-1" />
                            {quarterLabels[objective.quarter as Quarter]} {objective.year}
                          </Badge>
                          <Badge variant="success" size="sm">
                            {keyResults.length} résultat{keyResults.length > 1 ? 's' : ''} clé{keyResults.length > 1 ? 's' : ''}
                          </Badge>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleAddKeyResult(index)}
                        >
                          <Plus className="h-4 w-4 mr-1" />
                          KR
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleEdit(index)}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDelete(index)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>

                  {keyResults.length > 0 && (
                    <CardContent>
                      <h4 className="font-medium text-gray-900 mb-3">Résultats clés trimestriels :</h4>
                      <div className="space-y-2">
                        {keyResults.map((kr, krIndex) => (
                          <div key={krIndex} className="bg-green-50 border border-green-200 rounded-lg p-3">
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <h5 className="font-medium text-green-900">{kr.title}</h5>
                                <p className="text-sm text-green-700">{kr.description}</p>
                                <div className="flex items-center space-x-2 mt-2">
                                  <span className="text-sm text-green-600">
                                    {kr.current}/{kr.target} {kr.unit}
                                  </span>
                                  {kr.deadline && (
                                    <Badge variant="secondary" size="sm">
                                      Échéance: {new Date(kr.deadline).toLocaleDateString('fr-FR')}
                                    </Badge>
                                  )}
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="text-lg font-bold text-green-600">
                                  {kr.target > 0 ? Math.round((kr.current / kr.target) * 100) : 0}%
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  )}
                </Card>
              </motion.div>
            );
          })}
        </div>

        {/* Actions */}
        <div className="flex justify-between items-center mt-8 pt-6 border-t">
          <Button
            variant="outline"
            onClick={() => setIsEditing(true)}
          >
            <Plus className="h-4 w-4 mr-2" />
            Ajouter un objectif trimestriel
          </Button>

          <Button
            onClick={handleComplete}
            disabled={quarterlyObjectivesData.length === 0}
            size="lg"
          >
            Continuer vers les actions
          </Button>
        </div>

        {/* Message d'aide */}
        {quarterlyObjectivesData.length === 0 && (
          <div className="text-center py-12">
            <Target className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Aucun objectif trimestriel défini
            </h3>
            <p className="text-gray-600 mb-4">
              Créez votre premier objectif trimestriel pour structurer votre progression.
            </p>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default QuarterlyObjectivesStep;
