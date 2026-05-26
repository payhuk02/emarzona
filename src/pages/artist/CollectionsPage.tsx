/**
 * Page Collections d'Œuvres d'Artiste — marketplace globale
 */

import { useMemo, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { CollectionsGallery } from '@/components/artist/CollectionsGallery';
import { ArtistPublicPageShell } from '@/components/artist/ArtistPublicPageShell';
import { usePublicArtistCollections } from '@/hooks/artist/useCollections';
import { SEOMeta } from '@/components/seo/SEOMeta';
import { Search } from 'lucide-react';

const TYPE_FILTERS = [
  { value: 'all', label: 'Toutes' },
  { value: 'thematic', label: 'Thématique' },
  { value: 'series', label: 'Série' },
  { value: 'exhibition', label: 'Exposition' },
  { value: 'chronological', label: 'Chronologique' },
] as const;

type TypeFilter = (typeof TYPE_FILTERS)[number]['value'];

const CollectionsPage = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all');

  const { data: collections = [], isLoading } = usePublicArtistCollections();

  const filteredCollections = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return collections.filter(c => {
      if (typeFilter !== 'all' && c.collection_type !== typeFilter) return false;
      if (!query) return true;
      return (
        c.collection_name.toLowerCase().includes(query) ||
        (c.collection_description?.toLowerCase().includes(query) ?? false) ||
        (c.store?.name?.toLowerCase().includes(query) ?? false)
      );
    });
  }, [collections, searchQuery, typeFilter]);

  return (
    <ArtistPublicPageShell>
      <SEOMeta
        title="Collections d'œuvres d'art"
        description="Découvrez les collections d'œuvres originales par les artistes de la marketplace Emarzona. Achetez en direct et soutenez les créateurs."
        url="https://www.emarzona.com/collections"
        canonical="https://www.emarzona.com/collections"
      />

      <div className="space-y-8">
        <div className="space-y-2">
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
            Collections d&apos;œuvres
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl">
            Parcourez les galeries thématiques et séries d&apos;artistes de toute la marketplace
            Emarzona.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher une collection, un artiste ou une boutique..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="pl-10"
              aria-label="Rechercher une collection"
            />
          </div>
        </div>

        <div
          className="flex flex-wrap gap-2"
          role="group"
          aria-label="Filtrer par type de collection"
        >
          {TYPE_FILTERS.map(filter => (
            <Badge
              key={filter.value}
              variant={typeFilter === filter.value ? 'default' : 'outline'}
              className="cursor-pointer select-none"
              onClick={() => setTypeFilter(filter.value)}
            >
              {filter.label}
            </Badge>
          ))}
        </div>

        {!isLoading && (
          <p className="text-sm text-muted-foreground">
            {filteredCollections.length} collection{filteredCollections.length !== 1 ? 's' : ''}{' '}
            {searchQuery || typeFilter !== 'all' ? 'correspondante(s)' : 'publique(s)'}
          </p>
        )}

        {isLoading ? (
          <CollectionsGallery mode="marketplace" />
        ) : filteredCollections.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <p>Aucune collection ne correspond à votre recherche.</p>
          </div>
        ) : (
          <CollectionsGallery mode="marketplace" collections={filteredCollections} />
        )}
      </div>
    </ArtistPublicPageShell>
  );
};

export default CollectionsPage;
