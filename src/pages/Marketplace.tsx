import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/integrations/supabase/client';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { ProductGrid } from '@/components/ui/ProductGrid';
import { VirtualizedProductGrid } from '@/components/ui/VirtualizedProductGrid';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
// Import optimisé depuis l'index centralisé
import {
  ShoppingCart,
  Filter,
  Heart,
  Eye,
  Star,
  TrendingUp,
  Clock,
  Users,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  BarChart3,
  Zap,
  Sparkles,
  DollarSign,
  ArrowRight,
  Grid3X3,
  List,
  Rocket,
  Download,
  Package,
} from '@/components/icons';
// Icônes non disponibles dans l'index (import direct)
import { SortAsc, SortDesc, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import MarketplaceHeader from '@/components/marketplace/MarketplaceHeader';
import MarketplaceFooter from '@/components/marketplace/MarketplaceFooter';
import AdvancedFilters from '@/components/marketplace/AdvancedFilters';
import ProductComparison from '@/components/marketplace/ProductComparison';
import FavoritesManager from '@/components/marketplace/FavoritesManager';
import { ContextualFilters } from '@/components/marketplace/ContextualFilters';
import UnifiedProductCard from '@/components/products/UnifiedProductCard';
import { transformToUnifiedProduct } from '@/lib/product-transform';
import { CategoryNavigationBar } from '@/components/marketplace/CategoryNavigationBar';
import { PersonalizedRecommendations } from '@/components/marketplace/ProductRecommendations';
import { logger } from '@/lib/logger';
import { usePageCustomization } from '@/hooks/usePageCustomization';
import { Product, FilterState, PaginationState } from '@/types/marketplace';
import { useMarketplaceFavorites } from '@/hooks/useMarketplaceFavorites';
import { useDebounce } from '@/hooks/useDebounce';
import {
  useProductSearch,
  useSaveSearchHistory,
  type SearchResult,
} from '@/hooks/useProductSearch';
import { SearchAutocomplete } from '@/components/marketplace/SearchAutocomplete';
import '@/styles/marketplace-professional.css';
import { SEOMeta, WebsiteSchema, BreadcrumbSchema, ItemListSchema } from '@/components/seo';
import { useFilteredProducts } from '@/hooks/useFilteredProducts';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';
import { useCurrentUserId } from '@/hooks/useCurrentUserId';
import { useMarketplaceProducts } from '@/hooks/useMarketplaceProducts';
import { ProductListSkeleton } from '@/components/ui/skeleton-enhanced';
import { useQueryClient } from '@tanstack/react-query';

const Marketplace = () => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const navigate = useNavigate();
  const { getValue } = usePageCustomization('marketplace');
  const queryClient = useQueryClient();

  // Hook personnalisé pour favoris synchronisés
  const { favorites, favoritesCount, toggleFavorite, clearAllFavorites } =
    useMarketplaceFavorites();

  // Récupérer l'utilisateur pour les recommandations personnalisées
  const { userId } = useCurrentUserId();

  // États pour compatibilité (seront progressivement remplacés)
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);

  // Refs pour scroll animation (déclarés tôt pour éviter les erreurs d'initialisation)
  const heroRef = useScrollAnimation<HTMLDivElement>();
  const productsRef = useScrollAnimation<HTMLDivElement>();

  // Note: userId est maintenant fourni par un cache global (useCurrentUserId)

  // États des filtres
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    category: 'all',
    productType: 'all',
    licensingType: 'all',
    priceRange: 'all',
    rating: 'all',
    sortBy: 'created_at',
    sortOrder: 'desc',
    viewMode: 'grid',
    tags: [],
    verifiedOnly: false,
    featuredOnly: false,
    inStock: true,
  });

  // État local pour l'input de recherche (non debounced)
  const [searchInput, setSearchInput] = useState('');

  // État de pagination
  const [pagination, setPagination] = useState<PaginationState>({
    currentPage: 1,
    itemsPerPage: 12,
    totalItems: 0,
  });

  // Valeur debounced pour éviter trop d'appels API
  const debouncedSearch = useDebounce(searchInput, 500);

  // Recherche full-text serveur
  const hasSearchQuery = debouncedSearch && debouncedSearch.trim().length > 0;

  // Utiliser les fonctions RPC optimisées si un type spécifique est sélectionné
  const shouldUseRPCFiltering = filters.productType !== 'all' && !hasSearchQuery;

  // ✅ OPTIMISATION: Utiliser React Query pour le chargement des produits
  // IMPORTANT: Doit être déclaré APRÈS filters, pagination, hasSearchQuery, shouldUseRPCFiltering
  const {
    products: queryProducts,
    totalCount: queryTotalCount,
    filteredCount: queryFilteredCount,
    isLoading: queryIsLoading,
    isFetching: queryIsFetching,
    error: queryError,
    prefetchNextPage,
    prefetchPreviousPage,
  } = useMarketplaceProducts({
    filters,
    pagination,
    hasSearchQuery,
    shouldUseRPCFiltering,
  });

  const {
    data: rpcFilteredProducts,
    isLoading: rpcLoading,
    isError: rpcError,
  } = useFilteredProducts({
    filters,
    pagination,
    enabled: shouldUseRPCFiltering,
  });
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

  // États des modales et UI
  const [showFilters, setShowFilters] = useState(false);
  const [showAdvancedSearch, setShowAdvancedSearch] = useState(false);
  const [showComparison, setShowComparison] = useState(false);
  const [comparisonProducts, setComparisonProducts] = useState<Product[]>(() => {
    // Charger la comparaison depuis localStorage
    try {
      const saved = localStorage.getItem('marketplace-comparison');
      const parsed = saved ? (JSON.parse(saved) as unknown) : [];
      return Array.isArray(parsed) ? (parsed as Product[]) : [];
    } catch (error) {
      logger.warn('[Marketplace] Comparison storage is corrupted. Resetting.', { error });
      return [];
    }
  });
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 100000]);

  // Constantes pour les filtres (traduites)
  const PRICE_RANGES = useMemo(
    () => [
      { value: 'all', label: t('marketplace.priceRanges.all') },
      { value: '0-5000', label: t('marketplace.priceRanges.0-5000') },
      { value: '5000-15000', label: t('marketplace.priceRanges.5000-15000') },
      { value: '15000-50000', label: t('marketplace.priceRanges.15000-50000') },
      { value: '50000-100000', label: t('marketplace.priceRanges.50000-100000') },
      { value: '100000+', label: t('marketplace.priceRanges.100000+') },
    ],
    [t]
  );

  const SORT_OPTIONS = useMemo(
    () => [
      { value: 'created_at', label: t('marketplace.sort.newest'), icon: Clock },
      { value: 'price', label: t('marketplace.sort.price'), icon: DollarSign },
      { value: 'rating', label: t('marketplace.sort.rating'), icon: Star },
      { value: 'sales_count', label: t('marketplace.sort.sales'), icon: TrendingUp },
      { value: 'name', label: t('marketplace.sort.name'), icon: Eye },
      { value: 'popularity', label: t('marketplace.sort.popularity'), icon: Zap },
    ],
    [t]
  );

  const PRODUCT_TAGS = useMemo(
    () => [
      t('marketplace.tags.new'),
      t('marketplace.tags.popular'),
      t('marketplace.tags.sale'),
      t('marketplace.tags.recommended'),
      t('marketplace.tags.trending'),
      t('marketplace.tags.premium'),
      t('marketplace.tags.fastShipping'),
      t('marketplace.tags.support'),
      t('marketplace.tags.warranty'),
      t('marketplace.tags.training'),
      t('marketplace.tags.updates'),
      t('marketplace.tags.community'),
    ],
    [t]
  );

  // Synchroniser debouncedSearch avec filters.search
  useEffect(() => {
    setFilters(prev => ({ ...prev, search: debouncedSearch }));
  }, [debouncedSearch]);

  // Enregistrer l'historique de recherche
  useEffect(() => {
    if (hasSearchQuery && searchResults && Array.isArray(searchResults)) {
      saveSearchHistory(debouncedSearch, searchResults.length);
    }
  }, [debouncedSearch, searchResults, hasSearchQuery, saveSearchHistory]);

  // Chargement des produits avec pagination côté serveur
  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);

      // Calculer les indices de pagination
      const startIndex = (pagination.currentPage - 1) * pagination.itemsPerPage;
      const endIndex = startIndex + pagination.itemsPerPage - 1;

      // Construire la requête avec les jointures nécessaires selon le type
      let selectQuery = `
        *,
        stores!inner (
          id,
          name,
          slug,
          logo_url,
          created_at
        ),
        product_affiliate_settings!left (
          commission_rate,
          affiliate_enabled
        )
      `;

      // Ajouter les jointures selon le type de produit et les filtres
      if (filters.productType === 'digital' && filters.digitalSubType) {
        selectQuery += `,
          digital_products!left (
            digital_type,
            license_type
          )`;
      }

      if (filters.productType === 'service' && (filters.serviceType || filters.locationType)) {
        selectQuery += `,
          service_products!left (
            service_type,
            location_type,
            calendar_available
          )`;
      }

      if (filters.productType === 'course' && (filters.difficulty || filters.accessType)) {
        selectQuery += `,
          courses!left (
            difficulty,
            access_type,
            total_duration
          )`;
      }

      if (
        filters.productType === 'artist' &&
        (filters.artistType || filters.editionType || filters.certificateOfAuthenticity)
      ) {
        selectQuery += `,
          artist_products!left (
            artist_type,
            artwork_edition_type,
            certificate_of_authenticity
          )`;
      }

      let query = supabase
        .from('products')
        .select(selectQuery, { count: 'exact' }) // Obtenir le count total
        .eq('is_active', true)
        .eq('is_draft', false); // Seulement les produits publiés

      // Appliquer les filtres
      if (filters.category !== 'all' && filters.category !== 'featured') {
        query = query.eq('category', filters.category);
      }

      // Filtre pour les produits en vedette
      if (filters.category === 'featured') {
        query = query.eq('is_featured', true);
      }

      if (filters.productType !== 'all') {
        query = query.eq('product_type', filters.productType);
      }

      if (filters.priceRange !== 'all') {
        const [min, max] = filters.priceRange.split('-').map(Number);
        if (max) {
          query = query.gte('price', min).lte('price', max);
        } else {
          query = query.gte('price', min);
        }
      }

      if (filters.licensingType && filters.licensingType !== 'all') {
        query = query.eq('licensing_type', filters.licensingType);
      }

      if (filters.rating !== 'all') {
        query = query.gte('rating', Number(filters.rating));
      }

      // Filtres spécifiques par type de produit
      // Note: Les filtres sur les relations (digital_products, service_products, etc.)
      // seront appliqués côté client après récupération des données
      // TODO: Optimiser avec des fonctions RPC pour filtrer côté serveur

      if (filters.productType === 'physical') {
        // Filtre par disponibilité stock (colonne directe dans products)
        if (filters.stockAvailability === 'in_stock') {
          query = query.or('stock_quantity.gt.0,stock_quantity.is.null');
        } else if (filters.stockAvailability === 'low_stock') {
          query = query.gte('stock_quantity', 1).lte('stock_quantity', 10);
        } else if (filters.stockAvailability === 'out_of_stock') {
          query = query.eq('stock_quantity', 0);
        }

        // Filtre par type de livraison (colonne directe dans products)
        if (filters.shippingType === 'free') {
          query = query.eq('free_shipping', true);
        } else if (filters.shippingType === 'paid') {
          query = query.eq('free_shipping', false);
        }
        // Note: 'pickup' nécessiterait une table dédiée pour les points de retrait
      }

      if (filters.productType === 'artist') {
        // Filtre disponibilité (basé sur stock_quantity dans products)
        if (filters.artworkAvailability && filters.artworkAvailability !== 'all') {
          if (filters.artworkAvailability === 'available') {
            query = query.or('stock_quantity.gt.0,stock_quantity.is.null');
          } else if (filters.artworkAvailability === 'sold_out') {
            query = query.eq('stock_quantity', 0);
          }
        }
      }

      // Appliquer le tri
      if (filters.sortBy === 'sales_count') {
        // Tri par nombre de ventes (approximatif avec reviews_count)
        query = query.order('reviews_count', { ascending: filters.sortOrder === 'asc' });
      } else {
        query = query.order(filters.sortBy, { ascending: filters.sortOrder === 'asc' });
      }

      // Appliquer la pagination côté serveur
      query = query.range(startIndex, endIndex);

      const { data, error, count } = await query;

      if (error) {
        logger.error('Erreur Supabase lors du chargement des produits:', error);
        throw error;
      }

      // Ne charger les produits que si pas de recherche active
      if (!hasSearchQuery) {
        // Appliquer les filtres côté client pour les relations
        let filteredData = (data || []) as unknown as Product[];

        if (filters.productType === 'digital' && filters.digitalSubType) {
          filteredData = filteredData.filter(
            (product: Product & { digital_products?: Array<{ digital_type?: string }> }) => {
              const digitalProduct = product.digital_products?.[0];
              return digitalProduct?.digital_type === filters.digitalSubType;
            }
          );
        }

        if (filters.productType === 'service') {
          if (filters.serviceType) {
            filteredData = filteredData.filter(
              (product: Product & { service_products?: Array<{ service_type?: string }> }) => {
                const serviceProduct = product.service_products?.[0];
                return serviceProduct?.service_type === filters.serviceType;
              }
            );
          }
          if (filters.locationType && filters.locationType !== 'all') {
            filteredData = filteredData.filter(
              (product: Product & { service_products?: Array<{ location_type?: string }> }) => {
                const serviceProduct = product.service_products?.[0];
                return serviceProduct?.location_type === filters.locationType;
              }
            );
          }
          if (filters.calendarAvailable) {
            filteredData = filteredData.filter(
              (
                product: Product & { service_products?: Array<{ calendar_available?: boolean }> }
              ) => {
                const serviceProduct = product.service_products?.[0];
                return serviceProduct?.calendar_available === true;
              }
            );
          }
        }

        if (filters.productType === 'course') {
          if (filters.difficulty && filters.difficulty !== 'all') {
            filteredData = filteredData.filter(
              (product: Product & { courses?: Array<{ difficulty?: string }> }) => {
                const course = product.courses?.[0];
                return course?.difficulty === filters.difficulty;
              }
            );
          }
          if (filters.accessType && filters.accessType !== 'all') {
            filteredData = filteredData.filter(
              (product: Product & { courses?: Array<{ access_type?: string }> }) => {
                const course = product.courses?.[0];
                return course?.access_type === filters.accessType;
              }
            );
          }
          if (filters.courseDuration && filters.courseDuration !== 'all') {
            filteredData = filteredData.filter(
              (product: Product & { courses?: Array<{ total_duration?: number }> }) => {
                const course = product.courses?.[0];
                const duration = course?.total_duration || 0;
                if (filters.courseDuration === '<1h') return duration < 60;
                if (filters.courseDuration === '1-5h') return duration >= 60 && duration <= 300;
                if (filters.courseDuration === '5-10h') return duration >= 300 && duration <= 600;
                if (filters.courseDuration === '10h+') return duration > 600;
                return true;
              }
            );
          }
        }

        if (filters.productType === 'artist') {
          if (filters.artistType) {
            filteredData = filteredData.filter(
              (product: Product & { artist_products?: Array<{ artist_type?: string }> }) => {
                const artistProduct = product.artist_products?.[0];
                return artistProduct?.artist_type === filters.artistType;
              }
            );
          }
          if (filters.editionType && filters.editionType !== 'all') {
            filteredData = filteredData.filter(
              (
                product: Product & { artist_products?: Array<{ artwork_edition_type?: string }> }
              ) => {
                const artistProduct = product.artist_products?.[0];
                return artistProduct?.artwork_edition_type === filters.editionType;
              }
            );
          }
          if (filters.certificateOfAuthenticity) {
            filteredData = filteredData.filter(
              (
                product: Product & {
                  artist_products?: Array<{ certificate_of_authenticity?: boolean }>;
                }
              ) => {
                const artistProduct = product.artist_products?.[0];
                return artistProduct?.certificate_of_authenticity === true;
              }
            );
          }
        }

        logger.info(
          `${filteredData.length} produits chargés après filtrage (page ${pagination.currentPage}/${Math.ceil((count || 0) / pagination.itemsPerPage)})`
        );
        setProducts((filteredData || []) as unknown as Product[]);
        setPagination(prev => ({ ...prev, totalItems: filteredData.length }));
        setError(null); // Réinitialiser l'erreur en cas de succès
        setHasLoadedOnce(true); // Marquer qu'on a chargé au moins une fois
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error('❌ Erreur lors du chargement des produits :', { error: errorMessage });
      setError(errorMessage);
      setHasLoadedOnce(true); // Même en cas d'erreur, on a tenté de charger
      toast({
        title: 'Erreur',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [
    filters,
    pagination.currentPage,
    pagination.itemsPerPage,
    hasSearchQuery,
    shouldUseRPCFiltering,
    toast,
  ]);

  // ✅ OPTIMISATION: Synchroniser les produits React Query avec l'état local
  // Version simplifiée pour éviter les boucles infinies
  // Utiliser useMemo pour créer une clé stable basée sur les IDs
  const queryProductsKey = useMemo(
    () => queryProducts.map(p => p.id).join(','),
    [queryProducts]
  );
  const rpcProductsKey = useMemo(
    () => (rpcFilteredProducts || []).map(p => p.id).join(','),
    [rpcFilteredProducts]
  );

  // Ref pour stocker queryProducts et suivre toutes les valeurs précédentes
  const queryProductsRef = useRef<Product[]>([]);
  const rpcFilteredProductsRef = useRef<Product[]>([]);
  const prevQueryKeyRef = useRef<string>('');
  const prevRpcKeyRef = useRef<string>('');
  const prevLoadingRef = useRef<boolean>(true);
  const prevErrorRef = useRef<string | null>(null);
  const prevTotalCountRef = useRef<number>(0);
  const prevHasLoadedOnceRef = useRef<boolean>(false);

  // Mettre à jour les refs quand les données changent
  useEffect(() => {
    queryProductsRef.current = queryProducts;
  }, [queryProducts]);

  useEffect(() => {
    if (rpcFilteredProducts) {
      rpcFilteredProductsRef.current = rpcFilteredProducts;
    }
  }, [rpcFilteredProducts]);

  useEffect(() => {
    // Priorité: RPC > React Query > fetchProducts legacy
    if (shouldUseRPCFiltering && rpcFilteredProductsRef.current.length > 0) {
      if (rpcProductsKey !== prevRpcKeyRef.current) {
        prevRpcKeyRef.current = rpcProductsKey;
        setProducts([...rpcFilteredProductsRef.current]);
      }
      if (prevLoadingRef.current !== rpcLoading) {
        prevLoadingRef.current = rpcLoading;
        setLoading(rpcLoading);
      }
      const rpcErrorMsg = rpcError ? 'Erreur lors du chargement des produits' : null;
      if (prevErrorRef.current !== rpcErrorMsg) {
        prevErrorRef.current = rpcErrorMsg;
        setError(rpcErrorMsg);
      }
      if (!prevHasLoadedOnceRef.current) {
        prevHasLoadedOnceRef.current = true;
        setHasLoadedOnce(true);
      }
      const rpcTotalCount = rpcFilteredProductsRef.current.length;
      if (prevTotalCountRef.current !== rpcTotalCount) {
        prevTotalCountRef.current = rpcTotalCount;
        setPagination(prev => ({ ...prev, totalItems: rpcTotalCount }));
      }
    } else if (!hasSearchQuery) {
      if (queryProductsKey !== prevQueryKeyRef.current) {
        prevQueryKeyRef.current = queryProductsKey;
        // Utiliser le ref pour éviter d'avoir queryProducts dans les dépendances
        setProducts([...queryProductsRef.current]);
      }
      if (prevLoadingRef.current !== queryIsLoading) {
        prevLoadingRef.current = queryIsLoading;
        setLoading(queryIsLoading);
      }
      const queryErrorMsg = queryError
        ? queryError instanceof Error
          ? queryError.message
          : String(queryError)
        : null;
      if (prevErrorRef.current !== queryErrorMsg) {
        prevErrorRef.current = queryErrorMsg;
        setError(queryErrorMsg);
      }
      const shouldSetLoadedOnce = queryIsLoading === false || queryProductsRef.current.length > 0;
      if (shouldSetLoadedOnce && !prevHasLoadedOnceRef.current) {
        prevHasLoadedOnceRef.current = true;
        setHasLoadedOnce(true);
      }
      if (prevTotalCountRef.current !== queryTotalCount) {
        prevTotalCountRef.current = queryTotalCount;
        setPagination(prev => ({ ...prev, totalItems: queryTotalCount }));
      }
    }
  }, [
    shouldUseRPCFiltering,
    rpcFilteredProducts,
    rpcProductsKey,
    rpcLoading,
    rpcError,
    hasSearchQuery,
    queryProductsKey,
    queryIsLoading,
    queryError,
    queryTotalCount,
    // Ne pas inclure queryProducts pour éviter la boucle
  ]);

  // ✅ OPTIMISATION: Prefetching automatique de la page suivante
  useEffect(() => {
    if (!queryIsLoading && queryProductsKey.length > 0 && !hasSearchQuery) {
      // Prefetch la page suivante après un court délai
      const timer = setTimeout(() => {
        prefetchNextPage();
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [queryIsLoading, queryProductsKey, hasSearchQuery, prefetchNextPage]);

  // Abonnement temps réel
  useEffect(() => {
    // ✅ OPTIMISATION: Ne plus appeler fetchProducts si React Query est utilisé
    // React Query gère automatiquement le chargement via useMarketplaceProducts
    // Ne garder fetchProducts que pour compatibilité avec RPC
    if (shouldUseRPCFiltering && !rpcFilteredProducts) {
      // Seulement si RPC est activé mais pas encore chargé
      fetchProducts();
    }

    const channel = supabase
      .channel('realtime:products')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, payload => {
        logger.debug('🔁 Changement temps réel détecté sur products:', payload.eventType);

        if (payload.eventType === 'INSERT') {
          setProducts(prev => [payload.new as Product, ...prev]);
          // Mettre à jour le total si nécessaire
          setPagination(prev => ({ ...prev, totalItems: prev.totalItems + 1 }));
        } else if (payload.eventType === 'UPDATE') {
          setProducts(prev =>
            prev.map(p => (p.id === payload.new.id ? (payload.new as Product) : p))
          );
        } else if (payload.eventType === 'DELETE') {
          setProducts(prev => prev.filter(p => p.id !== payload.old.id));
          // Mettre à jour le total si nécessaire
          setPagination(prev => ({ ...prev, totalItems: Math.max(0, prev.totalItems - 1) }));
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters, pagination.currentPage, pagination.itemsPerPage, hasSearchQuery]); // ✅ Dépendances stables au lieu de fetchProducts

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

    // Sinon, utiliser les produits chargés normalement
    // Filtrage par tags côté client (complexe avec arrays)
    let filtered = products;
    if (filters.tags.length > 0) {
      filtered = filtered.filter(product => filters.tags.some(tag => product.tags?.includes(tag)));
    }
    return filtered;
  }, [hasSearchQuery, searchResults, products, filters.tags]);

  // Gérer le loading - Ne pas afficher de skeletons au premier chargement si pas de produits
  // Afficher les skeletons seulement si on recharge (changement de filtre, pagination, etc.)
  const isLoadingProducts = hasSearchQuery ? searchLoading : loading && hasLoadedOnce; // Seulement si on a déjà chargé une fois

  // Catégories et types dynamiques
  const categories = useMemo(() => {
    const cats = Array.from(new Set(products.map(p => p.category).filter(Boolean))) as string[];
    return cats.sort();
  }, [products]);

  const productTypes = useMemo(() => {
    const types = Array.from(
      new Set(products.map(p => p.product_type).filter(Boolean))
    ) as string[];
    return types.sort();
  }, [products]);

  // Gestion des filtres (reset page à 1 quand filtres changent)
  const updateFilter = useCallback((newFilters: Partial<FilterState>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
    setPagination(prev => ({ ...prev, currentPage: 1 }));
  }, []);

  const clearFilters = useCallback(() => {
    setFilters({
      search: '',
      category: 'all',
      productType: 'all',
      licensingType: 'all',
      priceRange: 'all',
      rating: 'all',
      sortBy: 'created_at',
      sortOrder: 'desc',
      viewMode: 'grid',
      tags: [],
      verifiedOnly: false,
      featuredOnly: false,
      inStock: true,
      // Réinitialiser tous les filtres spécifiques
      digitalSubType: undefined,
      instantDelivery: false,
      stockAvailability: undefined,
      shippingType: undefined,
      physicalCategory: undefined,
      serviceType: undefined,
      locationType: undefined,
      calendarAvailable: false,
      difficulty: undefined,
      accessType: undefined,
      courseDuration: undefined,
      artistType: undefined,
      editionType: undefined,
      certificateOfAuthenticity: false,
      artworkAvailability: undefined,
    });
    setPagination(prev => ({ ...prev, currentPage: 1 }));
  }, []);

  // Persister la comparaison dans localStorage
  useEffect(() => {
    try {
      localStorage.setItem('marketplace-comparison', JSON.stringify(comparisonProducts));
    } catch (error) {
      // Storage peut être plein / bloqué (mode privé, quotas, etc.) -> ne pas casser la page
      logger.warn('[Marketplace] Failed to persist comparison to localStorage', { error });
    }
  }, [comparisonProducts]);

  // Gestion de la comparaison
  // Note: addToComparison peut être utilisé par ProductCardModern si nécessaire

  const removeFromComparison = useCallback(
    (productId: string) => {
      setComparisonProducts(prev => prev.filter(p => p.id !== productId));
      toast({
        title: 'Produit retiré',
        description: 'Le produit a été retiré de la comparaison',
      });
    },
    [toast]
  );

  const clearComparison = useCallback(() => {
    setComparisonProducts([]);
    localStorage.removeItem('marketplace-comparison');
    toast({
      title: 'Comparaison effacée',
      description: 'Tous les produits ont été retirés de la comparaison',
    });
  }, [toast]);

  // Obtenir les produits favoris
  const favoriteProducts = useMemo(() => {
    if (!favorites || favorites.size === 0) return [];
    const favoriteIds = Array.from(favorites);
    return products.filter(p => favoriteIds.includes(p.id));
  }, [products, favorites]);

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

      // Vérifier l'authentification
      if (!userId) {
        toast({
          title: 'Authentification requise',
          description: 'Veuillez vous connecter pour effectuer un achat',
          variant: 'destructive',
        });
        navigate('/login');
        return;
      }

      // Rediriger vers la page de checkout
      const checkoutParams = new URLSearchParams({
        productId: product.id,
        storeId: product.store_id,
      });

      navigate(`/checkout?${checkoutParams.toString()}`);
    },
    [toast, navigate, userId]
  );

  // Partage de produit (utilisé par ProductCardModern)
  // Note: Cette fonction est disponible mais peut ne pas être utilisée directement ici

  // Pagination (basée sur le total côté serveur)
  const totalPages = Math.ceil(pagination.totalItems / pagination.itemsPerPage);
  const canGoPrevious = pagination.currentPage > 1;
  const canGoNext = pagination.currentPage < totalPages;

  // ✅ OPTIMISATION: Mémoriser la transformation des produits pour éviter recalculs
  const transformedProducts = useMemo(
    () =>
      displayProducts.map(product =>
        transformToUnifiedProduct({
          ...product,
          description: product.description ?? undefined,
          short_description: product.short_description ?? undefined,
        } as Parameters<typeof transformToUnifiedProduct>[0])
      ),
    [displayProducts]
  );

  // ✅ OPTIMISATION: Mémoriser le renderItem pour VirtualizedProductGrid
  const renderProductItem = useCallback(
    (index: number) => {
      const unifiedProduct = transformedProducts[index];
      if (!unifiedProduct) return null;

      return (
        <UnifiedProductCard
          key={unifiedProduct.id}
          product={unifiedProduct}
          variant="marketplace"
          showAffiliate={true}
          showActions={true}
          onAction={(action, prod) => {
            if (action === 'view') {
              // Navigation gérée par le Link dans UnifiedProductCard
            } else if (action === 'buy') {
              handleBuyProduct(prod);
            }
          }}
        />
      );
    },
    [transformedProducts, handleBuyProduct]
  );

  // ✅ OPTIMISATION: Mémoriser le rendu des produits pour ProductGrid
  const renderedProducts = useMemo(
    () =>
      transformedProducts.map(unifiedProduct => (
        <UnifiedProductCard
          key={unifiedProduct.id}
          product={unifiedProduct}
          variant="marketplace"
          showAffiliate={true}
          showActions={true}
          onAction={(action, prod) => {
            if (action === 'view') {
              // Navigation gérée par le Link dans UnifiedProductCard
            } else if (action === 'buy') {
              handleBuyProduct(prod);
            }
          }}
        />
      )),
    [transformedProducts, handleBuyProduct]
  );

  // ✅ OPTIMISATION: Prefetching lors du changement de page
  const goToPage = useCallback(
    (page: number) => {
      if (page < 1 || page > totalPages) return;
      setPagination(prev => ({ ...prev, currentPage: page }));

      // ✅ OPTIMISATION: Prefetching des pages adjacentes
      if (page < totalPages) {
        prefetchNextPage();
      }
      if (page > 1) {
        prefetchPreviousPage();
      }

      // Scroll vers le début de la liste de produits (au lieu du top de page)
      setTimeout(() => {
        if (productsRef.current) {
          productsRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
        } else {
          // Fallback si ref non disponible
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
      }, 100); // Délai pour permettre le re-render
    },
    [totalPages, productsRef, prefetchNextPage, prefetchPreviousPage]
  );

  // Statistiques (basées sur le total réel, pas seulement la page actuelle)
  const stats = useMemo(
    () => ({
      totalProducts: pagination.totalItems, // Total côté serveur
      totalStores: new Set(products.map(p => p.store_id)).size, // Approximation sur page actuelle
      averageRating:
        products.length > 0
          ? products.reduce((sum, p) => sum + (p.rating || 0), 0) / products.length
          : 0,
      totalSales: products.reduce((sum, p) => sum + (p.reviews_count || 0), 0), // Approximation sur page actuelle
      categoriesCount: categories.length,
      featuredProducts: products.filter(p => p.promotional_price && p.promotional_price < p.price)
        .length, // Sur page actuelle
    }),
    [products, categories, pagination.totalItems]
  );

  // SEO Meta dynamiques
  const marketplaceSeoData = useMemo(
    () => ({
      title: `Marketplace Emarzona - ${stats.totalProducts} Produits`,
      description: `Découvrez ${stats.totalProducts} produits sur Emarzona : digitaux, physiques, services, cours en ligne et œuvres d'art. ${stats.totalStores} boutiques actives. Note moyenne: ${stats.averageRating.toFixed(1)}/5 ⭐. Paiement sécurisé.`,
      keywords:
        "marketplace afrique, produits digitaux, produits physiques, services, cours en ligne, œuvres d'art, formation en ligne, ebook francophone, templates professionnels, logiciels, paiement mobile money, XOF, FCFA, ecommerce afrique, boutique en ligne, vente en ligne afrique",
      url: `${window.location.origin}/marketplace`,
      image: `${window.location.origin}/og-marketplace.jpg`,
    }),
    [stats]
  );

  // Breadcrumb items pour SEO
  const breadcrumbItems = useMemo(
    () => [
      { name: 'Accueil', url: `${window.location.origin}/` },
      { name: 'Marketplace', url: `${window.location.origin}/marketplace` },
    ],
    []
  );

  // Items pour ItemListSchema (premiers produits visibles)
  const itemListItems = useMemo(() => {
    return displayProducts.slice(0, 20).map(product => ({
      id: product.id,
      name: product.name,
      url: `/stores/${product.stores?.slug || 'default'}/products/${product.slug}`,
      image: product.image_url || undefined,
      description: product.short_description || product.description || undefined,
      price: product.promotional_price || product.price,
      currency: product.currency || 'XOF',
      rating: product.rating || undefined,
    }));
  }, [displayProducts]);

  // Animations au scroll (déjà déclarées plus haut)

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

      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 overflow-x-hidden">
        {/* Skip to main content link for keyboard navigation */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-blue-600 focus:text-white focus:rounded-md focus:shadow-lg"
        >
          {t('marketplace.hero.skipToMain')}
        </a>

        <MarketplaceHeader />

        {/* Breadcrumb Navigation */}
        <div className="container mx-auto max-w-6xl px-3 sm:px-4 pt-4 sm:pt-6 pb-2">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink
                  href="/"
                  className="text-xs sm:text-sm text-slate-300 hover:text-white transition-colors"
                >
                  <svg
                    className="h-3 w-3 sm:h-4 sm:w-4"
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
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="text-slate-500" />
              <BreadcrumbItem>
                <BreadcrumbPage className="text-xs sm:text-sm text-white font-medium">
                  Marketplace
                </BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>

        {/* Hero Section */}
        <section
          ref={heroRef}
          className="relative py-8 sm:py-12 lg:py-16 px-3 sm:px-4 overflow-hidden"
          aria-labelledby="hero-title"
          role="banner"
        >
          <div
            className="absolute inset-0 bg-gradient-to-r from-blue-600/20 via-purple-600/20 to-pink-600/20 animate-pulse"
            aria-hidden="true"
          ></div>
          <div className="container mx-auto max-w-6xl relative z-10">
            <div className="text-center mb-6 sm:mb-8 lg:mb-12">
              <div className="flex items-center justify-center gap-1 sm:gap-2 mb-3 sm:mb-4">
                <Sparkles
                  className="h-5 w-5 sm:h-6 sm:w-6 lg:h-8 lg:w-8 text-yellow-400 animate-pulse"
                  aria-hidden="true"
                />
                <h1
                  id="hero-title"
                  className="text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-bold text-white bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent"
                >
                  {getValue('marketplace.hero.title')}
                </h1>
                <Sparkles
                  className="h-5 w-5 sm:h-6 sm:w-6 lg:h-8 lg:w-8 text-yellow-400 animate-pulse"
                  aria-hidden="true"
                />
              </div>
              <p className="text-xs sm:text-sm md:text-base lg:text-lg xl:text-xl text-slate-300 mb-3 sm:mb-4 md:mb-6 lg:mb-8 max-w-4xl mx-auto leading-relaxed px-2">
                {getValue('marketplace.hero.subtitle')}
                <br />
                <span className="text-blue-400 font-semibold">
                  {getValue('marketplace.hero.tagline')}
                </span>
              </p>
            </div>

            {/* Barre de navigation par catégories */}
            <CategoryNavigationBar
              categories={categories}
              selectedCategory={filters.category}
              onCategoryChange={category => updateFilter({ category })}
            />

            {/* Barre de recherche avancée avec auto-complétion */}
            <div className="max-w-4xl mx-auto mb-4 sm:mb-6 px-2">
              <SearchAutocomplete
                value={searchInput}
                onChange={setSearchInput}
                onSearch={query => {
                  setSearchInput(query);
                  // Réinitialiser la pagination lors d'une nouvelle recherche
                  setPagination(prev => ({ ...prev, currentPage: 1 }));
                }}
                placeholder={
                  getValue('marketplace.searchPlaceholder') || 'Rechercher des produits...'
                }
                className="w-full"
                showSuggestions={true}
              />
            </div>

            {/* Filtres actifs (tags) */}
            {(filters.category !== 'all' ||
              filters.productType !== 'all' ||
              filters.priceRange !== 'all' ||
              filters.tags.length > 0 ||
              filters.verifiedOnly ||
              filters.featuredOnly) && (
              <div className="flex flex-wrap gap-2 items-center justify-center mb-3 sm:mb-4 px-2">
                <span className="text-xs sm:text-sm text-slate-300 font-medium">
                  {getValue('marketplace.filtersActive')}
                </span>

                {filters.category !== 'all' && (
                  <Badge
                    variant="secondary"
                    className="bg-slate-700 text-white hover:bg-slate-600 transition-colors flex items-center gap-1 text-xs sm:text-sm"
                  >
                    {getValue('marketplace.filterLabels.category')} {filters.category}
                    <X
                      className="h-3 w-3 cursor-pointer hover:text-red-400"
                      onClick={() => updateFilter({ category: 'all' })}
                      aria-label={`${getValue('marketplace.filterLabels.clear')} ${filters.category}`}
                    />
                  </Badge>
                )}

                {filters.productType !== 'all' && (
                  <Badge
                    variant="secondary"
                    className="bg-slate-700 text-white hover:bg-slate-600 transition-colors flex items-center gap-1 text-xs sm:text-sm"
                  >
                    {getValue('marketplace.filterLabels.type')} {filters.productType}
                    <X
                      className="h-3 w-3 cursor-pointer hover:text-red-400"
                      onClick={() => updateFilter({ productType: 'all' })}
                      aria-label={`${getValue('marketplace.filterLabels.clear')} ${filters.productType}`}
                    />
                  </Badge>
                )}

                {filters.priceRange !== 'all' && (
                  <Badge
                    variant="secondary"
                    className="bg-slate-700 text-white hover:bg-slate-600 transition-colors flex items-center gap-1 text-xs sm:text-sm"
                  >
                    {getValue('marketplace.filterLabels.priceRange')}{' '}
                    {PRICE_RANGES.find(r => r.value === filters.priceRange)?.label}
                    <X
                      className="h-3 w-3 cursor-pointer hover:text-red-400"
                      onClick={() => updateFilter({ priceRange: 'all' })}
                      aria-label={`${getValue('marketplace.filterLabels.clear')} ${getValue('marketplace.filterLabels.priceRange')}`}
                    />
                  </Badge>
                )}

                {filters.verifiedOnly && (
                  <Badge
                    variant="secondary"
                    className="bg-green-700 text-white hover:bg-green-600 transition-colors flex items-center gap-1 text-xs sm:text-sm"
                  >
                    ✓ {getValue('marketplace.filterLabels.verified')}
                    <X
                      className="h-3 w-3 cursor-pointer hover:text-red-400"
                      onClick={() => updateFilter({ verifiedOnly: false })}
                      aria-label={`${getValue('marketplace.filterLabels.clear')} ${getValue('marketplace.filterLabels.verified')}`}
                    />
                  </Badge>
                )}

                {filters.featuredOnly && (
                  <Badge
                    variant="secondary"
                    className="bg-yellow-700 text-white hover:bg-yellow-600 transition-colors flex items-center gap-1 text-xs sm:text-sm"
                  >
                    ⭐ {getValue('marketplace.filterLabels.featured')}
                    <X
                      className="h-3 w-3 cursor-pointer hover:text-red-400"
                      onClick={() => updateFilter({ featuredOnly: false })}
                      aria-label={`${getValue('marketplace.filterLabels.clear')} ${getValue('marketplace.filterLabels.featured')}`}
                    />
                  </Badge>
                )}

                {filters.tags.map((tag, index) => (
                  <Badge
                    key={index}
                    variant="secondary"
                    className="bg-purple-700 text-white hover:bg-purple-600 transition-colors flex items-center gap-1 text-xs sm:text-sm"
                  >
                    {getValue('marketplace.filterLabels.tag')} {tag}
                    <X
                      className="h-3 w-3 cursor-pointer hover:text-red-400"
                      onClick={() => updateFilter({ tags: filters.tags.filter(t => t !== tag) })}
                      aria-label={`${getValue('marketplace.filterLabels.clear')} ${tag}`}
                    />
                  </Badge>
                ))}

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearFilters}
                  className="text-xs sm:text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 h-7 sm:h-8"
                  aria-label={`${getValue('marketplace.filterLabels.clear')} ${getValue('marketplace.filterLabels.all')}`}
                >
                  {getValue('marketplace.filterLabels.clear')}{' '}
                  {getValue('marketplace.filterLabels.all')}
                </Button>
              </div>
            )}

            {/* Filtres rapides */}
            <div
              className="flex flex-wrap gap-2 sm:gap-3 justify-center px-2"
              role="toolbar"
              aria-label={t('marketplace.toolbar.ariaLabel')}
            >
              <Button
                variant="outline"
                onClick={() => setShowFilters(!showFilters)}
                className="bg-slate-800/80 backdrop-blur-sm border-slate-600 text-white hover:bg-slate-700 transition-all duration-300 hover:scale-105 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-slate-900 text-xs sm:text-sm h-8 sm:h-10 px-2 sm:px-4"
                aria-label={`${showFilters ? t('common.hide') : t('common.show')} ${t('marketplace.filters.advanced')}`}
                aria-expanded={showFilters}
                aria-controls="advanced-filters"
              >
                <Filter className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" aria-hidden="true" />
                <span className="hidden sm:inline">{t('marketplace.filters.advanced')}</span>
                <span className="sm:hidden">Filtres</span>
                {(filters.category !== 'all' ||
                  filters.productType !== 'all' ||
                  filters.priceRange !== 'all' ||
                  filters.tags.length > 0) && (
                  <Badge
                    variant="destructive"
                    className="ml-1 sm:ml-2 h-4 w-4 sm:h-5 sm:w-5 rounded-full p-0 flex items-center justify-center text-xs animate-pulse"
                    aria-label="Filtres actifs"
                  >
                    !
                  </Badge>
                )}
              </Button>

              <Button
                variant="outline"
                onClick={() => setShowAdvancedSearch(!showAdvancedSearch)}
                className="bg-slate-800/80 backdrop-blur-sm border-slate-600 text-white hover:bg-slate-700 transition-all duration-300 hover:scale-105 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-slate-900 text-xs sm:text-sm h-8 sm:h-10 px-2 sm:px-4"
                aria-label="Ouvrir la recherche intelligente"
                aria-expanded={showAdvancedSearch}
              >
                <Zap className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" aria-hidden="true" />
                <span className="hidden sm:inline">Recherche intelligente</span>
                <span className="sm:hidden">Recherche</span>
              </Button>

              {/* Note: Le modal FavoritesManager est géré via le composant lui-même */}
              <div className="bg-slate-800/80 backdrop-blur-sm border border-slate-600 text-white rounded-md px-2 sm:px-4 py-1.5 sm:py-2 flex items-center gap-1 sm:gap-2 text-xs sm:text-sm">
                <Heart className="h-3 w-3 sm:h-4 sm:w-4" aria-hidden="true" />
                <span className="hidden sm:inline">Mes favoris</span>
                <span className="sm:hidden">Favoris</span>
                {favoritesCount > 0 && (
                  <Badge
                    variant="secondary"
                    className="ml-1 sm:ml-2 bg-red-600 text-white text-xs"
                    aria-label={`${favoritesCount} favoris`}
                  >
                    {favoritesCount}
                  </Badge>
                )}
              </div>

              <Button
                variant="outline"
                onClick={() => setShowComparison(true)}
                className="bg-slate-800/80 backdrop-blur-sm border-slate-600 text-white hover:bg-slate-700 transition-all duration-300 hover:scale-105 focus:ring-2 focus:ring-green-500 focus:ring-offset-2 focus:ring-offset-slate-900 text-xs sm:text-sm h-8 sm:h-10 px-2 sm:px-4"
                aria-label={`Comparer ${comparisonProducts.length} produit${comparisonProducts.length !== 1 ? 's' : ''}`}
                aria-expanded={showComparison}
              >
                <BarChart3 className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" aria-hidden="true" />
                <span className="hidden sm:inline">Comparer</span>
                {comparisonProducts.length > 0 && (
                  <Badge
                    variant="secondary"
                    className="ml-1 sm:ml-2 bg-green-600 text-white text-xs animate-bounce"
                    aria-label={`${comparisonProducts.length} produits en comparaison`}
                  >
                    {comparisonProducts.length}
                  </Badge>
                )}
              </Button>

              <Button
                variant="outline"
                onClick={clearFilters}
                className="bg-slate-800/80 backdrop-blur-sm border-slate-600 text-white hover:bg-slate-700 transition-all duration-300 hover:scale-105 focus:ring-2 focus:ring-slate-500 focus:ring-offset-2 focus:ring-offset-slate-900 text-xs sm:text-sm h-8 sm:h-10 px-2 sm:px-4"
                aria-label="Effacer tous les filtres"
              >
                <X className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" aria-hidden="true" />
                <span className="hidden sm:inline">Effacer tout</span>
                <span className="sm:hidden">Effacer</span>
              </Button>
            </div>
          </div>
        </section>

        {/* Filtres avancés */}
        {showFilters && (
          <section
            id="advanced-filters"
            className="py-4 sm:py-6 lg:py-8 px-3 sm:px-4 bg-slate-800/30 backdrop-blur-sm"
            role="region"
            aria-label={t('marketplace.filters.advanced')}
          >
            <div className="container mx-auto max-w-6xl">
              <Card className="bg-slate-800/80 backdrop-blur-sm border-slate-600 border-border/50">
                <CardContent className="p-3 sm:p-4 lg:p-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                    {/* Catégorie */}
                    <div>
                      <label className="text-xs sm:text-sm font-medium text-slate-300 mb-1.5 sm:mb-2 block">
                        Catégorie
                      </label>
                      <select
                        value={filters.category}
                        onChange={e => updateFilter({ category: e.target.value })}
                        className="w-full px-3 py-2 min-h-[44px] h-11 sm:h-10 bg-slate-700 border-slate-600 text-white rounded-md focus:border-blue-500 focus:ring-blue-500 text-base sm:text-sm touch-manipulation cursor-pointer"
                      >
                        <option value="all">Toutes les catégories</option>
                        {categories.map(cat => (
                          <option key={cat} value={cat}>
                            {cat}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Type de produit */}
                    <div>
                      <label className="text-xs sm:text-sm font-medium text-slate-300 mb-1.5 sm:mb-2 block">
                        Type
                      </label>
                      <select
                        value={filters.productType}
                        onChange={e => updateFilter({ productType: e.target.value })}
                        className="w-full px-3 py-2 min-h-[44px] h-11 sm:h-10 bg-slate-700 border-slate-600 text-white rounded-md focus:border-blue-500 focus:ring-blue-500 text-base sm:text-sm touch-manipulation cursor-pointer"
                      >
                        <option value="all">Tous les types</option>
                        {productTypes.map(type => (
                          <option key={type} value={type}>
                            {type}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Type de licence */}
                    <div>
                      <label className="text-xs sm:text-sm font-medium text-slate-300 mb-1.5 sm:mb-2 block">
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
                        className="w-full px-3 py-2 min-h-[44px] h-11 sm:h-10 bg-slate-700 border-slate-600 text-white rounded-md focus:border-blue-500 focus:ring-blue-500 text-base sm:text-sm touch-manipulation cursor-pointer"
                      >
                        <option value="all">Toutes</option>
                        <option value="standard">Standard</option>
                        <option value="plr">PLR</option>
                        <option value="copyrighted">Droit d'auteur</option>
                      </select>
                    </div>

                    {/* Prix */}
                    <div>
                      <label className="text-xs sm:text-sm font-medium text-slate-300 mb-1.5 sm:mb-2 block">
                        Prix
                      </label>
                      <select
                        value={filters.priceRange}
                        onChange={e => updateFilter({ priceRange: e.target.value })}
                        className="w-full px-3 py-2 min-h-[44px] h-11 sm:h-10 bg-slate-700 border-slate-600 text-white rounded-md focus:border-blue-500 focus:ring-blue-500 text-base sm:text-sm touch-manipulation cursor-pointer"
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
                      <label className="text-xs sm:text-sm font-medium text-slate-300 mb-1.5 sm:mb-2 block">
                        Note minimum
                      </label>
                      <select
                        value={filters.rating}
                        onChange={e => updateFilter({ rating: e.target.value })}
                        className="w-full px-3 py-2 min-h-[44px] h-11 sm:h-10 bg-slate-700 border-slate-600 text-white rounded-md focus:border-blue-500 focus:ring-blue-500 text-base sm:text-sm touch-manipulation cursor-pointer"
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
                        className="rounded border-slate-600 bg-slate-700 text-blue-500 focus:ring-blue-500 h-4 w-4"
                      />
                      <label htmlFor="verifiedOnly" className="text-xs sm:text-sm text-slate-300">
                        Boutiques vérifiées uniquement
                      </label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="featuredOnly"
                        checked={filters.featuredOnly}
                        onChange={e => updateFilter({ featuredOnly: e.target.checked })}
                        className="rounded border-slate-600 bg-slate-700 text-blue-500 focus:ring-blue-500 h-4 w-4"
                      />
                      <label htmlFor="featuredOnly" className="text-xs sm:text-sm text-slate-300">
                        Produits en vedette uniquement
                      </label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="inStock"
                        checked={filters.inStock}
                        onChange={e => updateFilter({ inStock: e.target.checked })}
                        className="rounded border-slate-600 bg-slate-700 text-blue-500 focus:ring-blue-500 h-4 w-4"
                      />
                      <label htmlFor="inStock" className="text-xs sm:text-sm text-slate-300">
                        En stock uniquement
                      </label>
                    </div>
                  </div>

                  {/* Tags */}
                  <div className="mt-4 sm:mt-6">
                    <label className="text-xs sm:text-sm font-medium text-slate-300 mb-2 block">
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
                            filters.tags.includes(tag)
                              ? 'bg-blue-600 text-white'
                              : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
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

        {/* Contrôles de tri et vue */}
        <section className="py-4 sm:py-6 px-3 sm:px-4">
          <div className="container mx-auto max-w-6xl">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4">
              <div className="flex flex-wrap items-center gap-2 sm:gap-4">
                <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-white">
                  Tous les produits
                </h2>
                <Badge
                  variant="secondary"
                  className="bg-slate-700 text-slate-300 text-xs sm:text-sm"
                >
                  {pagination.totalItems} produit{pagination.totalItems !== 1 ? 's' : ''}
                </Badge>
                {filters.search || filters.tags.length > 0 ? (
                  <Badge variant="secondary" className="bg-blue-600 text-white text-xs sm:text-sm">
                    {displayProducts.length} résultat{displayProducts.length !== 1 ? 's' : ''}{' '}
                    affiché{displayProducts.length !== 1 ? 's' : ''}
                  </Badge>
                ) : null}
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 w-full sm:w-auto">
                {/* Tri */}
                <div className="flex items-center gap-2">
                  <label className="text-xs sm:text-sm text-slate-300 hidden sm:block">
                    {t('marketplace.sorting.label')}
                  </label>
                  <select
                    value={filters.sortBy}
                    onChange={e => updateFilter({ sortBy: e.target.value })}
                    className="flex-1 sm:flex-initial px-3 py-2 min-h-[44px] h-11 sm:h-10 bg-slate-700 border-slate-600 text-white rounded-md text-base sm:text-sm focus:border-blue-500 focus:ring-blue-500 touch-manipulation cursor-pointer"
                  >
                    {SORT_OPTIONS.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      updateFilter({ sortOrder: filters.sortOrder === 'asc' ? 'desc' : 'asc' })
                    }
                    className="bg-slate-700 border-slate-600 text-white hover:bg-slate-600 transition-all duration-300 h-9 sm:h-10 w-9 sm:w-10 p-0"
                  >
                    {filters.sortOrder === 'asc' ? (
                      <SortAsc className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    ) : (
                      <SortDesc className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    )}
                  </Button>
                </div>

                {/* Mode de vue */}
                <div className="flex items-center gap-1">
                  <Button
                    variant={filters.viewMode === 'grid' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => updateFilter({ viewMode: 'grid' })}
                    className="bg-slate-700 border-slate-600 text-white hover:bg-slate-600 transition-all duration-300 h-9 sm:h-10 w-9 sm:w-10 p-0"
                  >
                    <Grid3X3 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  </Button>
                  <Button
                    variant={filters.viewMode === 'list' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => updateFilter({ viewMode: 'list' })}
                    className="bg-slate-700 border-slate-600 text-white hover:bg-slate-600 transition-all duration-300 h-9 sm:h-10 w-9 sm:w-10 p-0"
                  >
                    <List className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Note: sections par type supprimées => tout s'affiche ensemble dans la liste ci-dessous */}

        {/* Liste des produits */}
        <section
          ref={productsRef}
          id="main-content"
          className="py-4 sm:py-6 px-3 sm:px-4"
          role="main"
          aria-label={t('marketplace.productList.ariaLabel')}
        >
          <div className="w-full mx-auto max-w-7xl px-0 sm:px-4">
            {error ? (
              <div
                className="text-center py-8 sm:py-12 lg:py-16 px-2"
                role="alert"
                aria-live="polite"
              >
                <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-full bg-red-500/10 mx-auto mb-4 flex items-center justify-center">
                  <AlertCircle
                    className="h-8 w-8 sm:h-10 sm:w-10 text-red-500"
                    aria-hidden="true"
                  />
                </div>
                <h3 className="text-xl sm:text-2xl font-semibold text-white mb-2">
                  {t('marketplace.error.title', 'Erreur de chargement')}
                </h3>
                <p className="text-sm sm:text-base text-slate-400 mb-4 sm:mb-6 max-w-md mx-auto">
                  {error}
                </p>
                <Button
                  onClick={() => {
                    setError(null);
                    // Utiliser React Query pour refetch au lieu de fetchProducts
                    if (!shouldUseRPCFiltering) {
                      queryClient.invalidateQueries({ queryKey: ['marketplace-products'] });
                    } else {
                      fetchProducts();
                    }
                  }}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold h-10 sm:h-12 px-4 sm:px-8 hover:from-blue-700 hover:to-purple-700 transition-all duration-300 hover:scale-105 text-xs sm:text-sm"
                  aria-label={t('marketplace.error.retry', 'Réessayer')}
                >
                  {t('marketplace.error.retry', 'Réessayer')}
                  <ArrowRight className="ml-2 h-4 w-4 sm:h-5 sm:w-5" />
                </Button>
              </div>
            ) : loading && !hasLoadedOnce ? (
              // ✅ OPTIMISATION: Afficher skeleton au premier chargement
              <div className="w-full">
                <ProductListSkeleton count={pagination.itemsPerPage} />
              </div>
            ) : displayProducts.length > 0 ? (
              <>
                {/* Recommandations personnalisées (si utilisateur connecté et aucun filtre actif) */}
                {userId &&
                  filters.category === 'all' &&
                  filters.search === '' &&
                  filters.productType === 'all' && (
                    <div className="mb-12">
                      <PersonalizedRecommendations userId={userId} limit={6} />
                    </div>
                  )}

                {/* Indicateur de chargement discret en haut si rechargement */}
                {isLoadingProducts && hasLoadedOnce && (
                  <div className="flex justify-center mb-4">
                    <div className="h-1 w-32 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 rounded-full animate-pulse" />
                  </div>
                )}

                {/* ✅ OPTIMISATION: Utiliser VirtualizedProductGrid dès 12 produits (1 page) pour meilleures performances */}
                {displayProducts.length >= 12 ? (
                  <VirtualizedProductGrid
                    count={displayProducts.length}
                    renderItem={renderProductItem}
                    loading={isLoadingProducts && hasLoadedOnce}
                    loadingCount={pagination.itemsPerPage}
                    className={
                      isLoadingProducts && hasLoadedOnce
                        ? 'opacity-75 transition-opacity duration-300'
                        : ''
                    }
                    emptyMessage={t('marketplace.noProducts')}
                  />
                ) : (
                  <ProductGrid
                    className={
                      isLoadingProducts && hasLoadedOnce
                        ? 'opacity-75 transition-opacity duration-300'
                        : ''
                    }
                  >
                    {renderedProducts}
                  </ProductGrid>
                )}

                {/* Pagination */}
                {totalPages > 1 && (
                  <nav
                    className="flex flex-wrap justify-center items-center gap-1.5 sm:gap-2 mt-8 sm:mt-12"
                    role="navigation"
                    aria-label={t('marketplace.pagination.ariaLabel')}
                  >
                    <Button
                      variant="outline"
                      onClick={() => goToPage(pagination.currentPage - 1)}
                      disabled={!canGoPrevious}
                      className="bg-slate-800 border-slate-600 text-white hover:bg-slate-700 disabled:opacity-50 transition-all duration-300 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-slate-900 h-8 sm:h-10 w-8 sm:w-10 p-0"
                      aria-label={t('marketplace.pagination.previous')}
                    >
                      <ChevronLeft className="h-3.5 w-3.5 sm:h-4 sm:w-4" aria-hidden="true" />
                    </Button>

                    {Array.from({ length: Math.min(7, totalPages) }, (_, i) => {
                      const page: number = (() => {
                        if (totalPages <= 7) {
                          return i + 1;
                        } else if (pagination.currentPage <= 4) {
                          return i + 1;
                        } else if (pagination.currentPage >= totalPages - 3) {
                          return totalPages - 6 + i;
                        } else {
                          return pagination.currentPage - 3 + i;
                        }
                      })();

                      const isActive = page === pagination.currentPage;

                      return (
                        <Button
                          key={page}
                          variant={isActive ? 'default' : 'outline'}
                          onClick={() => goToPage(page)}
                          className={`${
                            isActive
                              ? 'bg-blue-600 text-white'
                              : 'bg-slate-800 border-slate-600 text-white hover:bg-slate-700'
                          } transition-all duration-300 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-slate-900 h-8 sm:h-10 w-8 sm:w-10 p-0 text-xs sm:text-sm`}
                          aria-label={`Page ${page}`}
                          aria-current={isActive ? 'page' : undefined}
                        >
                          {page}
                        </Button>
                      );
                    })}

                    <Button
                      variant="outline"
                      onClick={() => goToPage(pagination.currentPage + 1)}
                      disabled={!canGoNext}
                      className="bg-slate-800 border-slate-600 text-white hover:bg-slate-700 disabled:opacity-50 transition-all duration-300 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-slate-900 h-8 sm:h-10 w-8 sm:w-10 p-0"
                      aria-label={t('marketplace.pagination.next')}
                    >
                      <ChevronRight className="h-3.5 w-3.5 sm:h-4 sm:w-4" aria-hidden="true" />
                    </Button>
                  </nav>
                )}
              </>
            ) : (
              <div className="text-center py-8 sm:py-12 lg:py-16 px-2">
                <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-full bg-slate-700 mx-auto mb-4 flex items-center justify-center">
                  <ShoppingCart className="h-8 w-8 sm:h-10 sm:w-10 text-slate-400" />
                </div>
                <h3 className="text-xl sm:text-2xl font-semibold text-white mb-2">
                  {t('marketplace.noProducts')}
                </h3>
                <p className="text-sm sm:text-base text-slate-400 mb-4 sm:mb-6 max-w-md mx-auto">
                  {filters.search
                    ? t('marketplace.noProductsSearch')
                    : t('marketplace.noProductsDefault')}
                </p>
                <Link to="/auth">
                  <Button className="min-h-[44px] bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold h-11 sm:h-12 px-4 sm:px-8 hover:from-blue-700 hover:to-purple-700 transition-all duration-300 hover:scale-105 text-xs sm:text-sm">
                    {t('marketplace.createStore')}
                    <ArrowRight className="ml-2 h-4 w-4 sm:h-5 sm:w-5" />
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </section>

        {/* Call to Action */}
        <section className="py-8 sm:py-12 lg:py-16 px-3 sm:px-4 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 relative overflow-hidden">
          <div className="absolute inset-0 bg-black/20"></div>
          <div className="container mx-auto max-w-4xl text-center relative z-10">
            <div className="flex items-center justify-center gap-1 sm:gap-2 mb-3 sm:mb-4">
              <Rocket className="h-6 w-6 sm:h-8 sm:w-8 text-white animate-bounce" />
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white">
                {getValue('marketplace.cta.title')}
              </h2>
              <Rocket className="h-6 w-6 sm:h-8 sm:w-8 text-white animate-bounce" />
            </div>
            <p className="text-base sm:text-lg lg:text-xl text-blue-100 mb-4 sm:mb-6 lg:mb-8 px-2">
              {getValue('marketplace.cta.subtitle')}
            </p>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center px-2">
              <Link to="/auth" className="w-full sm:w-auto">
                <Button
                  size="lg"
                  className="bg-white text-blue-600 font-semibold h-11 sm:h-14 px-6 sm:px-8 hover:bg-blue-50 transition-all duration-300 hover:scale-105 w-full sm:w-auto text-sm sm:text-base"
                >
                  {getValue('marketplace.cta.startFree')}
                  <ArrowRight className="ml-2 h-4 w-4 sm:h-5 sm:w-5" />
                </Button>
              </Link>
              <Link to="/community" className="w-full sm:w-auto">
                <Button
                  size="lg"
                  variant="outline"
                  className="border-white text-white hover:bg-white hover:text-blue-600 h-11 sm:h-14 px-6 sm:px-8 transition-all duration-300 hover:scale-105 w-full sm:w-auto text-sm sm:text-base"
                >
                  <Users className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
                  {getValue('marketplace.cta.joinCommunity')}
                </Button>
              </Link>
            </div>
          </div>
        </section>

        <MarketplaceFooter />

        {/* Modales */}
        <AdvancedFilters
          isOpen={showAdvancedSearch}
          onClose={() => setShowAdvancedSearch(false)}
          filters={filters}
          onFiltersChange={updateFilter}
          categories={categories}
          productTypes={productTypes}
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
      </div>
    </>
  );
};

export default Marketplace;
