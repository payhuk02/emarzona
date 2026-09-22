/**
 * Recommandations IA — aligné sur le langage Marketplace (landing-premium / mp-*).
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BuyerDiscoveryPageLayout } from '@/components/layout/BuyerDiscoveryPageLayout';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Heart, RefreshCw, Sparkles, Target, TrendingUp } from 'lucide-react';
import { useUserRecommendations, useTrendingRecommendations } from '@/hooks/useAIRecommendations';
import { useStoreContext } from '@/contexts/StoreContext';
import { useAuth } from '@/contexts/AuthContext';
import { AIProductRecommendations } from '@/components/recommendations/AIProductRecommendations';
import { logger } from '@/lib/logger';
import '@/styles/marketplace-premium.css';

const Recommendations = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const authenticated = Boolean(user) && !authLoading;
  const { selectedStoreId } = useStoreContext();
  const [, setRefreshKey] = useState(0);

  const {
    data: userRecommendations,
    isLoading: userLoading,
    refetch: refetchUser,
  } = useUserRecommendations({
    limit: 12,
    enabled: !!selectedStoreId,
  });

  const {
    data: trendingRecommendations,
    isLoading: trendingLoading,
    refetch: refetchTrending,
  } = useTrendingRecommendations({
    limit: 8,
    enabled: !!selectedStoreId,
  });

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
    refetchUser();
    refetchTrending();
    logger.info('Recommendations refreshed by user');
  };

  const recommendationStats = {
    total: userRecommendations?.length || 0,
    trending: trendingRecommendations?.length || 0,
    categories: new Set(userRecommendations?.map(r => r.metadata.category).filter(Boolean)).size,
  };

  return (
    <BuyerDiscoveryPageLayout
      authenticated={authenticated}
      mainAriaLabel="Recommandations IA"
      guestClassName="landing-premium marketplace-premium min-h-screen overflow-x-hidden bg-background"
      shellMainClassName="landing-premium marketplace-premium overflow-x-hidden"
    >
      <div className="container mx-auto max-w-7xl p-3 sm:p-4 lg:p-6 space-y-6 sm:space-y-8">
        <header className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div className="space-y-2">
            <p className="lp-eyebrow">Pour vous</p>
            <h1 className="mp-controls__title text-2xl sm:text-3xl md:text-4xl text-[var(--lp-text)]">
              Recommandations personnelles
            </h1>
            <p className="text-sm sm:text-base text-[var(--lp-text-muted)] max-w-2xl">
              Produits adaptés à vos goûts et à votre historique d&apos;achat.
            </p>
          </div>
          <Button
            onClick={handleRefresh}
            variant="outline"
            size="sm"
            disabled={userLoading || trendingLoading}
            className="mp-chip h-10"
          >
            <RefreshCw
              className={`h-4 w-4 mr-2 ${userLoading || trendingLoading ? 'animate-spin' : ''}`}
            />
            Actualiser
          </Button>
        </header>

        <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-3">
          {[
            { label: 'Recommandations', value: recommendationStats.total, icon: Target },
            { label: 'Tendances', value: recommendationStats.trending, icon: TrendingUp },
            { label: 'Catégories', value: recommendationStats.categories, icon: Heart },
          ].map(stat => {
            const Icon = stat.icon;
            return (
              <div
                key={stat.label}
                className="rounded-lg border border-[var(--lp-border-light)] bg-[var(--lp-surface-elevated)] p-4"
              >
                <div className="flex items-center gap-2 text-xs text-[var(--lp-text-muted)] mb-2">
                  <Icon className="h-3.5 w-3.5" />
                  {stat.label}
                </div>
                <div className="text-2xl font-semibold text-[var(--lp-text)]">{stat.value}</div>
              </div>
            );
          })}
        </div>

        <Tabs defaultValue="for-you" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 h-auto bg-[var(--lp-surface-muted)] p-1 rounded-lg">
            <TabsTrigger
              value="for-you"
              className="rounded-md py-2.5 data-[state=active]:bg-[var(--lp-surface-elevated)]"
            >
              <Sparkles className="h-4 w-4 mr-2" />
              Pour vous
            </TabsTrigger>
            <TabsTrigger
              value="trending"
              className="rounded-md py-2.5 data-[state=active]:bg-[var(--lp-surface-elevated)]"
            >
              <TrendingUp className="h-4 w-4 mr-2" />
              Tendances
            </TabsTrigger>
          </TabsList>

          <TabsContent value="for-you">
            <div className="rounded-lg border border-[var(--lp-border-light)] bg-[var(--lp-surface-elevated)] p-4 sm:p-6">
              <AIProductRecommendations
                userId={user?.id}
                title="Sélection personnalisée"
                limit={12}
                showReasoning={true}
                layout="grid"
                className="border-none bg-transparent shadow-none p-0"
              />
            </div>
          </TabsContent>

          <TabsContent value="trending">
            <div className="rounded-lg border border-[var(--lp-border-light)] bg-[var(--lp-surface-elevated)] p-4 sm:p-6">
              <AIProductRecommendations
                title="En tendance maintenant"
                limit={8}
                showReasoning={false}
                layout="grid"
                className="border-none bg-transparent shadow-none p-0"
              />
            </div>
          </TabsContent>
        </Tabs>

        <section className="mp-hero relative overflow-hidden rounded-lg px-4 py-10">
          <div className="mp-hero__inner relative z-[1] text-center max-w-xl mx-auto">
            <h3 className="mp-hero__title text-xl text-white mb-2">Envie d&apos;explorer plus ?</h3>
            <p className="mp-hero__subtitle text-sm mb-6">
              Parcourez tout le catalogue sur le marketplace.
            </p>
            <Button onClick={() => navigate('/marketplace')} className="lp-btn-primary rounded-lg">
              Aller au Marketplace
            </Button>
          </div>
        </section>
      </div>
    </BuyerDiscoveryPageLayout>
  );
};

export default Recommendations;
