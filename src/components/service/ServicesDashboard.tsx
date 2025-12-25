import React, { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  LayoutDashboard,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Users,
  Package,
  Calendar,
  Clock,
  Star,
  AlertCircle,
  CheckCircle2,
  Activity,
  BarChart3,
} from '@/components/icons';
import { cn } from '@/lib/utils';
import { Service } from './ServicesList';

/**
 * Service performance data
 */
export interface ServicePerformance {
  serviceId: string;
  serviceName: string;
  bookingsCount: number;
  revenue: number;
  averageRating: number;
  capacityUtilization: number; // percentage
  trend: 'up' | 'down' | 'stable';
}

/**
 * Dashboard statistics
 */
export interface ServicesDashboardStats {
  totalServices: number;
  activeServices: number;
  totalBookings: number;
  totalRevenue: number;
  averageRating: number;
  capacityUtilization: number;
  topPerformingServices: ServicePerformance[];
  recentActivity: {
    id: string;
    type: 'new_service' | 'booking' | 'review';
    message: string;
    timestamp: Date | string;
  }[];
}

/**
 * Props pour ServicesDashboard
 */
export interface ServicesDashboardProps {
  /** Statistiques du dashboard */
  stats: ServicesDashboardStats;
  
  /** Services pour affichage */
  services?: Service[];
  
  /** Période sélectionnée */
  period?: '7days' | '30days' | '90days' | 'year';
  
  /** Callback pour changer de période */
  onPeriodChange?: (period: '7days' | '30days' | '90days' | 'year') => void;
  
  /** Loading state */
  isLoading?: boolean;
  
  /** Classe CSS personnalisée */
  className?: string;
}

/**
 * ServicesDashboard - Vue d'ensemble complète des services
 */
export const ServicesDashboard: React.FC<ServicesDashboardProps> = ({
  stats,
  services = [],
  period = '30days',
  onPeriodChange,
  isLoading = false,
  className,
}) => {
  // Calculer les insights
  const insights = useMemo(() => {
    const lowCapacityServices = services.filter(
      (s) =>
        s.totalSlots &&
        s.availableSlots &&
        (s.availableSlots / s.totalSlots) * 100 < 20
    );

    const topRatedServices = services
      .filter((s) => s.averageRating && s.averageRating >= 4.5)
      .slice(0, 5);

    const revenueGrowth = stats.totalRevenue > 0 ? 15 : 0; // Mocked, à calculer réellement

    return {
      lowCapacityServices,
      topRatedServices,
      revenueGrowth,
    };
  }, [services, stats]);

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount);
  };

  // Format relative time
  const formatRelativeTime = (date: Date | string) => {
    const d = typeof date === 'string' ? new Date(date) : date;
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'À l\'instant';
    if (minutes < 60) return `Il y a ${minutes}min`;
    if (hours < 24) return `Il y a ${hours}h`;
    return `Il y a ${days}j`;
  };

  // Loading state
  if (isLoading) {
    return (
      <div className={cn('space-y-6', className)}>
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <Activity className="h-12 w-12 animate-pulse mx-auto text-primary mb-4" />
            <p className="text-muted-foreground">Chargement du dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <LayoutDashboard className="h-8 w-8" />
            Dashboard Services
          </h1>
          <p className="text-muted-foreground mt-1">
            Vue d'ensemble de vos services et performances
          </p>
        </div>

        {/* Period selector */}
        {onPeriodChange && (
          <Tabs value={period} onValueChange={onPeriodChange as any}>
            <TabsList>
              <TabsTrigger value="7days">7 jours</TabsTrigger>
              <TabsTrigger value="30days">30 jours</TabsTrigger>
              <TabsTrigger value="90days">90 jours</TabsTrigger>
              <TabsTrigger value="year">Année</TabsTrigger>
            </TabsList>
          </Tabs>
        )}
      </div>

      {/* Key metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Services */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Services actifs</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeServices}</div>
            <p className="text-xs text-muted-foreground">
              sur {stats.totalServices} total
            </p>
          </CardContent>
        </Card>

        {/* Total Bookings */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Réservations</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalBookings}</div>
            <div className="flex items-center text-xs text-green-600 mt-1">
              <TrendingUp className="h-3 w-3 mr-1" />
              +12% vs période précédente
            </div>
          </CardContent>
        </Card>

        {/* Total Revenue */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenu total</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.totalRevenue)}</div>
            <div className="flex items-center text-xs text-green-600 mt-1">
              <TrendingUp className="h-3 w-3 mr-1" />
              +{insights.revenueGrowth}% ce mois
            </div>
          </CardContent>
        </Card>

        {/* Average Rating */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Satisfaction client</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold flex items-center gap-1">
              {stats.averageRating.toFixed(1)}
              <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
            </div>
            <p className="text-xs text-muted-foreground">Sur 5 étoiles</p>
          </CardContent>
        </Card>
      </div>

      {/* Main content grid */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left column - Top performers */}
        <div className="lg:col-span-2 space-y-6">
          {/* Top performing services */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-green-600" />
                Services les plus performants
              </CardTitle>
              <CardDescription>
                Classés par revenu généré
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {stats.topPerformingServices.slice(0, 5).map((service, index) => (
                  <div key={service.serviceId} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-bold text-sm">
                          #{index + 1}
                        </div>
                        <div>
                          <p className="font-medium">{service.serviceName}</p>
                          <p className="text-xs text-muted-foreground">
                            {service.bookingsCount} réservations
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold">{formatCurrency(service.revenue)}</p>
                        <div className="flex items-center justify-end gap-1 text-xs text-muted-foreground">
                          {service.trend === 'up' && (
                            <TrendingUp className="h-3 w-3 text-green-600" />
                          )}
                          {service.trend === 'down' && (
                            <TrendingDown className="h-3 w-3 text-red-600" />
                          )}
                          <span>{service.capacityUtilization.toFixed(0)}% occupé</span>
                        </div>
                      </div>
                    </div>
                    <Progress value={service.capacityUtilization} className="h-2" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Capacity overview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Utilisation de la capacité
              </CardTitle>
              <CardDescription>
                Taux d'occupation global: {stats.capacityUtilization.toFixed(0)}%
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Progress value={stats.capacityUtilization} className="h-3" />
                
                {/* Low capacity alerts */}
                {insights.lowCapacityServices.length > 0 && (
                  <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="h-5 w-5 text-orange-600 mt-0.5" />
                      <div>
                        <p className="font-medium text-orange-900 text-sm">
                          {insights.lowCapacityServices.length} service(s) avec capacité faible
                        </p>
                        <ul className="mt-2 space-y-1">
                          {insights.lowCapacityServices.slice(0, 3).map((s) => (
                            <li key={s.id} className="text-xs text-orange-700">
                              • {s.name} - {s.availableSlots}/{s.totalSlots} créneaux
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right column - Activity & Alerts */}
        <div className="space-y-6">
          {/* Recent activity */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Activité récente
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {stats.recentActivity.slice(0, 8).map((activity) => (
                  <div key={activity.id} className="flex gap-3">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-muted flex-shrink-0">
                      {activity.type === 'new_service' && <Package className="h-4 w-4" />}
                      {activity.type === 'booking' && <Calendar className="h-4 w-4" />}
                      {activity.type === 'review' && <Star className="h-4 w-4" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm">{activity.message}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {formatRelativeTime(activity.timestamp)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Quick actions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Actions rapides</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button className="w-full justify-start" variant="outline">
                <Package className="h-4 w-4 mr-2" />
                Créer un nouveau service
              </Button>
              <Button className="w-full justify-start" variant="outline">
                <Calendar className="h-4 w-4 mr-2" />
                Voir toutes les réservations
              </Button>
              <Button className="w-full justify-start" variant="outline">
                <Users className="h-4 w-4 mr-2" />
                Gérer le staff
              </Button>
              <Button className="w-full justify-start" variant="outline">
                <BarChart3 className="h-4 w-4 mr-2" />
                Rapports détaillés
              </Button>
            </CardContent>
          </Card>

          {/* Top rated services */}
          {insights.topRatedServices.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Star className="h-4 w-4 text-yellow-500" />
                  Mieux notés
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {insights.topRatedServices.map((service) => (
                    <div key={service.id} className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className="text-sm font-medium truncate">{service.name}</p>
                        <div className="flex items-center gap-1 mt-0.5">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star
                              key={i}
                              className={cn(
                                'h-3 w-3',
                                i < Math.floor(service.averageRating || 0)
                                  ? 'fill-yellow-400 text-yellow-400'
                                  : 'text-gray-300'
                              )}
                            />
                          ))}
                        </div>
                      </div>
                      <Badge variant="secondary" className="ml-2">
                        {service.averageRating?.toFixed(1)}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

ServicesDashboard.displayName = 'ServicesDashboard';

export default ServicesDashboard;

