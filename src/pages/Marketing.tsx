/**
 * Marketing Page - Hub central pour toutes les fonctionnalités marketing
 * Date: 2 Décembre 2025
 */

import { NavLink } from 'react-router-dom';
import { MainLayout } from '@/components/layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Target, Tag, Mail, BarChart3, Users, TrendingUp } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export const Marketing = () => {
  const { t } = useTranslation();

  const marketingFeatures = [
    {
      title: 'Promotions',
      description: 'Créez et gérez vos promotions, codes de réduction et offres spéciales',
      icon: Tag,
      path: '/dashboard/promotions',
      color: 'from-purple-600 to-pink-600',
    },
    {
      title: 'Campagnes Email',
      description: 'Créez et envoyez des campagnes email marketing ciblées',
      icon: Mail,
      path: '/dashboard/emails/campaigns',
      color: 'from-blue-600 to-cyan-600',
    },
    {
      title: 'Séquences Email',
      description: 'Automatisez vos emails avec des séquences de relance',
      icon: Mail,
      path: '/dashboard/emails/sequences',
      color: 'from-blue-600 to-cyan-600',
    },
    {
      title: 'Segments',
      description: 'Segmentez votre audience pour des campagnes ciblées',
      icon: Users,
      path: '/dashboard/emails/segments',
      color: 'from-green-600 to-emerald-600',
    },
    {
      title: 'Workflows',
      description: 'Créez des workflows automatisés pour votre marketing',
      icon: TrendingUp,
      path: '/dashboard/emails/workflows',
      color: 'from-orange-600 to-amber-600',
    },
    {
      title: 'Analytics Marketing',
      description: 'Analysez les performances de vos campagnes marketing',
      icon: BarChart3,
      path: '/dashboard/emails/analytics',
      color: 'from-indigo-600 to-purple-600',
    },
  ];

  return (
    <MainLayout layoutType="marketing">
      <div className="container mx-auto p-3 sm:p-4 md:p-6 lg:p-8 space-y-4 sm:space-y-5 md:space-y-6">
        {/* Header */}
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10 border border-primary/20">
              <Target className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-lg sm:text-2xl md:text-3xl lg:text-4xl font-bold text-foreground">
                Marketing
              </h1>
              <p className="text-[10px] sm:text-xs md:text-sm lg:text-base text-muted-foreground">
                Gérez toutes vos activités marketing en un seul endroit
              </p>
            </div>
          </div>
        </div>

        {/* Marketing Features Grid */}
        <div className="grid gap-3 sm:gap-4 md:grid-cols-2 lg:grid-cols-3">
          {marketingFeatures.map((feature) => {
            const Icon = feature.icon;
            return (
              <NavLink key={feature.path} to={feature.path}>
                <Card className="h-full hover:shadow-lg transition-all duration-300 hover:scale-[1.02] cursor-pointer border-border/50 bg-card/50 backdrop-blur-sm">
                  <CardHeader className="p-3 sm:p-4 md:p-6">
                    <div className="flex items-center gap-2 sm:gap-2.5 md:gap-3 mb-1.5 sm:mb-2">
                      <div className={`p-1.5 sm:p-2 rounded-lg bg-gradient-to-br ${feature.color} bg-opacity-10`}>
                        <Icon className={`h-4 w-4 sm:h-4.5 sm:w-4.5 md:h-5 md:w-5 bg-gradient-to-r ${feature.color} bg-clip-text text-transparent`} />
                      </div>
                      <CardTitle className="text-xs sm:text-sm md:text-base lg:text-lg">{feature.title}</CardTitle>
                    </div>
                    <CardDescription className="text-[10px] sm:text-xs md:text-sm">{feature.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="p-3 sm:p-4 md:p-6">
                    <div className={`text-[10px] sm:text-xs md:text-sm font-medium bg-gradient-to-r ${feature.color} bg-clip-text text-transparent`}>
                      Accéder →
                    </div>
                  </CardContent>
                </Card>
              </NavLink>
            );
          })}
        </div>

        {/* Quick Stats */}
        <div className="grid gap-3 sm:gap-4 md:grid-cols-3">
          <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
            <CardHeader className="pb-1.5 sm:pb-2 p-3 sm:p-4 md:p-6">
              <CardTitle className="text-[10px] sm:text-xs md:text-sm font-medium text-muted-foreground">
                Campagnes Actives
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3 sm:p-4 md:p-6 pt-0">
              <div className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold text-foreground">-</div>
              <p className="text-[10px] sm:text-xs md:text-sm text-muted-foreground mt-0.5 sm:mt-1">
                Aucune donnée disponible
              </p>
            </CardContent>
          </Card>
          <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
            <CardHeader className="pb-1.5 sm:pb-2 p-3 sm:p-4 md:p-6">
              <CardTitle className="text-[10px] sm:text-xs md:text-sm font-medium text-muted-foreground">
                Taux d'ouverture
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3 sm:p-4 md:p-6 pt-0">
              <div className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold text-foreground">-</div>
              <p className="text-[10px] sm:text-xs md:text-sm text-muted-foreground mt-0.5 sm:mt-1">
                Aucune donnée disponible
              </p>
            </CardContent>
          </Card>
          <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
            <CardHeader className="pb-1.5 sm:pb-2 p-3 sm:p-4 md:p-6">
              <CardTitle className="text-[10px] sm:text-xs md:text-sm font-medium text-muted-foreground">
                Promotions Actives
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3 sm:p-4 md:p-6 pt-0">
              <div className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold text-foreground">-</div>
              <p className="text-[10px] sm:text-xs md:text-sm text-muted-foreground mt-0.5 sm:mt-1">
                Aucune donnée disponible
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
};

export default Marketing;


