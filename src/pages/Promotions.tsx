import { useState } from "react";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Tag } from "lucide-react";
import { useStore } from "@/hooks/use-store";
import { usePromotions } from "@/hooks/usePromotions";
import { CreatePromotionDialog } from "@/components/promotions/CreatePromotionDialog";
import { PromotionsTable } from "@/components/promotions/PromotionsTable";
import { PromotionFilters } from "@/components/promotions/PromotionFilters";
import { Skeleton } from "@/components/ui/skeleton";

const Promotions = () => {
  const { store, loading: storeLoading } = useStore();
  const { promotions, loading: promotionsLoading, refetch } = usePromotions(store?.id);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const filteredPromotions = promotions?.filter((promo) => {
    const matchesSearch = 
      promo.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      promo.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = 
      statusFilter === "all" || 
      (statusFilter === "active" && promo.is_active) ||
      (statusFilter === "inactive" && !promo.is_active);
    
    return matchesSearch && matchesStatus;
  });

  if (storeLoading) {
    return (
      <SidebarProvider>
        <div className="flex min-h-screen w-full">
          <AppSidebar />
          <main className="flex-1 p-6">
            <Skeleton className="h-8 w-64 mb-6" />
            <Skeleton className="h-96 w-full" />
          </main>
        </div>
      </SidebarProvider>
    );
  }

  if (!store) {
    return (
      <SidebarProvider>
        <div className="flex min-h-screen w-full">
          <AppSidebar />
          <main className="flex-1 p-6">
            <Card>
              <CardHeader>
                <CardTitle>Boutique non configurée</CardTitle>
                <CardDescription>
                  Veuillez d'abord créer votre boutique pour gérer vos promotions.
                </CardDescription>
              </CardHeader>
            </Card>
          </main>
        </div>
      </SidebarProvider>
    );
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background">
        <AppSidebar />
        <main className="flex-1 p-4 md:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h1 className="text-3xl font-bold tracking-tight">Promotions</h1>
                <p className="text-muted-foreground mt-1">
                  Gérez vos codes promo et réductions
                </p>
              </div>
              <Button onClick={() => setIsCreateDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Nouvelle promotion
              </Button>
            </div>

            {/* Filters */}
            <PromotionFilters
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              statusFilter={statusFilter}
              onStatusChange={setStatusFilter}
            />

            {/* Promotions Table */}
            {promotionsLoading ? (
              <Card>
                <CardContent className="p-6">
                  <Skeleton className="h-96 w-full" />
                </CardContent>
              </Card>
            ) : filteredPromotions && filteredPromotions.length > 0 ? (
              <PromotionsTable promotions={filteredPromotions} onUpdate={refetch} />
            ) : (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Tag className="h-16 w-16 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Aucune promotion</h3>
                  <p className="text-muted-foreground text-center mb-4">
                    {searchQuery || statusFilter !== "all"
                      ? "Aucune promotion ne correspond à vos filtres"
                      : "Commencez par créer votre première promotion"}
                  </p>
                  {!searchQuery && statusFilter === "all" && (
                    <Button onClick={() => setIsCreateDialogOpen(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Créer une promotion
                    </Button>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          <CreatePromotionDialog
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

export default Promotions;
