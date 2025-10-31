/**
 * 🚀 AdvancedPaymentsComponent - Professional & Optimized
 * Composant optimisé avec design professionnel, responsive et fonctionnalités avancées
 * Gestion complète des paiements avancés (complet, pourcentage, sécurisé)
 */

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
import {
  CreditCard,
  Percent,
  Shield,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  DollarSign,
  Calendar,
  User,
  Package,
  MoreVertical,
  Eye,
  Unlock,
  AlertTriangle,
  Search,
  Filter,
  Loader2,
  RefreshCw,
  Grid3X3,
  List,
  ArrowUpRight,
  Download,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAdvancedPayments } from "@/hooks/useAdvancedPayments";
import { AdvancedPayment, PaymentType, PaymentStatus } from "@/types/advanced-features";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { logger } from '@/lib/logger';
import { useDebounce } from '@/hooks/useDebounce';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';

interface AdvancedPaymentsComponentProps {
  storeId?: string;
  orderId?: string;
  customerId?: string;
  className?: string;
}

const AdvancedPaymentsComponent: React.FC<AdvancedPaymentsComponentProps> = ({
  storeId,
  orderId,
  customerId,
  className = ""
}) => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showDisputeDialog, setShowDisputeDialog] = useState(false);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<AdvancedPayment | null>(null);
  const [disputeReason, setDisputeReason] = useState("");
  const [disputeDescription, setDisputeDescription] = useState("");
  
  // Filtres et recherche
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("recent");
  const [viewMode, setViewMode] = useState<"grid" | "list">("list");
  
  // Debounce search
  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  // Animations au scroll
  const statsRef = useScrollAnimation<HTMLDivElement>();
  const headerRef = useScrollAnimation<HTMLDivElement>();
  const paymentsListRef = useScrollAnimation<HTMLDivElement>();

  const {
    payments,
    loading,
    stats,
    createPayment,
    createPercentagePayment,
    createSecuredPayment,
    releasePayment,
    openDispute,
    deletePayment,
    refetch,
  } = useAdvancedPayments(storeId, {
    status: statusFilter !== "all" ? statusFilter as PaymentStatus : undefined,
    payment_type: typeFilter !== "all" ? typeFilter as PaymentType : undefined,
  });

  // Filtrage et tri des paiements
  const filteredAndSortedPayments = useMemo(() => {
    let filtered = [...(payments || [])];

    // Filtre par recherche
    if (debouncedSearchQuery) {
      const query = debouncedSearchQuery.toLowerCase();
      filtered = filtered.filter((payment) => {
        return (
          payment.transaction_id?.toLowerCase().includes(query) ||
          payment.notes?.toLowerCase().includes(query) ||
          payment.customers?.name?.toLowerCase().includes(query) ||
          payment.orders?.order_number?.toLowerCase().includes(query)
        );
      });
    }

    // Filtre par orderId si fourni
    if (orderId) {
      filtered = filtered.filter((payment) => payment.order_id === orderId);
    }

    // Tri
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
  }, [payments, debouncedSearchQuery, orderId, sortBy]);

  // Statistiques calculées
  const computedStats = useMemo(() => {
    if (!stats) {
      return {
        totalPayments: 0,
        completedPayments: 0,
        totalRevenue: 0,
        heldRevenue: 0,
        heldPayments: 0,
        successRate: 0,
      };
    }

    return {
      totalPayments: stats.total_payments || 0,
      completedPayments: stats.completed_payments || 0,
      totalRevenue: stats.total_revenue || 0,
      heldRevenue: stats.held_revenue || 0,
      heldPayments: stats.held_payments || 0,
      successRate: stats.success_rate || 0,
    };
  }, [stats]);

  // Handlers
  const handleRefresh = useCallback(() => {
    refetch?.();
    logger.info('Rafraîchissement des paiements avancés');
    toast({
      title: t('common.refreshed', 'Actualisé'),
      description: t('common.refreshedDesc', 'Les paiements ont été actualisés'),
    });
  }, [refetch, toast, t]);

  const handleReleasePayment = useCallback(async (payment: AdvancedPayment) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast({
        title: t('errors.auth', 'Erreur'),
        description: t('errors.notAuthenticated', 'Utilisateur non authentifié'),
        variant: "destructive",
      });
      return;
    }

    const result = await releasePayment(payment.id, user.id);
    if (result.success) {
      toast({
        title: t('success.title', 'Succès'),
        description: t('payments.released', 'Paiement libéré avec succès'),
      });
      logger.info('Paiement libéré', { paymentId: payment.id });
    } else {
      toast({
        title: t('errors.title', 'Erreur'),
        description: result.error || t('payments.releaseError', 'Impossible de libérer le paiement'),
        variant: "destructive",
      });
      logger.error('Erreur lors de la libération du paiement', { paymentId: payment.id, error: result.error });
    }
  }, [releasePayment, toast, t]);

  const handleOpenDispute = useCallback(async () => {
    if (!selectedPayment || !disputeReason || !disputeDescription) return;

    const result = await openDispute(selectedPayment.id, disputeReason, disputeDescription);
    if (result.success) {
      setShowDisputeDialog(false);
      setDisputeReason("");
      setDisputeDescription("");
      setSelectedPayment(null);
      toast({
        title: t('success.title', 'Succès'),
        description: t('payments.disputeOpened', 'Litige ouvert avec succès'),
      });
      logger.info('Litige ouvert', { paymentId: selectedPayment.id });
    } else {
      toast({
        title: t('errors.title', 'Erreur'),
        description: result.error || t('payments.disputeError', 'Impossible d\'ouvrir le litige'),
        variant: "destructive",
      });
      logger.error('Erreur lors de l\'ouverture du litige', { paymentId: selectedPayment.id, error: result.error });
    }
  }, [selectedPayment, disputeReason, disputeDescription, openDispute, toast, t]);

  const handleDeletePayment = useCallback(async (payment: AdvancedPayment) => {
    const result = await deletePayment(payment.id);
    if (!result.success) {
      toast({
        title: t('errors.title', 'Erreur'),
        description: result.error || t('payments.deleteError', 'Impossible de supprimer le paiement'),
        variant: "destructive",
      });
      logger.error('Erreur lors de la suppression du paiement', { paymentId: payment.id, error: result.error });
    } else {
      toast({
        title: t('success.title', 'Succès'),
        description: t('payments.deleted', 'Paiement supprimé avec succès'),
      });
      logger.info('Paiement supprimé', { paymentId: payment.id });
    }
  }, [deletePayment, toast, t]);

  const getStatusBadge = useCallback((status: PaymentStatus) => {
    const variants: Record<PaymentStatus, "default" | "secondary" | "destructive" | "outline"> = {
      pending: "secondary",
      completed: "default",
      failed: "destructive",
      refunded: "outline",
      held: "secondary",
      released: "default",
      disputed: "destructive",
    };

    const labels: Record<PaymentStatus, string> = {
      pending: t('payments.status.pending', 'En attente'),
      completed: t('payments.status.completed', 'Complété'),
      failed: t('payments.status.failed', 'Échoué'),
      refunded: t('payments.status.refunded', 'Remboursé'),
      held: t('payments.status.held', 'Retenu'),
      released: t('payments.status.released', 'Libéré'),
      disputed: t('payments.status.disputed', 'En litige'),
    };

    const icons: Record<PaymentStatus, React.ReactNode> = {
      pending: <Clock className="h-3 w-3" aria-hidden="true" />,
      completed: <CheckCircle className="h-3 w-3" aria-hidden="true" />,
      failed: <XCircle className="h-3 w-3" aria-hidden="true" />,
      refunded: <XCircle className="h-3 w-3" aria-hidden="true" />,
      held: <Shield className="h-3 w-3" aria-hidden="true" />,
      released: <Unlock className="h-3 w-3" aria-hidden="true" />,
      disputed: <AlertTriangle className="h-3 w-3" aria-hidden="true" />,
    };

    return (
      <Badge variant={variants[status] || "default"} className="flex items-center gap-1">
        {icons[status]}
        {labels[status] || status}
      </Badge>
    );
  }, [t]);

  const getPaymentTypeBadge = useCallback((type: PaymentType) => {
    const variants: Record<PaymentType, "default" | "secondary" | "outline"> = {
      full: "default",
      percentage: "secondary",
      delivery_secured: "outline",
    };

    const labels: Record<PaymentType, string> = {
      full: t('payments.type.full', 'Paiement complet'),
      percentage: t('payments.type.percentage', 'Paiement partiel'),
      delivery_secured: t('payments.type.secured', 'Paiement sécurisé'),
    };

    const icons: Record<PaymentType, React.ReactNode> = {
      full: <CreditCard className="h-3 w-3" aria-hidden="true" />,
      percentage: <Percent className="h-3 w-3" aria-hidden="true" />,
      delivery_secured: <Shield className="h-3 w-3" aria-hidden="true" />,
    };

    return (
      <Badge variant={variants[type] || "default"} className="flex items-center gap-1">
        {icons[type]}
        {labels[type] || type}
      </Badge>
    );
  }, [t]);

  const getMethodLabel = useCallback((method: string) => {
    const labels: Record<string, string> = {
      cash: t('payments.method.cash', 'Espèces'),
      card: t('payments.method.card', 'Carte bancaire'),
      mobile_money: t('payments.method.mobileMoney', 'Mobile Money'),
      bank_transfer: t('payments.method.bankTransfer', 'Virement bancaire'),
      check: t('payments.method.check', 'Chèque'),
      other: t('payments.method.other', 'Autre'),
    };
    return labels[method] || method;
  }, [t]);

  const formatDate = useCallback((dateString: string) => {
    return formatDistanceToNow(new Date(dateString), { 
      addSuffix: true, 
      locale: fr 
    });
  }, []);

  // Logging on mount
  useEffect(() => {
    logger.info('AdvancedPaymentsComponent chargé', {
      storeId,
      orderId,
      totalPayments: payments?.length || 0,
    });
  }, [storeId, orderId, payments?.length]);

  if (!storeId) {
    return (
      <Card className={`border-border/50 bg-card/50 backdrop-blur-sm ${className}`}>
        <CardContent className="flex items-center justify-center min-h-[300px] sm:min-h-[400px] p-6 sm:p-12">
          <div className="text-center space-y-4 animate-in fade-in zoom-in-95 duration-500">
            <div className="p-4 rounded-full bg-gradient-to-br from-blue-500/10 to-cyan-500/5 border border-blue-500/20 mx-auto w-fit">
              <CreditCard className="h-12 w-12 sm:h-16 sm:w-16 text-blue-600 dark:text-blue-400" aria-hidden="true" />
            </div>
            <h3 className="text-lg sm:text-xl font-semibold">
              {t('payments.noStore', 'Boutique non trouvée')}
            </h3>
            <p className="text-sm sm:text-base text-muted-foreground max-w-md mx-auto">
              {t('payments.noStoreDesc', 'Impossible de charger les paiements sans identifiant de boutique')}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card className={`border-border/50 bg-card/50 backdrop-blur-sm ${className}`}>
        <CardContent className="flex items-center justify-center min-h-[300px] sm:min-h-[400px] p-6 sm:p-12" role="status" aria-live="polite">
          <div className="text-center space-y-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
            <p className="text-sm text-muted-foreground">
              {t('payments.loading', 'Chargement des paiements...')}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={`space-y-4 sm:space-y-6 ${className}`}>
      {/* Statistiques - Responsive & Animated */}
      {stats && (
        <div 
          ref={statsRef}
          className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 animate-in fade-in slide-in-from-bottom-4 duration-700"
          role="region"
          aria-label={t('payments.stats.ariaLabel', 'Statistiques des paiements')}
        >
          {[
            {
              label: t('payments.stats.total', 'Paiements totaux'),
              value: computedStats.totalPayments,
              subValue: `${computedStats.completedPayments} ${t('payments.stats.completed', 'complétés')}`,
              icon: CreditCard,
              color: "from-blue-600 to-cyan-600",
              bgColor: "from-blue-500/10 to-cyan-500/5",
            },
            {
              label: t('payments.stats.revenue', 'Revenus totaux'),
              value: `${computedStats.totalRevenue.toLocaleString()} FCFA`,
              subValue: `${computedStats.heldRevenue.toLocaleString()} FCFA ${t('payments.stats.held', 'retenus')}`,
              icon: DollarSign,
              color: "from-green-600 to-emerald-600",
              bgColor: "from-green-500/10 to-emerald-500/5",
            },
            {
              label: t('payments.stats.held', 'Paiements retenus'),
              value: computedStats.heldPayments,
              subValue: t('payments.stats.pendingRelease', 'En attente de libération'),
              icon: Shield,
              color: "from-orange-600 to-amber-600",
              bgColor: "from-orange-500/10 to-amber-500/5",
            },
            {
              label: t('payments.stats.successRate', 'Taux de réussite'),
              value: `${computedStats.successRate.toFixed(1)}%`,
              subValue: t('payments.stats.successful', 'Paiements réussis'),
              icon: CheckCircle,
              color: "from-purple-600 to-pink-600",
              bgColor: "from-purple-500/10 to-pink-500/5",
            },
          ].map((stat, index) => {
            const Icon = stat.icon;
            return (
              <Card
                key={stat.label}
                className="border-border/50 bg-card/50 backdrop-blur-sm hover:shadow-lg transition-all duration-300 hover:scale-[1.02] animate-in fade-in slide-in-from-bottom-4 group overflow-hidden"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${stat.bgColor} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
                <CardHeader className="relative pb-2 sm:pb-3 p-3 sm:p-4">
                  <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground flex items-center gap-1.5 sm:gap-2">
                    <div className={`p-1.5 sm:p-2 rounded-lg bg-gradient-to-br ${stat.bgColor} border border-opacity-20`}>
                      <Icon className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-foreground/70" aria-hidden="true" />
                    </div>
                    {stat.label}
                  </CardTitle>
                </CardHeader>
                <CardContent className="relative p-3 sm:p-4 pt-0">
                  <div className={`text-xl sm:text-2xl lg:text-3xl font-bold bg-gradient-to-r ${stat.color} bg-clip-text text-transparent mb-1`}>
                    {stat.value}
                  </div>
                  <p className="text-[10px] sm:text-xs text-muted-foreground line-clamp-1">
                    {stat.subValue}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Header avec Actions - Responsive */}
      <div 
        ref={headerRef}
        className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 sm:p-6 rounded-lg border border-border/50 bg-card/50 backdrop-blur-sm animate-in fade-in slide-in-from-bottom-4 duration-700"
      >
        <div className="flex-1 min-w-0">
          <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold mb-1 sm:mb-2">
            {t('payments.title', 'Paiements avancés')}
          </h2>
          <p className="text-sm sm:text-base text-muted-foreground">
            {t('payments.description', 'Gérez les paiements par pourcentage et les paiements sécurisés')}
          </p>
        </div>
        <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            className="h-9 sm:h-10"
            aria-label={t('common.refresh', 'Rafraîchir')}
          >
            <RefreshCw className="h-4 w-4" aria-hidden="true" />
            <span className="hidden sm:inline ml-2">{t('common.refresh', 'Actualiser')}</span>
          </Button>
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 h-9 sm:h-10">
                <CreditCard className="h-4 w-4" aria-hidden="true" />
                <span className="ml-2">{t('payments.new', 'Nouveau paiement')}</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{t('payments.create.title', 'Créer un paiement avancé')}</DialogTitle>
                <DialogDescription>
                  {t('payments.create.description', 'Choisissez le type de paiement et configurez les paramètres')}
                </DialogDescription>
              </DialogHeader>
              <PaymentForm
                storeId={storeId}
                orderId={orderId}
                customerId={customerId}
                onCreatePayment={(result) => {
                  if (result.success) {
                    setShowCreateDialog(false);
                    toast({
                      title: t('success.title', 'Succès'),
                      description: t('payments.created', 'Paiement créé avec succès'),
                    });
                    logger.info('Paiement créé', { storeId, orderId });
                  } else {
                    toast({
                      title: t('errors.title', 'Erreur'),
                      description: result.error || t('payments.createError', 'Impossible de créer le paiement'),
                      variant: "destructive",
                    });
                  }
                }}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Filtres et Recherche - Responsive */}
      <div className="space-y-3 sm:space-y-4 p-4 sm:p-6 rounded-lg border border-border/50 bg-card/50 backdrop-blur-sm">
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" aria-hidden="true" />
            <Input
              placeholder={t('payments.search.placeholder', 'Rechercher par transaction, notes...')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-10 sm:h-11 text-sm sm:text-base"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-[160px] h-10 sm:h-11 text-sm sm:text-base">
              <Filter className="h-4 w-4 mr-2" aria-hidden="true" />
              <SelectValue placeholder={t('payments.filters.status', 'Statut')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('payments.filters.allStatus', 'Tous les statuts')}</SelectItem>
              <SelectItem value="pending">{t('payments.status.pending', 'En attente')}</SelectItem>
              <SelectItem value="completed">{t('payments.status.completed', 'Complété')}</SelectItem>
              <SelectItem value="failed">{t('payments.status.failed', 'Échoué')}</SelectItem>
              <SelectItem value="held">{t('payments.status.held', 'Retenu')}</SelectItem>
              <SelectItem value="disputed">{t('payments.status.disputed', 'En litige')}</SelectItem>
            </SelectContent>
          </Select>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-full sm:w-[160px] h-10 sm:h-11 text-sm sm:text-base">
              <SelectValue placeholder={t('payments.filters.type', 'Type')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('payments.filters.allTypes', 'Tous les types')}</SelectItem>
              <SelectItem value="full">{t('payments.type.full', 'Complet')}</SelectItem>
              <SelectItem value="percentage">{t('payments.type.percentage', 'Pourcentage')}</SelectItem>
              <SelectItem value="delivery_secured">{t('payments.type.secured', 'Sécurisé')}</SelectItem>
            </SelectContent>
          </Select>
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-full sm:w-[140px] h-10 sm:h-11 text-sm sm:text-base">
              <SelectValue placeholder={t('payments.sort', 'Trier')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="recent">{t('payments.sort.recent', 'Plus récents')}</SelectItem>
              <SelectItem value="oldest">{t('payments.sort.oldest', 'Plus anciens')}</SelectItem>
              <SelectItem value="amount-desc">{t('payments.sort.amountDesc', 'Montant décroissant')}</SelectItem>
              <SelectItem value="amount-asc">{t('payments.sort.amountAsc', 'Montant croissant')}</SelectItem>
              <SelectItem value="status">{t('payments.sort.status', 'Par statut')}</SelectItem>
            </SelectContent>
          </Select>
          <div className="flex gap-2">
            <Button
              variant={viewMode === "list" ? "default" : "outline"}
              size="sm"
              onClick={() => setViewMode("list")}
              className="h-10 sm:h-11"
              aria-label={t('payments.view.list', 'Vue liste')}
            >
              <List className="h-4 w-4" aria-hidden="true" />
            </Button>
            <Button
              variant={viewMode === "grid" ? "default" : "outline"}
              size="sm"
              onClick={() => setViewMode("grid")}
              className="h-10 sm:h-11"
              aria-label={t('payments.view.grid', 'Vue grille')}
            >
              <Grid3X3 className="h-4 w-4" aria-hidden="true" />
            </Button>
          </div>
        </div>
      </div>

      {/* Liste des paiements - Responsive */}
      <div 
        ref={paymentsListRef}
        className="space-y-3 sm:space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-700"
        role="region"
        aria-label={t('payments.list.ariaLabel', 'Liste des paiements')}
      >
        {filteredAndSortedPayments.length === 0 ? (
          <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
            <CardContent className="flex items-center justify-center min-h-[300px] sm:min-h-[400px] p-6 sm:p-12">
              <div className="text-center space-y-4 animate-in fade-in zoom-in-95 duration-500">
                <div className="p-4 rounded-full bg-gradient-to-br from-blue-500/10 to-cyan-500/5 border border-blue-500/20 mx-auto w-fit">
                  <CreditCard className="h-12 w-12 sm:h-16 sm:w-16 text-blue-600 dark:text-blue-400" aria-hidden="true" />
                </div>
                <h3 className="text-lg sm:text-xl font-semibold">
                  {searchQuery || statusFilter !== "all" || typeFilter !== "all"
                    ? t('payments.noResults', 'Aucun paiement trouvé')
                    : t('payments.empty', 'Aucun paiement')}
                </h3>
                <p className="text-sm sm:text-base text-muted-foreground max-w-md mx-auto">
                  {searchQuery || statusFilter !== "all" || typeFilter !== "all"
                    ? t('payments.noResultsDesc', 'Aucun paiement ne correspond à vos critères de recherche')
                    : t('payments.emptyDesc', 'Créez votre premier paiement avancé pour commencer')}
                </p>
                {!searchQuery && statusFilter === "all" && typeFilter === "all" && (
                  <Button
                    onClick={() => setShowCreateDialog(true)}
                    className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700"
                  >
                    <CreditCard className="h-4 w-4 mr-2" aria-hidden="true" />
                    {t('payments.createFirst', 'Créer un paiement')}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className={viewMode === "grid" ? "grid grid-cols-1 md:grid-cols-2 gap-4" : "space-y-4"}>
            {filteredAndSortedPayments.map((payment, index) => (
              <PaymentCard
                key={payment.id}
                payment={payment}
                index={index}
                getStatusBadge={getStatusBadge}
                getPaymentTypeBadge={getPaymentTypeBadge}
                getMethodLabel={getMethodLabel}
                formatDate={formatDate}
                onView={(payment) => {
                  setSelectedPayment(payment);
                  setShowDetailsDialog(true);
                }}
                onRelease={handleReleasePayment}
                onDispute={(payment) => {
                  setSelectedPayment(payment);
                  setShowDisputeDialog(true);
                }}
                onDelete={handleDeletePayment}
                viewMode={viewMode}
              />
            ))}
          </div>
        )}
      </div>

      {/* Dialog de détails */}
      <PaymentDetailsDialog
        open={showDetailsDialog}
        onOpenChange={setShowDetailsDialog}
        payment={selectedPayment}
        getStatusBadge={getStatusBadge}
        getPaymentTypeBadge={getPaymentTypeBadge}
        getMethodLabel={getMethodLabel}
        formatDate={formatDate}
        t={t}
      />

      {/* Dialog de litige */}
      <DisputeDialog
        open={showDisputeDialog}
        onOpenChange={setShowDisputeDialog}
        payment={selectedPayment}
        disputeReason={disputeReason}
        disputeDescription={disputeDescription}
        onReasonChange={setDisputeReason}
        onDescriptionChange={setDisputeDescription}
        onSubmit={handleOpenDispute}
        t={t}
      />
    </div>
  );
};

// Composant PaymentCard optimisé
interface PaymentCardProps {
  payment: AdvancedPayment;
  index: number;
  getStatusBadge: (status: PaymentStatus) => React.ReactNode;
  getPaymentTypeBadge: (type: PaymentType) => React.ReactNode;
  getMethodLabel: (method: string) => string;
  formatDate: (date: string) => string;
  onView: (payment: AdvancedPayment) => void;
  onRelease: (payment: AdvancedPayment) => void;
  onDispute: (payment: AdvancedPayment) => void;
  onDelete: (payment: AdvancedPayment) => void;
  viewMode: "grid" | "list";
}

const PaymentCard: React.FC<PaymentCardProps> = ({
  payment,
  index,
  getStatusBadge,
  getPaymentTypeBadge,
  getMethodLabel,
  formatDate,
  onView,
  onRelease,
  onDispute,
  onDelete,
  viewMode,
}) => {
  return (
    <Card
      className="border-border/50 bg-card/50 backdrop-blur-sm hover:shadow-lg transition-all duration-300 hover:scale-[1.01] group overflow-hidden animate-in fade-in slide-in-from-bottom-4"
      style={{ animationDelay: `${index * 50}ms` }}
    >
      <CardContent className="p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex-1 min-w-0 space-y-3">
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              <h3 className="font-semibold text-base sm:text-lg truncate">
                {payment.transaction_id ? `#${payment.transaction_id.slice(-8)}` : 'Paiement'}
              </h3>
              {getStatusBadge(payment.status)}
              {getPaymentTypeBadge(payment.payment_type)}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-green-600 shrink-0" aria-hidden="true" />
                <span className="font-semibold text-green-600 text-sm sm:text-base">
                  {payment.amount.toLocaleString()} {payment.currency}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-muted-foreground shrink-0" aria-hidden="true" />
                <span className="text-sm sm:text-base">{getMethodLabel(payment.payment_method)}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground shrink-0" aria-hidden="true" />
                <span className="text-sm sm:text-base">{formatDate(payment.created_at)}</span>
              </div>
            </div>

            {/* Informations spécifiques */}
            {payment.payment_type === 'percentage' && payment.percentage_rate && (
              <div className="bg-blue-50 dark:bg-blue-950 p-3 rounded-lg border border-blue-200 dark:border-blue-800">
                <div className="flex items-center gap-2 mb-2">
                  <Percent className="h-4 w-4 text-blue-600" aria-hidden="true" />
                  <span className="font-medium text-blue-900 dark:text-blue-100 text-sm">
                    {getPaymentTypeBadge(payment.payment_type)}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs sm:text-sm">
                  <div>
                    <span className="text-muted-foreground">{'Pourcentage:'}</span>
                    <span className="font-medium ml-1">{payment.percentage_rate}%</span>
                  </div>
                  {payment.remaining_amount && (
                    <div>
                      <span className="text-muted-foreground">{'Restant:'}</span>
                      <span className="font-medium ml-1">
                        {payment.remaining_amount.toLocaleString()} {payment.currency}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {payment.payment_type === 'delivery_secured' && (
              <div className="bg-orange-50 dark:bg-orange-950 p-3 rounded-lg border border-orange-200 dark:border-orange-800">
                <div className="flex items-center gap-2 mb-2">
                  <Shield className="h-4 w-4 text-orange-600" aria-hidden="true" />
                  <span className="font-medium text-orange-900 dark:text-orange-100 text-sm">
                    {getPaymentTypeBadge(payment.payment_type)}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs sm:text-sm">
                  <div>
                    <span className="text-muted-foreground">{'Statut:'}</span>
                    <span className="font-medium ml-1">
                      {payment.is_held ? 'Retenu' : 'Libéré'}
                    </span>
                  </div>
                  {payment.held_until && (
                    <div>
                      <span className="text-muted-foreground">{'Jusqu\'au:'}</span>
                      <span className="font-medium ml-1">
                        {new Date(payment.held_until).toLocaleDateString('fr-FR')}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Client et commande */}
            <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-xs sm:text-sm text-muted-foreground">
              {payment.customers && (
                <div className="flex items-center gap-1.5">
                  <User className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                  <span className="truncate">{payment.customers.name}</span>
                </div>
              )}
              {payment.orders && (
                <div className="flex items-center gap-1.5">
                  <Package className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                  <span className="truncate">Commande #{payment.orders.order_number}</span>
                </div>
              )}
            </div>

            {payment.notes && (
              <div className="mt-2 p-2 bg-muted/50 rounded text-xs sm:text-sm">
                <span className="font-medium">{'Notes:'}</span> {payment.notes}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto justify-end sm:justify-start">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onView(payment)}
              className="h-9 sm:h-10 text-xs sm:text-sm"
              aria-label="Voir les détails"
            >
              <Eye className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5" aria-hidden="true" />
              <span className="hidden sm:inline">Voir</span>
            </Button>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-9 sm:h-10 text-xs sm:text-sm">
                  <MoreVertical className="h-3.5 w-3.5 sm:h-4 sm:w-4" aria-hidden="true" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {payment.is_held && payment.status === 'held' && (
                  <DropdownMenuItem onClick={() => onRelease(payment)}>
                    <Unlock className="h-4 w-4 mr-2" aria-hidden="true" />
                    Libérer le paiement
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem onClick={() => onDispute(payment)}>
                  <AlertTriangle className="h-4 w-4 mr-2" aria-hidden="true" />
                  Ouvrir un litige
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={() => onDelete(payment)}
                  className="text-destructive focus:text-destructive"
                >
                  <XCircle className="h-4 w-4 mr-2" aria-hidden="true" />
                  Supprimer
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// Composant PaymentDetailsDialog optimisé
interface PaymentDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  payment: AdvancedPayment | null;
  getStatusBadge: (status: PaymentStatus) => React.ReactNode;
  getPaymentTypeBadge: (type: PaymentType) => React.ReactNode;
  getMethodLabel: (method: string) => string;
  formatDate: (date: string) => string;
  t: (key: string, defaultValue?: string) => string;
}

const PaymentDetailsDialog: React.FC<PaymentDetailsDialogProps> = ({
  open,
  onOpenChange,
  payment,
  getStatusBadge,
  getPaymentTypeBadge,
  getMethodLabel,
  formatDate,
  t,
}) => {
  if (!payment) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" aria-hidden="true" />
            {t('payments.details.title', 'Détails du paiement')}
          </DialogTitle>
          <DialogDescription>
            {t('payments.details.description', 'Informations complètes sur le paiement sélectionné')}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Statut et Type */}
          <div className="flex flex-wrap items-center gap-3">
            {getStatusBadge(payment.status)}
            {getPaymentTypeBadge(payment.payment_type)}
            {payment.is_held && (
              <Badge variant="outline" className="flex items-center gap-1">
                <Shield className="h-3 w-3" aria-hidden="true" />
                {t('payments.held', 'Fonds retenus')}
              </Badge>
            )}
          </div>

          <Separator />

          {/* Informations principales */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="font-semibold flex items-center gap-2">
                <CreditCard className="h-4 w-4" aria-hidden="true" />
                {t('payments.details.paymentInfo', 'Informations de paiement')}
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t('payments.details.transactionId', 'ID Transaction:')}</span>
                  <span className="font-mono text-xs">
                    {payment.transaction_id || 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t('payments.details.amount', 'Montant:')}</span>
                  <span className="font-semibold text-green-600">
                    {payment.amount.toLocaleString()} {payment.currency}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t('payments.details.method', 'Méthode:')}</span>
                  <span className="font-medium">{getMethodLabel(payment.payment_method)}</span>
                </div>
                {payment.payment_type === 'percentage' && (
                  <>
                    <Separator />
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{t('payments.details.percentage', 'Taux:')}</span>
                      <span>{payment.percentage_rate}%</span>
                    </div>
                    {payment.remaining_amount && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">{t('payments.details.remaining', 'Restant:')}</span>
                        <span>
                          {payment.remaining_amount.toLocaleString()} {payment.currency}
                        </span>
                      </div>
                    )}
                  </>
                )}
                {payment.payment_type === 'delivery_secured' && (
                  <>
                    <Separator />
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{t('payments.details.heldStatus', 'Statut:')}</span>
                      <span>{payment.is_held ? t('payments.held', 'Retenu') : t('payments.released', 'Libéré')}</span>
                    </div>
                    {payment.held_until && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">{t('payments.details.heldUntil', 'Retenu jusqu\'au:')}</span>
                        <span>{new Date(payment.held_until).toLocaleDateString('fr-FR')}</span>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="font-semibold flex items-center gap-2">
                <Calendar className="h-4 w-4" aria-hidden="true" />
                {t('payments.details.timeline', 'Chronologie')}
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t('payments.details.created', 'Créé:')}</span>
                  <span>{formatDate(payment.created_at)}</span>
                </div>
                {payment.updated_at && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t('payments.details.updated', 'Modifié:')}</span>
                    <span>{formatDate(payment.updated_at)}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          <Separator />

          {/* Client et commande */}
          {(payment.customers || payment.orders) && (
            <div className="space-y-4">
              <h3 className="font-semibold">{t('payments.details.related', 'Informations liées')}</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                {payment.customers && (
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                    <div>
                      <div className="text-muted-foreground">{t('payments.details.customer', 'Client')}</div>
                      <div className="font-medium">{payment.customers.name}</div>
                      {payment.customers.email && (
                        <div className="text-xs text-muted-foreground">{payment.customers.email}</div>
                      )}
                    </div>
                  </div>
                )}
                {payment.orders && (
                  <div className="flex items-center gap-2">
                    <Package className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                    <div>
                      <div className="text-muted-foreground">{t('payments.details.order', 'Commande')}</div>
                      <div className="font-medium">#{payment.orders.order_number}</div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Notes */}
          {payment.notes && (
            <>
              <Separator />
              <div className="space-y-2">
                <h3 className="font-semibold">{t('payments.details.notes', 'Notes')}</h3>
                <p className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">
                  {payment.notes}
                </p>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

// Composant DisputeDialog optimisé
interface DisputeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  payment: AdvancedPayment | null;
  disputeReason: string;
  disputeDescription: string;
  onReasonChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
  onSubmit: () => void;
  t: (key: string, defaultValue?: string) => string;
}

const DisputeDialog: React.FC<DisputeDialogProps> = ({
  open,
  onOpenChange,
  payment,
  disputeReason,
  disputeDescription,
  onReasonChange,
  onDescriptionChange,
  onSubmit,
  t,
}) => {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-2xl">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" aria-hidden="true" />
            {t('payments.dispute.title', 'Ouvrir un litige')}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {t('payments.dispute.description', 'Veuillez décrire la raison et les détails du litige pour le paiement sélectionné')}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="dispute-reason">{t('payments.dispute.reason', 'Raison du litige')}</Label>
            <Input
              id="dispute-reason"
              value={disputeReason}
              onChange={(e) => onReasonChange(e.target.value)}
              placeholder={t('payments.dispute.reasonPlaceholder', 'Ex: Livraison non reçue, produit défectueux...')}
              className="mt-2"
            />
          </div>
          <div>
            <Label htmlFor="dispute-description">{t('payments.dispute.descriptionLabel', 'Description détaillée')}</Label>
            <Textarea
              id="dispute-description"
              value={disputeDescription}
              onChange={(e) => onDescriptionChange(e.target.value)}
              placeholder={t('payments.dispute.descriptionPlaceholder', 'Décrivez le problème en détail...')}
              rows={4}
              className="mt-2"
            />
          </div>
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel>{t('common.cancel', 'Annuler')}</AlertDialogCancel>
          <AlertDialogAction 
            onClick={onSubmit}
            disabled={!disputeReason || !disputeDescription}
            className="bg-destructive hover:bg-destructive/90"
          >
            {t('payments.dispute.submit', 'Ouvrir le litige')}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

// Composant PaymentForm optimisé
interface PaymentFormProps {
  storeId: string;
  orderId?: string;
  customerId?: string;
  onCreatePayment: (result: any) => void;
}

const PaymentForm: React.FC<PaymentFormProps> = ({
  storeId,
  orderId,
  customerId,
  onCreatePayment,
}) => {
  const { t } = useTranslation();
  const [paymentType, setPaymentType] = useState<PaymentType>('full');
  const [formData, setFormData] = useState({
    amount: '',
    currency: 'XOF',
    payment_method: 'mobile_money',
    percentage_rate: 30,
    notes: '',
  });

  const { createPayment, createPercentagePayment, createSecuredPayment } = useAdvancedPayments(storeId);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    const amount = parseFloat(formData.amount);
    if (isNaN(amount) || amount <= 0) {
      onCreatePayment({ success: false, error: t('payments.form.invalidAmount', 'Montant invalide') });
      return;
    }

    const options = {
      storeId,
      orderId,
      customerId,
      amount,
      currency: formData.currency,
      paymentMethod: formData.payment_method,
      notes: formData.notes,
    };

    let result;
    switch (paymentType) {
      case 'percentage':
        result = await createPercentagePayment({
          ...options,
          percentageRate: formData.percentage_rate,
          remainingAmount: amount * (1 - formData.percentage_rate / 100),
        });
        break;
      case 'delivery_secured':
        result = await createSecuredPayment({
          ...options,
          holdReason: 'delivery_confirmation',
          releaseConditions: {
            delivery_confirmed: true,
            customer_satisfied: true,
          },
          heldUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        });
        break;
      default:
        result = await createPayment(options);
    }

    onCreatePayment(result);
  }, [paymentType, formData, storeId, orderId, customerId, createPayment, createPercentagePayment, createSecuredPayment, onCreatePayment, t]);

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="payment-type">{t('payments.form.type', 'Type de paiement')}</Label>
        <Select value={paymentType} onValueChange={(value: PaymentType) => setPaymentType(value)}>
          <SelectTrigger id="payment-type" className="mt-2">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="full">{t('payments.type.full', 'Paiement complet')}</SelectItem>
            <SelectItem value="percentage">{t('payments.type.percentage', 'Paiement par pourcentage')}</SelectItem>
            <SelectItem value="delivery_secured">{t('payments.type.securedDelivery', 'Paiement sécurisé (à la livraison)')}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="amount">{t('payments.form.amount', 'Montant')}</Label>
          <Input
            id="amount"
            type="number"
            step="0.01"
            value={formData.amount}
            onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
            required
            className="mt-2"
          />
        </div>
        <div>
          <Label htmlFor="currency">{t('payments.form.currency', 'Devise')}</Label>
          <Select value={formData.currency} onValueChange={(value) => setFormData({ ...formData, currency: value })}>
            <SelectTrigger id="currency" className="mt-2">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="XOF">XOF</SelectItem>
              <SelectItem value="EUR">EUR</SelectItem>
              <SelectItem value="USD">USD</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <Label htmlFor="payment-method">{t('payments.form.method', 'Méthode de paiement')}</Label>
        <Select value={formData.payment_method} onValueChange={(value) => setFormData({ ...formData, payment_method: value })}>
          <SelectTrigger id="payment-method" className="mt-2">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="mobile_money">{t('payments.method.mobileMoney', 'Mobile Money')}</SelectItem>
            <SelectItem value="card">{t('payments.method.card', 'Carte bancaire')}</SelectItem>
            <SelectItem value="bank_transfer">{t('payments.method.bankTransfer', 'Virement bancaire')}</SelectItem>
            <SelectItem value="cash">{t('payments.method.cash', 'Espèces')}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {paymentType === 'percentage' && (
        <div>
          <Label htmlFor="percentage-rate">{t('payments.form.percentage', 'Pourcentage à payer')}</Label>
          <Input
            id="percentage-rate"
            type="number"
            min="1"
            max="99"
            value={formData.percentage_rate}
            onChange={(e) => setFormData({ ...formData, percentage_rate: parseInt(e.target.value) })}
            required
            className="mt-2"
          />
          <p className="text-sm text-muted-foreground mt-1">
            {t('payments.form.percentageDesc', 'Le client paiera {{percentage}}% maintenant et le reste après validation', { percentage: formData.percentage_rate })}
          </p>
        </div>
      )}

      {paymentType === 'delivery_secured' && (
        <div className="bg-orange-50 dark:bg-orange-950 p-3 sm:p-4 rounded-lg border border-orange-200 dark:border-orange-800">
          <div className="flex items-center gap-2 mb-2">
            <Shield className="h-4 w-4 text-orange-600" aria-hidden="true" />
            <span className="font-medium text-orange-900 dark:text-orange-100">
              {t('payments.type.secured', 'Paiement sécurisé')}
            </span>
          </div>
          <p className="text-sm text-orange-800 dark:text-orange-200">
            {t('payments.form.securedDesc', 'Le montant sera retenu par la plateforme jusqu\'à confirmation de livraison par le client. En cas de problème, la somme reste bloquée jusqu\'à résolution.')}
          </p>
        </div>
      )}

      <div>
        <Label htmlFor="notes">{t('payments.form.notes', 'Notes (optionnel)')}</Label>
        <Textarea
          id="notes"
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          rows={3}
          className="mt-2"
        />
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button type="submit" className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700">
          {t('payments.form.submit', 'Créer le paiement')}
        </Button>
      </div>
    </form>
  );
};

export default AdvancedPaymentsComponent;
