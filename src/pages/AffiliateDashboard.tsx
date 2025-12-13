/**
 * Page: AffiliateDashboard
 * Description: Dashboard principal pour les affiliés
 * Date: 25/10/2025
 */

import { useState, useEffect, useMemo, useCallback, lazy, Suspense, memo } from 'react';
import { SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { useCurrentAffiliate, useAffiliates } from '@/hooks/useAffiliates';
import { useAffiliateLinks, type AffiliateLink } from '@/hooks/useAffiliateLinks';
import { CreateAffiliateLinkDialog } from '@/components/affiliate/CreateAffiliateLinkDialog';
import { useAffiliateCommissions, type AffiliateCommission } from '@/hooks/useAffiliateCommissions';
import { useAffiliateBalance, useAffiliateWithdrawals } from '@/hooks/useAffiliateWithdrawals';
import { PaginationControls } from '@/components/affiliate/PaginationControls';
import { 
  TrendingUp, 
  DollarSign, 
  MousePointerClick,
  ShoppingCart,
  Link as LinkIcon,
  Plus,
  Copy,
  ExternalLink,
  Wallet,
  CheckCircle2,
  Clock,
  UserPlus,
  BarChart3,
  AlertCircle,
  Loader2
} from '@/components/icons';
import { Skeleton } from '@/components/ui/skeleton';
import { formatCurrency } from '@/lib/utils';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';
import { useToast } from '@/hooks/use-toast';
import { RegistrationDialog } from '@/components/affiliate/RegistrationDialog';
import { ShortLinkManager } from '@/components/affiliate/ShortLinkManager';
import { AffiliatePerformanceCharts } from '@/components/affiliate/AffiliatePerformanceCharts';
import { useAffiliateDailyStatsSeparated } from '@/hooks/useAffiliateDailyStats';
import { 
  exportCommissionsToCSV, 
  exportLinksToCSV 
} from '@/lib/affiliate-export';
import { Download } from 'lucide-react';

// Composant mémorisé pour les liens d'affiliation
const AffiliateLinkCard = memo(({ link, index }: { link: AffiliateLink, index: number }) => {
  const handleCopy = useCallback(async () => {
    await navigator.clipboard.writeText(link.full_url);
  }, [link.full_url]);
  
  const handleOpen = useCallback(() => {
    window.open(link.full_url, '_blank');
  }, [link.full_url]);
  
  return (
    <Card 
      className="overflow-hidden border-border/50 bg-card/50 backdrop-blur-sm hover:shadow-lg transition-all duration-300 animate-in fade-in slide-in-from-bottom-4"
      style={{ animationDelay: `${index * 50}ms` }}
    >
      <CardContent className="p-3 sm:p-4">
        <div className="space-y-3 sm:space-y-4">
          {/* Product info */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
            <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
              {link.product?.image_url && (
                <img
                  src={link.product.image_url}
                  alt={link.product.name}
                  className="w-12 h-12 sm:w-16 sm:h-16 object-cover rounded flex-shrink-0"
                  loading="lazy"
                  decoding="async"
                />
              )}
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-sm sm:text-base truncate">{link.product?.name}</h4>
                <p className="text-xs sm:text-sm text-muted-foreground truncate">
                  {link.product?.store?.name}
                </p>
              </div>
            </div>
            <div className="flex gap-2 flex-shrink-0">
              <Button 
                size="sm" 
                variant="outline"
                onClick={handleCopy}
                className="gap-1.5 sm:gap-2 text-xs"
              >
                <Copy className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                <span className="hidden sm:inline">Copier</span>
              </Button>
              <Button 
                size="sm" 
                variant="outline"
                onClick={handleOpen}
                className="gap-1.5 sm:gap-2 text-xs"
              >
                <ExternalLink className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                <span className="hidden sm:inline">Ouvrir</span>
              </Button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 sm:gap-4 pt-3 sm:pt-4 border-t">
            <div>
              <p className="text-xs text-muted-foreground">Clics</p>
              <p className="text-base sm:text-lg font-semibold">{link.total_clicks}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Ventes</p>
              <p className="text-base sm:text-lg font-semibold">{link.total_sales}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">CA généré</p>
              <p className="text-base sm:text-lg font-semibold truncate">{formatCurrency(link.total_revenue)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Commission</p>
              <p className="text-base sm:text-lg font-semibold text-orange-600 truncate">
                {formatCurrency(link.total_commission)}
              </p>
            </div>
            <div className="col-span-2 sm:col-span-1">
              <p className="text-xs text-muted-foreground">Conversion</p>
              <Badge variant={parseFloat(link.conversionRate) > 2 ? 'default' : 'outline'} className="text-xs">
                {link.conversionRate}%
              </Badge>
            </div>
          </div>

          {/* Short Links Manager */}
          <div className="pt-3 sm:pt-4 border-t">
            <ShortLinkManager 
              affiliateLinkId={link.id} 
              fullUrl={link.full_url}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
});

AffiliateLinkCard.displayName = 'AffiliateLinkCard';

// Composant mémorisé pour la liste des liens
const AffiliateLinksList = memo(({ links }: { links: AffiliateLink[] }) => {
  return (
    <div className="space-y-3 sm:space-y-4">
      {links.map((link, index) => (
        <AffiliateLinkCard key={link.id} link={link} index={index} />
      ))}
    </div>
  );
}, (prevProps, nextProps) => {
  // Comparaison optimisée pour éviter les re-renders inutiles
  return prevProps.links.length === nextProps.links.length &&
    prevProps.links.every((link, index) => 
      link.id === nextProps.links[index]?.id &&
      link.total_clicks === nextProps.links[index]?.total_clicks &&
      link.total_sales === nextProps.links[index]?.total_sales
    );
});

AffiliateLinksList.displayName = 'AffiliateLinksList';

// Composant mémorisé pour les lignes de commission
const CommissionRow = memo(({ commission }: { commission: AffiliateCommission }) => {
  return (
    <TableRow key={commission.id}>
      <TableCell className="text-xs sm:text-sm">
        {new Date(commission.created_at).toLocaleDateString('fr-FR')}
      </TableCell>
      <TableCell className="text-xs sm:text-sm truncate max-w-[150px] sm:max-w-none">
        {commission.product?.name || 'N/A'}
      </TableCell>
      <TableCell className="text-right font-semibold text-xs sm:text-sm">
        {formatCurrency(commission.order_total)}
      </TableCell>
      <TableCell className="text-right font-bold text-orange-600 text-xs sm:text-sm">
        {formatCurrency(commission.commission_amount)}
      </TableCell>
      <TableCell>
        {commission.status === 'pending' && (
          <Badge variant="outline" className="gap-1 text-xs">
            <Clock className="h-3 w-3" />
            <span className="hidden sm:inline">En attente</span>
            <span className="sm:hidden">Att.</span>
          </Badge>
        )}
        {commission.status === 'approved' && (
          <Badge variant="secondary" className="gap-1 text-xs">
            <CheckCircle2 className="h-3 w-3" />
            <span className="hidden sm:inline">Approuvé</span>
            <span className="sm:hidden">App.</span>
          </Badge>
        )}
        {commission.status === 'paid' && (
          <Badge className="gap-1 text-xs">
            <CheckCircle2 className="h-3 w-3" />
            <span className="hidden sm:inline">Payé</span>
            <span className="sm:hidden">Payé</span>
          </Badge>
        )}
      </TableCell>
    </TableRow>
  );
}, (prevProps, nextProps) => {
  return prevProps.commission.id === nextProps.commission.id &&
    prevProps.commission.status === nextProps.commission.status;
});

CommissionRow.displayName = 'CommissionRow';

const AffiliateDashboard = () => {
  const { affiliate, loading: affiliateLoading, isAffiliate, refetch: refetchAffiliate } = useCurrentAffiliate();
  
  // États de pagination pour les liens - optimisés (utilisés uniquement pour l'initialisation)
  const [linksPageSize, setLinksPageSize] = useState(20);
  const [linksPage, setLinksPage] = useState(1);
  
  // États de pagination pour les commissions - optimisés (utilisés uniquement pour l'initialisation)
  const [commissionsPageSize, setCommissionsPageSize] = useState(20);
  const [commissionsPage, setCommissionsPage] = useState(1);
  
  const { 
    links, 
    loading: linksLoading,
    pagination: linksPagination,
    goToPage: goToLinksPage,
    nextPage: nextLinksPage,
    previousPage: previousLinksPage,
    setPageSize: setLinksPageSizeFromHook
  } = useAffiliateLinks(
    affiliate?.id, 
    undefined,
    { page: linksPage, pageSize: linksPageSize }
  );
  
  const { 
    commissions, 
    stats, 
    loading: commissionsLoading,
    pagination: commissionsPagination,
    goToPage: goToCommissionsPage,
    nextPage: nextCommissionsPage,
    previousPage: previousCommissionsPage,
    setPageSize: setCommissionsPageSizeFromHook
  } = useAffiliateCommissions(
    { affiliate_id: affiliate?.id },
    { page: commissionsPage, pageSize: commissionsPageSize }
  );
  
  // Synchroniser les pages uniquement quand elles changent dans le hook (évite les re-renders inutiles)
  // Utilisation d'une condition stricte pour éviter les boucles infinies
  useEffect(() => {
    if (linksPagination?.page !== undefined && linksPagination.page !== linksPage) {
      setLinksPage(linksPagination.page);
    }
  }, [linksPagination?.page]); // eslint-disable-line react-hooks/exhaustive-deps
  
  useEffect(() => {
    if (commissionsPagination?.page !== undefined && commissionsPagination.page !== commissionsPage) {
      setCommissionsPage(commissionsPagination.page);
    }
  }, [commissionsPagination?.page]); // eslint-disable-line react-hooks/exhaustive-deps
  
  // Memoization des calculs pour améliorer les performances
  const pendingCommissions = useMemo(
    () => commissions.filter(c => c.status === 'pending'),
    [commissions]
  );
  
  const linksWithConversionRates = useMemo(
    () => links.map(link => ({
      ...link,
      conversionRate: link.total_clicks > 0 
        ? ((link.total_sales / link.total_clicks) * 100).toFixed(1) 
        : '0'
    })),
    [links]
  );
  
  // Charger les données critiques en priorité
  const { balance, loading: balanceLoading } = useAffiliateBalance(affiliate?.id);
  const { withdrawals, loading: withdrawalsLoading } = useAffiliateWithdrawals({ 
    affiliate_id: affiliate?.id 
  });
  const { registerAffiliate } = useAffiliates();
  const { toast } = useToast();

  const [showRegisterDialog, setShowRegisterDialog] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [showCreateLinkDialog, setShowCreateLinkDialog] = useState(false);
  const [chartPeriod, setChartPeriod] = useState<'7d' | '30d' | '90d' | '1y'>('30d');
  
  // Récupérer les statistiques journalières pour les graphiques
  const daysMap = { '7d': 7, '30d': 30, '90d': 90, '1y': 365 };
  const { clicksData, salesData, commissionsData, loading: dailyStatsLoading } = 
    useAffiliateDailyStatsSeparated(affiliate?.id, daysMap[chartPeriod]);

  const handleRegister = useCallback(async (registrationData: {
    email: string;
    first_name: string;
    last_name: string;
    display_name: string;
  }) => {
    setIsRegistering(true);
    try {
      const result = await registerAffiliate(registrationData);
      if (result) {
        toast({
          title: 'Inscription réussie !',
          description: 'Vous êtes maintenant inscrit au programme d\'affiliation',
        });
        setShowRegisterDialog(false);
        await refetchAffiliate();
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      toast({
        title: 'Erreur d\'inscription',
        description: errorMessage || 'Une erreur est survenue lors de l\'inscription',
        variant: 'destructive',
      });
    } finally {
      setIsRegistering(false);
    }
  }, [registerAffiliate, refetchAffiliate, toast]);

  // Handlers de pagination optimisés avec useCallback
  const handleLinksPageChange = useCallback((page: number) => {
    setLinksPage(page);
    goToLinksPage(page);
  }, [goToLinksPage]);
  
  const handleLinksPageSizeChange = useCallback((size: number) => {
    setLinksPageSize(size);
    setLinksPageSizeFromHook(size);
    setLinksPage(1);
    goToLinksPage(1); // Retour à la première page
  }, [setLinksPageSizeFromHook, goToLinksPage]);
  
  const handleCommissionsPageChange = useCallback((page: number) => {
    setCommissionsPage(page);
    goToCommissionsPage(page);
  }, [goToCommissionsPage]);
  
  const handleCommissionsPageSizeChange = useCallback((size: number) => {
    setCommissionsPageSize(size);
    setCommissionsPageSizeFromHook(size);
    setCommissionsPage(1);
    goToCommissionsPage(1); // Retour à la première page
  }, [setCommissionsPageSizeFromHook, goToCommissionsPage]);


  // Animations au scroll
  const headerRef = useScrollAnimation<HTMLDivElement>();
  const statsRef = useScrollAnimation<HTMLDivElement>();
  const tabsRef = useScrollAnimation<HTMLDivElement>();

  // Loading state
  if (affiliateLoading) {
    return (
      <SidebarProvider>
        <div className="flex h-screen w-full overflow-x-hidden bg-background">
          <AppSidebar />
          <main className="flex-1 overflow-auto">
            <div className="w-full p-3 sm:p-4 lg:p-6 space-y-4 sm:space-y-6">
              <Skeleton className="h-8 sm:h-10 lg:h-12 w-full sm:w-64 mb-4 sm:mb-6" />
              <div className="grid gap-3 sm:gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-5">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-24 sm:h-32" />
                ))}
              </div>
            </div>
          </main>
        </div>
      </SidebarProvider>
    );
  }

  // Not registered state
  if (!isAffiliate) {
    return (
      <SidebarProvider>
        <div className="flex h-screen w-full overflow-x-hidden bg-background">
          <AppSidebar />
          <main className="flex-1 overflow-auto">
            <div className="w-full p-3 sm:p-4 lg:p-6 space-y-4 sm:space-y-6">
              <Card className="w-full border-2 border-primary/20 bg-card/50 backdrop-blur-sm animate-in fade-in slide-in-from-top-4 duration-700">
                  <CardHeader className="text-center p-4 sm:p-6">
                    <div className="mx-auto w-12 h-12 sm:w-16 sm:h-16 rounded-lg bg-gradient-to-br from-purple-500/10 to-pink-500/5 backdrop-blur-sm border border-purple-500/20 flex items-center justify-center mb-3 sm:mb-4 animate-in zoom-in duration-500">
                      <TrendingUp className="h-6 w-6 sm:h-8 sm:w-8 text-purple-500 dark:text-purple-400" />
                    </div>
                    <CardTitle className="text-lg sm:text-xl md:text-2xl lg:text-3xl bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                      Programme d'affiliation Emarzona
                    </CardTitle>
                    <CardDescription className="text-[10px] sm:text-xs md:text-sm lg:text-base mt-2">
                      Gagnez des commissions en promouvant des produits de qualité
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-4 sm:p-6">
                    <div className="space-y-4 sm:space-y-6">
                      {/* Avantages */}
                      <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-3">
                        <Card className="border-border/50 bg-card/50 backdrop-blur-sm hover:shadow-lg transition-all duration-300 hover:scale-[1.02]">
                          <CardContent className="pt-4 sm:pt-6 text-center p-4 sm:p-6">
                            <DollarSign className="h-8 w-8 sm:h-10 sm:w-10 text-emerald-600 mx-auto mb-2 sm:mb-3" />
                            <h3 className="font-semibold mb-1 sm:mb-2 text-sm sm:text-base">Commissions attractives</h3>
                            <p className="text-xs sm:text-sm text-muted-foreground">
                              Jusqu'à 30% de commission sur chaque vente
                            </p>
                          </CardContent>
                        </Card>
                        <Card className="border-border/50 bg-card/50 backdrop-blur-sm hover:shadow-lg transition-all duration-300 hover:scale-[1.02]">
                          <CardContent className="pt-4 sm:pt-6 text-center p-4 sm:p-6">
                            <BarChart3 className="h-8 w-8 sm:h-10 sm:w-10 text-blue-600 mx-auto mb-2 sm:mb-3" />
                            <h3 className="font-semibold mb-1 sm:mb-2 text-sm sm:text-base">Tracking avancé</h3>
                            <p className="text-xs sm:text-sm text-muted-foreground">
                              Suivez vos clics, conversions et gains en temps réel
                            </p>
                          </CardContent>
                        </Card>
                        <Card className="border-border/50 bg-card/50 backdrop-blur-sm hover:shadow-lg transition-all duration-300 hover:scale-[1.02]">
                          <CardContent className="pt-4 sm:pt-6 text-center p-4 sm:p-6">
                            <Wallet className="h-8 w-8 sm:h-10 sm:w-10 text-orange-600 mx-auto mb-2 sm:mb-3" />
                            <h3 className="font-semibold mb-1 sm:mb-2 text-sm sm:text-base">Paiements rapides</h3>
                            <p className="text-xs sm:text-sm text-muted-foreground">
                              Retraits dès 10 000 XOF via Mobile Money
                            </p>
                          </CardContent>
                        </Card>
                      </div>

                      {/* Comment ça marche */}
                      <div className="space-y-3 sm:space-y-4">
                        <h3 className="text-base sm:text-lg font-semibold">Comment ça marche ?</h3>
                        <div className="space-y-2 sm:space-y-3">
                          {[
                            {
                              step: '1',
                              title: 'Inscription gratuite',
                              description: 'Créez votre compte affilié en quelques clics'
                            },
                            {
                              step: '2',
                              title: 'Choisissez vos produits',
                              description: 'Parcourez les produits et créez vos liens personnalisés'
                            },
                            {
                              step: '3',
                              title: 'Partagez vos liens',
                              description: 'Promouvez sur vos réseaux, blog, YouTube, etc.'
                            },
                            {
                              step: '4',
                              title: 'Gagnez des commissions',
                              description: 'Recevez une commission sur chaque vente générée'
                            }
                          ].map((item, index) => (
                            <div 
                              key={item.step} 
                              className="flex gap-3 sm:gap-4 p-3 sm:p-4 border rounded-lg border-border/50 bg-card/50 backdrop-blur-sm hover:shadow-md transition-all duration-300 animate-in fade-in slide-in-from-left-4"
                              style={{ animationDelay: `${index * 100}ms` }}
                            >
                              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 flex items-center justify-center text-white font-bold flex-shrink-0 text-sm sm:text-base">
                                {item.step}
                              </div>
                              <div className="flex-1 min-w-0">
                                <h4 className="font-semibold text-sm sm:text-base">{item.title}</h4>
                                <p className="text-xs sm:text-sm text-muted-foreground mt-1">{item.description}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* CTA */}
                      <div className="text-center pt-2 sm:pt-4">
                        <RegistrationDialog 
                          open={showRegisterDialog}
                          onOpenChange={setShowRegisterDialog}
                          onRegister={handleRegister}
                          isRegistering={isRegistering}
                        />
                        <p className="text-xs sm:text-sm text-muted-foreground mt-3 sm:mt-4">
                          Aucun frais • Aucun engagement • Commencez immédiatement
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
            </div>
          </main>
        </div>
      </SidebarProvider>
    );
  }

  // Registered - Main Dashboard
  return (
    <SidebarProvider>
      <div className="flex h-screen w-full overflow-x-hidden bg-background">
        <AppSidebar />
        <main className="flex-1 overflow-auto">
          <div className="w-full p-3 sm:p-4 lg:p-6 space-y-4 sm:space-y-6">
            {/* Header - Responsive & Animated */}
            <div 
              ref={headerRef}
              className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 animate-in fade-in slide-in-from-top-4 duration-700"
            >
              <div className="flex-1 min-w-0">
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold flex items-center gap-2 mb-1 sm:mb-2">
                  <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500/10 to-pink-500/5 backdrop-blur-sm border border-purple-500/20 animate-in zoom-in duration-500">
                    <TrendingUp className="h-5 w-5 sm:h-6 sm:w-6 lg:h-8 lg:w-8 text-purple-500 dark:text-purple-400" aria-hidden="true" />
                  </div>
                  <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                    Tableau de bord affilié
                  </span>
                </h1>
                <p className="text-xs sm:text-sm lg:text-base text-muted-foreground truncate">
                  Bienvenue, {affiliate.display_name || affiliate.email} • Code : <Badge variant="outline" className="ml-1 sm:ml-2 text-xs">{affiliate.affiliate_code}</Badge>
                </p>
              </div>
              <Button 
                className="gap-2 w-full sm:w-auto bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
                size="sm"
                onClick={() => setShowCreateLinkDialog(true)}
              >
                <Plus className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">Nouveau lien</span>
                <span className="sm:hidden">Nouveau</span>
              </Button>
            </div>

            {/* Stats Cards - Responsive & Animated */}
            <div 
              ref={statsRef}
              className="grid gap-3 sm:gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 animate-in fade-in slide-in-from-bottom-4 duration-700"
            >
              {[
                { 
                  label: 'Clics totaux', 
                  value: affiliate.total_clicks, 
                  icon: MousePointerClick, 
                  color: 'from-blue-600 to-cyan-600',
                  subtitle: 'Sur tous vos liens'
                },
                { 
                  label: 'Ventes générées', 
                  value: affiliate.total_sales, 
                  icon: ShoppingCart, 
                  color: 'from-emerald-600 to-green-600',
                  subtitle: `${stats?.conversion_rate.toFixed(1) || '0'}% de conversion`
                },
                { 
                  label: 'CA généré', 
                  value: formatCurrency(affiliate.total_revenue), 
                  icon: TrendingUp, 
                  color: 'from-purple-600 to-pink-600',
                  subtitle: 'Chiffre d\'affaires total'
                },
                { 
                  label: 'Gains totaux', 
                  value: formatCurrency(affiliate.total_commission_earned), 
                  icon: DollarSign, 
                  color: 'from-orange-600 to-amber-600',
                  subtitle: 'Commissions gagnées'
                },
                { 
                  label: 'Solde disponible', 
                  value: balanceLoading ? '...' : formatCurrency(balance.available), 
                  icon: Wallet, 
                  color: 'from-purple-600 to-pink-600',
                  subtitle: 'Disponible pour retrait',
                  highlight: true
                }
              ].map((stat, index) => {
                const Icon = stat.icon;
                return (
                  <Card
                    key={stat.label}
                    className={`border-border/50 bg-card/50 backdrop-blur-sm hover:shadow-lg transition-all duration-300 hover:scale-[1.02] animate-in fade-in slide-in-from-bottom-4 ${stat.highlight ? 'border-2 border-purple-500/50' : ''}`}
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <CardHeader className="pb-2 sm:pb-3 p-3 sm:p-4">
                      <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground flex items-center gap-1.5 sm:gap-2">
                        <Icon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                        <span className="truncate">{stat.label}</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-3 sm:p-4 pt-0">
                      <div className={`text-xl sm:text-2xl lg:text-3xl font-bold bg-gradient-to-r ${stat.color} bg-clip-text text-transparent mb-1`}>
                        {stat.value}
                      </div>
                      <p className="text-xs text-muted-foreground truncate">
                        {stat.subtitle}
                      </p>
                      {stat.highlight && !balanceLoading && balance.available >= 10000 && (
                        <Button size="sm" className="w-full mt-2 text-xs" variant="outline">
                          <Wallet className="h-3 w-3 mr-1.5" />
                          Retirer
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* Progression vers le prochain retrait */}
            <Card className="border-border/50 bg-card/50 backdrop-blur-sm animate-in fade-in slide-in-from-bottom-4 duration-500 delay-150">
              <CardHeader className="p-3 sm:p-4">
                <CardTitle className="text-sm sm:text-base">Progression vers le retrait minimum</CardTitle>
              </CardHeader>
              <CardContent className="p-3 sm:p-4 pt-0">
                <div className="space-y-2 sm:space-y-3">
                  <div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-0 text-xs sm:text-sm">
                    <span className="text-muted-foreground">Minimum : 10 000 XOF</span>
                    <span className="font-semibold">
                      {balanceLoading ? '...' : `${formatCurrency(balance.available)} / 10 000 XOF`}
                    </span>
                  </div>
                  <Progress value={balanceLoading ? 0 : Math.min((balance.available / 10000) * 100, 100)} className="h-2" />
                  {!balanceLoading && balance.available >= 10000 && (
                    <Alert className="mt-2 sm:mt-3">
                      <CheckCircle2 className="h-4 w-4" />
                      <AlertTitle className="text-sm">Vous pouvez retirer !</AlertTitle>
                      <AlertDescription className="text-xs sm:text-sm">
                        Vous avez atteint le montant minimum de retrait
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Tabs Content */}
            <div ref={tabsRef}>
              <Tabs defaultValue="links" className="space-y-4 sm:space-y-6">
                <TabsList className="grid w-full grid-cols-4 h-auto p-1 bg-muted/50 backdrop-blur-sm">
                  <TabsTrigger 
                    value="links"
                    className="text-xs sm:text-sm px-2 sm:px-4 py-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-pink-600 data-[state=active]:text-white transition-all duration-300"
                  >
                    <LinkIcon className="mr-1.5 sm:mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    <span className="hidden xs:inline">Mes liens</span>
                    <span className="xs:hidden">Liens</span>
                    <Badge variant="secondary" className="ml-1.5 sm:ml-2 text-xs px-1.5 py-0">
                      {linksPagination?.total || links.length}
                    </Badge>
                  </TabsTrigger>
                  <TabsTrigger 
                    value="commissions"
                    className="text-xs sm:text-sm px-2 sm:px-4 py-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-pink-600 data-[state=active]:text-white transition-all duration-300"
                  >
                    <DollarSign className="mr-1.5 sm:mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    <span className="hidden xs:inline">Commissions</span>
                    <span className="xs:hidden">Com.</span>
                    {pendingCommissions.length > 0 && (
                      <Badge variant="secondary" className="ml-1.5 sm:ml-2 text-xs px-1.5 py-0">
                        {pendingCommissions.length}
                      </Badge>
                    )}
                  </TabsTrigger>
                  <TabsTrigger 
                    value="withdrawals"
                    className="text-xs sm:text-sm px-2 sm:px-4 py-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-pink-600 data-[state=active]:text-white transition-all duration-300"
                  >
                    <Wallet className="mr-1.5 sm:mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    <span className="hidden xs:inline">Retraits</span>
                    <span className="xs:hidden">Ret.</span>
                    <Badge variant="secondary" className="ml-1.5 sm:ml-2 text-xs px-1.5 py-0">
                      {withdrawals.length}
                    </Badge>
                  </TabsTrigger>
                  <TabsTrigger 
                    value="performance"
                    className="text-xs sm:text-sm px-2 sm:px-4 py-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-pink-600 data-[state=active]:text-white transition-all duration-300"
                  >
                    <BarChart3 className="mr-1.5 sm:mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    <span className="hidden xs:inline">Performance</span>
                    <span className="xs:hidden">Stats</span>
                  </TabsTrigger>
                </TabsList>

                {/* Mes liens */}
                <TabsContent value="links" className="space-y-4 sm:space-y-6 mt-4 sm:mt-6">
                  <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
                    <CardHeader className="p-3 sm:p-4">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
                        <div className="flex-1 min-w-0">
                          <CardTitle className="text-base sm:text-lg">Mes liens d'affiliation</CardTitle>
                          <CardDescription className="text-xs sm:text-sm mt-1">
                            Gérez vos liens et suivez leurs performances
                            {linksPagination && linksPagination.total > 0 && (
                              <span className="ml-2">
                                ({linksPagination.total} lien{linksPagination.total > 1 ? 's' : ''})
                              </span>
                            )}
                          </CardDescription>
                        </div>
                        <div className="flex gap-2">
                          {links.length > 0 && (
                            <Button 
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                try {
                                  exportLinksToCSV(linksWithConversionRates);
                                  toast({
                                    title: "Export réussi",
                                    description: `${links.length} lien(s) exporté(s) en CSV`,
                                  });
                                } catch (error: unknown) {
                                  const errorMessage = error instanceof Error ? error.message : String(error);
                                  toast({
                                    title: "Erreur d'export",
                                    description: errorMessage || "Impossible d'exporter les liens",
                                    variant: "destructive",
                                  });
                                }
                              }}
                              className="gap-2"
                            >
                              <Download className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                              <span className="hidden sm:inline">Exporter CSV</span>
                              <span className="sm:hidden">CSV</span>
                            </Button>
                          )}
                          <Button 
                            className="gap-2 w-full sm:w-auto bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
                            size="sm"
                            onClick={() => setShowCreateLinkDialog(true)}
                          >
                            <Plus className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                            <span className="hidden sm:inline">Créer un lien</span>
                            <span className="sm:hidden">Créer</span>
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="p-3 sm:p-4 pt-0">
                  {linksLoading ? (
                    <div className="space-y-3">
                      {[...Array(3)].map((_, i) => (
                        <Skeleton key={i} className="h-20" />
                      ))}
                    </div>
                  ) : links.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <LinkIcon className="h-12 w-12 mx-auto mb-4 opacity-20" />
                      <p>Aucun lien créé</p>
                      <p className="text-sm mt-2">
                        Créez votre premier lien pour commencer à gagner des commissions
                      </p>
                    </div>
                  ) : (
                    <>
                      <AffiliateLinksList links={linksWithConversionRates} />
                      
                      {/* Pagination pour les liens */}
                      {linksPagination && linksPagination.totalPages > 1 && (
                        <div className="mt-4 sm:mt-6 pt-4 border-t">
                          <PaginationControls
                            {...linksPagination}
                            onPageChange={handleLinksPageChange}
                            onPageSizeChange={handleLinksPageSizeChange}
                          />
                        </div>
                      )}
                    </>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

                {/* Commissions */}
                <TabsContent value="commissions" className="space-y-4 sm:space-y-6 mt-4 sm:mt-6">
                  <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
                    <CardHeader className="p-3 sm:p-4">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
                        <div className="flex-1 min-w-0">
                          <CardTitle className="text-base sm:text-lg">Historique des commissions</CardTitle>
                          <CardDescription className="text-xs sm:text-sm">
                            Suivez l'état de vos commissions
                            {commissionsPagination && commissionsPagination.total > 0 && (
                              <span className="ml-2">
                                ({commissionsPagination.total} commission{commissionsPagination.total > 1 ? 's' : ''})
                              </span>
                            )}
                          </CardDescription>
                        </div>
                        {commissions.length > 0 && (
                          <Button 
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              try {
                                exportCommissionsToCSV(commissions);
                                toast({
                                  title: "Export réussi",
                                  description: `${commissions.length} commission(s) exportée(s) en CSV`,
                                });
                              } catch (error: unknown) {
                                const errorMessage = error instanceof Error ? error.message : String(error);
                                toast({
                                  title: "Erreur d'export",
                                  description: errorMessage || "Impossible d'exporter les commissions",
                                  variant: "destructive",
                                });
                              }
                            }}
                            className="gap-2"
                          >
                            <Download className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                            <span className="hidden sm:inline">Exporter CSV</span>
                            <span className="sm:hidden">CSV</span>
                          </Button>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="p-0 sm:p-4">
                      {commissionsLoading ? (
                        <div className="space-y-3 p-3 sm:p-4">
                          {[...Array(5)].map((_, i) => (
                            <Skeleton key={i} className="h-12 sm:h-16" />
                          ))}
                        </div>
                      ) : commissions.length === 0 ? (
                        <div className="text-center py-8 sm:py-12 text-muted-foreground p-3 sm:p-4">
                          <DollarSign className="h-10 w-10 sm:h-12 sm:w-12 mx-auto mb-3 sm:mb-4 opacity-20" />
                          <p className="text-sm sm:text-base">Aucune commission pour le moment</p>
                        </div>
                      ) : (
                        <>
                          <div className="overflow-x-auto">
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead className="text-xs sm:text-sm">Date</TableHead>
                                  <TableHead className="text-xs sm:text-sm">Produit</TableHead>
                                  <TableHead className="text-right text-xs sm:text-sm">Vente</TableHead>
                                  <TableHead className="text-right text-xs sm:text-sm">Commission</TableHead>
                                  <TableHead className="text-xs sm:text-sm">Statut</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {commissions.map((commission) => (
                                  <CommissionRow key={commission.id} commission={commission} />
                                ))}
                              </TableBody>
                            </Table>
                          </div>
                          
                          {/* Pagination pour les commissions */}
                          {commissionsPagination && commissionsPagination.totalPages > 1 && (
                            <div className="mt-4 sm:mt-6 pt-4 border-t px-3 sm:px-4 pb-3 sm:pb-4">
                              <PaginationControls
                                {...commissionsPagination}
                                onPageChange={handleCommissionsPageChange}
                                onPageSizeChange={handleCommissionsPageSizeChange}
                              />
                            </div>
                          )}
                        </>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Retraits */}
                <TabsContent value="withdrawals" className="space-y-4 sm:space-y-6 mt-4 sm:mt-6">
                  <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
                    <CardHeader className="p-3 sm:p-4">
                      <CardTitle className="text-base sm:text-lg">Demandes de retrait</CardTitle>
                      <CardDescription className="text-xs sm:text-sm">
                        Historique de vos retraits
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="p-0 sm:p-4">
                      {withdrawalsLoading ? (
                        <div className="space-y-3 p-3 sm:p-4">
                          {[...Array(3)].map((_, i) => (
                            <Skeleton key={i} className="h-12 sm:h-16" />
                          ))}
                        </div>
                      ) : withdrawals.length === 0 ? (
                        <div className="text-center py-8 sm:py-12 text-muted-foreground p-3 sm:p-4">
                          <Wallet className="h-10 w-10 sm:h-12 sm:w-12 mx-auto mb-3 sm:mb-4 opacity-20" />
                          <p className="text-sm sm:text-base">Aucun retrait demandé</p>
                        </div>
                      ) : (
                        <div className="overflow-x-auto">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead className="text-xs sm:text-sm">Date</TableHead>
                                <TableHead className="text-right text-xs sm:text-sm">Montant</TableHead>
                                <TableHead className="text-xs sm:text-sm">Méthode</TableHead>
                                <TableHead className="text-xs sm:text-sm">Statut</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {withdrawals.map((withdrawal) => (
                                <TableRow key={withdrawal.id}>
                                  <TableCell className="text-xs sm:text-sm">
                                    {new Date(withdrawal.created_at).toLocaleDateString('fr-FR')}
                                  </TableCell>
                                  <TableCell className="text-right font-bold text-xs sm:text-sm">
                                    {formatCurrency(withdrawal.amount)}
                                  </TableCell>
                                  <TableCell className="capitalize text-xs sm:text-sm">
                                    {withdrawal.payment_method.replace('_', ' ')}
                                  </TableCell>
                                  <TableCell>
                                    {withdrawal.status === 'pending' && (
                                      <Badge variant="outline" className="text-xs">
                                        <span className="hidden sm:inline">En attente</span>
                                        <span className="sm:hidden">Att.</span>
                                      </Badge>
                                    )}
                                    {withdrawal.status === 'processing' && (
                                      <Badge variant="secondary" className="text-xs">
                                        <span className="hidden sm:inline">En cours</span>
                                        <span className="sm:hidden">Cours</span>
                                      </Badge>
                                    )}
                                    {withdrawal.status === 'completed' && (
                                      <Badge className="gap-1 text-xs">
                                        <CheckCircle2 className="h-3 w-3" />
                                        <span className="hidden sm:inline">Complété</span>
                                        <span className="sm:hidden">OK</span>
                                      </Badge>
                                    )}
                                    {withdrawal.status === 'failed' && (
                                      <Badge variant="destructive" className="text-xs">
                                        <span className="hidden sm:inline">Échoué</span>
                                        <span className="sm:hidden">Err.</span>
                                      </Badge>
                                    )}
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Performance et Graphiques */}
                <TabsContent value="performance" className="space-y-4 sm:space-y-6 mt-4 sm:mt-6">
                  <AffiliatePerformanceCharts
                    clicksData={clicksData}
                    salesData={salesData}
                    commissionsData={commissionsData}
                    period={chartPeriod}
                    onPeriodChange={setChartPeriod}
                    loading={dailyStatsLoading}
                  />
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </main>
      </div>
      {/* Dialog de création de lien */}
      {affiliate?.id && (
        <CreateAffiliateLinkDialog
          open={showCreateLinkDialog}
          onOpenChange={setShowCreateLinkDialog}
          affiliateId={affiliate.id}
          onSuccess={() => {
            // La liste sera automatiquement rafraîchie par le hook
          }}
        />
      )}
    </SidebarProvider>
  );
};

export default AffiliateDashboard;

