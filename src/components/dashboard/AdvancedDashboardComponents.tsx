import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  TrendingUp,
  TrendingDown,
  Eye,
  ShoppingCart,
  Clock,
  User,
  Package,
  DollarSign,
  Activity,
  Target,
} from '@/components/icons';
import {
  LazyLineChart,
  LazyPieChart,
  LazyBarChart,
  LazyResponsiveContainer,
  Line,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Pie,
  Cell,
} from '@/components/charts/LazyCharts';
import React, { useMemo } from 'react';

interface AdvancedStatsCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  trend?: {
    value: number;
    label: string;
    period: string;
  };
  color?: string;
  className?: string;
}

const AdvancedStatsCardComponent = ({
  title,
  value,
  description,
  icon: Icon,
  trend,
  color = 'primary',
  className,
}: AdvancedStatsCardProps) => {
  const getTrendIcon = () => {
    if (!trend) return null;
    return trend.value >= 0 ? (
      <TrendingUp className="h-3 w-3 text-green-500" />
    ) : (
      <TrendingDown className="h-3 w-3 text-red-500" />
    );
  };

  const getTrendColor = () => {
    if (!trend) return 'default';
    return trend.value >= 0 ? 'default' : 'destructive';
  };

  return (
    <Card
      className={`border-border/50 bg-card/50 backdrop-blur-sm shadow-soft hover:shadow-medium transition-smooth hover-scale group ${className}`}
    >
      <CardHeader className="flex flex-row items-center justify-between pb-1.5 sm:pb-2 md:pb-3 p-2.5 sm:p-3 md:p-4">
        <CardTitle className="text-[10px] sm:text-xs md:text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <div
          className={`p-1.5 sm:p-2 rounded-lg bg-${color}/10 group-hover:bg-${color}/20 transition-colors`}
        >
          <Icon className={`h-3 w-3 sm:h-3.5 sm:w-3.5 md:h-4 md:w-4 text-${color}`} />
        </div>
      </CardHeader>
      <CardContent className="p-3 sm:p-4 md:p-6 pt-0">
        <div className="text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl font-bold mb-1">
          {value}
        </div>
        {description && (
          <p className="text-[10px] sm:text-[11px] md:text-xs text-muted-foreground mb-1.5 sm:mb-2 leading-tight">
            {description}
          </p>
        )}
        {trend && (
          <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
            <Badge
              variant={getTrendColor()}
              className="text-[9px] sm:text-[10px] md:text-xs px-1.5 sm:px-2 py-0.5"
            >
              <div className="flex items-center gap-1">
                {getTrendIcon()}
                <span>
                  {trend.value >= 0 ? '+' : ''}
                  {trend.value}%
                </span>
              </div>
            </Badge>
            <span className="text-[9px] sm:text-[10px] md:text-xs text-muted-foreground">
              {trend.label}
            </span>
            <span className="text-[9px] sm:text-[10px] md:text-xs text-muted-foreground">
              ({trend.period})
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// Optimisation avec React.memo pour éviter les re-renders inutiles
export const AdvancedStatsCard = React.memo(AdvancedStatsCardComponent, (prevProps, nextProps) => {
  return (
    prevProps.title === nextProps.title &&
    prevProps.value === nextProps.value &&
    prevProps.description === nextProps.description &&
    prevProps.trend?.value === nextProps.trend?.value &&
    prevProps.trend?.label === nextProps.trend?.label &&
    prevProps.trend?.period === nextProps.trend?.period &&
    prevProps.color === nextProps.color &&
    prevProps.className === nextProps.className
  );
});

AdvancedStatsCard.displayName = 'AdvancedStatsCard';

interface RevenueChartProps {
  data: Array<{
    month: string;
    revenue: number;
    orders: number;
    customers: number;
  }>;
}

export const RevenueChart = ({ data }: RevenueChartProps) => {
  const chartData = useMemo(() => {
    return data.map(item => ({
      ...item,
      revenue: Math.round(item.revenue),
      orders: Math.round(item.orders),
      customers: Math.round(item.customers),
    }));
  }, [data]);

  return (
    <Card className="border-border/50 bg-card/50 backdrop-blur-sm shadow-soft">
      <CardHeader className="pb-2 sm:pb-3 p-3 sm:p-4 md:p-6">
        <CardTitle className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm md:text-base lg:text-lg">
          <div className="p-1.5 sm:p-2 rounded-lg bg-gradient-to-br from-blue-500/10 to-cyan-500/5 backdrop-blur-sm border border-blue-500/20">
            <TrendingUp className="h-3.5 w-3.5 sm:h-4 sm:w-4 md:h-5 md:w-5 text-primary" />
          </div>
          Évolution des Revenus
        </CardTitle>
      </CardHeader>
      <CardContent className="p-3 sm:p-4 md:p-6 pt-0">
        <div className="h-80">
          <LazyResponsiveContainer width="100%" height="100%">
            <LazyLineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis dataKey="month" className="text-xs" tick={{ fontSize: 12 }} />
              <YAxis
                className="text-xs"
                tick={{ fontSize: 12 }}
                tickFormatter={value => `${value.toLocaleString()} FCFA`}
              />
              <Tooltip
                formatter={(value: unknown, name: string) => [
                  name === 'revenue' ? `${Number(value).toLocaleString()} FCFA` : value,
                  name === 'revenue' ? 'Revenus' : name === 'orders' ? 'Commandes' : 'Clients',
                ]}
                labelStyle={{ fontSize: 12 }}
                contentStyle={{ fontSize: 12 }}
              />
              <Line
                type="monotone"
                dataKey="revenue"
                stroke="#3b82f6"
                strokeWidth={3}
                dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, stroke: '#3b82f6', strokeWidth: 2 }}
              />
            </LazyLineChart>
          </LazyResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

interface OrdersChartProps {
  data: Array<{
    status: string;
    count: number;
    percentage: number;
  }>;
}

export const OrdersChart = ({ data }: OrdersChartProps) => {
  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444'];

  return (
    <Card className="border-border/50 bg-card/50 backdrop-blur-sm shadow-soft">
      <CardHeader className="pb-2 sm:pb-3 p-3 sm:p-4 md:p-6">
        <CardTitle className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm md:text-base lg:text-lg">
          <div className="p-1.5 sm:p-2 rounded-lg bg-gradient-to-br from-green-500/10 to-emerald-500/5 backdrop-blur-sm border border-green-500/20">
            <ShoppingCart className="h-3.5 w-3.5 sm:h-4 sm:w-4 md:h-5 md:w-5 text-primary" />
          </div>
          Répartition des Commandes
        </CardTitle>
      </CardHeader>
      <CardContent className="p-3 sm:p-4 md:p-6 pt-0">
        <div className="h-80">
          <LazyResponsiveContainer width="100%" height="100%">
            <LazyPieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ status, percentage }: { status: string; percentage: number }) =>
                  `${status} (${percentage}%)`
                }
                outerRadius={80}
                fill="#8884d8"
                dataKey="count"
              >
                {data.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </LazyPieChart>
          </LazyResponsiveContainer>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-2">
          {data.map((item, index) => (
            <div key={item.status} className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: COLORS[index % COLORS.length] }}
              />
              <span className="text-[10px] sm:text-[11px] md:text-xs text-muted-foreground">
                {item.status}
              </span>
              <span className="text-[10px] sm:text-[11px] md:text-xs font-medium">
                {item.count}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

interface ActivityFeedProps {
  activities: Array<{
    id: string;
    type: 'order' | 'product' | 'customer' | 'payment';
    message: string;
    timestamp: string;
    status?: string;
  }>;
}

export const ActivityFeed = ({ activities }: ActivityFeedProps) => {
  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'order':
        return <ShoppingCart className="h-4 w-4" />;
      case 'product':
        return <Package className="h-4 w-4" />;
      case 'customer':
        return <User className="h-4 w-4" />;
      case 'payment':
        return <DollarSign className="h-4 w-4" />;
      default:
        return <Activity className="h-4 w-4" />;
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'order':
        return 'text-blue-500';
      case 'product':
        return 'text-green-500';
      case 'customer':
        return 'text-purple-500';
      case 'payment':
        return 'text-yellow-500';
      default:
        return 'text-gray-500';
    }
  };

  return (
    <Card className="shadow-soft">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5 text-primary" />
          Activité Récente
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activities.map(activity => (
            <div
              key={activity.id}
              className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors"
            >
              <div className={`p-2 rounded-full bg-muted ${getActivityColor(activity.type)}`}>
                {getActivityIcon(activity.type)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">{activity.message}</p>
                <div className="flex items-center gap-2 mt-1">
                  <Clock className="h-3 w-3 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">
                    {new Date(activity.timestamp).toLocaleString('fr-FR')}
                  </span>
                  {activity.status && (
                    <Badge variant="outline" className="text-xs">
                      {activity.status}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

interface PerformanceMetricsProps {
  metrics: {
    conversionRate: number;
    averageOrderValue: number;
    customerRetention: number;
    pageViews: number;
    bounceRate: number;
    sessionDuration: number;
  };
}

const PerformanceMetricsComponent = ({ metrics }: PerformanceMetricsProps) => {
  const metricsData = useMemo(
    () => [
      {
        title: 'Taux de Conversion',
        value: `${metrics.conversionRate}%`,
        description: 'Visiteurs qui achètent',
        icon: Target,
        color: 'green',
        trend: { value: 12, label: 'vs mois dernier', period: '30j' },
      },
      {
        title: 'Panier Moyen',
        value: `${metrics.averageOrderValue.toLocaleString()} FCFA`,
        description: 'Valeur moyenne par commande',
        icon: DollarSign,
        color: 'blue',
        trend: { value: 8, label: 'vs mois dernier', period: '30j' },
      },
      {
        title: 'Rétention Client',
        value: `${metrics.customerRetention}%`,
        description: 'Clients qui reviennent',
        icon: User,
        color: 'purple',
        trend: { value: 15, label: 'vs mois dernier', period: '30j' },
      },
      {
        title: 'Pages Vues',
        value: metrics.pageViews.toLocaleString(),
        description: 'Visites totales',
        icon: Eye,
        color: 'orange',
        trend: { value: 23, label: 'vs mois dernier', period: '30j' },
      },
      {
        title: 'Taux de Rebond',
        value: `${metrics.bounceRate}%`,
        description: 'Visiteurs qui partent rapidement',
        icon: TrendingDown,
        color: 'red',
        trend: { value: -5, label: 'vs mois dernier', period: '30j' },
      },
      {
        title: 'Durée Session',
        value: `${Math.round(metrics.sessionDuration / 60)}min`,
        description: 'Temps moyen sur le site',
        icon: Clock,
        color: 'indigo',
        trend: { value: 18, label: 'vs mois dernier', period: '30j' },
      },
    ],
    [metrics]
  );

  return (
    <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
      {metricsData.map((metric, index) => (
        <AdvancedStatsCard
          key={index}
          title={metric.title}
          value={metric.value}
          description={metric.description}
          icon={metric.icon}
          trend={metric.trend}
          color={metric.color}
        />
      ))}
    </div>
  );
};

// Optimisation avec React.memo
export const PerformanceMetrics = React.memo(
  PerformanceMetricsComponent,
  (prevProps, nextProps) => {
    return (
      prevProps.metrics.conversionRate === nextProps.metrics.conversionRate &&
      prevProps.metrics.averageOrderValue === nextProps.metrics.averageOrderValue &&
      prevProps.metrics.customerRetention === nextProps.metrics.customerRetention &&
      prevProps.metrics.pageViews === nextProps.metrics.pageViews &&
      prevProps.metrics.bounceRate === nextProps.metrics.bounceRate &&
      prevProps.metrics.sessionDuration === nextProps.metrics.sessionDuration
    );
  }
);

PerformanceMetrics.displayName = 'PerformanceMetrics';

// Graphique d'évolution des commandes dans le temps
interface OrdersTrendChartProps {
  data: Array<{
    month: string;
    orders: number;
    revenue: number;
  }>;
}

export const OrdersTrendChart = ({ data }: OrdersTrendChartProps) => {
  const chartData = useMemo(() => {
    return data.map(item => ({
      ...item,
      orders: Math.round(item.orders),
      revenue: Math.round(item.revenue),
    }));
  }, [data]);

  return (
    <Card className="border-border/50 bg-card/50 backdrop-blur-sm shadow-soft">
      <CardHeader className="pb-2 sm:pb-3 p-3 sm:p-4 md:p-6">
        <CardTitle className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm md:text-base lg:text-lg">
          <div className="p-1.5 sm:p-2 rounded-lg bg-gradient-to-br from-green-500/10 to-emerald-500/5 backdrop-blur-sm border border-green-500/20">
            <ShoppingCart className="h-3.5 w-3.5 sm:h-4 sm:w-4 md:h-5 md:w-5 text-primary" />
          </div>
          Évolution des Commandes
        </CardTitle>
      </CardHeader>
      <CardContent className="p-3 sm:p-4 md:p-6 pt-0">
        <div className="h-80">
          <LazyResponsiveContainer width="100%" height="100%">
            <LazyLineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis dataKey="month" className="text-xs" tick={{ fontSize: 12 }} />
              <YAxis className="text-xs" tick={{ fontSize: 12 }} />
              <Tooltip
                formatter={(value: unknown) => [value, 'Commandes']}
                labelStyle={{ fontSize: 12 }}
                contentStyle={{ fontSize: 12 }}
              />
              <Line
                type="monotone"
                dataKey="orders"
                stroke="#10b981"
                strokeWidth={3}
                dot={{ fill: '#10b981', strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, stroke: '#10b981', strokeWidth: 2 }}
              />
            </LazyLineChart>
          </LazyResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

// Graphique comparatif revenus vs commandes
interface RevenueVsOrdersChartProps {
  data: Array<{
    month: string;
    revenue: number;
    orders: number;
  }>;
}

export const RevenueVsOrdersChart = ({ data }: RevenueVsOrdersChartProps) => {
  const chartData = useMemo(() => {
    return data.map(item => ({
      ...item,
      revenue: Math.round(item.revenue),
      orders: Math.round(item.orders),
    }));
  }, [data]);

  return (
    <Card className="border-border/50 bg-card/50 backdrop-blur-sm shadow-soft">
      <CardHeader className="pb-2 sm:pb-3 p-3 sm:p-4 md:p-6">
        <CardTitle className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm md:text-base lg:text-lg">
          <div className="p-1.5 sm:p-2 rounded-lg bg-gradient-to-br from-purple-500/10 to-pink-500/5 backdrop-blur-sm border border-purple-500/20">
            <TrendingUp className="h-3.5 w-3.5 sm:h-4 sm:w-4 md:h-5 md:w-5 text-primary" />
          </div>
          Revenus vs Commandes
        </CardTitle>
      </CardHeader>
      <CardContent className="p-3 sm:p-4 md:p-6 pt-0">
        <div className="h-80">
          <LazyResponsiveContainer width="100%" height="100%">
            <LazyBarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis dataKey="month" className="text-xs" tick={{ fontSize: 12 }} />
              <YAxis
                yAxisId="left"
                className="text-xs"
                tick={{ fontSize: 12 }}
                tickFormatter={value => `${(value / 1000).toFixed(0)}k FCFA`}
              />
              <YAxis
                yAxisId="right"
                orientation="right"
                className="text-xs"
                tick={{ fontSize: 12 }}
              />
              <Tooltip
                formatter={(value: unknown, name: string) => [
                  name === 'revenue'
                    ? `${Number(value).toLocaleString()} FCFA`
                    : `${value} commandes`,
                  name === 'revenue' ? 'Revenus' : 'Commandes',
                ]}
                labelStyle={{ fontSize: 12 }}
                contentStyle={{ fontSize: 12 }}
              />
              <Legend />
              <Bar yAxisId="left" dataKey="revenue" fill="#3b82f6" name="Revenus (FCFA)" />
              <Bar yAxisId="right" dataKey="orders" fill="#10b981" name="Commandes" />
            </LazyBarChart>
          </LazyResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

// Graphique de tendance des clients
interface CustomersTrendChartProps {
  data: Array<{
    month: string;
    customers: number;
  }>;
}

export const CustomersTrendChart = ({ data }: CustomersTrendChartProps) => {
  const chartData = useMemo(() => {
    return data.map(item => ({
      ...item,
      customers: Math.round(item.customers),
    }));
  }, [data]);

  return (
    <Card className="border-border/50 bg-card/50 backdrop-blur-sm shadow-soft">
      <CardHeader className="pb-2 sm:pb-3 p-3 sm:p-4 md:p-6">
        <CardTitle className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm md:text-base lg:text-lg">
          <div className="p-1.5 sm:p-2 rounded-lg bg-gradient-to-br from-purple-500/10 to-pink-500/5 backdrop-blur-sm border border-purple-500/20">
            <User className="h-3.5 w-3.5 sm:h-4 sm:w-4 md:h-5 md:w-5 text-primary" />
          </div>
          Évolution des Clients
        </CardTitle>
      </CardHeader>
      <CardContent className="p-3 sm:p-4 md:p-6 pt-0">
        <div className="h-80">
          <LazyResponsiveContainer width="100%" height="100%">
            <LazyLineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis dataKey="month" className="text-xs" tick={{ fontSize: 12 }} />
              <YAxis className="text-xs" tick={{ fontSize: 12 }} />
              <Tooltip
                formatter={(value: unknown) => [`${value} clients`, 'Clients']}
                labelStyle={{ fontSize: 12 }}
                contentStyle={{ fontSize: 12 }}
              />
              <Line
                type="monotone"
                dataKey="customers"
                stroke="#8b5cf6"
                strokeWidth={3}
                dot={{ fill: '#8b5cf6', strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, stroke: '#8b5cf6', strokeWidth: 2 }}
              />
            </LazyLineChart>
          </LazyResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};






