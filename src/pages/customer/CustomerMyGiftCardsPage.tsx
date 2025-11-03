/**
 * Page wrapper pour CustomerMyGiftCards - Route directe
 * Permet d'accéder directement aux cartes cadeaux depuis la sidebar
 */

import { SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import CustomerMyGiftCards from './CustomerMyGiftCards';

export default function CustomerMyGiftCardsPage() {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-gray-50 dark:bg-gray-900">
        <AppSidebar />
        <main className="flex-1 p-4 md:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            <CustomerMyGiftCards />
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}

