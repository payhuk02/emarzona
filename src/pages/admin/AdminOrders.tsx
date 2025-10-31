import { useMemo, useEffect } from 'react';
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BoxIcon, TrendingUp, DollarSign, Package } from "lucide-react";
import { Admin2FABanner } from "@/components/admin/Admin2FABanner";
import { ProtectedAction } from "@/components/admin/ProtectedAction";
import { logger } from '@/lib/logger';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';

export default function AdminOrders() {
  // Animations au scroll
  const headerRef = useScrollAnimation<HTMLDivElement>();
  const statsRef = useScrollAnimation<HTMLDivElement>();

  // Mock data - à remplacer par vraies données
  const stats = useMemo(() => ({
    total: 1247,
    pending: 45,
    processing: 78,
    shipped: 892,
    delivered: 198,
    totalRevenue: 45780,
  }), []);

  useEffect(() => {
    logger.info('Admin Orders page chargée');
  }, []);

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        <main className="flex-1 overflow-auto p-6">
          <div className="max-w-7xl mx-auto space-y-6">
            <Admin2FABanner />
            {/* Header */}
            <div ref={headerRef} role="banner">
              <h1 className="text-3xl font-bold flex items-center gap-2" id="admin-orders-title">
                <BoxIcon className="h-8 w-8 text-primary" aria-hidden="true" />
                Gestion Commandes Globales
              </h1>
              <p className="text-muted-foreground mt-1">
                Vue administrateur de toutes les commandes de la plateforme
              </p>
            </div>

            {/* Stats */}
            <div ref={statsRef} className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-4" role="region" aria-label="Statistiques des commandes">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <Package className="h-4 w-4" />
                    Total Commandes
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.total}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Toutes les commandes
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <TrendingUp className="h-4 w-4" />
                    En Traitement
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.processing}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Commandes en cours
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <BoxIcon className="h-4 w-4" />
                    Livrées
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.delivered}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Ce mois-ci
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <DollarSign className="h-4 w-4" />
                    Revenu Total
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {stats.totalRevenue.toLocaleString()} FCFA
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Toutes commandes
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Table */}
            <ProtectedAction permission="orders.manage" fallback={
              <Card>
                <CardHeader>
                  <CardTitle>Liste des Commandes</CardTitle>
                  <CardDescription>Accès restreint</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-12 text-muted-foreground">
                    Vous n'avez pas la permission de gérer les commandes.
                  </div>
                </CardContent>
              </Card>
            }>
            <Card>
              <CardHeader>
                <CardTitle>Liste des Commandes</CardTitle>
                <CardDescription>
                  Gérez toutes les commandes de la plateforme
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12 text-muted-foreground" role="status" aria-live="polite">
                  <BoxIcon className="h-12 w-12 mx-auto mb-4" aria-hidden="true" />
                  <p>Fonctionnalité en développement</p>
                  <p className="text-sm mt-2">
                    La liste complète des commandes sera bientôt disponible
                  </p>
                </div>
              </CardContent>
            </Card>
            </ProtectedAction>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}

