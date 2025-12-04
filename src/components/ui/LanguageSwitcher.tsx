/**
 * Composant pour changer de langue
 * Affiche un bouton avec un dropdown pour sélectionner la langue
 */

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Globe } from '@/components/icons';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { AVAILABLE_LANGUAGES, type LanguageCode } from '@/i18n/config';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';

interface LanguageSwitcherProps {
  className?: string;
  buttonClassName?: string;
  variant?: 'default' | 'ghost' | 'outline';
  showLabel?: boolean;
}

export const LanguageSwitcher: React.FC<LanguageSwitcherProps> = ({
  className,
  buttonClassName,
  variant = 'ghost',
  showLabel = false,
}) => {
  const { i18n } = useTranslation();
  const isMobile = useIsMobile();
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const positionLocked = useRef(false);
  
  const currentLanguage = AVAILABLE_LANGUAGES.find(
    (lang) => lang.code === i18n.language
  ) || AVAILABLE_LANGUAGES[0];

  // Verrouiller la position du menu sur mobile une fois qu'il est ouvert
  useEffect(() => {
    if (!open || !isMobile || !menuRef.current) {
      positionLocked.current = false;
      return;
    }

    const menu = menuRef.current;
    let rafId: number | null = null;
    
    // Attendre que le menu soit positionné par Radix UI
    const timeoutId = setTimeout(() => {
      const rect = menu.getBoundingClientRect();
      
      if (rect.top > 0 && rect.left > 0) {
        // Sauvegarder et verrouiller la position
        const savedTop = rect.top;
        const savedLeft = rect.left;
        const savedWidth = rect.width;
        
        positionLocked.current = true;
        
        // Fonction pour restaurer la position
        const restorePosition = () => {
          if (positionLocked.current && menu) {
            menu.style.cssText = `
              position: fixed !important;
              top: ${savedTop}px !important;
              left: ${savedLeft}px !important;
              width: ${savedWidth}px !important;
              transform: none !important;
              margin: 0 !important;
            `;
          }
        };
        
        // Restaurer immédiatement
        restorePosition();
        
        // Surveiller avec requestAnimationFrame
        const checkPosition = () => {
          if (positionLocked.current && menu) {
            const currentRect = menu.getBoundingClientRect();
            if (
              Math.abs(currentRect.top - savedTop) > 1 ||
              Math.abs(currentRect.left - savedLeft) > 1
            ) {
              restorePosition();
            }
            rafId = requestAnimationFrame(checkPosition);
          }
        };
        rafId = requestAnimationFrame(checkPosition);
      }
    }, 100);

    return () => {
      clearTimeout(timeoutId);
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
      }
      positionLocked.current = false;
    };
  }, [open, isMobile]);

  const changeLanguage = useCallback((langCode: LanguageCode) => {
    // Fermer le menu d'abord
    positionLocked.current = false;
    setOpen(false);
    
    // Changer la langue après un court délai
    setTimeout(() => {
      i18n.changeLanguage(langCode);
      localStorage.setItem('emarzona_language', langCode);
      document.documentElement.lang = langCode;
    }, 50);
  }, [i18n]);

  return (
    <DropdownMenu open={open} onOpenChange={setOpen} modal={false}>
      <DropdownMenuTrigger asChild>
        <Button
          variant={variant}
          size="sm"
          className={cn('gap-2 touch-manipulation', buttonClassName)}
          aria-label="Change language"
        >
          <Globe className="h-4 w-4" />
          <span className="text-lg">{currentLanguage.flag}</span>
          {showLabel && (
            <span className="hidden sm:inline">{currentLanguage.name}</span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        ref={menuRef}
        align={isMobile ? "start" : "end"}
        side="bottom"
        sideOffset={8}
        alignOffset={0}
        collisionPadding={isMobile ? 8 : 8}
        avoidCollisions={!isMobile}
        onCloseAutoFocus={(e) => {
          if (isMobile) {
            e.preventDefault();
          }
        }}
        className="min-w-[180px] z-[100]"
      >
        {AVAILABLE_LANGUAGES.map((lang) => (
          <DropdownMenuItem
            key={lang.code}
            onSelect={(e) => {
              e.preventDefault();
              e.stopPropagation();
              changeLanguage(lang.code);
            }}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              changeLanguage(lang.code);
            }}
            className={cn(
              'gap-2 cursor-pointer touch-manipulation min-h-[44px]',
              currentLanguage.code === lang.code && 'bg-accent'
            )}
          >
            <span className="text-lg">{lang.flag}</span>
            <span>{lang.name}</span>
            {currentLanguage.code === lang.code && (
              <span className="ml-auto text-xs text-muted-foreground">✓</span>
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

/**
 * Version compacte avec juste le flag
 */
export const LanguageSwitcherCompact: React.FC<{ className?: string }> = ({ className }) => {
  const { i18n } = useTranslation();
  
  const currentLanguage = AVAILABLE_LANGUAGES.find(
    (lang) => lang.code === i18n.language
  ) || AVAILABLE_LANGUAGES[0];

  const changeLanguage = () => {
    // Toggle entre les langues disponibles
    const currentIndex = AVAILABLE_LANGUAGES.findIndex(
      (lang) => lang.code === currentLanguage.code
    );
    const nextIndex = (currentIndex + 1) % AVAILABLE_LANGUAGES.length;
    const nextLang = AVAILABLE_LANGUAGES[nextIndex];
    
    i18n.changeLanguage(nextLang.code);
    localStorage.setItem('emarzona_language', nextLang.code);
    document.documentElement.lang = nextLang.code;
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={changeLanguage}
      className={cn('gap-2', className)}
      aria-label={`Change language (current: ${currentLanguage.name})`}
    >
      <span className="text-lg">{currentLanguage.flag}</span>
      <span className="text-xs hidden sm:inline">{currentLanguage.code.toUpperCase()}</span>
    </Button>
  );
};

