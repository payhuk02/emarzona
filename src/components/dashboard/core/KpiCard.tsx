import { ReactNode } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { TrendingDown, TrendingUp } from 'lucide-react';
import { motion } from 'framer-motion';

export interface KpiCardProps {
  title: string;
  value: string | number;
  icon: ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
    label?: string;
  };
  subtitle?: string;
  className?: string;
  index?: number; // Used for staggered entrance animations
}

export function KpiCard({
  title,
  value,
  icon,
  trend,
  subtitle,
  className,
  index = 0,
}: KpiCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, duration: 0.5, ease: 'easeOut' }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
    >
      <Card
        className={cn(
          'relative overflow-hidden border-border/50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60',
          'transition-all duration-300 hover:shadow-lg hover:border-primary/20 hover:shadow-primary/5',
          className
        )}
      >
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
          <div className="rounded-md p-2 bg-primary/5 text-primary">{icon}</div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-1">
            <div className="text-2xl font-bold tracking-tight">{value}</div>

            {(trend || subtitle) && (
              <div className="flex items-center gap-2 text-xs">
                {trend && (
                  <span
                    className={cn(
                      'flex items-center font-medium',
                      trend.isPositive
                        ? 'text-emerald-600 dark:text-emerald-500'
                        : 'text-rose-600 dark:text-rose-500'
                    )}
                  >
                    {trend.isPositive ? (
                      <TrendingUp className="mr-1 h-3 w-3" />
                    ) : (
                      <TrendingDown className="mr-1 h-3 w-3" />
                    )}
                    {trend.isPositive ? '+' : '-'}
                    {Math.abs(trend.value)}%
                  </span>
                )}

                {subtitle && <span className="text-muted-foreground">{subtitle}</span>}

                {trend?.label && !subtitle && (
                  <span className="text-muted-foreground">{trend.label}</span>
                )}
              </div>
            )}
          </div>
        </CardContent>

        {/* Subtle decorative background glow */}
        <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-primary/5 blur-2xl pointer-events-none" />
      </Card>
    </motion.div>
  );
}
