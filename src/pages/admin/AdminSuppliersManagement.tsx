/**
 * Page Admin Suppliers Management - Gestion des fournisseurs
 * Date: 27 Janvier 2025
 * 
 * Fonctionnalités:
 * - Gestion des fournisseurs
 * - Gestion des commandes fournisseurs
 * - Règles de réapprovisionnement automatique
 */

import { SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  SuppliersManagement,
  SupplierProducts,
  SupplierOrders,
  AutoReorderRules,
} from '@/components/physical/suppliers';
import { Building2, Package, RefreshCw, ShoppingBag } from 'lucide-react';

export default function AdminSuppliersManagement() {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col">
          <main className="flex-1 p-6 space-y-6">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Gestion des Fournisseurs</h1>
              <p className="text-muted-foreground">
                Gérez vos fournisseurs, commandes et réapprovisionnements automatiques
              </p>
            </div>

            <Tabs defaultValue="suppliers" className="space-y-6">
              <TabsList>
                <TabsTrigger value="suppliers">
                  <Building2 className="mr-2 h-4 w-4" />
                  Fournisseurs
                </TabsTrigger>
                <TabsTrigger value="products">
                  <ShoppingBag className="mr-2 h-4 w-4" />
                  Produits
                </TabsTrigger>
                <TabsTrigger value="orders">
                  <Package className="mr-2 h-4 w-4" />
                  Commandes
                </TabsTrigger>
                <TabsTrigger value="reorder-rules">
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Réapprovisionnement
                </TabsTrigger>
              </TabsList>

              <TabsContent value="suppliers" className="space-y-6">
                <SuppliersManagement />
              </TabsContent>

              <TabsContent value="products" className="space-y-6">
                <SupplierProducts />
              </TabsContent>

              <TabsContent value="orders" className="space-y-6">
                <SupplierOrders />
              </TabsContent>

              <TabsContent value="reorder-rules" className="space-y-6">
                <AutoReorderRules />
              </TabsContent>
            </Tabs>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}

