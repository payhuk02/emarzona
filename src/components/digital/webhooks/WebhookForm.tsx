/**
 * WebhookForm - Formulaire de création/édition de webhook
 * Date: 2025-01-27
 */

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
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
} from '@/hooks/digital/useWebhooks';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from '@/components/icons';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/integrations/supabase/client';

interface WebhookFormProps {
  webhookId?: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export const WebhookForm = ({ webhookId, onSuccess, onCancel }: WebhookFormProps) => {
  const { toast } = useToast();
  const { data: existingWebhook, isLoading: isLoadingWebhook } = useWebhook(webhookId);
  const createWebhook = useCreateWebhook();
  const updateWebhook = useUpdateWebhook();

  const [formData, setFormData] = useState({
    name: '',
    url: '',
    events: [] as string[],
    is_active: true,
    retry_count: 3,
    timeout_seconds: 30,
    description: '',
    headers: {} as Record<string, string>,
  });

  useEffect(() => {
    if (existingWebhook) {
      setFormData({
        name: existingWebhook.name,
        url: existingWebhook.url,
        events: existingWebhook.events,
        is_active: existingWebhook.is_active,
        retry_count: existingWebhook.retry_count,
        timeout_seconds: existingWebhook.timeout_seconds,
        description: existingWebhook.description || '',
        headers: existingWebhook.headers || {},
      });
    }
  }, [existingWebhook]);

  const toggleEvent = (event: string) => {
    setFormData(prev => ({
      ...prev,
      events: prev.events.includes(event)
        ? prev.events.filter(e => e !== event)
        : [...prev.events, event],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.url || formData.events.length === 0) {
      toast({
        title: 'Erreur de validation',
        description: 'Veuillez remplir tous les champs requis',
        variant: 'destructive',
      });
      return;
    }

    // Valider l'URL
    try {
      new URL(formData.url);
    } catch {
      toast({
        title: 'URL invalide',
        description: 'Veuillez entrer une URL valide (http:// ou https://)',
        variant: 'destructive',
      });
      return;
    }

    try {
      if (webhookId) {
        await updateWebhook.mutateAsync({
          webhookId,
          data: formData,
        });
      } else {
        // Pour la création, on récupère le store_id
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Non authentifié');

        const { data: stores } = await supabase
          .from('stores')
          .select('id')
          .eq('user_id', user.id)
          .limit(1);

        if (!stores || stores.length === 0) {
          throw new Error('Aucune boutique trouvée');
        }

        await createWebhook.mutateAsync({
          ...formData,
          store_id: stores[0].id,
        });
      }
      onSuccess();
    } catch (error: any) {
      // L'erreur est déjà gérée par le hook
    }
  };

  if (isLoadingWebhook) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="name">Nom du webhook *</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="Ex: Notifications Zapier"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="url">URL du webhook *</Label>
        <Input
          id="url"
          type="url"
          value={formData.url}
          onChange={(e) => setFormData({ ...formData, url: e.target.value })}
          placeholder="https://hooks.zapier.com/hooks/catch/..."
          required
        />
        <p className="text-sm text-muted-foreground">
          L'URL doit commencer par http:// ou https://
        </p>
      </div>

      <div className="space-y-2">
        <Label>Événements à écouter *</Label>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 p-4 border rounded-lg">
          {WEBHOOK_EVENTS.map((event) => (
            <div key={event} className="flex items-center space-x-2">
              <Checkbox
                id={`event-${event}`}
                checked={formData.events.includes(event)}
                onCheckedChange={() => toggleEvent(event)}
              />
              <Label
                htmlFor={`event-${event}`}
                className="text-sm font-normal cursor-pointer capitalize"
              >
                {event.replace('_', ' ')}
              </Label>
            </div>
          ))}
        </div>
        {formData.events.length === 0 && (
          <p className="text-sm text-red-600">Sélectionnez au moins un événement</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Description optionnelle du webhook"
          rows={3}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="retry_count">Nombre de tentatives</Label>
          <Select
            value={formData.retry_count.toString()}
            onValueChange={(value) =>
              setFormData({ ...formData, retry_count: parseInt(value) })
            }
          >
            <SelectTrigger id="retry_count">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[0, 1, 2, 3, 4, 5].map((num) => (
                <SelectItem key={num} value={num.toString()}>
                  {num} tentative{num > 1 ? 's' : ''}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="timeout_seconds">Timeout (secondes)</Label>
          <Select
            value={formData.timeout_seconds.toString()}
            onValueChange={(value) =>
              setFormData({ ...formData, timeout_seconds: parseInt(value) })
            }
          >
            <SelectTrigger id="timeout_seconds">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[10, 15, 30, 60, 120, 300].map((seconds) => (
                <SelectItem key={seconds} value={seconds.toString()}>
                  {seconds}s
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <Label>Webhook actif</Label>
          <div className="text-sm text-muted-foreground">
            Les webhooks inactifs ne seront pas envoyés
          </div>
        </div>
        <Switch
          checked={formData.is_active}
          onCheckedChange={(checked) =>
            setFormData({ ...formData, is_active: checked })
          }
        />
      </div>

      <div className="flex flex-col sm:flex-row justify-end gap-2 pt-4 border-t">
        <Button type="button" variant="outline" onClick={onCancel} className="w-full sm:w-auto">
          Annuler
        </Button>
        <Button
          type="submit"
          disabled={createWebhook.isPending || updateWebhook.isPending}
          className="w-full sm:w-auto"
        >
          {(createWebhook.isPending || updateWebhook.isPending) && (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          )}
          {webhookId ? 'Mettre à jour' : 'Créer'}
        </Button>
      </div>
    </form>
  );
};

