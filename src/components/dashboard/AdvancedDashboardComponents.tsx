import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  TrendingUp, 
  TrendingDown, 
  Eye, 
  ShoppingCart, 
  Star,
  Calendar,
  Clock,
  User,
  Package,
  DollarSign,
  Activity,
  Target,
  Zap
} from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from "recharts";
import { useMemo } from "react";

interface AdvancedStatsCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon: React.ComponentType<any>;
  trend?: {
    value: number;
    label: string;
    period: string;
  };
  color?: string;
  className?: string;
}

export const AdvancedStatsCard = ({ 
  title, 
  value, 
  description, 
  icon: Icon, 
  trend, 
  color = "primary",
  className 
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
    if (!trend) return "default";
    return trend.value >= 0 ? "default" : "destructive";
  };

  return (
    <Card className={`shadow-soft hover:shadow-medium transition-smooth hover-scale group ${className}`}>
      <CardHeader className="flex flex-row items-center justify-between pb-2 p-4">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <div className={`p-2 rounded-lg bg-${color}/10 group-hover:bg-${color}/20 transition-colors`}>
          <Icon className={`h-4 w-4 text-${color}`} />
        </div>
      </CardHeader>
      <CardContent className="p-4 pt-0">
        <div className="text-2xl font-bold mb-1">{value}</div>
        {description && (
          <p className="text-xs text-muted-foreground mb-2">{description}</p>
        )}
        {trend && (
          <div className="flex items-center gap-2">
            <Badge variant={getTrendColor()} className="text-xs">
              <div className="flex items-center gap-1">
                {getTrendIcon()}
                <span>{trend.value >= 0 ? "+" : ""}{trend.value}%</span>
              </div>
            </Badge>
            <span className="text-xs text-muted-foreground">{trend.label}</span>
            <span className="text-xs text-muted-foreground">({trend.period})</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

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
      customers: Math.round(item.customers)
    }));
  }, [data]);

  return (
    <Card className="shadow-soft">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-primary" />
          Évolution des Revenus
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis 
                dataKey="month" 
                className="text-xs"
                tick={{ fontSize: 12 }}
              />
              <YAxis 
                className="text-xs"
                tick={{ fontSize: 12 }}
                tickFormatter={(value) => `${value.toLocaleString()} FCFA`}
              />
              <Tooltip 
                formatter={(value: any, name: string) => [
                  name === 'revenue' ? `${value.toLocaleString()} FCFA` : value,
                  name === 'revenue' ? 'Revenus' : name === 'orders' ? 'Commandes' : 'Clients'
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
            </LineChart>
          </ResponsiveContainer>
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
    <Card className="shadow-soft">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2">
          <ShoppingCart className="h-5 w-5 text-primary" />
          Répartition des Commandes
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ status, percentage }) => `${status} (${percentage}%)`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="count"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-2">
          {data.map((item, index) => (
            <div key={item.status} className="flex items-center gap-2">
              <div 
                className="w-3 h-3 rounded-full" 
                style={{ backgroundColor: COLORS[index % COLORS.length] }}
              />
              <span className="text-xs text-muted-foreground">{item.status}</span>
              <span className="text-xs font-medium">{item.count}</span>
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
      case 'order': return <ShoppingCart className="h-4 w-4" />;
      case 'product': return <Package className="h-4 w-4" />;
      case 'customer': return <User className="h-4 w-4" />;
      case 'payment': return <DollarSign className="h-4 w-4" />;
      default: return <Activity className="h-4 w-4" />;
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'order': return 'text-blue-500';
      case 'product': return 'text-green-500';
      case 'customer': return 'text-purple-500';
      case 'payment': return 'text-yellow-500';
      default: return 'text-gray-500';
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
          {activities.map((activity) => (
            <div key={activity.id} className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors">
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

export const PerformanceMetrics = ({ metrics }: PerformanceMetricsProps) => {
  const metricsData = [
    {
      title: "Taux de Conversion",
      value: `${metrics.conversionRate}%`,
      description: "Visiteurs qui achètent",
      icon: Target,
      color: "green",
      trend: { value: 12, label: "vs mois dernier", period: "30j" }
    },
    {
      title: "Panier Moyen",
      value: `${metrics.averageOrderValue.toLocaleString()} FCFA`,
      description: "Valeur moyenne par commande",
      icon: DollarSign,
      color: "blue",
      trend: { value: 8, label: "vs mois dernier", period: "30j" }
    },
    {
      title: "Rétention Client",
      value: `${metrics.customerRetention}%`,
      description: "Clients qui reviennent",
      icon: User,
      color: "purple",
      trend: { value: 15, label: "vs mois dernier", period: "30j" }
    },
    {
      title: "Pages Vues",
      value: metrics.pageViews.toLocaleString(),
      description: "Visites totales",
      icon: Eye,
      color: "orange",
      trend: { value: 23, label: "vs mois dernier", period: "30j" }
    },
    {
      title: "Taux de Rebond",
      value: `${metrics.bounceRate}%`,
      description: "Visiteurs qui partent rapidement",
      icon: TrendingDown,
      color: "red",
      trend: { value: -5, label: "vs mois dernier", period: "30j" }
    },
    {
      title: "Durée Session",
      value: `${Math.round(metrics.sessionDuration / 60)}min`,
      description: "Temps moyen sur le site",
      icon: Clock,
      color: "indigo",
      trend: { value: 18, label: "vs mois dernier", period: "30j" }
    }
  ];

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
