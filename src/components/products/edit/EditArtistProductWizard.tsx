/**
 * Edit Artist Product Wizard
 * Date: 28 Février 2025
 *
 * Wizard professionnel pour l'édition de produits artistes
 * Basé sur CreateArtistProductWizard mais adapté pour l'édition
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Palette,
  Info,
  FileText,
  Truck,
  Search,
  Eye,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Save,
  Loader2,
  CreditCard,
  Shield,
} from 'lucide-react';
import { ArtistTypeSelector } from '../create/artist/ArtistTypeSelector';
import { ArtistBasicInfoForm } from '../create/artist/ArtistBasicInfoForm';
import { ArtistSpecificForms } from '../create/artist/ArtistSpecificForms';
import { ArtistShippingConfig } from '../create/artist/ArtistShippingConfig';
import { ArtistAuthenticationConfig } from '../create/artist/ArtistAuthenticationConfig';
import { ArtistPreview } from '../create/artist/ArtistPreview';
import { ProductSEOForm } from '../create/shared/ProductSEOForm';
import { ProductFAQForm } from '../create/shared/ProductFAQForm';
import { PaymentOptionsForm } from '../create/shared/PaymentOptionsForm';
import { useToast } from '@/hooks/use-toast';
import { useStore } from '@/hooks/useStore';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';
import { cn } from '@/lib/utils';
import type { ArtistProductFormData, ArtistType } from '@/types/artist-product';
import { generateSlug } from '@/lib/validation-utils';
import { useArtistProduct } from '@/hooks/artist/useArtistProducts';

const STEPS = [
  { id: 1, title: "Type d'Artiste", description: 'Sélectionnez votre type', icon: Palette },
  { id: 2, title: 'Informations de base', description: 'Artiste & Œuvre', icon: Info },
  { id: 3, title: 'Spécificités', description: 'Détails par type', icon: FileText },
  { id: 4, title: 'Livraison', description: 'Expédition & Assurance', icon: Truck },
  { id: 5, title: 'Authentification', description: 'Certificats', icon: Shield },
  { id: 6, title: 'SEO & FAQs', description: 'Référencement', icon: Search },
  { id: 7, title: 'Paiement', description: 'Options de paiement', icon: CreditCard },
  { id: 8, title: 'Aperçu', description: 'Validation finale', icon: Eye },
];

interface EditArtistProductWizardProps {
  productId: string;
  storeId?: string;
  storeSlug?: string;
  onSuccess?: () => void;
  onBack?: () => void;
}

/**
 * Convert artist product from DB to form data
 */
const convertToFormData = (
  artistProduct: Record<string, unknown>,
  product: Record<string, unknown>
): Partial<ArtistProductFormData> => {
  return {
    name: product?.name || '',
    description: product?.description || '',
    short_description: product?.short_description || '',
    price: product?.price || 0,
    compare_at_price: product?.compare_at_price || null,
    cost_per_item: product?.cost_per_item || null,
    images: product?.images || [],
    category_id: product?.category_id || null,
    tags: product?.tags || [],
    artist_type: artistProduct?.artist_type as ArtistType,
    artist_name: artistProduct?.artist_name || '',
    artist_bio: artistProduct?.artist_bio || '',
    artist_website: artistProduct?.artist_website || '',
    artist_photo_url: artistProduct?.artist_photo_url,
    artist_social_links: artistProduct?.artist_social_links || {},
    artwork_title: artistProduct?.artwork_title || '',
    artwork_year: artistProduct?.artwork_year || null,
    artwork_medium: artistProduct?.artwork_medium || '',
    artwork_dimensions: artistProduct?.artwork_dimensions || {
      width: null,
      height: null,
      depth: null,
      unit: 'cm',
    },
    artwork_link_url: artistProduct?.artwork_link_url,
    edition_type: artistProduct?.artwork_edition_type || 'original',
    edition_number: artistProduct?.edition_number || null,
    total_editions: artistProduct?.total_editions || null,
    writer_specific: artistProduct?.writer_specific || null,
    musician_specific: artistProduct?.musician_specific || null,
    visual_artist_specific: artistProduct?.visual_artist_specific || null,
    designer_specific: artistProduct?.designer_specific || null,
    multimedia_specific: artistProduct?.multimedia_specific || null,
    requires_shipping: artistProduct?.requires_shipping ?? true,
    shipping_handling_time: artistProduct?.shipping_handling_time || 7,
    shipping_fragile: artistProduct?.shipping_fragile || false,
    shipping_insurance_required: artistProduct?.shipping_insurance_required || false,
    shipping_insurance_amount: artistProduct?.shipping_insurance_amount || null,
    certificate_of_authenticity: artistProduct?.certificate_of_authenticity || false,
    certificate_file_url: artistProduct?.certificate_file_url || '',
    signature_authenticated: artistProduct?.signature_authenticated || false,
    signature_location: artistProduct?.signature_location || '',
    seo: {
      meta_title: product?.meta_title,
      meta_description: product?.meta_description,
      og_image: product?.og_image,
    },
    faqs: product?.faqs || [],
    payment: product?.payment_options || { payment_type: 'full', percentage_rate: 30 },
    is_active: product?.is_active ?? true,
  };
};

export const EditArtistProductWizard = ({
  productId,
  storeId: propsStoreId,
  storeSlug,
  onSuccess,
  onBack,
}: EditArtistProductWizardProps) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { store: hookStore, loading: storeLoading } = useStore();
  const store = hookStore || (propsStoreId ? { id: propsStoreId } : null);

  // Load existing product
  const {
    data: artistProductData,
    isLoading: loadingProduct,
    error: productError,
  } = useArtistProduct(productId);

  const [currentStep, setCurrentStep] = useState(1);
  const [isSaving, setIsSaving] = useState(false);
  const [isAutoSaving, setIsAutoSaving] = useState(false);
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize form data from loaded product
  const [formData, setFormData] = useState<Partial<ArtistProductFormData>>({
    name: '',
    description: '',
    price: 0,
    compare_at_price: null,
    cost_per_item: null,
    images: [],
    category_id: null,
    tags: [],
    artist_type: null as ArtistType | null,
    artist_name: '',
    artist_bio: '',
    artist_website: '',
    artist_photo_url: undefined,
    artist_social_links: {},
    artwork_title: '',
    artwork_year: null,
    artwork_medium: '',
    artwork_dimensions: { width: null, height: null, depth: null, unit: 'cm' },
    artwork_link_url: undefined,
    edition_type: 'original',
    edition_number: null,
    total_editions: null,
    requires_shipping: true,
    shipping_handling_time: 7,
    shipping_fragile: false,
    shipping_insurance_required: false,
    shipping_insurance_amount: null,
    certificate_of_authenticity: false,
    certificate_file_url: '',
    signature_authenticated: false,
    signature_location: '',
    seo: {},
    faqs: [],
    payment: { payment_type: 'full', percentage_rate: 30 },
    is_active: true,
  });

  // Load product data when available
  useEffect(() => {
    if (artistProductData) {
      const convertedData = convertToFormData(artistProductData, artistProductData.product);
      setFormData(convertedData);
      logger.info('Product data loaded for editing', { productId });
    }
  }, [artistProductData, productId]);

  const handleUpdateFormData = useCallback((data: Partial<ArtistProductFormData>) => {
    setFormData(prev => {
      const newData = { ...prev, ...data };

      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }

      autoSaveTimeoutRef.current = setTimeout(() => {
        handleAutoSave(newData);
      }, 2000);

      return newData;
    });
  }, []);

  const handleAutoSave = useCallback(
    async (data?: Partial<ArtistProductFormData>) => {
      const dataToSave = data || formData;
      if (!dataToSave.artwork_title || dataToSave.artwork_title.trim() === '') return;

      setIsAutoSaving(true);
      try {
        localStorage.setItem('artist-product-draft', JSON.stringify(dataToSave));
        logger.info('Brouillon produit artiste auto-sauvegardé', { step: currentStep, productId });
      } catch (error) {
        logger.error('Auto-save error', { error });
      } finally {
        setIsAutoSaving(false);
      }
    },
    [formData, currentStep, productId]
  );

  const validateStep = useCallback(
    (step: number): boolean => {
      switch (step) {
        case 1:
          if (!formData.artist_type) {
            toast({
              title: 'Erreur',
              description: "Veuillez sélectionner un type d'artiste",
              variant: 'destructive',
            });
            return false;
          }
          return true;
        case 2:
          if (
            !formData.artwork_title ||
            !formData.artist_name ||
            !formData.artwork_medium ||
            !formData.price
          ) {
            toast({
              title: 'Erreur',
              description: 'Veuillez remplir tous les champs obligatoires',
              variant: 'destructive',
            });
            return false;
          }
          if (!formData.description || formData.description.trim().length < 10) {
            toast({
              title: 'Erreur',
              description: 'Veuillez ajouter une description (minimum 10 caractères)',
              variant: 'destructive',
            });
            return false;
          }
          if (!formData.price || formData.price <= 0) {
            toast({
              title: 'Erreur',
              description: 'Le prix doit être supérieur à 0',
              variant: 'destructive',
            });
            return false;
          }
          if (!formData.images || formData.images.length === 0) {
            toast({
              title: 'Erreur',
              description: 'Veuillez ajouter au moins une image',
              variant: 'destructive',
            });
            return false;
          }
          if (!formData.requires_shipping && !formData.artwork_link_url) {
            toast({
              title: 'Erreur',
              description: "Pour une œuvre non physique, un lien vers l'œuvre est requis",
              variant: 'destructive',
            });
            return false;
          }
          if (formData.edition_type === 'limited_edition') {
            if (!formData.edition_number || !formData.total_editions) {
              toast({
                title: 'Erreur',
                description:
                  "Pour une édition limitée, le numéro d'édition et le total sont requis",
                variant: 'destructive',
              });
              return false;
            }
            if (formData.edition_number > formData.total_editions) {
              toast({
                title: 'Erreur',
                description: "Le numéro d'édition ne peut pas être supérieur au total",
                variant: 'destructive',
              });
              return false;
            }
          }
          return true;
        default:
          return true;
      }
    },
    [formData, toast]
  );

  const updateArtistProduct = async (isDraft: boolean = false) => {
    if (!store || !artistProductData) {
      throw new Error('Aucune boutique ou produit trouvé');
    }

    setIsSaving(true);

    try {
      // Update base product
      const { error: productError } = await supabase
        .from('products')
        .update({
          name: formData.artwork_title || formData.name,
          description: formData.description,
          short_description: formData.short_description || null,
          price: formData.price || 0,
          compare_at_price: formData.compare_at_price || null,
          cost_per_item: formData.cost_per_item || null,
          category_id: formData.category_id || null,
          image_url: formData.images?.[0] || null,
          images: formData.images || [],
          tags: formData.tags || [],
          meta_title: formData.seo?.meta_title,
          meta_description: formData.seo?.meta_description,
          og_image: formData.seo?.og_image,
          faqs: formData.faqs || [],
          payment_options: formData.payment || { payment_type: 'full', percentage_rate: 30 },
          is_draft: isDraft,
          is_active: !isDraft,
        })
        .eq('id', productId);

      if (productError) {
        if (productError.code === '23505' || productError.message?.includes('duplicate key')) {
          throw new Error('Ce slug est déjà utilisé par un autre produit de votre boutique.');
        }
        throw productError;
      }

      // Update artist_product
      const { error: artistError } = await supabase
        .from('artist_products')
        .update({
          artist_type: formData.artist_type,
          artist_name: formData.artist_name,
          artist_bio: formData.artist_bio,
          artist_website: formData.artist_website,
          artist_photo_url: formData.artist_photo_url || null,
          artist_social_links: formData.artist_social_links || {},
          artwork_title: formData.artwork_title,
          artwork_year: formData.artwork_year,
          artwork_medium: formData.artwork_medium,
          artwork_dimensions: formData.artwork_dimensions,
          artwork_link_url: formData.artwork_link_url || null,
          artwork_edition_type: formData.edition_type,
          edition_number: formData.edition_number,
          total_editions: formData.total_editions,
          writer_specific: formData.writer_specific || null,
          musician_specific: formData.musician_specific || null,
          visual_artist_specific: formData.visual_artist_specific || null,
          designer_specific: formData.designer_specific || null,
          multimedia_specific: formData.multimedia_specific || null,
          requires_shipping: formData.requires_shipping,
          shipping_handling_time: formData.shipping_handling_time,
          shipping_fragile: formData.shipping_fragile,
          shipping_insurance_required: formData.shipping_insurance_required,
          shipping_insurance_amount: formData.shipping_insurance_amount,
          certificate_of_authenticity: formData.certificate_of_authenticity,
          certificate_file_url: formData.certificate_file_url,
          signature_authenticated: formData.signature_authenticated,
          signature_location: formData.signature_location,
        })
        .eq('product_id', productId);

      if (artistError) throw artistError;

      localStorage.removeItem('artist-product-draft');

      toast({
        title: '✅ Succès',
        description: isDraft ? 'Brouillon sauvegardé' : 'Produit artiste mis à jour avec succès',
      });

      if (onSuccess) {
        onSuccess();
      } else {
        navigate('/products');
      }
    } catch (error) {
      logger.error('Error updating artist product', { error });
      toast({
        title: '❌ Erreur',
        description: error instanceof Error ? error.message : 'Une erreur est survenue',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, STEPS.length));
    }
  };

  const handlePrevious = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const progress = (currentStep / STEPS.length) * 100;

  // Loading state
  if (storeLoading || loadingProduct) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  // Error state
  if (productError || !artistProductData) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <Alert variant="destructive">
          <AlertDescription>
            {productError
              ? `Erreur lors du chargement du produit: ${productError.message}`
              : 'Produit non trouvé'}
          </AlertDescription>
        </Alert>
        {onBack && (
          <Button variant="outline" onClick={onBack} className="mt-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background sm:py-6 lg:py-8 overflow-x-hidden w-full">
      <div className="w-full max-w-5xl mx-auto sm:px-4 lg:px-6">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <div className="flex items-center justify-between mb-4">
            {onBack && (
              <Button variant="ghost" onClick={onBack} className="min-h-[44px] touch-manipulation">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Retour
              </Button>
            )}
            {isAutoSaving && (
              <Badge variant="secondary" className="ml-auto">
                <Save className="h-3 w-3 mr-1" />
                Sauvegarde...
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2 sm:gap-3 mb-4">
            <Palette className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold">
              Modifier une œuvre d'artiste
            </h1>
          </div>
          <Progress value={progress} className="h-2" />
          <p className="text-sm text-muted-foreground mt-2">
            Étape {currentStep} sur {STEPS.length} : {STEPS[currentStep - 1].title}
          </p>
        </div>

        {/* Step Content */}
        <Card>
          <CardContent className="p-6">
            {currentStep === 1 && (
              <ArtistTypeSelector
                selectedType={formData.artist_type}
                onSelect={type => handleUpdateFormData({ artist_type: type })}
              />
            )}

            {currentStep === 2 && (
              <ArtistBasicInfoForm data={formData} onUpdate={handleUpdateFormData} />
            )}

            {currentStep === 3 && formData.artist_type && (
              <ArtistSpecificForms
                artistType={formData.artist_type}
                data={formData}
                onUpdate={handleUpdateFormData}
              />
            )}

            {currentStep === 4 && (
              <ArtistShippingConfig data={formData} onUpdate={handleUpdateFormData} />
            )}

            {currentStep === 5 && (
              <ArtistAuthenticationConfig data={formData} onUpdate={handleUpdateFormData} />
            )}

            {currentStep === 6 && (
              <div className="space-y-4">
                <ProductSEOForm
                  data={formData.seo || {}}
                  productName={formData.artwork_title || ''}
                  productDescription={formData.description}
                  onUpdate={seo => handleUpdateFormData({ seo })}
                />
                <ProductFAQForm
                  data={formData.faqs || []}
                  onUpdate={faqs => handleUpdateFormData({ faqs })}
                />
              </div>
            )}

            {currentStep === 7 && (
              <PaymentOptionsForm
                productPrice={formData.price || 0}
                productType="artist"
                data={formData.payment || { payment_type: 'full', percentage_rate: 30 }}
                onUpdate={payment => handleUpdateFormData({ payment })}
              />
            )}

            {currentStep === 8 && <ArtistPreview data={formData} />}
          </CardContent>
        </Card>

        {/* Navigation */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <Button
                variant="outline"
                onClick={handlePrevious}
                disabled={currentStep === 1}
                className="min-h-[44px] touch-manipulation"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Précédent
              </Button>

              <div className="flex gap-2 flex-wrap">
                <Button
                  variant="outline"
                  onClick={() => updateArtistProduct(true)}
                  disabled={isSaving}
                  className="min-h-[44px] touch-manipulation"
                >
                  <Save className="h-4 w-4 mr-2" />
                  Enregistrer comme brouillon
                </Button>

                {currentStep < STEPS.length ? (
                  <Button onClick={handleNext} className="min-h-[44px] touch-manipulation">
                    Suivant
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                ) : (
                  <Button
                    onClick={() => updateArtistProduct(false)}
                    disabled={isSaving}
                    className="min-h-[44px] touch-manipulation"
                  >
                    {isSaving ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Enregistrement...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="h-4 w-4 mr-2" />
                        Enregistrer les modifications
                      </>
                    )}
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
