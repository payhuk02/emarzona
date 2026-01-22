/**
 * Edit Service Product Wizard
 * Date: 2025-01-26
 *
 * Wizard professionnel pour l'édition complète de services
 * Permet de modifier toutes les étapes comme dans le wizard de création
 */

import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Calendar,
  Info,
  Clock,
  Users,
  DollarSign,
  Share2,
  Search,
  Eye,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Save,
  AlertCircle,
  CheckCircle2,
  Loader2,
  CreditCard,
} from 'lucide-react';
import { ServiceBasicInfoForm } from '../create/service/ServiceBasicInfoForm';
import { ServiceDurationAvailabilityForm } from '../create/service/ServiceDurationAvailabilityForm';
import { ServiceStaffResourcesForm } from '../create/service/ServiceStaffResourcesForm';
import { ServicePricingOptionsForm } from '../create/service/ServicePricingOptionsForm';
import { ServiceAffiliateSettings } from '../create/service/ServiceAffiliateSettings';
import { ServiceSEOAndFAQs } from '../create/service/ServiceSEOAndFAQs';
import { ServicePreview } from '../create/service/ServicePreview';
import { PaymentOptionsForm } from '../create/shared/PaymentOptionsForm';
import { ProductStatisticsDisplaySettings } from '../create/shared/ProductStatisticsDisplaySettings';
import { useToast } from '@/hooks/use-toast';
import { useStore } from '@/hooks/useStore';
import { useAuth } from '@/contexts/AuthContext';
import { useWizardServerValidation } from '@/hooks/useWizardServerValidation';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';
import { cn } from '@/lib/utils';
import type {
  ServiceProductFormData,
  ServiceStaffMember,
  ServiceAvailabilitySlot,
} from '@/types/service-product';
import { useQuery } from '@tanstack/react-query';

const STEPS = [
  {
    id: 1,
    title: 'Informations de base',
    description: 'Nom, description, type de service',
    icon: Info,
    component: ServiceBasicInfoForm,
  },
  {
    id: 2,
    title: 'Durée & Disponibilité',
    description: 'Horaires, créneaux, localisation',
    icon: Clock,
    component: ServiceDurationAvailabilityForm,
  },
  {
    id: 3,
    title: 'Personnel & Ressources',
    description: 'Staff, capacité, équipement',
    icon: Users,
    component: ServiceStaffResourcesForm,
  },
  {
    id: 4,
    title: 'Tarification & Options',
    description: 'Prix, acompte, réservations',
    icon: DollarSign,
    component: ServicePricingOptionsForm,
  },
  {
    id: 5,
    title: 'Affiliation',
    description: 'Commission, affiliés (optionnel)',
    icon: Share2,
    component: ServiceAffiliateSettings,
  },
  {
    id: 6,
    title: 'SEO & FAQs',
    description: 'Référencement, questions',
    icon: Search,
    component: ServiceSEOAndFAQs,
  },
  {
    id: 7,
    title: 'Options de Paiement',
    description: 'Complet, partiel, escrow',
    icon: CreditCard,
    component: PaymentOptionsForm,
  },
  {
    id: 8,
    title: 'Aperçu & Validation',
    description: 'Vérifier et publier',
    icon: Eye,
    component: ServicePreview,
  },
];

interface EditServiceProductWizardProps {
  productId: string;
  storeId?: string;
  storeSlug?: string;
  onSuccess?: () => void;
  onBack?: () => void;
}

/**
 * Convert service product from DB to form data
 * ✅ SÉCURITÉ: Inclut validation de propriété
 */
const convertToFormData = async (productId: string, userId?: string): Promise<Partial<ServiceProductFormData>> => {
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

  // Load product with security check
  const { data: product, error: productError } = await supabase
    .from('products')
    .select('*')
    .eq('id', productId)
    .single();

  if (productError) throw productError;

  // Load service product data
  const { data: serviceProduct, error: serviceError } = await supabase
    .from('service_products')
    .select('*')
    .eq('product_id', productId)
    .single();

  if (serviceError && serviceError.code !== 'PGRST116') throw serviceError;

  // Load availability slots
  const { data: availabilitySlots } = await supabase
    .from('service_availability_slots')
    .select('*')
    .eq('service_product_id', serviceProduct?.id || productId);

  // Load staff members
  const { data: staffMembers } = await supabase
    .from('service_staff_members')
    .select('*')
    .eq('service_product_id', serviceProduct?.id || productId);

  // Load resources
  const { data: resources } = await supabase
    .from('service_resources')
    .select('*')
    .eq('service_product_id', serviceProduct?.id || productId);

  // Load affiliate settings
  const { data: affiliateSettings } = await supabase
    .from('product_affiliate_settings')
    .select('*')
    .eq('product_id', productId)
    .limit(1)
    .maybeSingle();

  return {
    // Basic Info
    name: product.name || '',
    slug: product.slug || '',
    description: product.description || '',
    short_description: product.short_description || '',
    price: product.price || 0,
    currency: product.currency || 'XOF',
    promotional_price: product.promotional_price || undefined,
    category_id: product.category_id || null,
    tags: product.tags || [],
    images: product.images || [],
    image_url: product.image_url || '',

    // Duration & Availability
    service_type:
      (serviceProduct?.service_type as
        | 'appointment'
        | 'class'
        | 'event'
        | 'consultation'
        | 'other') || 'appointment',
    duration: serviceProduct?.duration_minutes || 60,
    duration_minutes: serviceProduct?.duration_minutes || 60,
    location_type:
      (serviceProduct?.location_type as 'on_site' | 'online' | 'customer_location' | 'flexible') ||
      'on_site',
    location_address: serviceProduct?.location_address || undefined,
    meeting_url: serviceProduct?.meeting_url || undefined,
    availability_slots: (availabilitySlots || []).map((slot: Record<string, unknown>) => ({
      day: (slot.day_of_week as number) || 0,
      start_time: (slot.start_time as string) || '09:00',
      end_time: (slot.end_time as string) || '17:00',
    })) as ServiceAvailabilitySlot[],
    timezone: serviceProduct?.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,

    // Staff & Resources
    requires_staff: serviceProduct?.requires_staff ?? true,
    staff_members: (staffMembers || []).map((staff: Record<string, unknown>) => ({
      id: staff.id as string,
      name: (staff.name as string) || '',
      email: (staff.email as string) || '',
      role: (staff.role as string) || undefined,
      avatar_url: (staff.avatar_url as string) || undefined,
      availability: staff.availability as Record<string, unknown> | undefined,
    })) as ServiceStaffMember[],
    max_participants: serviceProduct?.max_participants || 1,
    resources: (resources || [])
      .map((r: Record<string, unknown>) => (r.name as string) || (r.resource_name as string))
      .filter(Boolean),
    resources_needed: (resources || [])
      .map((r: Record<string, unknown>) => (r.name as string) || (r.resource_name as string))
      .filter(Boolean),

    // Pricing & Options
    pricing_type:
      (serviceProduct?.pricing_type as 'fixed' | 'hourly' | 'per_participant') || 'fixed',
    deposit_required: serviceProduct?.deposit_required || false,
    deposit_amount: serviceProduct?.deposit_amount || undefined,
    deposit_type: (serviceProduct?.deposit_type as 'fixed' | 'percentage') || undefined,
    booking_options: {
      allow_booking_cancellation: serviceProduct?.allow_booking_cancellation ?? true,
      cancellation_deadline_hours: serviceProduct?.cancellation_deadline_hours || 24,
      require_approval: serviceProduct?.require_approval || false,
      buffer_time_before: serviceProduct?.buffer_time_before || 0,
      buffer_time_after: serviceProduct?.buffer_time_after || 0,
      advance_booking_days: serviceProduct?.advance_booking_days || 30,
    },

    // Affiliation
    affiliate: affiliateSettings
      ? {
          enabled: affiliateSettings.affiliate_enabled || false,
          commission_rate: affiliateSettings.commission_rate || 10,
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
          commission_rate: 10,
          commission_type: 'percentage' as const,
          fixed_commission_amount: 0,
          cookie_duration_days: 30,
          min_order_amount: 0,
          allow_self_referral: false,
          require_approval: false,
          terms_and_conditions: '',
        },

    // SEO & FAQs
    seo: {
      meta_title: product.meta_title || '',
      meta_description: product.meta_description || '',
      meta_keywords: '',
      og_title: '',
      og_description: '',
      og_image: product.og_image || '',
    },
    faqs: product.faqs || [],

    // Payment Options
    payment: product.payment_options || {
      payment_type: 'full',
      percentage_rate: 30,
    },

    // Statistics Display Settings
    hide_purchase_count: product.hide_purchase_count || false,
    hide_likes_count: product.hide_likes_count || false,
    hide_recommendations_count: product.hide_recommendations_count || false,
    hide_downloads_count: product.hide_downloads_count || false,
    hide_reviews_count: product.hide_reviews_count || false,
    hide_rating: product.hide_rating || false,

    // Meta
    is_active: product.is_active ?? true,
  };
};

export const EditServiceProductWizard = ({
  productId,
  storeId: propsStoreId,
  storeSlug,
  onSuccess,
  onBack,
}: EditServiceProductWizardProps) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const { store: hookStore, loading: storeLoading } = useStore();
  const store = hookStore || (propsStoreId ? { id: propsStoreId } : null);
  const storeId = propsStoreId || store?.id;

  // Load existing product with security validation
  const {
    data: formDataInitial,
    isLoading: loadingProduct,
    error: productError,
  } = useQuery({
    queryKey: ['service-product-edit', productId, user?.id],
    queryFn: () => convertToFormData(productId, user?.id),
    enabled: !!productId && !!user?.id,
  });

  const [currentStep, setCurrentStep] = useState(1);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState<Partial<ServiceProductFormData>>({});
  const [validationErrors, setValidationErrors] = useState<Record<number, string[]>>({});

  // Initialize form data when product is loaded
  useEffect(() => {
    if (formDataInitial) {
      setFormData(formDataInitial);
    }
  }, [formDataInitial]);

  // Server validation hook
  const {
    validateSlug,
    validateService: validateServiceServer,
    clearServerErrors,
  } = useWizardServerValidation({
    storeId: storeId || undefined,
    productId,
  });

  const handleUpdateFormData = useCallback(
    (updates: Partial<ServiceProductFormData> & Record<string, unknown>) => {
      setFormData(prev => {
        const newData = { ...prev, ...updates };

        // Handle nested objects
        if (updates.affiliate) {
          newData.affiliate = {
            ...prev.affiliate,
            ...updates.affiliate,
          } as ServiceProductFormData['affiliate'];
        }

        if (updates.seo) {
          newData.seo = {
            ...prev.seo,
            ...updates.seo,
          } as ServiceProductFormData['seo'];
        }

        if (updates.booking_options) {
          newData.booking_options = {
            ...prev.booking_options,
            ...updates.booking_options,
          } as ServiceProductFormData['booking_options'];
        }

        if (updates.payment) {
          newData.payment = {
            ...prev.payment,
            ...updates.payment,
          } as ServiceProductFormData['payment'];
        }

        return newData;
      });
    },
    []
  );

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
          if (!formData.price || formData.price <= 0) {
            errors.push('Le prix doit être supérieur à 0');
          }

          if (errors.length > 0) {
            setValidationErrors(prev => ({ ...prev, [step]: errors }));
            return { valid: false, errors };
          }

          // Server validation
          if (storeId && formData.name) {
            // Générer le slug si nécessaire pour la validation
            const slugForValidation =
              formData.slug?.trim() ||
              formData.name
                ?.toLowerCase()
                .replace(/[^a-z0-9]+/g, '-')
                .replace(/(^-|-$)/g, '') ||
              '';

            const serverResult = await validateServiceServer({
              name: formData.name || '',
              slug: slugForValidation,
              price: formData.price || 0,
            });

            if (!serverResult.valid) {
              // Ajouter les erreurs du serveur si disponibles
              // serverResult.errors est un tableau d'objets {field, message}
              if (
                serverResult.errors &&
                Array.isArray(serverResult.errors) &&
                serverResult.errors.length > 0
              ) {
                serverResult.errors.forEach(errorObj => {
                  if (errorObj && errorObj.message && typeof errorObj.message === 'string') {
                    errors.push(errorObj.message);
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
              logger.warn('[EditServiceProductWizard] Validation échouée', {
                step,
                errors,
                serverResult,
                formData: { name: formData.name, slug: slugForValidation, price: formData.price },
              });
              setValidationErrors(prev => ({ ...prev, [step]: errors }));
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

        default:
          setValidationErrors(prev => {
            const newErrors = { ...prev };
            delete newErrors[step];
            return newErrors;
          });
          return { valid: true, errors: [] };
      }
    },
    [formData, storeId, validateServiceServer, clearServerErrors]
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
        'service';

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
          'service';
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
          price: formData.price || 0,
          promotional_price: formData.promotional_price,
          currency: formData.currency || 'XOF',
          image_url: formData.image_url || '',
          images: formData.images || [],
          category_id: formData.category_id,
          tags: formData.tags || [],
          meta_title: formData.seo?.meta_title,
          meta_description: formData.seo?.meta_description,
          og_image: formData.seo?.og_image,
          faqs: formData.faqs || [],
          payment_options: formData.payment,
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

      // Get service product ID
      const { data: existingService } = await supabase
        .from('service_products')
        .select('id')
        .eq('product_id', productId)
        .limit(1)
        .maybeSingle();

      const serviceProductData = {
        product_id: productId,
        service_type: formData.service_type || 'appointment',
        duration_minutes: formData.duration_minutes || 60,
        location_type: formData.location_type || 'on_site',
        location_address: formData.location_address || null,
        meeting_url: formData.meeting_url || null,
        timezone: formData.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
        requires_staff: formData.requires_staff ?? true,
        max_participants: formData.max_participants || 1,
        pricing_type: formData.pricing_type || 'fixed',
        deposit_required: formData.deposit_required || false,
        deposit_amount: formData.deposit_amount || null,
        deposit_type: formData.deposit_type || null,
        allow_booking_cancellation: formData.booking_options?.allow_booking_cancellation ?? true,
        cancellation_deadline_hours: formData.booking_options?.cancellation_deadline_hours || 24,
        require_approval: formData.booking_options?.require_approval || false,
        buffer_time_before: formData.booking_options?.buffer_time_before || 0,
        buffer_time_after: formData.booking_options?.buffer_time_after || 0,
        advance_booking_days: formData.booking_options?.advance_booking_days || 30,
      };

      if (existingService) {
        const { error: serviceError } = await supabase
          .from('service_products')
          .update(serviceProductData)
          .eq('id', existingService.id);

        if (serviceError) throw serviceError;
      } else {
        const { error: serviceError } = await supabase
          .from('service_products')
          .insert(serviceProductData);

        if (serviceError) throw serviceError;
      }

      // Update availability slots
      if (existingService && formData.availability_slots) {
        // Delete existing slots
        await supabase
          .from('service_availability_slots')
          .delete()
          .eq('service_product_id', existingService.id);

        // Insert new slots
        if (formData.availability_slots.length > 0) {
          const slotsData = formData.availability_slots.map(slot => ({
            service_product_id: existingService.id,
            day_of_week: slot.day,
            start_time: slot.start_time,
            end_time: slot.end_time,
          }));

          const { error: slotsError } = await supabase
            .from('service_availability_slots')
            .insert(slotsData);

          if (slotsError) throw slotsError;
        }
      }

      // Update staff members
      if (existingService && formData.staff_members) {
        // Delete existing staff
        await supabase
          .from('service_staff_members')
          .delete()
          .eq('service_product_id', existingService.id);

        // Insert new staff
        if (formData.staff_members.length > 0) {
          const staffData = formData.staff_members.map(staff => ({
            service_product_id: existingService.id,
            name: staff.name,
            email: staff.email,
            role: staff.role || null,
            avatar_url: staff.avatar_url || null,
            availability: staff.availability || null,
          }));

          const { error: staffError } = await supabase
            .from('service_staff_members')
            .insert(staffData);

          if (staffError) throw staffError;
        }
      }

      // Update resources
      if (existingService && (formData.resources || formData.resources_needed)) {
        // Delete existing resources
        await supabase
          .from('service_resources')
          .delete()
          .eq('service_product_id', existingService.id);

        // Insert new resources
        const resourcesList = formData.resources || formData.resources_needed || [];
        if (resourcesList.length > 0) {
          const resourcesData = resourcesList.map((resource: string) => ({
            service_product_id: existingService.id,
            resource_name: resource,
          }));

          const { error: resourcesError } = await supabase
            .from('service_resources')
            .insert(resourcesData);

          if (resourcesError) throw resourcesError;
        }
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
        title: '✅ Service mis à jour',
        description: 'Le service a été modifié avec succès',
      });

      onSuccess?.();
    } catch (error) {
      logger.error('Error updating service product', { error, productId });
      toast({
        title: '❌ Erreur',
        description:
          error instanceof Error ? error.message : 'Impossible de mettre à jour le service',
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
    if (result.valid) {
      await saveProduct();
    } else {
      const errorMessages =
        result.errors.length > 0
          ? result.errors.join(', ')
          : 'Veuillez corriger les erreurs avant de sauvegarder';
      toast({
        title: 'Erreurs de validation',
        description: errorMessages,
        variant: 'destructive',
      });
    }
  }, [currentStep, validateStep, saveProduct, toast]);

  const getStepProps = useCallback(() => {
    const baseProps = {
      data: formData,
      onUpdate: handleUpdateFormData,
    };

    switch (currentStep) {
      case 1:
        return {
          ...baseProps,
          storeSlug: storeSlug || (store && 'slug' in store ? store.slug : undefined),
        };

      case 5:
        return {
          productPrice: formData.price || 0,
          productName: formData.name || t('products.product', 'Service'),
          data: formData.affiliate || {},
          onUpdate: (affiliateData: ServiceProductFormData['affiliate']) =>
            handleUpdateFormData({ affiliate: affiliateData }),
        };

      case 6:
        return {
          data: {
            seo: formData.seo || {},
            faqs: formData.faqs || [],
          },
          productName: formData.name || '',
          productDescription: formData.description || '',
          productPrice: formData.price || 0,
          onUpdate: handleUpdateFormData,
        };

      case 7:
        return {
          productPrice:
            typeof formData.price === 'number' && !isNaN(formData.price) ? formData.price : 0,
          productType: 'service' as const,
          data: formData.payment || {},
          onUpdate: (paymentData: ServiceProductFormData['payment']) =>
            handleUpdateFormData({ payment: paymentData }),
        };

      default:
        return baseProps;
    }
  }, [currentStep, formData, handleUpdateFormData, t, storeSlug, store]);

  const CurrentStep = STEPS[currentStep - 1];
  const CurrentStepComponent = CurrentStep.component;
  const progress = useMemo(() => (currentStep / STEPS.length) * 100, [currentStep]);

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
            Erreur lors du chargement du service. Veuillez réessayer.
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
            <Calendar className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold">Modifier le service</h1>
          </div>

          <Progress value={progress} className="h-2" />
          <p className="text-sm text-muted-foreground mt-2">
            Étape {currentStep} sur {STEPS.length} ({Math.round(progress)}%)
          </p>
        </div>

        {/* Validation Errors */}
        {validationErrors[currentStep] && validationErrors[currentStep].length > 0 && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <ul className="list-disc list-inside text-sm space-y-1">
                {validationErrors[currentStep].map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        )}

        {/* Current Step */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {React.createElement(CurrentStep.icon, { className: 'h-5 w-5' })}
              {CurrentStep.title}
            </CardTitle>
            <CardDescription>{CurrentStep.description}</CardDescription>
          </CardHeader>
          <CardContent>
            {currentStep === 6 ? (
              <div className="space-y-6">
                {CurrentStepComponent && <CurrentStepComponent {...getStepProps()} />}
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
                  productType="service"
                  variant="compact"
                />
              </div>
            ) : CurrentStepComponent ? (
              <CurrentStepComponent {...getStepProps()} />
            ) : null}
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
