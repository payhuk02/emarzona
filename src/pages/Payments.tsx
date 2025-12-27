/**
 * 💳 Gestion des Paiements - Professional & Optimized
 * Page optimisée avec design professionnel, responsive et fonctionnalités avancées
 * Gestion complète des paiements avec recherche, filtres, tri, export et actions
 */

import { useState, useCallback, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MainLayout } from '@/components/layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Alert } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import {
  CreditCard,
  Search,
  Plus,
  RefreshCw,
  Download,
  X,
  AlertTriangle,
  Loader2,
  DollarSign,
  CheckCircle2,
  Clock,
  XCircle,
  Eye,
  Edit,
  Trash2,
} from 'lucide-react';
import { useStore } from '@/hooks/useStore';
import { usePayments, Payment } from '@/hooks/usePayments';
import CreatePaymentDialog from '@/components/payments/CreatePaymentDialog';
import { logger } from '@/lib/logger';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';
import { useDebounce } from '@/hooks/useDebounce';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import PaymentCardDashboard from '@/components/payments/PaymentCardDashboard';
import PaymentListView from '@/components/payments/PaymentListView';
import { supabase } from '@/integrations/supabase/client';

export default function Payments() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { store, loading: storeLoading } = useStore();
  const { payments, loading: paymentsLoading, refetch } = usePayments(store?.id);

  // State management
  const [searchInput, setSearchInput] = useState('');
  const debouncedSearch = useDebounce(searchInput, 300);
  const [activeTab, setActiveTab] = useState('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  // Payment actions state
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Edit form state
  const [editFormData, setEditFormData] = useState({
    payment_method: '',
    amount: '',
    currency: 'XOF',
    status: '',
    transaction_id: '',
    notes: '',
  });

  // Animations au scroll
  const headerRef = useScrollAnimation<HTMLDivElement>();
  const statsRef = useScrollAnimation<HTMLDivElement>();
  const filtersRef = useScrollAnimation<HTMLDivElement>();
  const paymentsRef = useScrollAnimation<HTMLDivElement>();

  // Filter payments
  const filteredPayments = useMemo(() => {
    if (!payments) return [];

    return payments.filter(payment => {
      // Search filter
      const searchLower = debouncedSearch.toLowerCase();
      const matchesSearch =
        payment.transaction_id?.toLowerCase().includes(searchLower) ||
        payment.notes?.toLowerCase().includes(searchLower) ||
        payment.customers?.name?.toLowerCase().includes(searchLower) ||
        payment.orders?.order_number?.toLowerCase().includes(searchLower) ||
        payment.payment_method?.toLowerCase().includes(searchLower);

      // Tab filter
      const matchesTab =
        activeTab === 'all' ||
        (activeTab === 'completed' && payment.status === 'completed') ||
        (activeTab === 'pending' && payment.status === 'pending') ||
        (activeTab === 'failed' && payment.status === 'failed') ||
        (activeTab === 'refunded' && payment.status === 'refunded');

      return matchesSearch && matchesTab;
    });
  }, [payments, debouncedSearch, activeTab]);

  // Stats calculation
  const stats = useMemo(() => {
    if (!payments) return { total: 0, completed: 0, pending: 0, failed: 0, totalRevenue: 0 };

    const total = payments.length;
    const completed = payments.filter(p => p.status === 'completed').length;
    const pending = payments.filter(p => p.status === 'pending').length;
    const failed = payments.filter(p => p.status === 'failed').length;
    const totalRevenue = payments
      .filter(p => p.status === 'completed')
      .reduce((sum, p) => sum + p.amount, 0);

    return { total, completed, pending, failed, totalRevenue };
  }, [payments]);

  // Handle view payment
  const handleViewPayment = useCallback((payment: Payment) => {
    setSelectedPayment(payment);
    setViewDialogOpen(true);
  }, []);

  // Handle edit payment
  const handleEditPayment = useCallback((payment: Payment) => {
    setSelectedPayment(payment);
    setEditFormData({
      payment_method: payment.payment_method,
      amount: payment.amount.toString(),
      currency: payment.currency,
      status: payment.status,
      transaction_id: payment.transaction_id || '',
      notes: payment.notes || '',
    });
    setEditDialogOpen(true);
  }, []);

  // Handle update payment
  const handleUpdatePayment = useCallback(async () => {
    if (!selectedPayment) return;

    setIsUpdating(true);
    try {
      const { error } = await supabase
        .from('payments')
        .update({
          payment_method: editFormData.payment_method,
          amount: parseFloat(editFormData.amount),
          currency: editFormData.currency,
          status: editFormData.status,
          transaction_id: editFormData.transaction_id || null,
          notes: editFormData.notes || null,
        })
        .eq('id', selectedPayment.id);

      if (error) throw error;

      toast({
        title: '✅ Succès',
        description: 'Paiement mis à jour avec succès',
      });

      await refetch();
      setEditDialogOpen(false);
      setSelectedPayment(null);
    } catch ( _error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error('Erreur lors de la mise à jour du paiement', error);
      toast({
        title: '❌ Erreur',
        description: errorMessage || 'Impossible de mettre à jour le paiement',
        variant: 'destructive',
      });
    } finally {
      setIsUpdating(false);
    }
  }, [selectedPayment, editFormData, toast, refetch]);

  // Handle delete payment
  const handleDeletePayment = useCallback(async () => {
    if (!selectedPayment) return;

    setIsDeleting(true);
    try {
      const { error } = await supabase.from('payments').delete().eq('id', selectedPayment.id);

      if (error) throw error;

      toast({
        title: '✅ Succès',
        description: 'Paiement supprimé avec succès',
      });

      await refetch();
      setDeleteDialogOpen(false);
      setSelectedPayment(null);
    } catch ( _error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error('Erreur lors de la suppression du paiement', error);
      toast({
        title: '❌ Erreur',
        description: errorMessage || 'Impossible de supprimer le paiement',
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(false);
    }
  }, [selectedPayment, toast, refetch]);

  // Handle refresh
  const handleRefresh = useCallback(async () => {
    try {
      await refetch();
      toast({
        title: '✅ Actualisation réussie',
        description: 'La liste des paiements a été mise à jour.',
      });
      logger.info('Payments refreshed');
    } catch ( _error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error('Error refreshing payments', { error: errorMessage });
      toast({
        title: '❌ Erreur',
        description: "Impossible d'actualiser les paiements.",
        variant: 'destructive',
      });
    }
  }, [refetch, toast]);

  // Export to CSV
  const handleExportCSV = useCallback(async () => {
    if (!filteredPayments || filteredPayments.length === 0) {
      toast({
        title: '⚠️ Aucune donnée',
        description: 'Aucun paiement à exporter.',
        variant: 'destructive',
      });
      return;
    }

    setIsExporting(true);
    try {
      const headers = [
        'ID',
        'Transaction ID',
        'Méthode',
        'Montant',
        'Devise',
        'Statut',
        'Client',
        'Commande',
        'Notes',
        'Date création',
      ];
      const rows = filteredPayments.map((payment: Payment) => [
        payment.id,
        payment.transaction_id || '',
        payment.payment_method || '',
        payment.amount || 0,
        payment.currency || '',
        payment.status || '',
        payment.customers?.name || '',
        payment.orders?.order_number || '',
        payment.notes || '',
        format(new Date(payment.created_at), 'dd/MM/yyyy HH:mm', { locale: fr }),
      ]);

      const csvContent = [
        headers.join(','),
        ...rows.map((row: Array<string | number>) =>
          row.map((cell: string | number) => `"${String(cell)}"`).join(',')
        ),
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `paiements-${format(new Date(), 'yyyy-MM-dd')}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast({
        title: '✅ Export réussi',
        description: `${filteredPayments.length} paiement(s) exporté(s) en CSV.`,
      });
      logger.info('Payments exported to CSV', { count: filteredPayments.length });
    } catch ( _error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error('Error exporting payments to CSV', { error: errorMessage });
      toast({
        title: '❌ Erreur',
        description: "Impossible d'exporter les paiements.",
        variant: 'destructive',
      });
    } finally {
      setIsExporting(false);
    }
  }, [filteredPayments, toast]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        document.getElementById('search-payments')?.focus();
      }
      if (e.key === 'Escape' && searchInput) {
        setSearchInput('');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [searchInput]);

  if (storeLoading || paymentsLoading) {
    return (
      <MainLayout layoutType="finance">
        <div className="container mx-auto py-8">
          <div className="flex items-center justify-center h-[40vh]">
            <div className="text-center space-y-4">
              <Loader2 className="h-8 w-8 animate-spin mx-auto text-purple-500" />
              <p className="text-muted-foreground">Chargement des paiements...</p>
            </div>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (!store) {
    return (
      <MainLayout layoutType="finance">
        <div className="container mx-auto py-8">
          <div className="flex items-center justify-center min-h-[60vh]">
            <Card className="max-w-md border-border/50 bg-card/50 backdrop-blur-sm">
              <CardHeader className="text-center">
                <div className="flex justify-center mb-4">
                  <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center">
                    <CreditCard className="h-8 w-8 text-muted-foreground" />
                  </div>
                </div>
                <CardTitle className="text-sm sm:text-lg md:text-xl lg:text-2xl font-bold">
                  Aucune boutique sélectionnée
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm md:text-base mt-2">
                  Veuillez sélectionner une boutique ou créer une nouvelle boutique pour gérer les
                  paiements.
                </CardDescription>
              </CardHeader>
              <CardContent className="text-center pt-6">
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <Button
                    onClick={() => navigate('/dashboard/store')}
                    className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Créer une boutique
                  </Button>
                  <Button variant="outline" onClick={() => navigate('/dashboard')}>
                    Retour au tableau de bord
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout layoutType="finance">
      <div className="container mx-auto p-3 sm:p-4 lg:p-6 space-y-4 sm:space-y-6">
        {/* Header */}
        <div
          ref={headerRef}
          className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 animate-in fade-in slide-in-from-top-4 duration-700"
        >
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="p-1.5 sm:p-2 rounded-lg bg-gradient-to-br from-purple-500/10 to-pink-500/5 backdrop-blur-sm border border-purple-500/20 animate-in zoom-in duration-500">
              <CreditCard
                className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 lg:h-8 lg:w-8 text-purple-500 dark:text-purple-400"
                aria-hidden="true"
              />
            </div>
            <div>
              <h1 className="text-lg sm:text-2xl md:text-3xl lg:text-4xl font-bold flex items-center gap-1.5 sm:gap-2 mb-1 sm:mb-2">
                <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                  Paiements
                </span>
              </h1>
              <p className="text-[10px] sm:text-xs md:text-sm lg:text-base text-muted-foreground">
                Gérez vos transactions et suivez vos paiements en temps réel
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={paymentsLoading}
              className="min-h-[44px] h-9 sm:h-10 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 text-xs sm:text-sm text-white"
            >
              {paymentsLoading ? (
                <Loader2 className="mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4 animate-spin" />
              ) : (
                <RefreshCw className="mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4" />
              )}
              <span className="hidden sm:inline">Actualiser</span>
              <span className="sm:hidden">Raf.</span>
            </Button>
            <Button
              onClick={() => setCreateDialogOpen(true)}
              size="sm"
              className="min-h-[44px] h-9 sm:h-10 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 text-white text-xs sm:text-sm"
            >
              <Plus className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
              <span className="hidden sm:inline">Nouveau</span>
              <span className="sm:hidden">Nouveau</span>
            </Button>
          </div>
        </div>

        {/* Empty State */}
        {!paymentsLoading && payments.length === 0 ? (
          <Card className="shadow-lg border-2 border-purple-200/50 dark:border-purple-800/50 animate-in fade-in zoom-in duration-500">
            <CardHeader className="text-center py-12">
              <div className="flex justify-center mb-4">
                <div className="h-20 w-20 rounded-full bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30 flex items-center justify-center animate-in zoom-in duration-500">
                  <CreditCard className="h-10 w-10 text-purple-500 dark:text-purple-400" />
                </div>
              </div>
              <CardTitle className="text-sm sm:text-lg md:text-xl lg:text-2xl">
                Aucun paiement pour le moment
              </CardTitle>
              <CardDescription className="mt-2 text-xs sm:text-sm md:text-base">
                Créez votre premier paiement pour commencer à suivre vos transactions
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center pb-12 space-y-4">
              <Button
                onClick={() => setCreateDialogOpen(true)}
                size="lg"
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 text-white"
              >
                <Plus className="h-5 w-5 mr-2" />
                Créer mon premier paiement
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Stats Cards */}
            <div
              ref={statsRef}
              className="grid gap-3 sm:gap-4 grid-cols-2 md:grid-cols-5 animate-in fade-in slide-in-from-bottom-4 duration-700"
            >
              {/* Carte Total */}
              <Card className="border-border/50 bg-card/50 backdrop-blur-sm hover:shadow-lg transition-all duration-300 hover:scale-[1.02]">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1.5 sm:pb-2 p-2.5 sm:p-3 md:p-4">
                  <CardTitle className="text-[9px] sm:text-[10px] md:text-xs lg:text-sm font-medium">
                    Total
                  </CardTitle>
                  <CreditCard className="h-2.5 w-2.5 sm:h-3 sm:w-3 md:h-3.5 md:w-3.5 lg:h-4 lg:w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent className="p-2.5 sm:p-3 md:p-4 pt-0">
                  <div className="text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl font-bold">
                    {stats.total}
                  </div>
                </CardContent>
              </Card>

              {/* Carte Completés */}
              <Card className="border-border/50 bg-card/50 backdrop-blur-sm hover:shadow-lg transition-all duration-300 hover:scale-[1.02]">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1.5 sm:pb-2 p-2.5 sm:p-3 md:p-4">
                  <CardTitle className="text-[9px] sm:text-[10px] md:text-xs lg:text-sm font-medium">
                    Completés
                  </CardTitle>
                  <CheckCircle2 className="h-2.5 w-2.5 sm:h-3 sm:w-3 md:h-3.5 md:w-3.5 lg:h-4 lg:w-4 text-green-500" />
                </CardHeader>
                <CardContent className="p-2.5 sm:p-3 md:p-4 pt-0">
                  <div className="text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl font-bold text-green-600">
                    {stats.completed}
                  </div>
                </CardContent>
              </Card>

              {/* Carte En attente */}
              <Card className="border-border/50 bg-card/50 backdrop-blur-sm hover:shadow-lg transition-all duration-300 hover:scale-[1.02]">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1.5 sm:pb-2 p-2.5 sm:p-3 md:p-4">
                  <CardTitle className="text-[9px] sm:text-[10px] md:text-xs lg:text-sm font-medium">
                    En attente
                  </CardTitle>
                  <Clock className="h-2.5 w-2.5 sm:h-3 sm:w-3 md:h-3.5 md:w-3.5 lg:h-4 lg:w-4 text-orange-500" />
                </CardHeader>
                <CardContent className="p-2.5 sm:p-3 md:p-4 pt-0">
                  <div className="text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl font-bold text-orange-600">
                    {stats.pending}
                  </div>
                </CardContent>
              </Card>

              {/* Carte Échoués */}
              <Card className="border-border/50 bg-card/50 backdrop-blur-sm hover:shadow-lg transition-all duration-300 hover:scale-[1.02]">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1.5 sm:pb-2 p-2.5 sm:p-3 md:p-4">
                  <CardTitle className="text-[9px] sm:text-[10px] md:text-xs lg:text-sm font-medium">
                    Échoués
                  </CardTitle>
                  <XCircle className="h-2.5 w-2.5 sm:h-3 sm:w-3 md:h-3.5 md:w-3.5 lg:h-4 lg:w-4 text-red-500" />
                </CardHeader>
                <CardContent className="p-2.5 sm:p-3 md:p-4 pt-0">
                  <div className="text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl font-bold text-red-600">
                    {stats.failed}
                  </div>
                </CardContent>
              </Card>

              {/* Carte Revenu */}
              <Card className="border-border/50 bg-card/50 backdrop-blur-sm hover:shadow-lg transition-all duration-300 hover:scale-[1.02]">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1.5 sm:pb-2 p-2.5 sm:p-3 md:p-4">
                  <CardTitle className="text-[9px] sm:text-[10px] md:text-xs lg:text-sm font-medium">
                    Revenu
                  </CardTitle>
                  <DollarSign className="h-2.5 w-2.5 sm:h-3 sm:w-3 md:h-3.5 md:w-3.5 lg:h-4 lg:w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent className="p-2.5 sm:p-3 md:p-4 pt-0">
                  <div className="text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl font-bold break-words">
                    {stats.totalRevenue.toLocaleString('fr-FR')} XOF
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Search & Filters */}
            <Card
              ref={filtersRef}
              className="shadow-lg border-2 border-purple-200/50 dark:border-purple-800/50 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-200"
            >
              <CardContent className="p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row gap-4">
                  {/* Search */}
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="search-payments"
                      placeholder="Rechercher par transaction, client, commande..."
                      value={searchInput}
                      onChange={e => setSearchInput(e.target.value)}
                      className="pl-9 pr-9 h-10 sm:h-11 bg-background border-purple-200/50 dark:border-purple-800/50 focus:border-purple-500 focus:ring-purple-500/20"
                    />
                    {searchInput && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSearchInput('')}
                        className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 p-0"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                    {/* Keyboard shortcut indicator */}
                    <div className="absolute right-2.5 sm:right-10 top-1/2 -translate-y-1/2 pointer-events-none hidden sm:flex items-center">
                      <Badge variant="outline" className="text-[10px] font-mono px-1.5 py-0">
                        ⌘K
                      </Badge>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleExportCSV}
                      disabled={isExporting || !filteredPayments || filteredPayments.length === 0}
                      className="h-10 sm:h-11 transition-all hover:scale-105"
                    >
                      {isExporting ? (
                        <Loader2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2 animate-spin" />
                      ) : (
                        <Download className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
                      )}
                      <span className="hidden sm:inline text-xs sm:text-sm">Export CSV</span>
                      <span className="sm:hidden">CSV</span>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Tabs - Style MyTemplates - Fully Responsive */}
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="bg-muted/50 backdrop-blur-sm h-auto p-1 w-full grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-1.5 sm:gap-2 sm:inline-flex sm:w-auto">
                <TabsTrigger
                  value="all"
                  className="w-full sm:w-auto gap-1 sm:gap-1.5 px-2 sm:px-3 md:px-4 py-2 sm:py-1.5 md:py-2 text-[10px] xs:text-xs sm:text-sm font-medium data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-pink-600 data-[state=active]:text-white transition-all duration-300 whitespace-nowrap overflow-hidden text-ellipsis"
                >
                  Tous <span className="opacity-80">({stats.total})</span>
                </TabsTrigger>
                <TabsTrigger
                  value="completed"
                  className="w-full sm:w-auto gap-1 sm:gap-1.5 px-2 sm:px-3 md:px-4 py-2 sm:py-1.5 md:py-2 text-[10px] xs:text-xs sm:text-sm font-medium data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-pink-600 data-[state=active]:text-white transition-all duration-300 whitespace-nowrap overflow-hidden text-ellipsis"
                >
                  <span className="hidden sm:inline">Completés</span>
                  <span className="sm:hidden">OK</span>
                  <span className="opacity-80">({stats.completed})</span>
                </TabsTrigger>
                <TabsTrigger
                  value="pending"
                  className="w-full sm:w-auto gap-1 sm:gap-1.5 px-2 sm:px-3 md:px-4 py-2 sm:py-1.5 md:py-2 text-[10px] xs:text-xs sm:text-sm font-medium data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-pink-600 data-[state=active]:text-white transition-all duration-300 whitespace-nowrap overflow-hidden text-ellipsis"
                >
                  <span className="hidden sm:inline">En attente</span>
                  <span className="sm:hidden">Attente</span>
                  <span className="opacity-80">({stats.pending})</span>
                </TabsTrigger>
                <TabsTrigger
                  value="failed"
                  className="w-full sm:w-auto gap-1 sm:gap-1.5 px-2 sm:px-3 md:px-4 py-2 sm:py-1.5 md:py-2 text-[10px] xs:text-xs sm:text-sm font-medium data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-pink-600 data-[state=active]:text-white transition-all duration-300 whitespace-nowrap overflow-hidden text-ellipsis"
                >
                  <span className="hidden sm:inline">Échoués</span>
                  <span className="sm:hidden">Erreurs</span>
                  <span className="opacity-80">({stats.failed})</span>
                </TabsTrigger>
                <TabsTrigger
                  value="refunded"
                  className="w-full sm:w-auto gap-1 sm:gap-1.5 px-2 sm:px-3 md:px-4 py-2 sm:py-1.5 md:py-2 text-[10px] xs:text-xs sm:text-sm font-medium data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-pink-600 data-[state=active]:text-white transition-all duration-300 whitespace-nowrap overflow-hidden text-ellipsis"
                >
                  <span className="hidden sm:inline">Remboursés</span>
                  <span className="sm:hidden">Rem.</span>
                  <span className="opacity-80">
                    ({payments?.filter(p => p.status === 'refunded').length || 0})
                  </span>
                </TabsTrigger>
              </TabsList>

              <TabsContent value={activeTab} className="mt-6">
                <div
                  ref={paymentsRef}
                  className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-300"
                >
                  {filteredPayments.length === 0 ? (
                    <Card className="shadow-lg border-2 border-purple-200/50 dark:border-purple-800/50">
                      <CardContent className="py-12 text-center">
                        <CreditCard className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <h3 className="text-lg font-semibold mb-2">Aucun paiement trouvé</h3>
                        <p className="text-muted-foreground mb-4">
                          Aucun paiement ne correspond à vos critères de recherche
                        </p>
                        <Button
                          variant="outline"
                          onClick={() => {
                            setSearchInput('');
                            setActiveTab('all');
                          }}
                        >
                          Effacer les filtres
                        </Button>
                      </CardContent>
                    </Card>
                  ) : (
                    <>
                      <div className="flex items-center justify-between flex-wrap gap-2 mb-4">
                        <p className="text-sm text-muted-foreground">
                          {filteredPayments.length} paiement
                          {filteredPayments.length > 1 ? 's' : ''} trouvé
                          {filteredPayments.length > 1 ? 's' : ''}
                        </p>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setViewMode('grid')}
                            className={cn(
                              'h-9 transition-all',
                              viewMode === 'grid' &&
                                'bg-purple-100 dark:bg-purple-900 border-purple-500'
                            )}
                          >
                            Grille
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setViewMode('list')}
                            className={cn(
                              'h-9 transition-all',
                              viewMode === 'list' &&
                                'bg-purple-100 dark:bg-purple-900 border-purple-500'
                            )}
                          >
                            Liste
                          </Button>
                        </div>
                      </div>

                      {viewMode === 'grid' ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                          {filteredPayments.map((payment, index) => (
                            <div
                              key={payment.id}
                              className="animate-in fade-in slide-in-from-left-4"
                              style={{ animationDelay: `${index * 50}ms` }}
                            >
                              <PaymentCardDashboard
                                payment={payment}
                                onEdit={() => handleEditPayment(payment)}
                                onDelete={() => {
                                  setSelectedPayment(payment);
                                  setDeleteDialogOpen(true);
                                }}
                                onView={() => handleViewPayment(payment)}
                              />
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {filteredPayments.map((payment, index) => (
                            <div
                              key={payment.id}
                              className="animate-in fade-in slide-in-from-left-4"
                              style={{ animationDelay: `${index * 50}ms` }}
                            >
                              <PaymentListView
                                payment={payment}
                                onEdit={() => handleEditPayment(payment)}
                                onDelete={() => {
                                  setSelectedPayment(payment);
                                  setDeleteDialogOpen(true);
                                }}
                                onView={() => handleViewPayment(payment)}
                              />
                            </div>
                          ))}
                        </div>
                      )}
                    </>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </>
        )}

        {/* View Payment Dialog */}
        <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Détails du paiement</DialogTitle>
              <DialogDescription>Informations complètes sur ce paiement</DialogDescription>
            </DialogHeader>
            {selectedPayment && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-muted-foreground">Montant</Label>
                    <p className="text-lg font-semibold">
                      {selectedPayment.amount.toLocaleString()} {selectedPayment.currency}
                    </p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Statut</Label>
                    <Badge
                      variant={
                        selectedPayment.status === 'completed'
                          ? 'default'
                          : selectedPayment.status === 'pending'
                            ? 'secondary'
                            : selectedPayment.status === 'failed'
                              ? 'destructive'
                              : 'outline'
                      }
                    >
                      {selectedPayment.status}
                    </Badge>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Méthode de paiement</Label>
                    <p>{selectedPayment.payment_method}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">ID Transaction</Label>
                    <p className="font-mono text-sm">{selectedPayment.transaction_id || 'N/A'}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Client</Label>
                    <p>{selectedPayment.customers?.name || 'N/A'}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Commande</Label>
                    <p>{selectedPayment.orders?.order_number || 'N/A'}</p>
                  </div>
                  <div className="col-span-2">
                    <Label className="text-muted-foreground">Date de création</Label>
                    <p>{format(new Date(selectedPayment.created_at), 'PPpp', { locale: fr })}</p>
                  </div>
                  {selectedPayment.notes && (
                    <div className="col-span-2">
                      <Label className="text-muted-foreground">Notes</Label>
                      <p className="text-sm">{selectedPayment.notes}</p>
                    </div>
                  )}
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setViewDialogOpen(false)}>
                Fermer
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Payment Dialog */}
        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Modifier le paiement</DialogTitle>
              <DialogDescription>Modifiez les informations de ce paiement</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="payment_method">Méthode de paiement</Label>
                  <Select
                    value={editFormData.payment_method}
                    onValueChange={value =>
                      setEditFormData({ ...editFormData, payment_method: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cash">Espèces</SelectItem>
                      <SelectItem value="card">Carte bancaire</SelectItem>
                      <SelectItem value="mobile_money">Mobile Money</SelectItem>
                      <SelectItem value="bank_transfer">Virement bancaire</SelectItem>
                      <SelectItem value="check">Chèque</SelectItem>
                      <SelectItem value="other">Autre</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="amount">Montant</Label>
                  <Input
                    id="amount"
                    type="number"
                    value={editFormData.amount}
                    onChange={e => setEditFormData({ ...editFormData, amount: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="currency">Devise</Label>
                  <Select
                    value={editFormData.currency}
                    onValueChange={value => setEditFormData({ ...editFormData, currency: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="XOF">XOF</SelectItem>
                      <SelectItem value="EUR">EUR</SelectItem>
                      <SelectItem value="USD">USD</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="status">Statut</Label>
                  <Select
                    value={editFormData.status}
                    onValueChange={value => setEditFormData({ ...editFormData, status: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">En attente</SelectItem>
                      <SelectItem value="completed">Complété</SelectItem>
                      <SelectItem value="failed">Échoué</SelectItem>
                      <SelectItem value="refunded">Remboursé</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="transaction_id">ID Transaction</Label>
                  <Input
                    id="transaction_id"
                    value={editFormData.transaction_id}
                    onChange={e =>
                      setEditFormData({ ...editFormData, transaction_id: e.target.value })
                    }
                    placeholder="Optionnel"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={editFormData.notes}
                  onChange={e => setEditFormData({ ...editFormData, notes: e.target.value })}
                  placeholder="Notes supplémentaires..."
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setEditDialogOpen(false)}
                disabled={isUpdating}
              >
                Annuler
              </Button>
              <Button onClick={handleUpdatePayment} disabled={isUpdating}>
                {isUpdating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Enregistrement...
                  </>
                ) : (
                  'Enregistrer'
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Payment Confirmation Dialog */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Supprimer le paiement ?</AlertDialogTitle>
              <AlertDialogDescription>
                Cette action est irréversible. Le paiement sera définitivement supprimé.
                {selectedPayment && (
                  <div className="mt-2 p-2 bg-muted rounded">
                    <p className="font-medium">
                      {selectedPayment.amount.toLocaleString()} {selectedPayment.currency}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {selectedPayment.transaction_id || 'Sans ID transaction'}
                    </p>
                  </div>
                )}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isDeleting}>Annuler</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeletePayment}
                disabled={isDeleting}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Suppression...
                  </>
                ) : (
                  <>
                    <Trash2 className="h-4 w-4 mr-2" />
                    Supprimer
                  </>
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Create Payment Dialog */}
        {store && (
          <CreatePaymentDialog
            open={createDialogOpen}
            onOpenChange={setCreateDialogOpen}
            storeId={store.id}
            onPaymentCreated={refetch}
          />
        )}
      </div>
    </MainLayout>
  );
}






