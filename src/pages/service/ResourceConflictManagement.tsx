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

export default function ResourceConflictManagement() {
  const { store } = useStore();
  const [activeTab, setActiveTab] = useState('conflicts');

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
          <div className="container mx-auto p-4 lg:p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <SidebarTrigger />
                <div>
                  <h1 className="text-lg sm:text-2xl md:text-3xl font-bold flex items-center gap-1.5 sm:gap-2">
                    <div className="p-1.5 sm:p-2 rounded-lg bg-gradient-to-br from-orange-500/10 to-red-500/5 border border-orange-500/20">
                      <AlertTriangle className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 text-orange-500" />
                    </div>
                    <span className="bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
                      Gestion des Conflits de Ressources
                    </span>
                  </h1>
                  <p className="text-[10px] sm:text-xs md:text-sm text-muted-foreground mt-1">
                    Détectez, analysez et résolvez les conflits de ressources
                  </p>
                </div>
              </div>
            </div>

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
              <TabsList>
                <TabsTrigger value="conflicts">
                  <AlertTriangle className="h-4 w-4 mr-2" />
                  Conflits
                </TabsTrigger>
                <TabsTrigger value="checker">
                  <Search className="h-4 w-4 mr-2" />
                  Vérification
                </TabsTrigger>
                <TabsTrigger value="settings">
                  <Settings className="h-4 w-4 mr-2" />
                  Paramètres
                </TabsTrigger>
              </TabsList>

              {/* Conflicts Tab */}
              <TabsContent value="conflicts" className="space-y-6">
                <ResourceConflictDetector
                  storeId={store.id}
                  autoDetect={true}
                />
              </TabsContent>

              {/* Checker Tab */}
              <TabsContent value="checker" className="space-y-6">
                <ResourceAvailabilityChecker
                  storeId={store.id}
                />
              </TabsContent>

              {/* Settings Tab */}
              <TabsContent value="settings" className="space-y-6">
                <ResourceConflictSettings
                  storeId={store.id}
                />
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}

