/**
 * 🏪 TEMPLATE MARKETPLACE COMPONENT
 * Modern template marketplace with grid, filters, search, and preview
 * 
 * Design Inspiration: Figma Community, Canva Templates, Webflow Templates
 * 
 * Features:
 * - Grid/List view toggle
 * - Advanced filters (category, tier, style, industry)
 * - Real-time search
 * - Sort options
 * - Quick preview on hover
 * - Template cards with ratings
 * - Featured templates section
 * - Pagination
 */

import React, { useState, useMemo } from 'react';
import {
  Search,
  Grid3x3,
  List,
  Filter,
  Star,
  Download,
  Eye,
  TrendingUp,
  Sparkles,
  ChevronDown,
  X,
  Heart,
} from 'lucide-react';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { TemplateV2, ProductType, TemplateTier, DesignStyle } from '@/types/templates-v2';
import { digitalTemplatesV2, digitalTemplatesStats } from '@/data/templates/v2/digital';

// ============================================================================
// TYPES
// ============================================================================

interface TemplateMarketplaceProps {
  onSelectTemplate?: (template: TemplateV2) => void;
  onPreviewTemplate?: (template: TemplateV2) => void;
  initialProductType?: ProductType;
}

type ViewMode = 'grid' | 'list';
type SortOption = 'popular' | 'newest' | 'rating' | 'price-asc' | 'price-desc' | 'name';

interface Filters {
  productTypes: ProductType[];
  tiers: TemplateTier[];
  styles: DesignStyle[];
  search: string;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function TemplateMarketplace({
  onSelectTemplate,
  onPreviewTemplate,
  initialProductType = 'digital',
}: TemplateMarketplaceProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [sortBy, setSortBy] = useState<SortOption>('popular');
  const [filters, setFilters] = useState<Filters>({
    productTypes: [initialProductType],
    tiers: [],
    styles: [],
    search: '',
  });
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [hoveredTemplate, setHoveredTemplate] = useState<string | null>(null);

  // For now, we only have digital templates
  // In the future, we'll add physical, service, and course templates
  const allTemplates = useMemo(() => digitalTemplatesV2, []);

  // Filter templates
  const filteredTemplates = useMemo(() => {
    return allTemplates.filter((template) => {
      // Product type filter
      if (
        filters.productTypes.length > 0 &&
        !filters.productTypes.includes(template.metadata.productType)
      ) {
        return false;
      }

      // Tier filter
      if (filters.tiers.length > 0 && !filters.tiers.includes(template.metadata.tier)) {
        return false;
      }

      // Style filter
      if (
        filters.styles.length > 0 &&
        !filters.styles.includes(template.metadata.designStyle)
      ) {
        return false;
      }

      // Search filter
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        const matchesName = template.metadata.name.toLowerCase().includes(searchLower);
        const matchesDescription = template.metadata.description
          .toLowerCase()
          .includes(searchLower);
        const matchesTags = template.metadata.tags.some((tag) =>
          tag.toLowerCase().includes(searchLower)
        );
        return matchesName || matchesDescription || matchesTags;
      }

      return true;
    });
  }, [allTemplates, filters]);

  // Sort templates
  const sortedTemplates = useMemo(() => {
    const sorted = [...filteredTemplates];

    switch (sortBy) {
      case 'popular':
        return sorted.sort((a, b) => b.metadata.analytics.downloads - a.metadata.analytics.downloads);
      case 'newest':
        return sorted.sort((a, b) => 
          new Date(b.metadata.createdAt).getTime() - new Date(a.metadata.createdAt).getTime()
        );
      case 'rating':
        return sorted.sort((a, b) => b.metadata.analytics.rating - a.metadata.analytics.rating);
      case 'price-asc':
        return sorted.sort((a, b) => (a.metadata.price || 0) - (b.metadata.price || 0));
      case 'price-desc':
        return sorted.sort((a, b) => (b.metadata.price || 0) - (a.metadata.price || 0));
      case 'name':
        return sorted.sort((a, b) => a.metadata.name.localeCompare(b.metadata.name));
      default:
        return sorted;
    }
  }, [filteredTemplates, sortBy]);

  // Toggle favorite
  const toggleFavorite = (templateId: string) => {
    setFavorites((prev) => {
      const next = new Set(prev);
      if (next.has(templateId)) {
        next.delete(templateId);
      } else {
        next.add(templateId);
      }
      return next;
    });
  };

  // Clear all filters
  const clearFilters = () => {
    setFilters({
      productTypes: [initialProductType],
      tiers: [],
      styles: [],
      search: '',
    });
  };

  const hasActiveFilters =
    filters.tiers.length > 0 || filters.styles.length > 0 || filters.search.length > 0;

  return (
    <div className="w-full h-full flex flex-col">
      {/* Header */}
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-10">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-2xl font-bold">Template Marketplace</h2>
              <p className="text-sm text-muted-foreground mt-1">
                {sortedTemplates.length} templates disponibles
              </p>
            </div>

            {/* View Mode Toggle */}
            <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as ViewMode)}>
              <TabsList>
                <TabsTrigger value="grid" className="gap-2">
                  <Grid3x3 className="w-4 h-4" />
                  Grille
                </TabsTrigger>
                <TabsTrigger value="list" className="gap-2">
                  <List className="w-4 h-4" />
                  Liste
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          {/* Search and Filters Bar */}
          <div className="flex items-center gap-3">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher des templates..."
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                className="pl-10"
              />
              {filters.search && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                  onClick={() => setFilters({ ...filters, search: '' })}
                >
                  <X className="w-4 h-4" />
                </Button>
              )}
            </div>

            {/* Tier Filter */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="gap-2">
                  <Filter className="w-4 h-4" />
                  Tier
                  {filters.tiers.length > 0 && (
                    <Badge variant="secondary" className="ml-1 h-5 px-1 text-xs">
                      {filters.tiers.length}
                    </Badge>
                  )}
                  <ChevronDown className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>Tier</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuCheckboxItem
                  checked={filters.tiers.includes('free')}
                  onCheckedChange={(checked) => {
                    setFilters({
                      ...filters,
                      tiers: checked
                        ? [...filters.tiers, 'free']
                        : filters.tiers.filter((t) => t !== 'free'),
                    });
                  }}
                >
                  Gratuit
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                  checked={filters.tiers.includes('premium')}
                  onCheckedChange={(checked) => {
                    setFilters({
                      ...filters,
                      tiers: checked
                        ? [...filters.tiers, 'premium']
                        : filters.tiers.filter((t) => t !== 'premium'),
                    });
                  }}
                >
                  Premium
                </DropdownMenuCheckboxItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Style Filter */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="gap-2">
                  <Sparkles className="w-4 h-4" />
                  Style
                  {filters.styles.length > 0 && (
                    <Badge variant="secondary" className="ml-1 h-5 px-1 text-xs">
                      {filters.styles.length}
                    </Badge>
                  )}
                  <ChevronDown className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>Style de Design</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {(['minimal', 'modern', 'professional', 'creative', 'luxury', 'elegant'] as DesignStyle[]).map(
                  (style) => (
                    <DropdownMenuCheckboxItem
                      key={style}
                      checked={filters.styles.includes(style)}
                      onCheckedChange={(checked) => {
                        setFilters({
                          ...filters,
                          styles: checked
                            ? [...filters.styles, style]
                            : filters.styles.filter((s) => s !== style),
                        });
                      }}
                    >
                      {style.charAt(0).toUpperCase() + style.slice(1)}
                    </DropdownMenuCheckboxItem>
                  )
                )}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Sort */}
            <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortOption)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="popular">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4" />
                    Populaire
                  </div>
                </SelectItem>
                <SelectItem value="newest">Plus récent</SelectItem>
                <SelectItem value="rating">Mieux noté</SelectItem>
                <SelectItem value="name">Nom (A-Z)</SelectItem>
                <SelectItem value="price-asc">Prix (croissant)</SelectItem>
                <SelectItem value="price-desc">Prix (décroissant)</SelectItem>
              </SelectContent>
            </Select>

            {/* Clear Filters */}
            {hasActiveFilters && (
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                Réinitialiser
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Templates Grid/List */}
      <ScrollArea className="flex-1">
        <div className="p-6">
          {sortedTemplates.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Aucun template trouvé</p>
              <Button variant="link" onClick={clearFilters} className="mt-2">
                Réinitialiser les filtres
              </Button>
            </div>
          ) : (
            <div
              className={
                viewMode === 'grid'
                  ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'
                  : 'flex flex-col gap-4'
              }
            >
              {sortedTemplates.map((template) => (
                <TemplateCard
                  key={template.metadata.id}
                  template={template}
                  viewMode={viewMode}
                  isFavorite={favorites.has(template.metadata.id)}
                  isHovered={hoveredTemplate === template.metadata.id}
                  onToggleFavorite={() => toggleFavorite(template.metadata.id)}
                  onMouseEnter={() => setHoveredTemplate(template.metadata.id)}
                  onMouseLeave={() => setHoveredTemplate(null)}
                  onSelect={() => onSelectTemplate?.(template)}
                  onPreview={() => onPreviewTemplate?.(template)}
                />
              ))}
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}

// ============================================================================
// TEMPLATE CARD COMPONENT
// ============================================================================

interface TemplateCardProps {
  template: TemplateV2;
  viewMode: ViewMode;
  isFavorite: boolean;
  isHovered: boolean;
  onToggleFavorite: () => void;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  onSelect: () => void;
  onPreview: () => void;
}

function TemplateCard({
  template,
  viewMode,
  isFavorite,
  isHovered,
  onToggleFavorite,
  onMouseEnter,
  onMouseLeave,
  onSelect,
  onPreview,
}: TemplateCardProps) {
  const { metadata } = template;
  const isPremium = metadata.tier === 'premium';

  if (viewMode === 'list') {
    return (
      <Card
        className="cursor-pointer hover:shadow-md transition-shadow"
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
        onClick={onSelect}
      >
        <div className="flex items-center p-4 gap-4">
          {/* Thumbnail */}
          <div className="w-32 h-20 rounded-md bg-muted flex-shrink-0 overflow-hidden">
            <img
              src={metadata.thumbnail}
              alt={metadata.name}
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).src = '/placeholder-template.svg';
              }}
            />
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold truncate">{metadata.name}</h3>
                <p className="text-sm text-muted-foreground line-clamp-1">
                  {metadata.shortDescription || metadata.description}
                </p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                {isPremium ? (
                  <Badge variant="default">
                    {metadata.price}€
                  </Badge>
                ) : (
                  <Badge variant="secondary">Gratuit</Badge>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleFavorite();
                  }}
                >
                  <Heart
                    className={`w-4 h-4 ${
                      isFavorite ? 'fill-red-500 text-red-500' : ''
                    }`}
                  />
                </Button>
              </div>
            </div>

            <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                <span>{metadata.analytics.rating.toFixed(1)}</span>
              </div>
              <div className="flex items-center gap-1">
                <Download className="w-4 h-4" />
                <span>{metadata.analytics.downloads}</span>
              </div>
              <Badge variant="outline" className="text-xs">
                {metadata.designStyle}
              </Badge>
            </div>
          </div>

          {/* Preview Button */}
          {isHovered && (
            <Button
              variant="outline"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onPreview();
              }}
            >
              <Eye className="w-4 h-4 mr-2" />
              Aperçu
            </Button>
          )}
        </div>
      </Card>
    );
  }

  return (
    <Card
      className="cursor-pointer hover:shadow-lg transition-all duration-200 group overflow-hidden"
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      onClick={onSelect}
    >
      {/* Thumbnail */}
      <div className="relative aspect-video w-full overflow-hidden bg-muted">
        <img
          src={metadata.thumbnail}
          alt={metadata.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
          onError={(e) => {
            (e.target as HTMLImageElement).src = '/placeholder-template.svg';
          }}
        />

        {/* Overlay on hover */}
        {isHovered && (
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center gap-2">
            <Button
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onPreview();
              }}
            >
              <Eye className="w-4 h-4 mr-2" />
              Aperçu
            </Button>
            <Button
              size="sm"
              variant="secondary"
              onClick={(e) => {
                e.stopPropagation();
                onSelect();
              }}
            >
              Utiliser
            </Button>
          </div>
        )}

        {/* Favorite button */}
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-2 right-2 h-8 w-8 bg-background/80 backdrop-blur-sm hover:bg-background"
          onClick={(e) => {
            e.stopPropagation();
            onToggleFavorite();
          }}
        >
          <Heart
            className={`w-4 h-4 ${isFavorite ? 'fill-red-500 text-red-500' : ''}`}
          />
        </Button>

        {/* Premium badge */}
        {isPremium && (
          <Badge className="absolute top-2 left-2 bg-gradient-to-r from-yellow-500 to-orange-500 border-0">
            <Sparkles className="w-3 h-3 mr-1" />
            Premium
          </Badge>
        )}
      </div>

      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold line-clamp-1">{metadata.name}</h3>
          {isPremium ? (
            <span className="text-sm font-semibold text-primary flex-shrink-0">
              {metadata.price}€
            </span>
          ) : (
            <Badge variant="secondary" className="flex-shrink-0">
              Gratuit
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="pb-3">
        <p className="text-sm text-muted-foreground line-clamp-2">
          {metadata.shortDescription || metadata.description}
        </p>

        <div className="flex items-center gap-3 mt-3">
          <div className="flex items-center gap-1 text-sm">
            <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
            <span className="font-medium">{metadata.analytics.rating.toFixed(1)}</span>
          </div>
          <Separator orientation="vertical" className="h-4" />
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <Download className="w-4 h-4" />
            <span>{metadata.analytics.downloads}</span>
          </div>
        </div>
      </CardContent>

      <CardFooter className="pt-0">
        <div className="flex flex-wrap gap-1">
          <Badge variant="outline" className="text-xs">
            {metadata.designStyle}
          </Badge>
          {metadata.tags.slice(0, 2).map((tag) => (
            <Badge key={tag} variant="secondary" className="text-xs">
              {tag}
            </Badge>
          ))}
        </div>
      </CardFooter>
    </Card>
  );
}

export default TemplateMarketplace;

