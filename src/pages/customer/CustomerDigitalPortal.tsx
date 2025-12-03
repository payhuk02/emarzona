/**
 * Customer Digital Portal - Portail Client pour Produits Digitaux
 * Date: 2025-01-27
 * 
 * Page principale du portail client avec navigation par onglets
 */

import { useState } from 'react';
import { SidebarProvider, useSidebar } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Package, Key, Download, BarChart3, Settings, Menu } from 'lucide-react';
import { MyDigitalProducts } from '@/components/digital/customer/MyDigitalProducts';
import { MyLicenses } from '@/components/digital/customer/MyLicenses';
import { MyDownloads } from '@/components/digital/customer/MyDownloads';
import { DigitalProductStats } from '@/components/digital/customer/DigitalProductStats';
import { DigitalPreferences } from '@/components/digital/customer/DigitalPreferences';

// Composant interne pour utiliser useSidebar
function MobileHeader() {
  const { toggleSidebar } = useSidebar();
  
  return (
    <header className="sticky top-0 z-50 border-b bg-white dark:bg-gray-900 shadow-sm lg:hidden">
      <div className="flex h-14 sm:h-16 items-center gap-2 sm:gap-3 px-3 sm:px-4">
        {/* Hamburger Menu */}
        <button
          onClick={toggleSidebar}
          className="touch-manipulation h-10 w-10 sm:h-11 sm:w-11 min-h-[44px] min-w-[44px] p-0 flex items-center justify-center rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 active:bg-gray-200 dark:active:bg-gray-700 transition-colors border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 shadow-md hover:shadow-lg"
          aria-label="Ouvrir le menu"
          type="button"
        >
          <Menu className="h-6 w-6 sm:h-7 sm:w-7 text-gray-900 dark:text-gray-50" aria-hidden="true" />
        </button>
        
        {/* Titre avec Icône */}
        <div className="flex-1 min-w-0 flex items-center gap-2">
          <Package className="h-5 w-5 sm:h-6 sm:w-6 text-primary flex-shrink-0" aria-hidden="true" />
          <h1 className="text-sm sm:text-base md:text-lg font-bold truncate text-gray-900 dark:text-gray-50">
            Mon Portail Digital
          </h1>
        </div>
      </div>
    </header>
  );
}

// Composant interne pour le contenu principal
function CustomerDigitalPortalContent() {
  const [activeTab, setActiveTab] = useState('products');

  return (
    <div className="min-h-screen flex w-full bg-gray-50 dark:bg-gray-900">
      <AppSidebar />
      <main className="flex-1 flex flex-col min-w-0">
        {/* Mobile Header */}
        <MobileHeader />
        
        {/* Contenu principal */}
        <div className="flex-1 p-2.5 sm:p-3 md:p-4 lg:p-6 xl:p-8 overflow-x-hidden">
          <div className="max-w-7xl mx-auto space-y-3 sm:space-y-4 md:space-y-6">
            {/* Header - Desktop seulement */}
            <div className="hidden lg:block space-y-2">
              <h1 className="text-lg sm:text-2xl md:text-3xl lg:text-4xl font-bold flex items-center gap-2 sm:gap-3 text-gray-900 dark:text-gray-50">
                <Package className="h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8 lg:h-10 lg:w-10 text-primary flex-shrink-0" aria-hidden="true" />
                <span>Mon Portail Digital</span>
              </h1>
              <p className="text-[10px] sm:text-xs md:text-sm lg:text-base text-gray-600 dark:text-gray-400">
                Gérez tous vos produits digitaux, licences et téléchargements
              </p>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <div className="overflow-x-auto -mx-3 sm:mx-0 px-3 sm:px-0 scrollbar-hide">
                <TabsList className="inline-flex w-full sm:w-auto min-w-full sm:min-w-0 flex-nowrap sm:flex-wrap gap-1 sm:gap-2 p-1 h-auto bg-gray-100 dark:bg-gray-800">
                  <TabsTrigger 
                    value="products" 
                    className="text-[11px] xs:text-xs sm:text-sm px-2 xs:px-2.5 sm:px-3 py-1.5 sm:py-2 whitespace-nowrap min-h-[44px] touch-manipulation data-[state=active]:bg-white dark:data-[state=active]:bg-gray-900 flex items-center gap-1 sm:gap-2"
                  >
                    <Package className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                    <span className="hidden xs:inline">Mes Produits</span>
                    <span className="xs:hidden">P</span>
                  </TabsTrigger>
                  <TabsTrigger 
                    value="licenses" 
                    className="text-[11px] xs:text-xs sm:text-sm px-2 xs:px-2.5 sm:px-3 py-1.5 sm:py-2 whitespace-nowrap min-h-[44px] touch-manipulation data-[state=active]:bg-white dark:data-[state=active]:bg-gray-900 flex items-center gap-1 sm:gap-2"
                  >
                    <Key className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                    <span className="hidden xs:inline">Mes Licences</span>
                    <span className="xs:hidden">L</span>
                  </TabsTrigger>
                  <TabsTrigger 
                    value="downloads" 
                    className="text-[11px] xs:text-xs sm:text-sm px-2 xs:px-2.5 sm:px-3 py-1.5 sm:py-2 whitespace-nowrap min-h-[44px] touch-manipulation data-[state=active]:bg-white dark:data-[state=active]:bg-gray-900 flex items-center gap-1 sm:gap-2"
                  >
                    <Download className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                    <span className="hidden xs:inline">Téléchargements</span>
                    <span className="xs:hidden">T</span>
                  </TabsTrigger>
                  <TabsTrigger 
                    value="stats" 
                    className="text-[11px] xs:text-xs sm:text-sm px-2 xs:px-2.5 sm:px-3 py-1.5 sm:py-2 whitespace-nowrap min-h-[44px] touch-manipulation data-[state=active]:bg-white dark:data-[state=active]:bg-gray-900 flex items-center gap-1 sm:gap-2"
                  >
                    <BarChart3 className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                    <span className="hidden xs:inline">Statistiques</span>
                    <span className="xs:hidden">S</span>
                  </TabsTrigger>
                  <TabsTrigger 
                    value="preferences" 
                    className="text-[11px] xs:text-xs sm:text-sm px-2 xs:px-2.5 sm:px-3 py-1.5 sm:py-2 whitespace-nowrap min-h-[44px] touch-manipulation data-[state=active]:bg-white dark:data-[state=active]:bg-gray-900 flex items-center gap-1 sm:gap-2"
                  >
                    <Settings className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                    <span className="hidden xs:inline">Paramètres</span>
                    <span className="xs:hidden">⚙</span>
                  </TabsTrigger>
                </TabsList>
              </div>

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
        </div>
      </main>
    </div>
  );
}

// Composant principal avec SidebarProvider
export default function CustomerDigitalPortal() {
  return (
    <SidebarProvider>
      <CustomerDigitalPortalContent />
    </SidebarProvider>
  );
}

