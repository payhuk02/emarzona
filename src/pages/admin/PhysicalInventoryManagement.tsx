/**
 * Physical Inventory Management Page
 * Date: 2025-01-28
 * Design responsive avec le même style que Mes Templates
 */

import React from 'react';
import { SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { WarehouseManager, StockAlerts } from '@/components/physical/inventory';
import { Package, AlertTriangle } from 'lucide-react';

export default function PhysicalInventoryManagement() {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full overflow-x-hidden">
        <AppSidebar />
        <main className="flex-1 overflow-auto pb-16 md:pb-0">
          <div className="container mx-auto p-3 sm:p-4 lg:p-6 space-y-4 sm:space-y-6">
            {/* Header - Responsive & Animated */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 animate-in fade-in slide-in-from-top-4 duration-700">
              <div>
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold flex items-center gap-2 mb-1 sm:mb-2">
                  <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500/10 to-pink-500/5 backdrop-blur-sm border border-purple-500/20 animate-in zoom-in duration-500">
                    <Package
                      className="h-5 w-5 sm:h-6 sm:w-6 lg:h-8 lg:w-8 text-purple-500 dark:text-purple-400"
                      aria-hidden="true"
                    />
                  </div>
                  <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                    Gestion des stocks
                  </span>
                </h1>
                <p className="text-xs sm:text-sm lg:text-base text-muted-foreground">
                  Gérez vos entrepôts, stocks et alertes de réapprovisionnement
                </p>
              </div>
            </div>

            <Tabs defaultValue="warehouses" className="space-y-4 sm:space-y-6">
              <TabsList className="grid w-full grid-cols-2 h-auto p-1 bg-muted/50 backdrop-blur-sm">
                <TabsTrigger
                  value="warehouses"
                  className="text-xs sm:text-sm px-2 sm:px-4 py-2 min-h-[44px] data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-pink-600 data-[state=active]:text-white transition-all duration-300"
                >
                  <Package className="mr-1.5 sm:mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  <span className="hidden xs:inline">Entrepôts</span>
                  <span className="xs:hidden">Entrep.</span>
                </TabsTrigger>
                <TabsTrigger
                  value="alerts"
                  className="text-xs sm:text-sm px-2 sm:px-4 py-2 min-h-[44px] data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-pink-600 data-[state=active]:text-white transition-all duration-300"
                >
                  <AlertTriangle className="mr-1.5 sm:mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  <span className="hidden xs:inline">Alertes de stock</span>
                  <span className="xs:hidden">Alertes</span>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="warehouses" className="space-y-4 sm:space-y-6 mt-4 sm:mt-6">
                <WarehouseManager />
              </TabsContent>

              <TabsContent value="alerts" className="space-y-4 sm:space-y-6 mt-4 sm:mt-6">
                <StockAlerts />
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}
