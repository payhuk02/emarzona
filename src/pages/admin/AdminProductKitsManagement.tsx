/**
 * Page Admin Product Kits Management - Gestion des kits produits
 * Date: 27 Janvier 2025
 *
 * Fonctionnalités:
 * - Gestion des kits produits
 * - Gestion des composants de kits
 * - Gestion des assemblages
 * Style inspiré de "MyTemplates" avec design responsive et gradients purple-pink
 */

import { useMemo } from 'react';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ProductKitsManagement, KitComponents, KitAssemblies } from '@/components/physical/kits';
import { Package, Settings, Wrench, CheckCircle2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useStore } from '@/hooks/useStore';
import { useProductKits } from '@/hooks/physical/useProductKits';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';

export default function AdminProductKitsManagement() {
  const { store, isLoading: storeLoading } = useStore();
  const headerRef = useScrollAnimation<HTMLDivElement>();
  const statsRef = useScrollAnimation<HTMLDivElement>();

  const { data: kits = [], isLoading: kitsLoading } = useProductKits(store?.id);

  // Calculer les stats
  const stats = useMemo(() => {
    const total = kits.length;
    const active = kits.filter(k => k.is_active).length;
    const requiresAssembly = kits.filter(k => k.requires_assembly).length;
    const fixed = kits.filter(k => k.kit_type === 'fixed').length;

    return { total, active, requiresAssembly, fixed };
  }, [kits]);

  // Loading state
  if (storeLoading || kitsLoading) {
    return (
      <SidebarProvider>
        <div className="flex min-h-screen w-full bg-background">
          <AppSidebar />
          <main className="flex-1 overflow-auto pb-16 md:pb-0">
            <div className="container mx-auto p-3 sm:p-4 lg:p-6 space-y-4 sm:space-y-6">
              <Skeleton className="h-10 w-64" />
              <div className="grid gap-3 sm:gap-4 grid-cols-2 sm:grid-cols-4">
                {[1, 2, 3, 4].map(i => (
                  <Skeleton key={i} className="h-24" />
                ))}
              </div>
              <Skeleton className="h-96 w-full" />
            </div>
          </main>
        </div>
      </SidebarProvider>
    );
  }

  // No store state
  if (!store) {
    return (
      <SidebarProvider>
        <div className="flex min-h-screen w-full bg-background">
          <AppSidebar />
          <main className="flex-1 overflow-auto pb-16 md:pb-0">
            <div className="container mx-auto p-3 sm:p-4 lg:p-6">
              <Card className="border-border/50 bg-card/50 backdrop-blur-sm animate-in fade-in zoom-in-95 duration-500">
                <CardContent className="pt-8 sm:pt-12 pb-8 sm:pb-12 text-center">
                  <Package className="h-12 w-12 sm:h-16 sm:w-16 mx-auto text-muted-foreground mb-4 animate-in zoom-in-95 duration-500" />
                  <p className="text-sm sm:text-base text-muted-foreground mb-4">
                    Aucune boutique trouvée
                  </p>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    Veuillez créer une boutique pour gérer vos kits produits
                  </p>
                </CardContent>
              </Card>
            </div>
          </main>
        </div>
      </SidebarProvider>
    );
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background">
        <AppSidebar />
        <main className="flex-1 overflow-auto pb-16 md:pb-0">
          <div className="container mx-auto p-3 sm:p-4 lg:p-6 space-y-4 sm:space-y-6">
            {/* Header - Responsive & Animated */}
            <div
              ref={headerRef}
              className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 animate-in fade-in slide-in-from-top-4 duration-700"
            >
              <div className="flex items-start sm:items-center gap-2 sm:gap-3">
                <SidebarTrigger className="mt-1 sm:mt-0 shrink-0" />
                <div className="flex-1 min-w-0">
                  <h1 className="text-lg sm:text-2xl md:text-3xl lg:text-4xl font-bold flex items-center gap-1.5 sm:gap-2 mb-1 sm:mb-2">
                    <div className="p-1.5 sm:p-2 rounded-lg bg-gradient-to-br from-purple-500/10 to-pink-500/5 backdrop-blur-sm border border-purple-500/20 animate-in zoom-in duration-500 shrink-0">
                      <Package
                        className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 lg:h-8 lg:w-8 text-purple-500 dark:text-purple-400"
                        aria-hidden="true"
                      />
                    </div>
                    <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent break-words">
                      Gestion des Kits Produits
                    </span>
                  </h1>
                  <p className="text-[10px] sm:text-xs md:text-sm lg:text-base text-muted-foreground">
                    Créez et gérez des kits composés de plusieurs produits
                  </p>
                </div>
              </div>
            </div>

            {/* Stats Cards - Responsive & Animated */}
            <div
              ref={statsRef}
              className="grid gap-3 sm:gap-4 grid-cols-2 sm:grid-cols-4 animate-in fade-in slide-in-from-bottom-4 duration-700"
            >
              {[
                {
                  label: 'Kits totaux',
                  value: stats.total,
                  icon: Package,
                  color: 'from-purple-600 to-pink-600',
                },
                {
                  label: 'Actifs',
                  value: stats.active,
                  icon: CheckCircle2,
                  color: 'from-green-600 to-emerald-600',
                },
                {
                  label: 'Assemblages',
                  value: stats.requiresAssembly,
                  icon: Wrench,
                  color: 'from-blue-600 to-cyan-600',
                },
                {
                  label: 'Fixes',
                  value: stats.fixed,
                  icon: Settings,
                  color: 'from-yellow-600 to-orange-600',
                },
              ].map((stat, index) => {
                const Icon = stat.icon;
                return (
                  <Card
                    key={stat.label}
                    className="border-border/50 bg-card/50 backdrop-blur-sm hover:shadow-lg transition-all duration-300 hover:scale-[1.02] animate-in fade-in slide-in-from-bottom-4"
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <CardHeader className="pb-1.5 sm:pb-2 md:pb-3 p-2.5 sm:p-3 md:p-4">
                      <CardTitle className="text-[9px] sm:text-[10px] md:text-xs lg:text-sm font-medium text-muted-foreground flex items-center gap-1 sm:gap-1.5 md:gap-2">
                        <Icon className="h-2.5 w-2.5 sm:h-3 sm:w-3 md:h-3.5 md:w-3.5 lg:h-4 lg:w-4" />
                        {stat.label}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-2.5 sm:p-3 md:p-4 pt-0">
                      <div
                        className={`text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl font-bold bg-gradient-to-r ${stat.color} bg-clip-text text-transparent break-words`}
                      >
                        {stat.value}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* Tabs - Responsive & Animated */}
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
              <Tabs defaultValue="kits" className="w-full">
                <TabsList className="bg-muted/50 backdrop-blur-sm h-auto p-1 w-full sm:w-auto grid grid-cols-3 sm:flex">
                  <TabsTrigger
                    value="kits"
                    className="flex-1 sm:flex-none gap-1.5 sm:gap-2 px-2 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm min-h-[44px] data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-pink-600 data-[state=active]:text-white transition-all duration-300"
                  >
                    <Package className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    <span className="hidden sm:inline">Kits</span>
                  </TabsTrigger>
                  <TabsTrigger
                    value="components"
                    className="flex-1 sm:flex-none gap-1.5 sm:gap-2 px-2 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm min-h-[44px] data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-pink-600 data-[state=active]:text-white transition-all duration-300"
                  >
                    <Settings className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    <span className="hidden sm:inline">Composants</span>
                    <span className="sm:hidden">Comp.</span>
                  </TabsTrigger>
                  <TabsTrigger
                    value="assemblies"
                    className="flex-1 sm:flex-none gap-1.5 sm:gap-2 px-2 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm min-h-[44px] data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-pink-600 data-[state=active]:text-white transition-all duration-300"
                  >
                    <Wrench className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    <span className="hidden sm:inline">Assemblages</span>
                    <span className="sm:hidden">Assem.</span>
                  </TabsTrigger>
                </TabsList>

                <TabsContent
                  value="kits"
                  className="mt-4 sm:mt-6 animate-in fade-in slide-in-from-bottom-4 duration-700"
                >
                  <ProductKitsManagement />
                </TabsContent>

                <TabsContent
                  value="components"
                  className="mt-4 sm:mt-6 animate-in fade-in slide-in-from-bottom-4 duration-700"
                >
                  <KitComponents />
                </TabsContent>

                <TabsContent
                  value="assemblies"
                  className="mt-4 sm:mt-6 animate-in fade-in slide-in-from-bottom-4 duration-700"
                >
                  <KitAssemblies />
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}






