import { useState, useEffect, useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Users, ShoppingBag, DollarSign, TrendingUp, ChevronLeft, ChevronRight } from "lucide-react";
import { useStore } from "@/hooks/useStore";
import { useCustomers } from "@/hooks/useCustomers";
import { CreateCustomerDialog } from "@/components/customers/CreateCustomerDialog";
import { CustomersTable } from "@/components/customers/CustomersTable";
import { CustomerFilters } from "@/components/customers/CustomerFilters";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";
import { logger } from "@/lib/logger";

const Customers = () => {
  const navigate = useNavigate();
  const { store, loading: storeLoading } = useStore();
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 20;
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<'name' | 'created_at' | 'total_orders' | 'total_spent'>('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const queryClient = useQueryClient();

  // Utiliser le hook avec pagination serveur
  const { data: customersResult, isLoading: customersLoading, refetch } = useCustomers(store?.id, {
    page: currentPage,
    pageSize,
    searchQuery: searchQuery || undefined,
    sortBy,
    sortOrder,
  });
  const customers = customersResult?.data || [];
  const totalCount = customersResult?.count || 0;
  const totalPages = Math.ceil(totalCount / pageSize);

  // --- 🔄 Realtime pour les clients du store ---
  useEffect(() => {
    if (!store?.id) return;

    const channel = supabase
      .channel(`realtime:customers:${store.id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "customers", filter: `store_id=eq.${store.id}` },
        (payload) => {
          logger.info("Realtime customers payload", { payload });

          // Invalider les queries pour rafraîchir
          queryClient.invalidateQueries({ queryKey: ['customers', store.id] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [store?.id, queryClient]);

  // Refs for animations
  const headerRef = useScrollAnimation<HTMLDivElement>();

  // Les clients sont déjà filtrés et triés côté serveur
  const filteredCustomers = customers;

  // Stats calculées (basées sur le total, pas seulement la page actuelle)
  const stats = useMemo(() => {
    // Pour les stats, on utilise les données de la page actuelle
    // Note: Pour des stats précises, il faudrait une requête séparée
    const total = totalCount;
    const totalOrders = customers.reduce((sum, c) => sum + (c.total_orders || 0), 0);
    const totalSpent = customers.reduce((sum, c) => sum + (Number(c.total_spent) || 0), 0);
    const averageSpent = customers.length > 0 ? totalSpent / customers.length : 0;
    
    return { total, totalOrders, totalSpent, averageSpent };
  }, [customers, totalCount]);

  // --- 🧱 Loading du store ---
  if (storeLoading) {
    return (
      <SidebarProvider>
        <div className="flex min-h-screen w-full overflow-x-hidden">
          <AppSidebar />
          <main className="flex-1 overflow-auto">
            <div className="container mx-auto p-3 sm:p-4 lg:p-6 space-y-4 sm:space-y-6">
              <Skeleton className="h-8 sm:h-10 w-48 sm:w-64 mb-4 sm:mb-6" />
              <Skeleton className="h-96 w-full" />
            </div>
          </main>
        </div>
      </SidebarProvider>
    );
  }

  // --- ❌ Pas de boutique configurée ---
  if (!store) {
    return (
      <SidebarProvider>
        <div className="flex min-h-screen w-full overflow-x-hidden">
          <AppSidebar />
          <main className="flex-1 overflow-auto">
            <div className="container mx-auto p-3 sm:p-4 lg:p-6">
              <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-xs sm:text-sm md:text-base lg:text-lg xl:text-xl font-bold">Aucune boutique sélectionnée</CardTitle>
                  <CardDescription className="text-[10px] sm:text-xs md:text-sm lg:text-base mt-2">
                    Veuillez sélectionner une boutique ou créer une nouvelle boutique pour gérer vos clients.
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="flex flex-col sm:flex-row gap-3">
                    <Button 
                      onClick={() => navigate("/dashboard/store")} 
                      className="min-h-[44px] bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white text-xs sm:text-sm"
                    >
                      <Plus className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
                      Créer une boutique
                    </Button>
                    <Button 
                      variant="outline"
                      onClick={() => navigate("/dashboard")}
                      className="min-h-[44px] text-xs sm:text-sm"
                    >
                      Retour au tableau de bord
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </main>
        </div>
      </SidebarProvider>
    );
  }

  // --- ✅ Interface principale ---
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full overflow-x-hidden">
        <AppSidebar />
        <main className="flex-1 overflow-auto">
          <div className="container mx-auto p-3 sm:p-4 lg:p-6 space-y-4 sm:space-y-6">
            {/* Header - Responsive & Animated */}
            <div 
              ref={headerRef}
              className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 animate-in fade-in slide-in-from-top-4 duration-700"
            >
              <div>
                <h1 className="text-lg sm:text-2xl md:text-3xl lg:text-4xl font-bold flex items-center gap-1.5 sm:gap-2 mb-1 sm:mb-2">
                  <div className="p-1.5 sm:p-2 rounded-lg bg-gradient-to-br from-purple-500/10 to-pink-500/5 backdrop-blur-sm border border-purple-500/20 animate-in zoom-in duration-500">
                    <Users className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 lg:h-8 lg:w-8 text-purple-500 dark:text-purple-400" aria-hidden="true" />
                  </div>
                  <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                    Clients
                  </span>
                </h1>
                <p className="text-[10px] sm:text-xs md:text-sm lg:text-base text-muted-foreground">
                  Gérez et fidélisez votre clientèle
                </p>
              </div>
              <Button 
                onClick={() => setIsCreateDialogOpen(true)}
                className="min-h-[44px] bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 text-xs sm:text-sm"
                size="sm"
              >
                <Plus className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
                <span className="hidden sm:inline">Nouveau client</span>
                <span className="sm:hidden">Nouveau</span>
              </Button>
            </div>

            {/* Stats Cards - Responsive */}
            {!customersLoading && (
              <div className="grid gap-3 sm:gap-4 grid-cols-2 sm:grid-cols-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
                <Card className="border-border/50 bg-card/50 backdrop-blur-sm hover:shadow-lg transition-all duration-300 hover:scale-[1.02]">
                  <CardHeader className="pb-1.5 sm:pb-2 md:pb-3 p-2.5 sm:p-3 md:p-4">
                    <CardTitle className="text-[9px] sm:text-[10px] md:text-xs lg:text-sm font-medium text-muted-foreground flex items-center gap-1 sm:gap-1.5 md:gap-2">
                      <Users className="h-2.5 w-2.5 sm:h-3 sm:w-3 md:h-3.5 md:w-3.5 lg:h-4 lg:w-4" />
                      Total Clients
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-2.5 sm:p-3 md:p-4 pt-0">
                    <div className="text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                      {stats.total}
                    </div>
                  </CardContent>
                </Card>
                <Card className="border-border/50 bg-card/50 backdrop-blur-sm hover:shadow-lg transition-all duration-300 hover:scale-[1.02]">
                  <CardHeader className="pb-1.5 sm:pb-2 md:pb-3 p-2.5 sm:p-3 md:p-4">
                    <CardTitle className="text-[9px] sm:text-[10px] md:text-xs lg:text-sm font-medium text-muted-foreground flex items-center gap-1 sm:gap-1.5 md:gap-2">
                      <ShoppingBag className="h-2.5 w-2.5 sm:h-3 sm:w-3 md:h-3.5 md:w-3.5 lg:h-4 lg:w-4" />
                      Total Commandes
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-2.5 sm:p-3 md:p-4 pt-0">
                    <div className="text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                      {stats.totalOrders}
                    </div>
                  </CardContent>
                </Card>
                <Card className="border-border/50 bg-card/50 backdrop-blur-sm hover:shadow-lg transition-all duration-300 hover:scale-[1.02]">
                  <CardHeader className="pb-1.5 sm:pb-2 md:pb-3 p-2.5 sm:p-3 md:p-4">
                    <CardTitle className="text-[9px] sm:text-[10px] md:text-xs lg:text-sm font-medium text-muted-foreground flex items-center gap-1 sm:gap-1.5 md:gap-2">
                      <DollarSign className="h-2.5 w-2.5 sm:h-3 sm:w-3 md:h-3.5 md:w-3.5 lg:h-4 lg:w-4" />
                      Total Dépensé
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-2.5 sm:p-3 md:p-4 pt-0">
                    <div className="text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                      {stats.totalSpent.toLocaleString()}
                    </div>
                  </CardContent>
                </Card>
                <Card className="border-border/50 bg-card/50 backdrop-blur-sm hover:shadow-lg transition-all duration-300 hover:scale-[1.02]">
                  <CardHeader className="pb-1.5 sm:pb-2 md:pb-3 p-2.5 sm:p-3 md:p-4">
                    <CardTitle className="text-[9px] sm:text-[10px] md:text-xs lg:text-sm font-medium text-muted-foreground flex items-center gap-1 sm:gap-1.5 md:gap-2">
                      <TrendingUp className="h-2.5 w-2.5 sm:h-3 sm:w-3 md:h-3.5 md:w-3.5 lg:h-4 lg:w-4" />
                      Moyenne
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-2.5 sm:p-3 md:p-4 pt-0">
                    <div className="text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
                      {stats.averageSpent.toLocaleString()}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Filtres */}
            <CustomerFilters
              searchQuery={searchQuery}
              onSearchChange={(value) => {
                setSearchQuery(value);
                setCurrentPage(1); // Reset to first page on search
              }}
              sortBy={sortBy}
              onSortChange={(value) => {
                setSortBy(value);
                setCurrentPage(1); // Reset to first page on sort change
              }}
              sortOrder={sortOrder}
              onSortOrderChange={setSortOrder}
            />

            {/* Table ou état vide */}
            {customersLoading ? (
              <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
                <CardContent className="p-4 sm:p-6">
                  <Skeleton className="h-96 w-full" />
                </CardContent>
              </Card>
            ) : filteredCustomers.length > 0 ? (
              <>
                <CustomersTable customers={filteredCustomers} onUpdate={refetch} />
                
                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4 mt-4">
                    <div className="text-xs sm:text-sm text-muted-foreground">
                      Page {currentPage} sur {totalPages} ({totalCount} clients)
                    </div>
                    <div className="flex items-center gap-1 sm:gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                        disabled={currentPage === 1 || customersLoading}
                        className="min-h-[44px] min-w-[44px] h-11 w-11 p-0 text-xs sm:text-sm"
                        aria-label="Page précédente"
                      >
                        <ChevronLeft className="h-4 w-4 sm:h-5 sm:w-5" />
                      </Button>
                      <div className="flex items-center gap-1">
                        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                          let pageNum;
                          if (totalPages <= 5) {
                            pageNum = i + 1;
                          } else if (currentPage <= 3) {
                            pageNum = i + 1;
                          } else if (currentPage >= totalPages - 2) {
                            pageNum = totalPages - 4 + i;
                          } else {
                            pageNum = currentPage - 2 + i;
                          }
                          return (
                            <Button
                              key={pageNum}
                              variant={currentPage === pageNum ? "default" : "outline"}
                              size="sm"
                              onClick={() => setCurrentPage(pageNum)}
                              disabled={customersLoading}
                              className="min-h-[44px] min-w-[44px] h-11 w-11 text-xs sm:text-sm"
                              aria-label={`Aller à la page ${pageNum}`}
                              aria-current={currentPage === pageNum ? "page" : undefined}
                            >
                              {pageNum}
                            </Button>
                          );
                        })}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                        disabled={currentPage === totalPages || customersLoading}
                        className="min-h-[44px] min-w-[44px] h-11 w-11 p-0 text-xs sm:text-sm"
                        aria-label="Page suivante"
                      >
                        <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5" />
                      </Button>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
                <CardContent className="flex flex-col items-center justify-center py-12 sm:py-16 text-center">
                  <div className="p-4 rounded-full bg-gradient-to-br from-purple-500/10 to-pink-500/5 mb-4 animate-in zoom-in duration-500">
                    <Users className="h-12 w-12 sm:h-16 sm:w-16 text-muted-foreground" />
                  </div>
                  <h3 className="text-xs sm:text-sm md:text-base lg:text-lg xl:text-xl font-semibold mb-1.5 sm:mb-2">Aucun client</h3>
                  <p className="text-[10px] sm:text-xs md:text-sm lg:text-base text-muted-foreground mb-3 sm:mb-4 md:mb-6 max-w-md">
                    {searchQuery
                      ? "Aucun client ne correspond à votre recherche"
                      : "Commencez par ajouter votre premier client"}
                  </p>
                  {!searchQuery && (
                    <Button 
                      onClick={() => setIsCreateDialogOpen(true)}
                      className="min-h-[44px] bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 text-sm sm:text-base"
                    >
                      <Plus className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                      <span className="text-sm sm:text-base">Ajouter un client</span>
                    </Button>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Modale création client */}
          <CreateCustomerDialog
            open={isCreateDialogOpen}
            onOpenChange={setIsCreateDialogOpen}
            onSuccess={refetch}
            storeId={store.id}
          />
        </main>
      </div>
    </SidebarProvider>
  );
};

export default Customers;
