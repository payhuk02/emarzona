/**
 * Page principale pour la gestion des campagnes email
 */

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { EmailCampaignManager, CampaignBuilder, EmailDashboardLayout } from '@/components/email';
import { useStore } from '@/hooks/useStore';
import { Mail } from 'lucide-react';
import type { EmailCampaign } from '@/lib/email/email-campaign-service';

export const EmailCampaignsPage = () => {
  const { t } = useTranslation();
  const { store } = useStore();
  const [builderOpen, setBuilderOpen] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<EmailCampaign | null>(null);

  const handleCreateCampaign = () => {
    setEditingCampaign(null);
    setBuilderOpen(true);
  };

  const handleEditCampaign = (campaign: EmailCampaign) => {
    setEditingCampaign(campaign);
    setBuilderOpen(true);
  };

  const handleSuccess = () => {
    setBuilderOpen(false);
    setEditingCampaign(null);
  };

  return (
    <EmailDashboardLayout
      title={t('emails.campaigns.title')}
      subtitle={t('emails.campaigns.subtitle')}
      icon={Mail}
      noStoreMessage={t('emails.campaigns.noStore')}
      infoAlert={{
        title: t('emails.campaigns.alert.title'),
        description: t('emails.campaigns.alert.description'),
      }}
    >
      {store ? (
        <>
          <EmailCampaignManager
            storeId={store.id}
            onCreateCampaign={handleCreateCampaign}
            onEditCampaign={handleEditCampaign}
          />
          <CampaignBuilder
            open={builderOpen}
            onOpenChange={setBuilderOpen}
            storeId={store.id}
            campaign={editingCampaign}
            onSuccess={handleSuccess}
          />
        </>
      ) : null}
    </EmailDashboardLayout>
  );
};
