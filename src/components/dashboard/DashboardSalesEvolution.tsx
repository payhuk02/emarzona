import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ChartSuspense,
  LazyLineChart,
  LazyResponsiveContainer,
  LazyLine,
  LazyXAxis,
  LazyYAxis,
  LazyCartesianGrid,
  LazyTooltip,
} from '@/components/charts/LazyCharts';
import { formatLocaleNumber } from '@/lib/i18n/locale-format';
import { formatFcfa } from '@/lib/format-currency';

interface DashboardSalesEvolutionProps {
  data: Array<{
    month: string;
    revenue: number;
    orders: number;
    customers: number;
  }>;
  className?: string;
}

export const DashboardSalesEvolution = React.memo<DashboardSalesEvolutionProps>(
  ({ data, className }) => {
    const { t, i18n } = useTranslation();
    const locale = i18n.language;

    const chartData = useMemo(
      () =>
        data.map(item => ({
          ...item,
          revenue: Math.round(item.revenue),
        })),
      [data]
    );

    if (chartData.length === 0) {
      return null;
    }

    return (
      <div className={cn('dashboard-premium-panel h-full flex flex-col', className)}>
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-5 sm:mb-6">
          <div>
            <h2 className="dashboard-premium-panel-title">
              {t('dashboard.salesEvolution.title', 'Évolution des ventes')}
            </h2>
            <p className="dashboard-premium-panel-subtitle">
              {t('dashboard.salesEvolution.subtitle', 'Revenus sur la période sélectionnée')}
            </p>
          </div>
        </div>
        <div className="h-[280px] sm:h-[320px] lg:h-[360px] flex-1 min-h-[240px]">
          <ChartSuspense height={360}>
            <LazyResponsiveContainer width="100%" height="100%">
              <LazyLineChart data={chartData}>
                <LazyCartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                <LazyXAxis
                  dataKey="month"
                  tick={{ fontSize: 13, fill: '#6b7280' }}
                  axisLine={false}
                  tickLine={false}
                />
                <LazyYAxis
                  tick={{ fontSize: 13, fill: '#6b7280' }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={v => formatLocaleNumber(Number(v), locale)}
                />
                <LazyTooltip
                  formatter={(value: unknown) => [
                    formatFcfa(Number(value), { language: locale }),
                    t('dashboard.salesEvolution.revenue', 'Revenus'),
                  ]}
                  contentStyle={{
                    borderRadius: 12,
                    border: '1px solid #e5e7eb',
                    fontSize: 14,
                  }}
                />
                <LazyLine
                  type="monotone"
                  dataKey="revenue"
                  stroke="#8b5cf6"
                  strokeWidth={3}
                  dot={{ fill: '#8b5cf6', strokeWidth: 2, r: 5 }}
                  activeDot={{ r: 7, fill: '#7c3aed', stroke: '#fff', strokeWidth: 2 }}
                />
              </LazyLineChart>
            </LazyResponsiveContainer>
          </ChartSuspense>
        </div>
      </div>
    );
  }
);

DashboardSalesEvolution.displayName = 'DashboardSalesEvolution';
