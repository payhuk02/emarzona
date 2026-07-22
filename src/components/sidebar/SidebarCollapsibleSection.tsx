import { ReactNode } from 'react';
import { ChevronDown } from 'lucide-react';
import { SidebarGroup, SidebarGroupLabel } from '@/components/ui/sidebar';
import { cn } from '@/lib/utils';

interface SidebarCollapsibleSectionProps {
  /** Stable id base for aria-controls / panel id (avoid label-based ids). */
  sectionId: string;
  label: string;
  isOpen: boolean;
  onToggle: () => void;
  /** True when a child route is active — drives the blue accent bar (not mere expanded). */
  containsActiveRoute?: boolean;
  /** Mode rail icône : masquer l'en-tête accordéon */
  hideHeader?: boolean;
  children: ReactNode;
  className?: string;
}

export function SidebarCollapsibleSection({
  sectionId,
  label,
  isOpen,
  onToggle,
  containsActiveRoute = false,
  hideHeader = false,
  children,
  className,
}: SidebarCollapsibleSectionProps) {
  const panelId = `sidebar-section-${sectionId}`;
  return (
    <SidebarGroup className={cn('app-sidebar-section py-0', className)}>
      {!hideHeader && (
        <SidebarGroupLabel className="h-auto p-0">
          <button
            type="button"
            onClick={onToggle}
            className="app-sidebar-section-header w-full flex items-center justify-between gap-2 rounded-md px-2 py-2 text-left transition-colors duration-200"
            aria-expanded={isOpen}
            aria-controls={panelId}
            data-active={containsActiveRoute ? 'true' : undefined}
          >
            <span className="text-[10px] uppercase tracking-[0.14em] font-bold text-muted-foreground">
              {label}
            </span>
            <ChevronDown
              className={cn(
                'h-3.5 w-3.5 shrink-0 text-muted-foreground transition-transform duration-300 ease-out',
                !isOpen && '-rotate-90'
              )}
              aria-hidden
            />
          </button>
        </SidebarGroupLabel>
      )}
      <div
        id={panelId}
        className={cn(
          'app-sidebar-accordion grid transition-[grid-template-rows] duration-300 ease-out',
          isOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
        )}
      >
        <div className="overflow-hidden min-h-0">{children}</div>
      </div>
    </SidebarGroup>
  );
}
