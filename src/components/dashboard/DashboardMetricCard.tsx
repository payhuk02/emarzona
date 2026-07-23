import { LucideIcon, TrendingDown, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';

export type MetricTheme = 'purple' | 'blue' | 'green' | 'orange';

interface DashboardMetricCardProps {
  label: string;
  value: string | React.ReactNode;
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
    <article className={cn('dashboard-metric-card group', `dashboard-metric-card--${theme}`, className)}>
      {/* Background glow orbs - animated via CSS */}
      <div className="dashboard-metric-wave" aria-hidden="true" />
      
      <div className="flex items-start justify-between gap-3 relative z-10">
        <div className="dashboard-metric-icon-wrap" aria-hidden="true">
          <Icon />
        </div>
        <span
          className={cn(
            'dashboard-metric-trend',
            isUp ? 'dashboard-metric-trend--up' : 'dashboard-metric-trend--down'
          )}
        >
          {isUp ? (
            <TrendingUp className="h-3.5 w-3.5 sm:h-4 sm:w-4" aria-hidden="true" />
          ) : (
            <TrendingDown className="h-3.5 w-3.5 sm:h-4 sm:w-4" aria-hidden="true" />
          )}
          {trendLabel}
        </span>
      </div>
      <p className="dashboard-metric-label relative z-10">{label}</p>
      <div className="dashboard-metric-value relative z-10 break-words">{value}</div>
      {sublabel && <p className="dashboard-metric-sub relative z-10">{sublabel}</p>}
    </article>
  );
}
