/**
 * Composant pour afficher et gérer les étapes d'une séquence
 * Date: 1er Février 2025
 */

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Plus, Mail, Clock, Trash2, Edit } from 'lucide-react';
import { useEmailSequenceSteps } from '@/hooks/email/useEmailSequences';
import { useDeleteSequenceStep } from '@/hooks/email/useEmailSequences';
import type { EmailSequenceStep, SequenceStepDelayType } from '@/lib/email/email-sequence-service';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface SequenceStepsListProps {
  sequenceId: string;
  onAddStep?: () => void;
  onEditStep?: (step: EmailSequenceStep) => void;
}

const DELAY_LABELS: Record<SequenceStepDelayType, string> = {
  immediate: 'Immédiat',
  minutes: 'Minutes',
  hours: 'Heures',
  days: 'Jours',
};

function formatDelay(delayType: SequenceStepDelayType, delayValue: number): string {
  if (delayType === 'immediate') {
    return 'Immédiatement';
  }
  
  const value = delayValue || 0;
  const type = DELAY_LABELS[delayType];
  
  if (value === 1) {
    return `1 ${type.slice(0, -1)}`;
  }
  
  return `${value} ${type}`;
}

export const SequenceStepsList = ({
  sequenceId,
  onAddStep,
  onEditStep,
}: SequenceStepsListProps) => {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [stepToDelete, setStepToDelete] = useState<string | null>(null);

  const { data: steps, isLoading, refetch } = useEmailSequenceSteps(sequenceId);
  const deleteStep = useDeleteSequenceStep();

  const handleDelete = async () => {
    if (!stepToDelete) return;
    
    // Trouver le step pour obtenir le sequenceId
    const step = steps?.find((s) => s.id === stepToDelete);
    if (!step) return;

    await deleteStep.mutateAsync({
      stepId: stepToDelete,
      sequenceId: step.sequence_id,
    });
    setDeleteDialogOpen(false);
    setStepToDelete(null);
    refetch();
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-center text-muted-foreground">Chargement des étapes...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Étapes de la séquence</CardTitle>
              <CardDescription>
                Configurez les emails qui seront envoyés dans cette séquence ({steps?.length || 0} étape{steps?.length !== 1 ? 's' : ''})
              </CardDescription>
            </div>
            {onAddStep && (
              <Button onClick={onAddStep} size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Ajouter une étape
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {!steps || steps.length === 0 ? (
            <div className="text-center py-12">
              <Mail className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground mb-4">Aucune étape pour le moment</p>
              {onAddStep && (
                <Button onClick={onAddStep}>
                  <Plus className="h-4 w-4 mr-2" />
                  Ajouter la première étape
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {steps.map((step, index) => (
                <div
                  key={step.id}
                  className="p-4 border rounded-lg flex items-start justify-between gap-4"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-semibold">
                        {step.step_order}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-medium">
                            Étape {step.step_order}
                          </h4>
                          <Badge variant="outline" className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {formatDelay(step.delay_type, step.delay_value)}
                          </Badge>
                          {step.template_id && (
                            <Badge variant="secondary">Template configuré</Badge>
                          )}
                        </div>
                        {step.conditions && Object.keys(step.conditions).length > 0 && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Conditions définies
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {onEditStep && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onEditStep(step)}
                        aria-label={`Modifier l'étape ${step.name || step.id}`}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        setStepToDelete(step.id);
                        setDeleteDialogOpen(true);
                      }}
                      className="text-destructive hover:text-destructive"
                      aria-label={`Supprimer l'étape ${step.name || step.id}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog de confirmation de suppression */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer l'étape ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. L'étape sera définitivement supprimée de la séquence.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

