/**
 * Service Detail Page - Professional
 * Date: 29 janvier 2025
 *
 * Page complète de détail pour services avec calendrier de réservation
 * Améliorée avec SEO, analytics, recommandations, partage social et wishlist
 */

import { useParams, useNavigate, useSearchParams, Link } from 'react-router-dom';
import { AppPageShell } from '@/components/layout/AppPageShell';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { SafeHTML } from '@/components/security/SafeHTML';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  ArrowLeft,
  Calendar,
  Clock,
  Users,
  MapPin,
  Star,
  Check,
  Heart,
  Share2,
  Gift,
  Eye,
  Package,
  RefreshCw,
  DollarSign,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Shield,
  TrendingUp,
  ChevronRight,
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { ServiceCalendar } from '@/components/service/ServiceCalendar';
import { ServiceCalendarEnhanced } from '@/components/service/ServiceCalendarEnhanced';
import { TimeSlotPicker } from '@/components/service/TimeSlotPicker';
import { ProductReviewsSummary } from '@/components/reviews/ProductReviewsSummary';
import { ReviewsList } from '@/components/reviews/ReviewsList';
import { ReviewForm } from '@/components/reviews/ReviewForm';
import { StaffCard } from '@/components/shared';
import { ProductImages } from '@/components/shared';
import type { StaffMember } from '@/hooks/service/useAvailability';
import { buildCheckoutUrl } from '@/lib/checkout/checkout-route';
import { useServiceProductAddons } from '@/hooks/service/useServiceProductAddons';
import { ServiceProductAddonsPicker } from '@/components/service/ServiceProductAddonsPicker';
import {
  addonEffectivePrice,
  validateServiceAddonSelection,
} from '@/lib/service/service-product-addons';
import {
  useValidateServiceBooking,
  useQuickAvailabilityCheck,
} from '@/hooks/service/useServiceBookingValidation';
import { useAuth } from '@/contexts/AuthContext';
import { logger } from '@/lib/logger';
import { useAnalyticsTracking } from '@/hooks/useProductAnalytics';
import { useWishlistToggle } from '@/hooks/wishlist/useWishlistToggle';
import { SEOMeta, ProductSchema } from '@/components/seo';
import { PaymentOptionsBadge, getPaymentOptions } from '@/components/products/PaymentOptionsBadge';
import { PricingModelBadge } from '@/components/products/PricingModelBadge';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  ServiceRecommendations,
  BookedTogetherRecommendations,
} from '@/components/service/ServiceRecommendations';
import { JoinWaitlistButton } from '@/components/service/JoinWaitlistButton';
import { ServiceProjectOrderPanel } from '@/components/service/ServiceProjectOrderPanel';
import { ServicePriceDisplay } from '@/components/service/ServicePriceDisplay';
import { ServicePrestationsCatalog } from '@/components/service/ServicePrestationsCatalog';
import { ServicePricingBadges } from '@/components/products/ServicePricingBadges';
import {
  useServiceDeliveryPackages,
  useServiceGigExtras,
} from '@/hooks/service/useServiceDeliveryCommerce';
import {
  resolveServiceAppointmentCharge,
  resolveServiceAppointmentUnitPrice,
  resolveServiceDisplayPrice,
} from '@/lib/service/service-pricing';
import { useServiceCategories } from '@/hooks/useServiceCategories';
import { getCategoryBreadcrumb } from '@/lib/services/service-categories';
import {
  formatServiceAttributeValue,
  getServiceFormProfile,
} from '@/lib/services/service-form-profiles';
import { serviceWizardShowsCalendar } from '@/lib/service-wizard-step-validation';

const PRODUCT_SERVICE_FIELDS =
  'id, store_id, slug, name, description, short_description, category, category_id, tags, product_type, is_active, price, promotional_price, currency, image_url, images, created_at, updated_at, payment_options, pricing_model, licensing_type, license_terms';
const PRODUCT_SERVICE_SELECT = PRODUCT_SERVICE_FIELDS;
const STORE_PUBLIC_FIELDS = 'id, name, slug, logo_url';
const SERVICE_PRODUCT_FIELDS =
  'id, product_id, store_id, service_type, duration_minutes, location_type, location_address, max_participants, advance_booking_days, fulfillment_mode, brief_fields, category_attributes, pricing_type, deposit_required, deposit_amount, deposit_type, allow_booking_cancellation, cancellation_deadline_hours, requires_staff, created_at, updated_at';
const SERVICE_STAFF_FIELDS =
  'id, service_product_id, name, role, bio, avatar_url, is_active, created_at, updated_at';

interface WindowWithTracking extends Window {
  gtag?: (command: string, eventName: string, params?: Record<string, unknown>) => void;
  fbq?: (command: string, eventName: string, params?: Record<string, unknown>) => void;
  ttq?: { track: (eventName: string, params?: Record<string, unknown>) => void };
}

export default function ServiceDetail() {
  const { serviceId } = useParams<{ serviceId: string }>();
  const [searchParams] = useSearchParams();
  const guestEmail = searchParams.get('guestEmail');
  const guestName = searchParams.get('guestName');
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const { data: serviceCategories = [] } = useServiceCategories();
  // Type pour le créneau horaire sélectionné
  interface TimeSlot {
    time: string;
    availableSpots?: number;
  }

  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [participants, setParticipants] = useState(1);
  const [isBooking, setIsBooking] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [selectedAddonProductIds, setSelectedAddonProductIds] = useState<string[]>([]);
  const [selectedStaffId, setSelectedStaffId] = useState<string | null>(null);
  const [guestEmailDraft, setGuestEmailDraft] = useState(guestEmail || '');
  const [guestNameDraft, setGuestNameDraft] = useState(guestName || '');

  // Hooks de validation
  const { mutateAsync: validateBooking } = useValidateServiceBooking();
  const quickAvailabilityCheck = useQuickAvailabilityCheck();

  // Utiliser le hook unifié pour la wishlist
  const {
    isInWishlist,
    toggle: handleWishlistToggle,
    isLoading: isCheckingWishlist,
  } = useWishlistToggle(serviceId);

  // Track analytics event
  const { trackView } = useAnalyticsTracking();

  // Fetch service data with store
  const { data: service, isLoading } = useQuery({
    queryKey: ['service', serviceId],
    queryFn: async () => {
      // Do not embed public.stores — buyers are blocked by stores RLS (owner-only).
      // Use stores_public for storefront-safe store metadata.
      const { data: productData, error } = await supabase
        .from('products')
        .select(PRODUCT_SERVICE_SELECT)
        .eq('id', serviceId)
        .single();

      if (error) throw error;

      let storePublic: { id: string; name: string; slug: string; logo_url: string | null } | null =
        null;
      if (productData?.store_id) {
        const { data: storeRow } = await supabase
          .from('stores_public')
          .select(STORE_PUBLIC_FIELDS)
          .eq('id', productData.store_id)
          .maybeSingle();
        storePublic = storeRow;
      }

      // Fetch service details
      const { data: serviceData } = await supabase
        .from('service_products')
        .select(SERVICE_PRODUCT_FIELDS)
        .eq('product_id', serviceId)
        .maybeSingle();

      // Fetch staff (best-effort — schema differences must not crash the page)
      let staff: Array<Record<string, unknown>> = [];
      if (serviceData?.id) {
        const { data: staffRows } = await supabase
          .from('service_staff_members')
          .select(SERVICE_STAFF_FIELDS)
          .eq('service_product_id', serviceData.id);
        staff = staffRows || [];
      }

      return {
        ...productData,
        free_product: null,
        paid_product: null,
        service: serviceData,
        staff,
        store: storePublic,
      };
    },
    enabled: !!serviceId,
  });

  const serviceProductId = service?.service?.id ?? null;
  const { data: serviceAddons = [], isLoading: addonsLoading } =
    useServiceProductAddons(serviceProductId);
  const { data: deliveryPackages = [], isLoading: packagesLoading } =
    useServiceDeliveryPackages(serviceProductId);
  const { data: gigExtras = [], isLoading: extrasLoading } = useServiceGigExtras(serviceProductId);

  useEffect(() => {
    const required = serviceAddons.filter(a => a.is_required).map(a => a.addon_product_id);
    if (required.length) {
      setSelectedAddonProductIds(prev => [...new Set([...prev, ...required])]);
    }
  }, [serviceAddons]);

  useEffect(() => {
    const staff = (service?.staff || []) as StaffMember[];
    if (staff.length === 1 && !selectedStaffId) {
      setSelectedStaffId(staff[0].id);
    }
  }, [service?.staff, selectedStaffId]);

  // Check if product is in wishlist
  // La vérification de wishlist est gérée par useWishlistToggle via useMarketplaceFavorites

  // Track service view on mount
  useEffect(() => {
    if (serviceId && service) {
      trackView(serviceId, {
        product_type: 'service',
        timestamp: new Date().toISOString(),
      });

      // Track with external pixels (Google Analytics, Facebook, TikTok)
      if (typeof window !== 'undefined') {
        const windowWithTracking = window as WindowWithTracking;
        // Google Analytics
        if (windowWithTracking.gtag) {
          windowWithTracking.gtag('event', 'view_item', {
            items: [
              {
                item_id: serviceId,
                item_name: service?.name || 'Service',
                item_category: 'service',
                price: service?.price,
                currency: service?.currency,
              },
            ],
          });
        }

        // Facebook Pixel
        if (windowWithTracking.fbq) {
          windowWithTracking.fbq('track', 'ViewContent', {
            content_type: 'product',
            content_ids: [serviceId],
            content_category: 'service',
            value: service?.price,
            currency: service?.currency,
          });
        }

        // TikTok Pixel
        if (windowWithTracking.ttq) {
          windowWithTracking.ttq.track('ViewContent', {
            content_type: 'product',
            content_id: serviceId,
            value: service?.price,
            currency: service?.currency,
          });
        }
      }
    }
  }, [serviceId, trackView, service]);

  // La gestion de wishlist est gérée par useWishlistToggle (via handleWishlistToggle)

  // Handle social share
  const handleShare = async () => {
    const url = window.location.href;
    const title = service?.name || 'Service';
    const text = service?.short_description || '';

    if (navigator.share) {
      try {
        await navigator.share({
          title,
          text,
          url,
        });
      } catch (error) {
        // User cancelled or error occurred
        logger.info('Partage annulé ou erreur', error);
      }
    } else {
      // Fallback: copy to clipboard
      try {
        await navigator.clipboard.writeText(url);
        toast({
          title: 'Lien copié',
          description: 'Le lien a été copié dans le presse-papiers',
        });
      } catch (error) {
        logger.error('Erreur lors de la copie', error);
        toast({
          title: 'Erreur',
          description: 'Impossible de copier le lien',
          variant: 'destructive',
        });
      }
    }
  };

  // Validation en temps réel lors de la sélection d'un créneau
  useEffect(() => {
    const validateSelection = async () => {
      if (!selectedDate || !selectedSlot || !service?.service || !serviceId) {
        setValidationError(null);
        return;
      }

      setIsValidating(true);
      setValidationError(null);

      try {
        const bookingDate = new Date(selectedDate);
        const [hours, minutes] = selectedSlot.time.split(':').map(Number);
        bookingDate.setHours(hours, minutes, 0, 0);

        // Calculer l'heure de fin
        const durationMinutes = service.service.duration_minutes || 60;
        const endDate = new Date(bookingDate);
        endDate.setMinutes(endDate.getMinutes() + durationMinutes);

        // Utiliser product_id (serviceId est le product_id)
        const result = await validateBooking({
          productId: serviceId!, // serviceId est le product_id
          scheduledDate: [
            selectedDate.getFullYear(),
            String(selectedDate.getMonth() + 1).padStart(2, '0'),
            String(selectedDate.getDate()).padStart(2, '0'),
          ].join('-'),
          scheduledStartTime: bookingDate.toTimeString().slice(0, 8),
          scheduledEndTime: endDate.toTimeString().slice(0, 8),
          staffMemberId: selectedStaffId || undefined,
        });

        if (!result.isValid && result.errors.length > 0) {
          setValidationError(result.errors[0]);
        }
      } catch (error) {
        // Ignorer les erreurs de validation silencieusement
        // La validation complète sera faite lors de la réservation
      } finally {
        setIsValidating(false);
      }
    };

    // Debounce validation pour éviter trop de requêtes
    const timeoutId = setTimeout(validateSelection, 500);
    return () => clearTimeout(timeoutId);
  }, [selectedDate, selectedSlot, service?.service, serviceId, validateBooking, selectedStaffId]);

  const handleBooking = async () => {
    if (!selectedDate || !selectedSlot) {
      toast({
        title: '⚠️ Sélection incomplète',
        description: 'Veuillez sélectionner une date et un créneau horaire',
        variant: 'destructive',
      });
      return;
    }

    if (!service || !service.service) {
      toast({
        title: '❌ Erreur',
        description: 'Service non trouvé',
        variant: 'destructive',
      });
      return;
    }

    const checkoutEmail = (user?.email || guestEmail || guestEmailDraft).trim();
    const checkoutName = (
      user?.user_metadata?.full_name ||
      guestName ||
      guestNameDraft ||
      checkoutEmail.split('@')[0]
    ).trim();

    if (!checkoutEmail) {
      toast({
        title: 'Coordonnées requises',
        description: 'Indiquez votre e-mail pour réserver, comme sur Calendly, ou connectez-vous.',
        variant: 'destructive',
      });
      return;
    }

    const requiresStaff = Boolean(
      (service.service as { requires_staff?: boolean } | null)?.requires_staff
    );
    const staffList = (service.staff || []) as StaffMember[];
    if (requiresStaff && staffList.length > 0 && !selectedStaffId) {
      toast({
        title: 'Prestataire requis',
        description: 'Choisissez un membre de l’équipe pour ce rendez-vous.',
        variant: 'destructive',
      });
      return;
    }

    if (validationError) {
      toast({
        title: '❌ Réservation impossible',
        description: validationError,
        variant: 'destructive',
      });
      return;
    }

    setIsBooking(true);
    setValidationError(null);

    try {
      const bookingDate = new Date(selectedDate);
      const [hours, minutes] = selectedSlot.time.split(':').map(Number);
      bookingDate.setHours(hours, minutes, 0, 0);
      const bookingDateTime = bookingDate.toISOString();

      if (bookingDate < new Date()) {
        toast({
          title: '❌ Date invalide',
          description: "La date et l'heure sélectionnées sont dans le passé",
          variant: 'destructive',
        });
        setIsBooking(false);
        return;
      }

      const durationMinutes = service.service.duration_minutes || 60;
      const endDate = new Date(bookingDate);
      endDate.setMinutes(endDate.getMinutes() + durationMinutes);

      const validationResult = await validateBooking({
        productId: serviceId!,
        scheduledDate: [
          selectedDate.getFullYear(),
          String(selectedDate.getMonth() + 1).padStart(2, '0'),
          String(selectedDate.getDate()).padStart(2, '0'),
        ].join('-'),
        scheduledStartTime: bookingDate.toTimeString().slice(0, 8),
        scheduledEndTime: endDate.toTimeString().slice(0, 8),
        staffMemberId: selectedStaffId || undefined,
      });

      if (!validationResult.isValid) {
        const errorMessage = validationResult.errors.join(', ');
        setValidationError(errorMessage);
        toast({
          title: '❌ Réservation impossible',
          description: errorMessage,
          variant: 'destructive',
        });
        setIsBooking(false);
        return;
      }

      const storeId = service.store_id;
      if (!storeId) {
        throw new Error('Store ID manquant');
      }

      const addonCheck = validateServiceAddonSelection(serviceAddons, selectedAddonProductIds);
      if (!addonCheck.ok) {
        toast({
          title: 'Produits complémentaires',
          description: addonCheck.message,
          variant: 'destructive',
        });
        setIsBooking(false);
        return;
      }

      navigate(
        buildCheckoutUrl({
          productId: serviceId!,
          storeId,
          productSlug: service?.slug,
          storeSlug: service.store?.slug,
          scheduledAt: bookingDateTime,
          participants,
          guestEmail: checkoutEmail,
          guestName: checkoutName,
          addonIds: selectedAddonProductIds,
          staffId: selectedStaffId || undefined,
        })
      );
    } catch (_error: unknown) {
      const errorMessage = _error instanceof Error ? _error.message : String(_error);
      logger.error('Erreur lors de la réservation', _error);
      toast({
        title: '❌ Erreur de réservation',
        description: errorMessage || 'Une erreur est survenue lors de la réservation',
        variant: 'destructive',
      });
    } finally {
      setIsBooking(false);
    }
  };

  if (isLoading) {
    return (
      <AppPageShell
        mainClassName="p-8"
        hideSidebar={true}
        showUtilityBar={false}
        hideHorizontalNav={true}
      >
        <div className="space-y-8">
          <Skeleton className="h-10 w-32" />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <Skeleton className="h-96 w-full" />
            <Skeleton className="h-96 w-full" />
          </div>
        </div>
      </AppPageShell>
    );
  }

  if (!service) {
    return (
      <AppPageShell
        mainClassName="p-8"
        hideSidebar={true}
        showUtilityBar={false}
        hideHorizontalNav={true}
      >
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-5 w-5" />
              <p>Service non trouvé</p>
            </div>
          </CardContent>
        </Card>
      </AppPageShell>
    );
  }

  // Never pass null/non-array into ProductImages → OptimizedImage (src.startsWith crashes).
  const images: string[] = (() => {
    const fromArray = Array.isArray(service?.images)
      ? service.images.filter((u): u is string => typeof u === 'string' && u.length > 0)
      : [];
    if (fromArray.length > 0) return fromArray;
    if (typeof service?.image_url === 'string' && service.image_url.length > 0) {
      return [service.image_url];
    }
    return [];
  })();
  const availability = service?.is_active ? 'instock' : 'outofstock';
  const serviceRecord = service?.service as
    | {
        id?: string;
        fulfillment_mode?: string;
        pricing_type?: string;
        deposit_required?: boolean;
        deposit_amount?: number;
        deposit_type?: 'fixed' | 'percentage';
        allow_booking_cancellation?: boolean;
        cancellation_deadline_hours?: number;
        duration_minutes?: number;
        max_participants?: number;
        requires_staff?: boolean;
        location_address?: string;
        category_attributes?: Record<string, string | number | boolean | string[]>;
      }
    | null
    | undefined;
  const fulfillmentMode = serviceRecord?.fulfillment_mode || 'appointment';
  const listingCategory = getCategoryBreadcrumb(
    serviceCategories,
    (service as { category_id?: string | null } | undefined)?.category_id
  );
  const activePackagePrices = deliveryPackages.filter(pkg => pkg.is_active).map(pkg => pkg.price);
  const displayPrice = resolveServiceDisplayPrice({
    price: service?.price,
    promotionalPrice: service?.promotional_price,
    pricingType: serviceRecord?.pricing_type,
    fulfillmentMode,
    packagePrices: activePackagePrices,
  });
  const appointmentPrice = resolveServiceAppointmentUnitPrice({
    price: service?.price,
    promotionalPrice: service?.promotional_price,
    pricingType: serviceRecord?.pricing_type,
  });
  const appointmentCharge = resolveServiceAppointmentCharge({
    price: service?.price,
    promotionalPrice: service?.promotional_price,
    pricingType: serviceRecord?.pricing_type,
    durationMinutes: serviceRecord?.duration_minutes,
    participants,
  });
  const currentPrice = displayPrice.amount;
  const hasPublishedPackages = deliveryPackages.some(pkg => pkg.is_active);
  const showAppointment = serviceWizardShowsCalendar({
    fulfillment_mode:
      fulfillmentMode === 'project' ||
      fulfillmentMode === 'both' ||
      fulfillmentMode === 'appointment'
        ? fulfillmentMode
        : 'appointment',
    category: listingCategory.leaf?.slug || service?.category,
    category_id: (service as { category_id?: string | null } | undefined)?.category_id,
    parent_category_id: listingCategory.parent?.id ?? null,
  });
  const showProject =
    Boolean(serviceProductId) &&
    (fulfillmentMode === 'project' ||
      fulfillmentMode === 'both' ||
      hasPublishedPackages ||
      !showAppointment);
  const serviceUrl = `${window.location.origin}/service/${serviceId}`;

  const maxParticipants = service?.service?.max_participants || 1;
  const minParticipants = 1;
  const isGroup = maxParticipants > 1;

  return (
    <AppPageShell
      mainClassName={`px-4 py-4 sm:px-6 sm:py-6 lg:p-8 overflow-x-hidden ${showAppointment ? 'pb-24 lg:pb-8' : ''}`}
      hideSidebar={true}
      showUtilityBar={false}
      hideHorizontalNav={true}
    >
      {/* SEO Meta Tags */}
      <SEOMeta
        title={service.name}
        description={
          service.short_description ||
          service.description ||
          `${service.name} - Disponible sur Emarzona`
        }
        keywords={service.category}
        url={serviceUrl}
        image={images[0]}
        imageAlt={service.name}
        type="product"
        price={currentPrice}
        currency={service.currency}
        availability={availability}
      />

      {/* Product Schema.org */}
      {service.store && (
        <ProductSchema
          product={{
            id: service.id,
            name: service.name,
            slug: service.slug,
            description: service.description || service.short_description || '',
            price: currentPrice,
            currency: service.currency,
            image_url: images[0],
            images: images.map((url: string) => ({ url })),
            category: service.category,
            is_active: service.is_active,
            created_at: service.created_at,
          }}
          store={{
            name: service.store.name,
            slug: service.store.slug,
            logo_url: service.store.logo_url,
          }}
          url={serviceUrl}
        />
      )}

      {/* Back Button */}
      <Button variant="ghost" className="mb-4 sm:mb-6 -ml-2 min-h-11" onClick={() => navigate(-1)}>
        <ArrowLeft className="h-4 w-4 mr-2" />
        Retour
      </Button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8 min-w-0">
        {/* Left & Center: Service Info */}
        <div className="lg:col-span-2 space-y-6 min-w-0">
          {/* Images */}
          <div className="min-w-0 overflow-hidden rounded-lg">
            <ProductImages
              images={images}
              productName={service?.name || 'Service'}
              showThumbnails={true}
              enableLightbox={true}
              aspectRatio="video"
            />
          </div>

          {/* Title & Category */}
          <div>
            {(() => {
              const crumb = getCategoryBreadcrumb(
                serviceCategories,
                (service as { category_id?: string | null })?.category_id
              );
              if (crumb.parent || crumb.leaf) {
                return (
                  <nav
                    aria-label="Fil d'Ariane catégories"
                    className="flex flex-wrap items-center gap-1 text-sm text-muted-foreground mb-3"
                  >
                    <Link to="/marketplace?productType=service" className="hover:text-foreground">
                      Services
                    </Link>
                    {crumb.parent && (
                      <>
                        <ChevronRight className="h-3.5 w-3.5" aria-hidden />
                        <Link
                          to={`/services/${crumb.parent.slug}`}
                          className="hover:text-foreground"
                        >
                          {crumb.parent.name}
                        </Link>
                      </>
                    )}
                    {crumb.leaf && (
                      <>
                        <ChevronRight className="h-3.5 w-3.5" aria-hidden />
                        <Link
                          to={
                            crumb.parent
                              ? `/services/${crumb.parent.slug}/${crumb.leaf.slug}`
                              : `/services/${crumb.leaf.slug}`
                          }
                          className="hover:text-foreground font-medium text-foreground"
                        >
                          {crumb.leaf.name}
                        </Link>
                      </>
                    )}
                  </nav>
                );
              }
              return service?.category ? <Badge className="mb-2">{service.category}</Badge> : null;
            })()}
            <h1 className="text-lg sm:text-2xl md:text-3xl font-bold mb-2">{service?.name}</h1>
            {service?.short_description && (
              <p className="text-sm sm:text-base md:text-lg text-muted-foreground">
                {service.short_description}
              </p>
            )}
            <div className="mt-4 space-y-2">
              <ServicePriceDisplay
                display={displayPrice}
                currency={service?.currency || 'XOF'}
                size="lg"
              />
              <ServicePricingBadges
                pricingType={serviceRecord?.pricing_type}
                depositRequired={serviceRecord?.deposit_required}
                depositAmount={serviceRecord?.deposit_amount}
                depositType={serviceRecord?.deposit_type}
                allowCancellation={serviceRecord?.allow_booking_cancellation}
                cancellationDeadlineHours={serviceRecord?.cancellation_deadline_hours}
                maxParticipants={serviceRecord?.max_participants}
                size="md"
              />
            </div>
          </div>

          {/* Service Details — single card (not repeated in the description tab) */}
          {(() => {
            const durationLabel = formatServiceDurationMinutes(service?.service?.duration_minutes);
            const locationLabel = serviceLocationTypeLabel(service?.service?.location_type);
            const kindLabel = serviceTypeLabel(service?.service?.service_type);
            return (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm sm:text-base md:text-lg">
                    Détails du service
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {durationLabel && (
                    <div className="flex items-center gap-3 min-w-0">
                      <Clock className="h-5 w-5 text-primary shrink-0" />
                      <div className="min-w-0">
                        <p className="text-sm text-muted-foreground">Durée</p>
                        <p className="font-medium">{durationLabel}</p>
                      </div>
                    </div>
                  )}

                  {isGroup && (
                    <div className="flex items-center gap-3 min-w-0">
                      <Users className="h-5 w-5 text-primary shrink-0" />
                      <div className="min-w-0">
                        <p className="text-sm text-muted-foreground">Participants</p>
                        <p className="font-medium">Jusqu'à {maxParticipants} personnes</p>
                      </div>
                    </div>
                  )}

                  {(locationLabel || service?.service?.location_address) && (
                    <div className="flex items-start gap-3 min-w-0">
                      <MapPin className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                      <div className="min-w-0">
                        <p className="text-sm text-muted-foreground">Lieu</p>
                        <p className="font-medium break-words">
                          {service?.service?.location_address || locationLabel}
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-3 min-w-0">
                    <Calendar className="h-5 w-5 text-primary shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm text-muted-foreground">Type</p>
                      <p className="font-medium">
                        {kindLabel || (isGroup ? 'Groupe' : 'Individuel')}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })()}

          <ServicePrestationsCatalog
            packages={deliveryPackages}
            extras={gigExtras}
            currency={service?.currency || 'XOF'}
            isLoading={packagesLoading || extrasLoading}
          />

          {(() => {
            const crumb = getCategoryBreadcrumb(
              serviceCategories,
              (service as { category_id?: string | null }).category_id
            );
            const profile = getServiceFormProfile(
              crumb.parent?.slug,
              crumb.leaf?.slug || service.category
            );
            const attrs = (
              service.service as {
                category_attributes?: Record<string, string | number | boolean | string[]>;
              } | null
            )?.category_attributes;
            if (!profile || !attrs) return null;
            const rows = profile.fields
              .map(field => ({
                label: field.label,
                value: formatServiceAttributeValue(field, attrs[field.key]),
              }))
              .filter(row => row.value);
            if (rows.length === 0) return null;
            return (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm sm:text-base md:text-lg">
                    Spécificités · {profile.familyLabel}
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {rows.map(row => (
                    <div key={row.label}>
                      <p className="text-sm text-muted-foreground">{row.label}</p>
                      <p className="font-medium">{row.value}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            );
          })()}

          {/* Content Tabs */}
          <Tabs defaultValue="description" className="mt-6 space-y-6">
            <TabsList className="w-full overflow-x-auto flex-nowrap justify-start">
              <TabsTrigger value="description" className="min-h-[44px] shrink-0">
                Description
              </TabsTrigger>
              <TabsTrigger value="team" className="min-h-[44px] shrink-0">
                Équipe
              </TabsTrigger>
              <TabsTrigger value="reviews" className="min-h-[44px] shrink-0">
                Avis
              </TabsTrigger>
            </TabsList>

            {/* Description Tab */}
            <TabsContent value="description" className="space-y-6">
              {service?.description && (
                <Card>
                  <CardHeader>
                    <CardTitle>À propos de ce service</CardTitle>
                  </CardHeader>
                  <CardContent className="overflow-x-auto">
                    <SafeHTML
                      html={service.description || ''}
                      className="bg-white dark:bg-white text-black dark:text-black prose max-w-none prose-headings:text-black dark:prose-headings:text-black prose-p:text-black dark:prose-p:text-black prose-a:text-primary prose-strong:text-black dark:prose-strong:text-black p-4 sm:p-6 rounded-lg"
                    />
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Team Tab */}
            <TabsContent value="team" className="space-y-6">
              {service?.staff && service.staff.length > 0 ? (
                <div className="space-y-4">
                  <h2 className="text-lg sm:text-xl md:text-2xl font-bold">Notre équipe</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {service.staff.map((member: StaffMember) => (
                      <StaffCard
                        key={member.id}
                        name={member.name}
                        role={member.role}
                        bio={member.bio}
                        avatar_url={member.avatar_url}
                        variant="compact"
                        availability="available"
                      />
                    ))}
                  </div>
                </div>
              ) : (
                <Card>
                  <CardContent className="pt-6">
                    <p className="text-center text-muted-foreground py-8">
                      Aucun membre d'équipe assigné à ce service
                    </p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Reviews Tab */}
            <TabsContent value="reviews" className="space-y-6">
              <ProductReviewsSummary productId={serviceId!} productType="service" />

              <Card>
                <CardHeader>
                  <CardTitle>Avis des utilisateurs</CardTitle>
                </CardHeader>
                <CardContent>
                  <ReviewsList productId={serviceId!} productType="service" />
                </CardContent>
              </Card>

              {user && (
                <Card>
                  <CardHeader>
                    <CardTitle>Donner votre avis</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ReviewForm productId={serviceId!} productType="service" />
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </div>

        {/* Right: Booking / Project order */}
        <div id="service-booking" className="space-y-4 min-w-0 scroll-mt-4">
          {(() => {
            if (showProject && !showAppointment) {
              return (
                <ServiceProjectOrderPanel
                  serviceProductId={serviceProductId!}
                  productId={serviceId!}
                  currency={service?.currency || 'XOF'}
                  onContinue={payload => {
                    sessionStorage.setItem(
                      `service-project-order:${serviceId}`,
                      JSON.stringify(payload)
                    );
                    const url = buildCheckoutUrl({
                      productId: serviceId!,
                      storeId: service?.store_id,
                      buyNow: true,
                      quantity: 1,
                      guestEmail: guestEmail || undefined,
                      guestName: guestName || undefined,
                    });
                    navigate(url);
                  }}
                />
              );
            }

            if (showProject && showAppointment) {
              return (
                <Tabs defaultValue={hasPublishedPackages ? 'project' : 'appointment'}>
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="appointment">Réserver</TabsTrigger>
                    <TabsTrigger value="project">Formules</TabsTrigger>
                  </TabsList>
                  <TabsContent value="project" className="mt-4">
                    <ServiceProjectOrderPanel
                      serviceProductId={serviceProductId!}
                      productId={serviceId!}
                      currency={service?.currency || 'XOF'}
                      onContinue={payload => {
                        sessionStorage.setItem(
                          `service-project-order:${serviceId}`,
                          JSON.stringify(payload)
                        );
                        const url = buildCheckoutUrl({
                          productId: serviceId!,
                          storeId: service?.store_id,
                          buyNow: true,
                          quantity: 1,
                          guestEmail: guestEmail || undefined,
                          guestName: guestName || undefined,
                        });
                        navigate(url);
                      }}
                    />
                  </TabsContent>
                  <TabsContent value="appointment" className="mt-4">
                    <Card>
                      <CardHeader>
                        <CardTitle>Réserver un créneau</CardTitle>
                      </CardHeader>
                      <CardContent className="text-sm text-muted-foreground">
                        Utilisez le calendrier et le bouton de réservation ci-dessous.
                      </CardContent>
                    </Card>
                  </TabsContent>
                </Tabs>
              );
            }

            return null;
          })()}

          {showAppointment && (
            <Card className="lg:sticky lg:top-4 min-w-0 overflow-hidden">
              <CardHeader>
                <div className="flex items-start justify-between mb-2 gap-3 flex-wrap">
                  <CardTitle>Réserver</CardTitle>
                  <ServicePriceDisplay
                    display={appointmentPrice}
                    currency={service?.currency || 'XOF'}
                    size="md"
                    align="right"
                  />
                </div>
                {isGroup && (
                  <CardDescription>
                    {appointmentPrice.pricingType === 'per_participant'
                      ? 'Prix par participant'
                      : 'Prix par personne'}
                  </CardDescription>
                )}

                {/* Type de licence, Modèle de tarification, Options de paiement et Commission */}
                <div className="flex items-center gap-2 flex-wrap mt-3">
                  {/* Badge Type de licence */}
                  {service?.licensing_type && (
                    <Badge
                      variant="outline"
                      className={`text-sm ${
                        service.licensing_type === 'plr'
                          ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20'
                          : service.licensing_type === 'copyrighted'
                            ? 'border-red-500 text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20'
                            : 'border-blue-500 text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20'
                      }`}
                    >
                      <Shield className="h-3 w-3 mr-1" />
                      {service.licensing_type === 'plr'
                        ? 'PLR'
                        : service.licensing_type === 'copyrighted'
                          ? "Droit d'auteur"
                          : 'Standard'}
                    </Badge>
                  )}

                  {/* Badge Modèle de tarification */}
                  <PricingModelBadge pricingModel={service?.pricing_model} size="sm" />

                  {/* Badge Options de paiement */}
                  <PaymentOptionsBadge
                    paymentOptions={getPaymentOptions(
                      service as {
                        payment_options?: {
                          payment_type?: 'full' | 'percentage' | 'delivery_secured';
                          percentage_rate?: number;
                        } | null;
                      }
                    )}
                    size="sm"
                  />

                  {/* Badge Taux de commission d'affiliation */}
                  {(() => {
                    const serviceWithAffiliate = service as {
                      product_affiliate_settings?:
                        | Array<{ affiliate_enabled?: boolean; commission_rate?: number }>
                        | { affiliate_enabled?: boolean; commission_rate?: number }
                        | null;
                    };
                    const affiliateSettings = Array.isArray(
                      serviceWithAffiliate?.product_affiliate_settings
                    )
                      ? serviceWithAffiliate.product_affiliate_settings[0]
                      : serviceWithAffiliate?.product_affiliate_settings;

                    return affiliateSettings?.affiliate_enabled &&
                      affiliateSettings?.commission_rate > 0 ? (
                      <Badge
                        variant="secondary"
                        className="text-sm bg-gradient-to-r from-orange-500 to-pink-500 text-white border-0"
                        title={`Taux de commission d'affiliation: ${affiliateSettings.commission_rate}%`}
                      >
                        <TrendingUp className="h-3 w-3 mr-1" />
                        {affiliateSettings.commission_rate}% commission
                      </Badge>
                    ) : null;
                  })()}

                  {/* Badge Preview Gratuit */}
                  {service.is_free_preview && (
                    <Badge
                      variant="outline"
                      className="text-sm bg-gradient-to-r from-purple-500/10 to-pink-500/10 text-purple-700 border-purple-500/20"
                    >
                      <Eye className="h-3 w-3 mr-1" />
                      Version Preview Gratuite
                    </Badge>
                  )}
                  {/* Badge si service payant a un preview */}
                  {service.free_product && !service.is_free_preview && (
                    <Badge
                      variant="outline"
                      className="text-sm bg-gradient-to-r from-green-500/10 to-emerald-500/10 text-green-700 border-green-500/20"
                    >
                      <Gift className="h-3 w-3 mr-1" />
                      Version Preview Disponible
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Lien vers service preview ou payant */}
                {service?.is_free_preview && service?.paid_product && (
                  <div className="p-4 rounded-lg bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border border-purple-200 dark:border-purple-800">
                    <div className="flex items-start gap-3">
                      <Gift className="h-5 w-5 text-purple-600 dark:text-purple-400 mt-0.5 flex-shrink-0" />
                      <div className="flex-1">
                        <p className="font-semibold text-purple-900 dark:text-purple-100 mb-1">
                          Version Preview Gratuite
                        </p>
                        {service.preview_content_description && (
                          <p className="text-sm text-purple-800 dark:text-purple-200 mb-3">
                            {service.preview_content_description}
                          </p>
                        )}
                        <Button
                          onClick={() => navigate(`/service/${service.paid_product.id}`)}
                          className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
                          size="sm"
                        >
                          <Package className="h-4 w-4 mr-2" />
                          Accéder à la version complète (
                          {service.paid_product.price.toLocaleString()}{' '}
                          {service.paid_product.currency})
                        </Button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Lien vers preview gratuit si service payant */}
                {service?.free_product && !service?.is_free_preview && (
                  <div className="p-4 rounded-lg bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border border-green-200 dark:border-green-800">
                    <div className="flex items-start gap-3">
                      <Eye className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                      <div className="flex-1">
                        <p className="font-semibold text-green-900 dark:text-green-100 mb-1">
                          Version Preview Gratuite Disponible
                        </p>
                        <p className="text-sm text-green-800 dark:text-green-200 mb-3">
                          Réservez gratuitement un aperçu du service avant de commander la version
                          complète.
                        </p>
                        <Button
                          onClick={() => navigate(`/service/${service.free_product.id}`)}
                          className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white"
                          size="sm"
                          variant="outline"
                        >
                          <Gift className="h-4 w-4 mr-2" />
                          Essayer gratuitement
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
                {/* Prestataire (Fresha / Calendly) */}
                {Array.isArray(service?.staff) && service.staff.length > 0 && (
                  <div className="space-y-2">
                    <Label>Prestataire</Label>
                    <div className="grid grid-cols-1 gap-2">
                      {(service.staff as StaffMember[]).map(member => {
                        const selected = selectedStaffId === member.id;
                        return (
                          <button
                            key={member.id}
                            type="button"
                            onClick={() => setSelectedStaffId(member.id)}
                            className={`text-left rounded-lg border p-3 min-h-[44px] ${
                              selected
                                ? 'border-primary ring-2 ring-primary/20'
                                : 'hover:border-primary/40'
                            }`}
                          >
                            <p className="font-medium text-sm">{member.name}</p>
                            {member.role && (
                              <p className="text-xs text-muted-foreground">{member.role}</p>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {!user && (
                  <div className="space-y-3 rounded-lg border p-3">
                    <p className="text-sm font-medium">Réserver en invité</p>
                    <div className="space-y-2">
                      <Label htmlFor="guest-email">E-mail</Label>
                      <Input
                        id="guest-email"
                        type="email"
                        className="min-h-11"
                        value={guestEmailDraft}
                        onChange={e => setGuestEmailDraft(e.target.value)}
                        placeholder="vous@email.com"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="guest-name">Nom</Label>
                      <Input
                        id="guest-name"
                        className="min-h-11"
                        value={guestNameDraft}
                        onChange={e => setGuestNameDraft(e.target.value)}
                        placeholder="Votre nom"
                      />
                    </div>
                  </div>
                )}

                {/* Participants (if group) */}
                {isGroup && (
                  <div>
                    <label className="text-sm font-medium mb-2 block">Nombre de participants</label>
                    <div className="flex items-center gap-3">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => setParticipants(Math.max(minParticipants, participants - 1))}
                        disabled={participants <= minParticipants}
                        aria-label="Diminuer le nombre de participants"
                      >
                        -
                      </Button>
                      <span className="text-lg font-medium w-12 text-center">{participants}</span>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => setParticipants(Math.min(maxParticipants, participants + 1))}
                        disabled={participants >= maxParticipants}
                        aria-label="Augmenter le nombre de participants"
                      >
                        +
                      </Button>
                    </div>
                  </div>
                )}

                {/* Calendar */}
                <div>
                  <label className="text-sm font-medium mb-2 block">Sélectionnez une date</label>
                  <ServiceCalendarEnhanced
                    serviceId={serviceId!}
                    selectedDate={selectedDate || undefined}
                    onDateSelect={nextDate => {
                      setSelectedDate(nextDate);
                      setSelectedSlot(null);
                      setValidationError(null);
                    }}
                  />
                </div>

                {/* Time Slots */}
                {selectedDate && (
                  <div className="space-y-2" data-testid="service-time-slots">
                    <label className="text-sm font-medium mb-2 block">Choisissez un créneau</label>
                    <TimeSlotPicker
                      serviceId={serviceId!}
                      serviceProductId={serviceProductId ?? undefined}
                      date={selectedDate}
                      durationMinutes={service?.service?.duration_minutes ?? 60}
                      onSlotSelect={setSelectedSlot}
                    />

                    {/* Feedback validation en temps réel */}
                    {isValidating && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Vérification de la disponibilité...</span>
                      </div>
                    )}

                    {validationError && !isValidating && (
                      <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                        <div className="flex items-start gap-2">
                          <AlertCircle className="h-4 w-4 text-destructive mt-0.5 flex-shrink-0" />
                          <div className="flex-1">
                            <p className="text-sm font-medium text-destructive">
                              Créneau non disponible
                            </p>
                            <p className="text-xs text-destructive/80 mt-1">{validationError}</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {!validationError && !isValidating && selectedSlot && (
                      <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
                        <CheckCircle2 className="h-4 w-4" />
                        <span>Créneau disponible</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Total Price — matches RPC appointment charge + addons */}
                {(() => {
                  const addonTotal = serviceAddons
                    .filter(
                      row =>
                        row.is_required || selectedAddonProductIds.includes(row.addon_product_id)
                    )
                    .reduce(
                      (sum, row) => sum + addonEffectivePrice(row.addon) * (row.quantity || 1),
                      0
                    );
                  const bookingTotal = appointmentCharge + addonTotal;
                  if (bookingTotal <= 0) return null;
                  const differsFromUnit = bookingTotal !== appointmentPrice.amount;
                  if (!differsFromUnit && !isGroup) return null;
                  return (
                    <div className="p-4 bg-muted rounded-lg">
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Total</span>
                        <span className="text-xl font-bold">
                          {bookingTotal.toLocaleString()} {service?.currency}
                        </span>
                      </div>
                    </div>
                  );
                })()}

                {selectedDate && selectedSlot && serviceProductId && (
                  <ServiceProductAddonsPicker
                    addons={serviceAddons}
                    isLoading={addonsLoading}
                    selectedAddonProductIds={selectedAddonProductIds}
                    onChange={setSelectedAddonProductIds}
                  />
                )}

                <Button
                  onClick={() => void handleBooking()}
                  className="w-full min-h-11"
                  size="lg"
                  disabled={
                    !selectedDate ||
                    !selectedSlot ||
                    isBooking ||
                    isValidating ||
                    !!validationError ||
                    (Boolean(serviceRecord?.requires_staff) &&
                      Array.isArray(service?.staff) &&
                      service.staff.length > 0 &&
                      !selectedStaffId) ||
                    (!user && !guestEmailDraft.trim())
                  }
                >
                  {isBooking ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Redirection vers le paiement...
                    </>
                  ) : !selectedDate || !selectedSlot ? (
                    'Sélectionnez une date et un créneau'
                  ) : (
                    'Réserver et payer'
                  )}
                </Button>

                <Separator />

                {/* Waitlist Button */}
                <JoinWaitlistButton
                  serviceId={serviceId!}
                  serviceName={service.name}
                  storeId={service.store_id ?? service.store?.id}
                />

                {/* Secondary Actions */}
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant="outline"
                    className="w-full min-h-11"
                    onClick={handleWishlistToggle}
                    disabled={isCheckingWishlist}
                  >
                    {isCheckingWishlist ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Heart
                        className={`h-4 w-4 mr-2 ${isInWishlist ? 'fill-red-500 text-red-500' : ''}`}
                      />
                    )}
                    {isInWishlist ? 'Retiré' : 'Favori'}
                  </Button>
                  <Button variant="outline" className="w-full min-h-11" onClick={handleShare}>
                    <Share2 className="h-4 w-4 mr-2" />
                    Partager
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Recommendations Section */}
      <Separator className="my-12" />

      <ServiceRecommendations
        serviceId={serviceId!}
        category={service?.category}
        tags={Array.isArray(service?.tags) ? service.tags : undefined}
        limit={6}
        variant="grid"
        title="Services similaires"
      />

      <BookedTogetherRecommendations serviceId={serviceId!} limit={4} />

      {showAppointment && (
        <div className="lg:hidden fixed bottom-0 inset-x-0 z-40 border-t bg-background px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
          <Button
            className="w-full min-h-11"
            size="lg"
            onClick={() =>
              document.getElementById('service-booking')?.scrollIntoView({
                behavior: 'smooth',
                block: 'start',
              })
            }
          >
            Réserver · {appointmentPrice.amount.toLocaleString()} {service?.currency || 'XOF'}
          </Button>
        </div>
      )}
    </AppPageShell>
  );
}
