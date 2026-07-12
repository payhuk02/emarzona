/**
 * CommandPalette - Enterprise-grade command palette (Cmd+K)
 * Provides quick navigation to any page in the application
 * Supports fuzzy search, keyboard navigation, and recent pages
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import {
  Search,
  FileText,
  Package,
  ShoppingCart,
  Users,
  Settings,
  BarChart3,
  Calendar,
  Truck,
  CreditCard,
  Tag,
  GraduationCap,
  Download,
  ShoppingBag,
  Camera,
  Store,
  LayoutDashboard,
  ChevronRight,
  Clock,
  ArrowRight,
  X,
} from 'lucide-react';
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

interface CommandItem {
  id: string;
  title: string;
  url: string;
  category: string;
  icon: React.ComponentType<{ className?: string }>;
  keywords?: string[];
}

// Flatten all navigation items into a searchable list
const getAllCommands = (): CommandItem[] => {
  const commands: CommandItem[] = [];

  const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
    LayoutDashboard,
    Store,
    ShoppingCart,
    User: Users,
    Package,
    GraduationCap,
    Download,
    ShoppingBag,
    Camera,
    Warehouse: Truck,
    CreditCard,
    Percent: Tag,
    BarChart3,
    Search,
    Settings,
    Shield: Settings,
    Link2: Settings,
    Calendar,
    FileText,
    Users,
    DollarSign: CreditCard,
  };

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
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
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

  // Filter commands based on query
  const filteredCommands = useMemo(() => {
    if (!query.trim()) {
      // Show recent pages first, then all commands
      const recent = ALL_COMMANDS.filter(cmd => recentPages.includes(cmd.url));
      const others = ALL_COMMANDS.filter(cmd => !recentPages.includes(cmd.url));
      return [...recent, ...others];
    }

    const search = query.toLowerCase();
    return ALL_COMMANDS.filter(cmd => {
      const titleMatch = cmd.title.toLowerCase().includes(search);
      const categoryMatch = cmd.category.toLowerCase().includes(search);
      const keywordMatch = cmd.keywords?.some(kw => kw.includes(search));
      return titleMatch || categoryMatch || keywordMatch;
    });
  }, [query, recentPages]);

  // Reset selected index when filtered commands change
  useEffect(() => {
    setSelectedIndex(0);
  }, [filteredCommands]);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!open) return;

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex(prev => (prev + 1) % filteredCommands.length);
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex(prev => (prev - 1 + filteredCommands.length) % filteredCommands.length);
          break;
        case 'Enter':
          e.preventDefault();
          if (filteredCommands[selectedIndex]) {
            handleSelect(filteredCommands[selectedIndex]);
          }
          break;
        case 'Escape':
          e.preventDefault();
          onOpenChange(false);
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, filteredCommands, selectedIndex, onOpenChange]);

  const handleSelect = useCallback(
    (command: CommandItem) => {
      // Add to recent pages
      const updatedRecent = [command.url, ...recentPages.filter(url => url !== command.url)].slice(0, 10);
      setRecentPages(updatedRecent);
      localStorage.setItem('recent-pages', JSON.stringify(updatedRecent));

      navigate(command.url);
      onOpenChange(false);
      setQuery('');
    },
    [navigate, onOpenChange, recentPages]
  );

  const Icon = filteredCommands[selectedIndex]?.icon || Search;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="overflow-hidden p-0 shadow-2xl">
        <div className="flex flex-col">
          {/* Search Input */}
          <div className="flex items-center border-b px-3">
            <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
            <Input
              placeholder="Rechercher une page, un paramètre..."
              value={query}
              onChange={e => setQuery(e.target.value)}
              className="flex h-12 w-full border-0 bg-transparent px-2 py-3 text-sm outline-none placeholder:text-muted-foreground focus-visible:ring-0 focus-visible:ring-offset-0"
              autoFocus
            />
            {query && (
              <button
                onClick={() => setQuery('')}
                className="rounded-sm opacity-50 hover:opacity-100"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Command List */}
          <ScrollArea className="max-h-[400px] p-2">
            <div className="space-y-1">
              {filteredCommands.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <Search className="h-12 w-12 text-muted-foreground/50" />
                  <p className="mt-2 text-sm text-muted-foreground">
                    Aucun résultat pour "{query}"
                  </p>
                </div>
              ) : (
                filteredCommands.map((command, index) => (
                  <button
                    key={command.id}
                    onClick={() => handleSelect(command)}
                    className={cn(
                      'flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm text-left transition-colors',
                      index === selectedIndex
                        ? 'bg-accent text-accent-foreground'
                        : 'hover:bg-accent/50 hover:text-accent-foreground'
                    )}
                  >
                    <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
                    <div className="flex flex-1 flex-col">
                      <span className="font-medium">{command.title}</span>
                      <span className="text-xs text-muted-foreground">{command.category}</span>
                    </div>
                    <ArrowRight className="h-4 w-4 shrink-0 opacity-0 group-hover:opacity-100" />
                  </button>
                ))
              )}
            </div>
          </ScrollArea>

          {/* Footer */}
          <div className="flex items-center justify-between border-t px-3 py-2 text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              <kbd className="rounded bg-muted px-1.5 py-0.5 font-mono">↑↓</kbd>
              <span>pour naviguer</span>
              <kbd className="rounded bg-muted px-1.5 py-0.5 font-mono">↵</kbd>
              <span>pour sélectionner</span>
              <kbd className="rounded bg-muted px-1.5 py-0.5 font-mono">esc</kbd>
              <span>pour fermer</span>
            </div>
            {recentPages.length > 0 && (
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                <span>{recentPages.length} pages récentes</span>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
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
