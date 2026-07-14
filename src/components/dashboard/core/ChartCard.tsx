import { ReactNode } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

export interface ChartCardProps {
  title: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  contentClassName?: string;
  index?: number; // Used for staggered entrance animations
}

export function ChartCard({
  title,
  description,
  action,
  children,
  className,
  contentClassName,
  index = 0,
}: ChartCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: index * 0.15, duration: 0.5, ease: 'easeOut' }}
      className="h-full"
    >
      <Card
        className={cn(
          'flex h-full flex-col overflow-hidden border-border/50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60',
          'transition-shadow duration-300 hover:shadow-lg',
          className
        )}
      >
        <CardHeader className="flex flex-row items-center justify-between pb-4">
          <div className="space-y-1">
            <CardTitle className="text-base font-semibold">{title}</CardTitle>
            {description && <CardDescription>{description}</CardDescription>}
          </div>
          {action && <div className="ml-4 shrink-0">{action}</div>}
        </CardHeader>
        <CardContent className={cn('flex-1', contentClassName)}>{children}</CardContent>
      </Card>
    </motion.div>
  );
}
