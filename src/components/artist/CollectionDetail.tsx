/**
 * Détail d'une collection d'œuvres — marketplace (UUID ou slug + ?store=)
 * Redirige vers le host tenant quand ?store= est présent hors sous-domaine.
 */

import { useEffect } from 'react';
import { useParams, Link, useSearchParams } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ArrowLeft, Package, ImageIcon, Store } from 'lucide-react';
import { OptimizedImage } from '@/components/ui/OptimizedImage';
import { UnifiedProductCard } from '@/components/products/UnifiedProductCard';
import { ArtistPublicPageShell } from '@/components/artist/ArtistPublicPageShell';
import { SEOMeta } from '@/components/seo/SEOMeta';
import { fetchPublicArtistCollection, isArtistCollectionId } from '@/lib/artist-collection-resolve';
import { transformToUnifiedProduct } from '@/lib/product-transform';
import type { CollectionItem } from '@/hooks/artist/useCollections';
import { useStoreSlug } from '@/contexts/StoreSlugContext';
import {
  buildTenantCollectionUrl,
  shouldRedirectCollectionToTenant,
} from '@/lib/storefront/collection-tenant-redirect';

const COLLECTION_PRODUCT_FIELDS =
  'id, store_id, name, slug, description, short_description, price, compare_at_price, currency, image_url, images, product_type, is_active, is_draft, created_at, updated_at';
const ARTIST_PRODUCT_FIELDS =
  'id, product_id, store_id, artist_type, artist_name, artist_bio, artwork_title, artwork_year, artwork_medium, artwork_dimensions, artwork_edition_type, edition_number, total_editions, requires_shipping, shipping_fragile, shipping_insurance_required, certificate_of_authenticity, signature_authenticated, created_at, updated_at';

const collectionTypeLabels: Record<string, string> = {
  thematic: 'Thématique',
  chronological: 'Chronologique',
  series: 'Série',
  exhibition: 'Exposition',
  custom: 'Personnalisée',
};

export const CollectionDetail = () => {
  const { collectionSlug } = useParams<{ collectionSlug: string }>();
  const [searchParams] = useSearchParams();
  const contextSlug = useStoreSlug();
  const storeSlug = searchParams.get('store') || contextSlug || null;

  useEffect(() => {
    if (
      !shouldRedirectCollectionToTenant({
        storeSlugFromQuery: searchParams.get('store'),
        collectionSlug: collectionSlug ?? null,
      })
    ) {
      return;
    }
    const target = buildTenantCollectionUrl({
      storeSlug: searchParams.get('store')!,
      collectionSlug: collectionSlug!,
    });
    window.location.replace(target);
  }, [searchParams, collectionSlug]);

  const {
    data: collection,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['public-artist-collection', collectionSlug, storeSlug],
    queryFn: () => fetchPublicArtistCollection(collectionSlug ?? '', storeSlug),
    enabled: !!collectionSlug,
  });

  const { data: store } = useQuery({
    queryKey: ['collection-store', collection?.store_id],
    queryFn: async () => {
      if (!collection?.store_id) return null;
      const { data, error: storeError } = await supabase
        .from('stores_public')
        .select('id, name, slug, logo_url')
        .eq('id', collection.store_id)
        .maybeSingle();
      if (storeError) throw storeError;
      return data;
    },
    enabled: !!collection?.store_id,
  });

  const { data: products, isLoading: productsLoading } = useQuery({
    queryKey: ['collection-products', collection?.id, collection?.items?.map(i => i.product_id)],
    queryFn: async () => {
      if (!collection?.items?.length) return [];

      const productIds = collection.items.map((item: CollectionItem) => item.product_id);

      const { data, error: productsError } = await supabase
        .from('products')
        .select(
          `
          ${COLLECTION_PRODUCT_FIELDS},
          artist_products(${ARTIST_PRODUCT_FIELDS}),
          stores:stores_public(id, name, slug, logo_url)
        `
        )
        .in('id', productIds)
        .eq('is_active', true);

      if (productsError) throw productsError;

      return collection.items
        .map(item => {
          const row = data?.find(p => p.id === item.product_id);
          if (!row) return null;
          return transformToUnifiedProduct({
            ...row,
            product_type: 'artist',
            stores: row.stores ?? store ?? undefined,
          });
        })
        .filter((p): p is NonNullable<typeof p> => p !== null && p.type === 'artist');
    },
    enabled: !!collection && (collection.items?.length ?? 0) > 0,
  });

  const canonicalPath = collection
    ? isArtistCollectionId(collectionSlug ?? '')
      ? `/collections/${collection.id}`
      : store?.slug
        ? `/collections/${collection.collection_slug}?store=${encodeURIComponent(store.slug)}`
        : `/collections/${collection.id}`
    : undefined;

  if (isLoading) {
    return (
      <ArtistPublicPageShell>
        <div className="space-y-6">
          <Skeleton className="h-64 w-full" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-96" />
            ))}
          </div>
        </div>
      </ArtistPublicPageShell>
    );
  }

  if (error instanceof Error && error.message.includes('Plusieurs collections')) {
    return (
      <ArtistPublicPageShell>
        <div className="text-center py-12 max-w-lg mx-auto">
          <Package className="w-12 h-12 mx-auto mb-3 text-muted-foreground" />
          <p className="text-muted-foreground">{error.message}</p>
          <Button asChild className="mt-4">
            <Link to="/collections">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voir toutes les collections
            </Link>
          </Button>
        </div>
      </ArtistPublicPageShell>
    );
  }

  if (!collection) {
    return (
      <ArtistPublicPageShell>
        <div className="text-center py-12">
          <Package className="w-12 h-12 mx-auto mb-3 text-muted-foreground" />
          <p className="text-muted-foreground">Collection non trouvée</p>
          <Button asChild className="mt-4">
            <Link to="/collections">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Retour aux collections
            </Link>
          </Button>
        </div>
      </ArtistPublicPageShell>
    );
  }

  return (
    <ArtistPublicPageShell>
      <SEOMeta
        title={collection.collection_name}
        description={
          collection.collection_description ||
          `Collection d'œuvres d'artiste — ${collection.collection_name}`
        }
        url={
          canonicalPath
            ? `https://www.emarzona.com${canonicalPath}`
            : `https://www.emarzona.com/collections/${collection.id}`
        }
        canonical={canonicalPath ? `https://www.emarzona.com${canonicalPath}` : undefined}
      />
      <div className="space-y-6">
        <div className="flex items-start gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link to="/collections" aria-label="Retour aux collections">
              <ArrowLeft className="w-4 h-4" />
            </Link>
          </Button>
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <Badge variant="outline">
                {collectionTypeLabels[collection.collection_type] || collection.collection_type}
              </Badge>
              {collection.is_featured && <Badge variant="default">À la une</Badge>}
              {store?.name && store.slug && (
                <Link
                  to={`/store/${store.slug}`}
                  className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Store className="w-3.5 h-3.5" />
                  {store.name}
                </Link>
              )}
            </div>
            <h1 className="text-3xl font-bold">{collection.collection_name}</h1>
            {collection.collection_description && (
              <p className="text-muted-foreground mt-2">{collection.collection_description}</p>
            )}
          </div>
        </div>

        {collection.cover_image_url && (
          <Card className="overflow-hidden">
            <div className="relative aspect-video overflow-hidden">
              <OptimizedImage
                src={collection.cover_image_url}
                alt={collection.cover_image_alt || collection.collection_name}
                className="w-full h-full object-cover"
              />
            </div>
          </Card>
        )}

        <Separator />

        <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Package className="w-4 h-4" />
            <span>{collection.items_count ?? 0} œuvres</span>
          </div>
          {collection.tags && collection.tags.length > 0 && (
            <div className="flex flex-wrap items-center gap-2">
              <span>Tags :</span>
              {collection.tags.map(tag => (
                <Badge key={tag} variant="secondary" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>
          )}
        </div>

        <Separator />

        {productsLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-96" />
            ))}
          </div>
        ) : products && products.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map(product => (
              <UnifiedProductCard key={product.id} product={product} variant="marketplace" />
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="py-12 text-center">
              <ImageIcon className="w-12 h-12 mx-auto mb-3 text-muted-foreground" />
              <p className="text-muted-foreground">Aucune œuvre dans cette collection</p>
            </CardContent>
          </Card>
        )}
      </div>
    </ArtistPublicPageShell>
  );
};
