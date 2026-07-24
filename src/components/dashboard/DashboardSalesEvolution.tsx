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
import { cn } from '@/lib/utils';

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
        <div className="h-[260px] sm:h-[300px] lg:h-[320px] flex-1 min-h-[220px]">
          <ChartSuspense height={320}>
            <LazyResponsiveContainer width="100%" height="100%">
              <LazyLineChart data={chartData}>
                <LazyCartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <LazyXAxis
                  dataKey="month"
                  tick={{ fontSize: 12, fill: '#64748b' }}
                  axisLine={false}
                  tickLine={false}
                />
                <LazyYAxis
                  tick={{ fontSize: 12, fill: '#64748b' }}
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
                    borderRadius: 10,
                    border: '1px solid #e2e8f0',
                    fontSize: 13,
                  }}
                />
                <LazyLine
                  type="monotone"
                  dataKey="revenue"
                  stroke="#f97316"
                  strokeWidth={2.5}
                  dot={{ fill: '#f97316', strokeWidth: 0, r: 3.5 }}
                  activeDot={{ r: 6, fill: '#ea580c', stroke: '#fff', strokeWidth: 2 }}
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
