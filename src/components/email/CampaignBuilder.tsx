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
import { BottomSheet, BottomSheetContent } from '@/components/ui/bottom-sheet';
import { MobileFormField } from '@/components/ui/mobile-form-field';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useEmailTemplates } from '@/hooks/useEmail';
import { useCreateEmailCampaign, useUpdateEmailCampaign } from '@/hooks/email/useEmailCampaigns';
import { useResponsiveModal } from '@/hooks/use-responsive-modal';
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
  const { useBottomSheet } = useResponsiveModal();
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

  const formContent = (
    <form onSubmit={handleSubmit} className="space-y-4">
      <MobileFormField
        label={t('emails.campaigns.campaignName', 'Nom de la campagne')}
        name="name"
        type="text"
        value={name}
        onChange={setName}
        required
        fieldProps={{
          placeholder: t('emails.campaigns.campaignNamePlaceholder', 'Newsletter de janvier 2025'),
        }}
      />

      <MobileFormField
        label={t('common.description', 'Description')}
        name="description"
        type="textarea"
        value={description}
        onChange={setDescription}
        fieldProps={{
          placeholder: t('emails.campaigns.campaignDescriptionPlaceholder', 'Description de la campagne...'),
          rows: 3,
        }}
      />

      <MobileFormField
        label={t('emails.campaigns.campaignType', 'Type de campagne')}
        name="type"
        type="select"
        value={type}
        onChange={(value) => setType(value as CampaignType)}
        required
        selectOptions={[
          { value: 'newsletter', label: t('emails.campaigns.types.newsletter', 'Newsletter') },
          { value: 'promotional', label: t('emails.campaigns.types.promotional', 'Promotionnelle') },
          { value: 'transactional', label: t('emails.campaigns.types.transactional', 'Transactionnelle') },
          { value: 'abandon_cart', label: t('emails.campaigns.types.abandonCart', 'Panier abandonné') },
          { value: 'nurture', label: t('emails.campaigns.types.nurture', 'Nurture') },
        ]}
      />

      <div>
        <Label htmlFor="template">{t('emails.template', 'Template email')}</Label>
        <Select value={templateId || "__none__"} onValueChange={(value) => setTemplateId(value === "__none__" ? "" : value)}>
          <SelectTrigger id="template" className="mt-1.5 sm:mt-2">
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

      <MobileFormField
        label={t('emails.campaigns.audienceType', 'Type d\'audience')}
        name="audienceType"
        type="select"
        value={audienceType}
        onChange={(value) => setAudienceType(value as AudienceType)}
        required
        selectOptions={[
          { value: 'segment', label: t('emails.campaigns.audienceTypes.segment', 'Segment') },
          { value: 'list', label: t('emails.campaigns.audienceTypes.list', 'Liste') },
          { value: 'filter', label: t('emails.campaigns.audienceTypes.filter', 'Filtres') },
        ]}
      />

      <MobileFormField
        label={t('emails.campaigns.scheduledAt', 'Date et heure d\'envoi')}
        name="scheduledAt"
        type="datetime-local"
        value={scheduledAt}
        onChange={setScheduledAt}
        description={t('emails.campaigns.scheduledAtDescription', 'Laissez vide pour envoyer immédiatement ou créer un brouillon')}
        fieldProps={{
          placeholder: t('emails.campaigns.scheduledAtPlaceholder', 'Programmer l\'envoi'),
        }}
      />

      <MobileFormField
        label={t('emails.campaigns.timezone', 'Fuseau horaire')}
        name="timezone"
        type="select"
        value={timezone}
        onChange={setTimezone}
        selectOptions={[
          { value: 'Africa/Dakar', label: 'Africa/Dakar (GMT+0)' },
          { value: 'Africa/Abidjan', label: 'Africa/Abidjan (GMT+0)' },
          { value: 'Europe/Paris', label: 'Europe/Paris (GMT+1)' },
          { value: 'UTC', label: 'UTC' },
        ]}
      />

      <div className="flex flex-col sm:flex-row justify-end gap-2 pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => onOpenChange(false)}
          disabled={isLoading}
          className="w-full sm:w-auto"
        >
          {t('common.cancel', 'Annuler')}
        </Button>
        <Button type="submit" disabled={isLoading} className="w-full sm:w-auto">
          {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          {isEditing ? t('common.save', 'Enregistrer') : t('emails.campaigns.createCampaign', 'Créer la campagne')}
        </Button>
      </div>
    </form>
  );

  return (
    <>
      {useBottomSheet ? (
        <BottomSheet open={open} onOpenChange={onOpenChange}>
          <BottomSheetContent
            title={isEditing ? t('emails.campaigns.editCampaign', 'Modifier la campagne') : t('emails.campaigns.newCampaign', 'Nouvelle campagne')}
            description={
              isEditing
                ? t('emails.campaigns.editCampaignDescription', 'Modifiez les informations de votre campagne email')
                : t('emails.campaigns.newCampaignDescription', 'Créez une nouvelle campagne email marketing pour votre boutique')
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
                {isEditing ? t('emails.campaigns.editCampaign', 'Modifier la campagne') : t('emails.campaigns.newCampaign', 'Nouvelle campagne')}
              </DialogTitle>
              <DialogDescription>
                {isEditing
                  ? t('emails.campaigns.editCampaignDescription', 'Modifiez les informations de votre campagne email')
                  : t('emails.campaigns.newCampaignDescription', 'Créez une nouvelle campagne email marketing pour votre boutique')}
              </DialogDescription>
            </DialogHeader>
            {formContent}
          </DialogContent>
        </Dialog>
      )}
    </>
  );
};

