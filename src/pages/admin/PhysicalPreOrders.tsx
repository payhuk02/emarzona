/**
 * Page de gestion des précommandes
 * Date: 28 Janvier 2025
 * Design responsive avec le même style que Mes Templates
 */

import { useTranslation } from 'react-i18next';
import { SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { PreOrdersManager } from '@/components/physical/preorders/PreOrdersManager';
import { Skeleton } from '@/components/ui/skeleton';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';
import { Package } from 'lucide-react';

export default function PhysicalPreOrders() {
  const { t } = useTranslation();
  const headerRef = useScrollAnimation<HTMLDivElement>();
  const contentRef = useScrollAnimation<HTMLDivElement>();

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full overflow-x-hidden">
        <AppSidebar />
        <main className="flex-1 overflow-auto pb-16 md:pb-0">
          <div className="container mx-auto p-3 sm:p-4 lg:p-6 space-y-4 sm:space-y-6">
            {/* Header - Responsive & Animated */}
            <div
              ref={headerRef}
              className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 animate-in fade-in slide-in-from-top-4 duration-700"
            >
              <div>
                <h1 className="text-lg sm:text-2xl md:text-3xl lg:text-4xl font-bold flex items-center gap-1.5 sm:gap-2 mb-1 sm:mb-2">
                  <div className="p-1.5 sm:p-2 rounded-lg bg-gradient-to-br from-purple-500/10 to-pink-500/5 backdrop-blur-sm border border-purple-500/20 animate-in zoom-in duration-500">
                    <Package
                      className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 lg:h-8 lg:w-8 text-purple-500 dark:text-purple-400"
                      aria-hidden="true"
                    />
                  </div>
                  <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                    {t('admin.physicalPreOrders.title')}
                  </span>
                </h1>
                <p className="text-[10px] sm:text-xs md:text-sm lg:text-base text-muted-foreground">
                  {t('admin.physicalPreOrders.description')}
                </p>
              </div>
            </div>

            <div
              ref={contentRef}
              className="animate-in fade-in slide-in-from-bottom-4 duration-700"
            >
              <PreOrdersManager />
            </div>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}






