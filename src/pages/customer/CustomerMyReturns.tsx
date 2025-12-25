/**
 * Page CustomerMyReturns - Mes retours (Standalone Page)
 * Date: 2 Février 2025
 *
 * Page standalone pour la route /account/returns
 * Utilise ReturnsTab avec le layout approprié
 */

import { SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { ReturnsTab } from '@/components/customer/ReturnsTab';

export default function CustomerMyReturns() {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background">
        <AppSidebar />
        <main className="flex-1 overflow-auto">
          <div className="container mx-auto p-3 sm:p-4 lg:p-6">
            <ReturnsTab />
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}
