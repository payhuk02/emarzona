/**
 * TypeSpecificSection - Section dédiée par type de produit
 * Affiche des sections "Tendances", "Nouveautés", "Meilleures ventes" pour chaque type
 *
 * Date: 31 Janvier 2025
 */

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/integrations/supabase/client';
import { Product } from '@/types/marketplace';
import { UnifiedProductCard } from '@/components/products/UnifiedProductCard';
import { transformToUnifiedProduct } from '@/lib/product-transform';
import { CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowRight, Loader2, TrendingUp, Sparkles, Award } from 'lucide-react';
import { Link } from 'react-router-dom';
import { logger } from '@/lib/logger';
import { ProductType } from '@/types/unified-product';

interface TypeSpecificSectionProps {
  productType: ProductType;
  title: string;
  subtitle: string;
  icon: React.ComponentType<{ className?: string }>;
  filterType?: 'trending' | 'new' | 'bestsellers';
  limit?: number;
  className?: string;
}

export function TypeSpecificSection({
  productType,
  title,
  subtitle,
  icon: Icon,
  filterType = 'trending',
  limit = 8,
  className,
}: TypeSpecificSectionProps) {
  const { t: _t } = useTranslation();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        setError(null);

        let  query= supabase
          .from('products')
          .select(
            `
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
          `
          )
          .eq('product_type', productType)
          .eq('is_active', true)
          .eq('is_draft', false);

        // Appliquer le filtre selon le type
        switch (filterType) {
          case 'trending':
            // Tendances = produits avec le plus de ventes/avis récents
            // NOTE: `purchases_count` n'existe pas sur certaines DB -> éviter 400 Bad Request
            // Fallback "tendances" basé sur signaux existants: avis + note + récence
            query = query
              .order('reviews_count', { ascending: false, nullsFirst: false })
              .order('rating', { ascending: false, nullsFirst: false })
              .order('created_at', { ascending: false });
            break;
          case 'new':
            // Nouveautés = produits les plus récents
            query = query.order('created_at', { ascending: false });
            break;
          case 'bestsellers':
            // Meilleures ventes = produits avec le plus d'avis positifs
            query = query
              .order('reviews_count', { ascending: false, nullsFirst: false })
              .gte('rating', 4.0); // Au moins 4 étoiles
            break;
        }

        query = query.limit(limit);

        const { data, error: fetchError } = await query;

        if (fetchError) {
          logger.error(`Error fetching ${productType} products:`, fetchError);
          throw fetchError;
        }

        setProducts((data || []) as Product[]);
      } catch (err) {
        const errorMessage =
          err instanceof Error
            ? err.message
            : `Erreur lors du chargement des ${title.toLowerCase()}`;
        logger.error(`Error in TypeSpecificSection (${productType}):`, err);
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [productType, filterType, limit, title]);

  if (loading) {
    return (
      <section className={`py-12 px-4 ${className || ''}`}>
        <div className="container mx-auto max-w-7xl">
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          </div>
        </div>
      </section>
    );
  }

  if (error) {
    // Ne pas afficher d'erreur, simplement ne rien afficher
    return null;
  }

  if (products.length === 0) {
    return null; // Ne rien afficher si aucun produit
  }

  // Couleurs et styles selon le type
  const  typeStyles: Record<ProductType, { bg: string; iconColor: string; buttonGradient: string }> =
    {
      digital: {
        bg: 'from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20',
        iconColor: 'text-blue-600 dark:text-blue-400',
        buttonGradient: 'from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700',
      },
      physical: {
        bg: 'from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20',
        iconColor: 'text-green-600 dark:text-green-400',
        buttonGradient: 'from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700',
      },
      service: {
        bg: 'from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20',
        iconColor: 'text-purple-600 dark:text-purple-400',
        buttonGradient: 'from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700',
      },
      course: {
        bg: 'from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20',
        iconColor: 'text-orange-600 dark:text-orange-400',
        buttonGradient: 'from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700',
      },
      artist: {
        bg: 'from-pink-50 to-purple-50 dark:from-pink-900/20 dark:to-purple-900/20',
        iconColor: 'text-pink-600 dark:text-pink-400',
        buttonGradient: 'from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700',
      },
    };

  const styles = typeStyles[productType] || typeStyles.digital;

  // Icône selon le type de filtre
  const FilterIcon =
    filterType === 'trending' ? TrendingUp : filterType === 'new' ? Sparkles : Award;

  return (
    <section
      className={`py-12 sm:py-16 lg:py-20 px-4 bg-gradient-to-br ${styles.bg} ${className || ''}`}
    >
      <div className="container mx-auto max-w-7xl">
        {/* Header */}
        <CardHeader className="text-center mb-8 sm:mb-12">
          <div className="flex items-center justify-center gap-2 sm:gap-3 mb-4 sm:mb-6">
            <Icon className={`h-8 w-8 sm:h-10 sm:w-10 ${styles.iconColor}`} />
            <CardTitle className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white">
              {title}
            </CardTitle>
            <FilterIcon className={`h-6 w-6 sm:h-8 sm:w-8 ${styles.iconColor}`} />
          </div>
          <p className="text-base sm:text-lg text-gray-600 dark:text-gray-300 max-w-3xl mx-auto leading-relaxed">
            {subtitle}
          </p>
        </CardHeader>

        {/* Grille de produits */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 mb-8 sm:mb-12">
          {products.map(product => {
            try {
              const unifiedProduct = transformToUnifiedProduct(product);
              return (
                <UnifiedProductCard
                  key={product.id}
                  product={unifiedProduct}
                  variant="marketplace"
                  showAffiliate={true}
                  showActions={true}
                  onAction={(action, prod) => {
                    if (action === 'view') {
                      window.location.href = `/stores/${product.stores?.slug}/products/${product.slug}`;
                    } else if (action === 'buy') {
                      const checkoutParams = new URLSearchParams({
                        productId: prod.id,
                        storeId: prod.store_id,
                      });
                      window.location.href = `/checkout?${checkoutParams.toString()}`;
                    }
                  }}
                />
              );
            } catch (err) {
              logger.error(`Error transforming product ${product.id}:`, err);
              return null;
            }
          })}
        </div>

        {/* Call to Action */}
        <div className="text-center">
          <Link to={`/marketplace?productType=${productType}`}>
            <Button
              size="lg"
              className={`bg-gradient-to-r ${styles.buttonGradient} text-white shadow-lg hover:shadow-xl transition-all duration-300 h-12 sm:h-14 px-6 sm:px-8 text-sm sm:text-base`}
            >
              Voir tous les {title.toLowerCase()}
              <ArrowRight className="ml-2 h-4 w-4 sm:h-5 sm:w-5" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}






