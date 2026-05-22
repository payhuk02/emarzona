/**
 * Lazy-loaded chart components
 * Charge recharts uniquement quand le composant est rendu
 * Réduit le bundle initial de ~350KB
 */
import React, { Suspense, lazy, ComponentType } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

// Fallback pendant le chargement des graphiques
const ChartSkeleton = ({ height = 300 }: { height?: number }) => (
  <div className="w-full animate-pulse" style={{ height }}>
    <Skeleton className="w-full h-full rounded-lg" />
  </div>
);

// Types pour les props des composants
type RechartsComponents = typeof import('recharts');

// HOC pour créer des composants lazy recharts
function createLazyChartComponent<K extends keyof RechartsComponents>(
  componentName: K
): ComponentType<React.ComponentProps<RechartsComponents[K]>> {
  const LazyComponent = lazy(async () => {
    const recharts = await import('recharts');
    return { default: recharts[componentName] as ComponentType<unknown> };
  });

  return function WrappedComponent(props: React.ComponentProps<RechartsComponents[K]>) {
    return (
      <Suspense fallback={<ChartSkeleton />}>
        <LazyComponent {...(props as object)} />
      </Suspense>
    );
  };
}

// Export des composants lazy
export const LazyLineChart = createLazyChartComponent('LineChart');
export const LazyBarChart = createLazyChartComponent('BarChart');
export const LazyPieChart = createLazyChartComponent('PieChart');
export const LazyAreaChart = createLazyChartComponent('AreaChart');
export const LazyRadarChart = createLazyChartComponent('RadarChart');
export const LazyComposedChart = createLazyChartComponent('ComposedChart');

// Primitives lazy (évite import statique de recharts dans le bundle dashboard)
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

// Hook pour charger recharts à la demande
export const useRechartsLoader = () => {
  const [isLoaded, setIsLoaded] = React.useState(false);
  const [error, setError] = React.useState<Error | null>(null);

  React.useEffect(() => {
    import('recharts').then(() => setIsLoaded(true)).catch(setError);
  }, []);

  return { isLoaded, error };
};

// Wrapper pour ResponsiveContainer avec lazy loading
export const LazyResponsiveContainer: React.FC<{
  width?: string | number;
  height?: string | number;
  children: React.ReactNode;
}> = ({ width = '100%', height = 300, children }) => {
  const [RespContainer, setRespContainer] = React.useState<ComponentType<{
    width?: string | number;
    height?: string | number;
    children?: React.ReactNode;
  }> | null>(null);

  React.useEffect(() => {
    import('recharts').then(mod => {
      setRespContainer(() => mod.ResponsiveContainer);
    });
  }, []);

  if (!RespContainer) {
    return <ChartSkeleton height={typeof height === 'number' ? height : 300} />;
  }

  return (
    <RespContainer width={width} height={height}>
      {children}
    </RespContainer>
  );
};
