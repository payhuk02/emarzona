/**
 * Cartes de statistiques pour le dashboard affilié
 * Affichage des KPIs principaux
 * Date : 27 octobre 2025
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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

export const AffiliateStatsCards = ({
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
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
    },
    {
      title: 'Liens Actifs',
      value: totalLinks,
      icon: LinkIcon,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      title: 'Total Clics',
      value: totalClicks.toLocaleString(),
      icon: MousePointerClick,
      color: 'text-cyan-600',
      bgColor: 'bg-cyan-50',
    },
    {
      title: 'Conversions',
      value: totalConversions,
      icon: Users,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
    },
    {
      title: 'Taux de Conversion',
      value: `${conversionRate}%`,
      icon: Percent,
      color: 'text-teal-600',
      bgColor: 'bg-teal-50',
    },
    {
      title: 'Commission Totale',
      value: `${totalCommission.toLocaleString()} XOF`,
      icon: TrendingUp,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      title: 'En Attente',
      value: `${pendingCommission.toLocaleString()} XOF`,
      icon: Clock,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50',
    },
    {
      title: 'Payé',
      value: `${paidCommission.toLocaleString()} XOF`,
      icon: DollarSign,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {stats.map((stat, index) => {
        const Icon = stat.icon;
        return (
          <Card key={index} className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                <Icon className={`w-4 h-4 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

