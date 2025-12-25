/**
 * Page Admin Warehouses Management - Gestion des entrepôts
 * Date: 27 Janvier 2025
 *
 * Fonctionnalités:
 * - Gestion des entrepôts
 * - Gestion de l'inventaire par entrepôt
 * - Transferts entre entrepôts
 */

import { SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  WarehousesManagement,
  WarehouseInventory,
  WarehouseTransfers,
} from '@/components/physical/warehouses';
import { Warehouse as WarehouseIcon, Package, Truck } from 'lucide-react';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';

export default function AdminWarehousesManagement() {
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
                    <WarehouseIcon
                      className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 lg:h-8 lg:w-8 text-purple-500 dark:text-purple-400"
                      aria-hidden="true"
                    />
                  </div>
                  <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                    Gestion des Entrepôts
                  </span>
                </h1>
                <p className="text-[10px] sm:text-xs md:text-sm lg:text-base text-muted-foreground">
                  Gérez vos entrepôts, inventaire et transferts de stock
                </p>
              </div>
            </div>

            <div ref={tabsRef} className="animate-in fade-in slide-in-from-bottom-4 duration-700">
              <Tabs defaultValue="warehouses" className="space-y-4 sm:space-y-6">
                <TabsList className="grid w-full grid-cols-3 h-auto p-1 bg-muted/50 backdrop-blur-sm gap-1.5 sm:gap-2">
                  <TabsTrigger
                    value="warehouses"
                    className="flex-1 sm:flex-none gap-1 sm:gap-1.5 lg:gap-2 px-2 sm:px-3 md:px-4 py-2 sm:py-1.5 md:py-2 text-[10px] xs:text-xs sm:text-sm min-h-[44px] data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-pink-600 data-[state=active]:text-white transition-all duration-300 touch-manipulation whitespace-nowrap overflow-hidden text-ellipsis"
                  >
                    <WarehouseIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    <span className="hidden sm:inline">Entrepôts</span>
                    <span className="sm:hidden">Entrep.</span>
                  </TabsTrigger>
                  <TabsTrigger
                    value="inventory"
                    className="flex-1 sm:flex-none gap-1 sm:gap-1.5 lg:gap-2 px-2 sm:px-3 md:px-4 py-2 sm:py-1.5 md:py-2 text-[10px] xs:text-xs sm:text-sm min-h-[44px] data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-pink-600 data-[state=active]:text-white transition-all duration-300 touch-manipulation whitespace-nowrap overflow-hidden text-ellipsis"
                  >
                    <Package className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    <span className="hidden sm:inline">Inventaire</span>
                    <span className="sm:hidden">Inv.</span>
                  </TabsTrigger>
                  <TabsTrigger
                    value="transfers"
                    className="flex-1 sm:flex-none gap-1 sm:gap-1.5 lg:gap-2 px-2 sm:px-3 md:px-4 py-2 sm:py-1.5 md:py-2 text-[10px] xs:text-xs sm:text-sm min-h-[44px] data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-pink-600 data-[state=active]:text-white transition-all duration-300 touch-manipulation whitespace-nowrap overflow-hidden text-ellipsis"
                  >
                    <Truck className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    <span className="hidden sm:inline">Transferts</span>
                    <span className="sm:hidden">Trans.</span>
                  </TabsTrigger>
                </TabsList>

                <TabsContent
                  value="warehouses"
                  className="space-y-4 sm:space-y-6 mt-3 sm:mt-4 lg:mt-6 animate-in fade-in slide-in-from-bottom-4 duration-700"
                >
                  <WarehousesManagement />
                </TabsContent>

                <TabsContent
                  value="inventory"
                  className="space-y-4 sm:space-y-6 mt-3 sm:mt-4 lg:mt-6 animate-in fade-in slide-in-from-bottom-4 duration-700"
                >
                  <WarehouseInventory />
                </TabsContent>

                <TabsContent
                  value="transfers"
                  className="space-y-4 sm:space-y-6 mt-3 sm:mt-4 lg:mt-6 animate-in fade-in slide-in-from-bottom-4 duration-700"
                >
                  <WarehouseTransfers />
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}
