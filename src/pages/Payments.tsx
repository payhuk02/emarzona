import { useState, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  CreditCard, 
  Plus, 
  RefreshCw, 
  Download, 
  Upload,
  TrendingUp,
  DollarSign,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Filter,
  Search,
  MoreHorizontal
} from "lucide-react";
import { useStore } from "@/hooks/useStore";
import { usePayments } from "@/hooks/usePayments";
import { useTransactions } from "@/hooks/useTransactions";
import { supabase } from "@/integrations/supabase/client";
import PaymentCardDashboard from "@/components/payments/PaymentCardDashboard";
import PaymentListView from "@/components/payments/PaymentListView";
import PaymentFiltersDashboard from "@/components/payments/PaymentFiltersDashboard";
import PaymentStats from "@/components/payments/PaymentStats";
import PaymentBulkActions from "@/components/payments/PaymentBulkActions";
import CreatePaymentDialog from "@/components/payments/CreatePaymentDialog";
import { Payment } from "@/hooks/usePayments";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { logger } from '@/lib/logger';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';

const Payments = () => {
  const navigate = useNavigate();
  const { store, loading: storeLoading } = useStore();
  const { payments, loading: paymentsLoading, refetch } = usePayments(store?.id);
  const { transactions, loading: transactionsLoading } = useTransactions(store?.id);
  const { toast } = useToast();
  
  const [selectedPayments, setSelectedPayments] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<"grid" | "list">("list");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [deletingPaymentId, setDeletingPaymentId] = useState<string | null>(null);
  
  // Filters state
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [methodFilter, setMethodFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");
  const [sortBy, setSortBy] = useState("recent");

  // Extract unique methods and statuses
  const paymentMethods = useMemo(() => {
    return Array.from(new Set(payments.map((p) => p.payment_method).filter(Boolean))) as string[];
  }, [payments]);

  const paymentStatuses = useMemo(() => {
    return Array.from(new Set(payments.map((p) => p.status).filter(Boolean))) as string[];
  }, [payments]);

  // Filter and sort payments
  const filteredPayments = useMemo(() => {
    let filtered = [...payments];

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter((payment) =>
        payment.transaction_id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        payment.notes?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        payment.customers?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        payment.orders?.order_number?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter((payment) => payment.status === statusFilter);
    }

    // Method filter
    if (methodFilter !== "all") {
      filtered = filtered.filter((payment) => payment.payment_method === methodFilter);
    }

    // Date filter
    if (dateFilter !== "all") {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
      const lastWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
      const lastMonth = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

      filtered = filtered.filter((payment) => {
        const paymentDate = new Date(payment.created_at);
        switch (dateFilter) {
          case "today":
            return paymentDate >= today;
          case "yesterday":
            return paymentDate >= yesterday && paymentDate < today;
          case "week":
            return paymentDate >= lastWeek;
          case "month":
            return paymentDate >= lastMonth;
          default:
            return true;
        }
      });
    }

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "recent":
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case "oldest":
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        case "amount-asc":
          return a.amount - b.amount;
        case "amount-desc":
          return b.amount - a.amount;
        case "status":
          return a.status.localeCompare(b.status);
        default:
          return 0;
      }
    });

    return filtered;
  }, [payments, searchQuery, statusFilter, methodFilter, dateFilter, sortBy]);

  // Animations au scroll
  const statsRef = useScrollAnimation<HTMLDivElement>();
  const filtersRef = useScrollAnimation<HTMLDivElement>();
  const paymentsRef = useScrollAnimation<HTMLDivElement>();

  const completedPayments = useMemo(() => payments.filter(p => p.status === 'completed').length, [payments]);
  const pendingPayments = useMemo(() => payments.filter(p => p.status === 'pending').length, [payments]);
  const failedPayments = useMemo(() => payments.filter(p => p.status === 'failed').length, [payments]);
  const totalRevenue = useMemo(() => payments.filter(p => p.status === 'completed').reduce((sum, p) => sum + p.amount, 0), [payments]);

  const handleDelete = useCallback(async () => {
    if (deletingPaymentId) {
      try {
        logger.info(`Suppression du paiement ${deletingPaymentId}`);
        const { error } = await supabase
          .from("payments")
          .delete()
          .eq("id", deletingPaymentId);

        if (error) throw error;

        logger.info('Paiement supprimé avec succès');
        toast({
          title: "Succès",
          description: "Paiement supprimé avec succès",
        });

        await refetch();
      } catch (error: any) {
        logger.error('Erreur lors de la suppression du paiement:', error);
        toast({
          title: "Erreur",
          description: error.message || "Impossible de supprimer le paiement",
          variant: "destructive",
        });
      } finally {
        setDeletingPaymentId(null);
      }
    }
  }, [deletingPaymentId, refetch, toast]);

  const handleBulkDelete = useCallback(async (paymentIds: string[]) => {
    try {
      logger.info(`Suppression en lot de ${paymentIds.length} paiements`);
      await Promise.all(paymentIds.map(id => 
        supabase.from("payments").delete().eq("id", id)
      ));
      setSelectedPayments([]);
      await refetch();
      logger.info('Paiements supprimés avec succès');
      toast({
        title: "Succès",
        description: `${paymentIds.length} paiement(s) supprimé(s)`,
      });
    } catch (error: any) {
      logger.error('Erreur lors de la suppression en lot:', error);
      toast({
        title: "Erreur",
        description: error.message || "Impossible de supprimer tous les paiements",
        variant: "destructive",
      });
    }
  }, [refetch, toast]);

  const handleBulkAction = useCallback(async (action: string, paymentIds: string[]) => {
    try {
      logger.info(`Action en lot: ${action} sur ${paymentIds.length} paiements`);
      const updates = action === 'complete' ? { status: 'completed' } : 
                     action === 'fail' ? { status: 'failed' } : 
                     { status: 'pending' };
      
      await Promise.all(paymentIds.map(id => 
        supabase.from("payments").update(updates).eq("id", id)
      ));
      
      setSelectedPayments([]);
      await refetch();
      logger.info('Action en lot appliquée avec succès');
      
      toast({
        title: "Succès",
        description: `${paymentIds.length} paiement(s) mis à jour`,
      });
    } catch (error: any) {
      logger.error(`Erreur lors de l'action en lot ${action}:`, error);
      toast({
        title: "Erreur",
        description: error.message || `Impossible de ${action} les paiements`,
        variant: "destructive",
      });
    }
  }, [refetch, toast]);

  const handleRefresh = useCallback(() => {
    logger.info('Actualisation de la liste des paiements');
    refetch();
    toast({
      title: "Actualisation",
      description: "Liste des paiements mise à jour",
    });
  }, [refetch, toast]);

  if (storeLoading) {
    return (
      <SidebarProvider>
        <div className="flex min-h-screen w-full">
          <AppSidebar />
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
              <p className="mt-2 text-muted-foreground">Chargement des paiements...</p>
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
                    <CreditCard className="h-8 w-8 text-muted-foreground" />
                  </div>
                </div>
                <CardTitle>Créez votre boutique d'abord</CardTitle>
                <CardDescription>
                  Vous devez créer une boutique avant de pouvoir gérer les paiements
                </CardDescription>
              </CardHeader>
              <CardContent className="text-center">
                <Button onClick={() => navigate("/dashboard/store")}>
                  Créer ma boutique
                </Button>
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
          <header className="sticky top-0 z-10 border-b bg-card shadow-soft" role="banner">
            <div className="flex h-16 items-center gap-4 px-4 sm:px-6">
              <SidebarTrigger aria-label="Toggle sidebar" />
              <div className="flex-1">
                <h1 className="text-xl sm:text-2xl font-bold" id="payments-title">Paiements</h1>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={handleRefresh} aria-label="Actualiser les paiements">
                  <RefreshCw className="h-4 w-4 mr-2" aria-hidden="true" />
                  Actualiser
                </Button>
                <Button onClick={() => setIsCreateOpen(true)} aria-label="Créer un nouveau paiement">
                  <Plus className="h-4 w-4 mr-2" aria-hidden="true" />
                  Nouveau paiement
                </Button>
              </div>
            </div>
          </header>

          <main className="flex-1 p-4 sm:p-6 bg-gradient-hero" role="main" aria-labelledby="payments-title">
            <div className="max-w-7xl mx-auto space-y-6">
              {paymentsLoading ? (
                <Card className="shadow-medium">
                  <CardContent className="py-12 text-center">
                    <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
                    <p className="mt-2 text-muted-foreground">Chargement des paiements...</p>
                  </CardContent>
                </Card>
              ) : payments.length === 0 ? (
                <Card className="shadow-medium">
                  <CardHeader className="text-center py-12">
                    <div className="flex justify-center mb-4">
                      <div className="h-20 w-20 rounded-full bg-muted flex items-center justify-center">
                        <CreditCard className="h-10 w-10 text-muted-foreground" />
                      </div>
                    </div>
                    <CardTitle>Aucun paiement pour le moment</CardTitle>
                    <CardDescription className="mt-2">
                      Créez votre premier paiement pour commencer à suivre vos transactions
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="text-center pb-12">
                    <div className="space-y-4">
                      <Button onClick={() => setIsCreateOpen(true)} size="lg">
                        <Plus className="h-5 w-5 mr-2" />
                        Créer mon premier paiement
                      </Button>
                      <div className="text-sm text-muted-foreground">
                        <p>Ou importez vos paiements depuis un fichier CSV</p>
                        <Button variant="outline" size="sm" className="mt-2">
                          <Upload className="h-4 w-4 mr-2" />
                          Importer CSV
                        </Button>
                      </div>
              </div>
                  </CardContent>
                </Card>
            ) : (
              <>
                  {/* Statistiques */}
                  <div ref={statsRef} role="region" aria-label="Statistiques des paiements">
                    <PaymentStats 
                      payments={payments} 
                      filteredPayments={filteredPayments}
                      transactions={transactions}
                    />
                  </div>

                  {/* Actions en lot */}
                  {selectedPayments.length > 0 && (
                    <PaymentBulkActions
                      selectedPayments={selectedPayments}
                      payments={payments}
                      onSelectionChange={setSelectedPayments}
                      onBulkAction={handleBulkAction}
                      onDelete={handleBulkDelete}
                    />
                  )}

                  {/* Filtres */}
                  <div ref={filtersRef} role="region" aria-label="Filtres de recherche des paiements">
                    <PaymentFiltersDashboard
                    searchQuery={searchQuery}
                    onSearchChange={setSearchQuery}
                  statusFilter={statusFilter}
                  onStatusChange={setStatusFilter}
                  methodFilter={methodFilter}
                  onMethodChange={setMethodFilter}
                    dateFilter={dateFilter}
                    onDateChange={setDateFilter}
                    sortBy={sortBy}
                    onSortByChange={setSortBy}
                    paymentMethods={paymentMethods}
                    paymentStatuses={paymentStatuses}
                    viewMode={viewMode}
                    onViewModeChange={setViewMode}
                    totalPayments={payments.length}
                    completedPayments={completedPayments}
                    />
                  </div>

                  {filteredPayments.length === 0 ? (
                    <Card className="shadow-medium">
                      <CardContent className="py-12 text-center">
                        <CreditCard className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <h3 className="text-lg font-semibold mb-2">Aucun paiement trouvé</h3>
                        <p className="text-muted-foreground mb-4">
                          Aucun paiement ne correspond à vos critères de recherche
                        </p>
                        <Button variant="outline" onClick={() => {
                          setSearchQuery("");
                          setStatusFilter("all");
                          setMethodFilter("all");
                          setDateFilter("all");
                        }}>
                          Effacer les filtres
                        </Button>
                      </CardContent>
                    </Card>
                  ) : (
                    <>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <p className="text-sm text-muted-foreground">
                            {filteredPayments.length} paiement{filteredPayments.length > 1 ? "s" : ""} trouvé{filteredPayments.length > 1 ? "s" : ""}
                          </p>
                          {selectedPayments.length > 0 && (
                            <Badge variant="secondary">
                              {selectedPayments.length} sélectionné{selectedPayments.length > 1 ? "s" : ""}
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <Button variant="outline" size="sm">
                            <Download className="h-4 w-4 mr-2" />
                            Exporter
                          </Button>
                        </div>
                      </div>

                      {viewMode === "grid" ? (
                        <div ref={paymentsRef} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6" role="region" aria-label="Liste des paiements">
                          {filteredPayments.map((payment) => (
                            <PaymentCardDashboard
                              key={payment.id}
                              payment={payment}
                              onEdit={() => {/* TODO: Implement edit */}}
                              onDelete={() => setDeletingPaymentId(payment.id)}
                              onView={() => {/* TODO: Implement view */}}
                            />
                          ))}
                        </div>
                      ) : (
                        <div ref={paymentsRef} className="space-y-3" role="region" aria-label="Liste des paiements">
                          {filteredPayments.map((payment) => (
                            <PaymentListView
                              key={payment.id}
                              payment={payment}
                              onEdit={() => {/* TODO: Implement edit */}}
                              onDelete={() => setDeletingPaymentId(payment.id)}
                              onView={() => {/* TODO: Implement view */}}
                            />
                          ))}
                        </div>
                      )}
                    </>
                  )}
              </>
            )}
          </div>
        </main>
        </div>
      </div>

      {store && (
        <CreatePaymentDialog
          open={isCreateOpen}
          onOpenChange={setIsCreateOpen}
          storeId={store.id}
          onPaymentCreated={refetch}
        />
      )}

      <AlertDialog open={!!deletingPaymentId} onOpenChange={(open) => !open && setDeletingPaymentId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer ce paiement ? Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </SidebarProvider>
  );
};

export default Payments;
