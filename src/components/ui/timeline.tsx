/**
 * Timeline Component
 * Date: 1 Février 2025
 */

import * as React from 'react';
import { cn } from '@/lib/utils';

const Timeline = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('relative', className)}
      {...props}
    />
  )
);
Timeline.displayName = 'Timeline';

const TimelineItem = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('relative flex gap-4 pb-8', className)}
      {...props}
    />
  )
);
TimelineItem.displayName = 'TimelineItem';

const TimelineSeparator = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('flex flex-col items-center', className)}
      {...props}
    />
  )
);
TimelineSeparator.displayName = 'TimelineSeparator';

const TimelineConnector = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('w-px flex-1 bg-border', className)}
      {...props}
    />
  )
);
TimelineConnector.displayName = 'TimelineConnector';

const TimelineDot = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'h-4 w-4 rounded-full border-2 border-background bg-primary flex items-center justify-center',
        className
      )}
      {...props}
    />
  )
);
TimelineDot.displayName = 'TimelineDot';

const TimelineContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('flex-1 pb-1', className)}
      {...props}
    />
  )
);
TimelineContent.displayName = 'TimelineContent';

export { Timeline, TimelineItem, TimelineSeparator, TimelineConnector, TimelineDot, TimelineContent };







