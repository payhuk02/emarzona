/**
 * Composant pour créer/éditer une étape de séquence
 * Date: 1er Février 2025
 */

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useEmailTemplates } from '@/hooks/useEmail';
import { useAddSequenceStep, useUpdateSequenceStep } from '@/hooks/email/useEmailSequences';
import type {
  EmailSequenceStep,
  CreateSequenceStepPayload,
  SequenceStepDelayType,
} from '@/lib/email/email-sequence-service';
import { Loader2 } from 'lucide-react';

interface SequenceStepEditorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sequenceId: string;
  step?: EmailSequenceStep | null;
  stepOrder?: number;
  onSuccess?: () => void;
}

export const SequenceStepEditor = ({
  open,
  onOpenChange,
  sequenceId,
  step,
  stepOrder,
  onSuccess,
}: SequenceStepEditorProps) => {
  const { t } = useTranslation();
  const [templateId, setTemplateId] = useState<string>('');
  const [delayType, setDelayType] = useState<SequenceStepDelayType>('days');
  const [delayValue, setDelayValue] = useState<number>(1);
  const [order, setOrder] = useState<number>(1);

  const { data: templates } = useEmailTemplates({ category: 'marketing' });
  const addStep = useAddSequenceStep();
  const updateStep = useUpdateSequenceStep();

  const isEditing = !!step;

  useEffect(() => {
    if (step) {
      setTemplateId(step.template_id || '');
      setDelayType(step.delay_type);
      setDelayValue(step.delay_value);
      setOrder(step.step_order);
    } else {
      // Reset form
      setTemplateId('');
      setDelayType('days');
      setDelayValue(1);
      setOrder(stepOrder || 1);
    }
  }, [step, open, stepOrder]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const payload: CreateSequenceStepPayload = {
      sequence_id: sequenceId,
      step_order: order,
      template_id: templateId || undefined,
      delay_type: delayType,
      delay_value: delayValue,
      conditions: {},
    };

    try {
      if (isEditing) {
        await updateStep.mutateAsync({
          stepId: step!.id,
          payload,
          sequenceId,
        });
      } else {
        await addStep.mutateAsync(payload);
      }
      onSuccess?.();
      onOpenChange(false);
    } catch (error) {
      // Error handling is done in the hooks
    }
  };

  const isLoading = addStep.isPending || updateStep.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? t('emails.sequences.editStep', 'Modifier l\'étape') : t('emails.sequences.newStep', 'Nouvelle étape')}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? t('emails.sequences.editStepDescription', 'Modifiez les paramètres de cette étape de la séquence')
              : t('emails.sequences.newStepDescription', 'Ajoutez une nouvelle étape à votre séquence d\'emails')}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="order">{t('emails.sequences.stepOrder', 'Ordre de l\'étape')} *</Label>
            <Input
              id="order"
              type="number"
              value={order}
              onChange={(e) => setOrder(parseInt(e.target.value) || 1)}
              min={1}
              required
            />
            <p className="text-xs text-muted-foreground mt-1">
              {t('emails.sequences.stepOrderDescription', 'L\'ordre détermine quand cette étape sera exécutée dans la séquence')}
            </p>
          </div>

          <div>
            <Label htmlFor="template">{t('emails.template', 'Template email')}</Label>
            <Select value={templateId || "__none__"} onValueChange={(value) => setTemplateId(value === "__none__" ? "" : value)}>
              <SelectTrigger id="template">
                <SelectValue placeholder={t('emails.selectTemplate', 'Sélectionner un template')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">{t('emails.noTemplate', 'Aucun template')}</SelectItem>
                {templates?.map((template) => (
                  <SelectItem key={template.id} value={template.id}>
                    {template.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground mt-1">
              {t('emails.sequences.templateDescription', 'Le template à utiliser pour cet email')}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="delayType">{t('emails.sequences.delayType', 'Type de délai')} *</Label>
              <Select
                value={delayType}
                onValueChange={(value) => setDelayType(value as SequenceStepDelayType)}
              >
                <SelectTrigger id="delayType">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="immediate">{t('emails.sequences.immediate', 'Immédiat')}</SelectItem>
                  <SelectItem value="minutes">{t('emails.sequences.minutes', 'Minutes')}</SelectItem>
                  <SelectItem value="hours">{t('emails.sequences.hours', 'Heures')}</SelectItem>
                  <SelectItem value="days">{t('emails.sequences.days', 'Jours')}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="delayValue">{t('emails.sequences.delayValue', 'Valeur')} *</Label>
              <Input
                id="delayValue"
                type="number"
                value={delayValue}
                onChange={(e) => setDelayValue(parseInt(e.target.value) || 0)}
                min={0}
                required
                disabled={delayType === 'immediate'}
              />
            </div>
          </div>

          {delayType !== 'immediate' && (
            <p className="text-xs text-muted-foreground">
              {t('emails.sequences.delayDescription', {
                value: delayValue,
                unit: delayType === 'days' ? t('emails.sequences.day', 'jour') : delayType === 'hours' ? t('emails.sequences.hour', 'heure') : t('emails.sequences.minute', 'minute'),
                plural: delayValue > 1 ? 's' : ''
              }, `Cette étape sera envoyée ${delayValue} ${delayType === 'days' ? 'jour' : delayType === 'hours' ? 'heure' : 'minute'}${delayValue > 1 ? 's' : ''} après l'étape précédente`)}
            </p>
          )}

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              {t('common.cancel', 'Annuler')}
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {isEditing ? t('common.save', 'Enregistrer') : t('emails.sequences.addStep', 'Ajouter l\'étape')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

