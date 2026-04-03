/**
 * Returns Tab Component
 * Date: 2 Février 2025
 *
 * Onglet pour afficher les retours client
 * Version simplifiée sans layout pour intégration dans CustomerPortal
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/AuthContext';
import { useCustomerReturns, ProductReturn } from '@/hooks/returns/useReturns';
import {
  RefreshCw,
  Search,
  Eye,
  Calendar,
  Package,
  DollarSign,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Clock,
  Loader2,
  AlertTriangle,
  X,
  RotateCcw,
} from 'lucide-react';
import { useState, useMemo, useCallback } from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';
import { useDebounce } from '@/hooks/useDebounce';
import { useToast } from '@/hooks/use-toast';
import { logger } from '@/lib/logger';
import { ReturnDetailView } from '@/components/physical/customer/ReturnDetailView';

export const ReturnsTab = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { data: returns, isLoading, error: returnsError, refetch } = useCustomerReturns(user?.id);
  const [searchInput, setSearchInput] = useState('');
  const debouncedSearch = useDebounce(searchInput, 300);
  const [activeTab, setActiveTab] = useState<
    'all' | 'requested' | 'approved' | 'refunded' | 'rejected' | 'cancelled'
  >('all');

  // Animations au scroll
  const headerRef = useScrollAnimation<HTMLDivElement>();
  const statsRef = useScrollAnimation<HTMLDivElement>();
  const filtersRef = useScrollAnimation<HTMLDivElement>();
  const returnsRef = useScrollAnimation<HTMLDivElement>();

  // Stats calculées
  const stats = useMemo(() => {
    if (!returns) {
      return { total: 0, inProgress: 0, refunded: 0, totalRefunded: 0 };
    }

    const inProgress = returns.filter((r: ProductReturn) =>
      ['requested', 'approved', 'pending_pickup', 'in_transit', 'received', 'inspecting'].includes(
        r.status
      )
    ).length;
    const refunded = returns.filter((r: ProductReturn) => r.status === 'refunded').length;
    const totalRefunded = returns.reduce(
      (sum: number, r: ProductReturn) => sum + (r.refund_amount || 0),
      0
    );

    return {
      total: returns.length,
      inProgress,
      refunded,
      totalRefunded,
    };
  }, [returns]);

  // Filtrer les retours
  const filteredReturns = useMemo(() => {
    if (!returns) return [];

    let  filtered= returns;

    // Filtre par statut
    if (activeTab !== 'all') {
      if (activeTab === 'requested') {
        filtered = filtered.filter((r: ProductReturn) =>
          [
            'requested',
            'approved',
            'pending_pickup',
            'in_transit',
            'received',
            'inspecting',
          ].includes(r.status)
        );
      } else {
        filtered = filtered.filter((r: ProductReturn) => r.status === activeTab);
      }
    }

    // Recherche
    if (debouncedSearch.trim()) {
      const query = debouncedSearch.toLowerCase();
      filtered = filtered.filter(
        (r: ProductReturn) =>
          r.return_number.toLowerCase().includes(query) ||
          r.product_id?.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [returns, activeTab, debouncedSearch]);

  const getStatusBadge = useCallback((status: string) => {
    type IconComponent = React.ComponentType<{ className?: string }>;
    const  statusConfig: Record<
      string,
      {
        label: string;
        variant: 'default' | 'secondary' | 'destructive' | 'outline';
        icon: IconComponent;
      }
    > = {
      requested: { label: 'En attente', variant: 'secondary', icon: Clock },
      approved: { label: 'Approuvé', variant: 'default', icon: CheckCircle2 },
      rejected: { label: 'Rejeté', variant: 'destructive', icon: XCircle },
      pending_pickup: { label: 'Récupération', variant: 'secondary', icon: Clock },
      in_transit: { label: 'En transit', variant: 'default', icon: Package },
      received: { label: 'Reçu', variant: 'default', icon: CheckCircle2 },
      inspecting: { label: 'Inspection', variant: 'secondary', icon: AlertCircle },
      refunded: { label: 'Remboursé', variant: 'default', icon: CheckCircle2 },
      exchanged: { label: 'Échangé', variant: 'default', icon: RefreshCw },
      replaced: { label: 'Remplacé', variant: 'default', icon: Package },
      cancelled: { label: 'Annulé', variant: 'destructive', icon: XCircle },
    };

    const config = statusConfig[status] || { label: status, variant: 'outline', icon: AlertCircle };
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="flex items-center gap-1 text-xs sm:text-sm">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  }, []);

  // Gérer le rafraîchissement
  const handleRefresh = useCallback(async () => {
    try {
      await refetch();
      toast({
        title: 'Rafraîchissement réussi',
        description: 'Les retours ont été mis à jour.',
      });
      logger.info('Returns refreshed');
    } catch (err) {
      logger.error('Error refreshing returns:', err);
      toast({
        title: 'Erreur',
        description: 'Impossible de rafraîchir les retours.',
        variant: 'destructive',
      });
    }
  }, [refetch, toast]);

  // Formater la devise
  const formatCurrency = useCallback((amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XOF',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  }, []);

  const hasError = returnsError;

  if (isLoading) {
    return (
      <div className="space-y-4 sm:space-y-6">
        <div className="text-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary" />
          <p className="text-muted-foreground">Chargement des retours...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header avec animation - Style Inventaire */}
      <div
        ref={headerRef}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 animate-in fade-in slide-in-from-top-4 duration-700"
      >
        <div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold flex items-center gap-2 mb-1 sm:mb-2">
            <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500/10 to-pink-500/5 backdrop-blur-sm border border-purple-500/20 animate-in zoom-in duration-500">
              <RotateCcw
                className="h-5 w-5 sm:h-6 sm:w-6 lg:h-8 lg:w-8 text-purple-500 dark:text-purple-400"
                aria-hidden="true"
              />
            </div>
            <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              Mes Retours
            </span>
          </h1>
          <p className="text-xs sm:text-sm lg:text-base text-muted-foreground">
            Gérez vos demandes de retour et remboursement
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={handleRefresh}
            size="sm"
            variant="outline"
            className="min-h-[44px] h-11 sm:h-12 transition-all hover:scale-105 text-xs sm:text-sm"
            disabled={isLoading}
          >
            <RefreshCw
              className={`h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2 ${isLoading ? 'animate-spin' : ''}`}
            />
            <span className="hidden sm:inline">Rafraîchir</span>
            <span className="sm:hidden">Raf.</span>
          </Button>
        </div>
      </div>

      {/* Gestion d'erreurs */}
      {hasError && (
        <Alert
          variant="destructive"
          className="animate-in fade-in slide-in-from-top-4 duration-500"
        >
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Une erreur est survenue lors du chargement des retours. Veuillez réessayer.
          </AlertDescription>
        </Alert>
      )}

      {/* Stats Cards */}
      <div
        ref={statsRef}
        className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-100"
      >
        <Card className="border-border/50 bg-card/50 backdrop-blur-sm hover:shadow-lg transition-all duration-300 hover:scale-105">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm text-muted-foreground mb-1">Total Retours</p>
                <p className="text-base sm:text-xl md:text-2xl lg:text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                  {stats.total}
                </p>
              </div>
              <div className="p-2 sm:p-3 rounded-full bg-gradient-to-br from-purple-500/10 to-pink-500/5">
                <RotateCcw className="h-5 w-5 sm:h-6 sm:w-6 text-purple-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50 bg-card/50 backdrop-blur-sm hover:shadow-lg transition-all duration-300 hover:scale-105">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm text-muted-foreground mb-1">En Cours</p>
                <p className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-yellow-600 to-orange-600 bg-clip-text text-transparent">
                  {stats.inProgress}
                </p>
              </div>
              <div className="p-2 sm:p-3 rounded-full bg-gradient-to-br from-yellow-500/10 to-orange-500/5">
                <Clock className="h-5 w-5 sm:h-6 sm:w-6 text-yellow-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50 bg-card/50 backdrop-blur-sm hover:shadow-lg transition-all duration-300 hover:scale-105">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm text-muted-foreground mb-1">Remboursés</p>
                <p className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                  {stats.refunded}
                </p>
              </div>
              <div className="p-2 sm:p-3 rounded-full bg-gradient-to-br from-green-500/10 to-emerald-500/5">
                <CheckCircle2 className="h-5 w-5 sm:h-6 sm:w-6 text-green-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50 bg-card/50 backdrop-blur-sm hover:shadow-lg transition-all duration-300 hover:scale-105">
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm text-muted-foreground mb-1">Total Remboursé</p>
                <p className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                  {formatCurrency(stats.totalRefunded)}
                </p>
              </div>
              <div className="p-2 sm:p-3 rounded-full bg-gradient-to-br from-blue-500/10 to-cyan-500/5">
                <DollarSign className="h-5 w-5 sm:h-6 sm:w-6 text-blue-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recherche et Filtres */}
      <div
        ref={filtersRef}
        className="space-y-3 sm:space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-200"
      >
        {/* Recherche */}
        <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
          <CardContent className="p-3 sm:p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" />
              <Input
                placeholder="Rechercher par numéro de retour ou produit..."
                value={searchInput}
                onChange={e => setSearchInput(e.target.value)}
                className="pl-10 sm:pl-12 pr-12 min-h-[44px] h-11 sm:h-12 text-sm sm:text-base"
              />
              {searchInput && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSearchInput('')}
                  className="absolute right-1 top-1/2 transform -translate-y-1/2 min-h-[44px] min-w-[44px] h-11 w-11 p-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Tabs pour le filtre de statut */}
        <Tabs
          value={activeTab}
          onValueChange={value => setActiveTab(value as typeof activeTab)}
          className="w-full"
        >
          <TabsList className="grid w-full grid-cols-3 sm:grid-cols-6 h-auto p-1 bg-muted/50 overflow-x-auto">
            <TabsTrigger
              value="all"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-pink-600 data-[state=active]:text-white transition-all duration-300 text-xs sm:text-sm py-2 sm:py-2.5 min-h-[44px] flex-shrink-0"
            >
              Tous
            </TabsTrigger>
            <TabsTrigger
              value="requested"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-pink-600 data-[state=active]:text-white transition-all duration-300 text-xs sm:text-sm py-2 sm:py-2.5 min-h-[44px] flex-shrink-0"
            >
              <Clock className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
              En Cours
            </TabsTrigger>
            <TabsTrigger
              value="approved"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-pink-600 data-[state=active]:text-white transition-all duration-300 text-xs sm:text-sm py-2 sm:py-2.5 min-h-[44px] flex-shrink-0"
            >
              <CheckCircle2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
              Approuvés
            </TabsTrigger>
            <TabsTrigger
              value="refunded"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-pink-600 data-[state=active]:text-white transition-all duration-300 text-xs sm:text-sm py-2 sm:py-2.5 min-h-[44px] flex-shrink-0"
            >
              <DollarSign className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
              Remboursés
            </TabsTrigger>
            <TabsTrigger
              value="rejected"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-pink-600 data-[state=active]:text-white transition-all duration-300 text-xs sm:text-sm py-2 sm:py-2.5 min-h-[44px] flex-shrink-0"
            >
              <XCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
              Rejetés
            </TabsTrigger>
            <TabsTrigger
              value="cancelled"
              className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-pink-600 data-[state=active]:text-white transition-all duration-300 text-xs sm:text-sm py-2 sm:py-2.5 min-h-[44px] flex-shrink-0"
            >
              <XCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
              Annulés
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Liste des retours */}
      <div
        ref={returnsRef}
        className="animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300"
      >
        {!isLoading && filteredReturns.length === 0 ? (
          <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
            <CardContent className="p-8 sm:p-12 text-center">
              <RotateCcw className="h-12 w-12 sm:h-16 sm:w-16 text-muted-foreground mx-auto mb-4 animate-in zoom-in duration-500" />
              <h3 className="text-lg sm:text-xl font-semibold mb-2">Aucun retour</h3>
              <p className="text-sm sm:text-base text-muted-foreground mb-4">
                {searchInput || activeTab !== 'all'
                  ? 'Aucun retour ne correspond à vos critères de recherche.'
                  : 'Aucun retour pour le moment'}
              </p>
              {searchInput && (
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearchInput('');
                    setActiveTab('all');
                  }}
                  className="min-h-[44px] touch-manipulation"
                >
                  Réinitialiser les filtres
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-base sm:text-lg">Historique des Retours</CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                {filteredReturns.length} retour{filteredReturns.length > 1 ? 's' : ''} trouvé
                {filteredReturns.length > 1 ? 's' : ''}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Tableau sur desktop, cartes sur mobile */}
              <div className="hidden md:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs sm:text-sm">Numéro</TableHead>
                      <TableHead className="text-xs sm:text-sm">Produit</TableHead>
                      <TableHead className="text-xs sm:text-sm">Raison</TableHead>
                      <TableHead className="text-xs sm:text-sm">Montant</TableHead>
                      <TableHead className="text-xs sm:text-sm">Statut</TableHead>
                      <TableHead className="text-xs sm:text-sm">Date</TableHead>
                      <TableHead className="text-right text-xs sm:text-sm">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredReturns.map((returnItem: ProductReturn) => (
                      <TableRow key={returnItem.id} className="hover:bg-muted/50 transition-colors">
                        <TableCell className="font-mono text-xs sm:text-sm">
                          {returnItem.return_number}
                        </TableCell>
                        <TableCell className="text-xs sm:text-sm">
                          <div className="flex items-center gap-2">
                            <Package className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                            <span className="font-medium truncate">
                              Produit {returnItem.product_id.slice(0, 8)}...
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-xs sm:text-sm">
                          <span className="text-muted-foreground">
                            {returnItem.return_reason === 'defective' && 'Défectueux'}
                            {returnItem.return_reason === 'wrong_item' && 'Mauvais article'}
                            {returnItem.return_reason === 'not_as_described' && 'Ne correspond pas'}
                            {returnItem.return_reason === 'damaged' && 'Endommagé'}
                            {returnItem.return_reason === 'size_fit' && 'Taille/ajustement'}
                            {returnItem.return_reason === 'quality' && 'Qualité'}
                            {returnItem.return_reason === 'duplicate' && 'Dupliqué'}
                            {returnItem.return_reason === 'changed_mind' && "Changement d'avis"}
                            {returnItem.return_reason === 'other' && 'Autre'}
                          </span>
                        </TableCell>
                        <TableCell className="font-semibold text-xs sm:text-sm">
                          {formatCurrency(returnItem.refund_amount || returnItem.total_amount)}
                        </TableCell>
                        <TableCell>{getStatusBadge(returnItem.status)}</TableCell>
                        <TableCell className="text-xs sm:text-sm">
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <Calendar className="h-3.5 w-3.5" />
                            {format(new Date(returnItem.requested_at), 'dd/MM/yyyy', {
                              locale: fr,
                            })}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                className="min-h-[36px] text-xs sm:text-sm"
                              >
                                <Eye className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
                                Voir
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                              <DialogHeader>
                                <DialogTitle>Détails du Retour</DialogTitle>
                                <DialogDescription>{returnItem.return_number}</DialogDescription>
                              </DialogHeader>
                              <ReturnDetailView returnId={returnItem.id} />
                            </DialogContent>
                          </Dialog>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Cartes sur mobile */}
              <div className="md:hidden space-y-3 sm:space-y-4">
                {filteredReturns.map((returnItem: ProductReturn) => (
                  <Card
                    key={returnItem.id}
                    className="border-border/50 bg-card/50 backdrop-blur-sm hover:shadow-lg transition-all duration-300"
                  >
                    <CardContent className="p-4 sm:p-5">
                      <div className="space-y-3 sm:space-y-4">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-sm sm:text-base mb-1 break-words font-mono">
                              {returnItem.return_number}
                            </h3>
                            <div className="flex items-center gap-1 text-xs sm:text-sm text-muted-foreground mb-2">
                              <Package className="h-3.5 w-3.5" />
                              Produit {returnItem.product_id.slice(0, 8)}...
                            </div>
                            <p className="text-xs sm:text-sm text-muted-foreground mb-2">
                              {returnItem.return_reason === 'defective' && 'Défectueux'}
                              {returnItem.return_reason === 'wrong_item' && 'Mauvais article'}
                              {returnItem.return_reason === 'not_as_described' &&
                                'Ne correspond pas'}
                              {returnItem.return_reason === 'damaged' && 'Endommagé'}
                              {returnItem.return_reason === 'size_fit' && 'Taille/ajustement'}
                              {returnItem.return_reason === 'quality' && 'Qualité'}
                              {returnItem.return_reason === 'duplicate' && 'Dupliqué'}
                              {returnItem.return_reason === 'changed_mind' && "Changement d'avis"}
                              {returnItem.return_reason === 'other' && 'Autre'}
                            </p>
                          </div>
                          <div className="flex-shrink-0">{getStatusBadge(returnItem.status)}</div>
                        </div>
                        <div className="flex items-center justify-between pt-2 border-t border-border/50">
                          <div>
                            <p className="text-xs text-muted-foreground mb-1">Montant</p>
                            <p className="font-semibold text-base sm:text-lg">
                              {formatCurrency(returnItem.refund_amount || returnItem.total_amount)}
                            </p>
                          </div>
                          <div className="flex flex-col items-end gap-2">
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Calendar className="h-3.5 w-3.5" />
                              {format(new Date(returnItem.requested_at), 'dd/MM/yyyy', {
                                locale: fr,
                              })}
                            </div>
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="min-h-[44px] touch-manipulation text-xs sm:text-sm"
                                >
                                  <Eye className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
                                  Voir
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                                <DialogHeader>
                                  <DialogTitle>Détails du Retour</DialogTitle>
                                  <DialogDescription>{returnItem.return_number}</DialogDescription>
                                </DialogHeader>
                                <ReturnDetailView returnId={returnItem.id} />
                              </DialogContent>
                            </Dialog>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};






