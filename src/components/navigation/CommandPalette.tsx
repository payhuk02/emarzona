/**
 * CommandPalette - Enterprise-grade command palette (Cmd+K)
 * Provides quick navigation to any page in the application
 * Supports fuzzy search, keyboard navigation, and recent pages
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
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
import { LayoutDashboard } from 'lucide-react';
import { userMenuSections } from '@/config/navigation.menus';
import {
  PRODUCTS_CONTEXT_SIDEBAR,
  LOGISTICS_CONTEXT_SIDEBAR,
  MARKETING_CONTEXT_SIDEBAR,
  ANALYTICS_CONTEXT_SIDEBAR,
  PAYMENTS_CONTEXT_SIDEBAR,
  SETTINGS_CONTEXT_SIDEBAR,
  AI_CONTEXT_SIDEBAR,
} from '@/config/navigation.context.extended';

interface CommandItemData {
  id: string;
  title: string;
  url: string;
  category: string;
  icon: React.ComponentType<{ className?: string }>;
  keywords?: string[];
}

// Flatten all navigation items into a searchable list
const getAllCommands = (): CommandItemData[] => {
  const commands: CommandItemData[] = [];

  // Add compact sidebar items
  userMenuSections.forEach(section => {
    section.items.forEach(item => {
      commands.push({
        id: item.url,
        title: item.title,
        url: item.url,
        category: section.label,
        icon: item.icon || LayoutDashboard,
        keywords: [item.title.toLowerCase(), section.label.toLowerCase()],
      });
    });
  });

  // Add context sidebar items
  const contextSidebars = [
    { name: 'Produits', items: PRODUCTS_CONTEXT_SIDEBAR },
    { name: 'Logistique', items: LOGISTICS_CONTEXT_SIDEBAR },
    { name: 'Marketing', items: MARKETING_CONTEXT_SIDEBAR },
    { name: 'Analytics', items: ANALYTICS_CONTEXT_SIDEBAR },
    { name: 'Paiements', items: PAYMENTS_CONTEXT_SIDEBAR },
    { name: 'Paramètres', items: SETTINGS_CONTEXT_SIDEBAR },
    { name: 'IA', items: AI_CONTEXT_SIDEBAR },
  ];

  contextSidebars.forEach(({ name, items }) => {
    items.forEach(section => {
      section.items.forEach(item => {
        commands.push({
          id: item.url,
          title: item.title,
          url: item.url,
          category: `${name} - ${section.label}`,
          icon: item.icon || LayoutDashboard,
          keywords: [item.title.toLowerCase(), section.label.toLowerCase(), name.toLowerCase()],
        });
      });
    });
  });

  return commands;
};

const ALL_COMMANDS = getAllCommands();

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CommandPalette({ open, onOpenChange }: CommandPaletteProps) {
  const navigate = useNavigate();
  const [recentPages, setRecentPages] = useState<string[]>([]);

  // Load recent pages from localStorage
  useEffect(() => {
    const stored = localStorage.getItem('recent-pages');
    if (stored) {
      try {
        setRecentPages(JSON.parse(stored));
      } catch (e) {
        console.error('Failed to parse recent pages', e);
      }
    }
  }, []);

  const handleSelect = useCallback(
    (command: CommandItemData) => {
      // Add to recent pages
      const updatedRecent = [command.url, ...recentPages.filter(url => url !== command.url)].slice(
        0,
        10
      );
      setRecentPages(updatedRecent);
      localStorage.setItem('recent-pages', JSON.stringify(updatedRecent));

      navigate(command.url);
      onOpenChange(false);
    },
    [navigate, onOpenChange, recentPages]
  );

  // Group commands by category
  const groupedCommands = useMemo(() => {
    const groups: Record<string, CommandItemData[]> = {};
    ALL_COMMANDS.forEach(cmd => {
      if (!groups[cmd.category]) groups[cmd.category] = [];
      groups[cmd.category].push(cmd);
    });
    return groups;
  }, []);

  const recentCommands = useMemo(() => {
    return ALL_COMMANDS.filter(cmd => recentPages.includes(cmd.url));
  }, [recentPages]);

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput placeholder="Rechercher une page, un paramètre..." />
      <CommandList>
        <CommandEmpty>Aucun résultat trouvé.</CommandEmpty>

        {recentCommands.length > 0 && (
          <CommandGroup heading="Pages Récentes">
            {recentCommands.map(command => {
              const Icon = command.icon;
              return (
                <CommandItem
                  key={`recent-${command.id}`}
                  value={`recent ${command.title} ${command.category}`}
                  onSelect={() => handleSelect(command)}
                >
                  <Icon className="mr-2 h-4 w-4 text-muted-foreground" />
                  <span>{command.title}</span>
                  <span className="ml-auto text-xs text-muted-foreground">{command.category}</span>
                </CommandItem>
              );
            })}
          </CommandGroup>
        )}

        {recentCommands.length > 0 && <CommandSeparator />}

        {Object.entries(groupedCommands).map(([category, commands]) => (
          <CommandGroup key={category} heading={category}>
            {commands.map(command => {
              const Icon = command.icon;
              return (
                <CommandItem
                  key={command.id}
                  value={`${command.title} ${command.category} ${command.keywords?.join(' ')}`}
                  onSelect={() => handleSelect(command)}
                >
                  <Icon className="mr-2 h-4 w-4 text-muted-foreground" />
                  <span>{command.title}</span>
                </CommandItem>
              );
            })}
          </CommandGroup>
        ))}
      </CommandList>
    </CommandDialog>
  );
}

/**
 * useCommandPalette - Hook to manage command palette state
 */
export function useCommandPalette() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setOpen(prev => !prev);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  return { open, setOpen };
}
