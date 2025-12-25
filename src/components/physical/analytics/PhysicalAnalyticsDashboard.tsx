/**
 * Dashboard Analytics Produits Physiques
 * Date: 28 Janvier 2025
 * Design responsive avec le même style que Mes Templates
 */

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Package,
  Warehouse,
  MapPin,
  RefreshCw,
  Calendar as CalendarIcon,
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useStorePhysicalAnalytics, useStoreWarehousePerformance, useGeographicSalesPerformance } from '@/hooks/physical/usePhysicalAnalytics';
import { SalesOverview } from './SalesOverview';
import { WarehousePerformanceChart } from './WarehousePerformanceChart';
import { GeographicHeatmap } from './GeographicHeatmap';
import { StockRotationTable } from './StockRotationTable';
import { cn } from '@/lib/utils';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';

interface PhysicalAnalyticsDashboardProps {
  storeId: string;
}

export function PhysicalAnalyticsDashboard({ storeId }: PhysicalAnalyticsDashboardProps) {
  const [periodType, setPeriodType] = useState<'daily' | 'weekly' | 'monthly' | 'yearly'>('monthly');
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date }>({
    from: new Date(new Date().setMonth(new Date().getMonth() - 1)),
    to: new Date(),
  });

  const { data: analytics, isLoading: analyticsLoading } = useStorePhysicalAnalytics(storeId, {
    periodType,
    startDate: format(dateRange.from, 'yyyy-MM-dd'),
    endDate: format(dateRange.to, 'yyyy-MM-dd'),
  });

  const { data: warehousePerformance, isLoading: warehouseLoading } = useStoreWarehousePerformance(storeId, {
    periodType,
    startDate: format(dateRange.from, 'yyyy-MM-dd'),
    endDate: format(dateRange.to, 'yyyy-MM-dd'),
  });

  const { data: geographicSales, isLoading: geographicLoading } = useGeographicSalesPerformance(storeId, {
    periodType,
    startDate: format(dateRange.from, 'yyyy-MM-dd'),
    endDate: format(dateRange.to, 'yyyy-MM-dd'),
  });

  // Refs for animations
  const statsRef = useScrollAnimation<HTMLDivElement>();
  const tabsRef = useScrollAnimation<HTMLDivElement>();

  if (analyticsLoading || warehouseLoading || geographicLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  const stats = analytics || {
    total_revenue: 0,
    total_units_sold: 0,
    total_products: 0,
    average_order_value: 0,
    total_gross_profit: 0,
    total_net_profit: 0,
    average_gross_margin: 0,
    average_net_margin: 0,
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header with filters - Responsive */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4 animate-in fade-in slide-in-from-top-4 duration-700">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight">Analytics Produits Physiques</h2>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Analysez les performances de vos produits physiques
          </p>
        </div>
        <div className="flex flex-wrap gap-2 w-full sm:w-auto">
          <Select value={periodType} onValueChange={(value: any) => setPeriodType(value)}>
            <SelectTrigger className="w-full sm:w-[140px] h-9 sm:h-10 text-xs sm:text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="daily">Quotidien</SelectItem>
              <SelectItem value="weekly">Hebdomadaire</SelectItem>
              <SelectItem value="monthly">Mensuel</SelectItem>
              <SelectItem value="yearly">Annuel</SelectItem>
            </SelectContent>
          </Select>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className={cn('w-full sm:w-[240px] justify-start text-left font-normal h-9 sm:h-10 text-xs sm:text-sm')}>
                <CalendarIcon className="mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4" />
                {dateRange.from && dateRange.to ? (
                  `${format(dateRange.from, 'dd MMM', { locale: fr })} - ${format(dateRange.to, 'dd MMM', { locale: fr })}`
                ) : (
                  <span>Sélectionner une période</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                initialFocus
                mode="range"
                defaultMonth={dateRange.from}
                selected={{ from: dateRange.from, to: dateRange.to }}
                onSelect={(range: any) => {
                  if (range?.from && range?.to) {
                    setDateRange({ from: range.from, to: range.to });
                  }
                }}
                numberOfMonths={2}
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* Key Metrics Cards - Responsive */}
      <div 
        ref={statsRef}
        className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 animate-in fade-in slide-in-from-bottom-4 duration-700"
      >
        {[
          { 
            label: 'Revenus Total', 
            value: stats.total_revenue, 
            subtitle: `${stats.total_units_sold} unités vendues`,
            icon: DollarSign, 
            color: 'from-purple-600 to-pink-600',
            isCurrency: true
          },
          { 
            label: 'Profit Brut', 
            value: stats.total_gross_profit, 
            subtitle: `Marge: ${stats.average_gross_margin.toFixed(1)}%`,
            icon: TrendingUp, 
            color: 'from-green-600 to-emerald-600',
            isCurrency: true
          },
          { 
            label: 'Profit Net', 
            value: stats.total_net_profit, 
            subtitle: `Marge: ${stats.average_net_margin.toFixed(1)}%`,
            icon: TrendingDown, 
            color: 'from-blue-600 to-cyan-600',
            isCurrency: true
          },
          { 
            label: 'Panier Moyen', 
            value: stats.average_order_value, 
            subtitle: `${stats.total_products} produits actifs`,
            icon: Package, 
            color: 'from-orange-600 to-red-600',
            isCurrency: true
          },
        ].map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card
              key={stat.label}
              className="border-border/50 bg-card/50 backdrop-blur-sm hover:shadow-lg transition-all duration-300 hover:scale-[1.02] animate-in fade-in slide-in-from-bottom-4"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <CardHeader className="pb-2 sm:pb-3 p-3 sm:p-4">
                <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground flex items-center justify-between">
                  <span>{stat.label}</span>
                  <Icon className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground" />
                </CardTitle>
              </CardHeader>
              <CardContent className="p-3 sm:p-4 pt-0">
                <div className={`text-lg sm:text-xl lg:text-2xl font-bold bg-gradient-to-r ${stat.color} bg-clip-text text-transparent mb-1`}>
                  {stat.isCurrency ? (
                    new Intl.NumberFormat('fr-FR', {
                      style: 'currency',
                      currency: 'XOF',
                      minimumFractionDigits: 0,
                    }).format(stat.value)
                  ) : (
                    stat.value
                  )}
                </div>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  {stat.subtitle}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Main Analytics Tabs - Responsive */}
      <div ref={tabsRef} className="animate-in fade-in slide-in-from-bottom-4 duration-700">
        <Tabs defaultValue="sales" className="space-y-4 sm:space-y-6">
          <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 h-auto p-1 bg-muted/50 backdrop-blur-sm">
            <TabsTrigger 
              value="sales"
              className="text-xs sm:text-sm px-2 sm:px-4 py-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-pink-600 data-[state=active]:text-white transition-all duration-300"
            >
              <BarChart3 className="mr-1.5 sm:mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4" />
              <span className="hidden xs:inline">Ventes</span>
              <span className="xs:hidden">Ventes</span>
            </TabsTrigger>
            <TabsTrigger 
              value="warehouses"
              className="text-xs sm:text-sm px-2 sm:px-4 py-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-pink-600 data-[state=active]:text-white transition-all duration-300"
            >
              <Warehouse className="mr-1.5 sm:mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4" />
              <span className="hidden xs:inline">Entrepôts</span>
              <span className="xs:hidden">Entrep.</span>
            </TabsTrigger>
            <TabsTrigger 
              value="geographic"
              className="text-xs sm:text-sm px-2 sm:px-4 py-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-pink-600 data-[state=active]:text-white transition-all duration-300"
            >
              <MapPin className="mr-1.5 sm:mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4" />
              <span className="hidden xs:inline">Géographique</span>
              <span className="xs:hidden">Géo.</span>
            </TabsTrigger>
            <TabsTrigger 
              value="rotation"
              className="text-xs sm:text-sm px-2 sm:px-4 py-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-pink-600 data-[state=active]:text-white transition-all duration-300"
            >
              <RefreshCw className="mr-1.5 sm:mr-2 h-3.5 w-3.5 sm:h-4 sm:w-4" />
              <span className="hidden xs:inline">Rotation Stocks</span>
              <span className="xs:hidden">Rotation</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="sales" className="space-y-4 sm:space-y-6 mt-4 sm:mt-6">
            <SalesOverview
              storeId={storeId}
              periodType={periodType}
              startDate={format(dateRange.from, 'yyyy-MM-dd')}
              endDate={format(dateRange.to, 'yyyy-MM-dd')}
            />
          </TabsContent>

          <TabsContent value="warehouses" className="space-y-4 sm:space-y-6 mt-4 sm:mt-6">
            <WarehousePerformanceChart
              warehousePerformance={warehousePerformance || []}
              periodType={periodType}
            />
          </TabsContent>

          <TabsContent value="geographic" className="space-y-4 sm:space-y-6 mt-4 sm:mt-6">
            <GeographicHeatmap
              geographicSales={geographicSales || []}
            />
          </TabsContent>

          <TabsContent value="rotation" className="space-y-4 sm:space-y-6 mt-4 sm:mt-6">
            <StockRotationTable
              storeId={storeId}
              startDate={format(dateRange.from, 'yyyy-MM-dd')}
              endDate={format(dateRange.to, 'yyyy-MM-dd')}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
