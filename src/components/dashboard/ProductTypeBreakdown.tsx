import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FileText, Package, Wrench, GraduationCap, Palette, PieChart } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ProductTypeBreakdownProps {
  productsByType: {
    digital: number;
    physical: number;
    service: number;
    course: number;
    artist: number;
  };
  revenueByType: {
    digital: number;
    physical: number;
    service: number;
    course: number;
    artist: number;
  };
  ordersByType: {
    digital: number;
    physical: number;
    service: number;
    course: number;
    artist: number;
  };
  className?: string;
}

const TYPE_CONFIG = {
  digital: {
    label: 'Digitaux',
    icon: FileText,
    color: 'bg-blue-500',
    textColor: 'text-blue-600 dark:text-blue-400',
    bgColor: 'bg-blue-500/10',
  },
  physical: {
    label: 'Physiques',
    icon: Package,
    color: 'bg-green-500',
    textColor: 'text-green-600 dark:text-green-400',
    bgColor: 'bg-green-500/10',
  },
  service: {
    label: 'Services',
    icon: Wrench,
    color: 'bg-purple-500',
    textColor: 'text-purple-600 dark:text-purple-400',
    bgColor: 'bg-purple-500/10',
  },
  course: {
    label: 'Cours',
    icon: GraduationCap,
    color: 'bg-orange-500',
    textColor: 'text-orange-600 dark:text-orange-400',
    bgColor: 'bg-orange-500/10',
  },
  artist: {
    label: 'Artistes',
    icon: Palette,
    color: 'bg-pink-500',
    textColor: 'text-pink-600 dark:text-pink-400',
    bgColor: 'bg-pink-500/10',
  },
} as const;

export const ProductTypeBreakdown = React.memo<ProductTypeBreakdownProps>(
  ({ productsByType, revenueByType, ordersByType, className }) => {
    const totalProducts = Object.values(productsByType).reduce((sum, count) => sum + count, 0);
    const totalRevenue = Object.values(revenueByType).reduce((sum, revenue) => sum + revenue, 0);
    const totalOrders = Object.values(ordersByType).reduce((sum, count) => sum + count, 0);

    const typeStats = (Object.keys(TYPE_CONFIG) as Array<keyof typeof TYPE_CONFIG>).map(type => {
      const config = TYPE_CONFIG[type];
      const products = productsByType[type];
      const revenue = revenueByType[type];
      const orders = ordersByType[type];

      return {
        type,
        ...config,
        products,
        revenue,
        orders,
        productsPercentage: totalProducts > 0 ? Math.round((products / totalProducts) * 100) : 0,
        revenuePercentage: totalRevenue > 0 ? Math.round((revenue / totalRevenue) * 100) : 0,
        ordersPercentage: totalOrders > 0 ? Math.round((orders / totalOrders) * 100) : 0,
      };
    });

    return (
      <Card className={cn('border-border/50 bg-card/50 backdrop-blur-sm', className)}>
        <CardHeader className="pb-2 sm:pb-3 p-3 sm:p-4 md:p-6">
          <div className="flex items-center gap-1.5 sm:gap-2">
            <div className="p-1.5 sm:p-2 rounded-lg bg-gradient-to-br from-blue-500/10 to-cyan-500/5 backdrop-blur-sm border border-blue-500/20">
              <PieChart className="h-3.5 w-3.5 sm:h-4 sm:w-4 md:h-5 md:w-5 text-blue-500 dark:text-blue-400" />
            </div>
            <div>
              <CardTitle className="text-xs sm:text-sm md:text-base lg:text-lg">
                Répartition par Type
              </CardTitle>
              <CardDescription className="text-[10px] sm:text-[11px] md:text-xs text-muted-foreground">
                Vue d'ensemble de vos produits par catégorie
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-3 sm:p-4 md:p-6 pt-0">
          <div className="space-y-3 sm:space-y-4">
            {typeStats.map(
              ({
                type,
                label,
                icon: Icon,
                textColor,
                bgColor,
                products,
                revenue,
                orders,
                productsPercentage,
                revenuePercentage,
                ordersPercentage,
              }) => (
                <div
                  key={type}
                  className="flex items-start gap-2 sm:gap-3 p-2 sm:p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                >
                  <div className={cn('p-1.5 sm:p-2 rounded-lg', bgColor)}>
                    <Icon className={cn('h-4 w-4 sm:h-5 sm:w-5', textColor)} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1 sm:mb-1.5">
                      <h4 className="text-[10px] sm:text-xs md:text-sm font-medium">{label}</h4>
                      <Badge variant="outline" className="text-[9px] sm:text-[10px] md:text-xs">
                        {productsPercentage}%
                      </Badge>
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-[9px] sm:text-[10px] md:text-xs text-muted-foreground">
                        <span>Produits:</span>
                        <span className="font-medium">{products}</span>
                      </div>
                      {revenue > 0 && (
                        <div className="flex items-center justify-between text-[9px] sm:text-[10px] md:text-xs text-muted-foreground">
                          <span>Revenus:</span>
                          <span className="font-medium">{revenue.toLocaleString()} FCFA</span>
                        </div>
                      )}
                      {orders > 0 && (
                        <div className="flex items-center justify-between text-[9px] sm:text-[10px] md:text-xs text-muted-foreground">
                          <span>Commandes:</span>
                          <span className="font-medium">{orders}</span>
                        </div>
                      )}
                    </div>
                    {/* Barre de progression */}
                    <div className="mt-2 h-1.5 sm:h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className={cn('h-full transition-all duration-500', bgColor)}
                        style={{ width: `${productsPercentage}%` }}
                      />
                    </div>
                  </div>
                </div>
              )
            )}
          </div>
        </CardContent>
      </Card>
    );
  }
);

ProductTypeBreakdown.displayName = 'ProductTypeBreakdown';






