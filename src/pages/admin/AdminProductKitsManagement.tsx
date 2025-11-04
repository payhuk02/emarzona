/**
 * Page Admin Product Kits Management - Gestion des kits produits
 * Date: 27 Janvier 2025
 * 
 * Fonctionnalités:
 * - Gestion des kits produits
 * - Gestion des composants de kits
 * - Gestion des assemblages
 */

import { SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  ProductKitsManagement,
  KitComponents,
  KitAssemblies,
} from '@/components/physical/kits';
import { Package, Settings, Wrench } from 'lucide-react';

export default function AdminProductKitsManagement() {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col">
          <main className="flex-1 p-6 space-y-6">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Gestion des Kits Produits</h1>
              <p className="text-muted-foreground">
                Créez et gérez des kits composés de plusieurs produits
              </p>
            </div>

            <Tabs defaultValue="kits" className="space-y-6">
              <TabsList>
                <TabsTrigger value="kits">
                  <Package className="mr-2 h-4 w-4" />
                  Kits
                </TabsTrigger>
                <TabsTrigger value="components">
                  <Settings className="mr-2 h-4 w-4" />
                  Composants
                </TabsTrigger>
                <TabsTrigger value="assemblies">
                  <Wrench className="mr-2 h-4 w-4" />
                  Assemblages
                </TabsTrigger>
              </TabsList>

              <TabsContent value="kits" className="space-y-6">
                <ProductKitsManagement />
              </TabsContent>

              <TabsContent value="components" className="space-y-6">
                <KitComponents />
              </TabsContent>

              <TabsContent value="assemblies" className="space-y-6">
                <KitAssemblies />
              </TabsContent>
            </Tabs>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}

