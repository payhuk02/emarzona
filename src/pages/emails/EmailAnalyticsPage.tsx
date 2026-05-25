/**
 * Page principale pour les analytics email
 */

import { useTranslation } from 'react-i18next';
import { EmailAnalyticsDashboard, EmailDashboardLayout } from '@/components/email';
import { useStore } from '@/hooks/useStore';
import { BarChart3 } from 'lucide-react';

export const EmailAnalyticsPage = () => {
  const { t } = useTranslation();
  const { store } = useStore();

  return (
    <EmailDashboardLayout
      title={t('emails.analytics.title')}
      subtitle={t('emails.analytics.subtitle')}
      icon={BarChart3}
      noStoreMessage={t('emails.analytics.noStore')}
      infoAlert={{
        title: t('emails.analytics.alert.title'),
        description: t('emails.analytics.alert.description'),
      }}
    >
      {store ? <EmailAnalyticsDashboard storeId={store.id} /> : null}
    </EmailDashboardLayout>
  );
};
