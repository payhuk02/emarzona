/**
 * Composant pour changer de langue
 * Affiche un bouton avec un dropdown pour sélectionner la langue
 * Optimisé pour mobile avec positionnement stable
 */

import React, { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Globe } from '@/components/icons';
import { Loader2 } from 'lucide-react';
import { MobileDropdown, DropdownMenuItem } from '@/components/ui/mobile-dropdown';
import { Button } from '@/components/ui/button';
import { AVAILABLE_LANGUAGES, type LanguageCode } from '@/i18n/config';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { MOBILE_SIDE_OFFSET, DESKTOP_SIDE_OFFSET } from '@/constants/mobile';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useBodyScrollLock } from '@/hooks/use-body-scroll-lock';

interface LanguageSwitcherProps {
  className?: string;
  buttonClassName?: string;
  variant?: 'default' | 'ghost' | 'outline';
  showLabel?: boolean;
  /**
   * État contrôlé d'ouverture du menu
   */
  open?: boolean;
  /**
   * Callback quand l'état d'ouverture change
   */
  onOpenChange?: (open: boolean) => void;
}

export const LanguageSwitcher: React.FC<LanguageSwitcherProps> = ({
  className,
  buttonClassName,
  variant = 'ghost',
  showLabel = false,
  open: controlledOpen,
  onOpenChange,
}) => {
  const { i18n } = useTranslation();
  const isMobile = useIsMobile();
  const [internalOpen, setInternalOpen] = useState(false);
  const [isChanging, setIsChanging] = useState(false);

  const open = controlledOpen !== undefined ? controlledOpen : internalOpen;
  // Verrouiller le scroll de fond quand le sélecteur est ouvert sur mobile
  useBodyScrollLock(isMobile && open);

  const handleOpenChange = (newOpen: boolean) => {
    if (controlledOpen === undefined) {
      setInternalOpen(newOpen);
    }
    onOpenChange?.(newOpen);
  };

  const currentLanguage =
    AVAILABLE_LANGUAGES.find(lang => lang.code === i18n.language) || AVAILABLE_LANGUAGES[0];

  const changeLanguage = useCallback(
    (langCode: LanguageCode) => {
      // Prévenir les doubles clics / taps
      if (isChanging) return;

      setIsChanging(true);
      handleOpenChange(false);

      // Changement immédiat (pas de délai artificiel)
      i18n.changeLanguage(langCode);
      localStorage.setItem('emarzona_language', langCode);
      document.documentElement.lang = langCode;

      // Réactiver après un court délai pour le feedback visuel
      setTimeout(() => {
        setIsChanging(false);
      }, 150);
    },
    [i18n, isChanging, handleOpenChange]
  );

  const triggerButton = (
    <Button
      variant={variant}
      size="sm"
      className={cn('gap-2 touch-manipulation', buttonClassName)}
      aria-label={`Change language (current: ${currentLanguage.name})`}
      aria-haspopup={isMobile ? 'dialog' : 'menu'}
      aria-expanded={open}
      disabled={isChanging}
      onClick={() => handleOpenChange(!open)}
    >
      {isChanging ? (
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
      ) : (
        <Globe className="h-4 w-4" aria-hidden="true" />
      )}
      <span className="text-lg" aria-hidden="true">
        {currentLanguage.flag}
      </span>
      {showLabel && <span className="hidden sm:inline">{currentLanguage.name}</span>}
    </Button>
  );

  // Sur mobile, utiliser un vrai bottom sheet basé sur Dialog (comme pour d'autres overlays critiques)
  if (isMobile) {
    return (
      <>
        {triggerButton}
        <Dialog open={open} onOpenChange={handleOpenChange}>
          <DialogContent className="p-0 pt-3 pb-4 bg-background">
            <DialogHeader className="px-4">
              <DialogTitle className="text-base font-semibold">Choisir la langue</DialogTitle>
            </DialogHeader>
            <div className="mt-2 divide-y">
              {AVAILABLE_LANGUAGES.map(lang => (
                <button
                  key={lang.code}
                  type="button"
                  onClick={() => changeLanguage(lang.code)}
                  className={cn(
                    'w-full flex items-center gap-3 px-4 py-3 text-base min-h-[48px]',
                    'touch-manipulation text-left',
                    currentLanguage.code === lang.code && 'bg-accent/70'
                  )}
                >
                  <span className="text-xl">{lang.flag}</span>
                  <span className="flex-1">{lang.name}</span>
                  {currentLanguage.code === lang.code && (
                    <span className="ml-auto text-xs text-muted-foreground">✓</span>
                  )}
                </button>
              ))}
            </div>
          </DialogContent>
        </Dialog>
      </>
    );
  }

  // Desktop / tablette : dropdown classique ancré au trigger
  return (
    <MobileDropdown
      trigger={triggerButton}
      align="end"
      side="bottom"
      sideOffset={isMobile ? MOBILE_SIDE_OFFSET : DESKTOP_SIDE_OFFSET}
      width={180}
      open={open}
      onOpenChange={handleOpenChange}
      className={className}
      contentClassName="min-w-[180px]"
    >
      {AVAILABLE_LANGUAGES.map(lang => (
        <DropdownMenuItem
          key={lang.code}
          onSelect={() => {
            // onSelect est appelé automatiquement par Radix UI, pas besoin de preventDefault
            changeLanguage(lang.code);
          }}
          className={cn(
            'gap-2 cursor-pointer touch-manipulation min-h-[44px]',
            'select-none',
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
    </MobileDropdown>
  );
};

/**
 * Version compacte avec juste le flag
 */
export const LanguageSwitcherCompact : React.FC<{ className?: string }> = ({ className }) => {
  const { i18n } = useTranslation();

  const currentLanguage =
    AVAILABLE_LANGUAGES.find(lang => lang.code === i18n.language) || AVAILABLE_LANGUAGES[0];

  const changeLanguage = () => {
    // Toggle entre les langues disponibles
    const currentIndex = AVAILABLE_LANGUAGES.findIndex(lang => lang.code === currentLanguage.code);
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
      className={cn('gap-2 touch-manipulation', className)}
      aria-label={`Change language (current: ${currentLanguage.name})`}
    >
      <span className="text-lg">{currentLanguage.flag}</span>
      <span className="text-xs hidden sm:inline">{currentLanguage.code.toUpperCase()}</span>
    </Button>
  );
};







