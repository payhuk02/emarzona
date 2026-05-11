/**
 * Customer Digital Portal - Portail Client pour Produits Digitaux
 * Date: 2025-01-27
 *
 * Page principale du portail client avec navigation par onglets
 */

import { useState } from 'react';
import { MainLayout } from '@/components/layout';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Package, Key, Download, BarChart3, Settings } from 'lucide-react';
import { MyDigitalProducts } from '@/components/digital/customer/MyDigitalProducts';
import { MyLicenses } from '@/components/digital/customer/MyLicenses';
import { MyDownloads } from '@/components/digital/customer/MyDownloads';
import { DigitalProductStats } from '@/components/digital/customer/DigitalProductStats';
import { DigitalPreferences } from '@/components/digital/customer/DigitalPreferences';

// Composant principal
export default function CustomerDigitalPortal() {
  const [activeTab, setActiveTab] = useState('products');
  const headerRef = useScrollAnimation<HTMLDivElement>();

  return (
    <MainLayout layoutType="digital-portal">
      <div className="container mx-auto p-3 sm:p-4 lg:p-6 space-y-4 sm:space-y-6">
        {/* Header */}
        <div
          ref={headerRef}
          className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 animate-in fade-in slide-in-from-top-4 duration-700"
        >
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="p-1.5 sm:p-2 rounded-lg bg-gradient-to-br from-purple-500/10 to-pink-500/5 backdrop-blur-sm border border-purple-500/20 animate-in zoom-in duration-500">
              <Package
                className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 lg:h-8 lg:w-8 text-purple-500 dark:text-purple-400"
                aria-hidden="true"
              />
            </div>
            <div>
              <h1 className="text-lg sm:text-2xl md:text-3xl lg:text-4xl font-bold flex items-center gap-1.5 sm:gap-2 mb-1 sm:mb-2">
                <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                  Mon Portail Digital
                </span>
              </h1>
              <p className="text-[10px] sm:text-xs md:text-sm lg:text-base text-muted-foreground">
                Gérez tous vos produits digitaux, licences et téléchargements
              </p>
            </div>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="bg-muted/50 backdrop-blur-sm h-auto p-1 w-full grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-1.5 sm:gap-2 sm:inline-flex sm:w-auto">
            <TabsTrigger
              value="products"
              className="w-full sm:w-auto gap-1 sm:gap-1.5 px-2 sm:px-3 md:px-4 py-2 sm:py-1.5 md:py-2 text-[10px] xs:text-xs sm:text-sm font-medium data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-pink-600 data-[state=active]:text-white transition-all duration-300 whitespace-nowrap overflow-hidden text-ellipsis min-h-[44px]"
            >
              <Package className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
              <span className="hidden xs:inline">Mes Produits</span>
              <span className="xs:hidden">P</span>
            </TabsTrigger>
            <TabsTrigger
              value="licenses"
              className="w-full sm:w-auto gap-1 sm:gap-1.5 px-2 sm:px-3 md:px-4 py-2 sm:py-1.5 md:py-2 text-[10px] xs:text-xs sm:text-sm font-medium data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-pink-600 data-[state=active]:text-white transition-all duration-300 whitespace-nowrap overflow-hidden text-ellipsis min-h-[44px]"
            >
              <Key className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
              <span className="hidden xs:inline">Mes Licences</span>
              <span className="xs:hidden">L</span>
            </TabsTrigger>
            <TabsTrigger
              value="downloads"
              className="w-full sm:w-auto gap-1 sm:gap-1.5 px-2 sm:px-3 md:px-4 py-2 sm:py-1.5 md:py-2 text-[10px] xs:text-xs sm:text-sm font-medium data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-pink-600 data-[state=active]:text-white transition-all duration-300 whitespace-nowrap overflow-hidden text-ellipsis min-h-[44px]"
            >
              <Download className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
              <span className="hidden xs:inline">Téléchargements</span>
              <span className="xs:hidden">T</span>
            </TabsTrigger>
            <TabsTrigger
              value="stats"
              className="w-full sm:w-auto gap-1 sm:gap-1.5 px-2 sm:px-3 md:px-4 py-2 sm:py-1.5 md:py-2 text-[10px] xs:text-xs sm:text-sm font-medium data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-pink-600 data-[state=active]:text-white transition-all duration-300 whitespace-nowrap overflow-hidden text-ellipsis min-h-[44px]"
            >
              <BarChart3 className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
              <span className="hidden xs:inline">Statistiques</span>
              <span className="xs:hidden">S</span>
            </TabsTrigger>
            <TabsTrigger
              value="preferences"
              className="w-full sm:w-auto gap-1 sm:gap-1.5 px-2 sm:px-3 md:px-4 py-2 sm:py-1.5 md:py-2 text-[10px] xs:text-xs sm:text-sm font-medium data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-pink-600 data-[state=active]:text-white transition-all duration-300 whitespace-nowrap overflow-hidden text-ellipsis min-h-[44px]"
            >
              <Settings className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
              <span className="hidden xs:inline">Paramètres</span>
              <span className="xs:hidden">⚙</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="products" className="space-y-3 sm:space-y-4 mt-3 sm:mt-4">
            <MyDigitalProducts />
          </TabsContent>

          <TabsContent value="licenses" className="space-y-3 sm:space-y-4 mt-3 sm:mt-4">
            <MyLicenses />
          </TabsContent>

          <TabsContent value="downloads" className="space-y-3 sm:space-y-4 mt-3 sm:mt-4">
            <MyDownloads />
          </TabsContent>

          <TabsContent value="stats" className="space-y-3 sm:space-y-4 mt-3 sm:mt-4">
            <DigitalProductStats />
          </TabsContent>

          <TabsContent value="preferences" className="space-y-3 sm:space-y-4 mt-3 sm:mt-4">
            <DigitalPreferences />
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}






