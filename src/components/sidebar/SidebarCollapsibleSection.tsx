import { ReactNode } from 'react';
import { ChevronDown } from 'lucide-react';
import { SidebarGroup, SidebarGroupLabel } from '@/components/ui/sidebar';
import { cn } from '@/lib/utils';

interface SidebarCollapsibleSectionProps {
  label: string;
  isOpen: boolean;
  onToggle: () => void;
  /** Mode rail icône : masquer l'en-tête accordéon */
  hideHeader?: boolean;
  children: ReactNode;
  className?: string;
}

export function SidebarCollapsibleSection({
  label,
  isOpen,
  onToggle,
  hideHeader = false,
  children,
  className,
}: SidebarCollapsibleSectionProps) {
  return (
    <SidebarGroup className={cn('app-sidebar-section py-0', className)}>
      {!hideHeader && (
        <SidebarGroupLabel className="h-auto p-0">
          <button
            type="button"
            onClick={onToggle}
            className="app-sidebar-section-header w-full flex items-center justify-between gap-2 rounded-md px-2 py-2 text-left transition-colors duration-200"
            aria-expanded={isOpen}
            aria-controls={`sidebar-section-${label.replace(/\s+/g, '-')}`}
          >
            <span className="text-[10px] uppercase tracking-[0.14em] font-bold text-white/80">
              {label}
            </span>
            <ChevronDown
              className={cn(
                'h-3.5 w-3.5 shrink-0 text-white/70 transition-transform duration-300 ease-out',
                !isOpen && '-rotate-90'
              )}
              aria-hidden
            />
          </button>
        </SidebarGroupLabel>
      )}
      <div
        id={`sidebar-section-${label.replace(/\s+/g, '-')}`}
        className={cn(
          'app-sidebar-accordion grid transition-[grid-template-rows] duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]',
          isOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
        )}
      >
        <div className="overflow-hidden min-h-0">{children}</div>
      </div>
    </SidebarGroup>
  );
}
