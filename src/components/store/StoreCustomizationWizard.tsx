/**
 * Store Customization Wizard - Professional
 * Date: 2025-02-02
 *
 * Wizard professionnel avec système de cartes en grille pour la personnalisation de boutique
 * Inspiré de: CreatePhysicalProductWizard
 */

import React, { useMemo, useCallback, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import {
  Info,
  Palette,
  MapPin,
  Search,
  FileText,
  Globe,
  MessageSquare,
  BarChart3,
  Truck,
  Bell,
  CheckCircle2,
  AlertCircle,
  Settings,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';
import type { Store } from '@/hooks/useStores';

// Configuration des étapes de personnalisation
const STEPS = [
  {
    id: 1,
    title: 'Informations',
    description: 'Nom, description, contact',
    icon: Info,
    key: 'settings',
  },
  {
    id: 2,
    title: 'Apparence',
    description: 'Logo, bannière, thème',
    icon: Palette,
    key: 'appearance',
  },
  {
    id: 3,
    title: 'Localisation',
    description: 'Adresse, horaires',
    icon: MapPin,
    key: 'location',
  },
  {
    id: 4,
    title: 'SEO',
    description: 'Référencement',
    icon: Search,
    key: 'seo',
  },
  {
    id: 5,
    title: 'Pages Légales',
    description: 'CGV, confidentialité',
    icon: FileText,
    key: 'legal',
  },
  {
    id: 6,
    title: 'URL',
    description: 'Domaine personnalisé',
    icon: Globe,
    key: 'url',
  },
  {
    id: 7,
    title: 'Marketing',
    description: 'Contenu marketing',
    icon: MessageSquare,
    key: 'marketing',
  },
  {
    id: 8,
    title: 'Analytics',
    description: 'Statistiques',
    icon: BarChart3,
    key: 'analytics',
  },
  {
    id: 9,
    title: 'Commerce',
    description: 'Paramètres commerce',
    icon: Truck,
    key: 'commerce',
  },
  {
    id: 10,
    title: 'Notifications',
    description: 'Alertes et notifications',
    icon: Bell,
    key: 'notifications',
  },
];

interface StoreCustomizationWizardProps {
  store: Store;
  currentTab?: string;
  onTabChange?: (tab: string) => void;
  children?: React.ReactNode;
  renderContent?: (tabKey: string) => React.ReactNode;
  className?: string;
}

export const StoreCustomizationWizard = ({
  store,
  currentTab = 'settings',
  onTabChange,
  children,
  renderContent,
  className,
}: StoreCustomizationWizardProps) => {
  const headerRef = useScrollAnimation<HTMLDivElement>();
  const stepsRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  // Trouver l'étape actuelle basée sur currentTab
  const currentStep = useMemo(() => {
    if (currentTab) {
      const step = STEPS.find(s => s.key === currentTab);
      return step ? step.id : 1;
    }
    return 1;
  }, [currentTab]);

  /**
   * Navigation vers une étape
   */
  const handleStepClick = useCallback(
    (stepId: number) => {
      const step = STEPS.find(s => s.id === stepId);
      if (step && onTabChange) {
        const isSameStep = currentStep === stepId;

        // Changer d'onglet seulement si ce n'est pas la même étape
        if (!isSameStep) {
          onTabChange(step.key);
        }

        // Scroller vers le contenu de l'étape (en bas) avec offset pour le header
        // Utiliser requestAnimationFrame pour une meilleure performance
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            if (contentRef.current) {
              const headerOffset = 80; // Offset pour le header fixe
              const elementPosition = contentRef.current.getBoundingClientRect().top;
              const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

              // Vérifier si l'élément est déjà visible pour éviter les scrolls inutiles
              const isVisible =
                elementPosition >= headerOffset && elementPosition <= window.innerHeight - 100;

              if (!isVisible || !isSameStep) {
                window.scrollTo({
                  top: Math.max(0, offsetPosition),
                  behavior: 'smooth',
                });
              }
            }
          });
        });
      }
    },
    [onTabChange, currentStep]
  );

  /**
   * Calcul du progrès
   */
  const progress = useMemo(() => (currentStep / STEPS.length) * 100, [currentStep]);

  /**
   * Vérifier si une étape est complétée (basé sur les données de la boutique)
   */
  const isStepCompleted = useCallback(
    (stepId: number): boolean => {
      const step = STEPS.find(s => s.id === stepId);
      if (!step) return false;

      switch (step.key) {
        case 'settings':
          return !!(store.name && store.description);
        case 'appearance':
          return !!(store.logo_url || store.banner_url || store.primary_color);
        case 'location':
          return !!(store.address_line1 || store.city || store.country);
        case 'seo':
          return !!(store.meta_title || store.meta_description);
        case 'legal':
          return !!(store.legal_pages?.terms_of_service || store.legal_pages?.privacy_policy);
        case 'url':
          return !!store.slug;
        case 'marketing':
          return !!(store.marketing_content && typeof store.marketing_content === 'object');
        case 'analytics':
          return !!(store.google_analytics_id || store.facebook_pixel_id);
        case 'commerce':
          return true; // Toujours disponible
        case 'notifications':
          return true; // Toujours disponible
        default:
          return false;
      }
    },
    [store]
  );

  /**
   * Vérifier si une étape a des erreurs
   */
  const hasStepErrors = useCallback((): boolean => {
    // Pour l'instant, pas de validation d'erreurs
    // Peut être étendu plus tard
    return false;
  }, []);

  return (
    <div className={cn('w-full space-y-4 sm:space-y-6', className)}>
      {/* Header avec progression */}
      <div ref={headerRef} className="animate-in fade-in slide-in-from-top-4 duration-700">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 mb-4 sm:mb-6">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="p-2 sm:p-3 rounded-lg bg-gradient-to-br from-purple-500/10 to-pink-500/5 backdrop-blur-sm border border-purple-500/20 animate-in zoom-in duration-500">
              <Settings
                className="h-5 w-5 sm:h-6 sm:w-6 text-purple-500 dark:text-purple-400"
                aria-hidden="true"
              />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold mb-1 sm:mb-2">
                Personnalisation de la boutique
              </h2>
              <p className="text-xs sm:text-sm lg:text-base text-muted-foreground">
                Configurez tous les aspects de votre boutique en ligne
              </p>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs sm:text-sm">
            <span className="font-medium">
              Étape {currentStep} sur {STEPS.length}
            </span>
            <span className="text-muted-foreground">{Math.round(progress)}% complété</span>
          </div>
          <Progress value={progress} className="h-1.5 sm:h-2 bg-muted" />
        </div>
      </div>

      {/* Steps Indicator - Grille de cartes */}
      <Card
        ref={stepsRef}
        className="border-border/50 bg-card/50 backdrop-blur-sm shadow-lg animate-in fade-in slide-in-from-bottom-4 duration-700"
      >
        <CardContent className="p-3 sm:p-4 lg:p-6">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 sm:gap-3">
            {STEPS.map((step, index) => {
              const Icon = step.icon;
              const isActive = currentStep === step.id;
              const isCompleted = isStepCompleted(step.id);
              const hasErrors = hasStepErrors();

              return (
                <button
                  key={step.id}
                  onClick={() => handleStepClick(step.id)}
                  role="tab"
                  aria-selected={isActive}
                  aria-label={`Étape ${step.id}: ${step.title}`}
                  className={cn(
                    'relative p-2.5 sm:p-3 rounded-lg border-2 transition-all duration-200 text-left',
                    'hover:shadow-md hover:scale-[1.02] touch-manipulation active:scale-[0.98]',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-2',
                    isActive &&
                      'border-green-500 bg-green-50 dark:bg-green-950/30 shadow-lg scale-[1.02] ring-2 ring-green-500/20',
                    isCompleted &&
                      !isActive &&
                      'border-green-500/50 bg-green-50/50 dark:bg-green-950/20',
                    !isActive &&
                      !isCompleted &&
                      !hasErrors &&
                      'border-border hover:border-green-500/50 bg-card/50',
                    hasErrors && 'border-red-500 bg-red-50 dark:bg-red-950/30',
                    'animate-in fade-in slide-in-from-bottom-4'
                  )}
                  style={{ animationDelay: `${index * 30}ms` }}
                >
                  <div className="flex items-center gap-1.5 sm:gap-2 mb-1">
                    <Icon
                      className={cn(
                        'h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0 transition-colors',
                        isActive
                          ? 'text-green-600 dark:text-green-400'
                          : isCompleted
                            ? 'text-green-600 dark:text-green-400'
                            : hasErrors
                              ? 'text-red-600 dark:text-red-400'
                              : 'text-muted-foreground'
                      )}
                    />
                    {isCompleted && !isActive && (
                      <CheckCircle2
                        className="h-3 w-3 text-green-600 dark:text-green-400 flex-shrink-0 ml-auto"
                        aria-hidden="true"
                      />
                    )}
                    {hasErrors && !isCompleted && (
                      <AlertCircle
                        className="h-3 w-3 text-red-600 dark:text-red-400 flex-shrink-0 ml-auto"
                        aria-hidden="true"
                      />
                    )}
                  </div>
                  <div
                    className={cn(
                      'text-[10px] sm:text-xs font-medium truncate',
                      isActive && 'text-green-600 dark:text-green-400 font-semibold',
                      hasErrors && !isActive && 'text-red-600 dark:text-red-400',
                      !isActive && !hasErrors && 'text-muted-foreground'
                    )}
                  >
                    {step.title}
                  </div>
                  <div className="text-[9px] sm:text-[10px] text-muted-foreground truncate hidden sm:block mt-0.5">
                    {step.description}
                  </div>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Contenu de l'étape actuelle */}
      <Card
        ref={contentRef}
        className="border-border/50 bg-card/50 backdrop-blur-sm shadow-lg animate-in fade-in slide-in-from-bottom-4 duration-500"
        id="wizard-content"
      >
        <CardHeader className="p-3 sm:p-4 lg:p-6">
          <CardTitle className="flex items-center gap-2 sm:gap-3 text-base sm:text-lg lg:text-xl">
            {React.createElement(STEPS[currentStep - 1]?.icon || Info, {
              className: 'h-4 w-4 sm:h-5 sm:w-5',
            })}
            {STEPS[currentStep - 1]?.title || 'Informations'}
          </CardTitle>
          <CardDescription className="text-xs sm:text-sm flex items-center gap-2">
            {STEPS[currentStep - 1]?.description || 'Configurez les paramètres de base'}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-3 sm:p-4 lg:p-6 pt-0">
          {renderContent ? renderContent(currentTab) : children}
        </CardContent>
      </Card>
    </div>
  );
};






