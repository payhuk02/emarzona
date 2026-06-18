/**
 * Catalogue public des cours en ligne — landing SEO /courses
 */

import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { GraduationCap, Search, BookOpen } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { SEOMeta } from '@/components/seo/SEOMeta';
import { CourseProductCard } from '@/components/products/CourseProductCard';
import { useMarketplaceProducts } from '@/hooks/useMarketplaceProducts';
import type { FilterState, PaginationState } from '@/types/marketplace';
import type { CourseProduct } from '@/types/unified-product';

const COURSE_CATALOG_FILTERS: FilterState = {
  search: '',
  category: 'all',
  productType: 'course',
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

export default function CoursesCatalog() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const filters = useMemo<FilterState>(
    () => ({
      ...COURSE_CATALOG_FILTERS,
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

  const courseProducts = products as CourseProduct[];
  const totalPages = Math.max(1, Math.ceil(totalCount / pagination.itemsPerPage));

  return (
    <div className="min-h-screen bg-gray-50">
      <SEOMeta
        title="Cours en ligne | Emarzona"
        description="Découvrez des formations et cours en ligne sur Emarzona : développement, business, design, marketing et plus encore."
        url="https://www.emarzona.com/courses"
        type="website"
        keywords="cours en ligne, formation, e-learning, apprentissage, Emarzona"
      />

      <section className="bg-gradient-to-r from-orange-600 to-orange-800 text-white">
        <div className="container mx-auto px-4 py-12 md:py-16">
          <div className="max-w-3xl">
            <div className="flex items-center gap-2 text-orange-100 mb-3">
              <GraduationCap className="h-5 w-5" aria-hidden="true" />
              <span className="text-sm font-medium">Formations en ligne</span>
            </div>
            <h1 className="text-2xl md:text-4xl font-bold tracking-tight mb-3">
              Catalogue des cours
            </h1>
            <p className="text-orange-50 text-sm md:text-base max-w-2xl">
              Apprenez à votre rythme avec des cours vidéo, quiz et certificats. Filtrez par
              catégorie et trouvez la formation adaptée à vos objectifs.
            </p>
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
              placeholder="Rechercher un cours, une compétence..."
              className="pl-9"
              aria-label="Rechercher un cours"
            />
          </div>
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <BookOpen className="h-4 w-4" aria-hidden="true" />
            <span>
              {isLoading ? 'Chargement...' : `${totalCount.toLocaleString('fr-FR')} cours`}
            </span>
            <Button variant="outline" size="sm" asChild>
              <Link to="/marketplace?type=course">Voir sur le marketplace</Link>
            </Button>
          </div>
        </div>

        {error && (
          <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
            Impossible de charger les cours. Réessayez dans un instant.
          </div>
        )}

        {isLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-72 w-full rounded-xl" />
            ))}
          </div>
        ) : courseProducts.length === 0 ? (
          <div className="text-center py-16">
            <GraduationCap className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-lg font-semibold mb-2">Aucun cours trouvé</h2>
            <p className="text-muted-foreground text-sm mb-4">
              Essayez un autre terme de recherche ou explorez le marketplace.
            </p>
            <Button asChild>
              <Link to="/marketplace?type=course">Parcourir le marketplace</Link>
            </Button>
          </div>
        ) : (
          <>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {courseProducts.map(product => (
                <CourseProductCard key={product.id} product={product} variant="marketplace" />
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
