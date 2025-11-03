/**
 * Page wrapper pour CustomerLoyalty - Route directe
 * Permet d'accéder directement au programme de fidélité depuis la sidebar
 */

import { SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import CustomerLoyalty from './CustomerLoyalty';

export default function CustomerLoyaltyPage() {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-gray-50 dark:bg-gray-900">
        <AppSidebar />
        <main className="flex-1 p-4 md:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            <CustomerLoyalty />
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}

