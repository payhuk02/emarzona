import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Info, CheckCircle2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Plus,
  Tag,
  TrendingUp,
  Percent,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Download,
} from 'lucide-react';
import { exportAndDownloadPromotions } from '@/lib/utils/exportPromotions';
import { useStore } from '@/hooks/useStore';
import { usePromotions } from '@/hooks/usePromotions';
import { CreatePromotionDialog } from '@/components/promotions/CreatePromotionDialog';
import { PromotionsTable } from '@/components/promotions/PromotionsTable';
import { PromotionFilters } from '@/components/promotions/PromotionFilters';
import { Skeleton } from '@/components/ui/skeleton';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';
import { useDebounce } from '@/hooks/useDebounce';

// Composant optimisé pour les cartes de statistiques
const StatsCard = React.memo(
  ({
    id,
    label,
    value,
    ariaLabel,
    icon: Icon,
    iconColor,
  }: {
    id: string;
    label: string;
    value: string | number;
    ariaLabel: string;
    icon: React.ComponentType<{ className?: string }>;
    iconColor: string;
  }) => (
    <Card
      className="border-border/50 bg-card/50 backdrop-blur-sm hover:shadow-lg transition-all duration-300 hover:scale-[1.02]"
      role="article"
      aria-labelledby={`${id}-label`}
    >
      <CardContent className="p-3 sm:p-4">
        <div className="flex items-center justify-between">
          <div>
            <p
              id={`${id}-label`}
              className="text-[9px] sm:text-[10px] md:text-xs lg:text-sm text-muted-foreground mb-0.5 sm:mb-1"
            >
              {label}
            </p>
            <p
              className="text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent"
              aria-label={ariaLabel}
            >
              {value}
            </p>
          </div>
          <div className="p-1.5 sm:p-2 rounded-lg bg-gradient-to-br from-purple-500/10 to-pink-500/5">
            <Icon
              className={`h-3.5 w-3.5 sm:h-4 sm:w-4 md:h-5 md:w-5 ${iconColor}`}
              aria-hidden="true"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  )
);

StatsCard.displayName = 'StatsCard';

const Promotions = () => {
  const { t } = useTranslation();
  const { store, loading: storeLoading } = useStore();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [discountTypeFilter, setDiscountTypeFilter] = useState<string>('');
  const [dateFromFilter, setDateFromFilter] = useState<string>('');
  const [dateToFilter, setDateToFilter] = useState<string>('');
  const [page, setPage] = useState(1);
  const limit = 20;

  // Debounce de la recherche pour éviter trop de requêtes
  const debouncedSearch = useDebounce(searchQuery, 300);

  // Utiliser le nouveau hook avec pagination et filtres
  const {
    data: promotionsData,
    isLoading: promotionsLoading,
    refetch,
  } = usePromotions({
    storeId: store?.id,
    activeOnly: statusFilter === 'active',
    page,
    limit,
    search: debouncedSearch || undefined,
  });

  const promotions = promotionsData?.data || [];
  const totalPages = promotionsData?.totalPages || 0;
  const total = promotionsData?.total || 0;

  // Refs for animations
  const headerRef = useScrollAnimation<HTMLDivElement>();

  // Handlers optimisés avec useCallback
  const handleCreateDialogOpen = useCallback(() => {
    setIsCreateDialogOpen(true);
  }, []);

  const handleSearchChange = useCallback((value: string) => {
    setSearchQuery(value);
  }, []);

  const handleStatusChange = useCallback((value: string) => {
    setStatusFilter(value);
  }, []);

  const handlePreviousPage = useCallback(() => {
    setPage(p => Math.max(1, p - 1));
  }, []);

  const handleNextPage = useCallback(() => {
    setPage(p => Math.min(totalPages, p + 1));
  }, [totalPages]);

  const handleExport = useCallback(() => {
    exportAndDownloadPromotions(promotions);
  }, [promotions]);

  // Réinitialiser la page quand la recherche ou le filtre change
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, statusFilter]);

  // Stats calculées (basées sur toutes les promotions, pas seulement la page actuelle)
  const stats = useMemo(() => {
    if (!promotions || promotions.length === 0) {
      return { total: total, active: 0, totalUses: 0, averageDiscount: 0 };
    }

    const active = promotions.filter(p => p.is_active).length;
    const totalUses = promotions.reduce((sum, p) => sum + (p.used_count || 0), 0);
    const totalDiscount = promotions.reduce((sum, p) => {
      if (p.discount_type === 'percentage') {
        return sum + p.discount_value;
      }
      return sum;
    }, 0);
    const averageDiscount = promotions.length > 0 ? totalDiscount / promotions.length : 0;

    return { total, active, totalUses, averageDiscount };
  }, [promotions, total]);

  if (storeLoading) {
    return (
      <SidebarProvider>
        <div className="flex min-h-screen w-full overflow-x-hidden">
          <AppSidebar />
          <main className="flex-1 overflow-auto">
            <div className="container mx-auto p-3 sm:p-4 lg:p-6 space-y-4 sm:space-y-6">
              <Skeleton className="h-8 sm:h-10 w-48 sm:w-64 mb-4 sm:mb-6" />
              <Skeleton className="h-96 w-full" />
            </div>
          </main>
        </div>
      </SidebarProvider>
    );
  }

  if (!store) {
    return (
      <SidebarProvider>
        <div className="flex min-h-screen w-full overflow-x-hidden">
          <AppSidebar />
          <main className="flex-1 overflow-auto">
            <div className="container mx-auto p-3 sm:p-4 lg:p-6">
              <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle>{t('promotions.noStore.title')}</CardTitle>
                  <CardDescription>{t('promotions.noStore.description')}</CardDescription>
                </CardHeader>
              </Card>
            </div>
          </main>
        </div>
      </SidebarProvider>
    );
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full overflow-x-hidden">
        <AppSidebar />
        <main className="flex-1 overflow-auto">
          <div className="container mx-auto p-3 sm:p-4 lg:p-6 space-y-4 sm:space-y-6">
            {/* Annonce pour screen readers - État de chargement */}
            <div className="sr-only" role="status" aria-live="polite" aria-atomic="true">
              {storeLoading ? 'Chargement de la boutique...' : null}
              {promotionsLoading ? 'Chargement des promotions...' : null}
              {!storeLoading && !promotionsLoading ? 'Page chargée' : null}
            </div>

            {/* Header - Responsive & Animated */}
            <div
              ref={headerRef}
              className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 animate-in fade-in slide-in-from-top-4 duration-700"
            >
              <div>
                <h1 className="text-lg sm:text-2xl md:text-3xl lg:text-4xl font-bold flex items-center gap-1.5 sm:gap-2 mb-1 sm:mb-2">
                  <div className="p-1.5 sm:p-2 rounded-lg bg-gradient-to-br from-purple-500/10 to-pink-500/5 backdrop-blur-sm border border-purple-500/20 animate-in zoom-in duration-500">
                    <Tag
                      className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 lg:h-8 lg:w-8 text-purple-500 dark:text-purple-400"
                      aria-hidden="true"
                    />
                  </div>
                  <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                    {t('promotions.title')}
                  </span>
                </h1>
                <p className="text-[10px] sm:text-xs md:text-sm lg:text-base text-muted-foreground">
                  {t('promotions.description')}
                </p>
              </div>
              <Button
                onClick={handleCreateDialogOpen}
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
                size="sm"
                aria-label={t('promotions.createButton', 'Créer une nouvelle promotion')}
              >
                <Plus className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" aria-hidden="true" />
                <span className="hidden sm:inline">{t('promotions.createButton')}</span>
                <span className="sm:hidden">{t('promotions.createButtonShort')}</span>
              </Button>
            </div>

            {/* Info Alert about Unified System */}
            <Alert className="border-blue-200 bg-blue-50/50 dark:bg-blue-950/20">
              <CheckCircle2 className="h-4 w-4 text-blue-600" aria-hidden="true" />
              <AlertTitle className="text-blue-900 dark:text-blue-100">
                Système Unifié de Promotions
              </AlertTitle>
              <AlertDescription className="text-blue-800 dark:text-blue-200">
                Toutes vos promotions sont maintenant gérées dans un système unifié. Vous pouvez
                créer des promotions pour tous les types de produits (physiques, digitaux, services,
                cours) depuis cette interface unique.
              </AlertDescription>
            </Alert>

            {/* Stats Cards - Responsive */}
            {!promotionsLoading && (
              <div
                className="grid gap-3 sm:gap-4 grid-cols-2 sm:grid-cols-4 animate-in fade-in slide-in-from-bottom-4 duration-700"
                role="region"
                aria-label="Statistiques des promotions"
              >
                <StatsCard
                  id="total"
                  label={t('promotions.stats.total')}
                  value={stats.total}
                  ariaLabel={`${stats.total} promotions au total`}
                  icon={Tag}
                  iconColor="text-purple-500"
                />
                <StatsCard
                  id="active"
                  label={t('promotions.stats.active')}
                  value={stats.active}
                  ariaLabel={`${stats.active} promotions actives`}
                  icon={TrendingUp}
                  iconColor="text-blue-500"
                />
                <StatsCard
                  id="uses"
                  label={t('promotions.stats.totalUses')}
                  value={stats.totalUses}
                  ariaLabel={`${stats.totalUses} utilisations totales`}
                  icon={Calendar}
                  iconColor="text-green-500"
                />
                <StatsCard
                  id="discount"
                  label={t('promotions.stats.averageDiscount')}
                  value={`${stats.averageDiscount.toFixed(1)}%`}
                  ariaLabel={`Réduction moyenne de ${stats.averageDiscount.toFixed(1)} pour cent`}
                  icon={Percent}
                  iconColor="text-orange-500"
                />
              </div>
            )}

            {/* Filters */}
            <div
              className="space-y-3"
              role="region"
              aria-label="Filtres et recherche de promotions"
            >
              <PromotionFilters
                searchQuery={searchQuery}
                onSearchChange={handleSearchChange}
                statusFilter={statusFilter}
                onStatusChange={handleStatusChange}
                discountTypeFilter={discountTypeFilter}
                onDiscountTypeChange={setDiscountTypeFilter}
                dateFromFilter={dateFromFilter}
                onDateFromChange={setDateFromFilter}
                dateToFilter={dateToFilter}
                onDateToChange={setDateToFilter}
              />

              {/* Bouton Export */}
              {promotions && promotions.length > 0 && (
                <div className="flex justify-end">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleExport}
                    className="h-9 text-xs sm:text-sm"
                    aria-label={`Exporter ${promotions.length} promotion${promotions.length > 1 ? 's' : ''} au format CSV`}
                  >
                    <Download className="h-4 w-4 mr-2" aria-hidden="true" />
                    Exporter CSV
                  </Button>
                </div>
              )}
            </div>

            {/* Promotions Table */}
            {promotionsLoading ? (
              <Card
                className="border-border/50 bg-card/50 backdrop-blur-sm"
                role="region"
                aria-label="Chargement des promotions"
              >
                <CardContent className="p-4 sm:p-6">
                  <Skeleton className="h-96 w-full" aria-label="Chargement en cours" />
                </CardContent>
              </Card>
            ) : promotions && promotions.length > 0 ? (
              <>
                <div
                  role="region"
                  aria-label={`Liste des promotions - ${promotions.length} élément${promotions.length > 1 ? 's' : ''} affiché${promotions.length > 1 ? 's' : ''}`}
                >
                  <PromotionsTable promotions={promotions} onUpdate={refetch} />
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <Card
                    className="border-border/50 bg-card/50 backdrop-blur-sm"
                    role="navigation"
                    aria-label="Navigation de pagination"
                  >
                    <CardContent className="p-4 flex items-center justify-between">
                      <div className="text-sm text-muted-foreground" aria-live="polite">
                        Page {page} sur {totalPages} ({total} promotion{total > 1 ? 's' : ''})
                      </div>
                      <div className="flex gap-2" role="group" aria-label="Contrôles de pagination">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handlePreviousPage}
                          disabled={page === 1 || promotionsLoading}
                          aria-label="Aller à la page précédente"
                          aria-disabled={page === 1 || promotionsLoading}
                        >
                          <ChevronLeft className="h-4 w-4 mr-1" aria-hidden="true" />
                          Précédent
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleNextPage}
                          disabled={page === totalPages || promotionsLoading}
                          aria-label="Aller à la page suivante"
                          aria-disabled={page === totalPages || promotionsLoading}
                        >
                          Suivant
                          <ChevronRight className="h-4 w-4 ml-1" aria-hidden="true" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </>
            ) : (
              <Card
                className="border-border/50 bg-card/50 backdrop-blur-sm"
                role="region"
                aria-label="État de la liste des promotions"
              >
                <CardContent className="flex flex-col items-center justify-center py-12 sm:py-16 text-center">
                  <div className="p-4 rounded-full bg-gradient-to-br from-purple-500/10 to-pink-500/5 mb-4 animate-in zoom-in duration-500">
                    <Tag
                      className="h-12 w-12 sm:h-16 sm:w-16 text-muted-foreground"
                      aria-hidden="true"
                    />
                  </div>
                  <h3 className="text-lg sm:text-xl font-semibold mb-2" id="empty-state-title">
                    {t('promotions.empty.title')}
                  </h3>
                  <p
                    className="text-sm sm:text-base text-muted-foreground mb-4 sm:mb-6 max-w-md"
                    aria-describedby="empty-state-title"
                  >
                    {debouncedSearch || statusFilter !== 'all'
                      ? t('promotions.empty.noResults')
                      : t('promotions.empty.description')}
                  </p>
                  {!debouncedSearch && statusFilter === 'all' && (
                    <Button
                      onClick={handleCreateDialogOpen}
                      className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
                      aria-describedby="create-promotion-description"
                    >
                      <Plus className="h-4 w-4 mr-2" aria-hidden="true" />
                      {t('promotions.createButton')}
                    </Button>
                  )}
                  <div id="create-promotion-description" className="sr-only">
                    Ouvrir le formulaire de création d'une nouvelle promotion
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Help Section */}
            <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Info className="h-5 w-5 text-blue-500" aria-hidden="true" />
                  Guide d'utilisation
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <h3 className="font-semibold text-sm">Types de réductions</h3>
                    <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                      <li>
                        <strong>Pourcentage:</strong> Réduction en % sur le total
                      </li>
                      <li>
                        <strong>Montant fixe:</strong> Réduction d'un montant précis
                      </li>
                      <li>
                        <strong>Livraison gratuite:</strong> Offre la livraison gratuite
                      </li>
                      <li>
                        <strong>Acheter X obtenir Y:</strong> Promotion conditionnelle
                      </li>
                    </ul>
                  </div>
                  <div className="space-y-2">
                    <h3 className="font-semibold text-sm">Portée de la promotion</h3>
                    <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                      <li>
                        <strong>Tous les produits:</strong> S'applique à tous vos produits
                      </li>
                      <li>
                        <strong>Produits spécifiques:</strong> Sélectionnez des produits précis
                      </li>
                      <li>
                        <strong>Catégories:</strong> Par catégorie de produits
                      </li>
                      <li>
                        <strong>Collections:</strong> Par collection de produits
                      </li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <CreatePromotionDialog
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

export default Promotions;
