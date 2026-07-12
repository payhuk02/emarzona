/**
 * ContextSidebar - Enterprise-grade domain-specific sidebar
 * Displays extended context sidebars for specific domains (products, logistics, marketing, etc.)
 * Collapsible sections with smooth animations and keyboard navigation
 */

import { useState, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronRight, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { CONTEXT_SIDEBAR_MAPPING } from '@/config/navigation.context.extended';
import type { RawNavSection } from '@/config/navigation.enrich';

interface ContextSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  className?: string;
}

export function ContextSidebar({ isOpen, onClose, className }: ContextSidebarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());

  // Determine which context sidebar to show based on current path
  const getContextSections = useCallback((): RawNavSection[] => {
    const path = location.pathname;
    
    // Find matching context sidebar
    for (const [pattern, sections] of Object.entries(CONTEXT_SIDEBAR_MAPPING)) {
      if (path.startsWith(pattern)) {
        return sections;
      }
    }
    
    return [];
  }, [location.pathname]);

  const sections = getContextSections();

  // Expand all sections by default when sidebar opens
  const toggleSection = useCallback((label: string) => {
    setExpandedSections(prev => {
      const newSet = new Set(prev);
      if (newSet.has(label)) {
        newSet.delete(label);
      } else {
        newSet.add(label);
      }
      return newSet;
    });
  }, []);

  const handleItemClick = useCallback((url: string) => {
    navigate(url);
    onClose();
  }, [navigate, onClose]);

  // Auto-expand all sections when sidebar opens
  useState(() => {
    if (isOpen && sections.length > 0) {
      setExpandedSections(new Set(sections.map(s => s.label)));
    }
  });

  if (!isOpen || sections.length === 0) {
    return null;
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ x: 300, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: 300, opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className={cn(
            'fixed right-0 top-0 z-50 h-full w-80 border-l border-border/50 bg-background/95 backdrop-blur-sm shadow-2xl',
            className
          )}
        >
          <div className="flex h-full flex-col">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-border/50 px-4 py-3">
              <h2 className="text-lg font-semibold">Navigation Contextuelle</h2>
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="h-8 w-8"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Content */}
            <ScrollArea className="flex-1 px-4 py-4">
              <div className="space-y-2">
                {sections.map((section, sectionIndex) => {
                  const isExpanded = expandedSections.has(section.label);
                  
                  return (
                    <div key={sectionIndex} className="rounded-lg border border-border/50 bg-card/50">
                      <button
                        onClick={() => toggleSection(section.label)}
                        className="flex w-full items-center justify-between px-3 py-2 text-left text-sm font-medium transition-colors hover:bg-accent/50"
                        aria-expanded={isExpanded}
                      >
                        <span>{section.label}</span>
                        {isExpanded ? (
                          <ChevronDown className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        )}
                      </button>
                      
                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="overflow-hidden"
                          >
                            <div className="border-t border-border/50 px-3 py-2 space-y-1">
                              {section.items.map((item, itemIndex) => {
                                const isActive = location.pathname === item.url;
                                
                                return (
                                  <button
                                    key={itemIndex}
                                    onClick={() => handleItemClick(item.url)}
                                    className={cn(
                                      'flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm transition-colors',
                                      isActive
                                        ? 'bg-accent text-accent-foreground font-medium'
                                        : 'hover:bg-accent/50 hover:text-accent-foreground'
                                    )}
                                  >
                                    {item.icon && (
                                      <item.icon className="h-4 w-4 shrink-0 text-muted-foreground" />
                                    )}
                                    <span className="flex-1">{item.title}</span>
                                    {isActive && (
                                      <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                                    )}
                                  </button>
                                );
                              })}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>

            {/* Footer */}
            <div className="flex items-center justify-between border-t border-border/50 px-4 py-3">
              <div className="text-xs text-muted-foreground">
                {sections.length} section{sections.length > 1 ? 's' : ''}
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setExpandedSections(new Set(sections.map(s => s.label)))}
                className="text-xs"
              >
                Tout développer
              </Button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/**
 * ContextSidebarTrigger - Button to open context sidebar
 */
interface ContextSidebarTriggerProps {
  onClick: () => void;
  hasContext: boolean;
  className?: string;
}

export function ContextSidebarTrigger({
  onClick,
  hasContext,
  className,
}: ContextSidebarTriggerProps) {
  if (!hasContext) return null;

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={onClick}
      className={cn('h-5 w-5 shrink-0', className)}
      aria-label="Ouvrir la navigation contextuelle"
    >
      <ChevronRight className="h-3 w-3" />
    </Button>
  );
}

/**
 * useContextSidebar - Hook to manage context sidebar state
 */
export function useContextSidebar() {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();

  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);
  const toggle = useCallback(() => setIsOpen(prev => !prev), []);

  // Close sidebar when route changes
  useState(() => {
    if (isOpen) {
      close();
    }
  });

  return { isOpen, open, close, toggle };
}
