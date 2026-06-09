import { Store, User, Shield } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import type { SidebarPersona } from '@/config/navigation.types';

type SidebarPersonaSwitchProps = {
  persona: SidebarPersona;
  isAdmin: boolean;
  isCollapsed: boolean;
  onPersonaChange: (persona: SidebarPersona) => void;
};

export function SidebarPersonaSwitch({
  persona,
  isAdmin,
  isCollapsed,
  onPersonaChange,
}: SidebarPersonaSwitchProps) {
  const { t } = useTranslation();

  const options: {
    id: SidebarPersona;
    labelKey: string;
    icon: typeof Store;
    adminOnly?: boolean;
  }[] = [
    {
      id: 'seller',
      labelKey: 'sidebar.chrome.personaSeller',
      icon: Store,
    },
    {
      id: 'buyer',
      labelKey: 'sidebar.chrome.personaBuyer',
      icon: User,
    },
    {
      id: 'admin',
      labelKey: 'sidebar.chrome.personaAdmin',
      icon: Shield,
      adminOnly: true,
    },
  ];

  const visibleOptions = options.filter(p => !p.adminOnly || isAdmin);

  return (
    <div
      className={cn(
        'mt-2',
        isCollapsed
          ? 'flex flex-col gap-1 px-0.5'
          : 'flex rounded-lg border border-border p-0.5 bg-muted/40'
      )}
      role="tablist"
      aria-label={t('sidebar.chrome.personaNavMode')}
    >
      {visibleOptions.map(option => {
        const Icon = option.icon;
        const isActive = persona === option.id;
        const label = t(option.labelKey);
        return (
          <button
            key={option.id}
            type="button"
            role="tab"
            aria-selected={isActive}
            title={label}
            onClick={() => onPersonaChange(option.id)}
            className={cn(
              'flex items-center justify-center gap-1.5 rounded-md text-xs font-medium transition-all duration-200',
              isCollapsed ? 'h-8 w-full' : 'flex-1 h-8 px-2',
              isActive
                ? 'bg-sidebar-accent text-foreground shadow-sm'
                : 'text-muted-foreground hover:bg-sidebar-accent hover:text-foreground'
            )}
          >
            <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden />
            {!isCollapsed && <span>{label}</span>}
            {isCollapsed && <span className="sr-only">{label}</span>}
          </button>
        );
      })}
    </div>
  );
}
