/**
 * Enhanced Product Type Selector - Professional & Optimized
 * Date: 2025-01-01
 * 
 * Sélecteur de type de produit amélioré avec :
 * - Design moderne et visuel professionnel
 * - Statistiques par type
 * - Responsive total
 * - Fonctionnalités avancées (recherche, filtres, raccourcis clavier)
 * - Animations et transitions fluides
 */

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import {
  Package,
  Smartphone,
  Wrench,
  GraduationCap,
  CheckCircle2,
  TrendingUp,
  FileText,
  Sparkles,
  Search,
  Filter,
  X,
  ArrowRight,
  Info,
  Keyboard,
  Palette,
  Music,
  BookOpen,
  Brush,
  Video,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';

interface ProductType {
  value: string;
  label: string;
  icon: React.ComponentType<any>;
  description: string;
  features: string[];
  color: 'blue' | 'orange' | 'green' | 'purple';
  gradient: string;
  popular: boolean;
  recommended?: boolean;
  examples: string[];
  bgColorClass: string;
  iconBgClass: string;
  iconTextClass: string;
  buttonClass: string;
  checkIconClass: string;
}

const PRODUCT_TYPES: ProductType[] = [
  {
    value: 'digital',
    label: 'Produit Digital',
    icon: Smartphone,
    description: 'Ebooks, logiciels, templates, fichiers téléchargeables',
    features: [
      'Téléchargement instantané',
      'Pas de gestion stock',
      'Livraison automatique',
      'Licences & DRM',
    ],
    color: 'blue',
    gradient: 'from-blue-500 to-cyan-500',
    popular: true,
    recommended: true,
    examples: ['Ebook', 'Template', 'Plugin', 'Logiciel'],
    bgColorClass: 'bg-blue-500/20 group-hover:bg-blue-500/30',
    iconTextClass: 'text-blue-500',
    buttonClass: 'bg-blue-500 hover:bg-blue-600 focus:ring-blue-500',
    checkIconClass: 'text-blue-500',
  },
  {
    value: 'course',
    label: 'Cours en ligne',
    icon: GraduationCap,
    description: 'Formations vidéo structurées avec quiz et certificats',
    features: [
      'Vidéos HD',
      'Quiz & Certificats',
      'Suivi progression',
      'Discussions & Q&A',
    ],
    color: 'orange',
    gradient: 'from-orange-500 to-amber-500',
    popular: true,
    recommended: true,
    examples: ['Formation', 'Masterclass', 'Tutoriel', 'Webinar'],
    bgColorClass: 'bg-orange-500/20 group-hover:bg-orange-500/30',
    iconTextClass: 'text-orange-500',
    buttonClass: 'bg-orange-500 hover:bg-orange-600 focus:ring-orange-500',
    checkIconClass: 'text-orange-500',
  },
  {
    value: 'physical',
    label: 'Produit Physique',
    icon: Package,
    description: 'Vêtements, accessoires, objets artisanaux',
    features: [
      'Variants & Attributs',
      'Gestion inventaire',
      'Suivi livraison',
      'Options shipping',
    ],
    color: 'green',
    gradient: 'from-green-500 to-emerald-500',
    popular: false,
    examples: ['Vêtements', 'Accessoires', 'Artisanat', 'Électronique'],
    bgColorClass: 'bg-green-500/20 group-hover:bg-green-500/30',
    iconTextClass: 'text-green-500',
    buttonClass: 'bg-green-500 hover:bg-green-600 focus:ring-green-500',
    checkIconClass: 'text-green-500',
  },
  {
    value: 'service',
    label: 'Service',
    icon: Wrench,
    description: 'Consultations, coaching, prestations sur mesure',
    features: [
      'Calendrier réservations',
      'Sessions en ligne/présentiel',
      'Packages & Abonnements',
      'Disponibilités flexibles',
    ],
    color: 'purple',
    gradient: 'from-purple-500 to-pink-500',
    popular: false,
    examples: ['Consultation', 'Coaching', 'Design', 'Développement'],
    bgColorClass: 'bg-purple-500/20 group-hover:bg-purple-500/30',
    iconTextClass: 'text-purple-500',
    buttonClass: 'bg-purple-500 hover:bg-purple-600 focus:ring-purple-500',
    checkIconClass: 'text-purple-500',
  },
  {
    value: 'artist',
    label: 'Œuvre d\'Artiste',
    icon: Palette,
    description: 'Livres, musique, arts visuels, designs, créations artistiques',
    features: [
      'Portfolio artiste',
      'Certificats d\'authenticité',
      'Éditions limitées',
      'Galerie virtuelle',
    ],
    color: 'purple',
    gradient: 'from-pink-500 to-rose-500',
    popular: true,
    recommended: true,
    examples: ['Livre', 'Album', 'Peinture', 'Design', 'Photo'],
    bgColorClass: 'bg-pink-500/20 group-hover:bg-pink-500/30',
    iconTextClass: 'text-pink-500',
    buttonClass: 'bg-pink-500 hover:bg-pink-600 focus:ring-pink-500',
    checkIconClass: 'text-pink-500',
  },
];

interface EnhancedProductTypeSelectorProps {
  onSelect: (type: string) => void;
  storeId: string;
}

interface ProductStats {
  digital: number;
  course: number;
  physical: number;
  service: number;
  total: number;
}

type FilterType = 'all' | 'popular' | 'recommended';

/**
 * Enhanced Product Type Selector
 * 
 * Affiche un sélecteur visuel avec statistiques et recommandations
 */
export const EnhancedProductTypeSelector = ({
  onSelect,
  storeId,
}: EnhancedProductTypeSelectorProps) => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<ProductStats>({
    digital: 0,
    course: 0,
    physical: 0,
    service: 0,
    artist: 0,
    total: 0,
  });
  const [hoveredType, setHoveredType] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<FilterType>('all');
  const [showShortcuts, setShowShortcuts] = useState(false);

  // Refs for animations
  const headerRef = useScrollAnimation<HTMLDivElement>();
  const statsRef = useScrollAnimation<HTMLDivElement>();
  const gridRef = useScrollAnimation<HTMLDivElement>();

  /**
   * Charger les statistiques de produits
   */
  useEffect(() => {
    const loadStats = async () => {
      try {
        logger.info('Chargement des statistiques produits', { storeId });
        
        const { data, error } = await supabase
          .from('products')
          .select('product_type')
          .eq('store_id', storeId);

        if (error) throw error;

        const newStats: ProductStats = {
          digital: 0,
          course: 0,
          physical: 0,
          service: 0,
          artist: 0,
          total: data?.length || 0,
        };

        data?.forEach((product) => {
          const type = product.product_type as keyof ProductStats;
          if (type && type in newStats) {
            newStats[type]++;
          }
        });

        setStats(newStats);
        logger.info('Statistiques produits chargées', { stats: newStats });
      } catch (error) {
        logger.error('Erreur lors du chargement des statistiques', { error });
      } finally {
        setLoading(false);
      }
    };

    if (storeId) {
      loadStats();
    }
  }, [storeId]);

  /**
   * Filter products based on search and filter
   */
  const filteredTypes = useMemo(() => {
    let filtered = PRODUCT_TYPES;

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(type =>
        type.label.toLowerCase().includes(query) ||
        type.description.toLowerCase().includes(query) ||
        type.features.some(f => f.toLowerCase().includes(query)) ||
        type.examples.some(e => e.toLowerCase().includes(query))
      );
    }

    // Apply type filter
    if (filter === 'popular') {
      filtered = filtered.filter(type => type.popular);
    } else if (filter === 'recommended') {
      filtered = filtered.filter(type => type.recommended);
    }

    return filtered;
  }, [searchQuery, filter]);

  /**
   * Handle product type selection
   */
  const handleSelect = useCallback((type: string) => {
    logger.info('Type de produit sélectionné', { type });
    onSelect(type);
  }, [onSelect]);

  /**
   * Keyboard shortcuts
   */
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept if in input
      if (e.target instanceof HTMLInputElement) return;

      // 1-4: Select product type
      if (e.key >= '1' && e.key <= '4') {
        const index = parseInt(e.key) - 1;
        if (filteredTypes[index]) {
          e.preventDefault();
          handleSelect(filteredTypes[index].value);
        }
      }

      // ?: Show shortcuts
      if (e.key === '?') {
        e.preventDefault();
        setShowShortcuts(prev => !prev);
      }

      // Escape: Clear search
      if (e.key === 'Escape') {
        setSearchQuery('');
        setFilter('all');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [filteredTypes, handleSelect]);

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 animate-in fade-in duration-500">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="relative overflow-hidden">
            <CardHeader className="pb-3">
              <Skeleton className="h-6 w-3/4 mb-2" />
              <Skeleton className="h-4 w-full" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-24 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header avec stats globales - Responsive */}
      <Card 
        ref={headerRef}
        className="bg-gradient-to-r from-blue-500/10 via-primary/10 to-cyan-500/10 border-primary/20 backdrop-blur-sm shadow-lg animate-in fade-in slide-in-from-top-4 duration-700"
      >
        <CardContent className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 sm:gap-6 py-4 sm:py-6 px-3 sm:px-6">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="p-2 sm:p-3 rounded-xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20 backdrop-blur-sm border border-blue-500/30 animate-in zoom-in duration-500">
              <Package className="h-6 w-6 sm:h-8 sm:w-8 text-blue-500 dark:text-blue-400" aria-hidden="true" />
            </div>
            <div>
              <h3 className="text-xl sm:text-2xl lg:text-3xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                {stats.total}
              </h3>
              <p className="text-xs sm:text-sm text-muted-foreground">
                {stats.total === 0 
                  ? t('products.stats.none', 'Aucun produit') 
                  : stats.total === 1 
                  ? t('products.stats.one', '1 produit créé')
                  : t('products.stats.many', '{{count}} produits créés', { count: stats.total })}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3 sm:gap-4 lg:gap-6">
            {Object.entries(stats).map(([type, count]) => {
              if (type === 'total') return null;
              const productType = PRODUCT_TYPES.find(pt => pt.value === type);
              if (!productType || count === 0) return null;
              
              return (
                <div 
                  key={type} 
                  className="text-center animate-in fade-in zoom-in duration-500"
                  style={{ animationDelay: `${Object.keys(stats).indexOf(type) * 100}ms` }}
                >
                  <div className="text-lg sm:text-xl font-semibold text-primary">{count}</div>
                  <div className="text-[10px] sm:text-xs text-muted-foreground capitalize">
                    {productType.label}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Search and Filter Bar - Advanced Features */}
      <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" aria-hidden="true" />
          <Input
            placeholder={t('products.search', 'Rechercher un type de produit...')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 pr-9"
            aria-label={t('products.search', 'Rechercher un type de produit')}
          />
          {searchQuery && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSearchQuery('')}
              className="absolute right-1 top-1/2 transform -translate-y-1/2 h-7 w-7 p-0"
              aria-label={t('common.clear', 'Effacer')}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
        <div className="flex gap-2">
          <Button
            variant={filter === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('all')}
            className="gap-1.5"
          >
            <Filter className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">{t('products.filters.all', 'Tous')}</span>
          </Button>
          <Button
            variant={filter === 'popular' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('popular')}
            className="gap-1.5"
          >
            <TrendingUp className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">{t('products.filters.popular', 'Populaire')}</span>
          </Button>
          <Button
            variant={filter === 'recommended' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('recommended')}
            className="gap-1.5"
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">{t('products.filters.recommended', 'Recommandé')}</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowShortcuts(prev => !prev)}
            className="gap-1.5"
            aria-label={t('common.shortcuts', 'Raccourcis clavier')}
          >
            <Keyboard className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">?</span>
          </Button>
        </div>
      </div>

      {/* Keyboard Shortcuts Help */}
      {showShortcuts && (
        <Card className="border-blue-500/30 bg-blue-50 dark:bg-blue-950/20 animate-in fade-in slide-in-from-top-4">
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <h4 className="font-semibold text-sm sm:text-base mb-2 flex items-center gap-2">
                  <Keyboard className="h-4 w-4" />
                  {t('common.shortcuts', 'Raccourcis clavier')}
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs sm:text-sm">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="font-mono text-[10px]">1-4</Badge>
                    <span className="text-muted-foreground">{t('products.shortcuts.select', 'Sélectionner un type')}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="font-mono text-[10px]">?</Badge>
                    <span className="text-muted-foreground">{t('products.shortcuts.help', 'Afficher l\'aide')}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="font-mono text-[10px]">Esc</Badge>
                    <span className="text-muted-foreground">{t('products.shortcuts.clear', 'Effacer la recherche')}</span>
                  </div>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowShortcuts(false)}
                className="h-6 w-6 p-0"
                aria-label={t('common.close', 'Fermer')}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Grid des types de produits - Responsive avec animations */}
      <div 
        ref={gridRef}
        className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 animate-in fade-in slide-in-from-bottom-4 duration-700"
      >
        {filteredTypes.length === 0 ? (
          <Card className="col-span-1 lg:col-span-2 p-8 sm:p-12">
            <div className="text-center animate-in fade-in zoom-in duration-500">
              <Search className="h-12 w-12 sm:h-16 sm:w-16 mx-auto text-muted-foreground mb-4" aria-hidden="true" />
              <h3 className="text-lg sm:text-xl font-semibold mb-2">
                {t('products.noResults', 'Aucun résultat')}
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                {t('products.noResultsDesc', 'Essayez de modifier vos critères de recherche')}
              </p>
              <Button
                variant="outline"
                onClick={() => {
                  setSearchQuery('');
                  setFilter('all');
                }}
              >
                {t('products.resetFilters', 'Réinitialiser les filtres')}
              </Button>
            </div>
          </Card>
        ) : (
          filteredTypes.map((type, index) => {
            const Icon = type.icon;
            const count = stats[type.value as keyof ProductStats] || 0;
            const isHovered = hoveredType === type.value;

            return (
              <Card
                key={type.value}
                className={cn(
                  'relative overflow-hidden transition-all duration-300 cursor-pointer group',
                  'hover:shadow-2xl hover:scale-[1.02] hover:border-primary/50',
                  'animate-in fade-in slide-in-from-bottom-4',
                  'touch-manipulation',
                  isHovered && 'ring-2 ring-primary shadow-xl',
                  'bg-card/50 backdrop-blur-sm'
                )}
                style={{ animationDelay: `${index * 100}ms` }}
                onMouseEnter={() => setHoveredType(type.value)}
                onMouseLeave={() => setHoveredType(null)}
                onClick={() => handleSelect(type.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleSelect(type.value);
                  }
                }}
                tabIndex={0}
                role="button"
                aria-label={`${t('products.create', 'Créer un')} ${type.label.toLowerCase()}`}
              >
                {/* Gradient background on hover */}
                <div
                  className={cn(
                    'absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-300',
                    'bg-gradient-to-br',
                    type.gradient
                  )}
                />

                {/* Badges */}
                <div className="absolute top-3 sm:top-4 right-3 sm:right-4 flex flex-wrap gap-1.5 sm:gap-2 z-10">
                  {type.popular && (
                    <Badge 
                      variant="secondary" 
                      className="bg-orange-500/20 text-orange-600 dark:text-orange-400 border-orange-500/30 text-[10px] sm:text-xs animate-in zoom-in duration-300"
                    >
                      <TrendingUp className="h-3 w-3 mr-1" aria-hidden="true" />
                      <span className="hidden sm:inline">{t('products.badges.popular', 'Populaire')}</span>
                      <span className="sm:hidden">{t('products.badges.popularShort', 'Pop')}</span>
                    </Badge>
                  )}
                  {type.recommended && (
                    <Badge 
                      variant="secondary" 
                      className="bg-blue-500/20 text-blue-600 dark:text-blue-400 border-blue-500/30 text-[10px] sm:text-xs animate-in zoom-in duration-300"
                      style={{ animationDelay: '100ms' }}
                    >
                      <Sparkles className="h-3 w-3 mr-1" aria-hidden="true" />
                      <span className="hidden sm:inline">{t('products.badges.recommended', 'Recommandé')}</span>
                      <span className="sm:hidden">{t('products.badges.recommendedShort', 'Rec')}</span>
                      {count > 0 && (
                        <span className="ml-1">({count})</span>
                      )}
                    </Badge>
                  )}
                  {count > 0 && !type.recommended && (
                    <Badge variant="outline" className="text-[10px] sm:text-xs">
                      {count}
                    </Badge>
                  )}
                </div>

                <CardHeader className="pb-3 sm:pb-4 pt-4 sm:pt-5">
                  <div className="flex items-start gap-3 sm:gap-4">
                    <div className={cn(
                      'p-2.5 sm:p-3 rounded-xl transition-all duration-300',
                      type.bgColorClass,
                      'group-hover:scale-110 group-hover:rotate-3'
                    )}>
                      <Icon className={cn('h-6 w-6 sm:h-8 sm:w-8 transition-transform duration-300', type.iconTextClass)} aria-hidden="true" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-lg sm:text-xl mb-1 sm:mb-2 font-bold group-hover:text-primary transition-colors">
                        {type.label}
                      </CardTitle>
                      <CardDescription className="text-xs sm:text-sm line-clamp-2">
                        {type.description}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-3 sm:space-y-4 pt-0">
                  {/* Features list */}
                  <div className="space-y-1.5 sm:space-y-2">
                    {type.features.map((feature, index) => (
                      <div 
                        key={index} 
                        className="flex items-center gap-2 text-xs sm:text-sm animate-in fade-in slide-in-from-left-4"
                        style={{ animationDelay: `${index * 50}ms` }}
                      >
                        <CheckCircle2 className={cn('h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0', type.checkIconClass)} aria-hidden="true" />
                        <span className="text-muted-foreground">{feature}</span>
                      </div>
                    ))}
                  </div>

                  {/* Examples */}
                  <div>
                    <p className="text-[10px] sm:text-xs font-medium text-muted-foreground mb-1.5 sm:mb-2">
                      {t('products.examples', 'Exemples')} :
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {type.examples.map((example, index) => (
                        <Badge 
                          key={index} 
                          variant="outline" 
                          className="text-[10px] sm:text-xs hover:bg-primary/10 transition-colors"
                        >
                          {example}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {/* CTA Button */}
                  <Button
                    className={cn(
                      'w-full mt-2 sm:mt-3 transition-all duration-300',
                      type.buttonClass,
                      'shadow-md hover:shadow-lg hover:scale-105 active:scale-95',
                      'text-xs sm:text-sm font-semibold'
                    )}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSelect(type.value);
                    }}
                    size="sm"
                    aria-label={`${t('products.create', 'Créer un')} ${type.label.toLowerCase()}`}
                  >
                    <span className="hidden sm:inline">{t('products.create', 'Créer un')} {type.label.toLowerCase()}</span>
                    <span className="sm:hidden">{t('products.createShort', 'Créer')}</span>
                    <ArrowRight className="h-3.5 w-3.5 sm:h-4 sm:w-4 ml-2 group-hover:translate-x-1 transition-transform" aria-hidden="true" />
                  </Button>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* Help section - Responsive */}
      <Card 
        ref={statsRef}
        className="bg-gradient-to-r from-muted/30 to-muted/20 border-border/50 backdrop-blur-sm animate-in fade-in slide-in-from-bottom-4 duration-700"
      >
        <CardContent className="flex flex-col sm:flex-row items-start gap-3 sm:gap-4 py-4 sm:py-6 px-3 sm:px-6">
          <div className="p-2 sm:p-2.5 rounded-lg bg-primary/10 flex-shrink-0">
            <Info className="h-4 w-4 sm:h-5 sm:w-5 text-primary" aria-hidden="true" />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-sm sm:text-base mb-1.5 sm:mb-2">
              {t('products.help.title', 'Besoin d\'aide pour choisir ?')}
            </h4>
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
              {t('products.help.description', 'Chaque type de produit est optimisé pour un cas d\'usage spécifique.')}
              {' '}
              <strong>{t('products.help.courses', 'Les Cours en ligne')}</strong>
              {' '}
              {t('products.help.coursesDesc', 'sont parfaits pour des formations structurées avec vidéos et quiz.')}
              {' '}
              <strong>{t('products.help.digital', 'Les Produits digitaux')}</strong>
              {' '}
              {t('products.help.digitalDesc', 'pour des fichiers téléchargeables.')}
              {' '}
              <strong>{t('products.help.physical', 'Les Produits physiques')}</strong>
              {' '}
              {t('products.help.physicalDesc', 'nécessitent une livraison.')}
              {' '}
              <strong>{t('products.help.services', 'Les Services')}</strong>
              {' '}
              {t('products.help.servicesDesc', 'pour des prestations avec réservations.')}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
