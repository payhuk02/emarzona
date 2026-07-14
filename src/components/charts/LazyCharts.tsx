/**
 * Lazy-loaded chart components
 * Charge recharts via loadRecharts() (import unique partagé)
 */
import React, { Suspense, lazy, ComponentType } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { loadRecharts } from '@/lib/recharts-loader';

export const ChartSkeleton = ({ height = 300 }: { height?: number }) => (
  <div className="w-full animate-pulse" style={{ height }}>
    <Skeleton className="h-full w-full rounded-lg" />
  </div>
);

/** Un seul Suspense par graphique — évite les cascades de fallbacks par primitive. */
export function ChartSuspense({
  children,
  height = 300,
}: {
  children: React.ReactNode;
  height?: number;
}) {
  return <Suspense fallback={<ChartSkeleton height={height} />}>{children}</Suspense>;
}

type RechartsComponents = typeof import('recharts');

function createLazyChartComponent<K extends keyof RechartsComponents>(
  componentName: K
): ComponentType<React.ComponentProps<RechartsComponents[K]>> {
  const LazyComponent = lazy(async () => {
    const recharts = await loadRecharts();
    return { default: recharts[componentName] as ComponentType<unknown> };
  });

  return LazyComponent as ComponentType<React.ComponentProps<RechartsComponents[K]>>;
}

export const LazyLineChart = createLazyChartComponent('LineChart');
export const LazyBarChart = createLazyChartComponent('BarChart');
export const LazyPieChart = createLazyChartComponent('PieChart');
export const LazyAreaChart = createLazyChartComponent('AreaChart');
export const LazyRadarChart = createLazyChartComponent('RadarChart');
export const LazyComposedChart = createLazyChartComponent('ComposedChart');

export const LazyLine = createLazyChartComponent('Line');
export const LazyBar = createLazyChartComponent('Bar');
export const LazyPie = createLazyChartComponent('Pie');
export const LazyArea = createLazyChartComponent('Area');
export const LazyXAxis = createLazyChartComponent('XAxis');
export const LazyYAxis = createLazyChartComponent('YAxis');
export const LazyCartesianGrid = createLazyChartComponent('CartesianGrid');
export const LazyTooltip = createLazyChartComponent('Tooltip');
export const LazyLegend = createLazyChartComponent('Legend');
export const LazyCell = createLazyChartComponent('Cell');
export const LazyRadar = createLazyChartComponent('Radar');
export const LazyPolarGrid = createLazyChartComponent('PolarGrid');
export const LazyPolarAngleAxis = createLazyChartComponent('PolarAngleAxis');
export const LazyPolarRadiusAxis = createLazyChartComponent('PolarRadiusAxis');

export const LazyResponsiveContainer = lazy(async () => {
  const recharts = await loadRecharts();
  return { default: recharts.ResponsiveContainer };
});

export const useRechartsLoader = () => {
  const [isLoaded, setIsLoaded] = React.useState(false);
  const [error, setError] = React.useState<Error | null>(null);

  React.useEffect(() => {
    loadRecharts()
      .then(() => setIsLoaded(true))
      .catch(setError);
  }, []);

  return { isLoaded, error };
};
