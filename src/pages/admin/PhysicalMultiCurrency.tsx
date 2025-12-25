/**
 * Page de gestion multi-devises
 * Date: 28 Janvier 2025
 * Design responsive avec le même style que Mes Templates
 */

import { useTranslation } from 'react-i18next';
import { SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { CurrencyManager } from '@/components/physical/currencies/CurrencyManager';
import { CurrencyConverter } from '@/components/physical/currencies/CurrencyConverter';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';
import { DollarSign } from 'lucide-react';

export default function PhysicalMultiCurrency() {
  const { t } = useTranslation();
  const headerRef = useScrollAnimation<HTMLDivElement>();
  const tabsRef = useScrollAnimation<HTMLDivElement>();

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
                    <DollarSign
                      className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 lg:h-8 lg:w-8 text-purple-500 dark:text-purple-400"
                      aria-hidden="true"
                    />
                  </div>
                  <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                    {t('admin.physicalMultiCurrency.title')}
                  </span>
                </h1>
                <p className="text-[10px] sm:text-xs md:text-sm lg:text-base text-muted-foreground">
                  {t('admin.physicalMultiCurrency.description')}
                </p>
              </div>
            </div>

            <div ref={tabsRef} className="animate-in fade-in slide-in-from-bottom-4 duration-700">
              <Tabs defaultValue="manager" className="space-y-4 sm:space-y-6">
                <TabsList className="grid w-full grid-cols-2 h-auto p-1 bg-muted/50 backdrop-blur-sm gap-1.5 sm:gap-2">
                  <TabsTrigger
                    value="manager"
                    className="flex-1 sm:flex-none gap-1 sm:gap-1.5 lg:gap-2 px-2 sm:px-3 md:px-4 py-2 sm:py-1.5 md:py-2 text-[10px] xs:text-xs sm:text-sm min-h-[44px] data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-pink-600 data-[state=active]:text-white transition-all duration-300 whitespace-nowrap overflow-hidden text-ellipsis"
                  >
                    <span className="hidden xs:inline">
                      {t('admin.physicalMultiCurrency.tabs.currencies')}
                    </span>
                    <span className="xs:hidden">
                      {t('admin.physicalMultiCurrency.tabs.currenciesShort')}
                    </span>
                  </TabsTrigger>
                  <TabsTrigger
                    value="converter"
                    className="flex-1 sm:flex-none gap-1 sm:gap-1.5 lg:gap-2 px-2 sm:px-3 md:px-4 py-2 sm:py-1.5 md:py-2 text-[10px] xs:text-xs sm:text-sm min-h-[44px] data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-pink-600 data-[state=active]:text-white transition-all duration-300 whitespace-nowrap overflow-hidden text-ellipsis"
                  >
                    {t('admin.physicalMultiCurrency.tabs.converter')}
                  </TabsTrigger>
                </TabsList>

                <TabsContent
                  value="manager"
                  className="space-y-4 sm:space-y-6 mt-3 sm:mt-4 lg:mt-6 animate-in fade-in slide-in-from-bottom-4 duration-700"
                >
                  <CurrencyManager />
                </TabsContent>

                <TabsContent
                  value="converter"
                  className="space-y-4 sm:space-y-6 mt-3 sm:mt-4 lg:mt-6 animate-in fade-in slide-in-from-bottom-4 duration-700"
                >
                  <CurrencyConverter />
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}
