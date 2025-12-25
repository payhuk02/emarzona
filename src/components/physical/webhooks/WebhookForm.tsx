/**
 * WebhookForm - Formulaire de création/édition de webhook produits physiques
 * Date: 2025-01-27
 */

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  useCreateWebhook,
  useUpdateWebhook,
  useWebhook,
  WEBHOOK_EVENTS,
} from '@/hooks/physical/usePhysicalWebhooks';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from '@/components/icons';
import { Skeleton } from '@/components/ui/skeleton';
import type { WebhookEventType } from '@/types/webhooks';

interface WebhookFormProps {
  webhookId?: string;
  storeId: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export const WebhookForm = ({ webhookId, storeId, onSuccess, onCancel }: WebhookFormProps) => {
  const { toast } = useToast();
  const { data: existingWebhook, isLoading: isLoadingWebhook } = useWebhook(webhookId);
  const createWebhook = useCreateWebhook();
  const updateWebhook = useUpdateWebhook();

  const [formData, setFormData] = useState({
    event_type: '',
    target_url: '',
    is_active: true,
  });

  useEffect(() => {
    if (existingWebhook) {
      setFormData({
        event_type: existingWebhook.event_type,
        target_url: existingWebhook.target_url,
        is_active: existingWebhook.is_active,
      });
    }
  }, [existingWebhook]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.event_type || !formData.target_url) {
      toast({
        title: 'Erreur de validation',
        description: 'Veuillez remplir tous les champs requis',
        variant: 'destructive',
      });
      return;
    }

    // Valider l'URL
    try {
      new URL(formData.target_url);
    } catch {
      toast({
        title: 'URL invalide',
        description: 'Veuillez entrer une URL valide (http:// ou https://)',
        variant: 'destructive',
      });
      return;
    }

    try {
      if (webhookId && existingWebhook) {
        await updateWebhook.mutateAsync({
          id: webhookId,
          event_type: formData.event_type as WebhookEventType,
          target_url: formData.target_url,
          is_active: formData.is_active,
        });
      } else {
        await createWebhook.mutateAsync({
          store_id: storeId,
          event_type: formData.event_type as WebhookEventType,
          target_url: formData.target_url,
          is_active: formData.is_active,
        });
      }
      onSuccess();
    } catch (error: unknown) {
      // L'erreur est déjà gérée par le hook
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error('Webhook form error', { error: errorMessage });
    }
  };

  if (isLoadingWebhook) {
    return <Skeleton className="h-64 w-full" />;
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="event_type">Type d'événement *</Label>
        <Select
          value={formData.event_type}
          onValueChange={(value) => setFormData({ ...formData, event_type: value })}
          required
          disabled={!!webhookId}
        >
          <SelectTrigger id="event_type">
            <SelectValue placeholder="Sélectionner un événement" />
          </SelectTrigger>
          <SelectContent>
            {WEBHOOK_EVENTS.map((event) => (
              <SelectItem key={event} value={event}>
                {event.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">
          {webhookId && "Le type d'événement ne peut pas être modifié après création"}
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="target_url">URL cible *</Label>
        <Input
          id="target_url"
          type="url"
          placeholder="https://example.com/webhook"
          value={formData.target_url}
          onChange={(e) => setFormData({ ...formData, target_url: e.target.value })}
          required
        />
        <p className="text-xs text-muted-foreground">
          L'URL où les notifications seront envoyées
        </p>
      </div>

      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <Label>Activer le webhook</Label>
          <div className="text-sm text-muted-foreground">
            Le webhook ne sera pas déclenché s'il est désactivé
          </div>
        </div>
        <Switch
          checked={formData.is_active}
          onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
        />
      </div>

      <div className="flex justify-end gap-2 pt-4 border-t">
        <Button type="button" variant="outline" onClick={onCancel}>
          Annuler
        </Button>
        <Button
          type="submit"
          disabled={createWebhook.isPending || updateWebhook.isPending}
        >
          {createWebhook.isPending || updateWebhook.isPending ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              {webhookId ? 'Mise à jour...' : 'Création...'}
            </>
          ) : (
            webhookId ? 'Mettre à jour' : 'Créer le webhook'
          )}
        </Button>
      </div>
    </form>
  );
};
