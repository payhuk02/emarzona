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

export default function AdminWarehousesManagement() {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col">
          <main className="flex-1 p-6 space-y-6">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Gestion des Entrepôts</h1>
              <p className="text-muted-foreground">
                Gérez vos entrepôts, inventaire et transferts de stock
              </p>
            </div>

            <Tabs defaultValue="warehouses" className="space-y-6">
              <TabsList>
                <TabsTrigger value="warehouses">
                  <WarehouseIcon className="mr-2 h-4 w-4" />
                  Entrepôts
                </TabsTrigger>
                <TabsTrigger value="inventory">
                  <Package className="mr-2 h-4 w-4" />
                  Inventaire
                </TabsTrigger>
                <TabsTrigger value="transfers">
                  <Truck className="mr-2 h-4 w-4" />
                  Transferts
                </TabsTrigger>
              </TabsList>

              <TabsContent value="warehouses" className="space-y-6">
                <WarehousesManagement />
              </TabsContent>

              <TabsContent value="inventory" className="space-y-6">
                <WarehouseInventory />
              </TabsContent>

              <TabsContent value="transfers" className="space-y-6">
                <WarehouseTransfers />
              </TabsContent>
            </Tabs>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}

