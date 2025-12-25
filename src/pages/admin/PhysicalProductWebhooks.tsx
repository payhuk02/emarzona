/**
 * Physical Product Webhooks Admin Page
 * Date: 2025-01-27
 */

import { useTranslation } from 'react-i18next';
import { SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { WebhooksManager } from '@/components/physical/webhooks/WebhooksManager';

export default function PhysicalProductWebhooks() {
  const { t } = useTranslation();
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full overflow-x-hidden">
        <AppSidebar />
        <main className="flex-1 overflow-auto pb-16 md:pb-0">
          <div className="container mx-auto p-3 sm:p-4 lg:p-6">
            <WebhooksManager />
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}
