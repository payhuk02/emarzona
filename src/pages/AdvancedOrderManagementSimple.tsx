import React from 'react';
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Package, Shield } from "lucide-react";
import { useStore } from "@/hooks/use-store";

const AdvancedOrderManagementSimple = () => {
  const { store, loading: storeLoading } = useStore();

  if (storeLoading) {
    return (
      <SidebarProvider>
        <div className="flex min-h-screen w-full">
          <AppSidebar />
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
              <p className="mt-2 text-muted-foreground">Chargement...</p>
            </div>
          </div>
        </div>
      </SidebarProvider>
    );
  }

  if (!store) {
    return (
      <SidebarProvider>
        <div className="flex min-h-screen w-full">
          <AppSidebar />
          <div className="flex-1 flex items-center justify-center">
            <Card className="max-w-md">
              <CardHeader className="text-center">
                <div className="flex justify-center mb-4">
                  <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center">
                    <Package className="h-8 w-8 text-muted-foreground" />
                  </div>
                </div>
                <CardTitle>Créez votre boutique d'abord</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-muted-foreground">
                  Vous devez créer une boutique avant de pouvoir gérer les commandes avancées
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </SidebarProvider>
    );
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col">
          <header className="sticky top-0 z-10 border-b bg-card shadow-soft">
            <div className="flex h-16 items-center gap-4 px-4 sm:px-6">
              <SidebarTrigger />
              <div className="flex-1">
                <h1 className="text-xl sm:text-2xl font-bold">Gestion avancée des commandes (Test)</h1>
                <p className="text-sm text-muted-foreground">
                  Version simplifiée pour diagnostiquer le problème
                </p>
              </div>
            </div>
          </header>

          <main className="flex-1 p-4 sm:p-6 bg-gradient-hero">
            <div className="max-w-7xl mx-auto space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    Test de chargement
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p>Boutique ID: {store.id}</p>
                  <p>Boutique Nom: {store.name}</p>
                  <p className="mt-4 text-green-600 font-semibold">
                    ✅ Si vous voyez ce message, le problème vient des hooks useAdvancedPayments ou useMessaging
                  </p>
                </CardContent>
              </Card>
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default AdvancedOrderManagementSimple;

