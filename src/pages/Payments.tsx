import { useState } from "react";
import { AppSidebar } from "@/components/AppSidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useStore } from "@/hooks/use-store";
import { usePayments } from "@/hooks/usePayments";
import { CreatePaymentDialog } from "@/components/payments/CreatePaymentDialog";
import { PaymentsTable } from "@/components/payments/PaymentsTable";
import { PaymentFilters } from "@/components/payments/PaymentFilters";

const Payments = () => {
  const { store } = useStore();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [methodFilter, setMethodFilter] = useState<string>("all");

  const { payments, loading, refetch } = usePayments(
    store?.id,
    searchTerm,
    statusFilter === "all" ? undefined : statusFilter,
    methodFilter === "all" ? undefined : methodFilter
  );

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        <main className="flex-1 p-6 md:p-8">
          <div className="max-w-7xl mx-auto space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h1 className="text-3xl font-bold">Paiements</h1>
                <p className="text-muted-foreground mt-1">
                  Gérez tous vos paiements
                </p>
              </div>
              {store && (
                <Button onClick={() => setIsCreateOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Nouveau paiement
                </Button>
              )}
            </div>

            {!store ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">
                  Veuillez créer une boutique pour gérer vos paiements
                </p>
              </div>
            ) : (
              <>
                <PaymentFilters
                  searchTerm={searchTerm}
                  onSearchChange={setSearchTerm}
                  statusFilter={statusFilter}
                  onStatusChange={setStatusFilter}
                  methodFilter={methodFilter}
                  onMethodChange={setMethodFilter}
                />
                <PaymentsTable 
                  payments={payments} 
                  loading={loading}
                  onPaymentUpdated={refetch}
                />
              </>
            )}
          </div>
        </main>
      </div>

      {store && (
        <CreatePaymentDialog
          open={isCreateOpen}
          onOpenChange={setIsCreateOpen}
          storeId={store.id}
          onPaymentCreated={refetch}
        />
      )}
    </SidebarProvider>
  );
};

export default Payments;
