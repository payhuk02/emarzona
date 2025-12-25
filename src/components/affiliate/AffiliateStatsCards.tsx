/**
 * Cartes de statistiques pour le dashboard affilié
 * Affichage des KPIs principaux
 * Date : 27 octobre 2025
 * Updated: 2025-02-02 - Responsive design with Mes Templates style
 */

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import {
  TrendingUp,
  MousePointerClick,
  Users,
  DollarSign,
  Link as LinkIcon,
  GraduationCap,
  Percent,
  Clock,
} from 'lucide-react';

interface AffiliateStatsCardsProps {
  totalCourses: number;
  totalLinks: number;
  totalClicks: number;
  totalConversions: number;
  conversionRate: number;
  totalCommission: number;
  pendingCommission: number;
  paidCommission: number;
}

const AffiliateStatsCardsComponent = ({
  totalCourses,
  totalLinks,
  totalClicks,
  totalConversions,
  conversionRate,
  totalCommission,
  pendingCommission,
  paidCommission,
}: AffiliateStatsCardsProps) => {
  const stats = [
    {
      title: 'Cours Promus',
      value: totalCourses,
      icon: GraduationCap,
      gradient: 'from-purple-600 to-pink-600',
      iconBg: 'from-purple-500/10 to-pink-500/5',
      iconColor: 'text-purple-500',
    },
    {
      title: 'Liens Actifs',
      value: totalLinks,
      icon: LinkIcon,
      gradient: 'from-blue-600 to-cyan-600',
      iconBg: 'from-blue-500/10 to-cyan-500/5',
      iconColor: 'text-blue-500',
    },
    {
      title: 'Total Clics',
      value: totalClicks.toLocaleString(),
      icon: MousePointerClick,
      gradient: 'from-cyan-600 to-blue-600',
      iconBg: 'from-cyan-500/10 to-blue-500/5',
      iconColor: 'text-cyan-500',
    },
    {
      title: 'Conversions',
      value: totalConversions,
      icon: Users,
      gradient: 'from-orange-600 to-red-600',
      iconBg: 'from-orange-500/10 to-red-500/5',
      iconColor: 'text-orange-500',
    },
    {
      title: 'Taux de Conversion',
      value: `${conversionRate}%`,
      icon: Percent,
      gradient: 'from-teal-600 to-emerald-600',
      iconBg: 'from-teal-500/10 to-emerald-500/5',
      iconColor: 'text-teal-500',
    },
    {
      title: 'Commission Totale',
      value: `${totalCommission.toLocaleString()} XOF`,
      icon: TrendingUp,
      gradient: 'from-green-600 to-emerald-600',
      iconBg: 'from-green-500/10 to-emerald-500/5',
      iconColor: 'text-green-500',
    },
    {
      title: 'En Attente',
      value: `${pendingCommission.toLocaleString()} XOF`,
      icon: Clock,
      gradient: 'from-yellow-600 to-orange-600',
      iconBg: 'from-yellow-500/10 to-orange-500/5',
      iconColor: 'text-yellow-500',
    },
    {
      title: 'Payé',
      value: `${paidCommission.toLocaleString()} XOF`,
      icon: DollarSign,
      gradient: 'from-emerald-600 to-green-600',
      iconBg: 'from-emerald-500/10 to-green-500/5',
      iconColor: 'text-emerald-500',
    },
  ];

  return (
    <div className="grid gap-3 sm:gap-4 grid-cols-2 sm:grid-cols-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {stats.map((stat, index) => {
        const Icon = stat.icon;
        return (
          <Card
            key={index}
            className="border-border/50 bg-card/50 backdrop-blur-sm hover:shadow-lg transition-all duration-300 hover:scale-[1.02]"
            style={{ willChange: 'transform' }}
          >
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm text-muted-foreground mb-1">{stat.title}</p>
                  <p className={`text-xl sm:text-2xl font-bold bg-gradient-to-r ${stat.gradient} bg-clip-text text-transparent`}>
                    {stat.value}
                  </p>
                </div>
                <div className={`p-2 rounded-lg bg-gradient-to-br ${stat.iconBg}`}>
                  <Icon className={`h-4 w-4 sm:h-5 sm:w-5 ${stat.iconColor}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

// Optimisation avec React.memo pour éviter les re-renders inutiles
export const AffiliateStatsCards = React.memo(AffiliateStatsCardsComponent, (prevProps, nextProps) => {
  return (
    prevProps.totalCourses === nextProps.totalCourses &&
    prevProps.totalLinks === nextProps.totalLinks &&
    prevProps.totalClicks === nextProps.totalClicks &&
    prevProps.totalConversions === nextProps.totalConversions &&
    prevProps.conversionRate === nextProps.conversionRate &&
    prevProps.totalCommission === nextProps.totalCommission &&
    prevProps.pendingCommission === nextProps.pendingCommission &&
    prevProps.paidCommission === nextProps.paidCommission
  );
});

AffiliateStatsCards.displayName = 'AffiliateStatsCards';

