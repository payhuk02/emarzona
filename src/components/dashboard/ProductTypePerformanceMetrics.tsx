import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Target, TrendingUp, DollarSign, Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  PRODUCT_TYPE_CONFIG,
  getAllProductTypes,
  type ProductType,
} from '@/constants/product-types';

interface ProductTypePerformanceMetricsProps {
  performanceMetricsByType: {
    digital: {
      conversionRate: number;
      averageOrderValue: number;
      customerRetention: number;
    };
    physical: {
      conversionRate: number;
      averageOrderValue: number;
      customerRetention: number;
    };
    service: {
      conversionRate: number;
      averageOrderValue: number;
      customerRetention: number;
    };
    course: {
      conversionRate: number;
      averageOrderValue: number;
      customerRetention: number;
    };
    artist: {
      conversionRate: number;
      averageOrderValue: number;
      customerRetention: number;
    };
  };
  selectedType?: 'all' | ProductType;
  className?: string;
}

export const ProductTypePerformanceMetrics = React.memo<ProductTypePerformanceMetricsProps>(
  ({ performanceMetricsByType, selectedType = 'all', className }) => {
    const typesToShow =
      selectedType === 'all' ? getAllProductTypes() : [selectedType];

    return (
      <Card className={cn('border-border/50 bg-card/50 backdrop-blur-sm', className)}>
        <CardHeader className="pb-2 sm:pb-3 p-3 sm:p-4 md:p-6">
          <div className="flex items-center gap-1.5 sm:gap-2">
            <div className="p-1.5 sm:p-2 rounded-lg bg-gradient-to-br from-blue-500/10 to-cyan-500/5 backdrop-blur-sm border border-blue-500/20">
              <Target className="h-3.5 w-3.5 sm:h-4 sm:w-4 md:h-5 md:w-5 text-blue-500 dark:text-blue-400" />
            </div>
            <div>
              <CardTitle className="text-xs sm:text-sm md:text-base lg:text-lg">
                Métriques de Performance par Type
              </CardTitle>
              <CardDescription className="text-[10px] sm:text-[11px] md:text-xs text-muted-foreground">
                Analyse détaillée des performances par catégorie
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-3 sm:p-4 md:p-6 pt-0">
          <div className="grid gap-3 sm:gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {typesToShow.map(type => {
              const config = PRODUCT_TYPE_CONFIG[type];
              const Icon = config.icon;
              const metrics = performanceMetricsByType[type];

              return (
                <Card
                  key={type}
                  className="border-border/50 bg-card/50 backdrop-blur-sm hover:shadow-lg transition-all"
                >
                  <CardHeader className="pb-2 p-3 sm:p-4">
                    <div className="flex items-center gap-2">
                      <div
                        className={cn(
                          'p-2 rounded-lg',
                          config.bgColor,
                          config.textColor,
                          config.borderColor
                        )}
                      >
                        <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
                      </div>
                      <CardTitle className="text-[10px] sm:text-xs md:text-sm">
                        {config.label}
                      </CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="p-3 sm:p-4 pt-0 space-y-2 sm:space-y-3">
                    {/* Taux de conversion */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 sm:gap-2">
                        <TrendingUp className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-muted-foreground" />
                        <span className="text-[9px] sm:text-[10px] md:text-xs text-muted-foreground">
                          Taux conversion
                        </span>
                      </div>
                      <Badge variant="outline" className="text-[9px] sm:text-[10px] md:text-xs">
                        {metrics.conversionRate}%
                      </Badge>
                    </div>

                    {/* Valeur moyenne commande */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 sm:gap-2">
                        <DollarSign className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-muted-foreground" />
                        <span className="text-[9px] sm:text-[10px] md:text-xs text-muted-foreground">
                          Panier moyen
                        </span>
                      </div>
                      <Badge variant="outline" className="text-[9px] sm:text-[10px] md:text-xs">
                        {Math.round(metrics.averageOrderValue).toLocaleString()} FCFA
                      </Badge>
                    </div>

                    {/* Rétention client */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 sm:gap-2">
                        <Users className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-muted-foreground" />
                        <span className="text-[9px] sm:text-[10px] md:text-xs text-muted-foreground">
                          Rétention
                        </span>
                      </div>
                      <Badge variant="outline" className="text-[9px] sm:text-[10px] md:text-xs">
                        {metrics.customerRetention}%
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </CardContent>
      </Card>
    );
  }
);

ProductTypePerformanceMetrics.displayName = 'ProductTypePerformanceMetrics';






