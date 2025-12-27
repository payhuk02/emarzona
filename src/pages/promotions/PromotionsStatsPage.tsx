/**
 * Promotions Stats Page
 * Vue analytique simple des performances des promotions
 */

import React, { useMemo } from 'react';
import { MainLayout } from '@/components/layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tag, TrendingUp, Percent, Users, DollarSign, Loader2 } from 'lucide-react';
import { useStore } from '@/hooks/useStore';
import { usePromotions } from '@/hooks/usePromotions';
import { useTranslation } from 'react-i18next';

export const PromotionsStatsPage : React.FC = () => {
  const { t } = useTranslation();
  const { store, loading: storeLoading } = useStore();
  const { data: promotionsData, isLoading: promotionsLoading } = usePromotions({
    storeId: store?.id,
  });

  interface PromotionItem {
    is_active?: boolean;
    used_count?: number;
    discount_type?: string;
    discount_value?: number;
  }

  const promotions = (promotionsData as { data?: PromotionItem[] } | undefined)?.data ?? [];

  const stats = useMemo(() => {
    if (!promotions || promotions.length === 0) {
      return {
        total: promotionsData?.total ?? 0,
        active: 0,
        totalUses: 0,
        totalDiscountValue: 0,
        averageDiscount: 0,
      };
    }

    const total = promotionsData?.total ?? promotions.length;
    const active = promotions.filter(p => p.is_active).length;
    const totalUses = promotions.reduce((sum, p) => sum + (p.used_count ?? 0), 0);
    const totalDiscountValue = promotions.reduce((sum, p) => {
      if (p.discount_type === 'percentage') {
        return sum + (p.discount_value ?? 0);
      }
      return sum;
    }, 0);
    const averageDiscount = promotions.length > 0 ? totalDiscountValue / promotions.length : 0;

    return {
      total,
      active,
      totalUses,
      totalDiscountValue,
      averageDiscount,
    };
  }, [promotions, promotionsData]);

  const isLoading = storeLoading || promotionsLoading;

  return (
    <MainLayout layoutType="promotions">
      <div className="container mx-auto p-3 sm:p-4 lg:p-6 space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="p-1.5 sm:p-2 rounded-lg bg-gradient-to-br from-purple-500/10 to-pink-500/5 backdrop-blur-sm border border-purple-500/20">
              <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 lg:h-8 lg:w-8 text-purple-500" />
            </div>
            <div>
              <h1 className="text-lg sm:text-2xl md:text-3xl lg:text-4xl font-bold flex items-center gap-1.5 sm:gap-2 mb-1 sm:mb-2">
                <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                  {t('promotions.stats.title', 'Statistiques des Promotions')}
                </span>
              </h1>
              <p className="text-[10px] sm:text-xs md:text-sm lg:text-base text-muted-foreground">
                {t(
                  'promotions.stats.description',
                  'Analysez la performance globale de vos codes promo et campagnes.'
                )}
              </p>
            </div>
          </div>
        </div>

        {/* Loading state */}
        {isLoading ? (
          <div className="flex items-center justify-center h-[40vh]">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span>{t('common.loading', 'Chargement des statistiques...')}</span>
            </div>
          </div>
        ) : (
          <>
            {/* Stats cards */}
            <div className="grid gap-3 sm:gap-4 grid-cols-2 md:grid-cols-4 lg:grid-cols-5">
              <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1.5 sm:pb-2 p-2.5 sm:p-3 md:p-4">
                  <CardTitle className="text-[9px] sm:text-[10px] md:text-xs lg:text-sm font-medium">
                    {t('promotions.stats.totalPromotions', 'Total Promotions')}
                  </CardTitle>
                  <Tag className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent className="p-2.5 sm:p-3 md:p-4 pt-0">
                  <div className="text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl font-bold">
                    {stats.total}
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1.5 sm:pb-2 p-2.5 sm:p-3 md:p-4">
                  <CardTitle className="text-[9px] sm:text-[10px] md:text-xs lg:text-sm font-medium">
                    {t('promotions.stats.active', 'Actives')}
                  </CardTitle>
                  <Percent className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-green-500" />
                </CardHeader>
                <CardContent className="p-2.5 sm:p-3 md:p-4 pt-0">
                  <div className="text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl font-bold text-green-600">
                    {stats.active}
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1.5 sm:pb-2 p-2.5 sm:p-3 md:p-4">
                  <CardTitle className="text-[9px] sm:text-[10px] md:text-xs lg:text-sm font-medium">
                    {t('promotions.stats.totalUses', 'Total Utilisations')}
                  </CardTitle>
                  <Users className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-blue-500" />
                </CardHeader>
                <CardContent className="p-2.5 sm:p-3 md:p-4 pt-0">
                  <div className="text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl font-bold text-blue-600">
                    {stats.totalUses}
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1.5 sm:pb-2 p-2.5 sm:p-3 md:p-4">
                  <CardTitle className="text-[9px] sm:text-[10px] md:text-xs lg:text-sm font-medium">
                    {t('promotions.stats.averageDiscount', 'Moyenne Réduction')}
                  </CardTitle>
                  <Percent className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-orange-500" />
                </CardHeader>
                <CardContent className="p-2.5 sm:p-3 md:p-4 pt-0">
                  <div className="text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl font-bold text-orange-600">
                    {stats.averageDiscount.toFixed(1)}%
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1.5 sm:pb-2 p-2.5 sm:p-3 md:p-4">
                  <CardTitle className="text-[9px] sm:text-[10px] md:text-xs lg:text-sm font-medium">
                    {t('promotions.stats.totalDiscountValue', 'Somme des réductions (%)')}
                  </CardTitle>
                  <DollarSign className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-emerald-500" />
                </CardHeader>
                <CardContent className="p-2.5 sm:p-3 md:p-4 pt-0">
                  <div className="text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl font-bold text-emerald-600">
                    {stats.totalDiscountValue.toFixed(1)}%
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Simple summary card */}
            <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle>{t('promotions.stats.summary', 'Résumé rapide')}</CardTitle>
                <CardDescription>
                  {t(
                    'promotions.stats.summaryDescription',
                    'Vue d’ensemble de la performance de vos promotions. Des dashboards avancés arriveront bientôt.'
                  )}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-muted-foreground">
                <p>
                  <span className="font-semibold">{stats.active}</span>{' '}
                  {t('promotions.stats.summaryActive', 'promotions actives actuellement.')}
                </p>
                <p>
                  <span className="font-semibold">{stats.totalUses}</span>{' '}
                  {t(
                    'promotions.stats.summaryUses',
                    "utilisations enregistrées sur l'ensemble des promotions."
                  )}
                </p>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </MainLayout>
  );
};







