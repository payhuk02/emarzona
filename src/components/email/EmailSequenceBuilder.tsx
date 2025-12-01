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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useCreateEmailSequence, useUpdateEmailSequence } from '@/hooks/email/useEmailSequences';
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
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

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Nom de la séquence *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Séquence de bienvenue"
              required
            />
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Description de la séquence..."
              rows={3}
            />
          </div>

          <div>
            <Label htmlFor="triggerType">Type de déclencheur *</Label>
            <Select 
              value={triggerType} 
              onValueChange={(value) => setTriggerType(value as SequenceTriggerType)}
            >
              <SelectTrigger id="triggerType">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="event">Événement (inscription, achat, etc.)</SelectItem>
                <SelectItem value="time">Temps (après X jours/heures)</SelectItem>
                <SelectItem value="behavior">Comportement (panier abandonné, etc.)</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground mt-1">
              Le déclencheur détermine quand la séquence démarre pour un utilisateur
            </p>
          </div>

          <div>
            <Label htmlFor="status">Statut *</Label>
            <Select 
              value={status} 
              onValueChange={(value) => setStatus(value as SequenceStatus)}
            >
              <SelectTrigger id="status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="paused">En pause</SelectItem>
                <SelectItem value="archived">Archivée</SelectItem>
              </SelectContent>
            </Select>
          </div>

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

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Annuler
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {isEditing ? 'Enregistrer' : 'Créer la séquence'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

