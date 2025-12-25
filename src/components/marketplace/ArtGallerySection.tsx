/**
 * ArtGallerySection - Section dédiée pour mettre en avant les œuvres d'artistes
 * Affiche une galerie élégante des œuvres disponibles
 *
 * Date: 31 Janvier 2025
 */

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/integrations/supabase/client';
import { Product } from '@/types/marketplace';
import { ArtistProductCard } from '@/components/products/ArtistProductCard';
import { transformToUnifiedProduct } from '@/lib/product-transform';
import { CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Palette, Sparkles, ArrowRight, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { logger } from '@/lib/logger';

export function ArtGallerySection() {
  const { t: _t } = useTranslation();
  const [artworks, setArtworks] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchArtworks = async () => {
      try {
        setLoading(true);
        setError(null);

        const { data, error: fetchError } = await supabase
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
            ),
            artist_products!inner (
              artist_type,
              artist_name,
              artist_bio,
              artwork_title,
              artwork_year,
              artwork_medium,
              artwork_dimensions,
              artwork_edition_type,
              edition_number,
              total_editions,
              certificate_of_authenticity,
              shipping_fragile,
              shipping_insurance_required
            )
          `
          )
          .eq('product_type', 'artist')
          .eq('is_active', true)
          .eq('is_draft', false)
          .order('created_at', { ascending: false })
          .limit(12);

        if (fetchError) {
          logger.error('Error fetching artworks:', fetchError);
          throw fetchError;
        }

        setArtworks((data || []) as Product[]);
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'Erreur lors du chargement des œuvres';
        logger.error('Error in ArtGallerySection:', err);
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    fetchArtworks();
  }, []);

  if (loading) {
    return (
      <section className="py-12 px-4 bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
        <div className="container mx-auto max-w-7xl">
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-pink-600" />
          </div>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="py-12 px-4 bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
        <div className="container mx-auto max-w-7xl">
          <div className="text-center py-12">
            <p className="text-red-600 dark:text-red-400">{error}</p>
          </div>
        </div>
      </section>
    );
  }

  if (artworks.length === 0) {
    return null; // Ne rien afficher si aucune œuvre
  }

  return (
    <section className="py-12 sm:py-16 lg:py-20 px-4 bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      <div className="container mx-auto max-w-7xl">
        {/* Header */}
        <CardHeader className="text-center mb-8 sm:mb-12">
          <div className="flex items-center justify-center gap-2 sm:gap-3 mb-4 sm:mb-6">
            <Palette className="h-8 w-8 sm:h-10 sm:w-10 text-pink-600 dark:text-pink-400" />
            <CardTitle className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white">
              Galerie d'Art
            </CardTitle>
            <Sparkles className="h-8 w-8 sm:h-10 sm:w-10 text-purple-600 dark:text-purple-400" />
          </div>
          <p className="text-base sm:text-lg text-gray-600 dark:text-gray-300 max-w-3xl mx-auto leading-relaxed">
            Découvrez des œuvres uniques d'artistes talentueux. Chaque pièce est authentique et
            certifiée.
          </p>
        </CardHeader>

        {/* Grille d'œuvres */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 mb-8 sm:mb-12">
          {artworks.map(artwork => {
            try {
              const unifiedProduct = transformToUnifiedProduct(artwork);
              if (unifiedProduct.type !== 'artist') return null;

              return (
                <ArtistProductCard
                  key={artwork.id}
                  product={unifiedProduct}
                  variant="marketplace"
                  onAction={(action, product) => {
                    if (action === 'view') {
                      window.location.href = `/stores/${artwork.stores?.slug}/products/${artwork.slug}`;
                    } else if (action === 'buy') {
                      // Logique d'achat - rediriger vers checkout
                      const checkoutParams = new URLSearchParams({
                        productId: product.id,
                        storeId: product.store_id,
                      });
                      window.location.href = `/checkout?${checkoutParams.toString()}`;
                    }
                  }}
                />
              );
            } catch (err) {
              logger.error(`Error transforming artwork ${artwork.id}:`, err);
              return null;
            }
          })}
        </div>

        {/* Call to Action */}
        <div className="text-center">
          <Link to="/marketplace?productType=artist">
            <Button
              size="lg"
              className="bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 h-12 sm:h-14 px-6 sm:px-8 text-sm sm:text-base"
            >
              Voir toutes les œuvres d'artistes
              <ArrowRight className="ml-2 h-4 w-4 sm:h-5 sm:w-5" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
