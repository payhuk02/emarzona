/**
 * Page: Withdrawals
 * Description: Page de gestion des retraits pour les vendeurs
 * Date: 2025-01-31
 */

import { useState, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useStore } from '@/hooks/useStore';
import { useStoreEarnings } from '@/hooks/useStoreEarnings';
import { useStoreWithdrawals } from '@/hooks/useStoreWithdrawals';
import { EarningsBalance } from '@/components/store/EarningsBalance';
import { WithdrawalRequestDialog } from '@/components/store/WithdrawalRequestDialog';
import { WithdrawalsList } from '@/components/store/WithdrawalsList';
import { WithdrawalStatsCard } from '@/components/store/WithdrawalStatsCard';
import { StoreWithdrawalRequestForm, StorePaymentMethod, StoreWithdrawalStatus } from '@/types/store-withdrawals';
import { WithdrawalsFilters } from '@/components/store/WithdrawalsFilters';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

const Withdrawals = () => {
  const { t } = useTranslation();
  const { store, loading: storeLoading } = useStore();
  const { earnings, loading: earningsLoading, refreshEarnings } = useStoreEarnings(store?.id);
  
  // Mémoriser les filtres pour éviter les re-renders en boucle
  const withdrawalFilters = useMemo(() => ({
    store_id: store?.id,
  }), [store?.id]);
  
  const { withdrawals, loading: withdrawalsLoading, requestWithdrawal, cancelWithdrawal, refetch } = useStoreWithdrawals(withdrawalFilters);
  
  const [showRequestDialog, setShowRequestDialog] = useState(false);
  const [advancedFilters, setAdvancedFilters] = useState<{
    status?: StoreWithdrawalStatus;
    paymentMethod?: StorePaymentMethod;
    dateFrom?: Date;
    dateTo?: Date;
    minAmount?: number;
    maxAmount?: number;
    search?: string;
  }>({});

  // Appliquer les filtres avancés
  const filteredWithdrawals = useMemo(() => {
    let filtered = [...withdrawals];

    if (advancedFilters.search) {
      const query = advancedFilters.search.toLowerCase();
      filtered = filtered.filter(w =>
        w.transaction_reference?.toLowerCase().includes(query) ||
        w.id.toLowerCase().includes(query) ||
        w.notes?.toLowerCase().includes(query)
      );
    }

    if (advancedFilters.status) {
      filtered = filtered.filter(w => w.status === advancedFilters.status);
    }

    if (advancedFilters.paymentMethod) {
      filtered = filtered.filter(w => w.payment_method === advancedFilters.paymentMethod);
    }

    if (advancedFilters.dateFrom) {
      filtered = filtered.filter(w => new Date(w.created_at) >= advancedFilters.dateFrom!);
    }

    if (advancedFilters.dateTo) {
      filtered = filtered.filter(w => new Date(w.created_at) <= advancedFilters.dateTo!);
    }

    if (advancedFilters.minAmount !== undefined) {
      filtered = filtered.filter(w => w.amount >= advancedFilters.minAmount!);
    }

    if (advancedFilters.maxAmount !== undefined) {
      filtered = filtered.filter(w => w.amount <= advancedFilters.maxAmount!);
    }

    return filtered;
  }, [withdrawals, advancedFilters]);

  const handleQuickFilter = useCallback((period: 'week' | 'month' | 'year' | 'all') => {
    const now = new Date();
    let dateFrom: Date | undefined;

    switch (period) {
      case 'week':
        dateFrom = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        dateFrom = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'year':
        dateFrom = new Date(now.getFullYear(), 0, 1);
        break;
      case 'all':
        dateFrom = undefined;
        break;
    }

    setAdvancedFilters(prev => ({
      ...prev,
      dateFrom,
      dateTo: period === 'all' ? undefined : now,
    }));
  }, []);

  const handleRequestWithdrawal = async (formData: StoreWithdrawalRequestForm) => {
    if (!store?.id) return;
    
    const result = await requestWithdrawal(store.id, formData);
    if (result) {
      await refreshEarnings();
      await refetch();
    }
  };

  const handleCancelWithdrawal = async (withdrawalId: string) => {
    const result = await cancelWithdrawal(withdrawalId);
    if (result) {
      await refreshEarnings();
      await refetch();
    }
  };

  if (storeLoading) {
    return (
      <SidebarProvider>
        <div className="flex min-h-screen w-full">
          <AppSidebar />
          <main className="flex-1 p-6 space-y-6">
            <Skeleton className="h-10 w-64" />
            <Skeleton className="h-64 w-full" />
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
          <main className="flex-1 p-6 space-y-6">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {t('withdrawals.noStore')}
              </AlertDescription>
            </Alert>
          </main>
        </div>
      </SidebarProvider>
    );
  }

  // Afficher un message si la migration n'a pas été exécutée
  const hasMigrationError = earningsLoading === false && earnings === null && store;

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        <main className="flex-1 p-3 sm:p-4 md:p-6 space-y-4 sm:space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
            <div>
              <h1 className="text-base sm:text-lg md:text-xl lg:text-2xl xl:text-3xl font-bold">{t('withdrawals.title')}</h1>
              <p className="text-[9px] sm:text-[10px] md:text-xs lg:text-sm text-muted-foreground mt-1 sm:mt-2">
                {t('withdrawals.description')}
              </p>
            </div>
            <Button 
              onClick={() => setShowRequestDialog(true)}
              disabled={!earnings || (earnings.available_balance || 0) < 10000}
              className="w-full sm:w-auto h-8 sm:h-9 text-xs sm:text-sm"
              size="sm"
            >
              {t('withdrawals.requestButton')}
            </Button>
          </div>

          {/* Message d'information si pas de revenus */}
          {!earningsLoading && earnings === null && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>{t('withdrawals.migration.title')}</strong> {t('withdrawals.migration.description', { fileName: '20250131_store_withdrawals_system.sql' })}
              </AlertDescription>
            </Alert>
          )}

          {/* Solde et statistiques */}
          <EarningsBalance
            earnings={earnings}
            loading={earningsLoading}
            onWithdrawClick={() => setShowRequestDialog(true)}
          />

          {/* Filtres avancés */}
          <WithdrawalsFilters
            onFiltersChange={setAdvancedFilters}
            onQuickFilter={handleQuickFilter}
            showQuickFilters={true}
          />

          {/* Statistiques avancées */}
          <WithdrawalStatsCard storeId={store?.id} />

          {/* Liste des retraits */}
          <WithdrawalsList
            withdrawals={filteredWithdrawals}
            loading={withdrawalsLoading}
            onCancel={handleCancelWithdrawal}
            showExport={true}
          />

          {/* Dialog de demande de retrait */}
          <WithdrawalRequestDialog
            open={showRequestDialog}
            onOpenChange={setShowRequestDialog}
            availableBalance={earnings?.available_balance || 0}
            storeId={store?.id}
            onSubmit={handleRequestWithdrawal}
          />
        </main>
      </div>
    </SidebarProvider>
  );
};

export default Withdrawals;

