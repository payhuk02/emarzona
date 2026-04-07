/**
 * Page de Recommandations Personnalisées
 * Affiche les produits recommandés basés sur le profil de style de l'utilisateur
 */

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { logger } from '@/lib/logger';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';
import { useDebounce } from '@/hooks/useDebounce';
import {
  Sparkles,
  ShoppingBag,
  Heart,
  Star,
  RefreshCw,
  ArrowLeft,
  Search,
  TrendingUp,
  Target,
  Palette,
  Zap,
  Package,
  Loader2,
  AlertTriangle,
  DollarSign,
  BarChart3,
  X,
  Keyboard
} from 'lucide-react';
import { useStylePreferences } from '@/hooks/useStylePreferences';
import { useProductRecommendations } from '@/hooks/useProductRecommendations';
import type { Database } from '@/integrations/supabase/types';

type Product = Database['public']['Tables']['products']['Row'] & {
  store?: Database['public']['Tables']['stores']['Row'];
  average_rating?: number;
  total_reviews?: number;
};

type StyleProfile = {
  primaryStyle: string;
  secondaryStyle: string;
  colorPalette: string[];
  budgetRange: string;
  preferredCategories: string[];
  shoppingFrequency: string;
  stylePreferences: Record<string, any>;
  confidence: number;
};

const PersonalizedRecommendationsPage: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { styleProfile, hasCompletedQuiz, updateRecommendationsViewed, refreshRecommendations } = useStylePreferences();
  const { getPersonalizedRecommendations } = useProductRecommendations();

  const [recommendations, setRecommendations] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchInput, setSearchInput] = useState('');
  const debouncedSearch = useDebounce(searchInput, 300);
  const [activeTab, setActiveTab] = useState('all');
  const [isExporting, setIsExporting] = useState(false);

  // Animations au scroll
  const headerRef = useScrollAnimation<HTMLDivElement>();
  const statsRef = useScrollAnimation<HTMLDivElement>();
  const filtersRef = useScrollAnimation<HTMLDivElement>();
  const recommendationsRef = useScrollAnimation<HTMLDivElement>();

  // Rediriger vers le quiz si pas complété
  useEffect(() => {
    if (!hasCompletedQuiz) {
      navigate('/personalization/quiz');
      return;
    }
  }, [hasCompletedQuiz, navigate]);

  // Charger les recommandations
  useEffect(() => {
    if (hasCompletedQuiz) {
      loadRecommendations();
    }
  }, [hasCompletedQuiz]);

  const loadRecommendations = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const products = await getPersonalizedRecommendations(20); // 20 produits max
      setRecommendations(products);

      // Marquer comme vues
      await updateRecommendationsViewed();

      logger.info('Personalized recommendations loaded', {
        productCount: products.length,
        styleProfile: styleProfile?.primaryStyle
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors du chargement des recommandations';
      setError(errorMessage);
      logger.error('Failed to load personalized recommendations', { error: err });

      toast({
        title: 'Erreur',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefreshRecommendations = async () => {
    try {
      setIsRefreshing(true);
      await refreshRecommendations();
      await loadRecommendations();

      toast({
        title: 'Recommandations actualisées',
        description: 'Vos recommandations ont été mises à jour selon vos nouveaux goûts.',
      });
    } catch (err) {
      logger.error('Failed to refresh recommendations', { error: err });
      toast({
        title: 'Erreur',
        description: 'Impossible d\'actualiser les recommandations.',
        variant: 'destructive',
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleProductClick = (productId: string) => {
    navigate(`/product/${productId}`);
  };

  const handleViewAllProducts = () => {
    navigate('/marketplace');
  };

  // Filtrer les recommandations
  const filteredRecommendations = useMemo(() => {
    if (!recommendations) return [];

    return recommendations.filter((product) => {
      // Filtre par recherche
      if (debouncedSearch) {
        const searchLower = debouncedSearch.toLowerCase();
        const matchesSearch =
          product.name?.toLowerCase().includes(searchLower) ||
          product.description?.toLowerCase().includes(searchLower) ||
          product.category?.toLowerCase().includes(searchLower) ||
          product.store?.name?.toLowerCase().includes(searchLower);

        if (!matchesSearch) return false;
      }

      // Filtre par onglet actif
      if (activeTab !== 'all') {
        const productType = product.product_type || 'digital';
        if (activeTab === 'digital' && productType !== 'digital') return false;
        if (activeTab === 'physical' && productType !== 'physical') return false;
        if (activeTab === 'service' && productType !== 'service') return false;
        if (activeTab === 'course' && productType !== 'course') return false;
        if (activeTab === 'artist' && productType !== 'artist') return false;
      }

      return true;
    });
  }, [recommendations, debouncedSearch, activeTab]);

  // Statistiques des recommandations
  const stats = useMemo(() => {
    if (!recommendations) return { total: 0, digital: 0, physical: 0, service: 0, course: 0, artist: 0 };

    return {
      total: recommendations.length,
      digital: recommendations.filter(p => p.product_type === 'digital').length,
      physical: recommendations.filter(p => p.product_type === 'physical').length,
      service: recommendations.filter(p => p.product_type === 'service').length,
      course: recommendations.filter(p => p.product_type === 'course').length,
      artist: recommendations.filter(p => p.product_type === 'artist').length,
    };
  }, [recommendations]);

  // Handle refresh avec logger
  const handleRefresh = useCallback(() => {
    setError(null);
    handleRefreshRecommendations();
    logger.info('Personalized recommendations refreshed');
    toast({
      title: '✅ Actualisé',
      description: 'Vos recommandations ont été actualisées.',
    });
  }, [toast]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl/Cmd + K pour recherche
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        document.getElementById('search-recommendations')?.focus();
      }
      // Esc pour effacer recherche
      if (e.key === 'Escape' && document.activeElement?.id === 'search-recommendations') {
        setSearchInput('');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  if (!hasCompletedQuiz) {
    return (
      <SidebarProvider>
        <div className="flex min-h-screen w-full">
          <AppSidebar />
          <main className="flex-1 p-4 md:p-6 space-y-6">
            <div className="flex items-center justify-center h-[60vh]">
              <div className="text-center space-y-4">
                <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary" />
                <p className="text-muted-foreground">Vérification de votre profil de style...</p>
              </div>
            </div>
          </main>
        </div>
      </SidebarProvider>
    );
  }

  if (isLoading) {
    return (
      <SidebarProvider>
        <div className="flex min-h-screen w-full">
          <AppSidebar />
          <main className="flex-1 p-4 md:p-6 space-y-6">
            <div className="flex items-center justify-center h-[60vh]">
              <div className="text-center space-y-4">
                <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary" />
                <p className="text-muted-foreground">Chargement de vos recommandations personnalisées...</p>
              </div>
            </div>
          </main>
        </div>
      </SidebarProvider>
    );
  }

  if (error) {
    return (
      <SidebarProvider>
        <div className="flex min-h-screen w-full">
          <AppSidebar />
          <main className="flex-1 p-4 md:p-6">
            <Card className="border-border/50 bg-card/50 backdrop-blur-sm animate-in fade-in slide-in-from-top-4">
              <CardContent className="p-6 sm:p-8 md:p-12 text-center">
                <AlertTriangle className="h-12 w-12 sm:h-16 sm:w-16 text-red-500 mx-auto mb-3 sm:mb-4" />
                <h2 className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold mb-1.5 sm:mb-2">Erreur de chargement</h2>
                <p className="text-[10px] sm:text-xs md:text-sm lg:text-base text-muted-foreground mb-4 sm:mb-6">{error}</p>
                <Button onClick={loadRecommendations} className="min-h-[44px] text-xs sm:text-sm">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Réessayer
                </Button>
              </CardContent>
            </Card>
          </main>
        </div>
      </SidebarProvider>
    );
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background">
        <AppSidebar />
        <main className="flex-1 overflow-auto">
          <div className="container mx-auto p-3 sm:p-4 lg:p-6 space-y-4 sm:space-y-6">
          {/* Header avec animation - Style MyTemplates */}
          <div ref={headerRef} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 animate-in fade-in slide-in-from-top-4 duration-700">
            <div>
              <h1 className="text-lg sm:text-2xl md:text-3xl lg:text-4xl font-bold flex items-center gap-1.5 sm:gap-2 mb-1 sm:mb-2">
                <div className="p-1.5 sm:p-2 rounded-lg bg-gradient-to-br from-purple-500/10 to-pink-500/5 backdrop-blur-sm border border-purple-500/20 animate-in zoom-in duration-500">
                  <Sparkles className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 lg:h-8 lg:w-8 text-purple-500 dark:text-purple-400" aria-hidden="true" />
                </div>
                <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                  Vos Recommandations Personnalisées
                </span>
              </h1>
              {styleProfile && (
                <p className="text-sm sm:text-base lg:text-lg text-muted-foreground animate-in fade-in slide-in-from-left-4 duration-500 delay-200">
                  Basé sur votre style <Badge variant="secondary" className="ml-1">{styleProfile.primaryStyle}</Badge>
                  {styleProfile.secondaryStyle && (
                    <> et <Badge variant="outline" className="ml-1">{styleProfile.secondaryStyle}</Badge></>
                  )}
                </p>
              )}
            </div>

          {styleProfile && (
            <div className="mb-6">
              <p className="text-muted-foreground mb-4">
                Basé sur votre style <Badge variant="secondary">{styleProfile.primaryStyle}</Badge>
                {styleProfile.secondaryStyle && (
                  <> et <Badge variant="outline">{styleProfile.secondaryStyle}</Badge></>
                )}
              </p>

              {styleProfile.colorPalette && styleProfile.colorPalette.length > 0 && (
                <div className="flex flex-wrap justify-center gap-2 mb-4">
                  <span className="text-sm text-muted-foreground mr-2">Palette préférée:</span>
                  {styleProfile.colorPalette.slice(0, 3).map((color, index) => (
                    <div
                      key={index}
                      className="w-6 h-6 rounded-full border-2 border-white shadow-sm"
                      style={{ backgroundColor: color }}
                      title={color}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

            <div className="flex items-center gap-2">
              <Button
                onClick={() => navigate('/personalization/quiz')}
                variant="outline"
                size="sm"
                className="min-h-[44px] h-9 sm:h-10 text-xs sm:text-sm transition-all hover:scale-105"
              >
                <ArrowLeft className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
                <span className="hidden sm:inline">Refaire Quiz</span>
                <span className="sm:hidden">Quiz</span>
              </Button>
              <Button
                onClick={handleViewAllProducts}
                size="sm"
                className="min-h-[44px] h-9 sm:h-10 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 text-xs sm:text-sm"
              >
                <ShoppingBag className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
                <span className="hidden sm:inline">Voir Produits</span>
                <span className="sm:hidden">Produits</span>
              </Button>
            </div>
          </div>

          {/* Stats Cards - Style Purple-Pink Gradient */}
          <div
            ref={statsRef}
            className="grid gap-3 sm:gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 animate-in fade-in slide-in-from-bottom-4 duration-700"
          >
            {[
              { label: 'Total', value: stats.total, icon: Sparkles, color: "from-purple-600 to-pink-600" },
              { label: 'Digital', value: stats.digital, icon: Package, color: "from-blue-600 to-cyan-600" },
              { label: 'Physique', value: stats.physical, icon: ShoppingBag, color: "from-green-600 to-emerald-600" },
              { label: 'Service', value: stats.service, icon: TrendingUp, color: "from-yellow-600 to-orange-600" },
              { label: 'Cours', value: stats.course, icon: Target, color: "from-red-600 to-rose-600" },
              { label: 'Artiste', value: stats.artist, icon: Palette, color: "from-indigo-600 to-purple-600" },
            ].map((stat, index) => {
              const Icon = stat.icon;
              return (
                <Card
                  key={stat.label}
                  className="border-border/50 bg-card/50 backdrop-blur-sm hover:shadow-lg transition-all duration-300 hover:scale-[1.02] animate-in fade-in slide-in-from-bottom-4"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <CardContent className="p-3 sm:p-4 lg:p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs sm:text-sm font-medium text-muted-foreground mb-1">{stat.label}</p>
                        <p className="text-lg sm:text-xl lg:text-2xl font-bold">{stat.value}</p>
                      </div>
                      <div className={`p-1.5 sm:p-2 rounded-lg bg-gradient-to-br ${stat.color} shadow-lg`}>
                        <Icon className="h-3 w-3 sm:h-4 sm:w-4 text-white" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Filters and Search */}
          <div ref={filtersRef} className="flex flex-col sm:flex-row gap-3 sm:gap-4 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                id="search-recommendations"
                placeholder="Rechercher dans vos recommandations... (Ctrl+K)"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="pl-10 h-9 sm:h-10 text-sm border-border/50 bg-background/50 backdrop-blur-sm focus:border-purple-500/50 transition-all"
              />
              {searchInput && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSearchInput('')}
                  className="absolute right-1 top-1/2 transform -translate-y-1/2 h-7 w-7 p-0 hover:bg-muted"
                >
                  <X className="h-3 w-3" />
                </Button>
              )}
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full sm:w-auto">
              <TabsList className="grid w-full grid-cols-3 sm:grid-cols-6 h-9 sm:h-10">
                <TabsTrigger value="all" className="text-xs sm:text-sm">Tous</TabsTrigger>
                <TabsTrigger value="digital" className="text-xs sm:text-sm">Digital</TabsTrigger>
                <TabsTrigger value="physical" className="text-xs sm:text-sm">Physique</TabsTrigger>
                <TabsTrigger value="service" className="text-xs sm:text-sm">Service</TabsTrigger>
                <TabsTrigger value="course" className="text-xs sm:text-sm">Cours</TabsTrigger>
                <TabsTrigger value="artist" className="text-xs sm:text-sm">Artiste</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>

        {/* Recommendations Grid */}
        <div ref={recommendationsRef} className="animate-in fade-in slide-in-from-bottom-4 duration-700 delay-500">
          {filteredRecommendations.length === 0 ? (
            <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
              <CardContent className="p-8 sm:p-12 text-center">
                <Heart className="h-12 w-12 sm:h-16 sm:w-16 text-muted-foreground mx-auto mb-3 sm:mb-4" />
                <h3 className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold mb-1.5 sm:mb-2">
                  {searchInput || activeTab !== 'all' ? 'Aucune recommandation trouvée' : 'Aucune recommandation disponible'}
                </h3>
                <p className="text-[10px] sm:text-xs md:text-sm lg:text-base text-muted-foreground mb-4 sm:mb-6">
                  {searchInput || activeTab !== 'all'
                    ? 'Essayez de modifier vos critères de recherche ou de filtre.'
                    : 'Nous n\'avons pas encore de recommandations personnalisées pour vous. Complétez votre profil de style !'
                  }
                </p>
                {(searchInput || activeTab !== 'all') && (
                  <Button
                    onClick={() => {
                      setSearchInput('');
                      setActiveTab('all');
                    }}
                    variant="outline"
                    className="min-h-[44px] text-xs sm:text-sm"
                  >
                    <X className="h-4 w-4 mr-2" />
                    Réinitialiser les filtres
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
              {filteredRecommendations.map((product, index) => (
                <Card
                  key={product.id}
                  className="group border-border/50 bg-card/50 backdrop-blur-sm hover:shadow-xl transition-all duration-300 hover:scale-[1.02] cursor-pointer animate-in fade-in slide-in-from-bottom-4"
                  style={{ animationDelay: `${index * 50}ms` }}
                  onClick={() => handleProductClick(product.id)}
                >
                  <CardHeader className="p-0">
                    <div className="aspect-square relative overflow-hidden rounded-t-lg bg-muted">
                      {product.image_url ? (
                        <img
                          src={product.image_url}
                          alt={product.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Package className="h-12 w-12 text-muted-foreground" />
                        </div>
                      )}
                      <div className="absolute top-2 right-2">
                        <Badge variant="secondary" className="bg-black/70 text-white border-0">
                          <Heart className="h-3 w-3 mr-1" />
                          Recommandé
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-4">
                    <div className="space-y-2">
                      <h3 className="font-semibold text-sm line-clamp-2 group-hover:text-primary transition-colors">
                        {product.name}
                      </h3>
                      {product.store?.name && (
                        <p className="text-xs text-muted-foreground">
                          Par {product.store.name}
                        </p>
                      )}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1">
                          {product.average_rating && (
                            <>
                              <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                              <span className="text-xs text-muted-foreground">
                                {product.average_rating.toFixed(1)}
                              </span>
                            </>
                          )}
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {product.product_type || 'digital'}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-primary">
                          {product.price?.toLocaleString('fr-FR')} {product.currency || 'XOF'}
                        </span>
                        {product.promotional_price && product.promotional_price < (product.price || 0) && (
                          <span className="text-xs text-muted-foreground line-through">
                            {product.promotional_price.toLocaleString('fr-FR')} {product.currency || 'XOF'}
                          </span>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
};

export default PersonalizedRecommendationsPage;