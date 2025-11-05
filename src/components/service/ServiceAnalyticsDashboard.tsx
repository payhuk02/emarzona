/**
 * Service Product Analytics Dashboard
 * Date: 28 octobre 2025
 * 
 * Dashboard analytics professionnel pour services
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Calendar,
  TrendingUp,
  Users,
  DollarSign,
  Clock,
  CheckCircle2,
  XCircle,
  BarChart3,
} from 'lucide-react';
import { useBookingStats, useServiceBookings } from '@/hooks/service/useBookings';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useMemo } from 'react';

interface ServiceAnalyticsDashboardProps {
  serviceId: string;
}

const ServiceAnalyticsDashboard = ({
  serviceId,
}: ServiceAnalyticsDashboardProps) => {
  // Get booking stats for the last 30 days
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const today = new Date().toISOString().split('T')[0];
  const startDate = thirtyDaysAgo.toISOString().split('T')[0];

  const { data: bookingStats, isLoading: isLoadingStats } = useBookingStats(
    serviceId,
    startDate,
    today
  );

  // Get all bookings for calculations
  const { data: allBookings, isLoading: isLoadingBookings } = useServiceBookings(serviceId);

  // Get upcoming bookings
  const { data: upcomingBookings } = useQuery({
    queryKey: ['upcoming-bookings', serviceId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('service_bookings')
        .select('*')
        .eq('product_id', serviceId)
        .eq('status', 'confirmed')
        .gte('booking_date', today)
        .order('booking_date', { ascending: true })
        .limit(100);

      if (error) throw error;
      return data || [];
    },
    enabled: !!serviceId,
  });

  // Get average rating from reviews
  const { data: averageRating } = useQuery({
    queryKey: ['service-rating', serviceId],
    queryFn: async () => {
      const { data: product } = await supabase
        .from('products')
        .select('id')
        .eq('id', serviceId)
        .single();

      if (!product) return 0;

      const { data: reviews, error } = await supabase
        .from('product_reviews')
        .select('rating')
        .eq('product_id', product.id);

      if (error || !reviews || reviews.length === 0) return 0;

      const sum = reviews.reduce((acc, r) => acc + (r.rating || 0), 0);
      return sum / reviews.length;
    },
    enabled: !!serviceId,
  });

  // Calculate stats
  const stats = useMemo(() => {
    const stats = bookingStats || {
      total: 0,
      completed: 0,
      cancelled: 0,
      revenue: 0,
    };

    const bookings = allBookings || [];
    const upcoming = upcomingBookings || [];

    // Calculate average booking value
    const completedBookingsPrices = bookings
      .filter(b => b.status === 'completed' && b.total_price)
      .map(b => b.total_price || 0);
    const averageBookingValue = completedBookingsPrices.length > 0
      ? completedBookingsPrices.reduce((sum, price) => sum + price, 0) / completedBookingsPrices.length
      : 0;

    // Calculate occupancy rate (completed / total available slots)
    // This is a simplified calculation - could be enhanced with actual availability data
    const occupancyRate = bookings.length > 0
      ? Math.round((stats.completed / bookings.length) * 100)
      : 0;

    return {
      totalBookings: stats.total,
      revenue: stats.revenue || 0,
      averageBookingValue,
      completedBookings: stats.completed,
      canceledBookings: stats.cancelled,
      upcomingBookings: upcoming.length,
      averageRating: averageRating || 0,
      occupancyRate,
    };
  }, [bookingStats, allBookings, upcomingBookings, averageRating]);

  const isLoading = isLoadingStats || isLoadingBookings;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardHeader className="space-y-0 pb-2">
                <Skeleton className="h-4 w-24 mb-2" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16 mb-2" />
                <Skeleton className="h-3 w-32" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Réservations</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalBookings}</div>
            <p className="text-xs text-muted-foreground">
              {stats.completedBookings} complétées
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenus</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Math.round(stats.revenue).toLocaleString()} XOF</div>
            <p className="text-xs text-muted-foreground">
              Moyenne: {Math.round(stats.averageBookingValue).toLocaleString()} XOF
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taux de remplissage</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.occupancyRate}%</div>
            <p className="text-xs text-muted-foreground">
              {stats.upcomingBookings} réservation(s) à venir
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Satisfaction</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.averageRating > 0 ? stats.averageRating.toFixed(1) : 'N/A'}/5</div>
            <p className="text-xs text-muted-foreground">
              {stats.averageRating > 0 ? 'Basé sur les avis clients' : 'Aucun avis pour le moment'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Performance Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Performance du Service</CardTitle>
          <CardDescription>Statistiques clés pour optimiser vos réservations</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium">Réservations complétées</span>
              </div>
              <span className="text-sm font-bold">{stats.completedBookings}</span>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <XCircle className="h-4 w-4 text-red-600" />
                <span className="text-sm font-medium">Annulations</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold">{stats.canceledBookings}</span>
                {stats.canceledBookings > 0 && (
                  <Badge variant="destructive" className="text-xs">
                    {stats.totalBookings > 0 
                      ? Math.round((stats.canceledBookings / stats.totalBookings) * 100) 
                      : 0}%
                  </Badge>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium">Réservations à venir</span>
              </div>
              <span className="text-sm font-bold">{stats.upcomingBookings}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Analytics Coming Soon */}
      <Card>
        <CardHeader>
          <CardTitle>Analytics Avancés</CardTitle>
          <CardDescription>Graphiques et statistiques détaillées (en développement)</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <BarChart3 className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Fonctionnalité en cours de développement</h3>
            <p className="text-sm text-muted-foreground max-w-md">
              Les graphiques de réservations, tendances de disponibilité et analytics détaillés seront bientôt disponibles.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ServiceAnalyticsDashboard;
