/**
 * Composant pour changer de langue
 * Affiche un bouton avec un dropdown pour sélectionner la langue
 */

import React, { useState, useCallback } from 'react';
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
  
  const currentLanguage = AVAILABLE_LANGUAGES.find(
    (lang) => lang.code === i18n.language
  ) || AVAILABLE_LANGUAGES[0];

  const changeLanguage = useCallback((langCode: LanguageCode) => {
    // Changer la langue immédiatement
    i18n.changeLanguage(langCode);
    localStorage.setItem('emarzona_language', langCode);
    document.documentElement.lang = langCode;
    
    // Fermer le menu après un court délai pour permettre la mise à jour
    setTimeout(() => {
      setOpen(false);
    }, 150);
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
        align={isMobile ? "start" : "end"}
        side="bottom"
        sideOffset={8}
        alignOffset={0}
        collisionPadding={isMobile ? 8 : 8}
        avoidCollisions={true}
        onCloseAutoFocus={(e) => {
          // Empêcher le focus automatique qui peut causer le repositionnement
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

