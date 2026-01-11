/**
 * Composant de recommandations IA avancées
 * Affiche des produits recommandés de manière intelligente et personnalisée
 */

import React, { useMemo } from 'react';
import { useAIRecommendations } from '@/lib/ai/recommendation-engine';
import { useProducts } from '@/hooks/useProducts';
import { useRecommendationTracking } from '@/hooks/useRecommendationTracking';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Sparkles, TrendingUp, Users, Package, Target } from 'lucide-react';
import { ProductCard } from '@/components/marketplace/ProductCard';
import { cn } from '@/lib/utils';
import { logger } from '@/lib/logger';

interface AIProductRecommendationsProps {
  userId?: string;
  currentProductId?: string;
  category?: string;
  title?: string;
  limit?: number;
  showReasoning?: boolean;
  className?: string;
  layout?: 'grid' | 'horizontal' | 'compact';
}

const AIProductRecommendations: React.FC<AIProductRecommendationsProps> = ({
  userId,
  currentProductId,
  category,
  title = "Recommandations pour vous",
  limit = 6,
  showReasoning = true,
  className,
  layout = 'grid'
}) => {
  // Récupérer les recommandations IA
  const { data: recommendations, isLoading, error } = useAIRecommendations({
    userId,
    productId: currentProductId,
    category,
    limit,
    excludeRecentlyViewed: true,
    includeReasoning: showReasoning
  });

  // Hook pour le tracking des interactions
  const { trackRecommendationClick } = useRecommendationTracking();

  // Récupérer les détails des produits recommandés
  const productIds = useMemo(() => {
    return recommendations?.map(rec => rec.productId) || [];
  }, [recommendations]);

  const { data: productsData, isLoading: productsLoading } = useProducts({
    filters: { ids: productIds },
    enabled: productIds.length > 0
  });

  // Combiner les recommandations avec les données des produits
  const enrichedRecommendations = useMemo(() => {
    if (!recommendations || !productsData?.data) return [];

    return recommendations.map(rec => {
      const product = productsData.data.find(p => p.id === rec.productId);
      return {
        ...rec,
        product
      };
    }).filter(rec => rec.product); // Garder seulement les recommandations avec des produits valides
  }, [recommendations, productsData]);

  // Gestionnaire d'analytics pour les clics sur recommandations
  const handleRecommendationClick = async (recommendation: any, position: number) => {
    logger.info('AI Recommendation clicked', {
      productId: recommendation.productId,
      reason: recommendation.reason,
      score: recommendation.score,
      position,
      userId,
      source: 'ai_recommendations'
    });

    // Tracker le clic sur la recommandation
    await trackRecommendationClick({
      productId: currentProductId,
      recommendedProductId: recommendation.productId,
      reason: recommendation.reason,
      score: recommendation.score,
      confidence: recommendation.confidence,
      position,
      source: 'ai_recommendations'
    });
  };

  // Icône selon le type de recommandation
  const getReasonIcon = (reason: string) => {
    switch (reason) {
      case 'collaborative':
        return <Users className="h-3 w-3" />;
      case 'content':
        return <Package className="h-3 w-3" />;
      case 'trending':
        return <TrendingUp className="h-3 w-3" />;
      case 'complementary':
        return <Target className="h-3 w-3" />;
      default:
        return <Sparkles className="h-3 w-3" />;
    }
  };

  // Label selon le type de recommandation
  const getReasonLabel = (reason: string) => {
    switch (reason) {
      case 'collaborative':
        return 'Utilisateurs similaires';
      case 'content':
        return 'Similaire à vos goûts';
      case 'trending':
        return 'Tendance populaire';
      case 'complementary':
        return 'Complète vos achats';
      case 'personal':
        return 'Personnalisé pour vous';
      default:
        return 'Recommandé pour vous';
    }
  };

  // État de chargement
  if (isLoading || productsLoading) {
    return (
      <Card className={cn("border-border/50 bg-card/50 backdrop-blur-sm", className)}>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary animate-pulse" />
            <Skeleton className="h-6 w-48" />
          </div>
        </CardHeader>
        <CardContent>
          <div className={cn(
            "grid gap-4",
            layout === 'grid' && "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
            layout === 'horizontal' && "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
            layout === 'compact' && "grid-cols-2 sm:grid-cols-3 lg:grid-cols-6"
          )}>
            {Array.from({ length: limit }).map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="aspect-square w-full rounded-lg" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Gestion d'erreur
  if (error || !enrichedRecommendations.length) {
    return (
      <Card className={cn("border-border/50 bg-card/50 backdrop-blur-sm", className)}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-muted-foreground">
            <Sparkles className="h-5 w-5" />
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <p className="text-sm text-muted-foreground">
              {error ? 'Erreur lors du chargement des recommandations' : 'Aucune recommandation disponible pour le moment'}
            </p>
            {error && (
              <Button
                variant="outline"
                size="sm"
                className="mt-4"
                onClick={() => window.location.reload()}
              >
                Réessayer
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn("border-border/50 bg-card/50 backdrop-blur-sm", className)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          {title}
          <Badge variant="secondary" className="text-xs">
            IA
          </Badge>
        </CardTitle>
        {showReasoning && (
          <p className="text-sm text-muted-foreground">
            Recommandations personnalisées basées sur vos préférences et l'activité des autres utilisateurs
          </p>
        )}
      </CardHeader>
      <CardContent>
        <div className={cn(
          "grid gap-4",
          layout === 'grid' && "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
          layout === 'horizontal' && "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
          layout === 'compact' && "grid-cols-2 sm:grid-cols-3 lg:grid-cols-6"
        )}>
          {enrichedRecommendations.map((recommendation, index) => (
            <div key={recommendation.productId} className="relative group">
              {/* Badge de raison */}
              {showReasoning && (
                <div className="absolute top-2 left-2 z-10">
                  <Badge
                    variant="secondary"
                    className="text-xs bg-background/90 backdrop-blur-sm border border-border/50 flex items-center gap-1"
                  >
                    {getReasonIcon(recommendation.reason)}
                    {getReasonLabel(recommendation.reason)}
                  </Badge>
                </div>
              )}

              {/* Score de confiance (debug mode) */}
              {process.env.NODE_ENV === 'development' && (
                <div className="absolute top-2 right-2 z-10">
                  <Badge variant="outline" className="text-xs">
                    {Math.round(recommendation.confidence * 100)}%
                  </Badge>
                </div>
              )}

              {/* Carte produit */}
              <div onClick={() => handleRecommendationClick(recommendation, index + 1)}>
                <ProductCard
                  product={recommendation.product}
                  className="h-full transition-transform group-hover:scale-[1.02]"
                  priority={false}
                />
              </div>

              {/* Explication détaillée (si activée) */}
              {showReasoning && recommendation.metadata?.reasoning && (
                <div className="mt-2 text-xs text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
                  {recommendation.metadata.reasoning}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Statistiques (debug mode) */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mt-6 pt-4 border-t border-border/50">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs text-muted-foreground">
              <div>
                <div className="font-medium">Collaboratif</div>
                <div>{enrichedRecommendations.filter(r => r.reason === 'collaborative').length}</div>
              </div>
              <div>
                <div className="font-medium">Contenu</div>
                <div>{enrichedRecommendations.filter(r => r.reason === 'content').length}</div>
              </div>
              <div>
                <div className="font-medium">Complémentaire</div>
                <div>{enrichedRecommendations.filter(r => r.reason === 'complementary').length}</div>
              </div>
              <div>
                <div className="font-medium">Tendance</div>
                <div>{enrichedRecommendations.filter(r => r.reason === 'trending').length}</div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export { AIProductRecommendations };
export type { AIProductRecommendationsProps };