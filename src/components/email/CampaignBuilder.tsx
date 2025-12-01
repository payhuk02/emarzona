/**
 * Composant pour créer/éditer une campagne email
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
import { useEmailTemplates } from '@/hooks/useEmail';
import { useCreateEmailCampaign, useUpdateEmailCampaign } from '@/hooks/email/useEmailCampaigns';
import type { EmailCampaign, CreateCampaignPayload, CampaignType, AudienceType } from '@/lib/email/email-campaign-service';
import { Loader2 } from 'lucide-react';

interface CampaignBuilderProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  storeId: string;
  campaign?: EmailCampaign | null;
  onSuccess?: () => void;
}

export const CampaignBuilder = ({
  open,
  onOpenChange,
  storeId,
  campaign,
  onSuccess,
}: CampaignBuilderProps) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<CampaignType>('newsletter');
  const [templateId, setTemplateId] = useState<string>('');
  const [audienceType, setAudienceType] = useState<AudienceType>('filter');
  const [scheduledAt, setScheduledAt] = useState('');
  const [timezone, setTimezone] = useState('Africa/Dakar');

  const { data: templates } = useEmailTemplates({ category: 'marketing' });
  const createCampaign = useCreateEmailCampaign();
  const updateCampaign = useUpdateEmailCampaign();

  const isEditing = !!campaign;

  useEffect(() => {
    if (campaign) {
      setName(campaign.name);
      setDescription(campaign.description || '');
      setType(campaign.type);
      setTemplateId(campaign.template_id || '');
      setAudienceType(campaign.audience_type);
      setScheduledAt(campaign.scheduled_at ? new Date(campaign.scheduled_at).toISOString().slice(0, 16) : '');
      setTimezone(campaign.send_at_timezone);
    } else {
      // Reset form
      setName('');
      setDescription('');
      setType('newsletter');
      setTemplateId('');
      setAudienceType('filter');
      setScheduledAt('');
      setTimezone('Africa/Dakar');
    }
  }, [campaign, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const payload: CreateCampaignPayload = {
      store_id: storeId,
      name,
      description,
      type,
      template_id: templateId || undefined,
      audience_type: audienceType,
      scheduled_at: scheduledAt || undefined,
      send_at_timezone: timezone,
      audience_filters: {},
    };

    try {
      if (isEditing) {
        await updateCampaign.mutateAsync({
          campaignId: campaign!.id,
          payload,
        });
      } else {
        await createCampaign.mutateAsync(payload);
      }
      onSuccess?.();
      onOpenChange(false);
    } catch (error) {
      // Error handling is done in the hooks
    }
  };

  const isLoading = createCampaign.isPending || updateCampaign.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Modifier la campagne' : 'Nouvelle campagne'}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? 'Modifiez les informations de votre campagne email'
              : 'Créez une nouvelle campagne email marketing pour votre boutique'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Nom de la campagne *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Newsletter de janvier 2025"
              required
            />
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Description de la campagne..."
              rows={3}
            />
          </div>

          <div>
            <Label htmlFor="type">Type de campagne *</Label>
            <Select value={type} onValueChange={(value) => setType(value as CampaignType)}>
              <SelectTrigger id="type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newsletter">Newsletter</SelectItem>
                <SelectItem value="promotional">Promotionnelle</SelectItem>
                <SelectItem value="transactional">Transactionnelle</SelectItem>
                <SelectItem value="abandon_cart">Panier abandonné</SelectItem>
                <SelectItem value="nurture">Nurture</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="template">Template email</Label>
            <Select value={templateId} onValueChange={setTemplateId}>
              <SelectTrigger id="template">
                <SelectValue placeholder="Sélectionner un template" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Aucun template</SelectItem>
                {templates?.map((template) => (
                  <SelectItem key={template.id} value={template.id}>
                    {template.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="audienceType">Type d'audience *</Label>
            <Select
              value={audienceType}
              onValueChange={(value) => setAudienceType(value as AudienceType)}
            >
              <SelectTrigger id="audienceType">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="segment">Segment</SelectItem>
                <SelectItem value="list">Liste</SelectItem>
                <SelectItem value="filter">Filtres</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="scheduledAt">Date et heure d'envoi</Label>
            <Input
              id="scheduledAt"
              type="datetime-local"
              value={scheduledAt}
              onChange={(e) => setScheduledAt(e.target.value)}
              placeholder="Programmer l'envoi"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Laissez vide pour envoyer immédiatement ou créer un brouillon
            </p>
          </div>

          <div>
            <Label htmlFor="timezone">Fuseau horaire</Label>
            <Select value={timezone} onValueChange={setTimezone}>
              <SelectTrigger id="timezone">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Africa/Dakar">Africa/Dakar (GMT+0)</SelectItem>
                <SelectItem value="Africa/Abidjan">Africa/Abidjan (GMT+0)</SelectItem>
                <SelectItem value="Europe/Paris">Europe/Paris (GMT+1)</SelectItem>
                <SelectItem value="UTC">UTC</SelectItem>
              </SelectContent>
            </Select>
          </div>

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
              {isEditing ? 'Enregistrer' : 'Créer la campagne'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

