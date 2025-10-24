import { useState } from "react";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Package, Download } from "lucide-react";
import { useStore } from "@/hooks/use-store";
import { useOrders } from "@/hooks/useOrders";
import { CreateOrderDialog } from "@/components/orders/CreateOrderDialog";
import { OrdersTable } from "@/components/orders/OrdersTable";
import { OrderFilters } from "@/components/orders/OrderFilters";
import { OrdersPagination } from "@/components/orders/OrdersPagination";
import { Skeleton } from "@/components/ui/skeleton";
import { exportOrdersToCSV } from "@/lib/export-utils";
import { useToast } from "@/hooks/use-toast";

const Orders = () => {
  const { store, loading: storeLoading } = useStore();
  const { toast } = useToast();
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(25);
  const { orders, loading: ordersLoading, totalCount, refetch } = useOrders(store?.id, { page, pageSize });
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [paymentStatusFilter, setPaymentStatusFilter] = useState<string>("all");

  const totalPages = Math.ceil(totalCount / pageSize);

  const handleExportCSV = () => {
    try {
      if (!filteredOrders || filteredOrders.length === 0) {
        toast({
          title: "Attention",
          description: "Aucune commande à exporter",
          variant: "destructive",
        });
        return;
      }

      exportOrdersToCSV(filteredOrders);
      toast({
        title: "Succès",
        description: `${filteredOrders.length} commande(s) exportée(s)`,
      });
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive",
      });
    }
  };

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
              <div className="flex gap-2">
                <Button variant="outline" onClick={handleExportCSV} disabled={!orders || orders.length === 0}>
                  <Download className="h-4 w-4 mr-2" />
                  Exporter CSV
                </Button>
                <Button onClick={() => setIsCreateDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Nouvelle commande
                </Button>
              </div>
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
              <>
                <OrdersTable orders={filteredOrders} onUpdate={refetch} storeId={store.id} />
                {totalCount > 10 && (
                  <OrdersPagination
                    currentPage={page}
                    totalPages={totalPages}
                    pageSize={pageSize}
                    totalItems={totalCount}
                    onPageChange={setPage}
                    onPageSizeChange={(newSize) => {
                      setPageSize(newSize);
                      setPage(0);
                    }}
                  />
                )}
              </>
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
