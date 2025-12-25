/**
 * Composant pour créer/éditer une séquence email
 * Date: 1er Février 2025
 */

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { BottomSheet, BottomSheetContent } from '@/components/ui/bottom-sheet';
import { MobileFormField } from '@/components/ui/mobile-form-field';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useCreateEmailSequence, useUpdateEmailSequence } from '@/hooks/email/useEmailSequences';
import { useResponsiveModal } from '@/hooks/use-responsive-modal';
import type { 
  EmailSequence, 
  CreateSequencePayload, 
  SequenceTriggerType,
  SequenceStatus,
} from '@/lib/email/email-sequence-service';
import { Loader2 } from 'lucide-react';

interface EmailSequenceBuilderProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  storeId: string;
  sequence?: EmailSequence | null;
  onSuccess?: () => void;
}

export const EmailSequenceBuilder = ({
  open,
  onOpenChange,
  storeId,
  sequence,
  onSuccess,
}: EmailSequenceBuilderProps) => {
  const { useBottomSheet } = useResponsiveModal();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [triggerType, setTriggerType] = useState<SequenceTriggerType>('event');
  const [status, setStatus] = useState<SequenceStatus>('active');
  const [triggerConfig, setTriggerConfig] = useState<Record<string, any>>({});

  const createSequence = useCreateEmailSequence();
  const updateSequence = useUpdateEmailSequence();

  const isEditing = !!sequence;

  useEffect(() => {
    if (sequence) {
      setName(sequence.name);
      setDescription(sequence.description || '');
      setTriggerType(sequence.trigger_type);
      setStatus(sequence.status);
      setTriggerConfig(sequence.trigger_config || {});
    } else {
      // Reset form
      setName('');
      setDescription('');
      setTriggerType('event');
      setStatus('active');
      setTriggerConfig({});
    }
  }, [sequence, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const payload: CreateSequencePayload = {
      store_id: storeId,
      name,
      description,
      trigger_type: triggerType,
      trigger_config: triggerConfig,
      status,
    };

    try {
      if (isEditing) {
        await updateSequence.mutateAsync({
          sequenceId: sequence!.id,
          payload,
        });
      } else {
        await createSequence.mutateAsync(payload);
      }
      onSuccess?.();
      onOpenChange(false);
    } catch (error) {
      // Error handling is done in the hooks
    }
  };

  const isLoading = createSequence.isPending || updateSequence.isPending;

  const formContent = (
    <form onSubmit={handleSubmit} className="space-y-4">
      <MobileFormField
        label="Nom de la séquence"
        name="name"
        type="text"
        value={name}
        onChange={setName}
        required
        fieldProps={{
          placeholder: "Séquence de bienvenue",
        }}
      />

      <MobileFormField
        label="Description"
        name="description"
        type="textarea"
        value={description}
        onChange={setDescription}
        fieldProps={{
          placeholder: "Description de la séquence...",
          rows: 3,
        }}
      />

      <MobileFormField
        label="Type de déclencheur"
        name="triggerType"
        type="select"
        value={triggerType}
        onChange={(value) => setTriggerType(value as SequenceTriggerType)}
        required
        description="Le déclencheur détermine quand la séquence démarre pour un utilisateur"
        selectOptions={[
          { value: 'event', label: 'Événement (inscription, achat, etc.)' },
          { value: 'time', label: 'Temps (après X jours/heures)' },
          { value: 'behavior', label: 'Comportement (panier abandonné, etc.)' },
        ]}
      />

      <MobileFormField
        label="Statut"
        name="status"
        type="select"
        value={status}
        onChange={(value) => setStatus(value as SequenceStatus)}
        required
        selectOptions={[
          { value: 'active', label: 'Active' },
          { value: 'paused', label: 'En pause' },
          { value: 'archived', label: 'Archivée' },
        ]}
      />

          {triggerType === 'event' && (
            <div className="p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
              <p className="text-sm text-blue-900 dark:text-blue-100 mb-2">
                Configuration de l'événement
              </p>
              <p className="text-xs text-blue-700 dark:text-blue-300">
                Les événements seront configurés lors de l'ajout des étapes de la séquence.
              </p>
            </div>
          )}

          {triggerType === 'time' && (
            <div className="p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
              <p className="text-sm text-blue-900 dark:text-blue-100 mb-2">
                Déclenchement temporel
              </p>
              <p className="text-xs text-blue-700 dark:text-blue-300">
                La séquence démarrera après un délai défini lors de l'ajout des étapes.
              </p>
            </div>
          )}

          {triggerType === 'behavior' && (
            <div className="p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
              <p className="text-sm text-blue-900 dark:text-blue-100 mb-2">
                Déclenchement comportemental
              </p>
              <p className="text-xs text-blue-700 dark:text-blue-300">
                La séquence démarrera selon le comportement de l'utilisateur (panier abandonné, etc.).
              </p>
            </div>
          )}

      <div className="flex flex-col sm:flex-row justify-end gap-2 pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => onOpenChange(false)}
          disabled={isLoading}
          className="w-full sm:w-auto"
        >
          Annuler
        </Button>
        <Button type="submit" disabled={isLoading} className="w-full sm:w-auto">
          {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          {isEditing ? 'Enregistrer' : 'Créer la séquence'}
        </Button>
      </div>
    </form>
  );

  return (
    <>
      {useBottomSheet ? (
        <BottomSheet open={open} onOpenChange={onOpenChange}>
          <BottomSheetContent
            title={isEditing ? 'Modifier la séquence' : 'Nouvelle séquence'}
            description={
              isEditing
                ? 'Modifiez les informations de votre séquence email'
                : 'Créez une nouvelle séquence d\'emails automatiques pour votre boutique'
            }
            className="max-h-[90vh] overflow-y-auto"
          >
            {formContent}
          </BottomSheetContent>
        </BottomSheet>
      ) : (
        <Dialog open={open} onOpenChange={onOpenChange}>
          <DialogContent className="max-w-[95vw] sm:max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {isEditing ? 'Modifier la séquence' : 'Nouvelle séquence'}
              </DialogTitle>
              <DialogDescription>
                {isEditing
                  ? 'Modifiez les informations de votre séquence email'
                  : 'Créez une nouvelle séquence d\'emails automatiques pour votre boutique'}
              </DialogDescription>
            </DialogHeader>
            {formContent}
          </DialogContent>
        </Dialog>
      )}
    </>
  );
};

