/**
 * Product Creation Router
 * Date: 27 octobre 2025
 * 
 * Point d'entrée unifié pour la création de produits.
 * Route automatiquement vers le wizard approprié selon le type.
 */

import { useState, lazy, Suspense } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { EnhancedProductTypeSelector } from './EnhancedProductTypeSelector';

// Lazy loading des wizards pour optimiser les performances
const CreateCourseWizard = lazy(() => 
  import('../courses/create/CreateCourseWizard').then(m => ({ default: m.CreateCourseWizard }))
);

const CreateDigitalProductWizard = lazy(() => 
  import('./create/digital/CreateDigitalProductWizard').then(m => ({ default: m.CreateDigitalProductWizard }))
);

const CreatePhysicalProductWizard = lazy(() => 
  import('./create/physical/CreatePhysicalProductWizard').then(m => ({ default: m.CreatePhysicalProductWizard }))
);

const CreateServiceWizard = lazy(() => 
  import('./create/service/CreateServiceWizard').then(m => ({ default: m.CreateServiceWizard }))
);

// Fallback : formulaire classique (pour compatibilité)
const ProductForm = lazy(() => 
  import('./ProductForm').then(m => ({ default: m.ProductForm }))
);

interface ProductCreationRouterProps {
  storeId: string;
  storeSlug: string;
  initialProductType?: string;
  onSuccess?: () => void;
}

/**
 * Loading fallback component
 */
const LoadingFallback = () => (
  <div className="flex items-center justify-center min-h-[60vh]">
    <Card className="w-full max-w-md">
      <CardContent className="flex flex-col items-center justify-center py-12">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-lg font-medium">Chargement du wizard...</p>
        <p className="text-sm text-muted-foreground mt-2">
          Préparation de votre espace de création
        </p>
      </CardContent>
    </Card>
  </div>
);

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
  const [selectedType, setSelectedType] = useState<string | null>(
    initialProductType || null
  );

  /**
   * Handler pour le changement de type
   */
  const handleTypeSelect = (type: string) => {
    setSelectedType(type);
  };

  /**
   * Handler pour retour arrière (changement de type)
   */
  const handleBack = () => {
    setSelectedType(null);
  };

  // Si pas encore de type sélectionné, afficher le sélecteur
  if (!selectedType) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Créer un nouveau produit</h1>
          <p className="text-muted-foreground">
            Choisissez le type de produit que vous souhaitez vendre
          </p>
        </div>
        
        <EnhancedProductTypeSelector
          onSelect={handleTypeSelect}
          storeId={storeId}
        />
      </div>
    );
  }

  // Router vers le wizard approprié
  return (
    <Suspense fallback={<LoadingFallback />}>
      {selectedType === 'course' && (
        <CreateCourseWizard
          storeId={storeId}
          onSuccess={onSuccess}
          onBack={handleBack}
        />
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

      {/* Fallback vers formulaire classique pour types non reconnus */}
      {!['course', 'digital', 'physical', 'service'].includes(selectedType) && (
        <ProductForm
          storeId={storeId}
          storeSlug={storeSlug}
          onSuccess={onSuccess}
        />
      )}
    </Suspense>
  );
};


