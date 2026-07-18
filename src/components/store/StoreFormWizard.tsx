/**
 * Wizard multi-étapes pour la création de boutique
 */

import { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import StoreForm from './StoreForm';
import type { Store } from '@/hooks/useStores';
import { useStoreWizardSteps } from '@/hooks/store/useStoreWizardSteps';

interface StoreFormWizardProps {
  onSuccess: () => void;
  initialData?: Partial<Store>;
}

export const StoreFormWizard = ({ onSuccess, initialData }: StoreFormWizardProps) => {
  const { t } = useTranslation();
  const steps = useStoreWizardSteps();
  const [currentStep, setCurrentStep] = useState(1);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  const [formSubmitted, setFormSubmitted] = useState(false);

  const progress = (currentStep / steps.length) * 100;

  const goToNextStep = useCallback(() => {
    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1);
      setCompletedSteps(prev => new Set([...prev, currentStep]));
    }
  }, [currentStep, steps.length]);

  const goToPreviousStep = useCallback(() => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  }, [currentStep]);

  const goToStep = useCallback(
    (step: number) => {
      if (step >= 1 && step <= steps.length) {
        setCurrentStep(step);
      }
    },
    [steps.length]
  );

  const handleFormSuccess = useCallback(() => {
    setFormSubmitted(true);
    onSuccess();
  }, [onSuccess]);

  const isStepCompleted = (stepId: number) => completedSteps.has(stepId);
  const isStepActive = (stepId: number) => currentStep === stepId;
  const canGoToStep = (stepId: number) =>
    isStepCompleted(stepId) || stepId === currentStep + 1 || stepId <= currentStep;

  if (formSubmitted) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-12">
            <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h3 className="text-2xl font-bold mb-2">{t('store.wizard.successTitle')}</h3>
            <p className="text-muted-foreground">{t('store.wizard.successDescription')}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{t('store.wizard.title')}</CardTitle>
          <CardDescription>{t('store.wizard.subtitle')}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-6">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium">
                {t('store.wizard.stepOf', { current: currentStep, total: steps.length })}
              </span>
              <span className="text-sm text-muted-foreground">{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2 sm:gap-4">
            {steps.map(step => {
              const Icon = step.icon;
              const completed = isStepCompleted(step.id);
              const active = isStepActive(step.id);
              const accessible = canGoToStep(step.id);

              return (
                <button
                  key={step.id}
                  onClick={() => accessible && goToStep(step.id)}
                  disabled={!accessible}
                  className={cn(
                    'flex flex-col items-center gap-2 p-3 sm:p-4 rounded-lg transition-all',
                    'hover:bg-muted/50',
                    active && 'bg-primary/10 border-2 border-primary',
                    !active && !accessible && 'opacity-50 cursor-not-allowed',
                    accessible && !active && 'cursor-pointer'
                  )}
                >
                  <div
                    className={cn(
                      'relative flex items-center justify-center',
                      completed && 'text-green-500',
                      active && 'text-primary',
                      !completed && !active && 'text-muted-foreground'
                    )}
                  >
                    {completed ? (
                      <CheckCircle2 className="h-6 w-6 sm:h-8 sm:w-8" />
                    ) : (
                      <Icon className="h-6 w-6 sm:h-8 sm:w-8" />
                    )}
                    {active && (
                      <div className="absolute -bottom-1 -right-1 h-3 w-3 bg-primary rounded-full border-2 border-background" />
                    )}
                  </div>
                  <div className="text-center">
                    <div className={cn('text-xs sm:text-sm font-medium', active && 'text-primary')}>
                      {step.title}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <StoreForm
          onSuccess={handleFormSuccess}
          initialData={initialData}
          wizardMode={true}
          wizardStep={steps[currentStep - 1]?.key}
          onNextStep={currentStep < steps.length ? goToNextStep : undefined}
          onPreviousStep={currentStep > 1 ? goToPreviousStep : undefined}
          currentStep={currentStep}
          totalSteps={steps.length}
        />
      </div>
    </div>
  );
};

export default StoreFormWizard;
