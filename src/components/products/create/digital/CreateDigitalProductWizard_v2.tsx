/**
 * Create Digital Product Wizard V2 - Professional & Optimized
 * Date: 2025-01-01
 *
 * Wizard 6 étapes avec SEO & FAQs intégrés
 * Version optimisée avec design professionnel, responsive et fonctionnalités avancées
 */

import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  ArrowLeft,
  Check,
  Loader2,
  Info,
  FileText,
  Shield,
  Users,
  Search,
  Eye,
  Download,
  Save,
  Keyboard,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useStore } from '@/hooks/useStore';
import { supabase } from '@/integrations/supabase/client';
import { generateSlug } from '@/lib/store-utils';
import { logger } from '@/lib/logger';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';
import { cn } from '@/lib/utils';
import { useWizardServerValidation } from '@/hooks/useWizardServerValidation';
import type {
  DigitalProductFormData,
  DigitalProductFormDataUpdate,
  DigitalProductDownloadableFile,
} from '@/types/digital-product-form';

// Step components
import { DigitalBasicInfoForm } from './DigitalBasicInfoForm';
import { DigitalFilesUploader } from './DigitalFilesUploader';
import { DigitalLicenseConfig } from './DigitalLicenseConfig';
import { DigitalAffiliateSettings } from './DigitalAffiliateSettings';
import { DigitalPreview } from './DigitalPreview';

// Shared components
import { ProductSEOForm } from '../shared/ProductSEOForm';
import { ProductFAQForm } from '../shared/ProductFAQForm';
import { ProductStatisticsDisplaySettings } from '../shared/ProductStatisticsDisplaySettings';

const createDefaultAffiliate = () => ({
  enabled: false,
  commission_rate: 20,
  commission_type: 'percentage' as const,
  fixed_commission_amount: 0,
  cookie_duration_days: 30,
  min_order_amount: 0,
  allow_self_referral: false,
  require_approval: false,
  terms_and_conditions: '',
});

const createDefaultSeo = () => ({
  meta_title: '',
  meta_description: '',
  meta_keywords: '',
  og_title: '',
  og_description: '',
  og_image: '',
});

const getDefaultFormData = () => ({
  // Basic info
  name: '',
  slug: '',
  description: '',
  short_description: '',
  category: 'ebook',
  digital_type: 'ebook',
  image_url: '',
  images: [],
  price: 0,
  promotional_price: null,
  currency: 'XOF',

  // Files
  main_file_url: '',
  main_file_version: '1.0',
  downloadable_files: [],

  // License Config
  license_type: 'single',
  license_duration_days: null,
  max_activations: 1,
  allow_license_transfer: false,
  auto_generate_keys: true,

  // Download Settings
  download_limit: 5,
  download_expiry_days: 30,
  require_registration: true,
  watermark_enabled: false,
  watermark_text: '',

  // Version
  version: '1.0',

  // Affiliate
  affiliate: createDefaultAffiliate(),

  // SEO
  seo: createDefaultSeo(),

  // FAQs
  faqs: [],

  // Licensing (PLR / Copyright)
  licensing_type: 'standard',
  license_terms: '',

  // Metadata
  product_type: 'digital',
  is_active: true,

  // Statistics Display Settings
  hide_purchase_count: false,
  hide_likes_count: false,
  hide_recommendations_count: false,
  hide_downloads_count: false,
  hide_reviews_count: false,
  hide_rating: false,
});

const mergeFormDataWithDefaults = (
  data: Partial<DigitalProductFormData> | null | undefined
): DigitalProductFormData => {
  const defaults = getDefaultFormData();
  const draft = data || {};

  return {
    ...defaults,
    ...draft,
    affiliate: {
      ...defaults.affiliate,
      ...(draft.affiliate || {}),
    },
    seo: {
      ...defaults.seo,
      ...(draft.seo || {}),
    },
    downloadable_files: draft.downloadable_files || [],
    faqs: draft.faqs || [],
  } as DigitalProductFormData;
};

const STEPS = [
  {
    id: 1,
    title: 'Informations de base',
    description: 'Nom, description, prix, images',
    icon: Info,
  },
  {
    id: 2,
    title: 'Fichiers',
    description: 'Upload et gestion',
    icon: FileText,
  },
  {
    id: 3,
    title: 'Configuration',
    description: 'Licensing et téléchargements',
    icon: Shield,
  },
  {
    id: 4,
    title: 'Affiliation',
    description: "Programme d'affiliation (optionnel)",
    icon: Users,
  },
  {
    id: 5,
    title: 'SEO & FAQs',
    description: 'Référencement et questions',
    icon: Search,
  },
  {
    id: 6,
    title: 'Prévisualisation',
    description: 'Vérifier et publier',
    icon: Eye,
  },
];

interface CreateDigitalProductWizard_v2Props {
  storeId?: string;
  storeSlug?: string;
  onSuccess?: () => void;
  onBack?: () => void;
}

export const CreateDigitalProductWizard = ({
  storeId: propsStoreId,
  storeSlug: propsStoreSlug,
  onSuccess,
  onBack,
}: CreateDigitalProductWizard_v2Props = {}) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { store, loading: storeLoading } = useStore();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Auto-save
  const [isAutoSaving, setIsAutoSaving] = useState(false);
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Refs for animations
  const headerRef = useScrollAnimation<HTMLDivElement>();
  const stepsRef = useScrollAnimation<HTMLDivElement>();
  const contentRef = useScrollAnimation<HTMLDivElement>();

  // Use props or fallback to hook store
  const storeId = propsStoreId || store?.id;

  // Server validation hook
  const {
    validateSlug,
    validateDigitalProduct: validateDigitalProductServer,
    clearServerErrors,
  } = useWizardServerValidation({
    storeId: storeId || undefined,
    showToasts: true,
  });
  const storeSlug = propsStoreSlug || store?.slug;

  const [formData, setFormData] = useState<DigitalProductFormData>(() => getDefaultFormData());

  /**
   * Auto-save draft
   */
  const handleAutoSave = useCallback(
    async (data?: DigitalProductFormData) => {
      const dataToSave = data || formData;

      // Ne pas auto-save si pas de nom
      if (!dataToSave.name || dataToSave.name.trim() === '') {
        return;
      }

      setIsAutoSaving(true);
      try {
        // Sauvegarder dans localStorage (brouillon local)
        localStorage.setItem('digital-product-draft', JSON.stringify(dataToSave));
        localStorage.setItem('digital-product-current-step', currentStep.toString());
        logger.info('Brouillon auto-sauvegardé', { step: currentStep });
      } catch (error) {
        logger.error('Auto-save error', {
          error: error instanceof Error ? error.message : String(error),
          step: currentStep,
        });
      } finally {
        setIsAutoSaving(false);
      }
    },
    [formData, currentStep]
  );

  /**
   * Update form data with auto-save
   */
  const updateFormData = useCallback(
    (updates: DigitalProductFormDataUpdate) => {
      // Log pour diagnostiquer le problème d'espacement
      if (updates.name !== undefined) {
        logger.info('updateFormData - name update', {
          newName: updates.name,
          hasSpaces: updates.name.includes(' '),
          length: updates.name.length,
          charCodes: updates.name.split('').map((c: string) => c.charCodeAt(0)),
        });
      }

      setFormData((prev: DigitalProductFormData) => {
        const newData = {
          ...prev,
          ...updates,
        };

        if (updates?.affiliate) {
          newData.affiliate = {
            ...prev.affiliate,
            ...updates.affiliate,
          };
        }

        if (updates?.seo) {
          newData.seo = {
            ...prev.seo,
            ...updates.seo,
          };
        }

        if (updates?.faqs) {
          newData.faqs = Array.isArray(updates.faqs) ? updates.faqs : prev.faqs;
        }

        if (updates?.downloadable_files) {
          newData.downloadable_files = Array.isArray(updates.downloadable_files)
            ? updates.downloadable_files
            : prev.downloadable_files;
        }

        // Auto-save after 2 seconds of inactivity
        if (autoSaveTimeoutRef.current) {
          clearTimeout(autoSaveTimeoutRef.current);
        }

        autoSaveTimeoutRef.current = setTimeout(() => {
          handleAutoSave(newData);
        }, 2000);

        return newData;
      });
    },
    [handleAutoSave]
  );

  /**
   * Load draft from localStorage
   */
  useEffect(() => {
    const savedDraft = localStorage.getItem('digital-product-draft');
    const savedStep = localStorage.getItem('digital-product-current-step');
    if (savedDraft) {
      try {
        const draft = JSON.parse(savedDraft);
        setFormData(mergeFormDataWithDefaults(draft));
        logger.info('Brouillon chargé depuis localStorage');

        // Restaurer l'étape si elle existe
        if (savedStep) {
          const step = parseInt(savedStep, 10);
          if (step >= 1 && step <= STEPS.length) {
            setCurrentStep(step);
            logger.info('Étape restaurée depuis localStorage', { step });
          }
        }
      } catch (error) {
        logger.error('Error loading draft', {
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }
  }, []);

  /**
   * S'assurer que store_id est toujours défini dans formData
   */
  useEffect(() => {
    if (storeId && !formData.store_id) {
      setFormData((prev: DigitalProductFormData) => ({ ...prev, store_id: storeId }));
    }
  }, [storeId, formData.store_id]);

  /**
   * Validate current step avec validation améliorée (client + serveur)
   */
  const validateStep = useCallback(
    async (step: number): Promise<boolean> => {
      // Log détaillé pour débogage
      logger.info('validateStep appelé', {
        step,
        stepType: typeof step,
        STEPSLength: STEPS.length,
      });

      // Réinitialiser les erreurs serveur en premier
      clearServerErrors();

      // Pour les étapes 3-6, pas de validation stricte nécessaire
      if (step >= 3) {
        logger.info('Validation étape optionnelle', { step });
        return true;
      }

      try {
        const { validateWithZod, formatValidators, getFieldError, digitalProductSchema } =
          await import('@/lib/wizard-validation');

        switch (step) {
          case 1: {
            // 1. Validation client avec Zod
            // Préparer les données en gérant les valeurs vides/undefined
            const nameValue = (formData.name || '').trim();
            const priceValue =
              typeof formData.price === 'number' ? formData.price : parseFloat(formData.price) || 0;

            // Vérifier les champs obligatoires avant validation
            if (!nameValue || nameValue.length < 2) {
              toast({
                title: t('wizard.errors.title', 'Erreur'),
                description:
                  'Le nom du produit est obligatoire et doit contenir au moins 2 caractères',
                variant: 'destructive',
              });
              logger.warn('Validation échouée - Nom manquant ou invalide', {
                name: nameValue,
                nameLength: nameValue.length,
              });
              return false;
            }

            if (!priceValue || priceValue <= 0) {
              toast({
                title: t('wizard.errors.title', 'Erreur'),
                description: 'Le prix est obligatoire et doit être supérieur à 0',
                variant: 'destructive',
              });
              logger.warn('Validation échouée - Prix manquant ou invalide', { price: priceValue });
              return false;
            }

            const validationData: Partial<DigitalProductFormData> = {
              name: nameValue,
              price: priceValue,
            };

            // Ajouter les champs optionnels seulement s'ils ont une valeur non vide
            if (formData.slug && formData.slug.trim()) {
              validationData.slug = formData.slug.trim();
            }
            if (formData.description && formData.description.trim()) {
              // Extraire le texte brut du HTML pour la validation de longueur
              // La description peut contenir du HTML (RichTextEditor), mais on valide la longueur du texte brut
              // Utiliser une regex simple pour extraire le texte brut (évite dépendance DOM)
              const plainTextDescription = formData.description
                .replace(/<[^>]*>/g, '') // Supprimer les balises HTML
                .replace(/&nbsp;/g, ' ') // Remplacer &nbsp; par espace
                .replace(/&amp;/g, '&') // Remplacer &amp; par &
                .replace(/&lt;/g, '<') // Remplacer &lt; par <
                .replace(/&gt;/g, '>') // Remplacer &gt; par >
                .replace(/&quot;/g, '"') // Remplacer &quot; par "
                .replace(/&#39;/g, "'") // Remplacer &#39; par '
                .trim();

              validationData.description = plainTextDescription;

              // Log pour débogage
              logger.info('Description préparée pour validation', {
                originalLength: formData.description.length,
                plainTextLength: plainTextDescription.length,
                hasHtml: formData.description !== plainTextDescription,
                difference: formData.description.length - plainTextDescription.length,
              });
            }
            if (formData.version && formData.version.trim()) {
              validationData.version = formData.version.trim();
            }

            // Log détaillé des données préparées avant validation
            logger.info('Validation étape 1 - Données préparées', {
              name: validationData.name,
              nameLength: validationData.name.length,
              price: validationData.price,
              hasSlug: !!validationData.slug,
              hasDescription: !!validationData.description,
              hasVersion: !!validationData.version,
              validationDataKeys: Object.keys(validationData),
            });

            const result = validateWithZod(digitalProductSchema, validationData);

            if (!result.valid) {
              // Log détaillé de toutes les erreurs
              logger.warn('Validation client échouée - Étape 1', {
                errors: result.errors,
                errorsCount: result.errors.length,
                errorDetails: result.errors.map(err => ({
                  field: err.field,
                  message: err.message,
                  type: err.type,
                })),
              });

              // Récupérer toutes les erreurs par champ
              const nameError = getFieldError(result.errors, 'name');
              const priceError = getFieldError(result.errors, 'price');
              const slugError = getFieldError(result.errors, 'slug');
              const descriptionError = getFieldError(result.errors, 'description');
              const versionError = getFieldError(result.errors, 'version');

              // Construire un message d'erreur détaillé avec tous les champs en erreur
              const errorMessages: string[] = [];
              if (nameError) errorMessages.push(`Nom: ${nameError}`);
              if (priceError) errorMessages.push(`Prix: ${priceError}`);
              if (slugError) errorMessages.push(`Slug: ${slugError}`);
              if (descriptionError) errorMessages.push(`Description: ${descriptionError}`);
              if (versionError) errorMessages.push(`Version: ${versionError}`);

              const errorDescription =
                errorMessages.length > 0
                  ? errorMessages.join(' | ')
                  : t(
                      'wizard.errors.requiredFields',
                      'Veuillez remplir tous les champs obligatoires'
                    );

              toast({
                title: t('wizard.errors.title', 'Erreur'),
                description: errorDescription,
                variant: 'destructive',
              });

              return false;
            }

            // 2. Validation format version si fournie (client)
            if (formData.version) {
              const versionResult = formatValidators.version(formData.version);
              if (!versionResult.valid) {
                toast({
                  title: t('wizard.errors.title', 'Erreur'),
                  description:
                    getFieldError(versionResult.errors, 'version') || 'Format de version invalide',
                  variant: 'destructive',
                });
                return false;
              }
            }

            // 3. Validation serveur (unicité slug, version, etc.)
            // Note: La validation serveur est optionnelle - si elle échoue, on continue avec la validation client
            if (storeId) {
              try {
                const serverResult = await validateDigitalProductServer({
                  name: formData.name,
                  slug: formData.slug,
                  price: formData.price,
                });

                if (!serverResult.valid) {
                  // Logger l'erreur mais ne pas bloquer si c'est une erreur de connexion/RPC
                  logger.warn('Validation serveur échouée - Étape 1', {
                    errors: serverResult.errors,
                    error: serverResult.error,
                    message: serverResult.message,
                  });

                  // Si l'erreur est liée à la RPC (fonction inexistante ou erreur serveur), on continue
                  // Seulement bloquer si c'est une vraie erreur de validation (ex: slug déjà utilisé)
                  if (
                    serverResult.error === 'validation_error' &&
                    serverResult.errors &&
                    serverResult.errors.length > 0
                  ) {
                    // Erreur de validation réelle - bloquer
                    return false;
                  }
                  // Sinon, continuer avec la validation client uniquement
                }

                // Validation slug spécifique si fourni
                if (formData.slug && formData.slug.trim()) {
                  try {
                    const slugValid = await validateSlug(formData.slug.trim());
                    if (!slugValid) {
                      return false;
                    }
                  } catch (slugError) {
                    // Si la validation du slug échoue (erreur réseau, etc.), on continue
                    // La validation sera faite lors de la sauvegarde
                    logger.warn('Erreur lors de la validation du slug', {
                      error: slugError,
                      slug: formData.slug,
                    });
                  }
                }
              } catch (serverError) {
                // Erreur lors de l'appel à la validation serveur - continuer avec validation client uniquement
                logger.warn(
                  'Erreur lors de la validation serveur (continuation avec validation client)',
                  {
                    error: serverError,
                    storeId,
                  }
                );
                // Ne pas bloquer - la validation client est suffisante pour l'étape 1
              }
            }

            // Validation version spécifique si fournie (nécessite productId pour vérifier unicité)
            // Note: Pour création, on ne peut pas valider l'unicité de version sans productId
            // Cette validation sera faite lors de la création du produit

            return true;
          }
          case 2: {
            if (
              !formData.main_file_url &&
              (!formData.downloadable_files || formData.downloadable_files.length === 0)
            ) {
              toast({
                title: t('wizard.errors.title', 'Erreur'),
                description: t(
                  'wizard.errors.noFiles',
                  'Veuillez uploader au moins un fichier principal'
                ),
                variant: 'destructive',
              });
              logger.warn('Validation échouée - Étape 2', {
                hasFiles: !!(formData.main_file_url || formData.downloadable_files?.length),
              });
              return false;
            }
            return true;
          }
          default:
            // Les étapes 3-6 sont déjà gérées en haut de la fonction
            return true;
        }
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        logger.error('Erreur lors du chargement des modules de validation', {
          error,
          step,
          errorMessage,
        });
        toast({
          title: '❌ Erreur',
          description: 'Une erreur est survenue lors de la validation. Veuillez réessayer.',
          variant: 'destructive',
        });
        return false;
      }
    },
    [formData, toast, t, storeId, validateSlug, validateDigitalProductServer, clearServerErrors]
  );

  /**
   * Navigation handlers
   */
  const handleNext = useCallback(async () => {
    // Empêcher la navigation si on est en train de soumettre
    if (isSubmitting) {
      logger.warn('Navigation bloquée: soumission en cours', { step: currentStep });
      return;
    }

    try {
      // Log détaillé pour débogage
      logger.info('Début validation étape', {
        step: currentStep,
        stepType: typeof currentStep,
        STEPSLength: STEPS.length,
        isValidStep: currentStep >= 1 && currentStep <= STEPS.length,
      });
      const isValid = await validateStep(currentStep);

      if (isValid) {
        const nextStep = Math.min(currentStep + 1, STEPS.length);
        setCurrentStep(nextStep);
        // Sauvegarder l'étape dans localStorage
        localStorage.setItem('digital-product-current-step', nextStep.toString());
        logger.info('Navigation vers étape suivante', { from: currentStep, to: nextStep });

        // Scroll to top
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        logger.warn('Validation échouée, navigation bloquée', { step: currentStep });
        // Le toast est déjà affiché par validateStep
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error('Erreur lors de la validation/navigation', {
        error,
        step: currentStep,
        errorMessage,
      });
      toast({
        title: '❌ Erreur',
        description:
          errorMessage || 'Une erreur est survenue lors de la validation. Veuillez réessayer.',
        variant: 'destructive',
      });
    }
  }, [currentStep, validateStep, toast, isSubmitting]);

  const handlePrevious = useCallback(() => {
    const prevStep = Math.max(currentStep - 1, 1);
    setCurrentStep(prevStep);
    // Sauvegarder l'étape dans localStorage
    localStorage.setItem('digital-product-current-step', prevStep.toString());
    logger.info('Navigation vers étape précédente', { from: currentStep, to: prevStep });

    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentStep]);

  const handleStepClick = useCallback(
    async (stepId: number) => {
      // Permettre de revenir en arrière, mais valider avant d'avancer
      if (stepId < currentStep) {
        setCurrentStep(stepId);
        logger.info('Navigation directe vers étape', { to: stepId });
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        const isValid = await validateStep(currentStep);
        if (isValid) {
          setCurrentStep(stepId);
          logger.info('Navigation directe vers étape', { to: stepId });
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
      }
    },
    [currentStep, validateStep]
  );

  /**
   * Save product to database
   */
  const saveProduct = useCallback(
    async (isDraft: boolean) => {
      try {
        if (!storeId) {
          throw new Error('Store ID manquant');
        }

        // Générer un slug unique
        let slug = formData.slug || generateSlug(formData.name);

        // Vérifier l'unicité du slug et générer un nouveau si nécessaire
        let attempts = 0;
        const maxAttempts = 10;
        while (attempts < maxAttempts) {
          const { data: existing } = await supabase
            .from('products')
            .select('id')
            .eq('store_id', storeId)
            .eq('slug', slug)
            .limit(1);

          if (!existing || existing.length === 0) {
            // Slug disponible
            break;
          }

          // Slug existe déjà, générer un nouveau avec suffixe
          attempts++;
          const baseSlug = formData.slug || generateSlug(formData.name);
          slug = `${baseSlug}-${attempts}`;
        }

        if (attempts >= maxAttempts) {
          throw new Error(
            'Impossible de générer un slug unique. Veuillez modifier le nom du produit.'
          );
        }

        // 1. Create base product
        const { data: product, error: productError } = await supabase
          .from('products')
          .insert({
            store_id: storeId,
            name: formData.name,
            slug,
            description: formData.description,
            short_description: formData.short_description,
            category: formData.category,
            product_type: 'digital',
            price: formData.pricing_model === 'free' ? 0 : formData.price,
            promotional_price: formData.promotional_price,
            currency: formData.currency,
            pricing_model: formData.pricing_model || 'one-time',
            image_url:
              formData.image_url ||
              (formData.images && formData.images.length > 0 ? formData.images[0] : ''),
            images: formData.images || (formData.image_url ? [formData.image_url] : []),
            licensing_type: formData.licensing_type || 'standard',
            license_terms: formData.license_terms || null,
            is_active: !isDraft,
            is_draft: isDraft,
            // SEO fields (only fields that exist in products table)
            meta_title: formData.seo?.meta_title || formData.name,
            meta_description: formData.seo?.meta_description || formData.short_description,
            og_image: formData.seo?.og_image,
            // Note: meta_keywords, og_title, og_description are not saved to DB (columns don't exist)
            // FAQs
            faqs: formData.faqs || [],
          })
          .select()
          .single();

        if (productError) {
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
          throw productError;
        }

        // 2. Calculate file info
        const totalSizeMB =
          formData.downloadable_files?.reduce(
            (sum: number, file: DigitalProductDownloadableFile) => {
              return sum + file.size / (1024 * 1024);
            },
            0
          ) || 0;

        const mainFile = formData.downloadable_files?.[0];
        const mainFileFormat =
          mainFile?.type?.split('/')[1] || mainFile?.name?.split('.').pop() || 'unknown';

        // 3. Create digital_product (CORRECTION: Sauvegarde complète dans digital_products)
        const { data: digitalProduct, error: digitalError } = await supabase
          .from('digital_products')
          .insert({
            product_id: product.id,
            digital_type: formData.digital_type || 'other',
            license_type: formData.license_type || 'single',
            license_duration_days: formData.license_duration_days || null, // NULL = lifetime
            max_activations:
              formData.max_activations ||
              (formData.license_type === 'unlimited'
                ? -1
                : formData.license_type === 'multi'
                  ? 5
                  : 1),
            allow_license_transfer: formData.allow_license_transfer || false,
            license_key_format: formData.license_key_format || 'XXXX-XXXX-XXXX-XXXX',
            auto_generate_keys: formData.auto_generate_keys !== false,
            main_file_url: formData.main_file_url || mainFile?.url || '',
            main_file_size_mb: mainFile ? mainFile.size / (1024 * 1024) : 0,
            main_file_format: mainFileFormat,
            main_file_version: formData.main_file_version || '1.0',
            main_file_hash: formData.main_file_hash || null, // Hash pour intégrité
            total_files: formData.downloadable_files?.length || 1,
            total_size_mb: totalSizeMB,
            additional_files: formData.additional_files || [],
            download_limit: formData.download_limit || 5,
            download_expiry_days: formData.download_expiry_days || 30,
            require_registration: formData.require_registration !== false,
            watermark_enabled: formData.watermark_enabled || false,
            watermark_text: formData.watermark_text || '',
            // Protection avancée
            ip_restriction_enabled: formData.ip_restriction_enabled || false,
            max_ips_allowed: formData.max_ips_allowed || 3,
            geo_restriction_enabled: formData.geo_restriction_enabled || false,
            allowed_countries: formData.allowed_countries || null,
            blocked_countries: formData.blocked_countries || null,
            // Updates & Versioning
            version: formData.version || '1.0',
            changelog: formData.changelog || null,
            auto_update_enabled: formData.auto_update_enabled || false,
            update_notifications: formData.update_notifications !== false,
            // Preview & Demo
            has_preview: formData.has_preview || false,
            preview_url: formData.preview_url || null,
            preview_duration_seconds: formData.preview_duration_seconds || null,
            demo_available: formData.demo_available || false,
            demo_url: formData.demo_url || null,
            trial_period_days: formData.trial_period_days || null,
            // Advanced Features
            source_code_included: formData.source_code_included || false,
            documentation_url: formData.documentation_url || null,
            support_period_days: formData.support_period_days || null,
            support_email: formData.support_email || null,
            compatible_os: formData.compatible_os || null,
            minimum_requirements: formData.minimum_requirements || null,
            // Statistics (initialisés à 0)
            total_downloads: 0,
            unique_downloaders: 0,
            total_revenue: 0,
            average_download_time_seconds: 0,
            bounce_rate: 0,
            average_rating: 0,
            total_reviews: 0,
          })
          .select()
          .single();

        if (digitalError) throw digitalError;

        // 4. Create digital_product_files
        if (formData.downloadable_files && formData.downloadable_files.length > 0) {
          const filesData = formData.downloadable_files.map(
            (file: DigitalProductDownloadableFile, index: number) => ({
              digital_product_id: digitalProduct.id,
              name: file.name,
              file_url: file.url,
              file_type: file.type,
              file_size_mb: file.size / (1024 * 1024),
              order_index: index,
              is_main: index === 0,
              is_preview: file.is_preview || false,
              requires_purchase: file.requires_purchase !== false && !file.is_preview,
              version: '1.0',
            })
          );

          const { error: filesError } = await supabase
            .from('digital_product_files')
            .insert(filesData);

          if (filesError) throw filesError;
        }

        // 5. Create affiliate settings if enabled
        if (formData.affiliate?.enabled) {
          const { error: affiliateError } = await supabase
            .from('product_affiliate_settings')
            .insert({
              product_id: product.id,
              store_id: storeId,
              affiliate_enabled: formData.affiliate.enabled,
              commission_rate: formData.affiliate.commission_rate,
              commission_type: formData.affiliate.commission_type,
              fixed_commission_amount: formData.affiliate.fixed_commission_amount,
              cookie_duration_days: formData.affiliate.cookie_duration_days,
              max_commission_per_sale: formData.affiliate.max_commission_per_sale,
              min_order_amount: formData.affiliate.min_order_amount,
              allow_self_referral: formData.affiliate.allow_self_referral,
              require_approval: formData.affiliate.require_approval,
              terms_and_conditions: formData.affiliate.terms_and_conditions,
            });

          if (affiliateError) {
            logger.error('Affiliate settings error', {
              error: affiliateError.message,
              code: affiliateError.code,
              productId: createdProduct?.id,
            });
          }
        }

        // 6. Create free preview product if requested
        if (formData.create_free_preview && !isDraft) {
          try {
            logger.info('Creating free preview product', { paidProductId: product.id });

            const { data: previewProductId, error: previewError } = await supabase.rpc(
              'create_free_preview_product',
              {
                p_paid_product_id: product.id,
                p_preview_content_description: formData.preview_content_description || null,
              }
            );

            if (previewError) {
              logger.error('Error creating preview product', { error: previewError.message });
              // Ne pas faire échouer la création du produit principal si le preview échoue
            } else {
              logger.info('Free preview product created', { previewProductId });
            }
          } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            logger.error('Exception creating preview product', { error: errorMessage });
            // Ne pas faire échouer la création du produit principal
          }
        }

        // Clear draft from localStorage on success
        localStorage.removeItem('digital-product-draft');

        // Déclencher webhook product.created (asynchrone)
        if (product && !isDraft) {
          import('@/lib/webhooks/webhook-system').then(({ triggerWebhook }) => {
            triggerWebhook(storeId, 'product.created', {
              product_id: product.id,
              name: product.name,
              product_type: product.product_type,
              price: product.price,
              currency: product.currency,
              created_at: product.created_at,
            }).catch(err => {
              logger.error('Error triggering webhook', { error: err, productId: product.id });
            });
          });
        }

        return product;
      } catch (error: unknown) {
        logger.error('Erreur lors de la sauvegarde du produit', {
          error: error instanceof Error ? error.message : String(error),
        });
        throw error;
      }
    },
    [formData, storeId]
  );

  /**
   * Handle save draft
   */
  const handleSaveDraft = useCallback(async () => {
    setIsSubmitting(true);

    try {
      const product = await saveProduct(true);

      logger.info('Brouillon sauvegardé', { productId: product.id });

      toast({
        title: '✅ Brouillon sauvegardé',
        description: `Produit "${product.name}" enregistré. Vous pouvez continuer plus tard.`,
      });

      if (onSuccess) {
        onSuccess();
      } else {
        // Rediriger vers la liste des produits digitaux
        navigate('/dashboard/digital-products', { replace: true });
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error('Erreur lors de la sauvegarde du brouillon', { error: errorMessage });
      toast({
        title: '❌ Erreur',
        description: errorMessage || 'Impossible de sauvegarder le brouillon',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  }, [saveProduct, toast, onSuccess, navigate]);

  /**
   * Handle submit (publish)
   */
  const handleSubmit = useCallback(async () => {
    if (!validateStep(currentStep)) return;

    setIsSubmitting(true);

    try {
      const product = await saveProduct(false);

      logger.info('Produit digital publié', { productId: product.id, productName: product.name });

      toast({
        title: '🎉 Produit publié !',
        description: `"${product.name}" est maintenant en ligne${formData.affiliate?.enabled ? " avec programme d'affiliation activé" : ''}`,
      });

      if (onSuccess) {
        onSuccess();
      } else if (storeSlug) {
        navigate(`/${storeSlug}/products/${product.slug}`, { replace: true });
      } else {
        // Fallback vers la liste des produits digitaux si storeSlug n'est pas disponible
        navigate('/dashboard/digital-products', { replace: true });
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error('Erreur lors de la publication', { error: errorMessage });
      toast({
        title: '❌ Erreur',
        description: errorMessage || 'Une erreur est survenue lors de la publication',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  }, [
    currentStep,
    validateStep,
    saveProduct,
    formData.affiliate?.enabled,
    toast,
    onSuccess,
    navigate,
    storeSlug,
  ]);

  /**
   * Keyboard shortcuts
   */
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ne pas intercepter si on est dans un input/textarea
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      // Ctrl/Cmd + S pour sauvegarder brouillon
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        handleSaveDraft();
      }

      // Flèches pour navigation
      if (e.key === 'ArrowRight' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        handleNext();
      }
      if (e.key === 'ArrowLeft' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        handlePrevious();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleNext, handlePrevious, handleSaveDraft]);

  /**
   * Render step content
   */
  const renderStepContent = useCallback(() => {
    switch (currentStep) {
      case 1:
        return (
          <DigitalBasicInfoForm
            formData={formData}
            updateFormData={updateFormData}
            storeSlug={storeSlug || ''}
          />
        );
      case 2:
        return <DigitalFilesUploader formData={formData} updateFormData={updateFormData} />;
      case 3:
        return (
          <div className="space-y-6">
            <DigitalLicenseConfig formData={formData} updateFormData={updateFormData} />
            <ProductStatisticsDisplaySettings
              formData={{
                hide_purchase_count: formData.hide_purchase_count,
                hide_likes_count: formData.hide_likes_count,
                hide_recommendations_count: formData.hide_recommendations_count,
                hide_downloads_count: formData.hide_downloads_count,
                hide_reviews_count: formData.hide_reviews_count,
                hide_rating: formData.hide_rating,
              }}
              updateFormData={(field, value) => updateFormData({ [field]: value })}
              productType="digital"
              variant="compact"
            />
          </div>
        );
      case 4:
        return (
          <DigitalAffiliateSettings
            productPrice={formData.price || 0}
            productName={formData.name || 'Produit'}
            data={formData.affiliate}
            onUpdate={affiliateData => updateFormData({ affiliate: affiliateData })}
          />
        );
      case 5:
        return (
          <div className="space-y-4 sm:space-y-6">
            <Alert className="border-blue-200 bg-blue-50 dark:bg-blue-950 dark:border-blue-900">
              <Search className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              <AlertDescription className="text-blue-900 dark:text-blue-100">
                {t(
                  'wizard.seo.faq.description',
                  'Optimisez votre référencement et ajoutez des réponses aux questions fréquentes'
                )}
              </AlertDescription>
            </Alert>

            <ProductSEOForm
              productName={formData.name || ''}
              productDescription={formData.description || ''}
              productPrice={formData.price || 0}
              data={formData.seo || {}}
              onUpdate={seoData => updateFormData({ seo: seoData })}
            />

            <ProductFAQForm
              data={formData.faqs || []}
              onUpdate={faqs => updateFormData({ faqs })}
            />
          </div>
        );
      case 6:
        return <DigitalPreview formData={formData} />;
      default:
        return null;
    }
  }, [currentStep, formData, updateFormData, storeSlug, t]);

  /**
   * Calculate progress
   */
  const progress = useMemo(() => (currentStep / STEPS.length) * 100, [currentStep]);

  /**
   * Logging on mount
   */
  useEffect(() => {
    logger.info('Wizard Produit Digital ouvert', { step: currentStep, storeId });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /**
   * Cleanup auto-save on unmount
   */
  useEffect(() => {
    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, []);

  if (storeLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-4 sm:py-6 lg:py-8 overflow-x-hidden">
      <div className="container max-w-5xl mx-auto px-2 sm:px-4 lg:px-6">
        {/* Header */}
        <div
          ref={headerRef}
          className="mb-6 sm:mb-8 animate-in fade-in slide-in-from-top-4 duration-700"
        >
          {onBack && (
            <Button
              variant="ghost"
              onClick={onBack}
              className="mb-3 sm:mb-4 text-xs sm:text-sm"
              size="sm"
              aria-label={t('wizard.back', 'Retour au choix du type')}
            >
              <ArrowLeft className="h-3 w-3 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
              <span className="hidden sm:inline">
                {t('wizard.back', 'Retour au choix du type')}
              </span>
              <span className="sm:hidden">{t('wizard.backShort', 'Retour')}</span>
            </Button>
          )}

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 mb-4 sm:mb-6">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="p-2 sm:p-3 rounded-lg bg-gradient-to-br from-blue-500/10 to-blue-600/5 backdrop-blur-sm border border-blue-500/20 animate-in zoom-in duration-500">
                <Download
                  className="h-5 w-5 sm:h-6 sm:w-6 text-blue-500 dark:text-blue-400"
                  aria-hidden="true"
                />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold mb-1 sm:mb-2">
                  {t('wizard.title', 'Nouveau Produit Digital')}
                </h1>
                <p className="text-xs sm:text-sm lg:text-base text-muted-foreground">
                  {t('wizard.subtitle', 'Créez un produit digital professionnel en 6 étapes')}
                </p>
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs sm:text-sm">
              <span className="font-medium">
                {t('wizard.step', 'Étape')} {currentStep} {t('wizard.of', 'sur')} {STEPS.length}
              </span>
              <div className="flex items-center gap-2">
                {isAutoSaving && (
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    <span className="hidden sm:inline">
                      {t('wizard.autoSaving', 'Auto-sauvegarde...')}
                    </span>
                  </div>
                )}
                <span className="text-muted-foreground">{Math.round(progress)}%</span>
              </div>
            </div>
            <Progress value={progress} className="h-1.5 sm:h-2 bg-muted" />
          </div>
        </div>

        {/* Steps Navigator - Responsive */}
        <div
          ref={stepsRef}
          className="mb-6 sm:mb-8 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-3 animate-in fade-in slide-in-from-bottom-4 duration-700"
          role="tablist"
          aria-label={t('wizard.steps', 'Étapes du formulaire')}
        >
          {STEPS.map(step => {
            const Icon = step.icon;
            const isActive = step.id === currentStep;
            const isCompleted = step.id < currentStep;
            const isAccessible = step.id <= currentStep || currentStep > step.id;

            return (
              <button
                key={step.id}
                onClick={() => handleStepClick(step.id)}
                disabled={!isAccessible}
                role="tab"
                aria-selected={isActive}
                aria-label={`${t('wizard.step', 'Étape')} ${step.id}: ${step.title}`}
                className={cn(
                  'p-2 sm:p-3 rounded-lg border-2 transition-all duration-300 text-left',
                  'hover:shadow-md hover:scale-[1.02]',
                  'disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100',
                  isActive &&
                    'border-primary bg-primary/5 shadow-lg scale-[1.02] ring-2 ring-primary/20',
                  isCompleted && 'border-green-500 bg-green-50 dark:bg-green-950/30',
                  !isActive &&
                    !isCompleted &&
                    isAccessible &&
                    'border-border hover:border-primary/50 bg-card/50',
                  !isAccessible && 'border-border/30 bg-muted/30'
                )}
              >
                <div className="flex items-center gap-1.5 sm:gap-2 mb-1">
                  <Icon
                    className={cn(
                      'h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0 transition-colors',
                      isCompleted
                        ? 'text-green-600 dark:text-green-400'
                        : isActive
                          ? 'text-primary'
                          : 'text-muted-foreground'
                    )}
                  />
                  {isCompleted && (
                    <Check
                      className="h-3 w-3 text-green-600 dark:text-green-400 flex-shrink-0"
                      aria-hidden="true"
                    />
                  )}
                </div>
                <div
                  className={cn(
                    'text-[10px] sm:text-xs font-medium truncate',
                    isActive && 'text-primary font-semibold',
                    !isActive && !isCompleted && 'text-muted-foreground'
                  )}
                >
                  {step.title}
                </div>
                {step.description && (
                  <div className="hidden lg:block text-[9px] text-muted-foreground mt-0.5 truncate">
                    {step.description}
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Step Content */}
        <Card
          ref={contentRef}
          className="mb-6 sm:mb-8 border-border/50 bg-card/50 backdrop-blur-sm shadow-lg animate-in fade-in slide-in-from-bottom-4 duration-700"
        >
          <CardContent className="pt-4 sm:pt-6 px-3 sm:px-4 lg:px-6">
            {renderStepContent()}
          </CardContent>
        </Card>

        {/* Navigation Buttons - Responsive */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-4 pb-4 sm:pb-6">
          <div className="flex gap-2">
            {currentStep > 1 && (
              <Button
                variant="outline"
                onClick={handlePrevious}
                disabled={isSubmitting}
                className="flex-1 sm:flex-none"
                size="sm"
                aria-label={t('wizard.previous', 'Étape précédente')}
              >
                <ChevronLeft className="h-4 w-4 mr-1.5 sm:mr-2" />
                <span className="hidden sm:inline">{t('wizard.previous', 'Précédent')}</span>
                <span className="sm:hidden">{t('wizard.prev', 'Préc.')}</span>
              </Button>
            )}
          </div>

          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
            {currentStep < STEPS.length && (
              <>
                <Button
                  variant="outline"
                  onClick={handleSaveDraft}
                  disabled={isSubmitting}
                  className="flex-1 sm:flex-none"
                  size="sm"
                  aria-label={t('wizard.saveDraft', 'Sauvegarder comme brouillon')}
                >
                  <Save className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
                  <span className="hidden sm:inline">
                    {t('wizard.saveDraft', 'Sauvegarder brouillon')}
                  </span>
                  <span className="sm:hidden">{t('wizard.draft', 'Brouillon')}</span>
                  <Badge variant="secondary" className="ml-1.5 hidden sm:flex text-[10px]">
                    ⌘S
                  </Badge>
                </Button>
                <Button
                  onClick={handleNext}
                  disabled={isSubmitting}
                  className="flex-1 sm:flex-none"
                  size="sm"
                  aria-label={t('wizard.next', 'Étape suivante')}
                >
                  <span className="hidden sm:inline">{t('wizard.next', 'Suivant')}</span>
                  <span className="sm:hidden">{t('wizard.nextShort', 'Suiv.')}</span>
                  <ChevronRight className="h-4 w-4 ml-1.5 sm:ml-2" />
                  <Badge variant="secondary" className="ml-1.5 hidden sm:flex text-[10px]">
                    ⌘→
                  </Badge>
                </Button>
              </>
            )}

            {currentStep === STEPS.length && (
              <>
                <Button
                  variant="outline"
                  onClick={handleSaveDraft}
                  disabled={isSubmitting}
                  className="flex-1 sm:flex-none"
                  size="sm"
                  aria-label={t('wizard.saveDraft', 'Sauvegarder comme brouillon')}
                >
                  <Save className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
                  <span className="hidden sm:inline">
                    {t('wizard.saveDraft', 'Sauvegarder brouillon')}
                  </span>
                  <span className="sm:hidden">{t('wizard.draft', 'Brouillon')}</span>
                  <Badge variant="secondary" className="ml-1.5 hidden sm:flex text-[10px]">
                    ⌘S
                  </Badge>
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="flex-1 sm:flex-none bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
                  size="sm"
                  aria-label={t('wizard.publish', 'Publier le produit')}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2 animate-spin" />
                      <span className="hidden sm:inline">
                        {t('wizard.publishing', 'Publication...')}
                      </span>
                      <span className="sm:hidden">{t('wizard.publishingShort', 'Pub...')}</span>
                    </>
                  ) : (
                    <>
                      <Check className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
                      <span className="hidden sm:inline">
                        {t('wizard.publish', 'Publier le produit')}
                      </span>
                      <span className="sm:hidden">{t('wizard.publishShort', 'Publier')}</span>
                    </>
                  )}
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Keyboard Shortcuts Help */}
        <div className="hidden lg:flex items-center justify-center gap-4 pt-4 border-t border-border/50">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Keyboard className="h-3 w-3" aria-hidden="true" />
            <span>{t('wizard.shortcuts', 'Raccourcis')}:</span>
            <Badge variant="outline" className="text-[10px] font-mono">
              ⌘S
            </Badge>
            <span className="text-muted-foreground">{t('wizard.shortcuts.save', 'Brouillon')}</span>
            <Badge variant="outline" className="text-[10px] font-mono ml-2">
              ⌘→
            </Badge>
            <span className="text-muted-foreground">{t('wizard.shortcuts.next', 'Suivant')}</span>
            <Badge variant="outline" className="text-[10px] font-mono ml-2">
              ⌘←
            </Badge>
            <span className="text-muted-foreground">{t('wizard.shortcuts.prev', 'Précédent')}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
