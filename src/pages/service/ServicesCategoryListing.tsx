/**
 * Listing public des services par catégorie / sous-catégorie
 * Routes: /services/:categorySlug  et  /services/:categorySlug/:subSlug
 */

import { useMemo } from 'react';
import { Link, useParams } from 'react-router-dom';
import { AppPageShell } from '@/components/layout/AppPageShell';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { SEOMeta } from '@/components/seo';
import { useServiceCategoryTree } from '@/hooks/useServiceCategories';
import { formatServiceCategoryLabel } from '@/lib/services/service-categories';
import { ServiceListingAttributeBadges } from '@/components/service/ServiceListingAttributeBadges';
import { useFilteredServiceProducts } from '@/hooks/useFilteredProducts';
import { formatCurrency } from '@/lib/utils';
import { ChevronRight, ArrowLeft } from 'lucide-react';
import type { FilterState } from '@/types/marketplace';

export default function ServicesCategoryListing() {
  const { categorySlug, subSlug } = useParams<{ categorySlug: string; subSlug?: string }>();
  const { tree, data: categoryRows = [], isLoading: catsLoading } = useServiceCategoryTree();

  const parentFromSlug = useMemo(
    () => tree.find(p => p.slug === categorySlug) ?? null,
    [tree, categorySlug]
  );
  const nestedMatch = useMemo(() => {
    if (!categorySlug) return null;
    for (const p of tree) {
      const c = p.children.find(child => child.slug === categorySlug);
      if (c) return { parent: p, child: c };
    }
    return null;
  }, [tree, categorySlug]);

  const parent = parentFromSlug ?? nestedMatch?.parent ?? null;
  const child = useMemo(() => {
    if (subSlug) return parent?.children.find(c => c.slug === subSlug) ?? null;
    if (parentFromSlug) return null;
    return nestedMatch?.child ?? null;
  }, [subSlug, parent, parentFromSlug, nestedMatch]);

  const filters: FilterState = useMemo(
    () => ({
      search: '',
      category: 'all',
      productType: 'service',
      priceRange: 'all',
      rating: 'all',
      sortBy: 'created_at',
      sortOrder: 'desc',
      viewMode: 'grid',
      tags: [],
      verifiedOnly: false,
      featuredOnly: false,
      inStock: false,
      serviceParentCategoryId: child ? undefined : parent?.id,
      serviceCategoryId: child?.id,
    }),
    [parent?.id, child?.id]
  );

  const { data: products = [], isLoading: productsLoading } = useFilteredServiceProducts({
    filters,
    pagination: { currentPage: 1, itemsPerPage: 48 },
    enabled: Boolean(parent),
  });

  const title = child?.name ?? parent?.name ?? 'Services';
  const description =
    child?.description || parent?.description || `Découvrez les services ${title} sur Emarzona`;

  return (
    <AppPageShell
      mainClassName="p-4 sm:p-6 lg:p-8"
      hideSidebar
      showUtilityBar={false}
      hideHorizontalNav
    >
      <SEOMeta
        title={`${title} | Services Emarzona`}
        description={description}
        url={
          child
            ? `/services/${parent?.slug}/${child.slug}`
            : `/services/${parent?.slug ?? categorySlug}`
        }
        type="website"
      />

      <div className="max-w-6xl mx-auto space-y-6">
        <Button variant="ghost" asChild className="min-h-[44px] -ml-2">
          <Link to="/marketplace?productType=service">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Marketplace services
          </Link>
        </Button>

        <nav
          aria-label="Fil d'Ariane"
          className="flex flex-wrap items-center gap-1 text-sm text-muted-foreground"
        >
          <Link to="/marketplace?productType=service" className="hover:text-foreground">
            Services
          </Link>
          {parent && (
            <>
              <ChevronRight className="h-3.5 w-3.5" aria-hidden />
              <Link to={`/services/${parent.slug}`} className="hover:text-foreground">
                {parent.name}
              </Link>
            </>
          )}
          {child && (
            <>
              <ChevronRight className="h-3.5 w-3.5" aria-hidden />
              <span className="text-foreground font-medium">{child.name}</span>
            </>
          )}
        </nav>

        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">{title}</h1>
          {description && <p className="text-muted-foreground mt-2 max-w-2xl">{description}</p>}
        </div>

        {!child && parent && parent.children.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {parent.children.map(c => (
              <Button key={c.id} variant="outline" size="sm" asChild className="min-h-[40px]">
                <Link to={`/services/${parent.slug}/${c.slug}`}>{c.name}</Link>
              </Button>
            ))}
          </div>
        )}

        {catsLoading || productsLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-48 w-full" />
            ))}
          </div>
        ) : !parent ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              Catégorie introuvable.
            </CardContent>
          </Card>
        ) : products.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              Aucun service publié dans cette catégorie pour le moment.
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {products.map(product => (
              <Card key={product.id} className="overflow-hidden">
                {product.image_url && (
                  <img
                    src={product.image_url}
                    alt={product.name}
                    className="h-40 w-full object-cover"
                    loading="lazy"
                  />
                )}
                <CardHeader className="pb-2">
                  <CardTitle className="text-base line-clamp-2">{product.name}</CardTitle>
                  <CardDescription className="line-clamp-2">
                    {product.short_description ||
                      (product as { store_name?: string }).store_name ||
                      'Service'}
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex items-center justify-between gap-2">
                  <div>
                    <p className="font-semibold">
                      {formatCurrency(
                        Number(product.promotional_price ?? product.price ?? 0),
                        product.currency || 'XOF'
                      )}
                    </p>
                    {(() => {
                      const label = formatServiceCategoryLabel(categoryRows, {
                        categorySlug: product.category,
                      });
                      return label ? (
                        <Badge variant="outline" className="mt-1 text-xs">
                          {label}
                        </Badge>
                      ) : null;
                    })()}
                    <ServiceListingAttributeBadges
                      className="mt-2"
                      categorySlug={product.category}
                      attributes={product.category_attributes}
                    />
                  </div>
                  <Button asChild size="sm" className="min-h-[40px]">
                    <Link to={`/service/${product.id}`}>Voir</Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AppPageShell>
  );
}
