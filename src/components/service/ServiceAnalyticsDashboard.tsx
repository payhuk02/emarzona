/**
 * Service Product Analytics Dashboard
 * Date: 28 octobre 2025
 * 
 * Dashboard analytics professionnel pour services
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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

interface ServiceAnalyticsDashboardProps {
  serviceId: string;
}

export const ServiceAnalyticsDashboard = ({
  serviceId,
}: ServiceAnalyticsDashboardProps) => {
  // TODO: Implement actual data fetching with React Query
  // For now, display placeholder UI

  const stats = {
    totalBookings: 0,
    revenue: 0,
    averageBookingValue: 0,
    completedBookings: 0,
    canceledBookings: 0,
    upcomingBookings: 0,
    averageRating: 0,
    occupancyRate: 0,
  };

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
              +0% par rapport au mois dernier
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenus</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.revenue.toLocaleString()} XOF</div>
            <p className="text-xs text-muted-foreground">
              Valeur moyenne: {stats.averageBookingValue.toLocaleString()} XOF
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
            <div className="text-2xl font-bold">{stats.averageRating.toFixed(1)}/5</div>
            <p className="text-xs text-muted-foreground">
              Basé sur 0 avis
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
                <span className="text-sm font-medium">Durée moyenne</span>
              </div>
              <span className="text-sm font-bold">60 min</span>
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

