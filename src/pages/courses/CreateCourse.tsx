import { lazy, Suspense, useState } from 'react';
import { AppPageShell } from '@/components/layout/AppPageShell';
import { useTranslation } from 'react-i18next';
import { GraduationCap, ArrowLeft, Sparkles, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';
import { FormErrorBoundary } from '@/components/errors/FormErrorBoundary';

const CreateCourseWizard = lazy(() =>
  import('@/components/courses/create/CreateCourseWizard').then(m => ({
    default: m.CreateCourseWizard,
  }))
);

const CreateCourse = () => {
  const { t } = useTranslation();
  // Animations au scroll
  const headerRef = useScrollAnimation<HTMLDivElement>();
  const [showTemplateSelector, setShowTemplateSelector] = useState(false);

  return (
    <AppPageShell>
      <div className="container mx-auto p-3 sm:p-4 lg:p-6 space-y-4 sm:space-y-6">
        {/* Header avec animation - Style Inventaire et Mes Cours */}
        <div
          ref={headerRef}
          className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 animate-in fade-in slide-in-from-top-4 duration-700"
        >
          <div className="flex-1">
            {/* Bouton retour - Style responsive */}
            <Button
              variant="ghost"
              size="sm"
              asChild
              className="mb-3 sm:mb-4 h-8 sm:h-9 text-xs sm:text-sm hover:bg-muted"
            >
              <Link to="/dashboard/products">
                <ArrowLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
                <span className="hidden sm:inline">{t('courses.create.backToProducts')}</span>
                <span className="sm:hidden">{t('common.back')}</span>
              </Link>
            </Button>

            {/* Titre avec icône - Style Inventaire et Mes Cours */}
            <div>
              <h1 className="text-base sm:text-lg md:text-xl lg:text-2xl xl:text-3xl font-bold flex items-center gap-2 mb-1 sm:mb-2">
                <div className="p-1.5 sm:p-2 rounded-lg bg-gradient-to-br from-purple-500/10 to-pink-500/5 backdrop-blur-sm border border-purple-500/20 animate-in zoom-in duration-500">
                  <GraduationCap
                    className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6 text-purple-500 dark:text-purple-400"
                    aria-hidden="true"
                  />
                </div>
                <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                  {t('courses.create.title')}
                </span>
              </h1>
              <p className="text-[9px] sm:text-[10px] md:text-xs lg:text-sm text-muted-foreground">
                {t('courses.create.description')}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* Bouton Template - Style Inventaire */}
            <Button
              variant="outline"
              onClick={() => setShowTemplateSelector(true)}
              className="h-9 sm:h-10 transition-all hover:scale-105 border-2 border-purple-500/20 hover:border-purple-500 hover:bg-purple-500/5 text-xs sm:text-sm"
              size="sm"
              aria-label={t('courses.create.useTemplate')}
            >
              <Sparkles className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2 text-purple-500" />
              <span className="hidden sm:inline">{t('courses.create.useTemplate')}</span>
              <span className="sm:hidden">{t('courses.create.useTemplateShort')}</span>
            </Button>
          </div>
        </div>

        {/* Wizard - Header caché car déjà affiché dans la page */}
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 delay-200">
          <FormErrorBoundary formName="Création cours en ligne">
            <Suspense
              fallback={
                <div className="flex min-h-[40vh] items-center justify-center">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" aria-hidden />
                  <span className="sr-only">{t('wizard.loading', 'Chargement du wizard...')}</span>
                </div>
              }
            >
              <CreateCourseWizard
                hideHeader={true}
                templateSelectorOpen={showTemplateSelector}
                onTemplateSelectorOpenChange={setShowTemplateSelector}
              />
            </Suspense>
          </FormErrorBoundary>
        </div>
      </div>
    </AppPageShell>
  );
};

export default CreateCourse;
