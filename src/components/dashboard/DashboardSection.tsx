/**
 * Section du tableau de bord — séparation visuelle premium
 */

import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface DashboardSectionProps {
  id?: string;
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
  contentClassName?: string;
  /** Masquer le titre visuellement (garde aria-labelledby) */
  titleSrOnly?: boolean;
}

export function DashboardSection({
  id,
  title,
  description,
  children,
  className,
  contentClassName,
  titleSrOnly = false,
}: DashboardSectionProps) {
  const headingId = id ? `${id}-heading` : undefined;

  return (
    <section id={id} className={cn('dashboard-section', className)} aria-labelledby={headingId}>
      <header className={cn('dashboard-section-header', titleSrOnly && 'sr-only')}>
        <h2 id={headingId} className="dashboard-section-title">
          {title}
        </h2>
        {description && <p className="dashboard-section-description">{description}</p>}
      </header>
      <div className={cn('dashboard-section-body', contentClassName)}>{children}</div>
    </section>
  );
}
