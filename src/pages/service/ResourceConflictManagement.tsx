/**
 * Resource Conflict Management Page
 * Date: 28 Janvier 2025
 * 
 * Page de gestion complète des conflits de ressources
 */

import { useState } from 'react';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  AlertTriangle,
  Settings,
  Search,
  RefreshCw,
} from 'lucide-react';
import { useStore } from '@/hooks/useStore';
import { ResourceConflictDetector } from '@/components/service/ResourceConflictDetector';
import { ResourceConflictSettings } from '@/components/service/resources/ResourceConflictSettings';
import { ResourceAvailabilityChecker } from '@/components/service/resources/ResourceAvailabilityChecker';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';

export default function ResourceConflictManagement() {
  const { store } = useStore();
  const [activeTab, setActiveTab] = useState('conflicts');
  const headerRef = useScrollAnimation<HTMLDivElement>();
  const tabsRef = useScrollAnimation<HTMLDivElement>();

  if (!store) {
    return (
      <SidebarProvider>
        <div className="flex min-h-screen w-full">
          <AppSidebar />
          <main className="flex-1 p-8">
            <div className="text-center">
              <p className="text-muted-foreground">Chargement du store...</p>
            </div>
          </main>
        </div>
      </SidebarProvider>
    );
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        <main className="flex-1 overflow-auto">
          <div className="container mx-auto p-3 sm:p-4 lg:p-6 space-y-4 sm:space-y-6">
            {/* Header */}
            <div 
              ref={headerRef}
              className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 animate-in fade-in slide-in-from-top-4 duration-700"
            >
              <div className="flex items-center gap-2 sm:gap-3">
                <SidebarTrigger className="shrink-0" />
                <div>
                  <h1 className="text-lg sm:text-2xl md:text-3xl lg:text-4xl font-bold flex items-center gap-1.5 sm:gap-2">
                    <div className="p-1.5 sm:p-2 rounded-lg bg-gradient-to-br from-orange-500/10 to-red-500/5 border border-orange-500/20">
                      <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 lg:h-8 lg:w-8 text-orange-500" />
                    </div>
                    <span className="bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
                      Gestion des Conflits de Ressources
                    </span>
                  </h1>
                  <p className="text-[10px] sm:text-xs md:text-sm lg:text-base text-muted-foreground mt-1">
                    Détectez, analysez et résolvez les conflits de ressources
                  </p>
                </div>
              </div>
            </div>

            {/* Tabs */}
            <div ref={tabsRef} className="animate-in fade-in slide-in-from-bottom-4 duration-700">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4 sm:space-y-6">
                <TabsList className="grid w-full grid-cols-3 h-auto p-1 bg-muted/50 backdrop-blur-sm gap-1.5 sm:gap-2">
                  <TabsTrigger 
                    value="conflicts"
                    className="flex items-center justify-center gap-1 sm:gap-1.5 lg:gap-2 px-2 sm:px-3 md:px-4 py-2 sm:py-1.5 md:py-2 text-[10px] xs:text-xs sm:text-sm min-h-[44px] data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-600 data-[state=active]:to-red-600 data-[state=active]:text-white transition-all duration-300 whitespace-nowrap overflow-hidden text-ellipsis"
                  >
                    <AlertTriangle className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    <span className="hidden sm:inline">Conflits</span>
                    <span className="sm:hidden">Conflits</span>
                  </TabsTrigger>
                  <TabsTrigger 
                    value="checker"
                    className="flex items-center justify-center gap-1 sm:gap-1.5 lg:gap-2 px-2 sm:px-3 md:px-4 py-2 sm:py-1.5 md:py-2 text-[10px] xs:text-xs sm:text-sm min-h-[44px] data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-600 data-[state=active]:to-red-600 data-[state=active]:text-white transition-all duration-300 whitespace-nowrap overflow-hidden text-ellipsis"
                  >
                    <Search className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    <span className="hidden sm:inline">Vérification</span>
                    <span className="sm:hidden">Vérif.</span>
                  </TabsTrigger>
                  <TabsTrigger 
                    value="settings"
                    className="flex items-center justify-center gap-1 sm:gap-1.5 lg:gap-2 px-2 sm:px-3 md:px-4 py-2 sm:py-1.5 md:py-2 text-[10px] xs:text-xs sm:text-sm min-h-[44px] data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-600 data-[state=active]:to-red-600 data-[state=active]:text-white transition-all duration-300 whitespace-nowrap overflow-hidden text-ellipsis"
                  >
                    <Settings className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    <span className="hidden sm:inline">Paramètres</span>
                    <span className="sm:hidden">Param.</span>
                  </TabsTrigger>
                </TabsList>

                {/* Conflicts Tab */}
                <TabsContent value="conflicts" className="space-y-4 sm:space-y-6 mt-3 sm:mt-4 lg:mt-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
                  <ResourceConflictDetector
                    storeId={store.id}
                    autoDetect={true}
                  />
                </TabsContent>

                {/* Checker Tab */}
                <TabsContent value="checker" className="space-y-4 sm:space-y-6 mt-3 sm:mt-4 lg:mt-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
                  <ResourceAvailabilityChecker
                    storeId={store.id}
                  />
                </TabsContent>

                {/* Settings Tab */}
                <TabsContent value="settings" className="space-y-4 sm:space-y-6 mt-3 sm:mt-4 lg:mt-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
                  <ResourceConflictSettings
                    storeId={store.id}
                  />
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}







