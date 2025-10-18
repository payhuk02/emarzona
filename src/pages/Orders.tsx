import { useState } from "react";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Package } from "lucide-react";
import { useStore } from "@/hooks/use-store";
import { useOrders } from "@/hooks/useOrders";
import { CreateOrderDialog } from "@/components/orders/CreateOrderDialog";
import { OrdersTable } from "@/components/orders/OrdersTable";
import { OrderFilters } from "@/components/orders/OrderFilters";
import { Skeleton } from "@/components/ui/skeleton";

const Orders = () => {
  const { store, loading: storeLoading } = useStore();
  const { orders, loading: ordersLoading, refetch } = useOrders(store?.id);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [paymentStatusFilter, setPaymentStatusFilter] = useState<string>("all");

  const filteredOrders = orders?.filter((order) => {
    const matchesSearch = 
      order.order_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.customers?.name?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || order.status === statusFilter;
    const matchesPayment = paymentStatusFilter === "all" || order.payment_status === paymentStatusFilter;
    
    return matchesSearch && matchesStatus && matchesPayment;
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
                  Veuillez d'abord créer votre boutique pour gérer vos commandes.
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
                <h1 className="text-3xl font-bold tracking-tight">Commandes</h1>
                <p className="text-muted-foreground mt-1">
                  Gérez toutes vos commandes
                </p>
              </div>
              <Button onClick={() => setIsCreateDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Nouvelle commande
              </Button>
            </div>

            {/* Filters */}
            <OrderFilters
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              statusFilter={statusFilter}
              onStatusChange={setStatusFilter}
              paymentStatusFilter={paymentStatusFilter}
              onPaymentStatusChange={setPaymentStatusFilter}
            />

            {/* Orders Table */}
            {ordersLoading ? (
              <Card>
                <CardContent className="p-6">
                  <Skeleton className="h-96 w-full" />
                </CardContent>
              </Card>
            ) : filteredOrders && filteredOrders.length > 0 ? (
              <OrdersTable orders={filteredOrders} onUpdate={refetch} />
            ) : (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Package className="h-16 w-16 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Aucune commande</h3>
                  <p className="text-muted-foreground text-center mb-4">
                    {searchQuery || statusFilter !== "all" || paymentStatusFilter !== "all"
                      ? "Aucune commande ne correspond à vos filtres"
                      : "Commencez par créer votre première commande"}
                  </p>
                  {!searchQuery && statusFilter === "all" && paymentStatusFilter === "all" && (
                    <Button onClick={() => setIsCreateDialogOpen(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Créer une commande
                    </Button>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          <CreateOrderDialog
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

export default Orders;
