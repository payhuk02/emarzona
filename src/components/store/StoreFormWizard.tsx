/**
 * Wizard multi-étapes pour la création de boutique
 * Améliore l'UX en divisant le formulaire complexe en étapes logiques
 */

import { useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { 
  CheckCircle2, 
  Info,
  Image as ImageIcon,
  Globe,
  Palette,
  Search,
  MapPin,
  FileText,
  BarChart3,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import StoreForm from './StoreForm';
import type { Store } from '@/hooks/useStores';

interface StoreFormWizardProps {
  onSuccess: () => void;
  initialData?: Partial<Store>;
}

const STEPS = [
  {
    id: 1,
    title: 'Informations de base',
    description: 'Nom, description et devise',
    icon: Info,
    key: 'basic',
  },
  {
    id: 2,
    title: 'Image & Design',
    description: 'Logo, bannière et images',
    icon: ImageIcon,
    key: 'branding',
  },
  {
    id: 3,
    title: 'Contact & Réseaux',
    description: 'Coordonnées et réseaux sociaux',
    icon: Globe,
    key: 'contact',
  },
  {
    id: 4,
    title: 'Thème',
    description: 'Couleurs et apparence',
    icon: Palette,
    key: 'theme',
  },
  {
    id: 5,
    title: 'SEO',
    description: 'Référencement et métadonnées',
    icon: Search,
    key: 'seo',
  },
  {
    id: 6,
    title: 'Localisation',
    description: 'Adresse et horaires',
    icon: MapPin,
    key: 'location',
  },
  {
    id: 7,
    title: 'Pages légales',
    description: 'CGV, CGU et mentions légales',
    icon: FileText,
    key: 'legal',
  },
  {
    id: 8,
    title: 'Analytics',
    description: 'Tracking et statistiques',
    icon: BarChart3,
    key: 'analytics',
  },
];

export const StoreFormWizard = ({ onSuccess, initialData }: StoreFormWizardProps) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  const [formSubmitted, setFormSubmitted] = useState(false);

  const progress = (currentStep / STEPS.length) * 100;

  const goToNextStep = useCallback(() => {
    if (currentStep < STEPS.length) {
      setCurrentStep(currentStep + 1);
      setCompletedSteps(prev => new Set([...prev, currentStep]));
    }
  }, [currentStep]);

  const goToPreviousStep = useCallback(() => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  }, [currentStep]);

  const goToStep = useCallback((step: number) => {
    if (step >= 1 && step <= STEPS.length) {
      setCurrentStep(step);
    }
  }, []);

  const handleFormSuccess = useCallback(() => {
    setFormSubmitted(true);
    onSuccess();
  }, [onSuccess]);

  const isStepCompleted = (stepId: number) => completedSteps.has(stepId);
  const isStepActive = (stepId: number) => currentStep === stepId;
  const canGoToStep = (stepId: number) => {
    // Peut aller à une étape si elle est complétée ou si c'est la suivante
    return isStepCompleted(stepId) || stepId === currentStep + 1 || stepId <= currentStep;
  };

  if (formSubmitted) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-12">
            <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h3 className="text-2xl font-bold mb-2">Boutique créée avec succès !</h3>
            <p className="text-muted-foreground">
              Votre boutique a été créée et configurée avec succès.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header avec progression */}
      <Card>
        <CardHeader>
          <CardTitle>Créer votre boutique</CardTitle>
          <CardDescription>
            Configurez votre boutique en suivant les étapes ci-dessous
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Barre de progression */}
          <div className="mb-6">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium">
                Étape {currentStep} sur {STEPS.length}
              </span>
              <span className="text-sm text-muted-foreground">{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>

          {/* Liste des étapes */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2 sm:gap-4">
            {STEPS.map((step) => {
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
                    "flex flex-col items-center gap-2 p-3 sm:p-4 rounded-lg transition-all",
                    "hover:bg-muted/50",
                    active && "bg-primary/10 border-2 border-primary",
                    !active && !accessible && "opacity-50 cursor-not-allowed",
                    accessible && !active && "cursor-pointer"
                  )}
                >
                  <div className={cn(
                    "relative flex items-center justify-center",
                    completed && "text-green-500",
                    active && "text-primary",
                    !completed && !active && "text-muted-foreground"
                  )}>
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
                    <div className={cn(
                      "text-xs sm:text-sm font-medium",
                      active && "text-primary"
                    )}>
                      {step.title}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Formulaire avec navigation */}
      <div className="space-y-4">
        <StoreForm
          onSuccess={handleFormSuccess}
          initialData={initialData}
          wizardMode={true}
          wizardStep={STEPS[currentStep - 1]?.key}
          onNextStep={currentStep < STEPS.length ? goToNextStep : undefined}
          onPreviousStep={currentStep > 1 ? goToPreviousStep : undefined}
          currentStep={currentStep}
          totalSteps={STEPS.length}
        />
      </div>
    </div>
  );
};

export default StoreFormWizard;

