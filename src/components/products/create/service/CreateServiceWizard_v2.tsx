/**
 * Create Service Wizard - Professional & Optimized V2
 * Date: 2025-01-01
 *
 * Wizard professionnel en 8 étapes pour services
 * Version optimisée avec design professionnel, responsive et fonctionnalités avancées
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
  Check,
  CreditCard,
  Sparkles,
  Loader2,
  Keyboard,
} from 'lucide-react';
import { ServiceBasicInfoForm } from './ServiceBasicInfoForm';
import { ServiceDurationAvailabilityForm } from './ServiceDurationAvailabilityForm';
import { ServiceStaffResourcesForm } from './ServiceStaffResourcesForm';
import { ServicePricingOptionsForm } from './ServicePricingOptionsForm';
import { ServiceAffiliateSettings } from './ServiceAffiliateSettings';
import { ServiceSEOAndFAQs } from './ServiceSEOAndFAQs';
import { ServicePreview } from './ServicePreview';
import { PaymentOptionsForm } from '../shared/PaymentOptionsForm';
import { ProductStatisticsDisplaySettings } from '../shared/ProductStatisticsDisplaySettings';
import { useToast } from '@/hooks/use-toast';
import { useStore } from '@/hooks/useStore';
import { useWizardServerValidation } from '@/hooks/useWizardServerValidation';
import { supabase } from '@/integrations/supabase/client';
import {
  validateWithZod,
  formatValidators,
  getFieldError,
  serviceSchema,
} from '@/lib/wizard-validation';
import { logger } from '@/lib/logger';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';
import { cn } from '@/lib/utils';
import type {
  ServiceProductFormData,
  ServiceStaffMember,
  ServiceAvailabilitySlot,
} from '@/types/service-product';

/**
 * Type pour les ressources de service
 */
interface ServiceResource {
  name: string;
  description?: string;
  type?: string;
  quantity_available?: number;
  is_required?: boolean;
}

/**
 * Type pour les données d'affiliation
 */
interface AffiliateData {
  enabled?: boolean;
  commission_rate?: number;
  [key: string]: unknown;
}

/**
 * Type pour les options de paiement
 */
interface PaymentData {
  payment_type?: 'full' | 'deposit' | 'escrow';
  deposit_amount?: number;
  [key: string]: unknown;
}

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

interface CreateServiceWizardProps {
  storeId?: string;
  storeSlug?: string;
  onSuccess?: () => void;
  onBack?: () => void;
}

export const CreateServiceWizard = ({
  storeId: propsStoreId,
  storeSlug,
  onSuccess,
  onBack,
}: CreateServiceWizardProps = {}) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { store: hookStore, loading: storeLoading } = useStore();
  const store = hookStore || (propsStoreId ? { id: propsStoreId } : null);
  const [currentStep, setCurrentStep] = useState(1);

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
    validateService: validateServiceServer,
    isValidating: isValidatingServer,
    serverErrors,
    clearServerErrors,
  } = useWizardServerValidation({
    storeId: storeId || undefined,
    showToasts: true,
  });

  const [formData, setFormData] = useState<Partial<ServiceProductFormData>>({
    // Basic Info (Step 1)
    name: '',
    description: '',
    price: 0,
    currency: 'XOF',
    promotional_price: undefined,
    pricing_model: 'one-time',
    create_free_preview: false,
    preview_content_description: '',
    category_id: null,
    tags: [],
    images: [],
    service_type: 'appointment',

    // Duration & Availability (Step 2)
    duration: 60,
    location_type: 'on_site',
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    availability_slots: [],

    // Staff & Resources (Step 3)
    requires_staff: true,
    max_participants: 1,
    staff_members: [],
    resources: [],

    // Pricing & Options (Step 4)
    pricing_type: 'fixed',
    deposit_required: false,
    allow_booking_cancellation: true,
    cancellation_deadline_hours: 24,
    require_approval: false,
    buffer_time_before: 0,
    buffer_time_after: 0,
    advance_booking_days: 30,

    // Affiliation (Step 5)
    affiliate: {
      enabled: false,
      commission_rate: 10,
      commission_type: 'percentage',
      fixed_commission_amount: 0,
      cookie_duration_days: 30,
      min_order_amount: 0,
      allow_self_referral: false,
      require_approval: false,
      terms_and_conditions: '',
    },

    // SEO & FAQs (Step 6)
    seo: {
      meta_title: '',
      meta_description: '',
      meta_keywords: '',
      og_title: '',
      og_description: '',
      og_image: '',
    },
    faqs: [],

    // Payment Options (Step 7)
    payment: {
      payment_type: 'full', // 'full' | 'percentage' | 'delivery_secured'
      percentage_rate: 30, // Pour paiement partiel (10-90%)
    },

    // Statistics Display Settings
    hide_purchase_count: false,
    hide_likes_count: false,
    hide_recommendations_count: false,
    hide_downloads_count: false,
    hide_reviews_count: false,
    hide_rating: false,
  });

  const [validationErrors, setValidationErrors] = useState<Record<number, string[]>>({});
  const [isSaving, setIsSaving] = useState(false);

  /**
   * Update form data with auto-save
   */
  const handleUpdateFormData = useCallback(
    (data: Partial<ServiceProductFormData> & Record<string, unknown>) => {
      setFormData(prev => {
        const newData = { ...prev, ...data };

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
    []
  );

  /**
   * Auto-save draft
   */
  const handleAutoSave = useCallback(
    async (data?: ServiceProductFormData) => {
      const dataToSave = data || formData;

      // Ne pas auto-save si pas de nom
      if (!dataToSave.name || dataToSave.name.trim() === '') {
        return;
      }

      setIsAutoSaving(true);
      try {
        // Sauvegarder dans localStorage pour l'instant
        try {
          localStorage.setItem('service-product-draft', JSON.stringify(dataToSave));
        } catch {
          // ignore
        }
        logger.info('Brouillon service auto-sauvegardé', { step: currentStep });
      } catch (error) {
        logger.error('Auto-save error', { error, step: currentStep });
      } finally {
        setIsAutoSaving(false);
      }
    },
    [formData, currentStep]
  );

  /**
   * Load draft from localStorage
   */
  useEffect(() => {
    let  savedDraft: string | null = null;
    try {
      savedDraft = localStorage.getItem('service-product-draft');
    } catch {
      savedDraft = null;
    }
    if (savedDraft) {
      try {
        const draft = JSON.parse(savedDraft) as unknown;
        if (draft && typeof draft === 'object') {
          setFormData(draft as ServiceProductFormData);
        }
        logger.info('Brouillon service chargé depuis localStorage');
      } catch (error) {
        logger.error('Error loading draft', { error });
        try {
          localStorage.removeItem('service-product-draft');
        } catch {
          // ignore
        }
      }
    }
  }, []);

  /**
   * Validate current step avec validation améliorée (client + serveur)
   */
  const validateStep = useCallback(
    async (step: number): Promise<boolean> => {
      const  errors: string[] = [];

      // Réinitialiser les erreurs serveur
      clearServerErrors();

      switch (step) {
        case 1: {
          // 1. Validation client avec Zod
          const result = validateWithZod(serviceSchema, {
            name: formData.name,
            slug: formData.slug,
            description: formData.description,
            price: formData.price,
            duration: formData.duration,
            max_participants: formData.max_participants,
            meeting_url: formData.meeting_url,
            location_address: formData.location_address,
          });

          if (!result.valid) {
            const nameError = getFieldError(result.errors, 'name');
            const priceError = getFieldError(result.errors, 'price');
            const durationError = getFieldError(result.errors, 'duration');
            const maxParticipantsError = getFieldError(result.errors, 'max_participants');
            const meetingUrlError = getFieldError(result.errors, 'meeting_url');

            if (nameError) errors.push(nameError);
            if (priceError) errors.push(priceError);
            if (durationError) errors.push(durationError);
            if (maxParticipantsError) errors.push(maxParticipantsError);
            if (meetingUrlError) errors.push(meetingUrlError);
          }

          // 2. Validation format URL si fournie (client)
          if (formData.meeting_url) {
            const urlResult = formatValidators.url(formData.meeting_url);
            if (!urlResult.valid) {
              const urlFormatError = getFieldError(urlResult.errors, 'url');
              if (urlFormatError) errors.push(urlFormatError);
            }
          }

          // Si erreurs client, arrêter ici
          if (errors.length > 0) {
            setValidationErrors(prev => ({ ...prev, [step]: errors }));
            return false;
          }

          // 3. Validation serveur (unicité slug, etc.)
          if (storeId) {
            const serverResult = await validateServiceServer({
              name: formData.name,
              slug: formData.slug,
              price: formData.price,
              duration: formData.duration,
              maxParticipants: formData.max_participants,
              meetingUrl: formData.meeting_url,
            });

            if (!serverResult.valid) {
              // Les erreurs sont déjà affichées dans le hook via toast
              // Mais on les ajoute aussi aux erreurs de validation
              if (serverResult.errors) {
                serverResult.errors.forEach(err => {
                  errors.push(err.message);
                });
              }
              logger.warn('Validation serveur échouée - Étape 1', { errors: serverResult.errors });
              setValidationErrors(prev => ({ ...prev, [step]: errors }));
              return false;
            }

            // Validation slug spécifique si fourni
            if (formData.slug) {
              const slugValid = await validateSlug(formData.slug);
              if (!slugValid) {
                errors.push(serverErrors.slug || 'Slug invalide');
                setValidationErrors(prev => ({ ...prev, [step]: errors }));
                return false;
              }
            }
          }

          break;
        }
        case 2:
          if (!formData.duration || formData.duration <= 0) {
            errors.push(t('services.errors.durationRequired', 'La durée du service est requise'));
          }
          if (formData.location_type === 'on_site' && !formData.location_address?.trim()) {
            errors.push(
              t(
                'services.errors.addressRequired',
                "L'adresse est requise pour les services sur site"
              )
            );
          }
          if (formData.location_type === 'online' && !formData.meeting_url?.trim()) {
            errors.push(
              t(
                'services.errors.meetingUrlRequired',
                "L'URL de réunion est requise pour les services en ligne"
              )
            );
          }
          break;

        case 3:
          if (
            formData.requires_staff &&
            (!formData.staff_members || formData.staff_members.length === 0)
          ) {
            errors.push(
              t('services.errors.staffRequired', 'Au moins un membre du personnel est requis')
            );
          }
          if (!formData.max_participants || formData.max_participants < 1) {
            errors.push(
              t(
                'services.errors.maxParticipantsRequired',
                'Le nombre maximum de participants doit être au moins 1'
              )
            );
          }
          break;

        case 4:
          if (formData.deposit_required) {
            if (!formData.deposit_amount || formData.deposit_amount <= 0) {
              errors.push(
                t('services.errors.depositRequired', "Le montant de l'acompte est requis")
              );
            }
          }
          break;

        case 5:
        case 6:
        case 7:
          // Optional steps
          break;
      }

      setValidationErrors(prev => ({ ...prev, [step]: errors }));
      const isValid = errors.length === 0;

      if (!isValid) {
        logger.warn('Validation échouée', { step, errors });
      }

      return isValid;
    },
    [formData, t, storeId, validateServiceServer, validateSlug, serverErrors, clearServerErrors]
  );

  /**
   * Navigation handlers
   */
  const handleNext = useCallback(async () => {
    const isValid = await validateStep(currentStep);
    if (isValid) {
      const nextStepNum = currentStep + 1;
      setCurrentStep(nextStepNum);
      logger.info('Navigation vers étape suivante', { from: currentStep, to: nextStepNum });
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      toast({
        title: t('services.errors.validationTitle', 'Erreurs de validation'),
        description: t(
          'services.errors.validationDesc',
          'Veuillez corriger les erreurs avant de continuer'
        ),
        variant: 'destructive',
      });
    }
  }, [currentStep, validateStep, toast, t]);

  const handleBack = useCallback(() => {
    if (currentStep > 1) {
      const prevStepNum = currentStep - 1;
      setCurrentStep(prevStepNum);
      logger.info('Navigation vers étape précédente', { from: currentStep, to: prevStepNum });
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
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
        handleBack();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleNext, handleBack]);

  /**
   * Helper function to save service product
   */
  const saveServiceProduct = useCallback(
    async (isDraft: boolean) => {
      if (!store) {
        throw new Error(t('services.errors.noStore', 'Aucune boutique trouvée'));
      }

      // 1. Generate slug from name and ensure uniqueness
      let  slug=
        formData.slug ||
        formData.name
          ?.toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)/g, '') ||
        'service';

      // Vérifier l'unicité du slug et générer un nouveau si nécessaire
      let  attempts= 0;
      const maxAttempts = 10;
      while (attempts < maxAttempts) {
        const { data: existing } = await supabase
          .from('products')
          .select('id')
          .eq('store_id', store.id)
          .eq('slug', slug)
          .limit(1);

        if (!existing || existing.length === 0) {
          // Slug disponible
          break;
        }

        // Slug existe déjà, générer un nouveau avec suffixe
        attempts++;
        const baseSlug =
          formData.slug ||
          formData.name
            ?.toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)/g, '') ||
          'service';
        slug = `${baseSlug}-${attempts}`;
      }

      if (attempts >= maxAttempts) {
        throw new Error(
          'Impossible de générer un slug unique. Veuillez modifier le nom du produit.'
        );
      }

      // 2. Create base product avec SEO
      const { data: product, error: productError } = await supabase
        .from('products')
        .insert({
          store_id: store.id,
          name: formData.name,
          slug,
          description: formData.description,
          price: formData.pricing_model === 'free' ? 0 : formData.price || 0,
          currency: formData.currency || 'XOF',
          promotional_price: formData.promotional_price || null,
          pricing_model: formData.pricing_model || 'one-time',
          product_type: 'service',
          category_id: formData.category_id,
          image_url: formData.images?.[0] || null,
          images: formData.images || [],
          // SEO fields (only fields that exist in products table)
          meta_title: formData.seo?.meta_title,
          meta_description: formData.seo?.meta_description,
          og_image: formData.seo?.og_image,
          // Note: meta_keywords, og_title, og_description are not saved to DB (columns don't exist)
          // FAQs
          faqs: formData.faqs || [],
          // Payment Options
          payment_options: formData.payment || {
            payment_type: 'full',
            percentage_rate: 30,
          },
          is_draft: isDraft,
          is_active: !isDraft,
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

      // 3. Create service_product
      const { data: serviceProduct, error: serviceError } = await supabase
        .from('service_products')
        .insert({
          product_id: product.id,
          service_type: formData.service_type || 'appointment',
          duration_minutes: formData.duration || 60,
          location_type: formData.location_type || 'on_site',
          location_address: formData.location_address,
          meeting_url: formData.meeting_url,
          timezone: formData.timezone || 'UTC',
          requires_staff: formData.requires_staff !== false,
          max_participants: formData.max_participants || 1,
          pricing_type: formData.pricing_type || 'fixed',
          deposit_required: formData.deposit_required || false,
          deposit_amount: formData.deposit_amount,
          deposit_type: formData.deposit_type,
          allow_booking_cancellation: formData.allow_booking_cancellation !== false,
          cancellation_deadline_hours: formData.cancellation_deadline_hours || 24,
          require_approval: formData.require_approval || false,
          buffer_time_before: formData.buffer_time_before || 0,
          buffer_time_after: formData.buffer_time_after || 0,
          max_bookings_per_day: formData.max_bookings_per_day,
          advance_booking_days: formData.advance_booking_days || 30,
        })
        .select()
        .single();

      if (serviceError) throw serviceError;

      // 4. Create staff members
      if (formData.staff_members && formData.staff_members.length > 0) {
        const staffData = formData.staff_members.map(member => ({
          service_product_id: serviceProduct.id,
          store_id: store.id,
          name: member.name,
          role: member.role,
          bio: member.bio,
          email: member.email,
          phone: member.phone,
          avatar_url: member.avatar_url,
          is_active: member.is_active !== false,
        }));

        const { error: staffError } = await supabase
          .from('service_staff_members')
          .insert(staffData);

        if (staffError) throw staffError;
      }

      // 5. Create availability slots
      if (formData.availability_slots && formData.availability_slots.length > 0) {
        const slotsData = formData.availability_slots
          .map(
            (
              slot: ServiceAvailabilitySlot & {
                day?: number;
                day_of_week?: number;
                staff_member_id?: string | null;
                is_available?: boolean;
              }
            ) => {
              // Le formulaire utilise 'day', mais la BDD attend 'day_of_week'
              // Support des deux pour compatibilité
              const dayOfWeek = slot.day_of_week ?? slot.day;

              // Valider que day_of_week est défini et valide (0-6)
              if (dayOfWeek === undefined || dayOfWeek === null || dayOfWeek < 0 || dayOfWeek > 6) {
                throw new Error(
                  `Le jour de la semaine (day_of_week) est requis et doit être entre 0 (Dimanche) et 6 (Samedi) pour le créneau ${slot.start_time}-${slot.end_time}`
                );
              }

              return {
                service_product_id: serviceProduct.id,
                day_of_week: dayOfWeek,
                start_time: slot.start_time,
                end_time: slot.end_time,
                staff_member_id: slot.staff_member_id || null,
                is_active: slot.is_available !== false,
              };
            }
          )
          .filter(Boolean); // Filtrer les valeurs invalides (ne devrait pas être nécessaire mais sécurité)

        // Ne pas insérer si aucun slot valide
        if (slotsData.length === 0) {
          logger.warn('Aucun créneau de disponibilité valide à insérer');
        } else {
          const { error: slotsError } = await supabase
            .from('service_availability_slots')
            .insert(slotsData);

          if (slotsError) {
            logger.error('Erreur insertion availability slots', { error: slotsError, slotsData });
            throw new Error(
              `Erreur lors de la création des créneaux de disponibilité: ${slotsError.message}`
            );
          }
        }
      }

      // 6. Create resources
      if (formData.resources && formData.resources.length > 0) {
        const resourcesData = (formData.resources as ServiceResource[]).map(resource => ({
          service_product_id: serviceProduct.id,
          name: resource.name,
          description: resource.description,
          resource_type: resource.type || 'other',
          quantity: resource.quantity_available || 1,
          is_required: resource.is_required !== false,
        }));

        const { error: resourcesError } = await supabase
          .from('service_resources')
          .insert(resourcesData);

        if (resourcesError) throw resourcesError;
      }

      // 7. Create affiliate settings if enabled
      if (formData.affiliate && formData.affiliate.enabled) {
        const { error: affiliateError } = await supabase.from('product_affiliate_settings').insert({
          product_id: product.id,
          store_id: store.id,
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
          logger.error('Affiliate settings error', { error: affiliateError, productId });
        }
      }

      // 8. Create free preview service if requested
      if (formData.create_free_preview && !isDraft && formData.pricing_model !== 'free') {
        try {
          logger.info('Creating free preview service', { paidProductId: product.id });

          const { data: previewServiceId, error: previewError } = await supabase.rpc(
            'create_free_preview_service',
            {
              p_paid_product_id: product.id,
              p_preview_content_description: formData.preview_content_description || null,
            }
          );

          if (previewError) {
            logger.error('Error creating preview service', { error: previewError.message });
            // Ne pas faire échouer la création du service principal si le preview échoue
          } else {
            logger.info('Free preview service created', { previewServiceId });
          }
        } catch ( _error: unknown) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          logger.error('Exception creating preview service', { error: errorMessage });
          // Ne pas faire échouer la création du service principal
        }
      }

      // Clear draft from localStorage on success
      try {
        localStorage.removeItem('service-product-draft');
      } catch {
        // ignore
      }

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

      return product;
    },
    [formData, store, t]
  );

  /**
   * Save as draft
   */
  const handleSaveDraft = useCallback(async () => {
    setIsSaving(true);
    try {
      const product = await saveServiceProduct(true);

      logger.info('Brouillon service sauvegardé', { productId: product.id });

      toast({
        title: t('services.draftSaved', '✅ Brouillon sauvegardé'),
        description: t(
          'services.draftSavedDesc',
          'Service "{{name}}" enregistré. Vous pouvez continuer plus tard.',
          { name: product.name }
        ),
      });

      if (onSuccess) {
        onSuccess();
      } else {
        navigate('/dashboard/products');
      }
    } catch (error) {
      logger.error('Erreur lors de la sauvegarde du brouillon', error);
      toast({
        title: t('services.errors.saveError', '❌ Erreur de sauvegarde'),
        description:
          error instanceof Error
            ? error.message
            : t('services.errors.saveErrorDesc', 'Impossible de sauvegarder le brouillon'),
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  }, [saveServiceProduct, toast, onSuccess, navigate, t]);

  /**
   * Publish service
   */
  const handlePublish = useCallback(async () => {
    // Validate required steps (1-4 are required, 5-7 are optional)
    let  allValid= true;
    for (let  step= 1; step <= 4; step++) {
      if (!validateStep(step)) {
        allValid = false;
      }
    }

    if (!allValid) {
      toast({
        title: t('services.errors.validationAllTitle', '⚠️ Erreurs de validation'),
        description: t(
          'services.errors.validationAllDesc',
          'Veuillez corriger toutes les erreurs avant de publier'
        ),
        variant: 'destructive',
      });
      return;
    }

    setIsSaving(true);
    let  publicationSuccess= false;
    let  publishedProductId: string | undefined;
    let  publishedProductName: string | undefined;

    try {
      const product = await saveServiceProduct(false);

      // Marquer la publication comme réussie dès que le produit est créé
      publicationSuccess = true;
      publishedProductId = product.id;
      publishedProductName = product.name;

      logger.info('Service publié', { productId: product.id, productName: product.name });

      // Afficher le toast de succès IMMÉDIATEMENT après la publication réussie
      toast({
        title: t('services.published', '🎉 Service publié !'),
        description: t(
          'services.publishedDesc',
          '"{{name}}" est maintenant disponible à la réservation{{affiliate}}',
          {
            name: product.name || 'Service',
            affiliate: formData.affiliate?.enabled ? " avec programme d'affiliation activé" : '',
          }
        ),
      });

      // Navigation/callback dans un try-catch séparé pour ne pas masquer le succès
      // Utiliser setTimeout pour s'assurer que le toast de succès est affiché en premier
      setTimeout(() => {
        try {
          if (onSuccess) {
            onSuccess();
          } else {
            navigate('/dashboard/products');
          }
        } catch (navigationError) {
          // Logger l'erreur de navigation mais ne PAS afficher d'erreur à l'utilisateur
          // car la publication a réussi
          logger.warn('Erreur lors de la navigation après publication', {
            error: navigationError,
            productId: publishedProductId,
          });
          // Navigation de fallback silencieuse après un court délai
          setTimeout(() => {
            try {
              navigate('/dashboard/products');
            } catch {
              // Ignorer complètement si la navigation échoue encore
            }
          }, 200);
        }
      }, 100);
    } catch (error) {
      // Ne PAS afficher d'erreur si la publication a réussi
      if (publicationSuccess) {
        logger.warn('Erreur après publication réussie (ignorée)', {
          error,
          productId: publishedProductId,
        });
        // Ne rien faire - le toast de succès a déjà été affiché
        return;
      }

      // Cette erreur ne se déclenche que si la publication elle-même a échoué
      logger.error('Erreur lors de la publication', error);

      // Extraire le message d'erreur de manière sûre
      let  errorMessage: string;

      if (error instanceof Error) {
        errorMessage = error.message || error.toString();
      } else if (typeof error === 'string') {
        errorMessage = error;
      } else if (error && typeof error === 'object' && 'message' in error) {
        // Gérer les objets d'erreur avec une propriété message
        errorMessage = String((error as { message?: unknown }).message || 'Erreur inconnue');
      } else {
        errorMessage = 'Impossible de publier le service';
      }

      // Nettoyer le message d'erreur pour enlever les artefacts système
      errorMessage = errorMessage
        .replace(/\[object Object\]/gi, '')
        .replace(/activer Windows/gi, '')
        .replace(/\s+/g, ' ')
        .trim();

      // Si le message est vide ou trop court après nettoyage, utiliser un message par défaut
      if (!errorMessage || errorMessage.length < 3) {
        errorMessage = t('services.errors.publishErrorDesc', 'Impossible de publier le service');
      }

      toast({
        title: t('services.errors.publishError', '❌ Erreur de publication'),
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  }, [
    validateStep,
    saveServiceProduct,
    formData.affiliate?.enabled,
    toast,
    onSuccess,
    navigate,
    t,
  ]);

  /**
   * Get props for current step component
   */
  const getStepProps = useCallback(() => {
    const baseProps = {
      data: formData,
      onUpdate: handleUpdateFormData,
    };

    switch (currentStep) {
      case 5: // Affiliation
        return {
          productPrice: formData.price || 0,
          productName: formData.name || t('services.service', 'Service'),
          data: formData.affiliate || {},
          onUpdate: (affiliateData: AffiliateData) =>
            handleUpdateFormData({ affiliate: affiliateData }),
        };

      case 6: // SEO & FAQs
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

      case 7: // Payment Options
        return {
          productPrice:
            typeof formData.price === 'number' && !isNaN(formData.price) ? formData.price : 0,
          productType: 'service' as const,
          data: formData.payment || {},
          onUpdate: (paymentData: PaymentData) => handleUpdateFormData({ payment: paymentData }),
        };

      default:
        return baseProps;
    }
  }, [currentStep, formData, handleUpdateFormData, t]);

  const CurrentStep = STEPS[currentStep - 1];
  const CurrentStepComponent = CurrentStep.component;

  /**
   * Calculate progress
   */
  const progress = useMemo(() => (currentStep / STEPS.length) * 100, [currentStep]);

  /**
   * Logging on mount
   */
  useEffect(() => {
    logger.info('Wizard Service ouvert', { step: currentStep, storeId: store?.id });
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
    <div className="min-h-screen bg-background sm:py-6 lg:py-8 overflow-x-hidden w-full">
      <div className="w-full max-w-5xl mx-auto sm:px-4 lg:px-6">
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
              aria-label={t('common.back', 'Retour')}
            >
              <ArrowLeft className="h-3 w-3 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
              <span className="hidden sm:inline">
                {t('services.backToType', 'Retour au choix du type')}
              </span>
              <span className="sm:hidden">{t('common.back', 'Retour')}</span>
            </Button>
          )}

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 mb-4 sm:mb-6">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="p-2 sm:p-3 rounded-lg bg-gradient-to-br from-purple-500/10 to-pink-500/5 backdrop-blur-sm border border-purple-500/20 animate-in zoom-in duration-500">
                <Calendar
                  className="h-5 w-5 sm:h-6 sm:w-6 text-purple-500 dark:text-purple-400"
                  aria-hidden="true"
                />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold mb-1 sm:mb-2">
                  {t('services.create.title', 'Nouveau Service')}
                </h1>
                <p className="text-xs sm:text-sm lg:text-base text-muted-foreground">
                  {t('services.create.subtitle', 'Créez un service professionnel en 8 étapes')}
                </p>
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs sm:text-sm">
              <span className="font-medium">
                {t('services.step', 'Étape')} {currentStep} {t('services.of', 'sur')} {STEPS.length}
              </span>
              <div className="flex items-center gap-2">
                {isAutoSaving && (
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    <span className="hidden sm:inline">
                      {t('services.autoSaving', 'Auto-sauvegarde...')}
                    </span>
                  </div>
                )}
                <span className="text-muted-foreground">
                  {Math.round(progress)}% {t('services.completed', 'complété')}
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
                    aria-label={`${t('services.step', 'Étape')} ${step.id}: ${step.title}`}
                    className={cn(
                      'relative p-2.5 sm:p-3 rounded-lg border-2 transition-all duration-300 text-left',
                      'hover:shadow-md hover:scale-[1.02] touch-manipulation',
                      isActive &&
                        'border-purple-500 bg-purple-50 dark:bg-purple-950/30 shadow-lg scale-[1.02] ring-2 ring-purple-500/20',
                      isCompleted && 'border-green-500 bg-green-50 dark:bg-green-950/30',
                      !isActive &&
                        !isCompleted &&
                        !hasErrors &&
                        'border-border hover:border-purple-500/50 bg-card/50',
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
                            ? 'text-purple-600 dark:text-purple-400'
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
                        isActive && 'text-purple-600 dark:text-purple-400 font-semibold',
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

        {/* Current Step */}
        <Card
          ref={contentRef}
          className="mb-6 sm:mb-8 border-border/50 bg-card/50 backdrop-blur-sm shadow-lg animate-in fade-in slide-in-from-bottom-4 duration-700"
        >
          <CardHeader className="p-3 sm:p-4 lg:p-6">
            <CardTitle className="flex items-center gap-2 sm:gap-3 text-base sm:text-lg lg:text-xl">
              {React.createElement(CurrentStep.icon, { className: 'h-4 w-4 sm:h-5 sm:w-5' })}
              {CurrentStep.title}
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm flex items-center gap-2">
              {CurrentStep.description}
              {currentStep >= 5 && currentStep <= 7 && (
                <Badge variant="outline" className="text-[10px] sm:text-xs">
                  {t('services.optional', 'Optionnel')}
                </Badge>
              )}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-3 sm:p-4 lg:p-6 pt-0">
            {currentStep === 6 ? (
              <div className="space-y-6">
                <CurrentStepComponent {...getStepProps()} />
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
            ) : (
              <CurrentStepComponent {...getStepProps()} />
            )}
          </CardContent>
        </Card>

        {/* Navigation Buttons - Responsive */}
        <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
          <CardContent className="p-3 sm:p-4">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-4">
              <div className="flex gap-2">
                {currentStep > 1 && (
                  <Button
                    variant="outline"
                    onClick={handleBack}
                    disabled={isSaving}
                    className="flex-1 sm:flex-none"
                    size="sm"
                    aria-label={t('services.previous', 'Étape précédente')}
                  >
                    <ChevronLeft className="h-4 w-4 mr-1.5 sm:mr-2" />
                    <span className="hidden sm:inline">{t('services.previous', 'Précédent')}</span>
                    <span className="sm:hidden">{t('services.prev', 'Préc.')}</span>
                  </Button>
                )}
              </div>

              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                <Button
                  variant="outline"
                  onClick={handleSaveDraft}
                  disabled={isSaving}
                  className="flex-1 sm:flex-none"
                  size="sm"
                  aria-label={t('services.saveDraft', 'Sauvegarder comme brouillon')}
                >
                  <Save className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
                  <span className="hidden sm:inline">
                    {t('services.saveDraft', 'Sauvegarder brouillon')}
                  </span>
                  <span className="sm:hidden">{t('services.draft', 'Brouillon')}</span>
                  <Badge variant="secondary" className="ml-1.5 hidden sm:flex text-[10px]">
                    ⌘S
                  </Badge>
                </Button>

                {currentStep < STEPS.length ? (
                  <Button
                    onClick={handleNext}
                    disabled={isSaving}
                    className="flex-1 sm:flex-none bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
                    size="sm"
                    aria-label={t('services.next', 'Étape suivante')}
                  >
                    <span className="hidden sm:inline">{t('services.next', 'Suivant')}</span>
                    <span className="sm:hidden">{t('services.nextShort', 'Suiv.')}</span>
                    <ChevronRight className="h-4 w-4 ml-1.5 sm:ml-2" />
                    <Badge variant="secondary" className="ml-1.5 hidden sm:flex text-[10px]">
                      ⌘→
                    </Badge>
                  </Button>
                ) : (
                  <Button
                    onClick={handlePublish}
                    disabled={isSaving}
                    className="flex-1 sm:flex-none bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
                    size="sm"
                    aria-label={t('services.publish', 'Publier le service')}
                  >
                    {isSaving ? (
                      <>
                        <Loader2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2 animate-spin" />
                        <span className="hidden sm:inline">
                          {t('services.publishing', 'Publication...')}
                        </span>
                        <span className="sm:hidden">{t('services.publishingShort', 'Pub...')}</span>
                      </>
                    ) : (
                      <>
                        <Check className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
                        <span className="hidden sm:inline">
                          {t('services.publish', 'Publier le service')}
                        </span>
                        <span className="sm:hidden">{t('services.publishShort', 'Publier')}</span>
                      </>
                    )}
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Keyboard Shortcuts Help */}
        <div className="hidden lg:flex items-center justify-center gap-4 pt-4 border-t border-border/50">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Keyboard className="h-3 w-3" aria-hidden="true" />
            <span>{t('common.shortcuts', 'Raccourcis')}:</span>
            <Badge variant="outline" className="text-[10px] font-mono">
              ⌘S
            </Badge>
            <span className="text-muted-foreground">
              {t('services.shortcuts.save', 'Brouillon')}
            </span>
            <Badge variant="outline" className="text-[10px] font-mono ml-2">
              ⌘→
            </Badge>
            <span className="text-muted-foreground">{t('services.shortcuts.next', 'Suivant')}</span>
            <Badge variant="outline" className="text-[10px] font-mono ml-2">
              ⌘←
            </Badge>
            <span className="text-muted-foreground">
              {t('services.shortcuts.prev', 'Précédent')}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};






