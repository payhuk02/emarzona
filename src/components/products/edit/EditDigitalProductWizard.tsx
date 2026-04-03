/**
 * Edit Digital Product Wizard
 * Date: 2025-01-26
 *
 * Wizard professionnel pour l'édition complète de produits digitaux
 * Permet de modifier toutes les étapes comme dans le wizard de création
 */

import { useState, useMemo, useCallback, useEffect } from 'react';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Download,
  Info,
  FileText,
  Shield,
  Users,
  Search,
  Eye,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Save,
  AlertCircle,
  CheckCircle2,
  Loader2,
} from 'lucide-react';
import { DigitalBasicInfoForm } from '../create/digital/DigitalBasicInfoForm';
import { DigitalFilesUploader } from '../create/digital/DigitalFilesUploader';
import { DigitalLicenseConfig } from '../create/digital/DigitalLicenseConfig';
import { DigitalAffiliateSettings } from '../create/digital/DigitalAffiliateSettings';
import { DigitalPreview } from '../create/digital/DigitalPreview';
import { ProductSEOForm } from '../create/shared/ProductSEOForm';
import { ProductFAQForm } from '../create/shared/ProductFAQForm';
import { ProductStatisticsDisplaySettings } from '../create/shared/ProductStatisticsDisplaySettings';
import { useToast } from '@/hooks/use-toast';
import { useStore } from '@/hooks/useStore';
import { useAuth } from '@/contexts/AuthContext';
import { useWizardServerValidation } from '@/hooks/useWizardServerValidation';
import { supabase } from '@/integrations/supabase/client';
import type { Json } from '@/integrations/supabase/types';
import { logger } from '@/lib/logger';
import { cn } from '@/lib/utils';
import type {
  DigitalProductFormData,
  DigitalProductFormDataUpdate,
  DigitalProductDownloadableFile,
  DigitalProductFAQ,
} from '@/types/digital-product-form';
import { useQuery } from '@tanstack/react-query';

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

interface EditDigitalProductWizardProps {
  productId: string;
  storeId?: string;
  storeSlug?: string;
  onSuccess?: () => void;
  onBack?: () => void;
}

/**
 * Convert digital product from DB to form data
 * ✅ SÉCURITÉ: Inclut validation de propriété
 */
const convertToFormData = async (productId: string, userId?: string): Promise<Partial<DigitalProductFormData>> => {
  // ✅ SÉCURITÉ: Vérifier propriété du produit avant chargement
  if (userId) {
    const { data: ownershipCheck, error: ownershipError } = await supabase
      .from('products')
      .select(`
        id,
        stores!inner(user_id)
      `)
      .eq('id', productId)
      .eq('stores.user_id', userId)
      .single();

    if (ownershipError || !ownershipCheck) {
      throw new Error('Accès non autorisé à ce produit');
    }
  }

  // Produit principal
  const { data: product, error: productError } = await supabase
    .from('products')
    .select('*')
    .eq('id', productId)
    .single();

  if (productError) throw productError;

  // 🚀 PERFORMANCE: Requêtes parallèles pour les données liées
  const [
    { data: digitalProduct, error: digitalError },
    { data: files },
    { data: affiliateSettings }
  ] = await Promise.all([
    // Données digitales
    supabase.from('digital_products').select('*').eq('product_id', productId).maybeSingle(),

    // Fichiers (utilise product_id pour la compatibilité)
    supabase.from('digital_product_files').select('*').eq('product_id', productId).order('order_index', { ascending: true }),

    // Paramètres d'affiliation
    supabase.from('product_affiliate_settings').select('*').eq('product_id', productId).maybeSingle()
  ]);

  if (digitalError && digitalError.code !== 'PGRST116') throw digitalError;

  // Convert files to downloadable_files format
  const downloadableFiles: DigitalProductDownloadableFile[] = (files || []).map(file => ({
    id: file.id,
    name: file.name,
    url: file.file_url,
    size: file.file_size_mb ? file.file_size_mb * 1024 * 1024 : 0,
    format: file.file_type || undefined,
    category: file.category || undefined,
    version: file.version || undefined,
    is_main: file.is_main || false,
  }));

  return {
    // Basic info
    name: product.name || '',
    slug: product.slug || '',
    description: product.description || '',
    short_description: product.short_description || '',
    category: product.category || 'ebook',
    digital_type: digitalProduct?.digital_type || 'ebook',
    image_url: product.image_url || '',
    images: Array.isArray(product.images)
      ? (product.images as string[])
      : product.images
        ? [String(product.images)]
        : [],
    price: product.price || 0,
    promotional_price: product.promotional_price || null,
    currency: product.currency || 'XOF',
    pricing_model:
      (product.pricing_model as 'one-time' | 'subscription' | 'free' | 'pay-what-you-want') ||
      'one-time',

    // Files
    main_file_url: digitalProduct?.main_file_url || downloadableFiles[0]?.url || '',
    main_file_version: digitalProduct?.main_file_version || '1.0',
    downloadable_files: downloadableFiles,

    // License Config
    license_type:
      (digitalProduct?.license_type as
        | 'single'
        | 'multi'
        | 'unlimited'
        | 'subscription'
        | 'lifetime') || 'single',
    license_duration_days: digitalProduct?.license_duration_days || null,
    max_activations: digitalProduct?.max_activations || 1,
    allow_license_transfer: digitalProduct?.allow_license_transfer || false,
    auto_generate_keys: digitalProduct?.auto_generate_keys !== false,

    // Download Settings
    download_limit: digitalProduct?.download_limit || 5,
    download_expiry_days: digitalProduct?.download_expiry_days || 30,
    require_registration: digitalProduct?.require_registration !== false,
    watermark_enabled: digitalProduct?.watermark_enabled || false,
    watermark_text: digitalProduct?.watermark_text || '',

    // Version
    version: digitalProduct?.version || '1.0',

    // Affiliate
    affiliate: affiliateSettings
      ? {
          enabled: affiliateSettings.affiliate_enabled || false,
          commission_rate: affiliateSettings.commission_rate || 20,
          commission_type:
            (affiliateSettings.commission_type as 'percentage' | 'fixed') || 'percentage',
          fixed_commission_amount: affiliateSettings.fixed_commission_amount || 0,
          cookie_duration_days: affiliateSettings.cookie_duration_days || 30,
          min_order_amount: affiliateSettings.min_order_amount || 0,
          allow_self_referral: affiliateSettings.allow_self_referral || false,
          require_approval: affiliateSettings.require_approval || false,
          terms_and_conditions: affiliateSettings.terms_and_conditions || '',
        }
      : {
          enabled: false,
          commission_rate: 20,
          commission_type: 'percentage' as const,
          fixed_commission_amount: 0,
          cookie_duration_days: 30,
          min_order_amount: 0,
          allow_self_referral: false,
          require_approval: false,
          terms_and_conditions: '',
        },

    // SEO
    seo: {
      meta_title: product.meta_title || '',
      meta_description: product.meta_description || '',
      meta_keywords: '',
      og_title: '',
      og_description: '',
      og_image: product.og_image || '',
    },

    // FAQs
    faqs: Array.isArray(product.faqs) ? (product.faqs as unknown as DigitalProductFAQ[]) : [],

    // Licensing
    licensing_type: (product.licensing_type as 'plr' | 'copyrighted' | 'standard') || 'standard',
    license_terms: product.license_terms || '',

    // Statistics Display Settings
    hide_purchase_count: product.hide_purchase_count || false,
    hide_likes_count:
      ((product as Record<string, unknown>).hide_likes_count as boolean | undefined) || false,
    hide_recommendations_count:
      ((product as Record<string, unknown>).hide_recommendations_count as boolean | undefined) ||
      false,
    hide_downloads_count:
      ((product as Record<string, unknown>).hide_downloads_count as boolean | undefined) || false,
    hide_reviews_count:
      ((product as Record<string, unknown>).hide_reviews_count as boolean | undefined) || false,
    hide_rating: ((product as Record<string, unknown>).hide_rating as boolean | undefined) || false,

    // Metadata
    product_type: 'digital' as const,
    is_active: product.is_active ?? true,
  };
};

export const EditDigitalProductWizard = ({
  productId,
  storeId: propsStoreId,
  storeSlug,
  onSuccess,
  onBack,
}: EditDigitalProductWizardProps) => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const { user } = useAuth();
  const { store: hookStore, loading: storeLoading } = useStore();
  const store = hookStore || (propsStoreId ? { id: propsStoreId } : null);
  const storeId = propsStoreId || store?.id;

  // Load existing product with security validation and cache optimisé
  const {
    data: formDataInitial,
    isLoading: loadingProduct,
    error: productError,
  } = useQuery({
    queryKey: ['digital-product-edit', productId, user?.id],
    queryFn: () => convertToFormData(productId, user?.id),
    enabled: !!productId && !!user?.id,
    staleTime: 5 * 60 * 1000, // 5 minutes - données fraîches
    gcTime: 10 * 60 * 1000, // 10 minutes - cache conservé
    retry: (failureCount, error) => {
      // Ne pas retry si c'est une erreur d'autorisation
      if (error?.message?.includes('non autorisé')) return false;
      return failureCount < 3;
    },
  });

  const [currentStep, setCurrentStep] = useState(1);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState<Partial<DigitalProductFormData>>({});
  const [validationErrors, setValidationErrors] = useState<Record<number, string[]>>({});

  // Initialize form data when product is loaded
  useEffect(() => {
    if (formDataInitial) {
      setFormData(formDataInitial);
    }
  }, [formDataInitial]);

  // Server validation hook
  const { validateDigitalProduct: validateDigitalProductServer, clearServerErrors } =
    useWizardServerValidation({
      storeId: storeId || undefined,
      productId,
    });

  const handleUpdateFormData = useCallback((updates: DigitalProductFormDataUpdate) => {
    setFormData(prev => {
      const newData = { ...prev, ...updates };

      if (updates.affiliate) {
        newData.affiliate = {
          ...prev.affiliate,
          ...updates.affiliate,
        } as DigitalProductFormData['affiliate'];
      }

      if (updates.seo) {
        newData.seo = {
          ...prev.seo,
          ...updates.seo,
        } as DigitalProductFormData['seo'];
      }

      if (updates.faqs) {
        newData.faqs = updates.faqs;
      }

      if (updates.downloadable_files) {
        newData.downloadable_files = updates.downloadable_files;
      }

      return newData;
    });
  }, []);

  /**
   * Validate current step
   */
  const validateStep = useCallback(
    async (step: number): Promise<{ valid: boolean; errors: string[] }> => {
      const errors: string[] = [];
      clearServerErrors();

      switch (step) {
        case 1: {
          if (!formData.name || formData.name.trim().length < 2) {
            errors.push('Le nom doit contenir au moins 2 caractères');
          }

          // Ne pas exiger le prix si le modèle de tarification est "free"
          const pricingModel = formData.pricing_model || 'one-time';
          if (pricingModel !== 'free' && (!formData.price || formData.price <= 0)) {
            errors.push('Le prix doit être supérieur à 0');
          }

          if (errors.length > 0) {
            setValidationErrors(prev => ({ ...prev, [step]: errors }));
            return { valid: false, errors };
          }

          // Server validation
          // Générer le slug si nécessaire pour la validation
          const slugForValidation =
            formData.slug?.trim() ||
            formData.name
              ?.toLowerCase()
              .replace(/[^a-z0-9]+/g, '-')
              .replace(/(^-|-$)/g, '') ||
            null;

          if (storeId && slugForValidation) {
            const serverResult = await validateDigitalProductServer({
              name: formData.name || '',
              slug: slugForValidation,
              price: pricingModel === 'free' ? 0 : formData.price || 0,
            });

            if (!serverResult.valid) {
              logger.warn(
                '[EditDigitalProductWizard] Validation serveur échouée - Analyse détaillée',
                {
                  step,
                  serverResultValid: serverResult.valid,
                  serverResultErrors: serverResult.errors,
                  serverResultErrorsType: typeof serverResult.errors,
                  serverResultErrorsIsArray: Array.isArray(serverResult.errors),
                  serverResultErrorsLength: serverResult.errors?.length,
                  serverResultMessage: serverResult.message,
                  serverResultError: serverResult.error,
                  serverResultFull: JSON.stringify(serverResult, null, 2),
                }
              );

              // Ajouter les erreurs du serveur si disponibles
              // serverResult.errors est un tableau d'objets {field, message}
              if (
                serverResult.errors &&
                Array.isArray(serverResult.errors) &&
                serverResult.errors.length > 0
              ) {
                serverResult.errors.forEach((errorObj, index) => {
                  logger.info(`[EditDigitalProductWizard] Traitement erreur ${index}`, {
                    errorObj,
                    errorObjType: typeof errorObj,
                  });
                  if (errorObj && errorObj.message && typeof errorObj.message === 'string') {
                    errors.push(errorObj.message);
                  } else if (typeof errorObj === 'string') {
                    // Si l'erreur est directement une string
                    errors.push(errorObj);
                  } else if (errorObj && typeof errorObj === 'object') {
                    // Essayer d'extraire le message de différentes façons
                    const errorObjRecord = errorObj as Record<string, unknown>;
                    const message =
                      (errorObjRecord.message as string | undefined) || JSON.stringify(errorObj);
                    if (message) errors.push(String(message));
                  }
                });
              }

              // Si aucune erreur spécifique mais un message général, l'utiliser
              if (errors.length === 0 && serverResult.message) {
                errors.push(serverResult.message);
              }

              // Si toujours aucune erreur, utiliser un message par défaut
              if (errors.length === 0) {
                errors.push('Erreur de validation serveur. Veuillez vérifier vos données.');
              }

              logger.warn('[EditDigitalProductWizard] Erreurs finales après traitement', {
                step,
                errorsCount: errors.length,
                errors,
                validationErrorsState: validationErrors,
              });

              setValidationErrors(prev => {
                const newErrors = { ...prev, [step]: errors };
                logger.info('[EditDigitalProductWizard] Mise à jour validationErrors', {
                  step,
                  newErrors,
                  previousErrors: prev,
                });
                return newErrors;
              });
              return { valid: false, errors };
            }
          }

          setValidationErrors(prev => {
            const newErrors = { ...prev };
            delete newErrors[step];
            return newErrors;
          });
          return { valid: true, errors: [] };
        }

        case 2: {
          if (
            !formData.main_file_url &&
            (!formData.downloadable_files || formData.downloadable_files.length === 0)
          ) {
            errors.push('Au moins un fichier est requis');
          }

          if (errors.length > 0) {
            setValidationErrors(prev => ({ ...prev, [step]: errors }));
            return { valid: false, errors };
          }

          setValidationErrors(prev => {
            const newErrors = { ...prev };
            delete newErrors[step];
            return newErrors;
          });
          return { valid: true, errors: [] };
        }

        default:
          setValidationErrors(prev => {
            const newErrors = { ...prev };
            delete newErrors[step];
            return newErrors;
          });
          return { valid: true, errors: [] };
      }
    },
    [formData, storeId, validateDigitalProductServer, clearServerErrors]
  );

  /**
   * Save product
   */
  const saveProduct = useCallback(async () => {
    if (!store || !productId) {
      throw new Error('Store ou Product ID manquant');
    }

    setIsSaving(true);
    try {
      // ✅ SÉCURITÉ: Vérifier propriété du produit avant modification
      if (user) {
        const { data: ownershipCheck, error: ownershipError } = await supabase
          .from('products')
          .select(`
            id,
            stores!inner(user_id)
          `)
          .eq('id', productId)
          .eq('stores.user_id', user.id)
          .single();

        if (ownershipError || !ownershipCheck) {
          throw new Error('Vous n\'avez pas les permissions pour modifier ce produit');
        }
      }
      // Generate slug if not provided
      let slug =
        formData.slug?.trim() ||
        formData.name
          ?.toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)/g, '') ||
        'product';

      // Check slug uniqueness (excluding current product)
      let attempts = 0;
      const maxAttempts = 10;
      while (attempts < maxAttempts) {
        const { data: existing } = await supabase
          .from('products')
          .select('id')
          .eq('store_id', store.id)
          .eq('slug', slug)
          .neq('id', productId)
          .limit(1);

        if (!existing || existing.length === 0) {
          break;
        }

        attempts++;
        const baseSlug =
          formData.slug?.trim() ||
          formData.name
            ?.toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)/g, '') ||
          'product';
        slug = `${baseSlug}-${attempts}`;
      }

      if (attempts >= maxAttempts) {
        throw new Error('Impossible de générer un slug unique');
      }

      // Update product
      const { error: productError } = await supabase
        .from('products')
        .update({
          name: formData.name,
          slug,
          description: formData.description,
          short_description: formData.short_description,
          category: formData.category,
          price: formData.pricing_model === 'free' ? 0 : formData.price || 0,
          promotional_price: formData.promotional_price,
          currency: formData.currency,
          pricing_model: formData.pricing_model || 'one-time',
          image_url: formData.image_url || '',
          images: formData.images || [],
          meta_title: formData.seo?.meta_title,
          meta_description: formData.seo?.meta_description,
          og_image: formData.seo?.og_image,
          faqs: (formData.faqs || []) as unknown as Json,
          licensing_type: formData.licensing_type || 'standard',
          license_terms: formData.license_terms || null,
          hide_purchase_count: formData.hide_purchase_count,
          hide_likes_count: formData.hide_likes_count,
          hide_recommendations_count: formData.hide_recommendations_count,
          hide_downloads_count: formData.hide_downloads_count,
          hide_reviews_count: formData.hide_reviews_count,
          hide_rating: formData.hide_rating,
          is_active: formData.is_active,
        })
        .eq('id', productId);

      if (productError) throw productError;

      // Get digital product ID
      const { data: existingDigital } = await supabase
        .from('digital_products')
        .select('id')
        .eq('product_id', productId)
        .limit(1)
        .maybeSingle();

      const mainFile = formData.downloadable_files?.[0];
      const mainFileFormat = mainFile?.format || mainFile?.name?.split('.').pop() || 'unknown';
      const totalSizeMB = (formData.downloadable_files || []).reduce(
        (sum, file) => sum + (file.size || 0) / (1024 * 1024),
        0
      );

      const digitalProductData = {
        product_id: productId,
        digital_type: formData.digital_type || 'ebook',
        license_type: formData.license_type || 'single',
        license_duration_days: formData.license_duration_days || null,
        max_activations: formData.max_activations || 1,
        allow_license_transfer: formData.allow_license_transfer || false,
        auto_generate_keys: formData.auto_generate_keys !== false,
        main_file_url: formData.main_file_url || mainFile?.url || '',
        main_file_size_mb: mainFile ? (mainFile.size || 0) / (1024 * 1024) : 0,
        main_file_format: mainFileFormat,
        main_file_version: formData.main_file_version || '1.0',
        total_files: formData.downloadable_files?.length || 1,
        total_size_mb: totalSizeMB,
        download_limit: formData.download_limit || 5,
        download_expiry_days: formData.download_expiry_days || 30,
        require_registration: formData.require_registration !== false,
        watermark_enabled: formData.watermark_enabled || false,
        watermark_text: formData.watermark_text || '',
        version: formData.version || '1.0',
      };

      if (existingDigital) {
        const { error: digitalError } = await supabase
          .from('digital_products')
          .update(digitalProductData)
          .eq('id', existingDigital.id);

        if (digitalError) throw digitalError;
      } else {
        const { error: digitalError } = await supabase
          .from('digital_products')
          .insert(digitalProductData);

        if (digitalError) throw digitalError;
      }

      // Update files
      if (formData.downloadable_files && formData.downloadable_files.length > 0) {
        // Delete existing files
        if (existingDigital) {
          await supabase
            .from('digital_product_files')
            .delete()
            .eq('digital_product_id', existingDigital.id);
        }

        // Insert new files
        const filesData = formData.downloadable_files.map((file, index) => ({
          digital_product_id: existingDigital?.id || productId,
          name: file.name,
          file_url: file.url,
          file_type: file.format || file.name?.split('.').pop() || 'unknown',
          file_size_mb: (file.size || 0) / (1024 * 1024),
          order_index: index,
          is_main: index === 0,
          is_preview: false,
          requires_purchase: true,
          version: file.version || '1.0',
        }));

        const { error: filesError } = await supabase
          .from('digital_product_files')
          .insert(filesData);

        if (filesError) throw filesError;
      }

      // Update affiliate settings
      if (formData.affiliate?.enabled) {
        const { data: existingAffiliate } = await supabase
          .from('product_affiliate_settings')
          .select('id')
          .eq('product_id', productId)
          .limit(1)
          .maybeSingle();

        const affiliateData = {
          product_id: productId,
          store_id: store.id,
          affiliate_enabled: formData.affiliate.enabled,
          commission_rate: formData.affiliate.commission_rate,
          commission_type: formData.affiliate.commission_type,
          fixed_commission_amount: formData.affiliate.fixed_commission_amount,
          cookie_duration_days: formData.affiliate.cookie_duration_days,
          min_order_amount: formData.affiliate.min_order_amount,
          allow_self_referral: formData.affiliate.allow_self_referral,
          require_approval: formData.affiliate.require_approval,
          terms_and_conditions: formData.affiliate.terms_and_conditions,
        };

        if (existingAffiliate) {
          await supabase
            .from('product_affiliate_settings')
            .update(affiliateData)
            .eq('id', existingAffiliate.id);
        } else {
          await supabase.from('product_affiliate_settings').insert(affiliateData);
        }
      }

      toast({
        title: '✅ Produit mis à jour',
        description: 'Le produit a été modifié avec succès',
      });

      onSuccess?.();
    } catch (error) {
      logger.error('Error updating digital product', { error, productId });
      toast({
        title: '❌ Erreur',
        description:
          error instanceof Error ? error.message : 'Impossible de mettre à jour le produit',
        variant: 'destructive',
      });
      throw error;
    } finally {
      setIsSaving(false);
    }
  }, [formData, productId, store, onSuccess, toast]);

  const handleNext = useCallback(async () => {
    const result = await validateStep(currentStep);
    if (result.valid) {
      setCurrentStep(prev => Math.min(prev + 1, STEPS.length));
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      const errorMessages =
        result.errors.length > 0
          ? result.errors.join(', ')
          : 'Veuillez corriger les erreurs avant de continuer';
      toast({
        title: 'Erreurs de validation',
        description: errorMessages,
        variant: 'destructive',
      });
    }
  }, [currentStep, validateStep, toast]);

  const handlePrevious = useCallback(() => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const handleSave = useCallback(async () => {
    const result = await validateStep(currentStep);
    logger.info('[EditDigitalProductWizard] handleSave - Résultat validation', {
      currentStep,
      isValid: result.valid,
      errors: result.errors,
      errorsCount: result.errors.length,
    });
    if (result.valid) {
      await saveProduct();
    } else {
      const errorMessages =
        result.errors.length > 0
          ? result.errors.join(', ')
          : 'Veuillez corriger les erreurs avant de sauvegarder';

      logger.warn('[EditDigitalProductWizard] handleSave - Validation échouée', {
        currentStep,
        errorMessages,
        errors: result.errors,
      });

      toast({
        title: 'Erreurs de validation',
        description: errorMessages,
        variant: 'destructive',
      });
    }
  }, [currentStep, validateStep, saveProduct, toast]);

  const renderStepContent = useCallback(() => {
    switch (currentStep) {
      case 1:
        return (
          <DigitalBasicInfoForm
            formData={formData as unknown as DigitalProductFormData}
            updateFormData={handleUpdateFormData}
            storeSlug={storeSlug || ''}
          />
        );
      case 2:
        return (
          <DigitalFilesUploader
            formData={formData as DigitalProductFormData}
            updateFormData={handleUpdateFormData}
          />
        );
      case 3:
        return (
          <div className="space-y-6">
            <DigitalLicenseConfig
              formData={formData as unknown as Record<string, unknown>}
              updateFormData={handleUpdateFormData as (updates: Record<string, unknown>) => void}
            />
            <ProductStatisticsDisplaySettings
              formData={{
                hide_purchase_count: formData.hide_purchase_count,
                hide_likes_count: formData.hide_likes_count,
                hide_recommendations_count: formData.hide_recommendations_count,
                hide_downloads_count: formData.hide_downloads_count,
                hide_reviews_count: formData.hide_reviews_count,
                hide_rating: formData.hide_rating,
              }}
              updateFormData={(field, value) => handleUpdateFormData({ [field]: value })}
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
            data={
              formData.affiliate || {
                enabled: false,
                commission_rate: 20,
                commission_type: 'percentage' as const,
                fixed_commission_amount: 0,
                cookie_duration_days: 30,
                min_order_amount: 0,
                allow_self_referral: false,
                require_approval: false,
                terms_and_conditions: '',
              }
            }
            onUpdate={affiliateData =>
              handleUpdateFormData({
                affiliate: affiliateData as unknown as DigitalProductFormData['affiliate'],
              })
            }
          />
        );
      case 5:
        return (
          <div className="space-y-4 sm:space-y-6">
            <ProductSEOForm
              productName={formData.name || ''}
              productDescription={formData.description || ''}
              productPrice={formData.price || 0}
              data={{
                meta_title: formData.seo?.meta_title || '',
                meta_description: formData.seo?.meta_description || '',
                meta_keywords: formData.seo?.meta_keywords || '',
                og_title: formData.seo?.og_title || '',
                og_description: formData.seo?.og_description || '',
                og_image: formData.seo?.og_image || '',
              }}
              onUpdate={seoData =>
                handleUpdateFormData({ seo: seoData as unknown as DigitalProductFormData['seo'] })
              }
            />
            <ProductFAQForm
              data={(formData.faqs || []).map((faq, index) => ({
                id: faq.id || crypto.randomUUID(),
                question: faq.question,
                answer: faq.answer,
                order: faq.order ?? index,
              }))}
              onUpdate={faqs =>
                handleUpdateFormData({
                  faqs: faqs.map((faq, index) => ({
                    id: faq.id,
                    question: faq.question,
                    answer: faq.answer,
                    order: faq.order ?? index,
                  })) as unknown as DigitalProductFAQ[],
                })
              }
            />
          </div>
        );
      case 6:
        return <DigitalPreview formData={formData as DigitalProductFormData} />;
      default:
        return null;
    }
  }, [currentStep, formData, handleUpdateFormData, storeSlug]);

  const CurrentStep = STEPS[currentStep - 1];
  const progress = useMemo(() => (currentStep / STEPS.length) * 100, [currentStep]);

  const handleStepClick = useCallback(
    (stepId: number) => {
      if (stepId <= currentStep) {
        setCurrentStep(stepId);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    },
    [currentStep]
  );

  if (storeLoading || loadingProduct) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (productError) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Erreur lors du chargement du produit. Veuillez réessayer.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background sm:py-6 lg:py-8 overflow-x-hidden w-full">
      <div className="w-full max-w-5xl mx-auto sm:px-4 lg:px-6">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          {onBack && (
            <Button
              variant="ghost"
              onClick={onBack}
              className="mb-3 sm:mb-4 min-h-[44px] touch-manipulation"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              {t('common.back', 'Retour')}
            </Button>
          )}

          <div className="flex items-center gap-2 sm:gap-3 mb-4">
            <Download className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold">Modifier le produit</h1>
          </div>

          <Progress value={progress} className="h-2" />
          <p className="text-sm text-muted-foreground mt-2">
            Étape {currentStep} sur {STEPS.length} ({Math.round(progress)}%)
          </p>
        </div>

        {/* Steps Navigator - Responsive */}
        <Card className="mb-6 sm:mb-8 border-border/50 bg-card/50 backdrop-blur-sm shadow-lg animate-in fade-in slide-in-from-bottom-4 duration-700">
          <CardContent className="p-3 sm:p-4 lg:p-6">
            <div
              className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-3"
              role="tablist"
              aria-label="Étapes du formulaire"
            >
              {STEPS.map((step, index) => {
                const Icon = step.icon;
                const isActive = step.id === currentStep;
                const isCompleted = step.id < currentStep;
                const isAccessible = step.id <= currentStep;
                const hasErrors = validationErrors[step.id]?.length > 0;

                return (
                  <button
                    key={step.id}
                    onClick={() => handleStepClick(step.id)}
                    disabled={!isAccessible}
                    role="tab"
                    aria-selected={isActive}
                    aria-label={`Étape ${step.id}: ${step.title}`}
                    className={cn(
                      'p-2 sm:p-3 rounded-lg border-2 transition-all duration-300 text-left',
                      'hover:shadow-md hover:scale-[1.02] touch-manipulation',
                      'disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100',
                      isActive &&
                        'border-primary bg-primary/5 shadow-lg scale-[1.02] ring-2 ring-primary/20',
                      isCompleted && 'border-green-500 bg-green-50 dark:bg-green-950/30',
                      !isActive &&
                        !isCompleted &&
                        isAccessible &&
                        'border-border hover:border-primary/50 bg-card/50',
                      !isAccessible && 'border-border/30 bg-muted/30',
                      hasErrors && !isCompleted && 'border-red-500 bg-red-50 dark:bg-red-950/30',
                      'animate-in fade-in slide-in-from-bottom-4'
                    )}
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <div className="flex items-center gap-1.5 sm:gap-2 mb-1">
                      <Icon
                        className={cn(
                          'h-3.5 w-3.5 sm:h-4 sm:w-4 flex-shrink-0 transition-colors',
                          isActive
                            ? 'text-primary'
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
                        isActive && 'text-primary font-semibold',
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
        {(() => {
          const currentErrors = validationErrors[currentStep];
          if (currentErrors && currentErrors.length > 0) {
            logger.info('[EditDigitalProductWizard] Affichage des erreurs de validation', {
              currentStep,
              errors: currentErrors,
              errorsCount: currentErrors.length,
            });
            return (
              <Alert variant="destructive" className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <div className="font-semibold mb-2">Erreurs de validation</div>
                  <ul className="list-disc list-inside text-sm space-y-1">
                    {currentErrors.map((error, index) => (
                      <li key={index}>{error}</li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            );
          }
          return null;
        })()}

        {/* Current Step */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {React.createElement(CurrentStep.icon, { className: 'h-5 w-5' })}
              {CurrentStep.title}
            </CardTitle>
            <CardDescription>{CurrentStep.description}</CardDescription>
          </CardHeader>
          <CardContent>{renderStepContent()}</CardContent>
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
                <ChevronLeft className="h-4 w-4 mr-2" />
                Précédent
              </Button>

              <div className="flex gap-2 flex-wrap">
                <Button
                  variant="outline"
                  onClick={handleSave}
                  disabled={isSaving}
                  className="min-h-[44px] touch-manipulation"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Sauvegarde...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Sauvegarder
                    </>
                  )}
                </Button>

                {currentStep < STEPS.length ? (
                  <Button onClick={handleNext} className="min-h-[44px] touch-manipulation">
                    Suivant
                    <ChevronRight className="h-4 w-4 ml-2" />
                  </Button>
                ) : (
                  <Button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="min-h-[44px] touch-manipulation"
                  >
                    {isSaving ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Sauvegarde...
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
