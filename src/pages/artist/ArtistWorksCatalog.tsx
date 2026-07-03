/**
 * Catalogue public des œuvres d'artistes — landing SEO /art
 */

import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Palette, Search, Sparkles } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { SEOMeta, ItemListSchema } from '@/components/seo';
import { UnifiedProductCard } from '@/components/products/UnifiedProductCard';
import { useMarketplaceProducts } from '@/hooks/useMarketplaceProducts';
import type { FilterState, PaginationState } from '@/types/marketplace';
import type { ArtistProduct } from '@/types/unified-product';

const ARTIST_CATALOG_FILTERS: FilterState = {
  search: '',
  category: 'all',
  productType: 'artist',
  priceRange: 'all',
  rating: 'all',
  sortBy: 'newest',
  sortOrder: 'desc',
  viewMode: 'grid',
  tags: [],
  verifiedOnly: false,
  featuredOnly: false,
  inStock: false,
  difficulty: 'all',
  accessType: 'all',
  courseDuration: 'all',
};

export default function ArtistWorksCatalog() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const filters = useMemo<FilterState>(
    () => ({
      ...ARTIST_CATALOG_FILTERS,
      search: search.trim(),
    }),
    [search]
  );

  const pagination = useMemo<PaginationState>(
    () => ({
      currentPage: page,
      itemsPerPage: 12,
    }),
    [page]
  );

  const { products, totalCount, isLoading, error } = useMarketplaceProducts({
    filters,
    pagination,
    hasSearchQuery: search.trim().length > 0,
    shouldUseRPCFiltering: true,
  });

  const artistProducts = products as ArtistProduct[];
  const totalPages = Math.max(1, Math.ceil(totalCount / pagination.itemsPerPage));

  const schemaItems = useMemo(
    () =>
      artistProducts.slice(0, 20).map(product => ({
        id: product.id,
        name: product.name,
        url: `/artist/${product.id}`,
        image: product.image_url ?? undefined,
        description: product.short_description ?? product.description ?? undefined,
        price: product.promotional_price ?? product.price,
        currency: product.currency,
        rating: product.rating ?? undefined,
      })),
    [artistProducts]
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <SEOMeta
        title="Œuvres d'artistes | Emarzona"
        description="Découvrez des œuvres originales d'artistes sur Emarzona : peintures, illustrations, photographies, éditions limitées et certificats d'authenticité."
        url="https://www.emarzona.com/art"
        type="website"
        keywords="art, artistes, œuvres originales, marketplace art, achat art en ligne, Emarzona"
      />

      {schemaItems.length > 0 && (
        <ItemListSchema
          name="Œuvres d'artistes Emarzona"
          description="Catalogue public des œuvres d'artistes disponibles sur Emarzona"
          url="/art"
          numberOfItems={totalCount}
          items={schemaItems}
        />
      )}

      <section className="bg-gradient-to-r from-violet-700 to-indigo-900 text-white">
        <div className="container mx-auto px-4 py-12 md:py-16">
          <div className="max-w-3xl">
            <div className="flex items-center gap-2 text-violet-100 mb-3">
              <Palette className="h-5 w-5" aria-hidden="true" />
              <span className="text-sm font-medium">Art & créateurs</span>
            </div>
            <h1 className="text-2xl md:text-4xl font-bold tracking-tight mb-3">
              Œuvres d&apos;artistes
            </h1>
            <p className="text-violet-50 text-sm md:text-base max-w-2xl">
              Achetez des pièces uniques avec certificat d&apos;authenticité, explorez les
              collections thématiques ou participez aux enchères en direct.
            </p>
            <div className="flex flex-wrap gap-3 mt-6">
              <Button variant="secondary" size="sm" asChild>
                <Link to="/collections">Collections</Link>
              </Button>
              <Button variant="outline" size="sm" className="text-white border-white/40" asChild>
                <Link to="/auctions">Enchères</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <div className="container mx-auto px-4 py-8 space-y-6">
        <div className="flex flex-col md:flex-row gap-4 md:items-center md:justify-between">
          <div className="relative flex-1 max-w-xl">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={e => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Rechercher une œuvre, un artiste..."
              className="pl-9"
              aria-label="Rechercher une œuvre"
            />
          </div>
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <Sparkles className="h-4 w-4" aria-hidden="true" />
            <span>
              {isLoading ? 'Chargement...' : `${totalCount.toLocaleString('fr-FR')} œuvres`}
            </span>
            <Button variant="outline" size="sm" asChild>
              <Link to="/marketplace?type=artist">Voir sur le marketplace</Link>
            </Button>
          </div>
        </div>

        {error && (
          <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
            Impossible de charger les œuvres. Réessayez dans un instant.
          </div>
        )}

        {isLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-72 w-full rounded-xl" />
            ))}
          </div>
        ) : artistProducts.length === 0 ? (
          <div className="text-center py-16">
            <Palette className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-lg font-semibold mb-2">Aucune œuvre trouvée</h2>
            <p className="text-muted-foreground text-sm mb-4">
              Essayez un autre terme ou parcourez les collections et enchères.
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <Button asChild>
                <Link to="/collections">Collections</Link>
              </Button>
              <Button variant="outline" asChild>
                <Link to="/auctions">Enchères</Link>
              </Button>
            </div>
          </div>
        ) : (
          <>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {artistProducts.map(product => (
                <UnifiedProductCard key={product.id} product={product} variant="marketplace" />
              ))}
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-3 pt-4">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                >
                  Précédent
                </Button>
                <span className="text-sm text-muted-foreground">
                  Page {page} / {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages}
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                >
                  Suivant
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
