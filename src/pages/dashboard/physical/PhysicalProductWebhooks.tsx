/**
 * Physical Product Webhooks Admin Page
 * Date: 2025-01-27
 */

import { useTranslation } from 'react-i18next';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { WebhooksManager } from '@/components/physical/webhooks/WebhooksManager';

export default function PhysicalProductWebhooks() {
  const { t } = useTranslation();
  return (
    <DashboardLayout>
      <div className="container mx-auto p-3 sm:p-4 lg:p-6">
        <WebhooksManager />
      </div>
    </DashboardLayout>
  );
}
