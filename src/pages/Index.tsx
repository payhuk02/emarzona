import { useTranslation } from 'react-i18next';

/**
 * Page d'accueil principale
 * Optimisée pour mobile-first avec responsive design
 */
const Index = () => {
  const { t } = useTranslation();
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 sm:px-6 lg:px-8">
      <div className="text-center w-full max-w-2xl mx-auto">
        <h1 className="mb-3 sm:mb-4 text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold">
          {t('common.welcome', 'Welcome')}
        </h1>
        <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-muted-foreground">
          {t('common.startBuilding', 'Start building your amazing project here!')}
        </p>
      </div>
    </div>
  );
};

export default Index;
