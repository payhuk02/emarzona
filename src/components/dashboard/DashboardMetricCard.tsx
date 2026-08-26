import { LucideIcon, TrendingDown, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';

export type MetricTheme = 'orange' | 'blue' | 'slate' | 'amber' | 'purple' | 'green';

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
  const themeClass = theme === 'purple' ? 'orange' : theme === 'green' ? 'slate' : theme;

  return (
    <article
      className={cn(
        'dashboard-metric-card group',
        `dashboard-metric-card--${themeClass}`,
        className
      )}
    >
      <div className="dashboard-metric-wave" aria-hidden="true" />

      <div className="flex items-center justify-between gap-3 relative z-10">
        <Icon className="h-5 w-5 text-foreground shrink-0" strokeWidth={1.75} aria-hidden="true" />
        <span
          className={cn(
            'dashboard-metric-trend',
            isUp ? 'dashboard-metric-trend--up' : 'dashboard-metric-trend--down'
          )}
        >
          {isUp ? (
            <TrendingUp className="h-3.5 w-3.5" aria-hidden="true" />
          ) : (
            <TrendingDown className="h-3.5 w-3.5" aria-hidden="true" />
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
