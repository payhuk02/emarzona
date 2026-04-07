/**
 * Service Recommendations Component
 * Date: 29 janvier 2025
 * 
 * Système de recommandations intelligentes pour services
 * Basé sur : catégories similaires, tags, réservations précédentes, popularité
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Sparkles,
  TrendingUp,
  Users,
  Calendar,
  Star,
  ArrowRight,
  Loader2,
  Clock,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ServiceCard } from './ServiceCard';
import { logger } from '@/lib/logger';
import { cn } from '@/lib/utils';

interface RecommendationsProps {
  serviceId: string;
  category?: string;
  tags?: string[];
  limit?: number;
  variant?: 'horizontal' | 'grid' | 'compact';
  title?: string;
  showTitle?: boolean;
}

/**
 * Hook pour obtenir les recommandations
 */
const useServiceRecommendations = (
  serviceId: string,
  category?: string,
  tags?: string[],
  limit: number = 6
) => {
  return useQuery({
    queryKey: ['serviceRecommendations', serviceId, category, tags, limit],
    queryFn: async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();

        interface ServiceWithStore {
          id: string;
          name: string;
          slug?: string;
          description?: string;
          short_description?: string;
          price: number;
          promotional_price?: number;
          currency: string;
          image_url?: string;
          category?: string;
          tags?: string[];
          sales_count?: number;
          average_rating?: number;
          stores: {
            id: string;
            name: string;
            slug: string;
          };
          service_products?: Array<{
            duration_minutes?: number;
          }>;
          recommendationScore?: number;
        }
        // 1. Recommandations basées sur la catégorie
        let  categoryRecommendations: ServiceWithStore[] = [];
        if (category) {
          const { data: categoryServices } = await supabase
            .from('products')
            .select(`
              *,
              stores!inner (
                id,
                name,
                slug
              ),
              service_products (
                *
              )
            `)
            .eq('product_type', 'service')
            .eq('is_active', true)
            .eq('is_draft', false)
            .eq('category', category)
            .neq('id', serviceId)
            .order('sales_count', { ascending: false })
            .limit(limit);

          categoryRecommendations = categoryServices || [];
        }

        // 2. Recommandations basées sur les tags
        let  tagRecommendations: ServiceWithStore[] = [];
        if (tags && tags.length > 0) {
          // Rechercher services avec tags similaires
          const { data: tagServices } = await supabase
            .from('products')
            .select(`
              *,
              stores!inner (
                id,
                name,
                slug
              ),
              service_products (
                *
              )
            `)
            .eq('product_type', 'service')
            .eq('is_active', true)
            .eq('is_draft', false)
            .neq('id', serviceId)
            .limit(100);

          if (tagServices) {
            // Filtrer ceux qui ont des tags en commun
            tagRecommendations = tagServices
              .filter((s) => {
                const serviceTags = s.tags || [];
                return tags.some((tag) => serviceTags.includes(tag));
              })
              .sort((a, b) => (b.sales_count || 0) - (a.sales_count || 0))
              .slice(0, limit);
          }
        }

        // 3. Recommandations basées sur les réservations précédentes (si utilisateur connecté)
        let  bookingBasedRecommendations: ServiceWithStore[] = [];
        if (user) {
          // Récupérer les services réservés par l'utilisateur
          const { data: bookedServices } = await supabase
            .from('order_items')
            .select(`
              product_id,
              orders!inner (
                customer_id,
                customers!inner (
                  email
                )
              )
            `)
            .eq('orders.customers.email', user.email)
            .eq('orders.payment_status', 'paid')
            .eq('orders.status', 'completed')
            .eq('product_type', 'service');

          if (bookedServices && bookedServices.length > 0) {
            const bookedIds = bookedServices.map((s) => s.product_id);
            
            // Obtenir les catégories des services réservés
            const { data: bookedCategories } = await supabase
              .from('products')
              .select('category')
              .in('id', bookedIds)
              .not('category', 'is', null);

            const categories = Array.from(
              new Set(bookedCategories?.map((s) => s.category).filter(Boolean))
            ) as string[];

            if (categories.length > 0) {
              const { data: similarServices } = await supabase
                .from('products')
                .select(`
                  *,
                  stores!inner (
                    id,
                    name,
                    slug
                  ),
                  service_products (
                    *
                  )
                `)
                .eq('product_type', 'service')
                .eq('is_active', true)
                .eq('is_draft', false)
                .neq('id', serviceId)
                .in('category', categories)
                .order('sales_count', { ascending: false })
                .limit(limit * 2); // Récupérer plus pour filtrer après

              // Filtrer les services déjà réservés
              bookingBasedRecommendations = (similarServices || []).filter(
                (s) => !bookedIds.includes(s.id)
              ).slice(0, limit);
            }
          }
        }

        // 4. Recommandations populaires (fallback)
        const { data: popularServices } = await supabase
          .from('products')
          .select(`
            *,
            stores!inner (
              id,
              name,
              slug
            ),
            service_products (
              *
            )
          `)
          .eq('product_type', 'service')
          .eq('is_active', true)
          .eq('is_draft', false)
          .neq('id', serviceId)
          .order('sales_count', { ascending: false })
          .order('average_rating', { ascending: false })
          .limit(limit);

        // Combiner et dédupliquer
        const allRecommendations = [
          ...categoryRecommendations,
          ...tagRecommendations,
          ...bookingBasedRecommendations,
          ...(popularServices || []),
        ];

        // Dédupliquer par ID
        const uniqueRecommendations = Array.from(
          new Map(allRecommendations.map((s) => [s.id, s])).values()
        );

        // Trier par score de recommandation
        const scored = uniqueRecommendations.map((service) => {
          let  score= 0;

          // Score basé sur la catégorie
          if (category && service.category === category) score += 10;

          // Score basé sur les tags
          if (tags && service.tags) {
            const commonTags = tags.filter((tag) => service.tags.includes(tag));
            score += commonTags.length * 5;
          }

          // Score basé sur la popularité
          score += (service.sales_count || 0) * 0.1;
          score += (service.average_rating || 0) * 2;

          return { ...service, recommendationScore: score };
        });

        // Trier par score et retourner les meilleurs
        return scored
          .sort((a, b) => b.recommendationScore - a.recommendationScore)
          .slice(0, limit);
      } catch ( _error: unknown) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        logger.error('Error fetching service recommendations', { error });
        return [];
      }
    },
    enabled: !!serviceId,
  });
};

/**
 * Composant de recommandations
 */
export const ServiceRecommendations = ({
  serviceId,
  category,
  tags,
  limit = 6,
  variant = 'grid',
  title = 'Services similaires',
  showTitle = true,
}: RecommendationsProps) => {
  const navigate = useNavigate();
  const { data: recommendations, isLoading } = useServiceRecommendations(
    serviceId,
    category,
    tags,
    limit
  );

  if (isLoading) {
    return (
      <div className="space-y-4">
        {showTitle && (
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <h2 className="text-2xl font-bold">{title}</h2>
          </div>
        )}
        <div
          className={cn(
            variant === 'horizontal' && 'flex gap-4 overflow-x-auto',
            variant === 'grid' && 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6',
            variant === 'compact' && 'grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4'
          )}
        >
          {Array.from({ length: limit }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <Skeleton className="h-48 w-full" />
              <CardContent className="p-4 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!recommendations || recommendations.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      {showTitle && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <h2 className="text-2xl font-bold">{title}</h2>
            <Badge variant="secondary">{recommendations.length}</Badge>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/marketplace')}
          >
            Voir plus
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      )}

      <div
        className={cn(
          variant === 'horizontal' && 'flex gap-4 overflow-x-auto pb-4',
          variant === 'grid' && 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6',
          variant === 'compact' && 'grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4'
        )}
      >
        {recommendations.map((service: ServiceWithStore) => (
          <Card
            key={service.id}
            className="group hover:shadow-lg transition-shadow cursor-pointer"
            onClick={() => navigate(`/service/${service.id}`)}
          >
            <div className="aspect-video bg-muted rounded-t-lg overflow-hidden">
              {service.image_url ? (
                <img
                  src={service.image_url}
                  alt={service.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Calendar className="h-12 w-12 text-muted-foreground" />
                </div>
              )}
            </div>
            <CardContent className="p-4">
              <h4 className="font-semibold line-clamp-2 mb-2">{service.name}</h4>
              <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                {service.short_description || service.description}
              </p>
              <div className="flex items-center justify-between mb-3">
                <span className="font-bold text-lg">
                  {service.promotional_price || service.price} {service.currency}
                </span>
                {service.average_rating > 0 && (
                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    <span className="text-sm">{service.average_rating.toFixed(1)}</span>
                  </div>
                )}
              </div>
              {service.service_products?.[0] && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  <span>
                    Durée: {service.service_products[0].duration_minutes || 0} min
                  </span>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

/**
 * Recommandations basées sur "Réservés ensemble"
 */
export const BookedTogetherRecommendations = ({
  serviceId,
  limit = 4,
}: {
  serviceId: string;
  limit?: number;
}) => {
  const navigate = useNavigate();
  const { data: recommendations, isLoading } = useQuery({
    queryKey: ['bookedTogether', serviceId],
    queryFn: async () => {
      try {
        // Récupérer les commandes qui contiennent ce service
        const { data: ordersWithService } = await supabase
          .from('order_items')
          .select('order_id')
          .eq('product_id', serviceId)
          .eq('product_type', 'service')
          .limit(100);

        if (!ordersWithService || ordersWithService.length === 0) return [];

        const orderIds = ordersWithService.map((o) => o.order_id);

        // Récupérer les autres services dans ces commandes
        const { data: otherServices } = await supabase
          .from('order_items')
          .select('product_id')
          .in('order_id', orderIds)
          .neq('product_id', serviceId)
          .eq('product_type', 'service');

        if (!otherServices || otherServices.length === 0) return [];

        // Compter les occurrences
        const serviceCounts = otherServices.reduce((acc, item) => {
          acc[item.product_id] = (acc[item.product_id] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);

        // Trier par fréquence
        const sortedServiceIds = Object.entries(serviceCounts)
          .sort(([, a], [, b]) => b - a)
          .slice(0, limit)
          .map(([id]) => id);

        // Récupérer les détails des services
        const { data: services } = await supabase
          .from('products')
          .select(`
            *,
            stores!inner (
              id,
              name,
              slug
            ),
            service_products (
              *
            )
          `)
          .in('id', sortedServiceIds)
          .eq('product_type', 'service')
          .eq('is_active', true);

        return services || [];
      } catch ( _error: unknown) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        logger.error('Error fetching booked together recommendations', { error });
        return [];
      }
    },
    enabled: !!serviceId,
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Réservés ensemble
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <Skeleton className="h-32 w-full" />
              <CardContent className="p-3">
                <Skeleton className="h-3 w-full mb-2" />
                <Skeleton className="h-3 w-2/3" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!recommendations || recommendations.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold flex items-center gap-2">
        <Calendar className="h-5 w-5" />
        Réservés ensemble
      </h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {recommendations.map((service: ServiceWithStore) => (
          <Card
            key={service.id}
            className="group hover:shadow-lg transition-shadow cursor-pointer"
            onClick={() => navigate(`/service/${service.id}`)}
          >
            <div className="aspect-video bg-muted rounded-t-lg overflow-hidden">
              {service.image_url ? (
                <img
                  src={service.image_url}
                  alt={service.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Calendar className="h-12 w-12 text-muted-foreground" />
                </div>
              )}
            </div>
            <CardContent className="p-3">
              <h4 className="font-medium text-sm line-clamp-2 mb-2">{service.name}</h4>
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm">
                  {service.promotional_price || service.price} {service.currency}
                </span>
                {service.average_rating > 0 && (
                  <div className="flex items-center gap-1">
                    <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                    <span className="text-xs">{service.average_rating.toFixed(1)}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};







