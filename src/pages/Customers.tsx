import { useState, useEffect, useMemo } from "react";
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
import { Plus, Users } from "lucide-react";
import { useStore } from "@/hooks/use-store";
import { useCustomers } from "@/hooks/useCustomers";
import { CreateCustomerDialog } from "@/components/customers/CreateCustomerDialog";
import { CustomersTable } from "@/components/customers/CustomersTable";
import { CustomerFilters } from "@/components/customers/CustomerFilters";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";

const Customers = () => {
  const { store, loading: storeLoading } = useStore();
  const {
    customers,
    loading: customersLoading,
    refetch,
    setCustomers,
  } = useCustomers(store?.id);

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<string>("name");

  // --- 🔄 Realtime pour les clients du store ---
  useEffect(() => {
    if (!store?.id) return;

    const channel = supabase
      .channel(`realtime:customers:${store.id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "customers", filter: `store_id=eq.${store.id}` },
        (payload) => {
          console.log("🧩 Realtime customers payload:", payload);

          setCustomers((prev: any[]) => {
            if (payload.eventType === "INSERT") {
              return [payload.new, ...prev];
            }
            if (payload.eventType === "UPDATE") {
              return prev.map((c) => (c.id === payload.new.id ? payload.new : c));
            }
            if (payload.eventType === "DELETE") {
              return prev.filter((c) => c.id !== payload.old.id);
            }
            return prev;
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [store?.id, setCustomers]);

  // --- 🔍 Filtrage + tri optimisé ---
  const filteredCustomers = useMemo(() => {
    if (!customers) return [];

    return [...customers]
      .filter((customer) => {
        const query = searchQuery.toLowerCase();
        return (
          customer.name.toLowerCase().includes(query) ||
          customer.email?.toLowerCase().includes(query) ||
          customer.phone?.includes(query)
        );
      })
      .sort((a, b) => {
        switch (sortBy) {
          case "name":
            return a.name.localeCompare(b.name);
          case "orders":
            return (b.total_orders || 0) - (a.total_orders || 0);
          case "spent":
            return (Number(b.total_spent) || 0) - (Number(a.total_spent) || 0);
          default:
            return 0;
        }
      });
  }, [customers, searchQuery, sortBy]);

  // --- 🧱 Loading du store ---
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

  // --- ❌ Pas de boutique configurée ---
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
                  Veuillez d'abord créer votre boutique pour gérer vos clients.
                </CardDescription>
              </CardHeader>
            </Card>
          </main>
        </div>
      </SidebarProvider>
    );
  }

  // --- ✅ Interface principale ---
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background">
        <AppSidebar />
        <main className="flex-1 p-4 md:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h1 className="text-3xl font-bold tracking-tight">Clients</h1>
                <p className="text-muted-foreground mt-1">
                  Gérez et fidélisez votre clientèle
                </p>
              </div>
              <Button onClick={() => setIsCreateDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Nouveau client
              </Button>
            </div>

            {/* Filtres */}
            <CustomerFilters
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              sortBy={sortBy}
              onSortChange={setSortBy}
            />

            {/* Table ou état vide */}
            {customersLoading ? (
              <Card>
                <CardContent className="p-6">
                  <Skeleton className="h-96 w-full" />
                </CardContent>
              </Card>
            ) : filteredCustomers.length > 0 ? (
              <CustomersTable customers={filteredCustomers} onUpdate={refetch} />
            ) : (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                  <Users className="h-16 w-16 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Aucun client</h3>
                  <p className="text-muted-foreground mb-4">
                    {searchQuery
                      ? "Aucun client ne correspond à votre recherche"
                      : "Commencez par ajouter votre premier client"}
                  </p>
                  {!searchQuery && (
                    <Button onClick={() => setIsCreateDialogOpen(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Ajouter un client
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
