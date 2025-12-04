/**
 * Composant pour créer/éditer une campagne email
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
  const { t } = useTranslation();
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
            {isEditing ? t('emails.campaigns.editCampaign', 'Modifier la campagne') : t('emails.campaigns.newCampaign', 'Nouvelle campagne')}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? t('emails.campaigns.editCampaignDescription', 'Modifiez les informations de votre campagne email')
              : t('emails.campaigns.newCampaignDescription', 'Créez une nouvelle campagne email marketing pour votre boutique')}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">{t('emails.campaigns.campaignName', 'Nom de la campagne')} *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t('emails.campaigns.campaignNamePlaceholder', 'Newsletter de janvier 2025')}
              required
            />
          </div>

          <div>
            <Label htmlFor="description">{t('common.description', 'Description')}</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t('emails.campaigns.campaignDescriptionPlaceholder', 'Description de la campagne...')}
              rows={3}
            />
          </div>

          <div>
            <Label htmlFor="type">{t('emails.campaigns.campaignType', 'Type de campagne')} *</Label>
            <Select value={type} onValueChange={(value) => setType(value as CampaignType)}>
              <SelectTrigger id="type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newsletter">{t('emails.campaigns.types.newsletter', 'Newsletter')}</SelectItem>
                <SelectItem value="promotional">{t('emails.campaigns.types.promotional', 'Promotionnelle')}</SelectItem>
                <SelectItem value="transactional">{t('emails.campaigns.types.transactional', 'Transactionnelle')}</SelectItem>
                <SelectItem value="abandon_cart">{t('emails.campaigns.types.abandonCart', 'Panier abandonné')}</SelectItem>
                <SelectItem value="nurture">{t('emails.campaigns.types.nurture', 'Nurture')}</SelectItem>
              </SelectContent>
            </Select>
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
          </div>

          <div>
            <Label htmlFor="audienceType">{t('emails.campaigns.audienceType', 'Type d\'audience')} *</Label>
            <Select
              value={audienceType}
              onValueChange={(value) => setAudienceType(value as AudienceType)}
            >
              <SelectTrigger id="audienceType">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="segment">{t('emails.campaigns.audienceTypes.segment', 'Segment')}</SelectItem>
                <SelectItem value="list">{t('emails.campaigns.audienceTypes.list', 'Liste')}</SelectItem>
                <SelectItem value="filter">{t('emails.campaigns.audienceTypes.filter', 'Filtres')}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="scheduledAt">{t('emails.campaigns.scheduledAt', 'Date et heure d\'envoi')}</Label>
            <Input
              id="scheduledAt"
              type="datetime-local"
              value={scheduledAt}
              onChange={(e) => setScheduledAt(e.target.value)}
              placeholder={t('emails.campaigns.scheduledAtPlaceholder', 'Programmer l\'envoi')}
            />
            <p className="text-xs text-muted-foreground mt-1">
              {t('emails.campaigns.scheduledAtDescription', 'Laissez vide pour envoyer immédiatement ou créer un brouillon')}
            </p>
          </div>

          <div>
            <Label htmlFor="timezone">{t('emails.campaigns.timezone', 'Fuseau horaire')}</Label>
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
              {t('common.cancel', 'Annuler')}
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {isEditing ? t('common.save', 'Enregistrer') : t('emails.campaigns.createCampaign', 'Créer la campagne')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

