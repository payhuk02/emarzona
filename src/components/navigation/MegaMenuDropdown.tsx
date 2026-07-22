/**
 * MegaMenuDropdown - Enterprise-grade dropdown navigation
 * Animated with framer-motion for smooth transitions
 * Supports keyboard navigation and search within dropdown
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Search, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';

interface MegaMenuSection {
  label: string;
  items: Array<{
    title: string;
    url: string;
    description?: string;
    icon?: React.ComponentType<{ className?: string }>;
  }>;
}

interface MegaMenuDropdownProps {
  trigger: React.ReactNode;
  sections: MegaMenuSection[];
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  className?: string;
}

export function MegaMenuDropdown({
  trigger,
  sections,
  isOpen: controlledOpen,
  onOpenChange,
  className,
}: MegaMenuDropdownProps) {
  const { t } = useTranslation();
  const [internalOpen, setInternalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const isOpen = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const setOpen = onOpenChange || setInternalOpen;

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setOpen(false);
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, setOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, setOpen]);

  const filteredSections = useCallback(() => {
    if (!searchQuery.trim()) return sections;
    const query = searchQuery.toLowerCase();
    return sections
      .map(section => ({
        ...section,
        items: section.items.filter(
          item =>
            item.title.toLowerCase().includes(query) ||
            item.description?.toLowerCase().includes(query)
        ),
      }))
      .filter(section => section.items.length > 0);
  }, [sections, searchQuery]);

  const handleItemClick = (url: string) => {
    navigate(url);
    setOpen(false);
    setSearchQuery('');
  };

  const toggleOpen = () => setOpen(!isOpen);

  return (
    <div className={cn('relative', className)} ref={dropdownRef}>
      <div
        role="button"
        tabIndex={0}
        aria-expanded={isOpen}
        aria-haspopup="dialog"
        onClick={toggleOpen}
        onKeyDown={e => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            toggleOpen();
          }
        }}
      >
        {trigger}
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            role="dialog"
            aria-label={t('sidebar.chrome.megaMenuDialogLabel', {
              defaultValue: 'Navigation menu',
            })}
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="absolute left-0 top-full z-50 mt-2 w-screen max-w-4xl rounded-xl border border-border/50 bg-background/95 backdrop-blur-sm shadow-2xl"
          >
            <div className="p-4">
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder={t('sidebar.chrome.megaMenuSearchPlaceholder', {
                    defaultValue: 'Search in menu…',
                  })}
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="pl-10 pr-10"
                  autoFocus
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    aria-label={t('sidebar.chrome.megaMenuClearSearch', {
                      defaultValue: 'Clear search',
                    })}
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>

              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {filteredSections().map((section, sectionIndex) => (
                  <div key={sectionIndex} className="space-y-3">
                    <h3 className="text-sm font-semibold text-foreground/90">{section.label}</h3>
                    <div className="space-y-1">
                      {section.items.map((item, itemIndex) => (
                        <button
                          key={itemIndex}
                          type="button"
                          onClick={() => handleItemClick(item.url)}
                          className="flex w-full items-start gap-3 rounded-lg p-2 text-left text-sm transition-colors hover:bg-accent hover:text-accent-foreground"
                        >
                          {item.icon && (
                            <item.icon className="h-5 w-5 shrink-0 text-muted-foreground" />
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="font-medium">{item.title}</div>
                            {item.description && (
                              <div className="text-xs text-muted-foreground">
                                {item.description}
                              </div>
                            )}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {filteredSections().length === 0 && (
                <div className="py-8 text-center text-sm text-muted-foreground">
                  {t('sidebar.chrome.megaMenuNoResults', {
                    query: searchQuery,
                    defaultValue: `No results found for "${searchQuery}"`,
                  })}
                </div>
              )}
            </div>

            <div className="flex items-center justify-between border-t border-border/50 px-4 py-3">
              <div className="text-xs text-muted-foreground">
                {t('sidebar.chrome.megaMenuCloseHint', {
                  key: 'Esc',
                  defaultValue: 'Press {{key}} to close',
                })}
              </div>
              <Button variant="ghost" size="sm" onClick={() => setOpen(false)} className="text-xs">
                {t('sidebar.chrome.megaMenuClose', { defaultValue: 'Close' })}
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/**
 * MegaMenuTrigger - Button component for triggering mega menu
 */
export function MegaMenuTrigger({
  children,
  isOpen,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { isOpen?: boolean }) {
  return (
    <Button
      variant="ghost"
      size="sm"
      className={cn('gap-2', isOpen && 'bg-accent')}
      aria-expanded={isOpen}
      {...props}
    >
      {children}
      <ChevronDown className={cn('h-4 w-4 transition-transform', isOpen && 'rotate-180')} />
    </Button>
  );
}
