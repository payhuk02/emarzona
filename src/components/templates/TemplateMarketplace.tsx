/**
 * 🏪 TEMPLATE MARKETPLACE COMPONENT - Professional & Optimized
 * Modern template marketplace with grid, filters, search, and preview
 * Version optimisée avec design professionnel, responsive et fonctionnalités avancées
 * 
 * Design Inspiration: Figma Community, Canva Templates, Webflow Templates
 * 
 * Features:
 * - Grid/List view toggle
 * - Advanced filters (category, tier, style, industry)
 * - Real-time search with debouncing
 * - Sort options
 * - Quick preview on hover
 * - Template cards with ratings
 * - Featured templates section
 * - Pagination
 * - Keyboard shortcuts
 * - Accessibility
 */

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
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
  Loader2,
  Keyboard,
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
import { logger } from '@/lib/logger';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';
import { useDebounce } from '@/hooks/useDebounce';
import { cn } from '@/lib/utils';

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
  const { t } = useTranslation();
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [sortBy, setSortBy] = useState<SortOption>('popular');
  const [searchInput, setSearchInput] = useState('');
  const debouncedSearch = useDebounce(searchInput, 300);
  
  const [filters, setFilters] = useState<Filters>({
    productTypes: [initialProductType],
    tiers: [],
    styles: [],
    search: '',
  });
  
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [hoveredTemplate, setHoveredTemplate] = useState<string | null>(null);

  // Refs for animations
  const headerRef = useScrollAnimation<HTMLDivElement>();
  const gridRef = useScrollAnimation<HTMLDivElement>();

  // Update search filter when debounced search changes
  useEffect(() => {
    setFilters(prev => ({ ...prev, search: debouncedSearch }));
  }, [debouncedSearch]);

  // For now, we only have digital templates
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
  const toggleFavorite = useCallback((templateId: string) => {
    setFavorites((prev) => {
      const next = new Set(prev);
      if (next.has(templateId)) {
        next.delete(templateId);
        logger.info('Template retiré des favoris', { templateId });
      } else {
        next.add(templateId);
        logger.info('Template ajouté aux favoris', { templateId });
      }
      return next;
    });
  }, []);

  // Clear all filters
  const clearFilters = useCallback(() => {
    setFilters({
      productTypes: [initialProductType],
      tiers: [],
      styles: [],
      search: '',
    });
    setSearchInput('');
    logger.info('Filtres réinitialisés');
  }, [initialProductType]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept if typing in input
      if (e.target instanceof HTMLInputElement) return;

      // Ctrl/Cmd + G to toggle grid/list
      if ((e.ctrlKey || e.metaKey) && e.key === 'g') {
        e.preventDefault();
        setViewMode(prev => prev === 'grid' ? 'list' : 'grid');
        logger.info('Vue changée', { mode: viewMode === 'grid' ? 'list' : 'grid' });
      }

      // Ctrl/Cmd + K to focus search
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        const searchInput = document.querySelector('input[placeholder*="Rechercher"]') as HTMLInputElement;
        searchInput?.focus();
      }

      // Escape to clear search
      if (e.key === 'Escape' && filters.search) {
        setSearchInput('');
        setFilters(prev => ({ ...prev, search: '' }));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [viewMode, filters.search]);

  // Logging
  useEffect(() => {
    logger.info('Template Marketplace chargé', { 
      totalTemplates: allTemplates.length,
      filteredCount: filteredTemplates.length 
    });
  }, [allTemplates.length, filteredTemplates.length]);

  const hasActiveFilters =
    filters.tiers.length > 0 || filters.styles.length > 0 || filters.search.length > 0;

  return (
    <div className="w-full h-full flex flex-col">
      {/* Header - Responsive & Animated */}
      <div 
        ref={headerRef}
        className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-10 animate-in fade-in slide-in-from-top-4 duration-700"
      >
        <div className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 mb-3 sm:mb-4">
            <div>
              <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                {t('templates.marketplace', 'Template Marketplace')}
              </h2>
              <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                {sortedTemplates.length} {t('templates.available', 'templates disponibles')}
              </p>
            </div>

            {/* View Mode Toggle - Responsive */}
            <Tabs value={viewMode} onValueChange={(v) => {
              setViewMode(v as ViewMode);
              logger.info('Mode d\'affichage changé', { mode: v });
            }}>
              <TabsList className="bg-muted/50 backdrop-blur-sm h-auto p-1">
                <TabsTrigger 
                  value="grid" 
                  className="gap-1.5 sm:gap-2 px-2 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-pink-600 data-[state=active]:text-white transition-all duration-300"
                >
                  <Grid3x3 className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span className="hidden sm:inline">{t('templates.grid', 'Grille')}</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="list" 
                  className="gap-1.5 sm:gap-2 px-2 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-pink-600 data-[state=active]:text-white transition-all duration-300"
                >
                  <List className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span className="hidden sm:inline">{t('templates.list', 'Liste')}</span>
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          {/* Search and Filters Bar - Responsive */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
            {/* Search - Responsive */}
            <div className="flex-1 relative">
              <Search className="absolute left-2.5 sm:left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 sm:w-4 sm:h-4 text-muted-foreground" />
              <Input
                placeholder={t('templates.searchPlaceholder', 'Rechercher des templates...')}
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="pl-8 sm:pl-10 h-9 sm:h-10 text-xs sm:text-sm"
                aria-label={t('templates.search', 'Rechercher')}
              />
              {searchInput && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 sm:h-8 sm:w-8"
                  onClick={() => {
                    setSearchInput('');
                    setFilters(prev => ({ ...prev, search: '' }));
                  }}
                  aria-label={t('common.clear', 'Effacer')}
                >
                  <X className="w-3 h-3 sm:w-4 sm:h-4" />
                </Button>
              )}
              {/* Keyboard shortcut indicator */}
              <div className="absolute right-2.5 sm:right-10 top-1/2 -translate-y-1/2 pointer-events-none hidden sm:flex items-center">
                <Badge variant="outline" className="text-[10px] font-mono px-1.5 py-0">
                  ⌘K
                </Badge>
              </div>
            </div>

            {/* Filters - Responsive Stack */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Tier Filter */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="outline" 
                    className="gap-1.5 sm:gap-2 h-9 sm:h-10 text-xs sm:text-sm"
                    aria-label={t('templates.filterTier', 'Filtrer par tier')}
                  >
                    <Filter className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    <span className="hidden sm:inline">{t('templates.tier', 'Tier')}</span>
                    {filters.tiers.length > 0 && (
                      <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-[10px] sm:text-xs">
                        {filters.tiers.length}
                      </Badge>
                    )}
                    <ChevronDown className="w-3 h-3 sm:w-4 sm:h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>{t('templates.tier', 'Tier')}</DropdownMenuLabel>
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
                    {t('templates.free', 'Gratuit')}
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
                    {t('templates.premium', 'Premium')}
                  </DropdownMenuCheckboxItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Style Filter */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="outline" 
                    className="gap-1.5 sm:gap-2 h-9 sm:h-10 text-xs sm:text-sm"
                    aria-label={t('templates.filterStyle', 'Filtrer par style')}
                  >
                    <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    <span className="hidden sm:inline">{t('templates.style', 'Style')}</span>
                    {filters.styles.length > 0 && (
                      <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-[10px] sm:text-xs">
                        {filters.styles.length}
                      </Badge>
                    )}
                    <ChevronDown className="w-3 h-3 sm:w-4 sm:h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>{t('templates.designStyle', 'Style de Design')}</DropdownMenuLabel>
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
              <Select value={sortBy} onValueChange={(v) => {
                setSortBy(v as SortOption);
                logger.info('Tri changé', { sortBy: v });
              }}>
                <SelectTrigger className="w-[140px] sm:w-[180px] h-9 sm:h-10 text-xs sm:text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="popular">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      <span>{t('templates.popular', 'Populaire')}</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="newest">{t('templates.newest', 'Plus récent')}</SelectItem>
                  <SelectItem value="rating">{t('templates.bestRated', 'Mieux noté')}</SelectItem>
                  <SelectItem value="name">{t('templates.nameAZ', 'Nom (A-Z)')}</SelectItem>
                  <SelectItem value="price-asc">{t('templates.priceAsc', 'Prix (croissant)')}</SelectItem>
                  <SelectItem value="price-desc">{t('templates.priceDesc', 'Prix (décroissant)')}</SelectItem>
                </SelectContent>
              </Select>

              {/* Clear Filters */}
              {hasActiveFilters && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={clearFilters}
                  className="h-9 sm:h-10 text-xs sm:text-sm"
                  aria-label={t('templates.clearFilters', 'Réinitialiser les filtres')}
                >
                  {t('templates.reset', 'Réinitialiser')}
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Templates Grid/List - Responsive */}
      <ScrollArea className="flex-1">
        <div className="p-3 sm:p-4 lg:p-6">
          {sortedTemplates.length === 0 ? (
            <div className="text-center py-8 sm:py-12 animate-in fade-in zoom-in-95 duration-500">
              <p className="text-sm sm:text-base text-muted-foreground mb-4">
                {t('templates.noTemplatesFound', 'Aucun template trouvé')}
              </p>
              <Button 
                variant="link" 
                onClick={clearFilters} 
                className="text-xs sm:text-sm"
              >
                {t('templates.resetFilters', 'Réinitialiser les filtres')}
              </Button>
            </div>
          ) : (
            <div
              ref={gridRef}
              className={cn(
                viewMode === 'grid'
                  ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5 lg:gap-6'
                  : 'flex flex-col gap-3 sm:gap-4',
                'animate-in fade-in slide-in-from-bottom-4 duration-700'
              )}
            >
              {sortedTemplates.map((template, index) => (
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
                  animationDelay={index * 50}
                />
              ))}
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Keyboard Shortcuts Help - Desktop Only */}
      <div className="hidden lg:flex items-center justify-center gap-4 p-3 border-t border-border/50 bg-muted/30 backdrop-blur-sm">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Keyboard className="h-3 w-3" aria-hidden="true" />
          <span>{t('common.shortcuts', 'Raccourcis')}:</span>
          <Badge variant="outline" className="text-[10px] font-mono">⌘K</Badge>
          <span className="text-muted-foreground">{t('templates.shortcuts.search', 'Rechercher')}</span>
          <Badge variant="outline" className="text-[10px] font-mono ml-2">⌘G</Badge>
          <span className="text-muted-foreground">{t('templates.shortcuts.toggleView', 'Basculer vue')}</span>
          <Badge variant="outline" className="text-[10px] font-mono ml-2">Esc</Badge>
          <span className="text-muted-foreground">{t('templates.shortcuts.clear', 'Effacer')}</span>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// TEMPLATE CARD COMPONENT - Optimized
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
  animationDelay?: number;
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
  animationDelay = 0,
}: TemplateCardProps) {
  const { t } = useTranslation();
  const { metadata } = template;
  const isPremium = metadata.tier === 'premium';

  if (viewMode === 'list') {
    return (
      <Card
        className="cursor-pointer hover:shadow-lg transition-all duration-300 group overflow-hidden animate-in fade-in slide-in-from-left-4"
        style={{ animationDelay: `${animationDelay}ms` }}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
        onClick={onSelect}
        role="button"
        tabIndex={0}
        aria-label={`${t('templates.selectTemplate', 'Sélectionner')} ${metadata.name}`}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onSelect();
          }
        }}
      >
        <div className="flex flex-col sm:flex-row items-start sm:items-center p-3 sm:p-4 gap-3 sm:gap-4">
          {/* Thumbnail */}
          <div className="w-full sm:w-32 h-24 sm:h-20 rounded-md bg-muted flex-shrink-0 overflow-hidden group-hover:scale-105 transition-transform duration-300">
            <img
              src={metadata.thumbnail}
              alt={metadata.name}
              className="w-full h-full object-cover"
              loading="lazy"
              onError={(e) => {
                (e.target as HTMLImageElement).src = '/placeholder-template.svg';
              }}
            />
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0 w-full sm:w-auto">
            <div className="flex items-start justify-between gap-2 mb-2">
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-sm sm:text-base truncate">{metadata.name}</h3>
                <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2 mt-1">
                  {metadata.shortDescription || metadata.description}
                </p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                {isPremium ? (
                  <Badge variant="default" className="text-xs">
                    {metadata.price}€
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="text-xs">
                    {t('templates.free', 'Gratuit')}
                  </Badge>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 sm:h-8 sm:w-8"
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleFavorite();
                  }}
                  aria-label={isFavorite ? t('templates.removeFavorite', 'Retirer des favoris') : t('templates.addFavorite', 'Ajouter aux favoris')}
                >
                  <Heart
                    className={cn(
                      "w-3.5 h-3.5 sm:w-4 sm:h-4 transition-all duration-300",
                      isFavorite ? 'fill-red-500 text-red-500 scale-110' : ''
                    )}
                  />
                </Button>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 sm:gap-4 mt-2 text-xs sm:text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Star className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-yellow-400 text-yellow-400" />
                <span>{metadata.analytics.rating.toFixed(1)}</span>
              </div>
              <div className="flex items-center gap-1">
                <Download className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span>{metadata.analytics.downloads}</span>
              </div>
              <Badge variant="outline" className="text-[10px] sm:text-xs">
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
              className="w-full sm:w-auto animate-in fade-in zoom-in-95 duration-300"
              aria-label={t('templates.preview', 'Aperçu')}
            >
              <Eye className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
              <span className="text-xs sm:text-sm">{t('templates.preview', 'Aperçu')}</span>
            </Button>
          )}
        </div>
      </Card>
    );
  }

  return (
    <Card
      className="cursor-pointer hover:shadow-xl transition-all duration-300 group overflow-hidden animate-in fade-in slide-in-from-bottom-4 touch-manipulation"
      style={{ animationDelay: `${animationDelay}ms` }}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      onClick={onSelect}
      role="button"
      tabIndex={0}
      aria-label={`${t('templates.selectTemplate', 'Sélectionner')} ${metadata.name}`}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect();
        }
      }}
    >
      {/* Thumbnail */}
      <div className="relative aspect-video w-full overflow-hidden bg-muted">
        <img
          src={metadata.thumbnail}
          alt={metadata.name}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
          loading="lazy"
          onError={(e) => {
            (e.target as HTMLImageElement).src = '/placeholder-template.svg';
          }}
        />

        {/* Overlay on hover */}
        {isHovered && (
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/60 to-black/40 flex items-center justify-center gap-2 animate-in fade-in duration-300">
            <Button
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onPreview();
              }}
              className="bg-white/10 backdrop-blur-sm hover:bg-white/20 border border-white/20"
              aria-label={t('templates.preview', 'Aperçu')}
            >
              <Eye className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
              <span className="text-xs sm:text-sm">{t('templates.preview', 'Aperçu')}</span>
            </Button>
            <Button
              size="sm"
              variant="secondary"
              onClick={(e) => {
                e.stopPropagation();
                onSelect();
              }}
              className="bg-white/10 backdrop-blur-sm hover:bg-white/20 border border-white/20"
              aria-label={t('templates.use', 'Utiliser')}
            >
              <span className="text-xs sm:text-sm">{t('templates.use', 'Utiliser')}</span>
            </Button>
          </div>
        )}

        {/* Favorite button */}
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-2 right-2 h-8 w-8 sm:h-9 sm:w-9 bg-background/80 backdrop-blur-sm hover:bg-background transition-all duration-300"
          onClick={(e) => {
            e.stopPropagation();
            onToggleFavorite();
          }}
          aria-label={isFavorite ? t('templates.removeFavorite', 'Retirer des favoris') : t('templates.addFavorite', 'Ajouter aux favoris')}
        >
          <Heart
            className={cn(
              "w-4 h-4 transition-all duration-300",
              isFavorite ? 'fill-red-500 text-red-500 scale-110' : ''
            )}
          />
        </Button>

        {/* Premium badge */}
        {isPremium && (
          <Badge className="absolute top-2 left-2 bg-gradient-to-r from-yellow-500 to-orange-500 border-0 text-xs animate-in zoom-in-95 duration-300">
            <Sparkles className="w-3 h-3 mr-1" />
            {t('templates.premium', 'Premium')}
          </Badge>
        )}
      </div>

      <CardHeader className="pb-2 sm:pb-3 p-3 sm:p-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold text-sm sm:text-base line-clamp-1">{metadata.name}</h3>
          {isPremium ? (
            <span className="text-xs sm:text-sm font-semibold text-primary flex-shrink-0">
              {metadata.price}€
            </span>
          ) : (
            <Badge variant="secondary" className="flex-shrink-0 text-[10px] sm:text-xs">
              {t('templates.free', 'Gratuit')}
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="pb-2 sm:pb-3 px-3 sm:px-4">
        <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2">
          {metadata.shortDescription || metadata.description}
        </p>

        <div className="flex items-center gap-2 sm:gap-3 mt-2 sm:mt-3">
          <div className="flex items-center gap-1 text-xs sm:text-sm">
            <Star className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-yellow-400 text-yellow-400" />
            <span className="font-medium">{metadata.analytics.rating.toFixed(1)}</span>
          </div>
          <Separator orientation="vertical" className="h-3 sm:h-4" />
          <div className="flex items-center gap-1 text-xs sm:text-sm text-muted-foreground">
            <Download className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span>{metadata.analytics.downloads}</span>
          </div>
        </div>
      </CardContent>

      <CardFooter className="pt-0 px-3 sm:px-4 pb-3 sm:pb-4">
        <div className="flex flex-wrap gap-1">
          <Badge variant="outline" className="text-[10px] sm:text-xs">
            {metadata.designStyle}
          </Badge>
          {metadata.tags.slice(0, 2).map((tag) => (
            <Badge key={tag} variant="secondary" className="text-[10px] sm:text-xs">
              {tag}
            </Badge>
          ))}
        </div>
      </CardFooter>
    </Card>
  );
}

export default TemplateMarketplace;
