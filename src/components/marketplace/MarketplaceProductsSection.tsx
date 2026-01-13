/**
 * Composant pour l'affichage des produits du marketplace
 * Gère l'affichage en grille/liste, la virtualisation, et la pagination
 */

import React, { useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';
import { ProductGrid } from '@/components/ui/ProductGrid';
import { VirtualizedProductGrid } from '@/components/ui/VirtualizedProductGrid';
import { ProductListSkeleton } from '@/components/ui/skeleton-enhanced';
import UnifiedProductCard from '@/components/products/UnifiedProductCard';
import { transformToUnifiedProduct } from '@/lib/product-transform';
import { Product } from '@/types/marketplace';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';

interface MarketplaceProductsSectionProps {
  products: Product[];
  loading: boolean;
  error: string | null;
  hasLoadedOnce: boolean;
  isLoadingProducts: boolean;
  pagination: {
    currentPage: number;
    itemsPerPage: number;
    totalItems: number;
  };
  onRetry: () => void;
  onPageChange: (page: number) => void;
  onBuyProduct: (product: { id: string; store_id?: string; slug?: string }) => void;
  userId?: string | null;
  showRecommendations: boolean;
  onRecommendationsRender?: (component: React.ReactNode) => void;
}

/**
 * Section d'affichage des produits du marketplace
 */
export const MarketplaceProductsSection = React.memo<MarketplaceProductsSectionProps>(
  ({
    products,
    loading,
    error,
    hasLoadedOnce,
    isLoadingProducts,
    pagination,
    onRetry,
    onPageChange,
    onBuyProduct,
    userId,
    showRecommendations,
    onRecommendationsRender,
  }) => {
    const { t } = useTranslation();
    const productsRef = useScrollAnimation<HTMLDivElement>();

    // Calculer le nombre total de pages
    const totalPages = Math.ceil(pagination.totalItems / pagination.itemsPerPage);
    const canGoPrevious = pagination.currentPage > 1;
    const canGoNext = pagination.currentPage < totalPages;

    // ✅ OPTIMISATION: Mémoriser la transformation des produits
    const transformedProducts = useMemo(
      () =>
        products.map(product =>
          transformToUnifiedProduct({
            ...product,
            description: product.description ?? undefined,
            short_description: product.short_description ?? undefined,
          } as Parameters<typeof transformToUnifiedProduct>[0])
        ),
      [products]
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
                onBuyProduct(prod);
              }
            }}
          />
        );
      },
      [transformedProducts, onBuyProduct]
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
                onBuyProduct(prod);
              }
            }}
          />
        )),
      [transformedProducts, onBuyProduct]
    );

    // Gestion du scroll vers le haut lors du changement de page
    const handlePageChange = useCallback(
      (page: number) => {
        onPageChange(page);
        // Scroll vers le début de la liste de produits
        setTimeout(() => {
          if (productsRef.current) {
            productsRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
          } else {
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }
        }, 100);
      },
      [onPageChange, productsRef]
    );

    return (
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
                <AlertCircle className="h-8 w-8 sm:h-10 sm:w-10 text-red-500" aria-hidden="true" />
              </div>
              <h3 className="text-xl sm:text-2xl font-semibold text-white mb-2">
                {t('marketplace.error.title', 'Erreur de chargement')}
              </h3>
              <p className="text-sm sm:text-base text-slate-400 mb-4 sm:mb-6 max-w-md mx-auto">
                {error}
              </p>
              <Button
                onClick={onRetry}
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
          ) : products.length > 0 ? (
            <>
              {/* Indicateur de chargement discret en haut si rechargement */}
              {isLoadingProducts && hasLoadedOnce && (
                <div className="flex justify-center mb-4">
                  <div className="h-1 w-32 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 rounded-full animate-pulse" />
                </div>
              )}

              {/* ✅ OPTIMISATION: Utiliser VirtualizedProductGrid dès 12 produits (1 page) */}
              {products.length >= 12 ? (
                <VirtualizedProductGrid
                  count={products.length}
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
                    onClick={() => handlePageChange(pagination.currentPage - 1)}
                    disabled={!canGoPrevious}
                    className="bg-slate-800 border-slate-600 text-white hover:bg-slate-700 disabled:opacity-50 transition-all duration-300 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-slate-900 h-8 sm:h-10 w-8 sm:w-10 p-0"
                    aria-label={t('marketplace.pagination.previous')}
                  >
                    <ChevronLeft className="h-3.5 w-3.5 sm:h-4 sm:w-4" aria-hidden="true" />
                  </Button>

                  {/* Numéros de page */}
                  {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                    let pageNum: number;
                    if (totalPages <= 7) {
                      pageNum = i + 1;
                    } else if (pagination.currentPage <= 4) {
                      pageNum = i + 1;
                    } else if (pagination.currentPage >= totalPages - 3) {
                      pageNum = totalPages - 6 + i;
                    } else {
                      pageNum = pagination.currentPage - 3 + i;
                    }

                    return (
                      <Button
                        key={pageNum}
                        variant={pagination.currentPage === pageNum ? 'default' : 'outline'}
                        onClick={() => handlePageChange(pageNum)}
                        className={`${
                          pagination.currentPage === pageNum
                            ? 'bg-blue-600 text-white'
                            : 'bg-slate-800 border-slate-600 text-white hover:bg-slate-700'
                        } transition-all duration-300 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-slate-900 h-8 sm:h-10 min-w-[32px] sm:min-w-[40px] px-2 sm:px-3`}
                        aria-label={t('marketplace.pagination.page', { page: pageNum })}
                        aria-current={pagination.currentPage === pageNum ? 'page' : undefined}
                      >
                        {pageNum}
                      </Button>
                    );
                  })}

                  <Button
                    variant="outline"
                    onClick={() => handlePageChange(pagination.currentPage + 1)}
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
            <div className="text-center py-12 sm:py-16 lg:py-20 px-2">
              <div className="h-20 w-20 sm:h-24 sm:w-24 rounded-full bg-slate-700/50 mx-auto mb-4 sm:mb-6 flex items-center justify-center">
                <AlertCircle
                  className="h-10 w-10 sm:h-12 sm:w-12 text-slate-400"
                  aria-hidden="true"
                />
              </div>
              <h3 className="text-xl sm:text-2xl font-semibold text-white mb-2 sm:mb-4">
                {t('marketplace.noProducts.title', 'Aucun produit trouvé')}
              </h3>
              <p className="text-sm sm:text-base text-slate-400 max-w-md mx-auto">
                {t(
                  'marketplace.noProducts.description',
                  'Essayez de modifier vos filtres ou votre recherche pour trouver plus de produits.'
                )}
              </p>
            </div>
          )}
        </div>
      </section>
    );
  }
);

MarketplaceProductsSection.displayName = 'MarketplaceProductsSection';
