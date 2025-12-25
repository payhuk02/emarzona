/**
 * Product Creation Router - Professional & Optimized
 * Date: 2025-01-01
 *
 * Point d'entrée unifié pour la création de produits.
 * Route automatiquement vers le wizard approprié selon le type.
 * Version optimisée avec design professionnel, responsive et fonctionnalités avancées.
 */

import { useState, lazy, Suspense, useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, ArrowLeft } from 'lucide-react';
import { EnhancedProductTypeSelector } from './EnhancedProductTypeSelector';
import { logger } from '@/lib/logger';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';
import type { ProductTemplate, ProductType } from '@/lib/products/product-templates';
import { useNavigate } from 'react-router-dom';

// Lazy loading des wizards pour optimiser les performances
const CreateCourseWizard = lazy(() =>
  import('../courses/create/CreateCourseWizard').then(m => ({ default: m.CreateCourseWizard }))
);

// V2 : Wizard avec 6 étapes (SEO + FAQs intégrés)
const CreateDigitalProductWizard = lazy(() =>
  import('./create/digital/CreateDigitalProductWizard_v2').then(m => ({
    default: m.CreateDigitalProductWizard,
  }))
);

// V2 : Wizards avec 7 étapes (Affiliation + SEO/FAQs intégrés)
const CreatePhysicalProductWizard = lazy(() =>
  import('./create/physical/CreatePhysicalProductWizard_v2').then(m => ({
    default: m.CreatePhysicalProductWizard,
  }))
);

const CreateServiceWizard = lazy(() =>
  import('./create/service/CreateServiceWizard_v2').then(m => ({ default: m.CreateServiceWizard }))
);

const CreateArtistProductWizard = lazy(() =>
  import('./create/artist/CreateArtistProductWizard').then(m => ({
    default: m.CreateArtistProductWizard,
  }))
);

// Sélecteur de templates
const ProductTemplateSelector = lazy(() =>
  import('./ProductTemplateSelector').then(m => ({ default: m.ProductTemplateSelector }))
);

// Fallback : formulaire classique (pour compatibilité)
const ProductForm = lazy(() => import('./ProductForm').then(m => ({ default: m.ProductForm })));

interface ProductCreationRouterProps {
  storeId: string;
  storeSlug: string;
  initialProductType?: string;
  onSuccess?: () => void;
}

/**
 * Loading fallback component
 */
const LoadingFallback = () => {
  const { t } = useTranslation();

  return (
    <div className="flex items-center justify-center min-h-[60vh] px-4">
      <Card className="w-full max-w-md animate-in fade-in zoom-in duration-500">
        <CardContent className="flex flex-col items-center justify-center py-12 sm:py-16">
          <Loader2
            className="h-10 w-10 sm:h-12 sm:w-12 animate-spin text-primary mb-4 sm:mb-6"
            aria-hidden="true"
          />
          <p className="text-base sm:text-lg font-medium text-center">
            {t('wizard.loading', 'Chargement du wizard...')}
          </p>
          <p className="text-xs sm:text-sm text-muted-foreground mt-2 text-center">
            {t('wizard.loadingDesc', 'Préparation de votre espace de création')}
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

/**
 * Router principal pour la création de produits
 *
 * Workflow :
 * 1. Afficher le sélecteur de type (si pas déjà sélectionné)
 * 2. Router vers le wizard approprié selon le type
 * 3. Gérer le retour arrière vers le sélecteur
 *
 * @example
 * ```tsx
 * <ProductCreationRouter
 *   storeId={store.id}
 *   storeSlug={store.slug}
 *   onSuccess={() => navigate('/products')}
 * />
 * ```
 */
export const ProductCreationRouter = ({
  storeId,
  storeSlug,
  initialProductType,
  onSuccess,
}: ProductCreationRouterProps) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [selectedType, setSelectedType] = useState<string | null>(initialProductType || null);
  const [selectedTemplate, setSelectedTemplate] = useState<ProductTemplate | null>(null);
  const [showTemplateSelector, setShowTemplateSelector] = useState(false);

  // Refs for animations
  const headerRef = useScrollAnimation<HTMLDivElement>();

  /**
   * Handler pour le changement de type
   */
  const handleTypeSelect = useCallback(
    (type: string) => {
      logger.info('Type de produit sélectionné dans le router', { type });
      setSelectedType(type);
      // Synchroniser l'URL avec le type sélectionné (URLs explicites)
      navigate(`/dashboard/products/new/${type}`);
    },
    [navigate]
  );

  /**
   * Handler pour retour arrière (changement de type)
   */
  const handleBack = useCallback(() => {
    logger.info('Retour au sélecteur de type');
    setSelectedType(null);
    // Revenir à l'URL générique sans type
    navigate('/dashboard/products/new');
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [navigate]);

  /**
   * Logging on mount
   */
  useEffect(() => {
    logger.info('ProductCreationRouter ouvert', {
      storeId,
      initialProductType,
      selectedType,
    });
  }, [storeId, initialProductType, selectedType]);

  // Si pas encore de type sélectionné, afficher le sélecteur
  if (!selectedType) {
    return (
      <div className="container mx-auto px-2 sm:px-4 lg:px-6 py-4 sm:py-6 lg:py-8 max-w-7xl overflow-x-hidden">
        <div
          ref={headerRef}
          className="mb-6 sm:mb-8 animate-in fade-in slide-in-from-top-4 duration-700"
        >
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-2 sm:mb-3 bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
            {t('products.createNew', 'Créer un nouveau produit')}
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            {t('products.chooseType', 'Choisissez le type de produit que vous souhaitez vendre')}
          </p>
        </div>

        <EnhancedProductTypeSelector onSelect={handleTypeSelect} storeId={storeId} />
      </div>
    );
  }

  // Si type sélectionné mais pas de template, afficher le sélecteur de templates
  if (selectedType && !selectedTemplate && showTemplateSelector) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <Button variant="ghost" onClick={() => setShowTemplateSelector(false)} className="mb-6">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Retour
        </Button>
        <ProductTemplateSelector
          productType={selectedType as ProductType}
          onSelect={template => {
            setSelectedTemplate(template);
            setShowTemplateSelector(false);
          }}
          onSkip={() => setShowTemplateSelector(false)}
        />
      </div>
    );
  }

  // Router vers le wizard approprié
  return (
    <Suspense fallback={<LoadingFallback />}>
      {selectedType === 'course' && (
        <CreateCourseWizard storeId={storeId} onSuccess={onSuccess} onBack={handleBack} />
      )}

      {selectedType === 'digital' && (
        <CreateDigitalProductWizard
          storeId={storeId}
          storeSlug={storeSlug}
          onSuccess={onSuccess}
          onBack={handleBack}
        />
      )}

      {selectedType === 'physical' && (
        <CreatePhysicalProductWizard
          storeId={storeId}
          storeSlug={storeSlug}
          onSuccess={onSuccess}
          onBack={handleBack}
        />
      )}

      {selectedType === 'service' && (
        <CreateServiceWizard
          storeId={storeId}
          storeSlug={storeSlug}
          onSuccess={onSuccess}
          onBack={handleBack}
        />
      )}

      {selectedType === 'artist' && (
        <CreateArtistProductWizard
          storeId={storeId}
          storeSlug={storeSlug}
          onSuccess={onSuccess}
          onBack={handleBack}
        />
      )}

      {/* Fallback vers formulaire classique pour types non reconnus */}
      {!['course', 'digital', 'physical', 'service', 'artist'].includes(selectedType) && (
        <div className="container mx-auto px-4 py-8 max-w-5xl">
          <Button variant="ghost" onClick={handleBack} className="mb-6">
            <ArrowLeft className="h-4 w-4 mr-2" />
            {t('common.back', 'Retour')}
          </Button>
          <ProductForm storeId={storeId} storeSlug={storeSlug} onSuccess={onSuccess} />
        </div>
      )}
    </Suspense>
  );
};
