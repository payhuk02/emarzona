/**
 * Funnel Analysis Component
 * Analyse le parcours utilisateur pour identifier les points de friction
 */

import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { TrendingDown, TrendingUp, Users, ShoppingCart, CreditCard, CheckCircle } from 'lucide-react';

interface FunnelStep {
  name: string;
  count: number;
  percentage: number;
  dropoff: number;
  icon: React.ComponentType<{ className?: string }>;
}

export const FunnelAnalysis = () => {
  const { data: funnelData, isLoading } = useQuery({
    queryKey: ['funnel-analysis'],
    queryFn: async () => {
      // Récupérer les données du funnel depuis Supabase
      const { data, error } = await supabase
        .from('analytics_events')
        .select('event_type, count')
        .in('event_type', ['page_view', 'product_view', 'add_to_cart', 'checkout_start', 'purchase'])
        .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

      if (error) throw error;

      // Calculer le funnel
      const steps: FunnelStep[] = [
        {
          name: 'Visiteurs',
          count: data?.find(d => d.event_type === 'page_view')?.count || 0,
          percentage: 100,
          dropoff: 0,
          icon: Users,
        },
        {
          name: 'Vues Produits',
          count: data?.find(d => d.event_type === 'product_view')?.count || 0,
          percentage: 0,
          dropoff: 0,
          icon: ShoppingCart,
        },
        {
          name: 'Ajouts au Panier',
          count: data?.find(d => d.event_type === 'add_to_cart')?.count || 0,
          percentage: 0,
          dropoff: 0,
          icon: ShoppingCart,
        },
        {
          name: 'Début Checkout',
          count: data?.find(d => d.event_type === 'checkout_start')?.count || 0,
          percentage: 0,
          dropoff: 0,
          icon: CreditCard,
        },
        {
          name: 'Achats',
          count: data?.find(d => d.event_type === 'purchase')?.count || 0,
          percentage: 0,
          dropoff: 0,
          icon: CheckCircle,
        },
      ];

      // Calculer les pourcentages et dropoffs
      const firstStepCount = steps[0].count;
      steps.forEach((step, index) => {
        if (index === 0) return;
        
        step.percentage = firstStepCount > 0 
          ? (step.count / firstStepCount) * 100 
          : 0;
        
        const previousStep = steps[index - 1];
        step.dropoff = previousStep.count > 0
          ? ((previousStep.count - step.count) / previousStep.count) * 100
          : 0;
      });

      return steps;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Analyse du Funnel</CardTitle>
          <CardDescription>Chargement...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Analyse du Funnel de Conversion</CardTitle>
        <CardDescription>
          Parcours utilisateur sur les 30 derniers jours
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {funnelData?.map((step, index) => {
            const Icon = step.icon;
            const isDropoff = step.dropoff > 20; // Dropoff significatif > 20%
            
            return (
              <div key={step.name} className="flex items-center gap-4">
                <div className="flex items-center gap-3 flex-1">
                  <div className={`p-2 rounded-lg ${
                    isDropoff ? 'bg-red-100 text-red-600' : 'bg-primary/10 text-primary'
                  }`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium">{step.name}</span>
                      <span className="text-sm text-muted-foreground">
                        {step.count.toLocaleString()}
                      </span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all ${
                          isDropoff ? 'bg-red-500' : 'bg-primary'
                        }`}
                        style={{ width: `${step.percentage}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between mt-1 text-xs text-muted-foreground">
                      <span>{step.percentage.toFixed(1)}%</span>
                      {index > 0 && (
                        <span className={isDropoff ? 'text-red-600' : ''}>
                          {isDropoff ? (
                            <TrendingDown className="h-3 w-3 inline mr-1" />
                          ) : (
                            <TrendingUp className="h-3 w-3 inline mr-1" />
                          )}
                          {step.dropoff.toFixed(1)}% de dropoff
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

