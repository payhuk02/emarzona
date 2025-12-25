/**
 * Page My Downloads - Mes Téléchargements (Customer Portal)
 * Date: 26 Janvier 2025
 *
 * Fonctionnalités:
 * - Liste tous téléchargements produits digitaux
 * - Statistiques téléchargements
 * - Filtres par statut (réussi/échoué)
 * - Recherche par produit
 * - Bouton re-télécharger
 * - Historique complet
 *
 * Style inspiré de la page Inventaire avec design responsive et animations
 */

import { useState, useEffect, useMemo, useCallback } from 'react';
import { SidebarProvider, useSidebar } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import type { User } from '@supabase/supabase-js';
import {
  Download,
  Search,
  CheckCircle2,
  XCircle,
  Calendar,
  Clock,
  Package,
  RefreshCw,
  Menu,
  Loader2,
  AlertCircle,
  X,
} from 'lucide-react';
import { useUserDownloads, type DigitalDownload } from '@/hooks/digital/useDownloads';
import { DigitalDownloadButton } from '@/components/digital';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';
import { useDebounce } from '@/hooks/useDebounce';
import { useToast } from '@/hooks/use-toast';
import { logger } from '@/lib/logger';

// Composant interne pour utiliser useSidebar
function MobileHeader() {
  const { toggleSidebar } = useSidebar();

  return (
    <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 shadow-sm lg:hidden">
      <div className="flex h-14 sm:h-16 items-center gap-2 sm:gap-3 px-3 sm:px-4">
        <button
          onClick={toggleSidebar}
          className="touch-manipulation h-10 w-10 sm:h-11 sm:w-11 min-h-[44px] min-w-[44px] p-0 flex items-center justify-center rounded-md hover:bg-accent active:bg-accent/80 transition-colors"
          aria-label="Ouvrir le menu"
          type="button"
        >
          <Menu className="h-6 w-6 sm:h-7 sm:w-7" aria-hidden="true" />
        </button>

        <div className="flex-1 min-w-0 flex items-center gap-2">
          <Download
            className="h-5 w-5 sm:h-6 sm:w-6 text-primary flex-shrink-0"
            aria-hidden="true"
          />
          <h1 className="text-sm sm:text-base font-bold truncate">Mes Téléchargements</h1>
        </div>
      </div>
    </header>
  );
}

export default function MyDownloads() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [searchInput, setSearchInput] = useState('');
  const debouncedSearch = useDebounce(searchInput, 300);
  const [statusFilter, setStatusFilter] = useState<'all' | 'success' | 'failed'>('all');

  // Animations au scroll
  const headerRef = useScrollAnimation<HTMLDivElement>();
  const statsRef = useScrollAnimation<HTMLDivElement>();
  const filtersRef = useScrollAnimation<HTMLDivElement>();
  const listRef = useScrollAnimation<HTMLDivElement>();

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
    });
  }, []);

  // Fetch downloads using existing hook
  const { data: downloads, isLoading, refetch } = useUserDownloads();

  // Filter downloads with useMemo
  const filteredDownloads = useMemo(() => {
    if (!downloads) return [];

    return downloads.filter((d: DigitalDownload) => {
      const productName = d.digital_product?.product?.name || '';
      const matchesSearch = productName.toLowerCase().includes(debouncedSearch.toLowerCase());
      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'success' && d.download_success) ||
        (statusFilter === 'failed' && !d.download_success);

      return matchesSearch && matchesStatus;
    });
  }, [downloads, debouncedSearch, statusFilter]);

  // Calculate stats with useMemo
  const stats = useMemo(() => {
    return {
      total: downloads?.length || 0,
      successful: downloads?.filter((d: DigitalDownload) => d.download_success).length || 0,
      failed: downloads?.filter((d: DigitalDownload) => !d.download_success).length || 0,
      uniqueProducts:
        new Set(downloads?.map((d: DigitalDownload) => d.digital_product_id)).size || 0,
    };
  }, [downloads]);

  // Handle refresh
  const handleRefresh = useCallback(() => {
    refetch();
    logger.info('Downloads refreshed');
    toast({
      title: '✅ Actualisé',
      description: 'Les téléchargements ont été actualisés.',
    });
  }, [refetch, toast]);

  if (isLoading) {
    return (
      <SidebarProvider>
        <div className="flex min-h-screen w-full bg-background">
          <AppSidebar />
          <main className="flex-1 overflow-auto">
            <div className="container mx-auto p-3 sm:p-4 lg:p-6 space-y-4 sm:space-y-6">
              <div className="flex items-center justify-center h-[60vh]">
                <div className="text-center space-y-4">
                  <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary" />
                  <p className="text-muted-foreground">Chargement des téléchargements...</p>
                </div>
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
            {/* Header avec animation - Style Inventory */}
            <div
              ref={headerRef}
              className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 animate-in fade-in slide-in-from-top-4 duration-700"
            >
              <div>
                <h1 className="text-lg sm:text-2xl md:text-3xl lg:text-4xl font-bold flex items-center gap-1.5 sm:gap-2 mb-1 sm:mb-2">
                  <div className="p-1.5 sm:p-2 rounded-lg bg-gradient-to-br from-purple-500/10 to-pink-500/5 backdrop-blur-sm border border-purple-500/20 animate-in zoom-in duration-500">
                    <Download
                      className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 lg:h-8 lg:w-8 text-purple-500 dark:text-purple-400"
                      aria-hidden="true"
                    />
                  </div>
                  <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                    Mes Téléchargements
                  </span>
                </h1>
                <p className="text-[10px] sm:text-xs md:text-sm lg:text-base text-muted-foreground">
                  Accédez à tous vos produits digitaux achetés
                </p>
              </div>
              <Button
                onClick={handleRefresh}
                size="sm"
                className="h-9 sm:h-10 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
              >
                <RefreshCw className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
                <span className="hidden sm:inline text-xs sm:text-sm">Rafraîchir</span>
              </Button>
            </div>

            {/* Stats Cards - Style Inventory (Purple-Pink Gradient) */}
            <div
              ref={statsRef}
              className="grid gap-3 sm:gap-4 grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 animate-in fade-in slide-in-from-bottom-4 duration-700"
            >
              {[
                {
                  label: 'Total Téléchargements',
                  value: stats.total,
                  icon: Download,
                  color: 'from-purple-600 to-pink-600',
                  subtitle: 'Depuis le début',
                },
                {
                  label: 'Réussis',
                  value: stats.successful,
                  icon: CheckCircle2,
                  color: 'from-green-600 to-emerald-600',
                  subtitle: `${stats.total > 0 ? Math.round((stats.successful / stats.total) * 100) : 0}% de succès`,
                },
                {
                  label: 'Échoués',
                  value: stats.failed,
                  icon: XCircle,
                  color: 'from-red-600 to-rose-600',
                  subtitle: 'À réessayer',
                },
                {
                  label: 'Produits Uniques',
                  value: stats.uniqueProducts,
                  icon: Package,
                  color: 'from-blue-600 to-cyan-600',
                  subtitle: 'Produits différents',
                },
              ].map((stat, index) => {
                const Icon = stat.icon;
                return (
                  <Card
                    key={stat.label}
                    className="border-border/50 bg-card/50 backdrop-blur-sm hover:shadow-lg transition-all duration-300 hover:scale-[1.02] animate-in fade-in slide-in-from-bottom-4"
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <CardHeader className="pb-2 sm:pb-3 p-3 sm:p-4">
                      <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground flex items-center gap-1.5 sm:gap-2">
                        <Icon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                        {stat.label}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-3 sm:p-4 pt-0">
                      <div
                        className={`text-base sm:text-xl md:text-2xl lg:text-3xl font-bold bg-gradient-to-r ${stat.color} bg-clip-text text-transparent`}
                      >
                        {stat.value}
                      </div>
                      {stat.subtitle && (
                        <p className="text-[10px] xs:text-xs text-muted-foreground mt-1">
                          {stat.subtitle}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* Search & Filters - Style Inventory */}
            <Card
              ref={filtersRef}
              className="border-border/50 bg-card/50 backdrop-blur-sm animate-in fade-in slide-in-from-bottom-4 duration-700"
            >
              <CardContent className="p-3 sm:p-4">
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
                  {/* Search */}
                  <div className="flex-1 relative">
                    <Search className="absolute left-2.5 sm:left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 sm:w-4 sm:h-4 text-muted-foreground" />
                    <Input
                      placeholder="Rechercher un produit..."
                      value={searchInput}
                      onChange={e => setSearchInput(e.target.value)}
                      className="pl-8 sm:pl-10 pr-12 min-h-[44px] h-11 sm:h-12 text-xs sm:text-sm"
                      aria-label="Rechercher"
                    />
                    {searchInput && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="absolute right-1 top-1/2 -translate-y-1/2 min-h-[44px] min-w-[44px] h-11 w-11"
                        onClick={() => setSearchInput('')}
                        aria-label="Effacer la recherche"
                      >
                        <XCircle className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>

                  {/* Status Filter */}
                  <Tabs
                    value={statusFilter}
                    onValueChange={v => setStatusFilter(v as 'all' | 'success' | 'failed')}
                  >
                    <TabsList className="w-full sm:w-auto overflow-x-auto flex-nowrap justify-start h-auto p-1 bg-muted/50 backdrop-blur-sm">
                      <TabsTrigger
                        value="all"
                        className="shrink-0 text-xs sm:text-sm px-2 sm:px-4 py-1.5 sm:py-2 min-h-[44px] data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-pink-600 data-[state=active]:text-white transition-all duration-300"
                      >
                        Tous
                      </TabsTrigger>
                      <TabsTrigger
                        value="success"
                        className="shrink-0 text-xs sm:text-sm px-2 sm:px-4 py-1.5 sm:py-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-600 data-[state=active]:to-emerald-600 data-[state=active]:text-white transition-all duration-300"
                      >
                        Réussis
                      </TabsTrigger>
                      <TabsTrigger
                        value="failed"
                        className="shrink-0 text-xs sm:text-sm px-2 sm:px-4 py-1.5 sm:py-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-red-600 data-[state=active]:to-rose-600 data-[state=active]:text-white transition-all duration-300"
                      >
                        Échoués
                      </TabsTrigger>
                    </TabsList>
                  </Tabs>
                </div>
              </CardContent>
            </Card>

            {/* Downloads List */}
            <Card
              ref={listRef}
              className="border-border/50 bg-card/50 backdrop-blur-sm animate-in fade-in slide-in-from-bottom-4 duration-500 delay-150"
            >
              <CardHeader>
                <CardTitle className="text-sm sm:text-base md:text-lg lg:text-xl">
                  {filteredDownloads?.length || 0}{' '}
                  {filteredDownloads?.length === 1 ? 'téléchargement' : 'téléchargements'}
                </CardTitle>
                <CardDescription className="text-sm sm:text-base">
                  Liste de tous vos téléchargements de produits digitaux
                </CardDescription>
              </CardHeader>
              <CardContent>
                {!filteredDownloads || filteredDownloads.length === 0 ? (
                  <div className="text-center py-8 sm:py-12">
                    <Download className="h-12 w-12 sm:h-16 sm:w-16 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-base sm:text-lg font-semibold mb-2">
                      Aucun téléchargement
                    </h3>
                    <p className="text-sm sm:text-base text-muted-foreground mb-4 px-4">
                      {debouncedSearch || statusFilter !== 'all'
                        ? 'Aucun téléchargement ne correspond à vos critères'
                        : "Vous n'avez pas encore téléchargé de produits digitaux"}
                    </p>
                    {!debouncedSearch && statusFilter === 'all' && (
                      <Button
                        onClick={() => navigate('/marketplace')}
                        className="min-h-[44px] touch-manipulation bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                      >
                        Découvrir les produits digitaux
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="space-y-3 sm:space-y-4">
                    {filteredDownloads.map((download: DigitalDownload) => (
                      <Card
                        key={download.id}
                        className="border-border/50 bg-card/50 backdrop-blur-sm hover:shadow-lg transition-all duration-300 hover:scale-[1.01]"
                      >
                        <CardContent className="p-3 sm:p-4 md:p-6">
                          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
                            {/* Product Info */}
                            <div className="flex items-start gap-3 sm:gap-4 flex-1 min-w-0 w-full sm:w-auto">
                              {download.digital_product?.product?.image_url && (
                                <img
                                  src={download.digital_product.product.image_url}
                                  alt={download.digital_product?.product?.name || 'Produit'}
                                  className="w-16 h-16 sm:w-20 sm:h-20 rounded-lg object-cover flex-shrink-0 border border-border/50"
                                />
                              )}

                              <div className="flex-1 min-w-0">
                                <h3 className="font-semibold text-sm sm:text-base md:text-lg mb-2 break-words">
                                  {download.digital_product?.product?.name || 'Produit inconnu'}
                                </h3>

                                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3 flex-wrap">
                                  <Badge
                                    variant={download.download_success ? 'default' : 'destructive'}
                                    className="text-xs"
                                  >
                                    {download.download_success ? (
                                      <>
                                        <CheckCircle2 className="h-3 w-3 mr-1" />
                                        Réussi
                                      </>
                                    ) : (
                                      <>
                                        <XCircle className="h-3 w-3 mr-1" />
                                        Échoué
                                      </>
                                    )}
                                  </Badge>

                                  <span className="text-xs sm:text-sm text-muted-foreground flex items-center gap-1">
                                    <Calendar className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                                    {new Date(download.download_date).toLocaleDateString('fr-FR', {
                                      year: 'numeric',
                                      month: 'long',
                                      day: 'numeric',
                                      hour: '2-digit',
                                      minute: '2-digit',
                                    })}
                                  </span>

                                  {download.download_duration_seconds && (
                                    <span className="text-xs sm:text-sm text-muted-foreground flex items-center gap-1">
                                      <Clock className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                                      {download.download_duration_seconds}s
                                    </span>
                                  )}

                                  {download.file_version && (
                                    <Badge variant="outline" className="text-xs">
                                      Version {download.file_version}
                                    </Badge>
                                  )}
                                </div>

                                {download.error_message && (
                                  <Alert variant="destructive" className="mt-2">
                                    <AlertCircle className="h-4 w-4" />
                                    <AlertDescription className="text-xs sm:text-sm">
                                      {download.error_message}
                                    </AlertDescription>
                                  </Alert>
                                )}
                              </div>
                            </div>

                            {/* Action Button */}
                            <div className="flex-shrink-0 w-full sm:w-auto">
                              {download.digital_product_id && (
                                <DigitalDownloadButton
                                  digitalProductId={download.digital_product_id}
                                  fileId={download.file_id}
                                  fileName={download.digital_product?.product?.name || 'Fichier'}
                                  fileSize={0}
                                  variant="default"
                                  size="sm"
                                  showRemainingDownloads={false}
                                  className="w-full sm:w-auto min-h-[44px] touch-manipulation bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                                />
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}
