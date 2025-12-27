/**
 * Digital Products Advanced Search Page
 * Date: 27 Janvier 2025
 *
 * Page de recherche avancée pour produits digitaux avec :
 * - Recherche full-text avec suggestions
 * - Filtres avancés (prix, catégorie, licence, format, etc.)
 * - Autocomplétion intelligente
 * - Historique de recherche
 * - Recherche vocale (optionnel)
 */

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Search,
  X,
  Filter,
  SlidersHorizontal,
  TrendingUp,
  Clock,
  DollarSign,
  Star,
  Sparkles,
  Mic,
  MicOff,
  History,
  Zap,
  Loader2,
  Check,
  FileText,
} from 'lucide-react';
import { useDebounce } from '@/hooks/useDebounce';
import { useToast } from '@/hooks/use-toast';
import { DigitalProductsGrid } from '@/components/digital/DigitalProductCard';
import { ResponsiveProductImage } from '@/components/ui/ResponsiveProductImage';
import { logger } from '@/lib/logger';
import { cn } from '@/lib/utils';

interface SearchFilters {
  query: string;
  category: string;
  priceRange: [number, number];
  licenseType: string;
  fileFormat: string;
  minRating: number;
  sortBy: 'recent' | 'price-asc' | 'price-desc' | 'popularity' | 'rating';
  inStock: boolean;
  featuredOnly: boolean;
}

interface SearchSuggestion {
  id: string;
  text: string;
  type: 'product' | 'category' | 'tag';
  count?: number;
}

export const DigitalProductsSearch = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { toast } = useToast();
  const searchInputRef = useRef<HTMLInputElement>(null);

  // États
  const [searchInput, setSearchInput] = useState(searchParams.get('q') || '');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isVoiceSearchActive, setIsVoiceSearchActive] = useState(false);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);

  // Filtres
  const [filters, setFilters] = useState<SearchFilters>({
    query: searchParams.get('q') || '',
    category: searchParams.get('category') || 'all',
    priceRange: [
      parseInt(searchParams.get('minPrice') || '0'),
      parseInt(searchParams.get('maxPrice') || '1000000'),
    ],
    licenseType: searchParams.get('license') || 'all',
    fileFormat: searchParams.get('format') || 'all',
    minRating: parseInt(searchParams.get('rating') || '0'),
    sortBy: (searchParams.get('sort') as SearchFilters['sortBy']) || 'recent',
    inStock: searchParams.get('inStock') === 'true',
    featuredOnly: searchParams.get('featured') === 'true',
  });

  // Debounce de la recherche
  const debouncedQuery = useDebounce(searchInput, 300);

  // Charger l'historique depuis localStorage
  useEffect(() => {
    let  saved: string | null = null;
    try {
      saved = localStorage.getItem('digital-products-search-history');
    } catch {
      saved = null;
    }
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as unknown;
        setSearchHistory(Array.isArray(parsed) ? (parsed as string[]) : []);
      } catch (e) {
        logger.error('Error loading search history', { error: e });
        try {
          localStorage.removeItem('digital-products-search-history');
        } catch {
          // ignore
        }
      }
    }
  }, []);

  // Sauvegarder l'historique
  const saveToHistory = useCallback(
    (query: string) => {
      if (!query.trim()) return;

      const updated = [query, ...searchHistory.filter(h => h !== query)].slice(0, 10); // Garder max 10 recherches

      setSearchHistory(updated);
      try {
        localStorage.setItem('digital-products-search-history', JSON.stringify(updated));
      } catch {
        // ignore
      }
    },
    [searchHistory]
  );

  // Suggestions de recherche
  const { data: suggestions, isLoading: suggestionsLoading } = useQuery({
    queryKey: ['digitalSearchSuggestions', debouncedQuery],
    queryFn: async () => {
      if (!debouncedQuery || debouncedQuery.length < 2) return [];

      try {
        // Recherche dans les produits
        const { data: products } = await supabase
          .from('products')
          .select('id, name, category, tags')
          .eq('product_type', 'digital')
          .eq('is_active', true)
          .ilike('name', `%${debouncedQuery}%`)
          .limit(5);

        // Recherche dans les catégories
        const { data: categories } = await supabase
          .from('products')
          .select('category')
          .eq('product_type', 'digital')
          .eq('is_active', true)
          .ilike('category', `%${debouncedQuery}%`)
          .limit(5);

        // Recherche dans les tags
        const { data: tags } = await supabase
          .from('products')
          .select('tags')
          .eq('product_type', 'digital')
          .eq('is_active', true)
          .limit(50);

        const allTags =
          tags
            ?.flatMap(p => p.tags || [])
            .filter(tag => tag?.toLowerCase().includes(debouncedQuery.toLowerCase()))
            .slice(0, 5) || [];

        const  suggestions: SearchSuggestion[] = [
          ...(products?.map(p => ({
            id: p.id,
            text: p.name,
            type: 'product' as const,
          })) || []),
          ...(categories?.map((c, i) => ({
            id: `category-${i}`,
            text: c.category,
            type: 'category' as const,
          })) || []),
          ...(allTags.map((tag, i) => ({
            id: `tag-${i}`,
            text: tag,
            type: 'tag' as const,
          })) || []),
        ];

        return suggestions.slice(0, 10);
      } catch ( _error: unknown) {
        logger.error('Error fetching search suggestions', { error });
        return [];
      }
    },
    enabled: debouncedQuery.length >= 2,
  });

  // Recherche des produits
  const { data: searchResults, isLoading: searchLoading } = useQuery({
    queryKey: ['digitalProductsSearch', filters],
    queryFn: async () => {
      try {
        let  query= supabase
          .from('products')
          .select(
            `
            *,
            stores!inner (
              id,
              name,
              slug
            )
          `
          )
          .eq('product_type', 'digital')
          .eq('is_active', true)
          .eq('is_draft', false);

        // Recherche textuelle
        if (filters.query) {
          query = query.or(
            `name.ilike.%${filters.query}%,description.ilike.%${filters.query}%,category.ilike.%${filters.query}%`
          );
        }

        // Filtre catégorie
        if (filters.category !== 'all') {
          query = query.eq('category', filters.category);
        }

        // Filtre prix
        if (filters.priceRange[0] > 0) {
          query = query.gte('price', filters.priceRange[0]);
        }
        if (filters.priceRange[1] < 1000000) {
          query = query.lte('price', filters.priceRange[1]);
        }

        // Tri
        switch (filters.sortBy) {
          case 'price-asc':
            query = query.order('price', { ascending: true });
            break;
          case 'price-desc':
            query = query.order('price', { ascending: false });
            break;
          case 'popularity':
            query = query.order('sales_count', { ascending: false });
            break;
          case 'rating':
            query = query.order('average_rating', { ascending: false });
            break;
          default:
            query = query.order('created_at', { ascending: false });
        }

        const { data, error } = await query.limit(50);

        if (error) throw error;
        return data || [];
      } catch ( _error: unknown) {
        logger.error('Error searching digital products', { error });
        throw error;
      }
    },
    enabled: true,
  });

  // Catégories disponibles
  const { data: categories } = useQuery({
    queryKey: ['digitalCategories'],
    queryFn: async () => {
      const { data } = await supabase
        .from('products')
        .select('category')
        .eq('product_type', 'digital')
        .eq('is_active', true)
        .not('category', 'is', null);

      const uniqueCategories = Array.from(
        new Set(data?.map(p => p.category).filter(Boolean))
      ) as string[];

      return uniqueCategories.sort();
    },
  });

  // Mettre à jour les filtres
  useEffect(() => {
    setFilters(prev => ({ ...prev, query: debouncedQuery }));

    // Mettre à jour les URL params
    const params = new URLSearchParams();
    if (debouncedQuery) params.set('q', debouncedQuery);
    if (filters.category !== 'all') params.set('category', filters.category);
    if (filters.priceRange[0] > 0) params.set('minPrice', filters.priceRange[0].toString());
    if (filters.priceRange[1] < 1000000) params.set('maxPrice', filters.priceRange[1].toString());
    if (filters.licenseType !== 'all') params.set('license', filters.licenseType);
    if (filters.fileFormat !== 'all') params.set('format', filters.fileFormat);
    if (filters.minRating > 0) params.set('rating', filters.minRating.toString());
    if (filters.sortBy !== 'recent') params.set('sort', filters.sortBy);
    if (filters.inStock) params.set('inStock', 'true');
    if (filters.featuredOnly) params.set('featured', 'true');

    setSearchParams(params, { replace: true });
  }, [debouncedQuery, filters, setSearchParams]);

  // Gérer la sélection d'une suggestion
  const handleSuggestionSelect = (suggestion: SearchSuggestion) => {
    setSearchInput(suggestion.text);
    setShowSuggestions(false);

    if (suggestion.type === 'category') {
      setFilters(prev => ({ ...prev, category: suggestion.text }));
    } else {
      setFilters(prev => ({ ...prev, query: suggestion.text }));
    }

    saveToHistory(suggestion.text);
    searchInputRef.current?.blur();
  };

  // Recherche vocale (Web Speech API)
  const handleVoiceSearch = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      toast({
        title: 'Recherche vocale non disponible',
        description: 'Votre navigateur ne supporte pas la reconnaissance vocale',
        variant: 'destructive',
      });
      return;
    }

    type SpeechRecognitionConstructor = new () => SpeechRecognition;
    const w = window as unknown as {
      webkitSpeechRecognition?: SpeechRecognitionConstructor;
      SpeechRecognition?: SpeechRecognitionConstructor;
    };
    const Recognition = w.webkitSpeechRecognition || w.SpeechRecognition;
    if (!Recognition) {
      toast({
        title: 'Recherche vocale non disponible',
        description: 'Votre navigateur ne supporte pas la reconnaissance vocale',
        variant: 'destructive',
      });
      return;
    }

    const recognition = new Recognition();

    recognition.lang = 'fr-FR';
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => {
      setIsVoiceSearchActive(true);
    };

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const transcript = event.results[0][0].transcript;
      setSearchInput(transcript);
      saveToHistory(transcript);
      setIsVoiceSearchActive(false);
    };

    recognition.onerror = () => {
      setIsVoiceSearchActive(false);
      toast({
        title: 'Erreur de reconnaissance vocale',
        description: 'Impossible de reconnaître la parole',
        variant: 'destructive',
      });
    };

    recognition.onend = () => {
      setIsVoiceSearchActive(false);
    };

    recognition.start();
  };

  // Réinitialiser les filtres
  const resetFilters = () => {
    setFilters({
      query: '',
      category: 'all',
      priceRange: [0, 1000000],
      licenseType: 'all',
      fileFormat: 'all',
      minRating: 0,
      sortBy: 'recent',
      inStock: false,
      featuredOnly: false,
    });
    setSearchInput('');
    setSearchParams({}, { replace: true });
  };

  // Compteur de filtres actifs
  const activeFiltersCount = useMemo(() => {
    let  count= 0;
    if (filters.query) count++;
    if (filters.category !== 'all') count++;
    if (filters.priceRange[0] > 0 || filters.priceRange[1] < 1000000) count++;
    if (filters.licenseType !== 'all') count++;
    if (filters.fileFormat !== 'all') count++;
    if (filters.minRating > 0) count++;
    if (filters.inStock) count++;
    if (filters.featuredOnly) count++;
    return count;
  }, [filters]);

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-lg sm:text-2xl md:text-3xl font-bold mb-2">
            Recherche de produits digitaux
          </h1>
          <p className="text-[10px] sm:text-xs md:text-sm lg:text-base text-muted-foreground">
            Trouvez exactement ce que vous cherchez avec notre recherche avancée
          </p>
        </div>

        {/* Barre de recherche principale */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                ref={searchInputRef}
                type="text"
                placeholder="Rechercher un produit, une catégorie, un tag..."
                value={searchInput}
                onChange={e => {
                  setSearchInput(e.target.value);
                  setShowSuggestions(true);
                }}
                onFocus={() => setShowSuggestions(true)}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                className="pl-10 pr-24 h-12 text-lg"
              />
              <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleVoiceSearch}
                  disabled={isVoiceSearchActive}
                  className={cn(isVoiceSearchActive && 'bg-primary text-primary-foreground')}
                  aria-label={
                    isVoiceSearchActive
                      ? 'Arrêter la recherche vocale'
                      : 'Activer la recherche vocale'
                  }
                >
                  {isVoiceSearchActive ? (
                    <MicOff className="h-5 w-5" />
                  ) : (
                    <Mic className="h-5 w-5" />
                  )}
                </Button>
                {searchInput && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      setSearchInput('');
                      setFilters(prev => ({ ...prev, query: '' }));
                    }}
                    aria-label="Effacer la recherche"
                  >
                    <X className="h-5 w-5" />
                  </Button>
                )}
              </div>

              {/* Suggestions dropdown */}
              {showSuggestions && (debouncedQuery.length >= 2 || searchHistory.length > 0) && (
                <Card className="absolute z-50 w-full mt-2 shadow-lg">
                  <CardContent className="p-0">
                    <Command>
                      <CommandList>
                        {suggestionsLoading && (
                          <div className="p-4 text-center">
                            <Loader2 className="h-4 w-4 animate-spin mx-auto" />
                          </div>
                        )}
                        {!suggestionsLoading && suggestions && suggestions.length > 0 && (
                          <CommandGroup heading="Suggestions">
                            {suggestions.map(suggestion => (
                              <CommandItem
                                key={suggestion.id}
                                onSelect={() => handleSuggestionSelect(suggestion)}
                                className="cursor-pointer"
                              >
                                <div className="flex items-center gap-2 flex-1">
                                  {suggestion.type === 'product' && (
                                    <Sparkles className="h-4 w-4" />
                                  )}
                                  {suggestion.type === 'category' && <Zap className="h-4 w-4" />}
                                  {suggestion.type === 'tag' && <TrendingUp className="h-4 w-4" />}
                                  <span>{suggestion.text}</span>
                                </div>
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        )}
                        {searchHistory.length > 0 && (
                          <CommandGroup heading="Historique">
                            {searchHistory.slice(0, 5).map((historyItem, i) => (
                              <CommandItem
                                key={i}
                                onSelect={() => {
                                  setSearchInput(historyItem);
                                  setFilters(prev => ({ ...prev, query: historyItem }));
                                  setShowSuggestions(false);
                                }}
                                className="cursor-pointer"
                              >
                                <History className="h-4 w-4 mr-2" />
                                <span>{historyItem}</span>
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        )}
                      </CommandList>
                    </Command>
                  </CardContent>
                </Card>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Filtres rapides */}
        <div className="flex flex-wrap items-center gap-4 mb-6">
          <Popover open={showFilters} onOpenChange={setShowFilters}>
            <PopoverTrigger asChild>
              <Button variant="outline" className="gap-2">
                <SlidersHorizontal className="h-4 w-4" />
                Filtres avancés
                {activeFiltersCount > 0 && (
                  <Badge variant="secondary" className="ml-1">
                    {activeFiltersCount}
                  </Badge>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent
              className="w-[calc(100vw-2rem)] sm:w-80 max-w-[calc(100vw-2rem)] sm:max-w-sm"
              align="start"
            >
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Catégorie</label>
                  <Select
                    value={filters.category}
                    onValueChange={value => setFilters(prev => ({ ...prev, category: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Toutes les catégories</SelectItem>
                      {categories?.map(cat => (
                        <SelectItem key={cat} value={cat}>
                          {cat}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Type de licence</label>
                  <Select
                    value={filters.licenseType}
                    onValueChange={value => setFilters(prev => ({ ...prev, licenseType: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tous</SelectItem>
                      <SelectItem value="single">Single</SelectItem>
                      <SelectItem value="multi">Multi</SelectItem>
                      <SelectItem value="unlimited">Illimité</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Prix: {filters.priceRange[0].toLocaleString()} -{' '}
                    {filters.priceRange[1].toLocaleString()} XOF
                  </label>
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      placeholder="Min"
                      value={filters.priceRange[0]}
                      onChange={e =>
                        setFilters(prev => ({
                          ...prev,
                          priceRange: [parseInt(e.target.value) || 0, prev.priceRange[1]],
                        }))
                      }
                    />
                    <Input
                      type="number"
                      placeholder="Max"
                      value={filters.priceRange[1]}
                      onChange={e =>
                        setFilters(prev => ({
                          ...prev,
                          priceRange: [prev.priceRange[0], parseInt(e.target.value) || 1000000],
                        }))
                      }
                    />
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Note minimum</label>
                  <Select
                    value={filters.minRating.toString()}
                    onValueChange={value =>
                      setFilters(prev => ({ ...prev, minRating: parseInt(value) }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">Toutes</SelectItem>
                      <SelectItem value="4">4+ étoiles</SelectItem>
                      <SelectItem value="3">3+ étoiles</SelectItem>
                      <SelectItem value="2">2+ étoiles</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <Button variant="outline" onClick={resetFilters} size="sm">
                    Réinitialiser
                  </Button>
                  <Button onClick={() => setShowFilters(false)} size="sm">
                    Appliquer
                  </Button>
                </div>
              </div>
            </PopoverContent>
          </Popover>

          <Select
            value={filters.sortBy}
            onValueChange={value =>
              setFilters(prev => ({ ...prev, sortBy: value as SearchFilters['sortBy'] }))
            }
          >
            <SelectTrigger className="w-full sm:w-[180px] min-h-[44px] h-11">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="recent">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Plus récents
                </div>
              </SelectItem>
              <SelectItem value="price-asc">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  Prix croissant
                </div>
              </SelectItem>
              <SelectItem value="price-desc">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  Prix décroissant
                </div>
              </SelectItem>
              <SelectItem value="popularity">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Plus populaires
                </div>
              </SelectItem>
              <SelectItem value="rating">
                <div className="flex items-center gap-2">
                  <Star className="h-4 w-4" />
                  Mieux notés
                </div>
              </SelectItem>
            </SelectContent>
          </Select>

          {activeFiltersCount > 0 && (
            <Button variant="ghost" onClick={resetFilters} size="sm">
              <X className="h-4 w-4 mr-2" />
              Effacer ({activeFiltersCount})
            </Button>
          )}
        </div>

        {/* Résultats */}
        <div className="space-y-4">
          {searchLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <div className="h-48 bg-muted" />
                  <CardContent className="p-4 space-y-2">
                    <div className="h-4 bg-muted rounded w-3/4" />
                    <div className="h-3 bg-muted rounded w-1/2" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : searchResults && searchResults.length > 0 ? (
            <>
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  {searchResults.length} résultat{searchResults.length > 1 ? 's' : ''} trouvé
                  {searchResults.length > 1 ? 's' : ''}
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {searchResults.map(
                  (product: {
                    id: string;
                    name: string;
                    image_url?: string;
                    price: number;
                    currency: string;
                    slug: string;
                  }) => (
                    <div key={product.id}>
                      <Card
                        className="group hover:shadow-lg transition-shadow cursor-pointer"
                        onClick={() => navigate(`/digital/${product.id}`)}
                      >
                        <div className="aspect-video bg-muted rounded-t-lg overflow-hidden">
                          <ResponsiveProductImage
                            src={product.image_url}
                            alt={product.name}
                            className="w-full h-full"
                            fit="cover"
                            context="grid"
                            fallbackIcon={<FileText className="h-16 w-16 text-muted-foreground" />}
                          />
                        </div>
                        <CardContent className="p-4">
                          <h3 className="font-semibold mb-2 line-clamp-2">{product.name}</h3>
                          <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                            {product.description}
                          </p>
                          <div className="flex items-center justify-between">
                            <span className="text-lg font-bold">
                              {product.price.toLocaleString()} {product.currency}
                            </span>
                            {product.average_rating > 0 && (
                              <div className="flex items-center gap-1">
                                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                                <span className="text-sm">{product.average_rating.toFixed(1)}</span>
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  )
                )}
              </div>
            </>
          ) : (
            <Card className="p-12 text-center">
              <Search className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-xl font-semibold mb-2">Aucun résultat</h3>
              <p className="text-muted-foreground mb-4">
                Essayez de modifier vos critères de recherche
              </p>
              <Button variant="outline" onClick={resetFilters}>
                Réinitialiser les filtres
              </Button>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};






