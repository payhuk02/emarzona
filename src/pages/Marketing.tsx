/**
 * Marketing Page - Hub central pour toutes les fonctionnalités marketing
 * Date: 2 Décembre 2025
 */

import { NavLink } from 'react-router-dom';
import { MainLayout } from '@/components/layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Target, Tag, Mail, BarChart3, Users, TrendingUp } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';

export const Marketing = () => {
  const { t } = useTranslation();
  const headerRef = useScrollAnimation<HTMLDivElement>();
  const featuresRef = useScrollAnimation<HTMLDivElement>();
  const statsRef = useScrollAnimation<HTMLDivElement>();

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
      <div className="container mx-auto p-3 sm:p-4 lg:p-6 space-y-4 sm:space-y-6">
        {/* Header - Responsive & Animated */}
        <div 
          ref={headerRef}
          className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 animate-in fade-in slide-in-from-top-4 duration-700"
        >
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="p-1.5 sm:p-2 rounded-lg bg-gradient-to-br from-purple-500/10 to-pink-500/5 backdrop-blur-sm border border-purple-500/20 animate-in zoom-in duration-500">
              <Target className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 lg:h-8 lg:w-8 text-purple-500 dark:text-purple-400" aria-hidden="true" />
            </div>
            <div>
              <h1 className="text-lg sm:text-2xl md:text-3xl lg:text-4xl font-bold flex items-center gap-1.5 sm:gap-2 mb-1 sm:mb-2">
                <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                  Marketing
                </span>
              </h1>
              <p className="text-[10px] sm:text-xs md:text-sm lg:text-base text-muted-foreground">
                Gérez toutes vos activités marketing en un seul endroit
              </p>
            </div>
          </div>
        </div>

        {/* Marketing Features Grid */}
        <div 
          ref={featuresRef}
          className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 animate-in fade-in slide-in-from-bottom-4 duration-700"
        >
          {marketingFeatures.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <NavLink key={feature.path} to={feature.path}>
                <Card 
                  className="h-full hover:shadow-lg transition-all duration-300 hover:scale-[1.02] cursor-pointer border-border/50 bg-card/50 backdrop-blur-sm touch-manipulation min-h-[120px] sm:min-h-[140px] animate-in fade-in slide-in-from-bottom-2"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <CardHeader className="pb-2 sm:pb-3 p-3 sm:p-4 md:p-6">
                    <div className="flex items-center gap-2 sm:gap-2.5 md:gap-3 mb-1.5 sm:mb-2">
                      <div className={`p-1.5 sm:p-2 rounded-lg bg-gradient-to-br ${feature.color === 'from-purple-600 to-pink-600' ? 'from-purple-500/10 to-pink-500/10' : feature.color === 'from-blue-600 to-cyan-600' ? 'from-blue-500/10 to-cyan-500/10' : feature.color === 'from-green-600 to-emerald-600' ? 'from-green-500/10 to-emerald-500/10' : feature.color === 'from-orange-600 to-amber-600' ? 'from-orange-500/10 to-amber-500/10' : 'from-indigo-500/10 to-purple-500/10'}`}>
                        <Icon className={`h-3.5 w-3.5 sm:h-4 sm:w-4 md:h-5 md:w-5 ${feature.color === 'from-purple-600 to-pink-600' ? 'text-purple-500' : feature.color === 'from-blue-600 to-cyan-600' ? 'text-blue-500' : feature.color === 'from-green-600 to-emerald-600' ? 'text-green-500' : feature.color === 'from-orange-600 to-amber-600' ? 'text-orange-500' : 'text-indigo-500'}`} />
                      </div>
                      <CardTitle className="text-xs sm:text-sm md:text-base lg:text-lg font-semibold">{feature.title}</CardTitle>
                    </div>
                    <CardDescription className="text-[10px] sm:text-xs md:text-sm">{feature.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="p-3 sm:p-4 md:p-6 pt-0">
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
        <div 
          ref={statsRef}
          className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-3 animate-in fade-in slide-in-from-bottom-4 duration-700"
        >
          <Card className="border-border/50 bg-card/50 backdrop-blur-sm hover:shadow-lg transition-all duration-300 hover:scale-[1.02]">
            <CardHeader className="pb-1.5 sm:pb-2 md:pb-3 p-2.5 sm:p-3 md:p-4">
              <CardTitle className="text-[9px] sm:text-[10px] md:text-xs lg:text-sm font-medium text-muted-foreground">
                Campagnes Actives
              </CardTitle>
            </CardHeader>
            <CardContent className="p-2.5 sm:p-3 md:p-4 pt-0">
              <div className="text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl font-bold text-foreground">-</div>
              <p className="text-[9px] sm:text-[10px] md:text-xs text-muted-foreground mt-0.5 sm:mt-1">
                Aucune donnée disponible
              </p>
            </CardContent>
          </Card>
          <Card className="border-border/50 bg-card/50 backdrop-blur-sm hover:shadow-lg transition-all duration-300 hover:scale-[1.02]">
            <CardHeader className="pb-1.5 sm:pb-2 md:pb-3 p-2.5 sm:p-3 md:p-4">
              <CardTitle className="text-[9px] sm:text-[10px] md:text-xs lg:text-sm font-medium text-muted-foreground">
                Taux d'ouverture
              </CardTitle>
            </CardHeader>
            <CardContent className="p-2.5 sm:p-3 md:p-4 pt-0">
              <div className="text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl font-bold text-foreground">-</div>
              <p className="text-[9px] sm:text-[10px] md:text-xs text-muted-foreground mt-0.5 sm:mt-1">
                Aucune donnée disponible
              </p>
            </CardContent>
          </Card>
          <Card className="border-border/50 bg-card/50 backdrop-blur-sm hover:shadow-lg transition-all duration-300 hover:scale-[1.02]">
            <CardHeader className="pb-1.5 sm:pb-2 md:pb-3 p-2.5 sm:p-3 md:p-4">
              <CardTitle className="text-[9px] sm:text-[10px] md:text-xs lg:text-sm font-medium text-muted-foreground">
                Promotions Actives
              </CardTitle>
            </CardHeader>
            <CardContent className="p-2.5 sm:p-3 md:p-4 pt-0">
              <div className="text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl font-bold text-foreground">-</div>
              <p className="text-[9px] sm:text-[10px] md:text-xs text-muted-foreground mt-0.5 sm:mt-1">
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








