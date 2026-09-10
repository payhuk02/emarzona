import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

export type MetricTheme = 'orange' | 'blue' | 'slate' | 'amber' | 'purple' | 'green';

interface DashboardMetricCardProps {
  label: string;
  value: string | React.ReactNode;
  sublabel?: string;
  icon: LucideIcon;
  theme: MetricTheme;
  className?: string;
}

export function DashboardMetricCard({
  label,
  value,
  sublabel = 'vs le mois dernier',
  icon: Icon,
  theme,
  className,
}: DashboardMetricCardProps) {
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

      <div className="flex items-center relative z-10">
        <Icon className="h-5 w-5 text-foreground shrink-0" strokeWidth={1.75} aria-hidden="true" />
      </div>
      <p className="dashboard-metric-label relative z-10">{label}</p>
      <div className="dashboard-metric-value relative z-10 break-words">{value}</div>
      {sublabel && <p className="dashboard-metric-sub relative z-10">{sublabel}</p>}
    </article>
  );
}
