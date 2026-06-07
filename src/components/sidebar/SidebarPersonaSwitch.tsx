import { Store, User, Shield } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { SidebarPersona } from '@/config/navigation.types';

type SidebarPersonaSwitchProps = {
  persona: SidebarPersona;
  isAdmin: boolean;
  isCollapsed: boolean;
  onPersonaChange: (persona: SidebarPersona) => void;
};

const PERSONAS: {
  id: SidebarPersona;
  label: string;
  shortLabel: string;
  icon: typeof Store;
  adminOnly?: boolean;
}[] = [
  { id: 'seller', label: 'Vendre', shortLabel: 'V', icon: Store },
  { id: 'buyer', label: 'Acheter', shortLabel: 'A', icon: User },
  { id: 'admin', label: 'Admin', shortLabel: 'Ad', icon: Shield, adminOnly: true },
];

export function SidebarPersonaSwitch({
  persona,
  isAdmin,
  isCollapsed,
  onPersonaChange,
}: SidebarPersonaSwitchProps) {
  const options = PERSONAS.filter(p => !p.adminOnly || isAdmin);

  return (
    <div
      className={cn(
        'mt-2',
        isCollapsed
          ? 'flex flex-col gap-1 px-0.5'
          : 'flex rounded-lg border border-white/12 p-0.5 bg-white/[0.04]'
      )}
      role="tablist"
      aria-label="Mode de navigation"
    >
      {options.map(option => {
        const Icon = option.icon;
        const isActive = persona === option.id;
        return (
          <button
            key={option.id}
            type="button"
            role="tab"
            aria-selected={isActive}
            title={option.label}
            onClick={() => onPersonaChange(option.id)}
            className={cn(
              'flex items-center justify-center gap-1.5 rounded-md text-xs font-medium transition-all duration-200',
              isCollapsed ? 'h-8 w-full' : 'flex-1 h-8 px-2',
              isActive
                ? 'bg-white/15 text-white shadow-sm'
                : 'text-white/60 hover:bg-white/10 hover:text-white'
            )}
          >
            <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden />
            {!isCollapsed && <span>{option.label}</span>}
            {isCollapsed && <span className="sr-only">{option.label}</span>}
          </button>
        );
      })}
    </div>
  );
}
