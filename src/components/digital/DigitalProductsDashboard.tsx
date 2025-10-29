import React, { useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import {
  Package,
  Download,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Users,
  Key,
  Shield,
  AlertCircle,
  CheckCircle2,
  Clock,
  Star,
  Eye,
  FileText,
  BarChart3,
  PieChart,
  Activity,
  Archive,
  Ban,
  Plus,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { DigitalProductStatusIndicator } from './DigitalProductStatusIndicator';

/**
 * Statistiques du dashboard
 */
export interface DashboardStats {
  totalProducts: number;
  activeProducts: number;
  draftProducts: number;
  archivedProducts: number;
  totalRevenue: number;
  totalDownloads: number;
  activeLicenses: number;
  activeCustomers: number;
  revenueGrowth: number; // en %
  downloadGrowth: number; // en %
}

/**
 * Produit populaire
 */
export interface PopularProduct {
  id: string;
  name: string;
  category: string;
  downloads: number;
  revenue: number;
  growth: number; // en %
  thumbnail?: string;
}

/**
 * Activité récente
 */
export interface RecentActivity {
  id: string;
  type: 'download' | 'purchase' | 'license' | 'alert';
  message: string;
  timestamp: Date | string;
  customerName?: string;
  productName?: string;
  amount?: number;
}

/**
 * Performance par catégorie
 */
export interface CategoryPerformance {
  category: string;
  products: number;
  downloads: number;
  revenue: number;
  growth: number; // en %
}

/**
 * Props pour DigitalProductsDashboard
 */
export interface DigitalProductsDashboardProps {
  /** Statistiques générales */
  stats: DashboardStats;
  
  /** Produits populaires */
  popularProducts: PopularProduct[];
  
  /** Activités récentes */
  recentActivities: RecentActivity[];
  
  /** Performance par catégorie */
  categoryPerformance: CategoryPerformance[];
  
  /** Callback pour voir tous les produits */
  onViewAllProducts?: () => void;
  
  /** Callback pour créer un produit */
  onCreateProduct?: () => void;
  
  /** Classe CSS personnalisée */
  className?: string;
}

/**
 * DigitalProductsDashboard - Dashboard principal pour les produits digitaux
 * 
 * @example
 * ```tsx
 * <DigitalProductsDashboard 
 *   stats={dashboardStats}
 *   popularProducts={topProducts}
 *   recentActivities={activities}
 *   categoryPerformance={categories}
 *   onViewAllProducts={() => navigate('/products')}
 *   onCreateProduct={() => navigate('/products/create')}
 * />
 * ```
 */
export const DigitalProductsDashboard: React.FC<DigitalProductsDashboardProps> = ({
  stats,
  popularProducts,
  recentActivities,
  categoryPerformance,
  onViewAllProducts,
  onCreateProduct,
  className,
}) => {
  // Formater la date relative
  const formatRelativeTime = (date: Date | string) => {
    const d = typeof date === 'string' ? new Date(date) : date;
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'À l\'instant';
    if (diffMins < 60) return `Il y a ${diffMins} min`;
    if (diffHours < 24) return `Il y a ${diffHours}h`;
    return `Il y a ${diffDays}j`;
  };

  // Calculer la santé globale
  const overallHealth = useMemo(() => {
    const activeRatio = stats.totalProducts > 0 ? (stats.activeProducts / stats.totalProducts) * 100 : 0;
    const growth = (stats.revenueGrowth + stats.downloadGrowth) / 2;
    
    if (activeRatio > 70 && growth > 10) return { label: 'Excellent', color: 'text-green-600', icon: CheckCircle2 };
    if (activeRatio > 50 && growth > 0) return { label: 'Bon', color: 'text-blue-600', icon: TrendingUp };
    if (activeRatio > 30) return { label: 'Moyen', color: 'text-orange-600', icon: Clock };
    return { label: 'À améliorer', color: 'text-red-600', icon: AlertCircle };
  }, [stats]);

  const HealthIcon = overallHealth.icon;

  // Obtenir l'icône d'activité
  const getActivityIcon = (type: RecentActivity['type']) => {
    switch (type) {
      case 'download':
        return Download;
      case 'purchase':
        return DollarSign;
      case 'license':
        return Key;
      case 'alert':
        return AlertCircle;
    }
  };

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Dashboard Produits Digitaux</h1>
          <p className="text-muted-foreground">Vue d'ensemble de vos produits et performances</p>
        </div>
        {onCreateProduct && (
          <Button onClick={onCreateProduct} size="lg">
            <Plus className="h-5 w-5 mr-2" />
            Nouveau produit
          </Button>
        )}
      </div>

      {/* Statistiques principales */}
      <div className="grid md:grid-cols-4 gap-6">
        {/* Total produits */}
        <Card className="p-6">
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Produits Totaux</p>
              <p className="text-3xl font-bold">{stats.totalProducts}</p>
              <div className="flex items-center gap-2 text-xs">
                <Badge variant="default" className="bg-green-600">{stats.activeProducts} actifs</Badge>
                <Badge variant="secondary">{stats.draftProducts} brouillons</Badge>
              </div>
            </div>
            <div className="p-3 bg-blue-50 rounded-lg">
              <Package className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </Card>

        {/* Revenue */}
        <Card className="p-6">
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Revenue Total</p>
              <p className="text-3xl font-bold text-green-600">
                {stats.totalRevenue.toLocaleString()} €
              </p>
              <div className="flex items-center gap-1 text-xs">
                {stats.revenueGrowth >= 0 ? (
                  <>
                    <TrendingUp className="h-3 w-3 text-green-600" />
                    <span className="text-green-600">+{stats.revenueGrowth}%</span>
                  </>
                ) : (
                  <>
                    <TrendingDown className="h-3 w-3 text-red-600" />
                    <span className="text-red-600">{stats.revenueGrowth}%</span>
                  </>
                )}
                <span className="text-muted-foreground">vs mois dernier</span>
              </div>
            </div>
            <div className="p-3 bg-green-50 rounded-lg">
              <DollarSign className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </Card>

        {/* Téléchargements */}
        <Card className="p-6">
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Téléchargements</p>
              <p className="text-3xl font-bold">{stats.totalDownloads.toLocaleString()}</p>
              <div className="flex items-center gap-1 text-xs">
                {stats.downloadGrowth >= 0 ? (
                  <>
                    <TrendingUp className="h-3 w-3 text-blue-600" />
                    <span className="text-blue-600">+{stats.downloadGrowth}%</span>
                  </>
                ) : (
                  <>
                    <TrendingDown className="h-3 w-3 text-red-600" />
                    <span className="text-red-600">{stats.downloadGrowth}%</span>
                  </>
                )}
                <span className="text-muted-foreground">vs mois dernier</span>
              </div>
            </div>
            <div className="p-3 bg-purple-50 rounded-lg">
              <Download className="h-6 w-6 text-purple-600" />
            </div>
          </div>
        </Card>

        {/* Clients */}
        <Card className="p-6">
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Clients Actifs</p>
              <p className="text-3xl font-bold">{stats.activeCustomers}</p>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Key className="h-3 w-3" />
                <span>{stats.activeLicenses} licences actives</span>
              </div>
            </div>
            <div className="p-3 bg-orange-50 rounded-lg">
              <Users className="h-6 w-6 text-orange-600" />
            </div>
          </div>
        </Card>
      </div>

      {/* Santé globale */}
      <Card className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className={cn('p-4 rounded-xl bg-opacity-10', `bg-${overallHealth.color.split('-')[1]}-100`)}>
              <HealthIcon className={cn('h-8 w-8', overallHealth.color)} />
            </div>
            <div>
              <h3 className="text-xl font-bold">Santé Globale</h3>
              <p className={cn('text-lg font-semibold', overallHealth.color)}>
                {overallHealth.label}
              </p>
            </div>
          </div>
          <div className="flex gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold">{Math.round((stats.activeProducts / stats.totalProducts) * 100)}%</p>
              <p className="text-xs text-muted-foreground">Taux d'activation</p>
            </div>
            <Separator orientation="vertical" className="h-12" />
            <div className="text-center">
              <p className="text-2xl font-bold">
                {Math.round((stats.revenueGrowth + stats.downloadGrowth) / 2)}%
              </p>
              <p className="text-xs text-muted-foreground">Croissance moyenne</p>
            </div>
          </div>
        </div>
      </Card>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Produits populaires */}
        <Card className="lg:col-span-2">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Produits Populaires</h3>
              {onViewAllProducts && (
                <Button variant="ghost" size="sm" onClick={onViewAllProducts}>
                  Voir tout
                </Button>
              )}
            </div>

            <div className="space-y-4">
              {popularProducts.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Package className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>Aucun produit populaire</p>
                </div>
              ) : (
                popularProducts.map((product, index) => (
                  <div key={product.id} className="flex items-center gap-4 p-4 hover:bg-muted/50 rounded-lg transition-colors">
                    <div className="flex items-center gap-3 flex-1">
                      <div className="font-bold text-lg text-muted-foreground w-6">
                        #{index + 1}
                      </div>
                      {product.thumbnail ? (
                        <img
                          src={product.thumbnail}
                          alt={product.name}
                          className="h-12 w-12 rounded object-cover"
                        />
                      ) : (
                        <div className="h-12 w-12 rounded bg-muted flex items-center justify-center">
                          <Package className="h-6 w-6 text-muted-foreground" />
                        </div>
                      )}
                      <div className="flex-1">
                        <p className="font-semibold">{product.name}</p>
                        <p className="text-xs text-muted-foreground">{product.category}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-6">
                      <div className="text-right">
                        <div className="flex items-center gap-1">
                          <Download className="h-4 w-4 text-blue-600" />
                          <span className="font-semibold">{product.downloads.toLocaleString()}</span>
                        </div>
                        <p className="text-xs text-muted-foreground">téléchargements</p>
                      </div>

                      <div className="text-right">
                        <p className="font-semibold text-green-600">
                          {product.revenue.toLocaleString()} €
                        </p>
                        <div className="flex items-center gap-1 text-xs">
                          {product.growth >= 0 ? (
                            <>
                              <TrendingUp className="h-3 w-3 text-green-600" />
                              <span className="text-green-600">+{product.growth}%</span>
                            </>
                          ) : (
                            <>
                              <TrendingDown className="h-3 w-3 text-red-600" />
                              <span className="text-red-600">{product.growth}%</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </Card>

        {/* Activités récentes */}
        <Card>
          <div className="p-6">
            <h3 className="text-lg font-semibold mb-4">Activités Récentes</h3>

            <ScrollArea className="h-[400px]">
              <div className="space-y-4">
                {recentActivities.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Activity className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>Aucune activité récente</p>
                  </div>
                ) : (
                  recentActivities.map((activity) => {
                    const ActivityIcon = getActivityIcon(activity.type);

                    return (
                      <div key={activity.id} className="flex items-start gap-3">
                        <div className={cn(
                          'p-2 rounded-lg',
                          activity.type === 'purchase' && 'bg-green-50',
                          activity.type === 'download' && 'bg-blue-50',
                          activity.type === 'license' && 'bg-purple-50',
                          activity.type === 'alert' && 'bg-orange-50'
                        )}>
                          <ActivityIcon className={cn(
                            'h-4 w-4',
                            activity.type === 'purchase' && 'text-green-600',
                            activity.type === 'download' && 'text-blue-600',
                            activity.type === 'license' && 'text-purple-600',
                            activity.type === 'alert' && 'text-orange-600'
                          )} />
                        </div>

                        <div className="flex-1">
                          <p className="text-sm">{activity.message}</p>
                          {activity.amount && (
                            <p className="text-sm font-semibold text-green-600">
                              +{activity.amount} €
                            </p>
                          )}
                          <p className="text-xs text-muted-foreground">
                            {formatRelativeTime(activity.timestamp)}
                          </p>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </ScrollArea>
          </div>
        </Card>
      </div>

      {/* Performance par catégorie */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold">Performance par Catégorie</h3>
          <div className="flex items-center gap-2">
            <PieChart className="h-5 w-5 text-muted-foreground" />
            <BarChart3 className="h-5 w-5 text-muted-foreground" />
          </div>
        </div>

        <div className="space-y-4">
          {categoryPerformance.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <PieChart className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>Aucune donnée de performance</p>
            </div>
          ) : (
            categoryPerformance.map((category) => (
              <div key={category.category}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <p className="font-medium">{category.category}</p>
                    <Badge variant="secondary">{category.products} produits</Badge>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <p className="text-sm font-semibold">{category.downloads.toLocaleString()}</p>
                      <p className="text-xs text-muted-foreground">téléchargements</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-green-600">
                        {category.revenue.toLocaleString()} €
                      </p>
                      <div className="flex items-center gap-1 text-xs">
                        {category.growth >= 0 ? (
                          <>
                            <TrendingUp className="h-3 w-3 text-green-600" />
                            <span className="text-green-600">+{category.growth}%</span>
                          </>
                        ) : (
                          <>
                            <TrendingDown className="h-3 w-3 text-red-600" />
                            <span className="text-red-600">{category.growth}%</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                <Progress 
                  value={(category.revenue / stats.totalRevenue) * 100} 
                  className="h-2"
                />
              </div>
            ))
          )}
        </div>
      </Card>
    </div>
  );
};

DigitalProductsDashboard.displayName = 'DigitalProductsDashboard';

export default DigitalProductsDashboard;

