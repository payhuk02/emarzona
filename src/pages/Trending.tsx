/**
 * Tendances produits — aligné sur le langage Marketplace (landing-premium / mp-*).
 */

import React, { useState } from 'react';
import { BuyerDiscoveryPageLayout } from '@/components/layout/BuyerDiscoveryPageLayout';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  TrendingUp,
  Flame,
  Clock,
  Calendar,
  BarChart3,
  GraduationCap,
  Palette,
  FileText,
  Package,
  Wrench,
} from 'lucide-react';
import { useTrendingRecommendations } from '@/hooks/useAIRecommendations';
import { useStoreContext } from '@/contexts/StoreContext';
import { useAuth } from '@/contexts/AuthContext';
import { AIProductRecommendations } from '@/components/recommendations/AIProductRecommendations';
import '@/styles/marketplace-premium.css';

const Trending = () => {
  const { user, loading: authLoading } = useAuth();
  const authenticated = Boolean(user) && !authLoading;
  const { selectedStoreId } = useStoreContext();
  const [timeRange, setTimeRange] = useState('7d');
  const [activeTab, setActiveTab] = useState('all');

  const { isLoading, refetch: refetchTrending } = useTrendingRecommendations({
    limit: 20,
    enabled: !!selectedStoreId,
  });

  const timeRanges = [
    { value: '24h', label: '24 heures', icon: Clock },
    { value: '7d', label: '7 jours', icon: Calendar },
    { value: '30d', label: '30 jours', icon: BarChart3 },
  ];

  const trendingCategories = [
    { id: 'all', label: 'Tous', icon: Flame },
    { id: 'digital', label: 'Digital', icon: FileText },
    { id: 'physical', label: 'Physique', icon: Package },
    { id: 'services', label: 'Services', icon: Wrench },
    { id: 'courses', label: 'Cours', icon: GraduationCap },
    { id: 'artwork', label: 'Art', icon: Palette },
  ];

  return (
    <BuyerDiscoveryPageLayout
      authenticated={authenticated}
      mainAriaLabel="Tendances produits"
      guestClassName="landing-premium marketplace-premium min-h-screen overflow-x-hidden bg-background"
      shellMainClassName="landing-premium marketplace-premium overflow-x-hidden"
    >
      <div className="container mx-auto max-w-7xl p-3 sm:p-4 lg:p-6 space-y-6 sm:space-y-8">
        <header className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div className="space-y-2">
            <p className="lp-eyebrow">Tendances</p>
            <h1 className="mp-controls__title text-2xl sm:text-3xl md:text-4xl text-[var(--lp-text)]">
              Produits en tendance
            </h1>
            <p className="text-sm sm:text-base text-[var(--lp-text-muted)] max-w-2xl">
              Découvrez les produits qui gagnent en popularité sur la plateforme.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="mp-select w-40 h-10">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {timeRanges.map(range => {
                  const IconComponent = range.icon;
                  return (
                    <SelectItem key={range.value} value={range.value}>
                      <div className="flex items-center gap-2">
                        <IconComponent className="h-4 w-4" />
                        {range.label}
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              size="sm"
              className="mp-chip h-10"
              onClick={() => refetchTrending()}
              disabled={isLoading}
            >
              <TrendingUp className="h-4 w-4 mr-1.5" />
              Actualiser
            </Button>
          </div>
        </header>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="flex flex-wrap h-auto gap-1 bg-[var(--lp-surface-muted)] p-1 rounded-lg w-full sm:w-auto">
            {trendingCategories.map(category => {
              const IconComponent = category.icon;
              return (
                <TabsTrigger
                  key={category.id}
                  value={category.id}
                  className="flex items-center gap-1.5 rounded-md px-3 py-2 data-[state=active]:bg-[var(--lp-surface-elevated)]"
                >
                  <IconComponent className="h-3.5 w-3.5" />
                  <span className="text-xs sm:text-sm">{category.label}</span>
                </TabsTrigger>
              );
            })}
          </TabsList>

          {trendingCategories.map(category => (
            <TabsContent key={category.id} value={category.id} className="space-y-4">
              <div className="rounded-lg border border-[var(--lp-border-light)] bg-[var(--lp-surface-elevated)] p-4 sm:p-6">
                <h2 className="mp-controls__title text-lg mb-4 flex items-center gap-2">
                  <category.icon className="h-5 w-5 text-[var(--lp-blue)]" />
                  {category.label === 'Tous' ? 'Toutes les tendances' : category.label}
                </h2>
                <AIProductRecommendations
                  title=""
                  limit={20}
                  showReasoning={false}
                  layout="grid"
                  className="border-none bg-transparent shadow-none p-0"
                />
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </BuyerDiscoveryPageLayout>
  );
};

export default Trending;
