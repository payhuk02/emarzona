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

interface SidebarNavCommandPaletteProps {
  entries: SidebarNavEntry[];
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function SidebarNavCommandPalette({
  entries,
  open: openProp,
  onOpenChange,
}: SidebarNavCommandPaletteProps) {
  const navigate = useNavigate();
  const [openInternal, setOpenInternal] = useState(false);
  const open = openProp ?? openInternal;
  const setOpen = onOpenChange ?? setOpenInternal;

  const handleSelect = useCallback(
    (url: string) => {
      setOpen(false);
      navigate(url);
    },
    [navigate, setOpen]
  );

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setOpen(true);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [setOpen]);

  const grouped = entries.reduce<Record<string, SidebarNavEntry[]>>((acc, entry) => {
    if (!acc[entry.sectionLabel]) acc[entry.sectionLabel] = [];
    acc[entry.sectionLabel].push(entry);
    return acc;
  }, {});

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Rechercher une page, une section…" />
      <CommandList className="max-h-[min(60vh,420px)]">
        <CommandEmpty>Aucune page trouvée.</CommandEmpty>
        {Object.entries(grouped).map(([sectionLabel, items], index) => (
          <div key={sectionLabel}>
            {index > 0 && <CommandSeparator />}
            <CommandGroup heading={sectionLabel}>
              {items.map(item => {
                const Icon = item.icon;
                return (
                  <CommandItem
                    key={item.url}
                    value={`${item.title} ${item.url} ${sectionLabel}`}
                    onSelect={() => handleSelect(item.url)}
                    className="gap-2"
                  >
                    <Icon className="h-4 w-4 shrink-0 opacity-70" aria-hidden />
                    <span className="flex-1 truncate">{item.title}</span>
                    <span className="text-[10px] text-muted-foreground truncate max-w-[120px]">
                      {item.url}
                    </span>
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </div>
        ))}
      </CommandList>
    </CommandDialog>
  );
}
