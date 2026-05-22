import { LucideIcon, TrendingDown, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';

export type MetricTheme = 'purple' | 'blue' | 'green' | 'orange';

interface DashboardMetricCardProps {
  label: string;
  value: string;
  sublabel?: string;
  trendPercent: number;
  icon: LucideIcon;
  theme: MetricTheme;
  className?: string;
}

export function DashboardMetricCard({
  label,
  value,
  sublabel = 'vs le mois dernier',
  trendPercent,
  icon: Icon,
  theme,
  className,
}: DashboardMetricCardProps) {
  const isUp = trendPercent >= 0;
  const trendLabel = `${isUp ? '+' : ''}${trendPercent}%`;

  return (
    <article className={cn('dashboard-metric-card', `dashboard-metric-card--${theme}`, className)}>
      <div className="flex items-start justify-between gap-3 relative z-[1]">
        <div className="dashboard-metric-icon-wrap" aria-hidden>
          <Icon />
        </div>
        <span
          className={cn(
            'dashboard-metric-trend',
            isUp ? 'dashboard-metric-trend--up' : 'dashboard-metric-trend--down'
          )}
        >
          {isUp ? (
            <TrendingUp className="h-3.5 w-3.5" aria-hidden />
          ) : (
            <TrendingDown className="h-3.5 w-3.5" aria-hidden />
          )}
          {trendLabel}
        </span>
      </div>
      <p className="dashboard-metric-label relative z-[1]">{label}</p>
      <p className="dashboard-metric-value relative z-[1] break-words">{value}</p>
      {sublabel && <p className="dashboard-metric-sub relative z-[1]">{sublabel}</p>}
      <div className="dashboard-metric-wave" aria-hidden />
    </article>
  );
}
