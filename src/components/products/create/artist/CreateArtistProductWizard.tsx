/**
 * Create Artist Product Wizard
 * Date: 28 Janvier 2025
 *
 * Wizard professionnel pour la création de produits artistes
 */

import React, { useState, useCallback, useEffect, Suspense, lazy, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
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
  AlertCircle,
} from 'lucide-react';
import { ArtistTypeSelector } from './ArtistTypeSelector';
import { ArtistBasicInfoForm } from './ArtistBasicInfoForm';

// Lazy loading des étapes pour optimiser le bundle size
const ArtistSpecificForms = lazy(() =>
  import('./ArtistSpecificForms').then(m => ({ default: m.ArtistSpecificForms }))
);
const ArtistShippingConfig = lazy(() =>
  import('./ArtistShippingConfig').then(m => ({ default: m.ArtistShippingConfig }))
);
const ArtistAuthenticationConfig = lazy(() =>
  import('./ArtistAuthenticationConfig').then(m => ({ default: m.ArtistAuthenticationConfig }))
);
const ArtistPreview = lazy(() =>
  import('./ArtistPreview').then(m => ({ default: m.ArtistPreview }))
);
const ProductSEOForm = lazy(() =>
  import('../shared/ProductSEOForm').then(m => ({ default: m.ProductSEOForm }))
);
const ProductFAQForm = lazy(() =>
  import('../shared/ProductFAQForm').then(m => ({ default: m.ProductFAQForm }))
);
const PaymentOptionsForm = lazy(() =>
  import('../shared/PaymentOptionsForm').then(m => ({ default: m.PaymentOptionsForm }))
);
import { useToast } from '@/hooks/use-toast';
import { useStore } from '@/hooks/useStore';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';
import { cn } from '@/lib/utils';
import type { ArtistProductFormData, ArtistType } from '@/types/artist-product';
import { generateSlug } from '@/lib/validation-utils';
import { saveDraftHybrid, loadDraftHybrid, clearDraft } from '@/lib/artist-product-draft';
import { validateAndSanitizeArtistProduct } from '@/lib/artist-product-sanitizer';
import { validateArtistProduct } from '@/lib/validation/centralized-validation';
import {
  getRequiredFieldError,
  getMinLengthError,
  getPriceError,
  getDescriptionError,
  getImagesError,
  getNonPhysicalArtworkError,
  getEditionError,
  formatErrorMessage,
  getFieldDisplayName,
} from '@/lib/artist-product-error-messages';

// Skeleton de chargement pour les étapes lazy-loaded
const StepSkeleton = () => (
  <div className="space-y-4">
    <Skeleton className="h-10 w-full" />
    <Skeleton className="h-32 w-full" />
    <Skeleton className="h-24 w-full" />
    <Skeleton className="h-20 w-3/4" />
  </div>
);

const STEPS = [
  { id: 1, title: "Type d'Artiste", description: 'Sélectionnez votre type', icon: Palette },
  { id: 2, title: 'Informations de base', description: 'Artiste & Œuvre', icon: Info },
  { id: 3, title: 'Spécificités', description: 'Détails par type', icon: FileText },
  {
    id: 4,
    title: 'Expédition & Assurance',
    description: 'Livraison, emballage, assurance',
    icon: Truck,
  },
  { id: 5, title: 'Authentification', description: "Certificats d'authenticité", icon: Shield },
  { id: 6, title: 'SEO & FAQs', description: 'Référencement, questions', icon: Search },
  {
    id: 7,
    title: 'Options de Paiement',
    description: 'Complet, partiel, escrow',
    icon: CreditCard,
  },
  { id: 8, title: 'Aperçu & Validation', description: 'Vérifier et publier', icon: Eye },
];

interface CreateArtistProductWizardProps {
  storeId?: string;
  storeSlug?: string;
  onSuccess?: () => void;
  onBack?: () => void;
}

const CreateArtistProductWizardComponent = ({
  storeId: propsStoreId,
  storeSlug: _storeSlug, // Préfixé avec _ pour indiquer qu'il n'est pas utilisé actuellement
  onSuccess,
  onBack,
}: CreateArtistProductWizardProps = {}) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { store: hookStore, loading: storeLoading } = useStore();
  const store = hookStore || (propsStoreId ? { id: propsStoreId } : null);
  const storeSlugValue = _storeSlug || hookStore?.slug;
  const [currentStep, setCurrentStep] = useState(1);
  const [isSaving, setIsSaving] = useState(false);
  const [isAutoSaving, setIsAutoSaving] = useState(false);
  // État pour stocker les erreurs de validation par étape (utilisé dans la grille d'étapes)
  const [validationErrors] = useState<Record<number, string[]>>({});

  // Refs for animations
  const stepsRef = useScrollAnimation<HTMLDivElement>();
  const contentRef = useScrollAnimation<HTMLDivElement>();

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

  const handleUpdateFormData = useCallback((data: Partial<ArtistProductFormData>) => {
    setFormData(prev => {
      const newData = { ...prev, ...data };
      // ✅ Sauvegarde automatique supprimée - sauvegarde uniquement au clic sur "Suivant"
      return newData;
    });
  }, []);

  const handleAutoSave = useCallback(
    async (data?: ArtistProductFormData) => {
      const dataToSave = data || formData;
      // Ne pas sauvegarder si le titre est vide (données insuffisantes)
      if (!dataToSave.artwork_title || dataToSave.artwork_title.trim() === '') return;
      if (!store) return;

      setIsAutoSaving(true);
      try {
        // Sauvegarde hybride: locale (immédiate) + serveur (asynchrone)
        await saveDraftHybrid(dataToSave, store.id, currentStep);
        logger.info('Brouillon produit artiste sauvegardé', {
          step: currentStep,
          storeId: store.id,
        });
      } catch (error) {
        logger.error('Save error', { error });
      } finally {
        setIsAutoSaving(false);
      }
    },
    [formData, currentStep, store]
  );

  useEffect(() => {
    const loadDraft = async () => {
      if (!store) return;

      try {
        // Charger brouillon hybride: essaie serveur d'abord, puis local
        const { data: draft, source } = await loadDraftHybrid(store.id);

        if (draft && typeof draft === 'object') {
          setFormData(draft as Partial<ArtistProductFormData>);
          logger.info('Brouillon produit artiste chargé', { source });
        }
      } catch (error) {
        logger.error('Error loading draft', { error });
      }
    };

    loadDraft();
  }, [store]);

  const validateStep = useCallback(
    (step: number): boolean => {
      switch (step) {
        case 1:
          if (!formData.artist_type) {
            const errorData = getRequiredFieldError("Type d'artiste");
            toast({
              title: errorData.error,
              description: errorData.suggestion || "Veuillez sélectionner un type d'artiste",
              variant: 'destructive',
            });
            return false;
          }
          return true;
        case 2:
          // Validation champs obligatoires avec messages améliorés
          if (!formData.artwork_title) {
            const errorData = getRequiredFieldError(getFieldDisplayName('artwork_title'));
            toast({
              title: errorData.error,
              description: errorData.suggestion || 'Ce champ est obligatoire',
              variant: 'destructive',
            });
            return false;
          }
          if (!formData.artist_name) {
            const errorData = getRequiredFieldError(getFieldDisplayName('artist_name'));
            toast({
              title: errorData.error,
              description: errorData.suggestion || 'Ce champ est obligatoire',
              variant: 'destructive',
            });
            return false;
          }
          if (!formData.artwork_medium) {
            const errorData = getRequiredFieldError(getFieldDisplayName('artwork_medium'));
            toast({
              title: errorData.error,
              description: errorData.suggestion || 'Ce champ est obligatoire',
              variant: 'destructive',
            });
            return false;
          }
          if (!formData.price || formData.price <= 0) {
            const errorData = getPriceError(formData.price);
            toast({
              title: errorData.error,
              description: errorData.suggestion || 'Le prix doit être supérieur à 0',
              variant: 'destructive',
            });
            return false;
          }
          // Validation description avec suggestion
          if (!formData.description || formData.description.trim().length < 10) {
            const errorData = getDescriptionError(formData.description);
            toast({
              title: errorData.error,
              description:
                errorData.suggestion || 'Veuillez ajouter une description (minimum 10 caractères)',
              variant: 'destructive',
            });
            return false;
          }
          // Validation images avec suggestion
          if (!formData.images || formData.images.length === 0) {
            const errorData = getImagesError(formData.images);
            toast({
              title: errorData.error,
              description: errorData.suggestion || 'Veuillez ajouter au moins une image',
              variant: 'destructive',
            });
            return false;
          }
          // Validation cohérence requires_shipping / artwork_link_url
          if (!formData.requires_shipping && !formData.artwork_link_url) {
            const errorData = getNonPhysicalArtworkError();
            toast({
              title: errorData.error,
              description:
                errorData.suggestion ||
                "Pour une œuvre non physique, un lien vers l'œuvre est requis",
              variant: 'destructive',
            });
            return false;
          }
          // Validation édition limitée avec suggestion
          if (formData.edition_type === 'limited_edition') {
            if (!formData.edition_number || !formData.total_editions) {
              const errorData = getEditionError(formData.edition_number, formData.total_editions);
              toast({
                title: errorData.error,
                description:
                  errorData.suggestion ||
                  "Pour une édition limitée, le numéro d'édition et le total sont requis",
                variant: 'destructive',
              });
              return false;
            }
            if (formData.edition_number > formData.total_editions) {
              const errorData = getEditionError(formData.edition_number, formData.total_editions);
              toast({
                title: errorData.error,
                description:
                  errorData.suggestion || "Le numéro d'édition ne peut pas être supérieur au total",
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

  // ✅ NOUVEAU: Valider toutes les étapes avant publication
  const validateAllSteps = useCallback((): boolean => {
    // Étape 1: Type d'artiste
    if (!validateStep(1)) {
      toast({
        title: 'Étape 1 incomplète',
        description: "Veuillez sélectionner un type d'artiste",
        variant: 'destructive',
      });
      return false;
    }

    // Étape 2: Informations de base
    if (!validateStep(2)) {
      toast({
        title: 'Étape 2 incomplète',
        description: 'Veuillez compléter toutes les informations de base',
        variant: 'destructive',
      });
      return false;
    }

    // Étape 3: Spécificités (selon type) - Validation basique
    // Les champs spécifiques sont optionnels, mais on vérifie la cohérence
    if (formData.artist_type === 'writer' && formData.writer_specific) {
      // Validation basique pour writer
      // Les champs sont optionnels, pas de validation stricte
    }

    // Étape 4: Expédition - Validation basique
    if (formData.requires_shipping) {
      if (!formData.shipping_handling_time || formData.shipping_handling_time < 1) {
        toast({
          title: 'Délai de livraison requis',
          description: 'Veuillez spécifier un délai de livraison valide (minimum 1 jour)',
          variant: 'destructive',
        });
        return false;
      }
    }

    // Étape 5: Authentification - Optionnel, pas de validation stricte

    // Étape 6: SEO & FAQ - Optionnel, pas de validation stricte

    // Étape 7: Options de paiement
    if (!formData.payment) {
      toast({
        title: 'Options de paiement requises',
        description: 'Veuillez configurer les options de paiement',
        variant: 'destructive',
      });
      return false;
    }

    if (formData.payment.payment_type === 'percentage') {
      if (
        !formData.payment.percentage_rate ||
        formData.payment.percentage_rate < 1 ||
        formData.payment.percentage_rate > 100
      ) {
        toast({
          title: 'Taux de paiement invalide',
          description: 'Le taux de paiement doit être entre 1% et 100%',
          variant: 'destructive',
        });
        return false;
      }
    }

    // Étape 8: Aperçu - Pas de validation stricte, juste confirmation

    return true;
  }, [formData, validateStep, toast]);

  const saveArtistProduct = async (isDraft: boolean = false) => {
    if (!store) {
      throw new Error('Aucune boutique trouvée');
    }

    setIsSaving(true);

    try {
      // ✅ NOUVEAU: Valider toutes les étapes avant publication (sauf brouillon)
      if (!isDraft) {
        const allStepsValid = validateAllSteps();
        if (!allStepsValid) {
          setIsSaving(false);
          return; // Arrêter ici, les erreurs sont déjà affichées
        }
      }

      // PHASE 1 SÉCURITÉ: Sanitization et validation
      // 1. Sanitizer tous les champs texte (prévention XSS)
      const sanitizedData = validateAndSanitizeArtistProduct(formData);

      // Generate slug (après sanitization, AVANT validation serveur)
      let  slug= generateSlug(sanitizedData.artwork_title || sanitizedData.name || 'artwork');
      let  attempts= 0;
      while (attempts < 10) {
        const { data: existing } = await supabase
          .from('products')
          .select('id')
          .eq('store_id', store.id)
          .eq('slug', slug)
          .limit(1);

        if (!existing || existing.length === 0) break;
        attempts++;
        slug = `${generateSlug(sanitizedData.artwork_title || sanitizedData.name || 'artwork')}-${attempts}`;
      }

      // 2. Validation côté serveur (si pas brouillon) - AVEC slug généré
      if (!isDraft) {
        const validationResult = await validateArtistProduct(
          {
            name: sanitizedData.artwork_title || sanitizedData.name || '',
            slug: slug, // Slug généré et validé
            description: sanitizedData.description || '',
            price: sanitizedData.price || 0,
            artist_name: sanitizedData.artist_name || '',
            artwork_title: sanitizedData.artwork_title || '',
          },
          store.id
        );

        if (!validationResult.valid) {
          const errorMessage =
            validationResult.error ||
            Object.values(validationResult.errors || {}).join(', ') ||
            'Erreur de validation';
          throw new Error(errorMessage);
        }
      }

      // Create product (utiliser données sanitizées)
      // Préparer les données d'insertion (exclure les colonnes qui pourraient ne pas exister)
      const  productData: Record<string, unknown> = {
        store_id: store.id,
        name: sanitizedData.artwork_title || sanitizedData.name,
        slug,
        description: sanitizedData.description, // Déjà sanitizé avec DOMPurify
        short_description: sanitizedData.short_description || null,
        price: sanitizedData.price || 0,
        currency: 'XOF',
        product_type: 'artist',
        category_id: sanitizedData.category_id || null,
        image_url: sanitizedData.images?.[0] || null,
        images: sanitizedData.images || [],
        tags: sanitizedData.tags || [],
        meta_title: sanitizedData.seo?.meta_title,
        meta_description: sanitizedData.seo?.meta_description,
        og_image: sanitizedData.seo?.og_image,
        faqs: sanitizedData.faqs || [],
        payment_options: sanitizedData.payment || { payment_type: 'full', percentage_rate: 30 },
        is_draft: isDraft,
        is_active: !isDraft,
      };

      // Ajouter compare_at_price et cost_per_item seulement s'ils ont une valeur
      // (pour éviter les erreurs si les colonnes n'existent pas encore)
      if (sanitizedData.compare_at_price != null && sanitizedData.compare_at_price > 0) {
        productData.compare_at_price = sanitizedData.compare_at_price;
      }
      if (sanitizedData.cost_per_item != null && sanitizedData.cost_per_item > 0) {
        productData.cost_per_item = sanitizedData.cost_per_item;
      }

      const { data: product, error: productError } = await supabase
        .from('products')
        .insert(productData)
        .select()
        .single();

      if (productError) {
        logger.error('Error inserting product', {
          error: productError,
          code: productError.code,
          message: productError.message,
          details: productError.details,
          hint: productError.hint,
        });

        // Gestion améliorée des erreurs de contrainte unique
        if (productError.code === '23505' || productError.message?.includes('duplicate key')) {
          const constraintMatch = productError.message?.match(/constraint ['"]([^'"]+)['"]/);
          const constraintName = constraintMatch ? constraintMatch[1] : 'unknown';

          if (constraintName.includes('slug')) {
            throw new Error(
              "Ce slug est déjà utilisé par un autre produit de votre boutique. Veuillez modifier le nom ou l'URL du produit."
            );
          }
        }

        // Gestion des erreurs de validation (400)
        if (productError.code === '23502' || productError.message?.includes('null value')) {
          const columnMatch = productError.message?.match(/column ['"]([^'"]+)['"]/);
          const columnName = columnMatch ? columnMatch[1] : 'unknown';
          throw new Error(
            `Le champ "${columnName}" est requis mais n'a pas été fourni. Veuillez compléter toutes les informations requises.`
          );
        }

        // Gestion des erreurs de format
        if (productError.code === '22P02' || productError.message?.includes('invalid input')) {
          throw new Error(
            `Format de données invalide. Veuillez vérifier les valeurs saisies. ${productError.message || ''}`
          );
        }

        // Message d'erreur générique avec détails
        const errorMessage =
          productError.message ||
          productError.details ||
          productError.hint ||
          'Une erreur est survenue lors de la création du produit';

        throw new Error(errorMessage);
      }

      // Create artist_product (utiliser données sanitizées)
      const { error: artistError } = await supabase.from('artist_products').insert({
        product_id: product.id,
        store_id: store.id,
        artist_type: sanitizedData.artist_type,
        artist_name: sanitizedData.artist_name,
        artist_bio: sanitizedData.artist_bio,
        artist_website: sanitizedData.artist_website,
        artist_photo_url: sanitizedData.artist_photo_url || null,
        artist_social_links: sanitizedData.artist_social_links || {},
        artwork_title: sanitizedData.artwork_title,
        artwork_year: sanitizedData.artwork_year,
        artwork_medium: sanitizedData.artwork_medium,
        artwork_dimensions: sanitizedData.artwork_dimensions,
        artwork_link_url: sanitizedData.artwork_link_url || null,
        artwork_edition_type: sanitizedData.edition_type,
        edition_number: sanitizedData.edition_number,
        total_editions: sanitizedData.total_editions,
        writer_specific: sanitizedData.writer_specific || null,
        musician_specific: sanitizedData.musician_specific || null,
        visual_artist_specific: sanitizedData.visual_artist_specific || null,
        designer_specific: sanitizedData.designer_specific || null,
        multimedia_specific: sanitizedData.multimedia_specific || null,
        requires_shipping: sanitizedData.requires_shipping,
        shipping_handling_time: sanitizedData.shipping_handling_time,
        shipping_fragile: sanitizedData.shipping_fragile,
        shipping_insurance_required: sanitizedData.shipping_insurance_required,
        shipping_insurance_amount: sanitizedData.shipping_insurance_amount,
        certificate_of_authenticity: sanitizedData.certificate_of_authenticity,
        certificate_file_url: sanitizedData.certificate_file_url,
        signature_authenticated: sanitizedData.signature_authenticated,
        signature_location: sanitizedData.signature_location,
      });

      if (artistError) throw artistError;

      // Déclencher webhook product.created (asynchrone)
      if (product && !isDraft) {
        import('@/lib/webhooks/webhook-system').then(({ triggerWebhook }) => {
          triggerWebhook(store.id, 'product.created', {
            product_id: product.id,
            name: product.name,
            product_type: product.product_type,
            price: product.price,
            currency: product.currency,
            created_at: product.created_at,
          }).catch( err => {
            logger.error('Error triggering webhook', { error: err, productId: product.id });
          });
        });
      }

      // Supprimer brouillon (local + serveur)
      if (store) {
        await clearDraft(store.id);
      }

      toast({
        title: '✅ Succès',
        description: isDraft ? 'Brouillon sauvegardé' : 'Produit artiste créé avec succès',
      });

      if (onSuccess) {
        onSuccess();
      } else {
        navigate('/products');
      }
    } catch (error) {
      logger.error('Error saving artist product', { error });
      toast({
        title: '❌ Erreur',
        description: error instanceof Error ? error.message : 'Une erreur est survenue',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleNext = async () => {
    if (validateStep(currentStep)) {
      // ✅ Sauvegarder le brouillon avant de passer à l'étape suivante
      await handleAutoSave();
      setCurrentStep(prev => Math.min(prev + 1, STEPS.length));
    }
  };

  const handlePrevious = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleStepClick = useCallback(
    (stepId: number) => {
      // Permettre de revenir en arrière, mais valider avant d'avancer
      if (stepId < currentStep) {
        setCurrentStep(stepId);
        logger.info('Navigation directe vers étape', { to: stepId });
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else if (stepId === currentStep) {
        // Déjà sur cette étape, ne rien faire
        return;
      } else {
        // Avancer nécessite une validation
        const isValid = validateStep(currentStep);
        if (isValid) {
          setCurrentStep(stepId);
          logger.info('Navigation directe vers étape', { to: stepId });
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
      }
    },
    [currentStep]
  );

  /**
   * Calculate progress
   */
  const progress = useMemo(() => (currentStep / STEPS.length) * 100, [currentStep]);

  if (storeLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background sm:py-6 lg:py-8 overflow-x-hidden w-full">
      <div className="w-full max-w-5xl mx-auto sm:px-4 lg:px-6">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            {onBack && (
              <Button variant="ghost" onClick={onBack}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                {t('common.back', 'Retour')}
              </Button>
            )}
          </div>

          {/* Title */}
          <div className="mb-4">
            <h1 className="text-2xl sm:text-3xl font-bold mb-2">
              {t('products.createArtist.title', "Créer une œuvre d'artiste")}
            </h1>
            <p className="text-sm text-muted-foreground">
              {t(
                'products.createArtist.subtitle',
                `Créez une œuvre d'artiste professionnelle en ${STEPS.length} étapes`
              )}
            </p>
          </div>

          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs sm:text-sm">
              <span className="font-medium">
                {t('products.step', 'Étape')} {currentStep} {t('products.of', 'sur')} {STEPS.length}
              </span>
              <div className="flex items-center gap-2">
                {isAutoSaving && (
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    <span>{t('products.saving', 'Sauvegarde...')}</span>
                  </div>
                )}
                <span className="text-muted-foreground">
                  {Math.round(progress)}% {t('products.completed', 'complété')}
                </span>
              </div>
            </div>
            <Progress value={progress} className="h-1.5 sm:h-2 bg-muted" />
          </div>
        </div>

        {/* Steps Indicator - Responsive */}
        <Card
          ref={stepsRef}
          className="mb-6 sm:mb-8 border-border/50 bg-card/50 backdrop-blur-sm shadow-lg animate-in fade-in slide-in-from-bottom-4 duration-700"
        >
          <CardContent className="p-3 sm:p-4 lg:p-6">
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2 sm:gap-3">
              {STEPS.map((step, index) => {
                const Icon = step.icon;
                const isActive = currentStep === step.id;
                const isCompleted = currentStep > step.id;
                const hasErrors = validationErrors[step.id]?.length > 0;

                return (
                  <button
                    key={step.id}
                    onClick={() => handleStepClick(step.id)}
                    role="tab"
                    aria-selected={isActive}
                    aria-label={`${t('products.step', 'Étape')} ${step.id}: ${step.title}`}
                    aria-controls={`step-${step.id}-panel`}
                    tabIndex={isActive ? 0 : -1}
                    className={cn(
                      'relative p-2.5 sm:p-3 rounded-lg border-2 transition-all duration-300 text-left',
                      'hover:shadow-md hover:scale-[1.02] touch-manipulation',
                      isActive &&
                        'border-green-500 bg-green-50 dark:bg-green-950/30 shadow-lg scale-[1.02] ring-2 ring-green-500/20',
                      isCompleted && 'border-green-500 bg-green-50 dark:bg-green-950/30',
                      !isActive &&
                        !isCompleted &&
                        !hasErrors &&
                        'border-border hover:border-green-500/50 bg-card/50',
                      hasErrors && 'border-red-500 bg-red-50 dark:bg-red-950/30',
                      'animate-in fade-in slide-in-from-bottom-4'
                    )}
                    style={{ animationDelay: `${index * 50}ms` }}
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
                      {isCompleted && (
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

        {/* Validation Errors */}
        {validationErrors[currentStep]?.length > 0 && (
          <Alert
            variant="destructive"
            className="mb-4 sm:mb-6 animate-in fade-in slide-in-from-top-4"
          >
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <ul className="list-disc list-inside text-xs sm:text-sm space-y-1">
                {validationErrors[currentStep].map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        )}

        {/* Step Content */}
        <Card
          ref={contentRef}
          className="border-border/50 bg-card/50 backdrop-blur-sm shadow-lg animate-in fade-in slide-in-from-bottom-4 duration-700"
          role="tabpanel"
          id={`step-${currentStep}-panel`}
          aria-labelledby={`step-${currentStep}-tab`}
        >
          <CardContent className="p-4 sm:p-6">
            {currentStep === 1 && (
              <ArtistTypeSelector
                selectedType={formData.artist_type || null}
                onSelect={type => handleUpdateFormData({ artist_type: type })}
              />
            )}

            {currentStep === 2 && (
              <ArtistBasicInfoForm
                data={formData}
                onUpdate={handleUpdateFormData}
                storeSlug={storeSlugValue}
              />
            )}

            {currentStep === 3 && formData.artist_type && (
              <Suspense fallback={<StepSkeleton />}>
                <ArtistSpecificForms
                  artistType={formData.artist_type}
                  data={formData}
                  onUpdate={handleUpdateFormData}
                />
              </Suspense>
            )}

            {currentStep === 4 && (
              <Suspense fallback={<StepSkeleton />}>
                <ArtistShippingConfig data={formData} onUpdate={handleUpdateFormData} />
              </Suspense>
            )}

            {currentStep === 5 && (
              <Suspense fallback={<StepSkeleton />}>
                <ArtistAuthenticationConfig data={formData} onUpdate={handleUpdateFormData} />
              </Suspense>
            )}

            {currentStep === 6 && (
              <Suspense fallback={<StepSkeleton />}>
                <div className="space-y-4">
                  <ProductSEOForm
                    data={formData.seo || {}}
                    productName={formData.artwork_title || ''}
                    productDescription={formData.description}
                    onUpdate={seo => handleUpdateFormData({ seo })}
                  />
                  <ProductFAQForm
                    data={(formData.faqs || []).map((faq, index: number) => ({
                      id: faq.id || `faq-${Date.now()}-${index}`,
                      question: faq.question || '',
                      answer: faq.answer || '',
                      order: faq.order ?? index,
                    }))}
                    onUpdate={faqs => handleUpdateFormData({ faqs })}
                  />
                </div>
              </Suspense>
            )}

            {currentStep === 7 && (
              <Suspense fallback={<StepSkeleton />}>
                <PaymentOptionsForm
                  productPrice={formData.price || 0}
                  productType="physical"
                  data={{
                    payment_type: (formData.payment?.payment_type || 'full') as
                      | 'full'
                      | 'percentage'
                      | 'delivery_secured',
                    percentage_rate: formData.payment?.percentage_rate ?? 30,
                  }}
                  onUpdate={payment =>
                    handleUpdateFormData({
                      payment: {
                        payment_type: payment.payment_type,
                        percentage_rate: payment.percentage_rate ?? 30,
                      },
                    })
                  }
                />
              </Suspense>
            )}

            {currentStep === 8 && (
              <Suspense fallback={<StepSkeleton />}>
                <ArtistPreview data={formData} />
              </Suspense>
            )}
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-0 mt-4 sm:mt-6">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={currentStep === 1}
            className="w-full sm:w-auto min-h-[44px] touch-manipulation"
            aria-label="Aller à l'étape précédente"
            aria-disabled={currentStep === 1}
          >
            <ArrowLeft className="h-4 w-4 mr-2" aria-hidden="true" />
            Précédent
          </Button>

          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <Button
              variant="outline"
              onClick={() => saveArtistProduct(true)}
              disabled={isSaving}
              className="w-full sm:w-auto min-h-[44px] touch-manipulation"
              aria-label="Enregistrer comme brouillon"
            >
              <Save className="h-4 w-4 mr-2" aria-hidden="true" />
              <span className="hidden sm:inline">Enregistrer comme brouillon</span>
              <span className="sm:hidden">Brouillon</span>
            </Button>

            {currentStep < STEPS.length ? (
              <Button
                onClick={handleNext}
                className="w-full sm:w-auto min-h-[44px] touch-manipulation"
                aria-label="Aller à l'étape suivante"
              >
                Suivant
                <ArrowRight className="h-4 w-4 ml-2" aria-hidden="true" />
              </Button>
            ) : (
              <Button
                onClick={() => saveArtistProduct(false)}
                disabled={isSaving}
                className="w-full sm:w-auto min-h-[44px] touch-manipulation"
                aria-label={isSaving ? 'Publication en cours...' : 'Publier le produit'}
                aria-busy={isSaving}
              >
                {isSaving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" aria-hidden="true" />
                    <span aria-live="polite">Publication...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4 mr-2" aria-hidden="true" />
                    Publier
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Optimisation avec React.memo
export const CreateArtistProductWizard = React.memo(CreateArtistProductWizardComponent);






