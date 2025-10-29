import React, { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Calendar,
  Clock,
  Users,
  DollarSign,
  CheckCircle2,
  XCircle,
  AlertCircle,
  TrendingUp,
  TrendingDown,
  Minus,
  Package,
  Star,
  Activity,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Booking } from '@/hooks/services/useBookings';

/**
 * Booking statistics
 */
export interface BookingsDashboardStats {
  totalBookings: number;
  confirmedBookings: number;
  pendingBookings: number;
  completedBookings: number;
  cancelledBookings: number;
  noShowBookings: number;
  totalRevenue: number;
  averageBookingValue: number;
  upcomingBookings: number;
  bookingsByStatus: Record<string, number>;
  bookingsByDay: { date: string; count: number }[];
  topServices: { id: string; name: string; bookings: number }[];
  topCustomers: { id: string; name: string; bookings: number; revenue: number }[];
}

/**
 * Props pour BookingsDashboard
 */
export interface BookingsDashboardProps {
  /** Statistiques du dashboard */
  stats: BookingsDashboardStats;
  
  /** Réservations récentes pour affichage */
  recentBookings?: Partial<Booking>[];
  
  /** Période sélectionnée */
  period?: 'today' | 'week' | 'month' | 'year';
  
  /** Callback pour changer de période */
  onPeriodChange?: (period: 'today' | 'week' | 'month' | 'year') => void;
  
  /** Callback pour voir les détails d'une réservation */
  onViewBooking?: (bookingId: string) => void;
  
  /** Loading state */
  isLoading?: boolean;
  
  /** Classe CSS personnalisée */
  className?: string;
}

/**
 * Configuration des statuts
 */
const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  pending: { label: 'En attente', color: 'bg-yellow-100 text-yellow-700', icon: Clock },
  confirmed: { label: 'Confirmée', color: 'bg-green-100 text-green-700', icon: CheckCircle2 },
  in_progress: { label: 'En cours', color: 'bg-blue-100 text-blue-700', icon: Package },
  completed: { label: 'Terminée', color: 'bg-gray-100 text-gray-700', icon: CheckCircle2 },
  cancelled: { label: 'Annulée', color: 'bg-red-100 text-red-700', icon: XCircle },
  no_show: { label: 'Absent', color: 'bg-orange-100 text-orange-700', icon: AlertCircle },
};

/**
 * BookingsDashboard - Dashboard complet des réservations
 */
export const BookingsDashboard: React.FC<BookingsDashboardProps> = ({
  stats,
  recentBookings = [],
  period = 'month',
  onPeriodChange,
  onViewBooking,
  isLoading = false,
  className,
}) => {
  // Calculer des métriques supplémentaires
  const metrics = useMemo(() => {
    const conversionRate = stats.totalBookings > 0
      ? ((stats.confirmedBookings + stats.completedBookings) / stats.totalBookings) * 100
      : 0;

    const cancellationRate = stats.totalBookings > 0
      ? ((stats.cancelledBookings + stats.noShowBookings) / stats.totalBookings) * 100
      : 0;

    const completionRate = stats.totalBookings > 0
      ? (stats.completedBookings / stats.totalBookings) * 100
      : 0;

    // Mock trend data (à calculer réellement à partir des données historiques)
    const bookingsTrend = 12; // +12%
    const revenueTrend = 18; // +18%

    return {
      conversionRate,
      cancellationRate,
      completionRate,
      bookingsTrend,
      revenueTrend,
    };
  }, [stats]);

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount);
  };

  // Format date
  const formatDate = (date: Date | string) => {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
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
            <Calendar className="h-8 w-8" />
            Dashboard Réservations
          </h1>
          <p className="text-muted-foreground mt-1">
            Suivi temps réel de toutes vos réservations
          </p>
        </div>

        {/* Period selector */}
        {onPeriodChange && (
          <Tabs value={period} onValueChange={onPeriodChange as any}>
            <TabsList>
              <TabsTrigger value="today">Aujourd'hui</TabsTrigger>
              <TabsTrigger value="week">Semaine</TabsTrigger>
              <TabsTrigger value="month">Mois</TabsTrigger>
              <TabsTrigger value="year">Année</TabsTrigger>
            </TabsList>
          </Tabs>
        )}
      </div>

      {/* Key metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Bookings */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Réservations totales</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalBookings}</div>
            <div className="flex items-center text-xs mt-1">
              {metrics.bookingsTrend >= 0 ? (
                <TrendingUp className="h-3 w-3 text-green-600 mr-1" />
              ) : (
                <TrendingDown className="h-3 w-3 text-red-600 mr-1" />
              )}
              <span className={metrics.bookingsTrend >= 0 ? 'text-green-600' : 'text-red-600'}>
                {metrics.bookingsTrend >= 0 ? '+' : ''}{metrics.bookingsTrend}%
              </span>
              <span className="text-muted-foreground ml-1">vs période précédente</span>
            </div>
          </CardContent>
        </Card>

        {/* Revenue */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenu</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.totalRevenue)}</div>
            <div className="flex items-center text-xs text-green-600 mt-1">
              <TrendingUp className="h-3 w-3 mr-1" />
              +{metrics.revenueTrend}% ce {period === 'today' ? 'jour' : period === 'week' ? 'semaine' : 'mois'}
            </div>
          </CardContent>
        </Card>

        {/* Pending */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">En attente</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingBookings}</div>
            <p className="text-xs text-muted-foreground">À confirmer rapidement</p>
          </CardContent>
        </Card>

        {/* Upcoming */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">À venir</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.upcomingBookings}</div>
            <p className="text-xs text-muted-foreground">Prochaines 48h</p>
          </CardContent>
        </Card>
      </div>

      {/* Main content grid */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left column - Bookings breakdown */}
        <div className="lg:col-span-2 space-y-6">
          {/* Status breakdown */}
          <Card>
            <CardHeader>
              <CardTitle>Répartition par statut</CardTitle>
              <CardDescription>
                Vue d'ensemble de toutes les réservations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Confirmed */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      <span>Confirmées</span>
                    </div>
                    <span className="font-medium">{stats.confirmedBookings}</span>
                  </div>
                  <Progress 
                    value={(stats.confirmedBookings / stats.totalBookings) * 100} 
                    className="h-2 bg-green-100"
                  />
                </div>

                {/* Completed */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-gray-600" />
                      <span>Terminées</span>
                    </div>
                    <span className="font-medium">{stats.completedBookings}</span>
                  </div>
                  <Progress 
                    value={(stats.completedBookings / stats.totalBookings) * 100} 
                    className="h-2"
                  />
                </div>

                {/* Pending */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-yellow-600" />
                      <span>En attente</span>
                    </div>
                    <span className="font-medium">{stats.pendingBookings}</span>
                  </div>
                  <Progress 
                    value={(stats.pendingBookings / stats.totalBookings) * 100} 
                    className="h-2 bg-yellow-100"
                  />
                </div>

                {/* Cancelled */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <XCircle className="h-4 w-4 text-red-600" />
                      <span>Annulées</span>
                    </div>
                    <span className="font-medium">{stats.cancelledBookings}</span>
                  </div>
                  <Progress 
                    value={(stats.cancelledBookings / stats.totalBookings) * 100} 
                    className="h-2 bg-red-100"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Performance metrics */}
          <div className="grid md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Taux de confirmation</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {metrics.conversionRate.toFixed(1)}%
                </div>
                <Progress value={metrics.conversionRate} className="h-2 mt-2" />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Taux de complétion</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">
                  {metrics.completionRate.toFixed(1)}%
                </div>
                <Progress value={metrics.completionRate} className="h-2 mt-2" />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Taux d'annulation</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">
                  {metrics.cancellationRate.toFixed(1)}%
                </div>
                <Progress value={metrics.cancellationRate} className="h-2 mt-2 bg-red-100" />
              </CardContent>
            </Card>
          </div>

          {/* Top services */}
          <Card>
            <CardHeader>
              <CardTitle>Services les plus réservés</CardTitle>
              <CardDescription>Top 5 par nombre de réservations</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {stats.topServices.slice(0, 5).map((service, index) => (
                  <div key={service.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary font-bold text-xs">
                        {index + 1}
                      </div>
                      <span className="font-medium">{service.name}</span>
                    </div>
                    <Badge variant="secondary">{service.bookings} réservations</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right column - Recent bookings & customers */}
        <div className="space-y-6">
          {/* Recent bookings */}
          <Card>
            <CardHeader>
              <CardTitle>Réservations récentes</CardTitle>
              <CardDescription>Activité en temps réel</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px] pr-4">
                <div className="space-y-3">
                  {recentBookings.slice(0, 10).map((booking) => {
                    const statusConfig = STATUS_CONFIG[booking.status || 'pending'];
                    const StatusIcon = statusConfig.icon;

                    return (
                      <div
                        key={booking.id}
                        className="p-3 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                        onClick={() => onViewBooking?.(booking.id!)}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <p className="font-medium text-sm">
                              {booking.customer_id || 'Client'}
                            </p>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {booking.service_id || 'Service'}
                            </p>
                            {booking.scheduled_date && (
                              <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {formatDate(booking.scheduled_date)}
                              </p>
                            )}
                          </div>
                          <Badge className={statusConfig.color}>
                            <StatusIcon className="h-3 w-3 mr-1" />
                            {statusConfig.label}
                          </Badge>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Top customers */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Meilleurs clients
              </CardTitle>
              <CardDescription>Par nombre de réservations</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {stats.topCustomers.slice(0, 5).map((customer, index) => (
                  <div key={customer.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 text-white font-bold text-xs">
                        {customer.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-medium text-sm">{customer.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {customer.bookings} réservations
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-sm">{formatCurrency(customer.revenue)}</p>
                      <div className="flex items-center gap-0.5 mt-0.5">
                        {Array.from({ length: Math.min(5, Math.floor(customer.bookings / 2)) }).map((_, i) => (
                          <Star key={i} className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Quick stats */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Statistiques rapides</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Valeur moyenne</span>
                <span className="font-semibold">{formatCurrency(stats.averageBookingValue)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">No-show</span>
                <span className="font-semibold">{stats.noShowBookings}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Meilleur jour</span>
                <span className="font-semibold">
                  {stats.bookingsByDay.length > 0 
                    ? stats.bookingsByDay.reduce((max, day) => day.count > max.count ? day : max).date 
                    : 'N/A'}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

BookingsDashboard.displayName = 'BookingsDashboard';

export default BookingsDashboard;

