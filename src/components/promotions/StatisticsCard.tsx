/**
 * StatisticsCard Component
 * Date: 30 Janvier 2025
 * 
 * Composant pour afficher des statistiques détaillées sur les promotions
 */

import React from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Minus, DollarSign, Users, Percent } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Statistic {
  label: string;
  value: string | number;
  change?: number; // Pourcentage de changement
  trend?: 'up' | 'down' | 'neutral';
  icon?: React.ReactNode;
  description?: string;
}

interface StatisticsCardProps {
  title?: string;
  description?: string;
  statistics: Statistic[];
  className?: string;
}

export const StatisticsCard : React.FC<StatisticsCardProps> = ({
  title,
  description,
  statistics,
  className,
}) => {
  const { t } = useTranslation();
  const defaultTitle = title || t('promotions.statistics.title', 'Statistiques');
  return (
    <Card className={cn("border-border/50 bg-card/50 backdrop-blur-sm", className)}>
      {defaultTitle && (
        <CardHeader>
          <CardTitle className="text-lg sm:text-xl">{defaultTitle}</CardTitle>
          {description && (
            <CardDescription className="text-xs sm:text-sm">{description}</CardDescription>
          )}
        </CardHeader>
      )}
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {statistics.map((stat, index) => (
            <div
              key={index}
              className="p-4 rounded-lg border border-border/50 bg-muted/30 hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <p className="text-xs text-muted-foreground mb-1">{stat.label}</p>
                  <p className="text-xl sm:text-2xl font-bold">{stat.value}</p>
                </div>
                {stat.icon && (
                  <div className="p-2 rounded-lg bg-primary/10">
                    {stat.icon}
                  </div>
                )}
              </div>
              
              {stat.change !== undefined && (
                <div className="flex items-center gap-1 mt-2">
                  {stat.trend === 'up' && (
                    <>
                      <TrendingUp className="h-3 w-3 text-green-600" />
                      <span className="text-xs text-green-600 font-medium">
                        +{Math.abs(stat.change)}%
                      </span>
                    </>
                  )}
                  {stat.trend === 'down' && (
                    <>
                      <TrendingDown className="h-3 w-3 text-red-600" />
                      <span className="text-xs text-red-600 font-medium">
                        -{Math.abs(stat.change)}%
                      </span>
                    </>
                  )}
                  {stat.trend === 'neutral' && (
                    <>
                      <Minus className="h-3 w-3 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">
                        {stat.change}%
                      </span>
                    </>
                  )}
                </div>
              )}
              
              {stat.description && (
                <p className="text-xs text-muted-foreground mt-2">{stat.description}</p>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

/**
 * Interface pour une promotion dans les statistiques
 */
interface PromotionForStats {
  id: string;
  is_active?: boolean;
  used_count?: number;
  current_uses?: number;
  discount_type?: 'percentage' | 'fixed';
  discount_value?: number;
}

/**
 * Hook pour calculer les statistiques des promotions
 */
export const usePromotionStatistics = (promotions: PromotionForStats[]) => {
  const stats = React.useMemo(() => {
    if (!promotions || promotions.length === 0) {
      return {
        total: 0,
        active: 0,
        inactive: 0,
        totalUses: 0,
        averageDiscount: 0,
        totalDiscountGiven: 0,
        mostUsed: null,
        leastUsed: null,
      };
    }

    const total = promotions.length;
    const active = promotions.filter(p => p.is_active).length;
    const inactive = total - active;
    const totalUses = promotions.reduce((sum, p) => sum + (p.used_count || p.current_uses || 0), 0);
    
    const totalDiscount = promotions.reduce((sum, p) => {
      if (p.discount_type === 'percentage' || p.discount_type === 'percentage') {
        return sum + (p.discount_value || 0);
      }
      return sum;
    }, 0);
    const averageDiscount = total > 0 ? totalDiscount / total : 0;

    // Calculer le total des réductions données (estimation)
    const totalDiscountGiven = promotions.reduce((sum, p) => {
      const uses = p.used_count || p.current_uses || 0;
      // Estimation basée sur les utilisations (nécessiterait les données réelles)
      return sum + uses * (p.discount_value || 0);
    }, 0);

    // Trouver les plus/moins utilisées
    const sortedByUses = [...promotions].sort((a, b) => {
      const usesA = a.used_count || a.current_uses || 0;
      const usesB = b.used_count || b.current_uses || 0;
      return usesB - usesA;
    });

    return {
      total,
      active,
      inactive,
      totalUses,
      averageDiscount: Math.round(averageDiscount * 10) / 10,
      totalDiscountGiven,
      mostUsed: sortedByUses[0] || null,
      leastUsed: sortedByUses[sortedByUses.length - 1] || null,
    };
  }, [promotions]);

  return stats;
};

/**
 * Composant pour afficher les statistiques des promotions
 */
export const PromotionStatistics : React.FC<{ promotions: PromotionForStats[] }> = ({ promotions }) => {
  const { t } = useTranslation();
  const stats = usePromotionStatistics(promotions);

  const  statistics: Statistic[] = [
    {
      label: t('promotions.statistics.total', 'Total'),
      value: stats.total,
      icon: <DollarSign className="h-4 w-4 text-primary" />,
      description: t('promotions.statistics.totalDescription', 'Nombre total de promotions'),
    },
    {
      label: t('promotions.statistics.active', 'Actives'),
      value: stats.active,
      icon: <TrendingUp className="h-4 w-4 text-green-600" />,
      description: t('promotions.statistics.inactive', {
        defaultValue: '{{count}} inactive',
        count: stats.inactive,
      }, { count: stats.inactive }),
    },
    {
      label: t('promotions.statistics.uses', 'Utilisations'),
      value: stats.totalUses,
      icon: <Users className="h-4 w-4 text-blue-600" />,
      description: t('promotions.statistics.usesDescription', 'Total des utilisations'),
    },
    {
      label: t('promotions.statistics.averageDiscount', 'Réduction moyenne'),
      value: `${stats.averageDiscount}%`,
      icon: <Percent className="h-4 w-4 text-orange-600" />,
      description: t('promotions.statistics.averageDiscountDescription', 'Moyenne des réductions'),
    },
  ];

  return <StatisticsCard statistics={statistics} />;
};








