/**
 * Galerie de Collections d'Œuvres d'Artiste
 * Mode boutique (store) ou marketplace globale
 */

import type { ReactNode } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  useStoreCollections,
  usePublicArtistCollections,
  type CollectionWithItems,
  type PublicArtistCollection,
} from '@/hooks/artist/useCollections';
import { Link } from 'react-router-dom';
import { ImageIcon, Package, Store } from 'lucide-react';
import { OptimizedImage } from '@/components/ui/OptimizedImage';
import { isArtistCollectionId } from '@/lib/artist-collection-resolve';
import { buildTenantCollectionUrl } from '@/lib/storefront/collection-tenant-redirect';

interface CollectionsGalleryBaseProps {
  showPrivate?: boolean;
  limit?: number;
  /** Liste pré-filtrée (évite un second fetch sur la page marketplace) */
  collections?: Array<CollectionWithItems | PublicArtistCollection>;
}

interface StoreCollectionsGalleryProps extends CollectionsGalleryBaseProps {
  mode?: 'store';
  storeId: string;
  storeSlug?: string;
}

interface MarketplaceCollectionsGalleryProps extends CollectionsGalleryBaseProps {
  mode: 'marketplace';
  storeId?: never;
  storeSlug?: never;
}

export type CollectionsGalleryProps =
  | StoreCollectionsGalleryProps
  | MarketplaceCollectionsGalleryProps;

const collectionTypeLabels: Record<string, string> = {
  thematic: 'Thématique',
  chronological: 'Chronologique',
  series: 'Série',
  exhibition: 'Exposition',
  custom: 'Personnalisée',
};

function collectionHref(
  collection: CollectionWithItems | PublicArtistCollection,
  mode: 'store' | 'marketplace',
  storeSlug?: string
): string {
  const publicCollection = collection as PublicArtistCollection;
  const resolvedSlug = storeSlug || publicCollection.store?.slug || null;
  const slugPath = collection.collection_slug;

  if (mode === 'store' && resolvedSlug && slugPath && !isArtistCollectionId(slugPath)) {
    return `/collections/${slugPath}`;
  }

  if (resolvedSlug && slugPath && !isArtistCollectionId(slugPath)) {
    return buildTenantCollectionUrl({
      storeSlug: resolvedSlug,
      collectionSlug: slugPath,
    });
  }

  return `/collections/${collection.id}`;
}

function CollectionCardLink({ href, children }: { href: string; children: ReactNode }) {
  if (href.startsWith('http')) {
    return (
      <a href={href} className="block">
        {children}
      </a>
    );
  }
  return (
    <Link to={href} className="block">
      {children}
    </Link>
  );
}

function CollectionsGrid({
  collections,
  mode,
  storeSlug,
}: {
  collections: Array<CollectionWithItems | PublicArtistCollection>;
  mode: 'store' | 'marketplace';
  storeSlug?: string;
}) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {collections.map(collection => {
        const publicCollection = collection as PublicArtistCollection;
        const store = publicCollection.store;

        return (
          <Card
            key={collection.id}
            className="overflow-hidden hover:shadow-lg transition-shadow group"
          >
            <CollectionCardLink href={collectionHref(collection, mode, storeSlug)}>
              <div className="relative aspect-video overflow-hidden bg-muted">
                {collection.cover_image_url ? (
                  <OptimizedImage
                    src={collection.cover_image_url}
                    alt={collection.cover_image_alt || collection.collection_name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <ImageIcon className="w-16 h-16 text-muted-foreground" />
                  </div>
                )}
                {collection.is_featured && (
                  <Badge className="absolute top-2 right-2" variant="default">
                    À la une
                  </Badge>
                )}
              </div>
              <CardHeader>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <CardTitle className="line-clamp-2">{collection.collection_name}</CardTitle>
                    <CardDescription className="mt-1 line-clamp-2">
                      {collection.collection_short_description || collection.collection_description}
                    </CardDescription>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2 mt-2">
                  <Badge variant="outline" className="text-xs">
                    {collectionTypeLabels[collection.collection_type] || collection.collection_type}
                  </Badge>
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Package className="w-4 h-4" />
                    <span>{collection.items_count || 0} œuvres</span>
                  </div>
                  {mode === 'marketplace' && store?.name && (
                    <div className="flex items-center gap-1 text-xs text-muted-foreground w-full">
                      <Store className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">{store.name}</span>
                    </div>
                  )}
                </div>
              </CardHeader>
            </CollectionCardLink>
          </Card>
        );
      })}
    </div>
  );
}

export const CollectionsGallery = (props: CollectionsGalleryProps) => {
  const mode = props.mode === 'marketplace' ? 'marketplace' : 'store';
  const storeId = mode === 'store' ? props.storeId : undefined;
  const storeSlug = mode === 'store' ? props.storeSlug : undefined;
  const showPrivate = props.showPrivate ?? false;
  const limit = props.limit;
  const collectionsOverride = props.collections;

  const storeQuery = useStoreCollections(
    collectionsOverride !== undefined ? undefined : storeId,
    showPrivate
  );
  const marketplaceQuery = usePublicArtistCollections({
    limit: mode === 'marketplace' && !collectionsOverride ? limit : undefined,
    enabled: collectionsOverride === undefined && mode === 'marketplace',
  });

  const isLoading =
    collectionsOverride !== undefined
      ? false
      : mode === 'marketplace'
        ? marketplaceQuery.isLoading
        : storeQuery.isLoading;
  const collections =
    collectionsOverride ??
    (mode === 'marketplace' ? (marketplaceQuery.data ?? []) : (storeQuery.data ?? []));

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <Skeleton key={i} className="h-64" />
        ))}
      </div>
    );
  }

  if (!collections.length) {
    return (
      <div className="text-center py-12">
        <Package className="w-12 h-12 mx-auto mb-3 text-muted-foreground" />
        <p className="text-muted-foreground">Aucune collection disponible</p>
      </div>
    );
  }

  const displayCollections = limit && mode === 'store' ? collections.slice(0, limit) : collections;

  return <CollectionsGrid collections={displayCollections} mode={mode} storeSlug={storeSlug} />;
};
