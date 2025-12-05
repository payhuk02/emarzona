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
    if (!open || !menuRef.current || !isMobile) {
      positionLocked.current = false;
      return;
    }

    const menu = menuRef.current;
    let rafId: number | null = null;
    let mutationObserver: MutationObserver | null = null;
    let styleObserver: MutationObserver | null = null;
    
    // Fonction pour verrouiller la position de manière agressive
    const lockPosition = () => {
      const rect = menu.getBoundingClientRect();
      
      if (rect.top > 0 && rect.left > 0 && rect.width > 0) {
        // Trouver le bouton trigger de manière plus robuste
        // Essayer plusieurs sélecteurs possibles
        let triggerButton = document.querySelector('[data-radix-dropdown-menu-trigger]') as HTMLElement;
        if (!triggerButton) {
          // Chercher le bouton parent via le menu
          const menuParent = menu.closest('[data-radix-popper-content-wrapper]');
          if (menuParent) {
            const trigger = menuParent.previousElementSibling as HTMLElement;
            if (trigger && trigger.tagName === 'BUTTON') {
              triggerButton = trigger;
            }
          }
        }
        
        let finalTop = rect.top;
        let finalLeft = rect.left;
        const savedWidth = rect.width;
        const savedHeight = rect.height;
        
        // Si on trouve le bouton, calculer la position optimale
        if (triggerButton) {
          const buttonRect = triggerButton.getBoundingClientRect();
          
          // Positionner le menu juste en dessous du bouton, aligné à droite
          finalTop = buttonRect.bottom + 4; // sideOffset
          finalLeft = buttonRect.right - savedWidth; // Aligné à droite
          
          // S'assurer que le menu ne dépasse pas de l'écran à droite
          if (finalLeft < 8) {
            finalLeft = 8;
          }
          // S'assurer que le menu ne dépasse pas de l'écran à gauche
          if (finalLeft + savedWidth > window.innerWidth - 8) {
            finalLeft = window.innerWidth - savedWidth - 8;
          }
          
          // S'assurer que le menu ne dépasse pas en bas
          if (finalTop + savedHeight > window.innerHeight - 8) {
            finalTop = buttonRect.top - savedHeight - 4; // Afficher au-dessus si nécessaire
          }
          
          // S'assurer que le menu ne dépasse pas en haut
          if (finalTop < 8) {
            finalTop = 8;
          }
        } else {
          // Fallback : utiliser la position actuelle mais s'assurer qu'elle est dans les limites
          finalTop = rect.top;
          finalLeft = rect.left;
          
          // Ajuster pour rester dans les limites de l'écran
          if (finalLeft < 8) finalLeft = 8;
          if (finalLeft + savedWidth > window.innerWidth - 8) {
            finalLeft = window.innerWidth - savedWidth - 8;
          }
          if (finalTop < 8) finalTop = 8;
          if (finalTop + savedHeight > window.innerHeight - 8) {
            finalTop = window.innerHeight - savedHeight - 8;
          }
        }
        
        positionLocked.current = true;
        
        // Appliquer les styles de verrouillage ultra-stricts
        const lockStyles = `
          position: fixed !important;
          top: ${finalTop}px !important;
          left: ${finalLeft}px !important;
          width: ${savedWidth}px !important;
          min-width: ${savedWidth}px !important;
          max-width: ${savedWidth}px !important;
          height: ${savedHeight}px !important;
          transform: none !important;
          translate: none !important;
          margin: 0 !important;
          padding: 0 !important;
          will-change: auto !important;
          contain: layout style paint !important;
          isolation: isolate !important;
          touch-action: none !important;
          z-index: 100 !important;
        `;
        
        // Appliquer directement sur l'élément
        menu.style.cssText = lockStyles;
        
        // Créer un style tag pour forcer les styles même si Radix UI essaie de les changer
        let styleTag = document.getElementById('language-switcher-lock-styles');
        if (!styleTag) {
          styleTag = document.createElement('style');
          styleTag.id = 'language-switcher-lock-styles';
          document.head.appendChild(styleTag);
        }
        
        const styleId = `lang-menu-${Date.now()}`;
        menu.setAttribute('data-lock-id', styleId);
        styleTag.textContent = `
          [data-lock-id="${styleId}"] {
            position: fixed !important;
            top: ${finalTop}px !important;
            left: ${finalLeft}px !important;
            width: ${savedWidth}px !important;
            min-width: ${savedWidth}px !important;
            max-width: ${savedWidth}px !important;
            transform: none !important;
            translate: none !important;
            margin: 0 !important;
            will-change: auto !important;
            touch-action: none !important;
            z-index: 100 !important;
          }
        `;
        
        // Observer les changements de style pour maintenir la position
        mutationObserver = new MutationObserver((mutations) => {
          if (positionLocked.current && menu) {
            let shouldRestore = false;
            mutations.forEach((mutation) => {
              if (mutation.type === 'attributes' && mutation.attributeName === 'style') {
                const currentRect = menu.getBoundingClientRect();
                if (
                  Math.abs(currentRect.top - finalTop) > 0.5 ||
                  Math.abs(currentRect.left - finalLeft) > 0.5
                ) {
                  shouldRestore = true;
                }
              }
            });
            if (shouldRestore) {
              menu.style.cssText = lockStyles;
            }
          }
        });
        
        mutationObserver.observe(menu, {
          attributes: true,
          attributeFilter: ['style', 'class', 'data-radix-popper-content-wrapper'],
          childList: false,
          subtree: false,
        });
        
        // Observer aussi le parent si Radix UI le change
        if (menu.parentElement) {
          styleObserver = new MutationObserver(() => {
            if (positionLocked.current && menu) {
              const currentRect = menu.getBoundingClientRect();
              if (
                Math.abs(currentRect.top - finalTop) > 0.5 ||
                Math.abs(currentRect.left - finalLeft) > 0.5
              ) {
                menu.style.cssText = lockStyles;
              }
            }
          });
          
          styleObserver.observe(menu.parentElement, {
            attributes: true,
            attributeFilter: ['style', 'class'],
            childList: false,
            subtree: false,
          });
        }
        
        // Surveiller avec requestAnimationFrame pour une protection continue
        const checkPosition = () => {
          if (positionLocked.current && menu) {
            const currentRect = menu.getBoundingClientRect();
            if (
              Math.abs(currentRect.top - finalTop) > 0.5 ||
              Math.abs(currentRect.left - finalLeft) > 0.5 ||
              Math.abs(currentRect.width - savedWidth) > 1
            ) {
              menu.style.cssText = lockStyles;
            }
            rafId = requestAnimationFrame(checkPosition);
          }
        };
        rafId = requestAnimationFrame(checkPosition);
      }
    };
    
    // Attendre que Radix UI ait fini de positionner le menu avant de verrouiller
    // Cela évite les "sursauts" en haut à droite
    const timeoutId = setTimeout(lockPosition, 100);
    const timeoutId2 = setTimeout(lockPosition, 200);
    const timeoutId3 = setTimeout(lockPosition, 400);

    return () => {
      clearTimeout(timeoutId);
      clearTimeout(timeoutId2);
      clearTimeout(timeoutId3);
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
      }
      if (mutationObserver) {
        mutationObserver.disconnect();
      }
      if (styleObserver) {
        styleObserver.disconnect();
      }
      positionLocked.current = false;
      if (menu) {
        menu.style.cssText = '';
        menu.removeAttribute('data-lock-id');
      }
      // Nettoyer le style tag
      const styleTag = document.getElementById('language-switcher-lock-styles');
      if (styleTag) {
        styleTag.remove();
      }
    };
  }, [open, isMobile]);

  const changeLanguage = useCallback((langCode: LanguageCode) => {
    // Sur mobile, déverrouiller la position avant de fermer
    if (isMobile) {
      positionLocked.current = false;
      // Nettoyer les styles de verrouillage
      if (menuRef.current) {
        menuRef.current.style.cssText = '';
      }
    }
    
    // Fermer le menu
    setOpen(false);
    
    // Changer la langue après un court délai pour éviter les conflits
    setTimeout(() => {
      i18n.changeLanguage(langCode);
      localStorage.setItem('emarzona_language', langCode);
      document.documentElement.lang = langCode;
    }, isMobile ? 150 : 50);
  }, [i18n, isMobile]);

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
        align="end"
        side="bottom"
        sideOffset={isMobile ? 4 : 8}
        alignOffset={isMobile ? 0 : 0}
        collisionPadding={isMobile ? { top: 8, bottom: 8, left: 8, right: 8 } : 8}
        avoidCollisions={isMobile ? false : true}
        sticky={isMobile ? "always" : "partial"}
        onCloseAutoFocus={(e) => {
          if (isMobile) {
            e.preventDefault();
          }
        }}
        onPointerDownOutside={(e) => {
          // Empêcher la fermeture accidentelle quand le menu est verrouillé
          if (positionLocked.current && isMobile) {
            const target = e.target as HTMLElement;
            if (menuRef.current?.contains(target)) {
              e.preventDefault();
            }
          }
        }}
        onInteractOutside={(e) => {
          // Empêcher la fermeture accidentelle quand le menu est verrouillé
          if (positionLocked.current && isMobile) {
            const target = e.target as HTMLElement;
            if (menuRef.current?.contains(target)) {
              e.preventDefault();
            }
          }
        }}
        className={cn(
          "min-w-[180px] z-[100]",
          isMobile && "!fixed",
          positionLocked.current && isMobile && "!pointer-events-auto !touch-none",
          className
        )}
        style={positionLocked.current && isMobile ? {
          position: 'fixed',
          willChange: 'auto',
          contain: 'layout style paint',
          isolation: 'isolate',
          touchAction: 'none',
        } : undefined}
      >
        {AVAILABLE_LANGUAGES.map((lang) => (
          <DropdownMenuItem
            key={lang.code}
            onSelect={(e) => {
              e.preventDefault();
              if (isMobile) {
                // Sur mobile, attendre un peu pour que le menu reste stable
                setTimeout(() => {
                  changeLanguage(lang.code);
                }, 100);
              } else {
                changeLanguage(lang.code);
              }
            }}
            onClick={(e) => {
              e.preventDefault();
              if (isMobile) {
                // Sur mobile, attendre un peu pour que le menu reste stable
                setTimeout(() => {
                  changeLanguage(lang.code);
                }, 100);
              } else {
                changeLanguage(lang.code);
              }
            }}
            onTouchStart={(e) => {
              // Sur mobile, empêcher le scroll mais permettre le clic
              if (isMobile && positionLocked.current) {
                e.stopPropagation();
              }
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

