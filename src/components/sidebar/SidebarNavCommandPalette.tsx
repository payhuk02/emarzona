import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command';
import type { SidebarNavEntry } from './sidebar-nav-shared';
import { recordNavClick } from '@/hooks/useNavigationAnalytics';
import { OPEN_COMMAND_PALETTE_EVENT } from '@/lib/vendor-command-palette';
import { useTranslation } from 'react-i18next';
import type { StoreCommerceType } from '@/constants/store-commerce-types';
import { resolveSellerNavUrl } from '@/lib/navigation/vendor-products-nav';

interface SidebarNavCommandPaletteProps {
  entries: SidebarNavEntry[];
  quickActions?: SidebarNavEntry[];
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Pour résoudre hubs Produits → liste verticale */
  commerceType?: StoreCommerceType | null;
}

export function SidebarNavCommandPalette({
  entries,
  quickActions = [],
  open: openProp,
  onOpenChange,
  commerceType = null,
}: SidebarNavCommandPaletteProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [openInternal, setOpenInternal] = useState(false);
  const open = openProp ?? openInternal;
  const setOpen = onOpenChange ?? setOpenInternal;

  const handleSelect = useCallback(
    (url: string) => {
      const resolved = resolveSellerNavUrl(url, commerceType);
      recordNavClick(resolved);
      setOpen(false);
      navigate(resolved);
    },
    [navigate, setOpen, commerceType]
  );

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        e.stopPropagation();
        setOpen(!open);
      }
    };
    const onOpenEvent = () => setOpen(true);
    // capture: empêche d'anciens listeners shell de rouvrir une 2e palette
    window.addEventListener('keydown', onKeyDown, true);
    window.addEventListener(OPEN_COMMAND_PALETTE_EVENT, onOpenEvent);
    return () => {
      window.removeEventListener('keydown', onKeyDown, true);
      window.removeEventListener(OPEN_COMMAND_PALETTE_EVENT, onOpenEvent);
    };
  }, [setOpen, open]);

  const allEntries = [...quickActions, ...entries];
  const grouped = allEntries.reduce<Record<string, SidebarNavEntry[]>>((acc, entry) => {
    if (!acc[entry.sectionLabel]) acc[entry.sectionLabel] = [];
    acc[entry.sectionLabel].push(entry);
    return acc;
  }, {});

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <div data-testid="command-palette">
        <CommandInput
          placeholder={t('sidebar.chrome.commandPaletteSearchPlaceholder')}
          data-testid="command-palette-input"
        />
        <CommandList className="max-h-[min(60vh,420px)]">
          <CommandEmpty data-testid="command-palette-no-results">
            {t('sidebar.chrome.commandPaletteEmpty')}
          </CommandEmpty>
          {Object.entries(grouped).map(([sectionLabel, items], index) => (
            <div key={sectionLabel} data-testid="command-palette-category">
              {index > 0 && <CommandSeparator />}
              <CommandGroup heading={sectionLabel}>
                {items.map(item => {
                  const Icon = item.icon;
                  const resolvedUrl = resolveSellerNavUrl(item.url, commerceType);
                  return (
                    <CommandItem
                      key={`${item.url}-${sectionLabel}`}
                      value={`${item.title} ${resolvedUrl} ${sectionLabel}`}
                      onSelect={() => handleSelect(item.url)}
                      className="gap-2"
                      data-testid="command-palette-item"
                    >
                      <Icon className="h-4 w-4 shrink-0 opacity-70" aria-hidden />
                      <span className="flex-1 truncate">{item.title}</span>
                      <span className="text-[10px] text-muted-foreground truncate max-w-[120px]">
                        {resolvedUrl}
                      </span>
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            </div>
          ))}
        </CommandList>
      </div>
    </CommandDialog>
  );
}
