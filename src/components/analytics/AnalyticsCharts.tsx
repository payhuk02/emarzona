import React, { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LineChart, Line, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { LineChart as LineChartIcon, AreaChart as AreaChartIcon, BarChart3, PieChart as PieChartIcon } from 'lucide-react';

interface ChartData {
  date: string;
  views: number;
  clicks: number;
  conversions: number;
  revenue: number;
}

interface AnalyticsChartProps {
  data: ChartData[];
  chartType: 'line' | 'area' | 'bar';
  onChartTypeChange: (type: 'line' | 'area' | 'bar') => void;
  period: '7d' | '30d' | '90d';
  onPeriodChange: (period: '7d' | '30d' | '90d') => void;
  title: string;
  description: string;
  loading?: boolean;
}

const COLORS = {
  views: '#3b82f6', // blue
  clicks: '#10b981', // green
  conversions: '#8b5cf6', // purple
  revenue: '#f59e0b' // orange
};

export const AnalyticsChart: React.FC<AnalyticsChartProps> = ({
  data,
  chartType,
  onChartTypeChange,
  period,
  onPeriodChange,
  title,
  description,
  loading = false
}) => {
  const chartData = useMemo(() => {
    if (!data || data.length === 0) return [];
    
    return data.map(item => ({
      ...item,
      date: new Date(item.date).toLocaleDateString('fr-FR', { 
        month: 'short', 
        day: 'numeric' 
      })
    }));
  }, [data]);

  const renderChart = () => {
    if (loading) {
      return (
        <div className="h-64 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      );
    }

    if (!chartData || chartData.length === 0) {
      return (
        <div className="h-64 flex items-center justify-center text-gray-400">
          <div className="text-center">
            <BarChart3 className="h-12 w-12 mx-auto mb-2" />
            <p>Aucune donnée disponible</p>
            <p className="text-sm">Les données apparaîtront après les premières interactions</p>
          </div>
        </div>
      );
    }

    const commonProps = {
      data: chartData,
      margin: { top: 5, right: 30, left: 20, bottom: 5 }
    };

    switch (chartType) {
      case 'line':
        return (
          <ResponsiveContainer width="100%" height={256}>
            <LineChart {...commonProps}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis 
                dataKey="date" 
                stroke="#9ca3af"
                fontSize={12}
              />
              <YAxis 
                stroke="#9ca3af"
                fontSize={12}
              />
              <Tooltip 
                contentStyle={{
                  backgroundColor: '#1f2937',
                  border: '1px solid #374151',
                  borderRadius: '8px',
                  color: '#f9fafb'
                }}
              />
              <Line 
                type="monotone" 
                dataKey="views" 
                stroke={COLORS.views} 
                strokeWidth={2}
                dot={{ fill: COLORS.views, strokeWidth: 2, r: 4 }}
                name="Vues"
              />
              <Line 
                type="monotone" 
                dataKey="clicks" 
                stroke={COLORS.clicks} 
                strokeWidth={2}
                dot={{ fill: COLORS.clicks, strokeWidth: 2, r: 4 }}
                name="Clics"
              />
              <Line 
                type="monotone" 
                dataKey="conversions" 
                stroke={COLORS.conversions} 
                strokeWidth={2}
                dot={{ fill: COLORS.conversions, strokeWidth: 2, r: 4 }}
                name="Conversions"
              />
            </LineChart>
          </ResponsiveContainer>
        );

      case 'area':
        return (
          <ResponsiveContainer width="100%" height={256}>
            <AreaChart {...commonProps}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis 
                dataKey="date" 
                stroke="#9ca3af"
                fontSize={12}
              />
              <YAxis 
                stroke="#9ca3af"
                fontSize={12}
              />
              <Tooltip 
                contentStyle={{
                  backgroundColor: '#1f2937',
                  border: '1px solid #374151',
                  borderRadius: '8px',
                  color: '#f9fafb'
                }}
              />
              <Area 
                type="monotone" 
                dataKey="views" 
                stackId="1"
                stroke={COLORS.views} 
                fill={COLORS.views}
                fillOpacity={0.6}
                name="Vues"
              />
              <Area 
                type="monotone" 
                dataKey="clicks" 
                stackId="2"
                stroke={COLORS.clicks} 
                fill={COLORS.clicks}
                fillOpacity={0.6}
                name="Clics"
              />
              <Area 
                type="monotone" 
                dataKey="conversions" 
                stackId="3"
                stroke={COLORS.conversions} 
                fill={COLORS.conversions}
                fillOpacity={0.6}
                name="Conversions"
              />
            </AreaChart>
          </ResponsiveContainer>
        );

      case 'bar':
        return (
          <ResponsiveContainer width="100%" height={256}>
            <BarChart {...commonProps}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis 
                dataKey="date" 
                stroke="#9ca3af"
                fontSize={12}
              />
              <YAxis 
                stroke="#9ca3af"
                fontSize={12}
              />
              <Tooltip 
                contentStyle={{
                  backgroundColor: '#1f2937',
                  border: '1px solid #374151',
                  borderRadius: '8px',
                  color: '#f9fafb'
                }}
              />
              <Bar 
                dataKey="views" 
                fill={COLORS.views}
                name="Vues"
                radius={[2, 2, 0, 0]}
              />
              <Bar 
                dataKey="clicks" 
                fill={COLORS.clicks}
                name="Clics"
                radius={[2, 2, 0, 0]}
              />
              <Bar 
                dataKey="conversions" 
                fill={COLORS.conversions}
                name="Conversions"
                radius={[2, 2, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        );

      default:
        return null;
    }
  };

  return (
    <Card className="border-2 border-gray-700 bg-gray-800/50 backdrop-blur-sm">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-indigo-500/20">
              {chartType === 'line' && <LineChartIcon className="h-5 w-5 text-indigo-400" />}
              {chartType === 'area' && <AreaChartIcon className="h-5 w-5 text-indigo-400" />}
              {chartType === 'bar' && <BarChart3 className="h-5 w-5 text-indigo-400" />}
            </div>
            <div>
              <CardTitle className="text-lg font-semibold text-white">{title}</CardTitle>
              <CardDescription className="text-gray-400">{description}</CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Select value={chartType} onValueChange={onChartTypeChange}>
              <SelectTrigger className="w-32 bg-gray-700 border-gray-600 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-gray-600">
                <SelectItem value="line" className="text-white hover:bg-gray-700">
                  <LineChartIcon className="h-4 w-4 mr-2" />
                  Ligne
                </SelectItem>
                <SelectItem value="area" className="text-white hover:bg-gray-700">
                  <AreaChartIcon className="h-4 w-4 mr-2" />
                  Zone
                </SelectItem>
                <SelectItem value="bar" className="text-white hover:bg-gray-700">
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Barre
                </SelectItem>
              </SelectContent>
            </Select>
            <Select value={period} onValueChange={onPeriodChange}>
              <SelectTrigger className="w-24 bg-gray-700 border-gray-600 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-gray-600">
                <SelectItem value="7d" className="text-white hover:bg-gray-700">7j</SelectItem>
                <SelectItem value="30d" className="text-white hover:bg-gray-700">30j</SelectItem>
                <SelectItem value="90d" className="text-white hover:bg-gray-700">90j</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {renderChart()}
      </CardContent>
    </Card>
  );
};

// Composant pour le graphique en secteurs (sources de trafic)
interface TrafficSourceData {
  name: string;
  value: number;
  color: string;
}

interface TrafficSourceChartProps {
  data: TrafficSourceData[];
  loading?: boolean;
}

export const TrafficSourceChart: React.FC<TrafficSourceChartProps> = ({
  data,
  loading = false
}) => {
  const renderChart = () => {
    if (loading) {
      return (
        <div className="h-64 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-500"></div>
        </div>
      );
    }

    if (!data || data.length === 0) {
      return (
        <div className="h-64 flex items-center justify-center text-gray-400">
          <div className="text-center">
            <PieChartIcon className="h-12 w-12 mx-auto mb-2" />
            <p>Aucune donnée de trafic</p>
            <p className="text-sm">Les sources apparaîtront après les premières visites</p>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        <ResponsiveContainer width="100%" height={200}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={100}
              paddingAngle={5}
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip 
              contentStyle={{
                backgroundColor: '#1f2937',
                border: '1px solid #374151',
                borderRadius: '8px',
                color: '#f9fafb'
              }}
            />
          </PieChart>
        </ResponsiveContainer>
        
        <div className="space-y-2">
          {data.map((item, index) => (
            <div key={index} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div 
                  className="w-3 h-3 rounded-full" 
                  style={{ backgroundColor: item.color }}
                ></div>
                <span className="text-sm text-gray-300">{item.name}</span>
              </div>
              <span className="text-sm font-medium text-white">{item.value}%</span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <Card className="border-2 border-gray-700 bg-gray-800/50 backdrop-blur-sm">
      <CardHeader className="pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-pink-500/20">
            <PieChartIcon className="h-5 w-5 text-pink-400" />
          </div>
          <div>
            <CardTitle className="text-lg font-semibold text-white">Sources de trafic</CardTitle>
            <CardDescription className="text-gray-400">
              Répartition des visiteurs par source
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {renderChart()}
      </CardContent>
    </Card>
  );
};

// Composant pour les métriques en temps réel
interface RealtimeMetricsProps {
  analytics: any;
  changePercentages: any;
  isRealTimeActive: boolean;
  onToggleRealTime: () => void;
}

export const RealtimeMetrics: React.FC<RealtimeMetricsProps> = ({
  analytics,
  changePercentages,
  isRealTimeActive,
  onToggleRealTime
}) => {
  const getChangeIcon = (change: number) => {
    return change >= 0 ? (
      <ArrowUpRight className="h-4 w-4 text-green-500" />
    ) : (
      <ArrowDownRight className="h-4 w-4 text-red-500" />
    );
  };

  const getChangeColor = (change: number) => {
    return change >= 0 ? "text-green-500" : "text-red-500";
  };

  if (!analytics) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="border-2 border-gray-700 bg-gray-800/50 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="animate-pulse">
                <div className="h-4 bg-gray-600 rounded w-1/2 mb-2"></div>
                <div className="h-8 bg-gray-600 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-600 rounded w-1/3"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card className="border-2 border-gray-700 bg-gray-800/50 backdrop-blur-sm hover:shadow-lg transition-all duration-300">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-sm font-medium text-gray-400">Vues</p>
              <p className="text-2xl font-bold text-white">{analytics.total_views.toLocaleString()}</p>
              {changePercentages && (
                <div className="flex items-center gap-1">
                  {getChangeIcon(changePercentages.views)}
                  <span className={cn("text-sm font-medium", getChangeColor(changePercentages.views))}>
                    {changePercentages.views >= 0 ? '+' : ''}{changePercentages.views.toFixed(1)}%
                  </span>
                  <span className="text-xs text-gray-500">vs hier</span>
                </div>
              )}
            </div>
            <div className="p-3 rounded-lg bg-blue-500/20">
              <Eye className="h-6 w-6 text-blue-400" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-2 border-gray-700 bg-gray-800/50 backdrop-blur-sm hover:shadow-lg transition-all duration-300">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-sm font-medium text-gray-400">Clics</p>
              <p className="text-2xl font-bold text-white">{analytics.total_clicks.toLocaleString()}</p>
              {changePercentages && (
                <div className="flex items-center gap-1">
                  {getChangeIcon(changePercentages.clicks)}
                  <span className={cn("text-sm font-medium", getChangeColor(changePercentages.clicks))}>
                    {changePercentages.clicks >= 0 ? '+' : ''}{changePercentages.clicks.toFixed(1)}%
                  </span>
                  <span className="text-xs text-gray-500">vs hier</span>
                </div>
              )}
            </div>
            <div className="p-3 rounded-lg bg-green-500/20">
              <MousePointer className="h-6 w-6 text-green-400" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-2 border-gray-700 bg-gray-800/50 backdrop-blur-sm hover:shadow-lg transition-all duration-300">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-sm font-medium text-gray-400">Conversions</p>
              <p className="text-2xl font-bold text-white">{analytics.total_conversions.toLocaleString()}</p>
              {changePercentages && (
                <div className="flex items-center gap-1">
                  {getChangeIcon(changePercentages.conversions)}
                  <span className={cn("text-sm font-medium", getChangeColor(changePercentages.conversions))}>
                    {changePercentages.conversions >= 0 ? '+' : ''}{changePercentages.conversions.toFixed(1)}%
                  </span>
                  <span className="text-xs text-gray-500">vs hier</span>
                </div>
              )}
            </div>
            <div className="p-3 rounded-lg bg-purple-500/20">
              <Target className="h-6 w-6 text-purple-400" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-2 border-gray-700 bg-gray-800/50 backdrop-blur-sm hover:shadow-lg transition-all duration-300">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-sm font-medium text-gray-400">Taux de conversion</p>
              <p className="text-2xl font-bold text-white">{analytics.conversion_rate.toFixed(1)}%</p>
              {changePercentages && (
                <div className="flex items-center gap-1">
                  {getChangeIcon(changePercentages.conversions)}
                  <span className={cn("text-sm font-medium", getChangeColor(changePercentages.conversions))}>
                    {changePercentages.conversions >= 0 ? '+' : ''}{changePercentages.conversions.toFixed(1)}%
                  </span>
                  <span className="text-xs text-gray-500">vs hier</span>
                </div>
              )}
            </div>
            <div className="p-3 rounded-lg bg-orange-500/20">
              <BarChart3 className="h-6 w-6 text-orange-400" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// Import des icônes nécessaires
import { Eye, MousePointer, Target, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { cn } from '@/lib/utils';
