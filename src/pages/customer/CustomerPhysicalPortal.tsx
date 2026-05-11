/**
 * Customer Physical Portal - Portail Client pour Produits Physiques
 * Date: 2025-01-27
 *
 * Page principale du portail client avec navigation par onglets
 * Responsive avec fonctionnalités avancées
 */

import { useState } from 'react';
import { MainLayout } from '@/components/layout';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Package, RotateCcw, Shield, History, MapPin, ShoppingBag } from 'lucide-react';
import { MyOrders } from '@/components/physical/customer/MyOrders';
import { OrderTracking } from '@/components/physical/customer/OrderTracking';
import { MyReturns } from '@/components/physical/customer/MyReturns';
import { MyWarranties } from '@/components/physical/customer/MyWarranties';
import { OrderHistory } from '@/components/physical/customer/OrderHistory';

// Composant principal
export default function CustomerPhysicalPortal() {
  const [activeTab, setActiveTab] = useState('orders');
  const headerRef = useScrollAnimation<HTMLDivElement>();

  return (
    <MainLayout layoutType="physical-portal">
      <div className="container mx-auto p-3 sm:p-4 lg:p-6 space-y-4 sm:space-y-6">
        {/* Header */}
        <div
          ref={headerRef}
          className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 animate-in fade-in slide-in-from-top-4 duration-700"
        >
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="p-1.5 sm:p-2 rounded-lg bg-gradient-to-br from-purple-500/10 to-pink-500/5 backdrop-blur-sm border border-purple-500/20 animate-in zoom-in duration-500">
              <ShoppingBag
                className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 lg:h-8 lg:w-8 text-purple-500 dark:text-purple-400"
                aria-hidden="true"
              />
            </div>
            <div>
              <h1 className="text-lg sm:text-2xl md:text-3xl lg:text-4xl font-bold flex items-center gap-1.5 sm:gap-2 mb-1 sm:mb-2">
                <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                  Mon Portail Produits Physiques
                </span>
              </h1>
              <p className="text-[10px] sm:text-xs md:text-sm lg:text-base text-muted-foreground">
                Gérez vos commandes, retours, garanties et suivez vos expéditions
              </p>
            </div>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="bg-muted/50 backdrop-blur-sm h-auto p-1 w-full grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-1.5 sm:gap-2 sm:inline-flex sm:w-auto">
            <TabsTrigger
              value="orders"
              className="w-full sm:w-auto gap-1 sm:gap-1.5 px-2 sm:px-3 md:px-4 py-2 sm:py-1.5 md:py-2 text-[10px] xs:text-xs sm:text-sm font-medium data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-pink-600 data-[state=active]:text-white transition-all duration-300 whitespace-nowrap overflow-hidden text-ellipsis min-h-[44px]"
            >
              <Package className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
              <span className="hidden xs:inline">Mes Commandes</span>
              <span className="xs:hidden">Commandes</span>
            </TabsTrigger>
            <TabsTrigger
              value="tracking"
              className="w-full sm:w-auto gap-1 sm:gap-1.5 px-2 sm:px-3 md:px-4 py-2 sm:py-1.5 md:py-2 text-[10px] xs:text-xs sm:text-sm font-medium data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-pink-600 data-[state=active]:text-white transition-all duration-300 whitespace-nowrap overflow-hidden text-ellipsis min-h-[44px]"
            >
              <MapPin className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
              <span className="hidden xs:inline">Suivi</span>
              <span className="xs:hidden">Suivi</span>
            </TabsTrigger>
            <TabsTrigger
              value="returns"
              className="w-full sm:w-auto gap-1 sm:gap-1.5 px-2 sm:px-3 md:px-4 py-2 sm:py-1.5 md:py-2 text-[10px] xs:text-xs sm:text-sm font-medium data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-pink-600 data-[state=active]:text-white transition-all duration-300 whitespace-nowrap overflow-hidden text-ellipsis min-h-[44px]"
            >
              <RotateCcw className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
              <span className="hidden xs:inline">Retours</span>
              <span className="xs:hidden">Retours</span>
            </TabsTrigger>
            <TabsTrigger
              value="warranties"
              className="w-full sm:w-auto gap-1 sm:gap-1.5 px-2 sm:px-3 md:px-4 py-2 sm:py-1.5 md:py-2 text-[10px] xs:text-xs sm:text-sm font-medium data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-pink-600 data-[state=active]:text-white transition-all duration-300 whitespace-nowrap overflow-hidden text-ellipsis min-h-[44px]"
            >
              <Shield className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
              <span className="hidden xs:inline">Garanties</span>
              <span className="xs:hidden">Garanties</span>
            </TabsTrigger>
            <TabsTrigger
              value="history"
              className="w-full sm:w-auto gap-1 sm:gap-1.5 px-2 sm:px-3 md:px-4 py-2 sm:py-1.5 md:py-2 text-[10px] xs:text-xs sm:text-sm font-medium data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-pink-600 data-[state=active]:text-white transition-all duration-300 whitespace-nowrap overflow-hidden text-ellipsis min-h-[44px]"
            >
              <History className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
              <span className="hidden xs:inline">Historique</span>
              <span className="xs:hidden">Histoire</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="orders" className="space-y-3 sm:space-y-4 mt-3 sm:mt-4">
            <MyOrders />
          </TabsContent>

          <TabsContent value="tracking" className="space-y-3 sm:space-y-4 mt-3 sm:mt-4">
            <OrderTracking />
          </TabsContent>

          <TabsContent value="returns" className="space-y-3 sm:space-y-4 mt-3 sm:mt-4">
            <MyReturns />
          </TabsContent>

          <TabsContent value="warranties" className="space-y-3 sm:space-y-4 mt-3 sm:mt-4">
            <MyWarranties />
          </TabsContent>

          <TabsContent value="history" className="space-y-3 sm:space-y-4 mt-3 sm:mt-4">
            <OrderHistory />
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}






