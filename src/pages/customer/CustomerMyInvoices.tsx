/**
 * Page Mes Factures - Historique des factures client
 * Date: 2 Février 2025
 *
 * Fonctionnalités:
 * - Liste toutes les factures du client
 * - Filtres par statut et date
 * - Recherche
 * - Téléchargement PDF
 * - Vue détaillée facture
 * - Design responsive et moderne (style Inventaire/Mes Cours)
 */

import { SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { supabase } from '@/integrations/supabase/client';
import { useState, useMemo, useEffect, useCallback } from 'react';
import { useInvoices } from '@/hooks/invoice/useInvoice';
import { downloadInvoicePDF } from '@/components/invoice/InvoicePDFGenerator';
import {
  FileText,
  Download,
  Search,
  Eye,
  CheckCircle,
  Clock,
  XCircle,
  AlertCircle,
  Calendar,
  DollarSign,
  Loader2,
  RefreshCw,
  AlertTriangle,
  X,
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';
import { useDebounce } from '@/hooks/useDebounce';
import { logger } from '@/lib/logger';
import type { User } from '@supabase/supabase-js';
import type { Invoice } from '@/types/invoice';

export default function CustomerMyInvoices() {
  const { toast } = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [searchInput, setSearchInput] = useState('');
  const debouncedSearch = useDebounce(searchInput, 300);
  const [activeTab, setActiveTab] = useState<
    'all' | 'paid' | 'sent' | 'draft' | 'overdue' | 'cancelled'
  >('all');
  const [generatingPDF, setGeneratingPDF] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Animations au scroll
  const headerRef = useScrollAnimation<HTMLDivElement>();
  const statsRef = useScrollAnimation<HTMLDivElement>();
  const filtersRef = useScrollAnimation<HTMLDivElement>();
  const invoicesRef = useScrollAnimation<HTMLDivElement>();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();
        if (userError) {
          logger.error('Error fetching user:', userError);
          setError("Erreur lors du chargement de l'utilisateur");
          return;
        }
        setUser(user);
      } catch (err) {
        logger.error('Error in fetchUser:', err);
        setError("Erreur lors du chargement de l'utilisateur");
      }
    };
    fetchUser();
  }, []);

  const { data: invoices, isLoading, error: invoicesError, refetch } = useInvoices(user?.id);

  // Filtrer les factures
  const filteredInvoices = useMemo(() => {
    if (!invoices) return [];

    let filtered = invoices;

    // Filtre par statut
    if (activeTab !== 'all') {
      filtered = filtered.filter(inv => inv.status === activeTab);
    }

    // Recherche
    if (debouncedSearch.trim()) {
      const query = debouncedSearch.toLowerCase();
      filtered = filtered.filter(
        inv =>
          inv.invoice_number.toLowerCase().includes(query) ||
          inv.billing_address?.name?.toLowerCase().includes(query) ||
          inv.store_info?.name?.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [invoices, activeTab, debouncedSearch]);

  // Statistiques
  const stats = useMemo(() => {
    if (!invoices) {
      return { total: 0, paid: 0, pending: 0, totalAmount: 0 };
    }

    return {
      total: invoices.length,
      paid: invoices.filter(inv => inv.status === 'paid').length,
      pending: invoices.filter(inv => ['sent', 'draft'].includes(inv.status)).length,
      totalAmount: invoices.reduce((sum, inv) => sum + inv.total_amount, 0),
    };
  }, [invoices]);

  // Gérer le téléchargement PDF
  const handleDownloadPDF = useCallback(
    async (invoice: Invoice) => {
      try {
        setGeneratingPDF(invoice.id);
        await downloadInvoicePDF(invoice);
        toast({
          title: 'PDF téléchargé',
          description: `Facture ${invoice.invoice_number} téléchargée avec succès`,
        });
        logger.info('Invoice PDF downloaded:', invoice.id);
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
        logger.error('Error downloading invoice PDF:', { error: errorMessage });
        toast({
          title: 'Erreur',
          description: 'Impossible de télécharger le PDF',
          variant: 'destructive',
        });
      } finally {
        setGeneratingPDF(null);
      }
    },
    [toast]
  );

  // Gérer le rafraîchissement
  const handleRefresh = useCallback(async () => {
    try {
      await refetch();
      toast({
        title: 'Rafraîchissement réussi',
        description: 'Les factures ont été mises à jour.',
      });
      logger.info('Invoices refreshed');
    } catch (err) {
      logger.error('Error refreshing invoices:', err);
      toast({
        title: 'Erreur',
        description: 'Impossible de rafraîchir les factures.',
        variant: 'destructive',
      });
    }
  }, [refetch, toast]);

  // Obtenir le badge de statut
  const getStatusBadge = (status: string) => {
    type StatusIcon = React.ComponentType<{ className?: string }>;
    const statusConfig: Record<
      string,
      {
        label: string;
        variant: 'default' | 'secondary' | 'destructive' | 'outline';
        icon: StatusIcon;
      }
    > = {
      paid: { label: 'Payée', variant: 'default', icon: CheckCircle },
      sent: { label: 'Envoyée', variant: 'secondary', icon: Clock },
      draft: { label: 'Brouillon', variant: 'outline', icon: FileText },
      overdue: { label: 'Échue', variant: 'destructive', icon: AlertCircle },
      cancelled: { label: 'Annulée', variant: 'outline', icon: XCircle },
    };

    const config = statusConfig[status] || { label: status, variant: 'outline', icon: FileText };
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  // Formater la devise
  const formatCurrency = (amount: number, currency: string = 'XOF') => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: currency === 'XOF' ? 'XOF' : currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const hasError = invoicesError || error;

  if (isLoading) {
    return (
      <SidebarProvider>
        <div className="flex min-h-screen w-full bg-background">
          <AppSidebar />
          <main className="flex-1 overflow-auto">
            <div className="container mx-auto p-3 sm:p-4 lg:p-6 space-y-4 sm:space-y-6">
              <div className="text-center space-y-4">
                <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary" />
                <p className="text-muted-foreground">Chargement des factures...</p>
              </div>
            </div>
          </main>
        </div>
      </SidebarProvider>
    );
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background">
        <AppSidebar />
        <main className="flex-1 overflow-auto">
          <div className="container mx-auto p-3 sm:p-4 lg:p-6 space-y-4 sm:space-y-6">
            {/* Header avec animation - Style Inventaire et Mes Cours */}
            <div
              ref={headerRef}
              className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 animate-in fade-in slide-in-from-top-4 duration-700"
            >
              <div>
                <h1 className="text-base sm:text-lg md:text-xl lg:text-2xl xl:text-3xl font-bold flex items-center gap-1.5 sm:gap-2 mb-1 sm:mb-2">
                  <div className="p-1.5 sm:p-2 rounded-lg bg-gradient-to-br from-purple-500/10 to-pink-500/5 backdrop-blur-sm border border-purple-500/20 animate-in zoom-in duration-500">
                    <FileText
                      className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 lg:h-8 lg:w-8 text-purple-500 dark:text-purple-400"
                      aria-hidden="true"
                    />
                  </div>
                  <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                    Mes Factures
                  </span>
                </h1>
                <p className="text-[10px] sm:text-xs md:text-sm lg:text-base text-muted-foreground">
                  Consultez et téléchargez toutes vos factures
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
                  {error ||
                    'Une erreur est survenue lors du chargement des factures. Veuillez réessayer.'}
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
                      <p className="text-[9px] sm:text-[10px] md:text-xs lg:text-sm text-muted-foreground mb-0.5 sm:mb-1">
                        Total Factures
                      </p>
                      <p className="text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                        {stats.total}
                      </p>
                    </div>
                    <div className="p-2 sm:p-3 rounded-full bg-gradient-to-br from-purple-500/10 to-pink-500/5">
                      <FileText className="h-5 w-5 sm:h-6 sm:w-6 text-purple-500" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border/50 bg-card/50 backdrop-blur-sm hover:shadow-lg transition-all duration-300 hover:scale-105">
                <CardContent className="p-4 sm:p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[9px] sm:text-[10px] md:text-xs lg:text-sm text-muted-foreground mb-0.5 sm:mb-1">
                        Payées
                      </p>
                      <p className="text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                        {stats.paid}
                      </p>
                    </div>
                    <div className="p-2 sm:p-3 rounded-full bg-gradient-to-br from-green-500/10 to-emerald-500/5">
                      <CheckCircle className="h-5 w-5 sm:h-6 sm:w-6 text-green-500" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border/50 bg-card/50 backdrop-blur-sm hover:shadow-lg transition-all duration-300 hover:scale-105">
                <CardContent className="p-4 sm:p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[9px] sm:text-[10px] md:text-xs lg:text-sm text-muted-foreground mb-0.5 sm:mb-1">
                        En Attente
                      </p>
                      <p className="text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl font-bold bg-gradient-to-r from-yellow-600 to-orange-600 bg-clip-text text-transparent">
                        {stats.pending}
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
                      <p className="text-[9px] sm:text-[10px] md:text-xs lg:text-sm text-muted-foreground mb-0.5 sm:mb-1">
                        Montant Total
                      </p>
                      <p className="text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                        {formatCurrency(stats.totalAmount)}
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
                      placeholder="Rechercher par numéro, nom..."
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
                <TabsList className="w-full overflow-x-auto flex-nowrap justify-start h-auto p-1 bg-muted/50">
                  <TabsTrigger
                    value="all"
                    className="shrink-0 min-h-[44px] data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-pink-600 data-[state=active]:text-white transition-all duration-300 text-xs sm:text-sm py-2 sm:py-2.5"
                  >
                    Tous
                  </TabsTrigger>
                  <TabsTrigger
                    value="paid"
                    className="shrink-0 min-h-[44px] data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-pink-600 data-[state=active]:text-white transition-all duration-300 text-xs sm:text-sm py-2 sm:py-2.5"
                  >
                    <CheckCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
                    Payées
                  </TabsTrigger>
                  <TabsTrigger
                    value="sent"
                    className="shrink-0 min-h-[44px] data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-pink-600 data-[state=active]:text-white transition-all duration-300 text-xs sm:text-sm py-2 sm:py-2.5"
                  >
                    <Clock className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
                    Envoyées
                  </TabsTrigger>
                  <TabsTrigger
                    value="draft"
                    className="shrink-0 min-h-[44px] data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-pink-600 data-[state=active]:text-white transition-all duration-300 text-xs sm:text-sm py-2 sm:py-2.5"
                  >
                    <FileText className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
                    Brouillons
                  </TabsTrigger>
                  <TabsTrigger
                    value="overdue"
                    className="shrink-0 min-h-[44px] data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-pink-600 data-[state=active]:text-white transition-all duration-300 text-xs sm:text-sm py-2 sm:py-2.5"
                  >
                    <AlertCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
                    Échues
                  </TabsTrigger>
                  <TabsTrigger
                    value="cancelled"
                    className="shrink-0 min-h-[44px] data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-pink-600 data-[state=active]:text-white transition-all duration-300 text-xs sm:text-sm py-2 sm:py-2.5"
                  >
                    <XCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
                    Annulées
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            {/* Liste des factures */}
            <div
              ref={invoicesRef}
              className="animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300"
            >
              {!isLoading && filteredInvoices.length === 0 ? (
                <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
                  <CardContent className="p-8 sm:p-12 text-center">
                    <FileText className="h-12 w-12 sm:h-16 sm:w-16 text-muted-foreground mx-auto mb-4 animate-in zoom-in duration-500" />
                    <h3 className="text-lg sm:text-xl font-semibold mb-2">Aucune facture</h3>
                    <p className="text-sm sm:text-base text-muted-foreground mb-4">
                      {searchInput || activeTab !== 'all'
                        ? 'Aucune facture ne correspond à vos critères de recherche.'
                        : "Vous n'avez pas encore de factures."}
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
                    <CardTitle className="text-base sm:text-lg">Historique des Factures</CardTitle>
                    <CardDescription className="text-xs sm:text-sm">
                      {filteredInvoices.length} facture{filteredInvoices.length > 1 ? 's' : ''}{' '}
                      trouvée{filteredInvoices.length > 1 ? 's' : ''}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {/* Tableau sur desktop, cartes sur mobile */}
                    <div className="hidden md:block">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="text-xs sm:text-sm">Numéro</TableHead>
                            <TableHead className="text-xs sm:text-sm">Date</TableHead>
                            <TableHead className="text-xs sm:text-sm">Boutique</TableHead>
                            <TableHead className="text-xs sm:text-sm">Montant</TableHead>
                            <TableHead className="text-xs sm:text-sm">Statut</TableHead>
                            <TableHead className="text-right text-xs sm:text-sm">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredInvoices.map(invoice => (
                            <TableRow
                              key={invoice.id}
                              className="hover:bg-muted/50 transition-colors"
                            >
                              <TableCell className="font-medium text-xs sm:text-sm">
                                {invoice.invoice_number}
                              </TableCell>
                              <TableCell className="text-xs sm:text-sm">
                                <div className="flex items-center gap-1">
                                  <Calendar className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground" />
                                  {format(new Date(invoice.invoice_date), 'dd/MM/yyyy', {
                                    locale: fr,
                                  })}
                                </div>
                              </TableCell>
                              <TableCell className="text-xs sm:text-sm">
                                {invoice.store_info?.name || 'Boutique'}
                              </TableCell>
                              <TableCell className="font-semibold text-xs sm:text-sm">
                                {formatCurrency(invoice.total_amount, invoice.currency)}
                              </TableCell>
                              <TableCell>{getStatusBadge(invoice.status)}</TableCell>
                              <TableCell className="text-right">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleDownloadPDF(invoice)}
                                  disabled={generatingPDF === invoice.id}
                                  className="min-h-[36px] text-xs sm:text-sm"
                                >
                                  {generatingPDF === invoice.id ? (
                                    <>
                                      <Loader2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2 animate-spin" />
                                      Génération...
                                    </>
                                  ) : (
                                    <>
                                      <Download className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
                                      PDF
                                    </>
                                  )}
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>

                    {/* Cartes sur mobile */}
                    <div className="md:hidden space-y-3 sm:space-y-4">
                      {filteredInvoices.map(invoice => (
                        <Card
                          key={invoice.id}
                          className="border-border/50 bg-card/50 backdrop-blur-sm hover:shadow-lg transition-all duration-300"
                        >
                          <CardContent className="p-4 sm:p-5">
                            <div className="space-y-3 sm:space-y-4">
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex-1 min-w-0">
                                  <h3 className="font-semibold text-sm sm:text-base mb-1 break-words">
                                    {invoice.invoice_number}
                                  </h3>
                                  <div className="flex items-center gap-1 text-xs sm:text-sm text-muted-foreground mb-2">
                                    <Calendar className="h-3.5 w-3.5" />
                                    {format(new Date(invoice.invoice_date), 'dd/MM/yyyy', {
                                      locale: fr,
                                    })}
                                  </div>
                                  <p className="text-xs sm:text-sm text-muted-foreground mb-2">
                                    {invoice.store_info?.name || 'Boutique'}
                                  </p>
                                </div>
                                <div className="flex-shrink-0">
                                  {getStatusBadge(invoice.status)}
                                </div>
                              </div>
                              <div className="flex items-center justify-between pt-2 border-t border-border/50">
                                <div>
                                  <p className="text-xs text-muted-foreground mb-1">Montant</p>
                                  <p className="font-semibold text-base sm:text-lg">
                                    {formatCurrency(invoice.total_amount, invoice.currency)}
                                  </p>
                                </div>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleDownloadPDF(invoice)}
                                  disabled={generatingPDF === invoice.id}
                                  className="min-h-[44px] touch-manipulation text-xs sm:text-sm"
                                >
                                  {generatingPDF === invoice.id ? (
                                    <>
                                      <Loader2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2 animate-spin" />
                                      <span className="hidden sm:inline">Génération...</span>
                                      <span className="sm:hidden">...</span>
                                    </>
                                  ) : (
                                    <>
                                      <Download className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
                                      <span className="hidden sm:inline">PDF</span>
                                      <span className="sm:hidden">PDF</span>
                                    </>
                                  )}
                                </Button>
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
        </main>
      </div>
    </SidebarProvider>
  );
}
