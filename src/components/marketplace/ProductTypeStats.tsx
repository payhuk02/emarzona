/**
 * ProductTypeStats - Statistiques décomposées par type de produit
 * Affiche le nombre de produits, ventes, et moyenne de notes par type
 *
 * Date: 31 Janvier 2025
 */

import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Download,
  Package,
  Calendar,
  GraduationCap,
  Palette,
  TrendingUp,
  Star,
  ShoppingCart,
} from '@/components/icons';
import { Product } from '@/types/marketplace';
import { cn } from '@/lib/utils';

interface ProductTypeStatsProps {
  products: Product[];
  className?: string;
}

interface TypeStats {
  type: string;
  count: number;
  totalSales: number;
  averageRating: number;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  color: string;
}

export function ProductTypeStats({ products, className }: ProductTypeStatsProps) {
  const stats = useMemo(() => {
    const typeStatsMap = new Map<
      string,
      {
        count: number;
        totalSales: number;
        totalRating: number;
        ratingCount: number;
      }
    >();

    // Calculer les stats par type
    products.forEach(product => {
      const type = product.product_type || 'other';
      const current = typeStatsMap.get(type) || {
        count: 0,
        totalSales: 0,
        totalRating: 0,
        ratingCount: 0,
      };

      current.count += 1;
      current.totalSales += product.purchases_count || product.reviews_count || 0;

      if (product.rating && product.rating > 0) {
        current.totalRating += product.rating;
        current.ratingCount += 1;
      }

      typeStatsMap.set(type, current);
    });

    // Convertir en tableau avec labels et icônes
    const  typeConfig: Record<
      string,
      { label: string; icon: React.ComponentType<{ className?: string }>; color: string }
    > = {
      digital: {
        label: 'Digitaux',
        icon: Download,
        color: 'bg-blue-500',
      },
      physical: {
        label: 'Physiques',
        icon: Package,
        color: 'bg-green-500',
      },
      service: {
        label: 'Services',
        icon: Calendar,
        color: 'bg-purple-500',
      },
      course: {
        label: 'Cours',
        icon: GraduationCap,
        color: 'bg-orange-500',
      },
      artist: {
        label: 'Artistes',
        icon: Palette,
        color: 'bg-pink-500',
      },
    };

    const  statsArray: TypeStats[] = [];

    typeStatsMap.forEach((data, type) => {
      const config = typeConfig[type] || {
        label: type,
        icon: Package,
        color: 'bg-gray-500',
      };

      statsArray.push({
        type,
        count: data.count,
        totalSales: data.totalSales,
        averageRating: data.ratingCount > 0 ? data.totalRating / data.ratingCount : 0,
        icon: config.icon,
        label: config.label,
        color: config.color,
      });
    });

    // Trier par nombre de produits (décroissant)
    return statsArray.sort((a, b) => b.count - a.count);
  }, [products]);

  // Calculer les totaux globaux
  const totalProducts = useMemo(() => stats.reduce((sum, stat) => sum + stat.count, 0), [stats]);
  const totalSales = useMemo(() => stats.reduce((sum, stat) => sum + stat.totalSales, 0), [stats]);
  const overallRating = useMemo(() => {
    const totalRating = stats.reduce((sum, stat) => sum + stat.averageRating * stat.count, 0);
    const totalCount = stats.reduce(
      (sum, stat) => sum + (stat.averageRating > 0 ? stat.count : 0),
      0
    );
    return totalCount > 0 ? totalRating / totalCount : 0;
  }, [stats]);

  if (stats.length === 0) {
    return null;
  }

  return (
    <div className={cn('space-y-4', className)}>
      {/* Statistiques globales */}
      <Card className="bg-slate-800/80 backdrop-blur-sm border-slate-600">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold text-white flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Vue d'ensemble du catalogue
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
            <div className="p-4 bg-slate-700/50 rounded-lg border border-slate-600">
              <div className="text-sm text-slate-400 mb-1">Total produits</div>
              <div className="text-2xl font-bold text-white">{totalProducts}</div>
            </div>
            <div className="p-4 bg-slate-700/50 rounded-lg border border-slate-600">
              <div className="text-sm text-slate-400 mb-1 flex items-center gap-1">
                <ShoppingCart className="h-4 w-4" />
                Total ventes
              </div>
              <div className="text-2xl font-bold text-white">{totalSales.toLocaleString()}</div>
            </div>
            <div className="p-4 bg-slate-700/50 rounded-lg border border-slate-600">
              <div className="text-sm text-slate-400 mb-1 flex items-center gap-1">
                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                Note moyenne
              </div>
              <div className="text-2xl font-bold text-white">
                {overallRating > 0 ? overallRating.toFixed(1) : '—'}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Statistiques par type */}
      <Card className="bg-slate-800/80 backdrop-blur-sm border-slate-600">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold text-white flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Statistiques par type
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {stats.map(stat => {
              const Icon = stat.icon;
              const percentage = totalProducts > 0 ? (stat.count / totalProducts) * 100 : 0;
              return (
                <div
                  key={stat.type}
                  className="flex flex-col items-center p-4 bg-slate-700/50 rounded-lg border border-slate-600 hover:bg-slate-700 transition-colors cursor-pointer"
                  onClick={() => {
                    // Navigation vers le filtre du type
                    const url = new URL(window.location.href);
                    url.searchParams.set('productType', stat.type);
                    window.location.href = url.toString();
                  }}
                >
                  <div
                    className={cn(
                      'w-12 h-12 rounded-full flex items-center justify-center mb-3',
                      stat.color
                    )}
                  >
                    <Icon className="h-6 w-6 text-white" />
                  </div>
                  <div className="text-center w-full">
                    <div className="text-2xl font-bold text-white mb-1">{stat.count}</div>
                    <div className="text-xs text-slate-300 mb-2">{stat.label}</div>
                    {/* Barre de progression */}
                    <div className="w-full bg-slate-600 rounded-full h-2 mb-2">
                      <div
                        className={cn('h-2 rounded-full transition-all', stat.color)}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <div className="text-xs text-slate-400 mb-2">
                      {percentage.toFixed(1)}% du total
                    </div>
                    <div className="flex items-center justify-center gap-2 text-xs flex-wrap">
                      {stat.totalSales > 0 && (
                        <Badge variant="secondary" className="bg-slate-600 text-slate-200">
                          <ShoppingCart className="h-3 w-3 mr-1" />
                          {stat.totalSales.toLocaleString()}
                        </Badge>
                      )}
                      {stat.averageRating > 0 && (
                        <Badge variant="secondary" className="bg-slate-600 text-slate-200">
                          <Star className="h-3 w-3 mr-1 fill-yellow-400 text-yellow-400" />
                          {stat.averageRating.toFixed(1)}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}






