import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { ArrowRight, Users, Sparkles } from '@/components/icons';
import { Link } from 'react-router-dom';
import { StoreCreateCtaLink } from '@/components/store/StoreCreateCtaLink';
import { useToast } from '@/hooks/use-toast';
import { PremiumNav } from '@/components/landing/premium/PremiumNav';
import { PremiumFooter } from '@/components/landing/premium/PremiumFooter';
import AdvancedFilters from '@/components/marketplace/AdvancedFilters';
import ProductComparison from '@/components/marketplace/ProductComparison';
import FavoritesManager from '@/components/marketplace/FavoritesManager';
import { ContextualFilters } from '@/components/marketplace/ContextualFilters';
import { logger } from '@/lib/logger';
import { buildCheckoutUrl } from '@/lib/checkout/checkout-route';
import { usePageCustomization } from '@/hooks/usePageCustomization';
import { Product } from '@/types/marketplace';
import { useMarketplaceFavorites } from '@/hooks/useMarketplaceFavorites';
import { useDebounce } from '@/hooks/useDebounce';
import {
  useProductSearch,
  useSaveSearchHistory,
  type SearchResult,
} from '@/hooks/useProductSearch';
import '@/styles/landing-premium.css';
import '@/styles/marketplace-premium.css';
import { SEOMeta, WebsiteSchema, BreadcrumbSchema, ItemListSchema } from '@/components/seo';
import { useFilteredProducts } from '@/hooks/useFilteredProducts';
import { useCurrentUserId } from '@/hooks/useCurrentUserId';
import { useAuth } from '@/contexts/AuthContext';
import { useMarketplaceCatalog } from '@/hooks/useMarketplaceCatalog';
import { useQueryClient } from '@tanstack/react-query';
// ✅ REFACTORING: Imports des nouveaux hooks et composants
import {
  useMarketplaceFilters,
  useMarketplacePagination,
  needsTypeSpecificRpc,
  useMarketplaceUrlSync,
  useMarketplaceComparison,
} from '@/hooks/marketplace';
import { MarketplaceHeroSection } from '@/components/marketplace/MarketplaceHeroSection';
import { MarketplaceControlsSection } from '@/components/marketplace/MarketplaceControlsSection';
import { MarketplaceProductsSection } from '@/components/marketplace/MarketplaceProductsSection';
import { AIProductRecommendations } from '@/components/recommendations/AIProductRecommendations';
import { useLCPPreload } from '@/hooks/useLCPPreload';
import { generateProductUrl } from '@/lib/store-utils';
import { useMarketplaceFacets } from '@/hooks/useMarketplaceFacets';
import { buildMarketplaceBreadcrumbs, buildMarketplaceSEO } from '@/lib/marketplace-seo';
import { BuyerDiscoveryPageLayout } from '@/components/layout/BuyerDiscoveryPageLayout';

const Marketplace = () => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const navigate = useNavigate();
  const { getValue } = usePageCustomization('marketplace');
  const queryClient = useQueryClient();

  // ✅ PERFORMANCE: Preload images LCP pour améliorer Core Web Vitals
  // Preload la première image de produit si disponible (potentielle LCP)
  // Note: Les images de produits seront preloadées dynamiquement par ProductCardModern
  const { getValue: getMarketplaceValue } = usePageCustomization('marketplace');
  const heroImage = getMarketplaceValue('heroImage') as string | undefined;

  // Preload hero image si disponible
  useLCPPreload({
    src: heroImage || '', // Fallback vide si pas d'image
    sizes: heroImage ? '(max-width: 640px) 100vw, (max-width: 1024px) 80vw, 1200px' : undefined,
    priority: !!heroImage, // Seulement si image présente
  });

  // Hook personnalisé pour favoris synchronisés
  const { favorites, favoritesCount, toggleFavorite, clearAllFavorites } =
    useMarketplaceFavorites();

  // Récupérer l'utilisateur pour les recommandations personnalisées
  // ✅ FIX: Utiliser useAuth() qui est plus fiable et réactif que useCurrentUserId
  const { user, loading: authLoading } = useAuth();
  const userId = user?.id ?? null;

  // Fallback: utiliser useCurrentUserId si useAuth n'est pas disponible (pour compatibilité)
  const { userId: fallbackUserId } = useCurrentUserId();
  const finalUserId = userId || fallbackUserId;

  // ✅ REFACTORING: Utiliser les nouveaux hooks
  const {
    filters,
    setFilters,
    updateFilter,
    clearFilters,
    PRICE_RANGES,
    SORT_OPTIONS,
    PRODUCT_TAGS,
  } = useMarketplaceFilters();

  const { pagination, totalPages, goToPage, resetPagination, updateTotalItems } =
    useMarketplacePagination(12);

  const [searchInput, setSearchInput] = useState('');
  const debouncedSearch = useDebounce(searchInput, 500);

  useMarketplaceUrlSync({
    filters,
    setFilters,
    searchInput,
    setSearchInput,
    pagination,
    goToPage,
    debouncedSearch,
  });

  // Recherche full-text serveur
  const hasSearchQuery: boolean = !!(debouncedSearch && debouncedSearch.trim().length > 0);

  const useTypeSpecificRpc = needsTypeSpecificRpc(filters);
  const shouldUseUnifiedRpc = !hasSearchQuery && !useTypeSpecificRpc;

  const {
    products: catalogQueryProducts,
    totalCount: queryTotalCount,
    facets: catalogFacets,
    isLoading: unifiedCatalogLoading,
    error: catalogQueryError,
    prefetchNextPage,
    prefetchPreviousPage,
  } = useMarketplaceCatalog({
    filters,
    pagination,
    searchQuery: debouncedSearch,
    hasSearchQuery,
    shouldUseRPCFiltering: shouldUseUnifiedRpc,
    enabled: shouldUseUnifiedRpc,
  });

  const queryProducts = catalogQueryProducts;
  const queryIsLoading = unifiedCatalogLoading;
  const queryError = catalogQueryError;

  const {
    data: typeFilteredProducts = [],
    isLoading: typeRpcLoading,
    isError: typeRpcError,
  } = useFilteredProducts({
    filters,
    pagination,
    enabled: useTypeSpecificRpc,
  });

  const catalogProducts = useMemo(
    () => (useTypeSpecificRpc ? typeFilteredProducts : queryProducts),
    [useTypeSpecificRpc, typeFilteredProducts, queryProducts]
  );

  const searchFilters = {
    category:
      filters.category !== 'all' && filters.category !== 'featured' ? filters.category : null,
    product_type: filters.productType !== 'all' ? filters.productType : null,
    min_price:
      filters.priceRange !== 'all'
        ? (() => {
            const [min] = filters.priceRange.split('-').map(Number);
            return min || null;
          })()
        : null,
    max_price:
      filters.priceRange !== 'all'
        ? (() => {
            const parts = filters.priceRange.split('-');
            return parts.length > 1 && parts[1] ? Number(parts[1]) : null;
          })()
        : null,
    min_rating: filters.rating !== 'all' ? Number(filters.rating) : null,
    // Filtres spécifiques Artist
    artist_type:
      filters.productType === 'artist' && filters.artistType && filters.artistType !== 'all'
        ? filters.artistType
        : null,
    edition_type:
      filters.productType === 'artist' && filters.editionType && filters.editionType !== 'all'
        ? filters.editionType
        : null,
    certificate_of_authenticity:
      filters.productType === 'artist' && filters.certificateOfAuthenticity ? true : null,
  };

  const { data: searchResults, isLoading: searchLoading } = useProductSearch(
    debouncedSearch,
    searchFilters,
    {
      limit: pagination.itemsPerPage,
      offset: (pagination.currentPage - 1) * pagination.itemsPerPage,
      enabled: !!hasSearchQuery && debouncedSearch.trim().length > 0,
    }
  );

  const saveSearchHistory = useSaveSearchHistory();

  const catalogLoading = hasSearchQuery
    ? searchLoading
    : useTypeSpecificRpc
      ? typeRpcLoading
      : queryIsLoading;

  const catalogError = hasSearchQuery
    ? null
    : useTypeSpecificRpc
      ? typeRpcError
        ? 'Erreur lors du chargement des produits'
        : null
      : queryError
        ? queryError instanceof Error
          ? queryError.message
          : String(queryError)
        : null;

  const hasLoadedOnce =
    !catalogLoading || catalogProducts.length > 0 || !!catalogError || hasSearchQuery;

  useEffect(() => {
    if (hasSearchQuery) return;
    if (useTypeSpecificRpc) {
      updateTotalItems(typeFilteredProducts.length);
    } else {
      updateTotalItems(queryTotalCount);
    }
  }, [
    hasSearchQuery,
    useTypeSpecificRpc,
    typeFilteredProducts.length,
    queryTotalCount,
    updateTotalItems,
  ]);

  // États des modales et UI
  const [showFilters, setShowFilters] = useState(false);
  const [showAdvancedSearch, setShowAdvancedSearch] = useState(false);
  const [, setShowComparison] = useState(false);
  const { comparisonProducts, removeFromComparison, clearComparison, addToComparison } =
    useMarketplaceComparison();
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 100000]);

  // ✅ REFACTORING: PRICE_RANGES, SORT_OPTIONS, PRODUCT_TAGS sont maintenant fournis par useMarketplaceFilters

  // Synchroniser debouncedSearch avec filters.search
  useEffect(() => {
    updateFilter({ search: debouncedSearch });
  }, [debouncedSearch, updateFilter]);

  // Enregistrer l'historique de recherche
  useEffect(() => {
    if (hasSearchQuery && searchResults && Array.isArray(searchResults)) {
      saveSearchHistory(debouncedSearch, searchResults.length);
    }
  }, [debouncedSearch, searchResults, hasSearchQuery, saveSearchHistory]);

  // Prefetch page suivante (catalogue unifié RPC)
  useEffect(() => {
    if (!queryIsLoading && queryProducts.length > 0 && !hasSearchQuery && !useTypeSpecificRpc) {
      const timer = setTimeout(() => prefetchNextPage(), 1000);
      return () => clearTimeout(timer);
    }
  }, [queryIsLoading, queryProducts.length, hasSearchQuery, useTypeSpecificRpc, prefetchNextPage]);

  // Catalogue : cache React Query (staleTime ~10 min). Pas de Realtime global sur `products`
  // (évite des milliers d'invalidations/refetch RPC à chaque mise à jour vendeur à l'échelle).

  // Utiliser les résultats de recherche full-text si une recherche est active
  // Sinon, utiliser les produits chargés normalement
  const displayProducts = useMemo(() => {
    // Si recherche active, utiliser les résultats de recherche full-text
    if (hasSearchQuery && searchResults && Array.isArray(searchResults)) {
      // Convertir les résultats de recherche en format Product
      return searchResults.map((result: SearchResult) => ({
        id: result.id,
        name: result.name,
        slug: result.slug,
        description: result.description,
        short_description: result.description?.substring(0, 150) || null,
        image_url: result.image_url,
        price: result.price,
        promotional_price: result.promotional_price,
        currency: result.currency,
        category: result.category,
        product_type: result.product_type,
        rating: result.rating,
        reviews_count: result.reviews_count || 0,
        purchases_count: result.purchases_count || 0,
        store_id: result.store_id,
        stores: {
          id: result.store_id,
          name: result.store_name,
          slug: result.store_slug,
          logo_url: result.store_logo_url,
          created_at: new Date().toISOString(),
        },
        tags: [],
        is_active: true,
        is_draft: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        product_affiliate_settings:
          (result as { product_affiliate_settings?: unknown }).product_affiliate_settings || null,
      })) as unknown as Product[];
    }

    let filtered = catalogProducts;
    if (filters.tags.length > 0) {
      filtered = filtered.filter(product => filters.tags.some(tag => product.tags?.includes(tag)));
    }
    return filtered;
  }, [hasSearchQuery, searchResults, catalogProducts, filters.tags]);

  const isLoadingProducts = catalogLoading && hasLoadedOnce;

  const catalogCategories = useMemo(() => {
    const cats = Array.from(
      new Set(catalogProducts.map(p => p.category).filter(Boolean))
    ) as string[];
    return cats.sort();
  }, [catalogProducts]);

  const catalogProductTypes = useMemo(() => {
    const types = Array.from(
      new Set(catalogProducts.map(p => p.product_type).filter(Boolean))
    ) as string[];
    return types.sort();
  }, [catalogProducts]);

  const { data: typeSpecificFacets, isLoading: typeFacetsLoading } = useMarketplaceFacets({
    filters,
    searchQuery: debouncedSearch,
    enabled: !hasSearchQuery && useTypeSpecificRpc,
  });

  const marketplaceFacets = shouldUseUnifiedRpc ? catalogFacets : typeSpecificFacets;
  const facetsLoading = shouldUseUnifiedRpc ? unifiedCatalogLoading : typeFacetsLoading;

  const facetCategories = useMemo(
    () => marketplaceFacets?.categories ?? [],
    [marketplaceFacets?.categories]
  );
  const facetProductTypes = useMemo(
    () => marketplaceFacets?.product_types ?? [],
    [marketplaceFacets?.product_types]
  );

  const categoryFacetMap = useMemo(() => {
    const map: Record<string, number> = {};
    facetCategories.forEach(c => {
      map[c.value] = c.count;
    });
    return map;
  }, [facetCategories]);

  const facetCategoryOptions = useMemo(() => {
    if (facetCategories.length) {
      return facetCategories.map(c => c.value);
    }
    return catalogCategories;
  }, [facetCategories, catalogCategories]);

  const productTypeFacetCounts = useMemo(() => {
    const map: Record<string, number> = {};
    facetProductTypes.forEach(t => {
      map[t.value] = t.count;
    });
    return map;
  }, [facetProductTypes]);

  // ✅ REFACTORING: updateFilter et clearFilters sont maintenant fournis par useMarketplaceFilters
  // Réinitialiser la pagination quand les filtres changent
  useEffect(() => {
    resetPagination();
  }, [
    filters.category,
    filters.productType,
    filters.priceRange,
    filters.rating,
    filters.tags.length,
    filters.verifiedOnly,
    filters.featuredOnly,
    resetPagination,
  ]);

  // Obtenir les produits favoris
  const favoriteProducts = useMemo(() => {
    if (!favorites || favorites.size === 0) return [];
    const favoriteIds = Array.from(favorites);
    return catalogProducts.filter(p => favoriteIds.includes(p.id));
  }, [catalogProducts, favorites]);

  // Fonction d'achat (utilisée par UnifiedProductCard) - Redirige vers checkout
  const handleBuyProduct = useCallback(
    async (product: { id: string; store_id?: string; slug?: string }) => {
      if (!product.store_id) {
        toast({
          title: 'Erreur',
          description: 'Boutique non disponible',
          variant: 'destructive',
        });
        return;
      }

      // ✅ FIX: Attendre que l'authentification soit chargée avant de vérifier
      if (authLoading) {
        // Attendre un peu que l'auth se charge
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      // Vérifier l'authentification avec la valeur la plus récente
      const currentUserId = user?.id ?? finalUserId;

      if (!currentUserId) {
        toast({
          title: 'Authentification requise',
          description: 'Veuillez vous connecter pour effectuer un achat',
          variant: 'destructive',
        });
        navigate('/login');
        return;
      }

      navigate(
        buildCheckoutUrl({
          productId: product.id,
          storeId: product.store_id,
        })
      );
    },
    [toast, navigate, user, finalUserId, authLoading]
  );

  // Partage de produit (utilisé par ProductCardModern)
  // Note: Cette fonction est disponible mais peut ne pas être utilisée directement ici

  // ✅ REFACTORING: totalPages, canGoPrevious, canGoNext sont maintenant fournis par useMarketplacePagination

  // ✅ REFACTORING: La transformation et le rendu des produits sont maintenant gérés par MarketplaceProductsSection
  // ✅ REFACTORING: goToPage est maintenant fourni par useMarketplacePagination
  // Wrapper pour goToPage avec prefetching
  const handlePageChange = useCallback(
    (page: number) => {
      goToPage(page);

      // ✅ OPTIMISATION: Prefetching des pages adjacentes
      if (page < totalPages) {
        prefetchNextPage();
      }
      if (page > 1) {
        prefetchPreviousPage();
      }
    },
    [goToPage, totalPages, prefetchNextPage, prefetchPreviousPage]
  );

  // Statistiques (basées sur le total réel, pas seulement la page actuelle)
  const stats = useMemo(
    () => ({
      totalProducts: pagination.totalItems, // Total côté serveur
      totalStores: new Set(catalogProducts.map(p => p.store_id)).size,
      averageRating:
        catalogProducts.length > 0
          ? catalogProducts.reduce((sum, p) => sum + (p.rating || 0), 0) / catalogProducts.length
          : 0,
      totalSales: catalogProducts.reduce(
        (sum, p) => sum + (p.purchases_count || p.reviews_count || 0),
        0
      ),
      categoriesCount: catalogCategories.length,
      featuredProducts: catalogProducts.filter(
        p => p.promotional_price && p.promotional_price < p.price
      ).length,
    }),
    [catalogProducts, catalogCategories, pagination.totalItems]
  );

  const marketplaceSeoData = useMemo(() => {
    const origin =
      typeof window !== 'undefined' ? window.location.origin : 'https://www.emarzona.com';
    return {
      ...buildMarketplaceSEO(filters, {
        totalProducts: stats.totalProducts,
        searchQuery: debouncedSearch,
        origin,
        page: pagination.currentPage,
      }),
      image: `${origin}/og-marketplace.jpg`,
    };
  }, [filters, debouncedSearch, stats.totalProducts, pagination.currentPage]);

  const breadcrumbItems = useMemo(() => {
    const origin =
      typeof window !== 'undefined' ? window.location.origin : 'https://www.emarzona.com';
    return buildMarketplaceBreadcrumbs(filters, debouncedSearch, origin);
  }, [filters, debouncedSearch]);

  // Items pour ItemListSchema (premiers produits visibles)
  const itemListItems = useMemo(() => {
    return displayProducts.slice(0, 20).map(product => ({
      id: product.id,
      name: product.name,
      url: generateProductUrl(
        product.stores?.slug || 'default',
        product.slug || product.id,
        product.stores?.subdomain
      ),
      image: product.image_url || undefined,
      description: product.short_description || product.description || undefined,
      price: product.promotional_price || product.price,
      currency: product.currency || 'XOF',
      rating: product.rating || undefined,
    }));
  }, [displayProducts]);

  // Animations au scroll (déjà déclarées plus haut)

  const useAuthenticatedShell = Boolean(user) && !authLoading;
  const mainAriaLabel = t('marketplace.mainContent', 'Contenu principal de la marketplace');

  return (
    <>
      {/* SEO Meta Tags */}
      <SEOMeta
        title={marketplaceSeoData.title}
        description={marketplaceSeoData.description}
        keywords={marketplaceSeoData.keywords}
        url={marketplaceSeoData.url}
        image={marketplaceSeoData.image}
        imageAlt="Marketplace Emarzona - Produits Digitaux"
        type="website"
        canonical={marketplaceSeoData.url}
        // Open Graph amélioré pour le Marketplace
        locale="fr_FR"
        tags={filters.tags.length > 0 ? filters.tags : undefined}
      />

      {/* Schema.org Website */}
      <WebsiteSchema />

      {/* Schema.org Breadcrumb */}
      <BreadcrumbSchema items={breadcrumbItems} />

      {/* Schema.org ItemList pour la collection de produits */}
      {itemListItems.length > 0 && (
        <ItemListSchema
          items={itemListItems}
          name="Marketplace Emarzona"
          description={`Collection de ${stats.totalProducts} produits digitaux disponibles sur Emarzona`}
          url="/marketplace"
          numberOfItems={stats.totalProducts}
        />
      )}

      <BuyerDiscoveryPageLayout
        authenticated={useAuthenticatedShell}
        mainAriaLabel={mainAriaLabel}
        guestClassName="landing-premium marketplace-premium min-h-screen overflow-x-hidden"
        shellMainClassName="landing-premium marketplace-premium overflow-x-hidden"
      >
        {/* Skip to main content link for keyboard navigation (invités) */}
        {!useAuthenticatedShell && (
          <a
            href="#main-content"
            className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-blue-600 focus:text-white focus:rounded-md focus:shadow-lg"
            aria-label={t('marketplace.hero.skipToMain', 'Aller au contenu principal')}
          >
            {t('marketplace.hero.skipToMain', 'Aller au contenu principal')}
          </a>
        )}

        {!useAuthenticatedShell && <PremiumNav />}

        {/* Breadcrumb Navigation */}
        <div className="mp-breadcrumb container mx-auto max-w-7xl px-3 sm:px-4 lg:px-8 pb-2">
          <Breadcrumb>
            <BreadcrumbList>
              {breadcrumbItems.map((item, index) => (
                <React.Fragment key={`${item.url}-${index}`}>
                  {index > 0 && <BreadcrumbSeparator />}
                  <BreadcrumbItem>
                    {index < breadcrumbItems.length - 1 ? (
                      <BreadcrumbLink
                        href={item.url.replace(/^https?:\/\/[^/]+/, '') || '/'}
                        className="text-xs sm:text-sm"
                      >
                        {index === 0 ? <span className="sr-only">{item.name}</span> : item.name}
                        {index === 0 && (
                          <svg
                            className="h-3 w-3 sm:h-4 sm:w-4 inline"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                            aria-hidden="true"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                            />
                          </svg>
                        )}
                      </BreadcrumbLink>
                    ) : (
                      <BreadcrumbPage className="text-xs sm:text-sm" data-current>
                        {item.name}
                      </BreadcrumbPage>
                    )}
                  </BreadcrumbItem>
                </React.Fragment>
              ))}
            </BreadcrumbList>
          </Breadcrumb>
        </div>

        {/* ✅ REFACTORING: Hero Section remplacée par MarketplaceHeroSection */}
        <MarketplaceHeroSection
          filters={filters}
          searchInput={searchInput}
          onSearchInputChange={setSearchInput}
          onSearch={query => {
            setSearchInput(query);
            resetPagination();
          }}
          onFilterChange={updateFilter}
          onClearFilters={clearFilters}
          showFilters={showFilters}
          onToggleFilters={() => setShowFilters(!showFilters)}
          showAdvancedSearch={showAdvancedSearch}
          onToggleAdvancedSearch={() => setShowAdvancedSearch(!showAdvancedSearch)}
          onToggleComparison={() => setShowComparison(true)}
          categories={catalogCategories}
          productTypeFacets={marketplaceFacets?.product_types ?? []}
          facetsTotal={marketplaceFacets?.total}
          facetsLoading={facetsLoading}
          favoritesCount={favoritesCount}
          comparisonCount={comparisonProducts.length}
          PRICE_RANGES={PRICE_RANGES}
          getValue={getValue}
        />

        {/* Section de personnalisation - Quiz de style */}
        <section
          className="mp-quiz-banner py-6 sm:py-8 px-3 sm:px-4"
          role="region"
          aria-labelledby="style-quiz-title"
          aria-describedby="style-quiz-description"
        >
          <div className="container mx-auto max-w-7xl lg:px-8">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-center sm:text-left">
                <h2 id="style-quiz-title" className="text-lg sm:text-xl mb-2">
                  🎨 Découvrez Votre Style Unique
                </h2>
                <p id="style-quiz-description" className="text-sm max-w-md">
                  Répondez à quelques questions et recevez des recommandations personnalisées
                  adaptées à vos goûts et préférences.
                </p>
              </div>
              <Button
                asChild
                size="lg"
                className="lp-btn-primary rounded-full px-6 py-3"
                aria-label={t('marketplace.quiz.button', 'Commencer le quiz de style personnalisé')}
              >
                <Link to="/personalization/quiz" className="flex items-center space-x-2">
                  <Sparkles className="h-5 w-5" aria-hidden="true" />
                  <span>Faire le Quiz</span>
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Filtres avancés */}
        {showFilters && (
          <section
            id="advanced-filters"
            className="mp-filters-panel py-4 sm:py-6 lg:py-8 px-3 sm:px-4"
            role="region"
            aria-label={t('marketplace.filters.advanced')}
          >
            <div className="container mx-auto max-w-7xl lg:px-8">
              <Card className="mp-filters-card border-0 shadow-none">
                <CardContent className="p-3 sm:p-4 lg:p-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                    {/* Catégorie */}
                    <div>
                      <label className="text-xs sm:text-sm font-medium mb-1.5 sm:mb-2 block">
                        Catégorie
                      </label>
                      <select
                        value={filters.category}
                        onChange={e => updateFilter({ category: e.target.value })}
                        className="mp-select w-full px-3 py-2 min-h-[44px] h-11 sm:h-10 text-base sm:text-sm touch-manipulation cursor-pointer"
                      >
                        <option value="all">Toutes les catégories</option>
                        {facetCategoryOptions.map(cat => (
                          <option key={cat} value={cat}>
                            {cat}
                            {categoryFacetMap[cat] != null
                              ? ` (${categoryFacetMap[cat].toLocaleString('fr-FR')})`
                              : ''}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Type de produit */}
                    <div>
                      <label className="text-xs sm:text-sm font-medium mb-1.5 sm:mb-2 block">
                        Type
                      </label>
                      <select
                        value={filters.productType}
                        onChange={e => updateFilter({ productType: e.target.value })}
                        className="mp-select w-full px-3 py-2 min-h-[44px] h-11 sm:h-10 text-base sm:text-sm touch-manipulation cursor-pointer"
                      >
                        <option value="all">Tous les types</option>
                        {['digital', 'physical', 'service', 'course', 'artist']
                          .filter(
                            type =>
                              productTypeFacetCounts[type] != null ||
                              catalogProductTypes.includes(type)
                          )
                          .map(type => (
                            <option key={type} value={type}>
                              {type}
                              {productTypeFacetCounts[type] != null
                                ? ` (${productTypeFacetCounts[type].toLocaleString('fr-FR')})`
                                : ''}
                            </option>
                          ))}
                      </select>
                    </div>

                    {/* Type de licence */}
                    <div>
                      <label className="text-xs sm:text-sm font-medium mb-1.5 sm:mb-2 block">
                        Licence
                      </label>
                      <select
                        value={filters.licensingType || 'all'}
                        onChange={e => {
                          const value = e.target.value;
                          updateFilter({
                            licensingType:
                              value === 'all'
                                ? 'all'
                                : (value as 'standard' | 'plr' | 'copyrighted'),
                          });
                        }}
                        className="mp-select w-full px-3 py-2 min-h-[44px] h-11 sm:h-10 text-base sm:text-sm touch-manipulation cursor-pointer"
                      >
                        <option value="all">Toutes</option>
                        <option value="standard">Standard</option>
                        <option value="plr">PLR</option>
                        <option value="copyrighted">Droit d'auteur</option>
                      </select>
                    </div>

                    {/* Prix */}
                    <div>
                      <label className="text-xs sm:text-sm font-medium mb-1.5 sm:mb-2 block">
                        Prix
                      </label>
                      <select
                        value={filters.priceRange}
                        onChange={e => updateFilter({ priceRange: e.target.value })}
                        className="mp-select w-full px-3 py-2 min-h-[44px] h-11 sm:h-10 text-base sm:text-sm touch-manipulation cursor-pointer"
                      >
                        {PRICE_RANGES.map(range => (
                          <option key={range.value} value={range.value}>
                            {range.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Note */}
                    <div>
                      <label className="text-xs sm:text-sm font-medium mb-1.5 sm:mb-2 block">
                        Note minimum
                      </label>
                      <select
                        value={filters.rating}
                        onChange={e => updateFilter({ rating: e.target.value })}
                        className="mp-select w-full px-3 py-2 min-h-[44px] h-11 sm:h-10 text-base sm:text-sm touch-manipulation cursor-pointer"
                      >
                        <option value="all">Toutes les notes</option>
                        <option value="4">4+ étoiles</option>
                        <option value="3">3+ étoiles</option>
                        <option value="2">2+ étoiles</option>
                        <option value="1">1+ étoiles</option>
                      </select>
                    </div>
                  </div>

                  {/* Filtres supplémentaires */}
                  <div className="mt-4 sm:mt-6 grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="verifiedOnly"
                        checked={filters.verifiedOnly}
                        onChange={e => updateFilter({ verifiedOnly: e.target.checked })}
                        className="rounded border-[var(--lp-border-light)] h-4 w-4 accent-[var(--lp-blue)]"
                      />
                      <label htmlFor="verifiedOnly" className="text-xs sm:text-sm">
                        Boutiques vérifiées uniquement
                      </label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="featuredOnly"
                        checked={filters.featuredOnly}
                        onChange={e => updateFilter({ featuredOnly: e.target.checked })}
                        className="rounded border-[var(--lp-border-light)] h-4 w-4 accent-[var(--lp-blue)]"
                      />
                      <label htmlFor="featuredOnly" className="text-xs sm:text-sm">
                        Produits en vedette uniquement
                      </label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="inStock"
                        checked={filters.inStock}
                        onChange={e => updateFilter({ inStock: e.target.checked })}
                        className="rounded border-[var(--lp-border-light)] h-4 w-4 accent-[var(--lp-blue)]"
                      />
                      <label htmlFor="inStock" className="text-xs sm:text-sm">
                        En stock uniquement
                      </label>
                    </div>
                  </div>

                  {/* Tags */}
                  <div className="mt-4 sm:mt-6">
                    <label className="text-xs sm:text-sm font-medium mb-2 block">
                      Tags populaires
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {PRODUCT_TAGS.map(tag => (
                        <button
                          key={tag}
                          onClick={() => {
                            const newTags = filters.tags.includes(tag)
                              ? filters.tags.filter(t => t !== tag)
                              : [...filters.tags, tag];
                            updateFilter({ tags: newTags });
                          }}
                          className={`px-2 sm:px-3 py-1 rounded-full text-xs transition-all duration-300 ${
                            filters.tags.includes(tag) ? 'mp-chip mp-chip--active' : 'mp-chip'
                          }`}
                        >
                          {tag}
                        </button>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Filtres contextuels par type de produit */}
              <div className="container mx-auto max-w-6xl mt-4">
                <ContextualFilters
                  productType={filters.productType}
                  filters={filters}
                  onFiltersChange={updateFilter}
                />
              </div>
            </div>
          </section>
        )}

        {/* ✅ REFACTORING: Contrôles remplacés par MarketplaceControlsSection */}
        <MarketplaceControlsSection
          filters={filters}
          totalItems={pagination.totalItems}
          displayedItems={displayProducts.length}
          hasSearchQuery={!!hasSearchQuery}
          onFilterChange={updateFilter}
          SORT_OPTIONS={SORT_OPTIONS}
        />

        {/* Note: sections par type supprimées => tout s'affiche ensemble dans la liste ci-dessous */}

        {/* ✅ REFACTORING: Liste des produits remplacée par MarketplaceProductsSection */}
        <MarketplaceProductsSection
          products={displayProducts}
          loading={catalogLoading}
          error={catalogError}
          hasLoadedOnce={hasLoadedOnce}
          isLoadingProducts={isLoadingProducts}
          pagination={pagination}
          onRetry={() => {
            queryClient.invalidateQueries({ queryKey: ['marketplace-products'] });
            queryClient.invalidateQueries({ queryKey: ['filtered-digital-products'] });
            queryClient.invalidateQueries({ queryKey: ['filtered-physical-products'] });
            queryClient.invalidateQueries({ queryKey: ['filtered-service-products'] });
            queryClient.invalidateQueries({ queryKey: ['filtered-course-products'] });
            queryClient.invalidateQueries({ queryKey: ['filtered-artist-products'] });
            queryClient.invalidateQueries({ queryKey: ['product-search'] });
            queryClient.invalidateQueries({ queryKey: ['marketplace-facets'] });
          }}
          onPageChange={handlePageChange}
          onBuyProduct={handleBuyProduct}
          userId={finalUserId}
          showRecommendations={
            !!(
              finalUserId &&
              filters.category === 'all' &&
              filters.search === '' &&
              filters.productType === 'all'
            )
          }
        />

        {/* Recommandations IA personnalisées */}
        {finalUserId && (
          <section className="mp-section-muted py-8 sm:py-12 lg:py-16 px-3 sm:px-4">
            <div className="container mx-auto max-w-7xl">
              <AIProductRecommendations
                userId={finalUserId}
                title="Découvrez nos recommandations personnalisées"
                limit={8}
                showReasoning={true}
                layout="grid"
                className="border-none bg-transparent shadow-none"
              />
            </div>
          </section>
        )}

        {/* Call to Action */}
        <section className="mp-hero relative overflow-hidden px-3 sm:px-4 py-12 sm:py-16">
          <div className="mp-hero__inner container mx-auto max-w-4xl text-center">
            <p className="lp-eyebrow mb-4 self-center mx-auto">Emarzona</p>
            <h2 className="mp-hero__title text-2xl sm:text-3xl md:text-4xl text-white mb-4">
              {getValue('marketplace.cta.title')}
            </h2>
            <p className="mp-hero__subtitle text-base sm:text-lg mb-8 px-2">
              {getValue('marketplace.cta.subtitle')}
            </p>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center px-2">
              <StoreCreateCtaLink className="w-full sm:w-auto">
                <Button
                  size="lg"
                  className="lp-btn-primary rounded-full h-11 sm:h-12 px-8 w-full sm:w-auto"
                >
                  {getValue('marketplace.cta.startFree')}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </StoreCreateCtaLink>
              <Link to="/community" className="w-full sm:w-auto">
                <Button
                  size="lg"
                  className="lp-btn-outline rounded-full h-11 sm:h-12 px-8 w-full sm:w-auto"
                >
                  <Users className="mr-2 h-4 w-4" />
                  {getValue('marketplace.cta.joinCommunity')}
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {!useAuthenticatedShell && <PremiumFooter />}

        {/* Modales */}
        <AdvancedFilters
          theme="premium"
          isOpen={showAdvancedSearch}
          onClose={() => setShowAdvancedSearch(false)}
          filters={filters}
          onFiltersChange={updateFilter}
          categories={catalogCategories}
          productTypes={catalogProductTypes}
          priceRange={priceRange}
          onPriceRangeChange={setPriceRange}
        />

        <ProductComparison
          products={comparisonProducts}
          onRemoveProduct={removeFromComparison}
          onClearAll={clearComparison}
          onClose={() => setShowComparison(false)}
        />

        <FavoritesManager
          favorites={favoriteProducts}
          onRemoveFavorite={productId => toggleFavorite(productId)}
          onClearAll={clearAllFavorites}
          onClose={() => {}}
        />
      </BuyerDiscoveryPageLayout>
    </>
  );
};

export default Marketplace;
