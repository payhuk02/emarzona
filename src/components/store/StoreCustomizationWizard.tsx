/**
 * Store Customization Wizard - Professional
 * Date: 2025-02-02
 *
 * Wizard professionnel avec système de cartes en grille pour la personnalisation de boutique
 * Inspiré de: CreatePhysicalProductWizard
 */

import React, { useMemo, useCallback, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { CheckCircle2, AlertCircle, Settings, Info, Save, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';
import type { Store } from '@/hooks/useStores';
import {
  isStoreCustomizationTabVisible,
  type StoreCustomizationStepKey,
} from '@/lib/commerce/store-customization-steps';
import { resolveStoreCommerceTypeFromStore } from '@/lib/commerce/store-capability-map';
import { useStoreCustomizationSteps } from '@/hooks/store/useStoreCustomizationSteps';
import {
  isAppearanceStepComplete,
  isMarketingContentMeaningful,
} from '@/lib/storefront/store-quality-checklist';
import { StorefrontPublishBanner } from './StorefrontPublishBanner';

const TABS_WITH_INTERNAL_SUBSTEPS = new Set(['legal', 'marketing']);

interface StoreCustomizationWizardProps {
  store: Store;
  currentTab?: string;
  onTabChange?: (tab: string) => void;
  children?: React.ReactNode;
  renderContent?: (tabKey: string) => React.ReactNode;
  className?: string;
  onSave?: () => void | Promise<void>;
  isSubmitting?: boolean;
  hasUnpublishedAppearanceDraft?: boolean;
  onPublishAppearance?: () => void | Promise<void>;
  onSaveAppearanceDraft?: () => void | Promise<void>;
}

export const StoreCustomizationWizard = ({
  store,
  currentTab = 'settings',
  onTabChange,
  children,
  renderContent,
  className,
  onSave,
  isSubmitting = false,
  hasUnpublishedAppearanceDraft = false,
  onPublishAppearance,
  onSaveAppearanceDraft,
}: StoreCustomizationWizardProps) => {
  const { t } = useTranslation();
  const headerRef = useScrollAnimation<HTMLDivElement>();
  const stepsRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const commerceType = resolveStoreCommerceTypeFromStore(store);

  const steps = useStoreCustomizationSteps(commerceType);

  const currentStep = useMemo(() => {
    if (currentTab) {
      const step = steps.find(s => s.key === currentTab);
      return step ? step.id : 1;
    }
    return 1;
  }, [currentTab, steps]);

  useEffect(() => {
    if (!currentTab || !onTabChange) return;
    if (!isStoreCustomizationTabVisible(currentTab as StoreCustomizationStepKey, commerceType)) {
      onTabChange('settings');
    }
  }, [commerceType, currentTab, onTabChange]);

  const handleStepClick = useCallback(
    (stepId: number) => {
      const step = steps.find(s => s.id === stepId);
      if (step && onTabChange) {
        const isSameStep = currentStep === stepId;

        if (!isSameStep) {
          onTabChange(step.key);
        }

        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            if (contentRef.current) {
              const headerOffset = 80;
              const elementPosition = contentRef.current.getBoundingClientRect().top;
              const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

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
    [onTabChange, currentStep, steps]
  );

  const handleSaveAndContinue = useCallback(async () => {
    if (onSave) {
      await onSave();
    }
    if (onTabChange && currentStep < steps.length) {
      const nextStep = steps.find(s => s.id === currentStep + 1);
      if (nextStep) {
        handleStepClick(nextStep.id);
      }
    }
  }, [onSave, onTabChange, currentStep, steps, handleStepClick]);

  const showSaveFooter =
    !!onSave &&
    !TABS_WITH_INTERNAL_SUBSTEPS.has(currentTab) &&
    currentTab !== 'appearance' &&
    currentTab !== 'url' &&
    currentTab !== 'commerce' &&
    currentTab !== 'notifications';

  const isLastStep = currentStep >= steps.length;

  const progress = useMemo(
    () => (steps.length > 0 ? (currentStep / steps.length) * 100 : 0),
    [currentStep, steps.length]
  );

  const isStepCompleted = useCallback(
    (stepId: number): boolean => {
      const step = steps.find(s => s.id === stepId);
      if (!step) return false;

      switch (step.key) {
        case 'settings':
          return !!(store.name && store.description);
        case 'appearance':
          return isAppearanceStepComplete(store);
        case 'location':
          return !!(store.address_line1 || store.city || store.country);
        case 'seo':
          return !!(store.meta_title || store.meta_description);
        case 'legal':
          return !!(store.legal_pages?.terms_of_service || store.legal_pages?.privacy_policy);
        case 'url':
          return !!store.slug;
        case 'marketing':
          return isMarketingContentMeaningful(store.marketing_content);
        case 'analytics':
          return !!(store.google_analytics_id || store.facebook_pixel_id);
        case 'commerce':
          return !!(store.free_shipping_threshold != null || store.minimum_order_amount != null);
        case 'notifications':
          return true;
        default:
          return false;
      }
    },
    [store, steps]
  );

  const hasStepErrors = useCallback((): boolean => false, []);

  const activeStep = steps[currentStep - 1];

  return (
    <div className={cn('w-full space-y-4 sm:space-y-6', className)}>
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
                {t('store.customization.title')}
              </h2>
              <p className="text-xs sm:text-sm lg:text-base text-muted-foreground">
                {t('store.customization.subtitle')}
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs sm:text-sm">
            <span className="font-medium">
              {t('store.customization.stepOf', { current: currentStep, total: steps.length })}
            </span>
            <span className="text-muted-foreground">
              {t('store.customization.progressComplete', { percent: Math.round(progress) })}
            </span>
          </div>
          <Progress value={progress} className="h-1.5 sm:h-2 bg-muted" />
        </div>
      </div>

      <Card
        ref={stepsRef}
        className="border-border/50 bg-card/50 backdrop-blur-sm shadow-lg animate-in fade-in slide-in-from-bottom-4 duration-700"
      >
        <CardContent className="p-3 sm:p-4 lg:p-6">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 sm:gap-3">
            {steps.map((step, index) => {
              const Icon = step.icon;
              const isActive = currentStep === step.id;
              const isCompleted = isStepCompleted(step.id);
              const hasErrors = hasStepErrors();

              return (
                <button
                  key={step.key}
                  onClick={() => handleStepClick(step.id)}
                  role="tab"
                  aria-selected={isActive}
                  aria-label={t('store.customization.stepAriaLabel', {
                    id: step.id,
                    title: step.title,
                  })}
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

      <StorefrontPublishBanner
        currentTab={currentTab}
        hasUnpublishedAppearanceDraft={hasUnpublishedAppearanceDraft}
        isSubmitting={isSubmitting}
        onSaveAppearanceDraft={onSaveAppearanceDraft}
        onPublishAppearance={onPublishAppearance}
      />

      <Card
        ref={contentRef}
        className="border-border/50 bg-card/50 backdrop-blur-sm shadow-lg animate-in fade-in slide-in-from-bottom-4 duration-500"
        id="wizard-content"
      >
        <CardHeader className="p-3 sm:p-4 lg:p-6">
          <CardTitle className="flex items-center gap-2 sm:gap-3 text-base sm:text-lg lg:text-xl">
            {React.createElement(activeStep?.icon || Info, {
              className: 'h-4 w-4 sm:h-5 sm:w-5',
            })}
            {activeStep?.title || t('store.customization.defaultStepTitle')}
          </CardTitle>
          <CardDescription className="text-xs sm:text-sm flex items-center gap-2">
            {activeStep?.description || t('store.customization.defaultStepDescription')}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-3 sm:p-4 lg:p-6 pt-0">
          {renderContent ? renderContent(currentTab) : children}
          {showSaveFooter && (
            <div className="flex justify-end pt-4 mt-4 border-t">
              <Button
                onClick={() => void handleSaveAndContinue()}
                className="gap-2"
                disabled={isSubmitting}
              >
                <Save className="h-4 w-4" />
                {isSubmitting
                  ? t('store.customization.saving')
                  : isLastStep
                    ? t('store.customization.save')
                    : t('store.customization.saveAndContinue')}
                {!isLastStep && !isSubmitting && <ChevronRight className="h-4 w-4" />}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
