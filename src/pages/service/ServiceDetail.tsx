/**
 * Service Detail Page - Professional
 * Date: 29 janvier 2025
 *
 * Page complète de détail pour services avec calendrier de réservation
 * Améliorée avec SEO, analytics, recommandations, partage social et wishlist
 */

import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { sanitizeProductDescription } from '@/lib/html-sanitizer';
import { safeRedirect } from '@/lib/url-validator';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
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
import { useCreateServiceOrder } from '@/hooks/orders/useCreateServiceOrder';
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

interface WindowWithTracking extends Window {
  gtag?: (command: string, eventName: string, params?: Record<string, unknown>) => void;
  fbq?: (command: string, eventName: string, params?: Record<string, unknown>) => void;
  ttq?: { track: (eventName: string, params?: Record<string, unknown>) => void };
}

export default function ServiceDetail() {
  const { serviceId } = useParams<{ serviceId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const createServiceOrder = useCreateServiceOrder();
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

  // Hooks de validation
  const validateBooking = useValidateServiceBooking();
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
      const { data: productData, error } = await supabase
        .from('products')
        .select(
          `
          *,
          stores (
            id,
            name,
            slug,
            logo_url
          )
        `
        )
        .eq('id', serviceId)
        .single();

      if (error) throw error;

      // Récupérer les produits preview/paid si ils existent
      let freeProduct = null;
      let paidProduct = null;

      if (productData?.free_product_id) {
        const { data: freeData } = await supabase
          .from('products')
          .select('*')
          .eq('id', productData.free_product_id)
          .single();
        freeProduct = freeData;
      }

      if (productData?.paid_product_id) {
        const { data: paidData } = await supabase
          .from('products')
          .select('*')
          .eq('id', productData.paid_product_id)
          .single();
        paidProduct = paidData;
      }

      // Fetch service details
      const { data: serviceData } = await supabase
        .from('service_products')
        .select('*')
        .eq('product_id', serviceId)
        .single();

      // Fetch staff
      const { data: staff } = await supabase
        .from('service_staff_members')
        .select('*')
        .eq('service_product_id', serviceData?.id);

      return {
        ...productData,
        free_product: freeProduct,
        paid_product: paidProduct,
        service: serviceData,
        staff: staff || [],
        store: productData.stores,
      };
    },
    enabled: !!serviceId,
  });

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
        const result = await validateBooking.mutateAsync({
          productId: serviceId!, // serviceId est le product_id
          scheduledDate: selectedDate.toISOString().split('T')[0],
          scheduledStartTime: bookingDate.toTimeString().slice(0, 8),
          scheduledEndTime: endDate.toTimeString().slice(0, 8),
          staffMemberId: undefined, // À améliorer si staff spécifique
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
  }, [selectedDate, selectedSlot, participants, service?.service, serviceId, validateBooking]);

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

    if (!user?.email) {
      toast({
        title: '❌ Authentification requise',
        description: 'Veuillez vous connecter pour réserver',
        variant: 'destructive',
      });
      navigate('/login');
      return;
    }

    // Validation finale avant réservation
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
      // Construire le bookingDateTime
      const bookingDate = new Date(selectedDate);
      const [hours, minutes] = selectedSlot.time.split(':').map(Number);
      bookingDate.setHours(hours, minutes, 0, 0);
      const bookingDateTime = bookingDate.toISOString();

      // Vérifier que la date n'est pas dans le passé
      if (bookingDate < new Date()) {
        toast({
          title: '❌ Date invalide',
          description: "La date et l'heure sélectionnées sont dans le passé",
          variant: 'destructive',
        });
        setIsBooking(false);
        return;
      }

      // Validation complète avant création
      const durationMinutes = service.service.duration_minutes || 60;
      const endDate = new Date(bookingDate);
      endDate.setMinutes(endDate.getMinutes() + durationMinutes);

      const validationResult = await validateBooking.mutateAsync({
        productId: serviceId!,
        scheduledDate: selectedDate.toISOString().split('T')[0],
        scheduledStartTime: bookingDate.toTimeString().slice(0, 8),
        scheduledEndTime: endDate.toTimeString().slice(0, 8),
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

      // Récupérer le store_id du produit
      const storeId = service.store_id;
      if (!storeId) {
        throw new Error('Store ID manquant');
      }

      // Créer la commande et la réservation
      const result = await createServiceOrder.mutateAsync({
        serviceProductId: service.service.id,
        productId: serviceId!,
        storeId,
        customerEmail: user.email,
        customerName: user.user_metadata?.full_name || user.email,
        bookingDateTime,
        numberOfParticipants: participants,
        durationMinutes: service.service.duration_minutes,
        notes: `Réservation via ServiceDetail - ${selectedDate.toLocaleDateString('fr-FR')}`,
      });

      logger.info('Réservation créée avec succès', {
        bookingId: result.bookingId,
        transactionId: result.transactionId,
      });

      // Rediriger vers Moneroo pour le paiement
      if (result.checkoutUrl) {
        safeRedirect(result.checkoutUrl, error => {
          toast({
            title: 'Erreur de redirection',
            description: error,
            variant: 'destructive',
          });
        });
      } else {
        // Si pas de paiement requis (service gratuit)
        toast({
          title: '✅ Réservation confirmée !',
          description: `Votre réservation pour ${service.name} a été confirmée`,
        });
        // Rediriger vers la page de confirmation ou les réservations
        navigate('/dashboard/my-bookings');
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error('Erreur lors de la réservation', error);
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
      <SidebarProvider>
        <div className="min-h-screen flex w-full">
          <AppSidebar />
          <main className="flex-1 p-8">
            <div className="space-y-8">
              <Skeleton className="h-10 w-32" />
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <Skeleton className="h-96 w-full" />
                <Skeleton className="h-96 w-full" />
              </div>
            </div>
          </main>
        </div>
      </SidebarProvider>
    );
  }

  if (!service) {
    return (
      <SidebarProvider>
        <div className="min-h-screen flex w-full">
          <AppSidebar />
          <main className="flex-1 p-8">
            <Card className="border-destructive">
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 text-destructive">
                  <AlertCircle className="h-5 w-5" />
                  <p>Service non trouvé</p>
                </div>
              </CardContent>
            </Card>
          </main>
        </div>
      </SidebarProvider>
    );
  }

  const images = service?.images || [service?.image_url] || [];
  const availability = service?.is_active ? 'instock' : 'outofstock';
  const currentPrice = service?.promotional_price || service?.price;
  const serviceUrl = `${window.location.origin}/service/${serviceId}`;

  const maxParticipants = service?.service?.max_participants || 1;
  const minParticipants = service?.service?.min_participants || 1;
  const isGroup = service?.service?.booking_type === 'group';

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <main className="flex-1 p-8">
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
          <Button variant="ghost" className="mb-6" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour
          </Button>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left & Center: Service Info */}
            <div className="lg:col-span-2 space-y-6">
              {/* Images */}
              <ProductImages
                images={images}
                productName={service?.name || 'Service'}
                showThumbnails={true}
                enableLightbox={true}
                aspectRatio="video"
              />

              {/* Title & Category */}
              <div>
                <Badge className="mb-2">{service?.category}</Badge>
                <h1 className="text-lg sm:text-2xl md:text-3xl font-bold mb-2">{service?.name}</h1>
                {service?.short_description && (
                  <p className="text-sm sm:text-base md:text-lg text-muted-foreground">
                    {service.short_description}
                  </p>
                )}
              </div>

              {/* Service Details */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm sm:text-base md:text-lg">
                    Détails du service
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-3">
                    <Clock className="h-5 w-5 text-primary" />
                    <div>
                      <p className="text-sm text-muted-foreground">Durée</p>
                      <p className="font-medium">{service?.service?.duration_minutes} minutes</p>
                    </div>
                  </div>

                  {isGroup && (
                    <div className="flex items-center gap-3">
                      <Users className="h-5 w-5 text-primary" />
                      <div>
                        <p className="text-sm text-muted-foreground">Participants</p>
                        <p className="font-medium">
                          {minParticipants} - {maxParticipants} personnes
                        </p>
                      </div>
                    </div>
                  )}

                  {service?.service?.location && (
                    <div className="flex items-center gap-3">
                      <MapPin className="h-5 w-5 text-primary" />
                      <div>
                        <p className="text-sm text-muted-foreground">Lieu</p>
                        <p className="font-medium">{service.service.location}</p>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-3">
                    <Calendar className="h-5 w-5 text-primary" />
                    <div>
                      <p className="text-sm text-muted-foreground">Type</p>
                      <p className="font-medium">
                        {service?.service?.booking_type === 'group' ? 'Groupe' : 'Individuel'}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

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
                      <CardContent>
                        <div
                          className="bg-white dark:bg-white text-black dark:text-black prose max-w-none prose-headings:text-black dark:prose-headings:text-black prose-p:text-black dark:prose-p:text-black prose-a:text-primary prose-strong:text-black dark:prose-strong:text-black p-4 sm:p-6 rounded-lg"
                          dangerouslySetInnerHTML={{
                            __html: sanitizeProductDescription(service.description || ''),
                          }}
                        />
                      </CardContent>
                    </Card>
                  )}

                  {/* Service Details */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm sm:text-base md:text-lg">
                        Détails du service
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-2 gap-4">
                      <div className="flex items-center gap-3">
                        <Clock className="h-5 w-5 text-primary" />
                        <div>
                          <p className="text-sm text-muted-foreground">Durée</p>
                          <p className="font-medium">
                            {service?.service?.duration_minutes} minutes
                          </p>
                        </div>
                      </div>

                      {isGroup && (
                        <div className="flex items-center gap-3">
                          <Users className="h-5 w-5 text-primary" />
                          <div>
                            <p className="text-sm text-muted-foreground">Participants</p>
                            <p className="font-medium">
                              {minParticipants} - {maxParticipants} personnes
                            </p>
                          </div>
                        </div>
                      )}

                      {service?.service?.location_type && (
                        <div className="flex items-center gap-3">
                          <MapPin className="h-5 w-5 text-primary" />
                          <div>
                            <p className="text-sm text-muted-foreground">Lieu</p>
                            <p className="font-medium">
                              {service.service.location_type === 'on_site'
                                ? 'Sur site'
                                : service.service.location_type === 'online'
                                  ? 'En ligne'
                                  : service.service.location_type === 'home'
                                    ? 'À domicile'
                                    : 'Flexible'}
                            </p>
                          </div>
                        </div>
                      )}

                      <div className="flex items-center gap-3">
                        <Calendar className="h-5 w-5 text-primary" />
                        <div>
                          <p className="text-sm text-muted-foreground">Type</p>
                          <p className="font-medium">
                            {service?.service?.service_type || 'Service'}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
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
                            role={member.specialty || member.role}
                            bio={member.bio}
                            avatar_url={member.photo_url || member.avatar_url}
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

            {/* Right: Booking */}
            <div className="space-y-4">
              <Card className="sticky top-4">
                <CardHeader>
                  <div className="flex items-start justify-between mb-2">
                    <CardTitle>Réserver</CardTitle>
                    <div className="text-right">
                      <div className="text-2xl font-bold">
                        {currentPrice?.toLocaleString()} {service?.currency}
                      </div>
                      {service?.promotional_price && (
                        <span className="text-sm line-through text-muted-foreground">
                          {service.price.toLocaleString()} {service.currency}
                        </span>
                      )}
                    </div>
                  </div>
                  {isGroup && <CardDescription>Prix par personne</CardDescription>}

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
                            onClick={() =>
                              navigate(
                                `/services/${service.paid_product.slug || service.paid_product.id}`
                              )
                            }
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
                            onClick={() =>
                              navigate(
                                `/services/${service.free_product.slug || service.free_product.id}`
                              )
                            }
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
                  {/* Participants (if group) */}
                  {isGroup && (
                    <div>
                      <label className="text-sm font-medium mb-2 block">
                        Nombre de participants
                      </label>
                      <div className="flex items-center gap-3">
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() =>
                            setParticipants(Math.max(minParticipants, participants - 1))
                          }
                          disabled={participants <= minParticipants}
                          aria-label="Diminuer le nombre de participants"
                        >
                          -
                        </Button>
                        <span className="text-lg font-medium w-12 text-center">{participants}</span>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() =>
                            setParticipants(Math.min(maxParticipants, participants + 1))
                          }
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
                      onDateSelect={setSelectedDate}
                    />
                  </div>

                  {/* Time Slots */}
                  {selectedDate && (
                    <div className="space-y-2">
                      <label className="text-sm font-medium mb-2 block">
                        Choisissez un créneau
                      </label>
                      <TimeSlotPicker
                        serviceId={serviceId!}
                        date={selectedDate}
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

                  {/* Total Price */}
                  {isGroup && (
                    <div className="p-4 bg-muted rounded-lg">
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Total</span>
                        <span className="text-xl font-bold">
                          {(service?.price * participants).toLocaleString()} {service?.currency}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Book Button */}
                  <Button
                    onClick={handleBooking}
                    className="w-full"
                    size="lg"
                    disabled={
                      !selectedDate ||
                      !selectedSlot ||
                      isBooking ||
                      isValidating ||
                      !!validationError
                    }
                  >
                    {isBooking ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Création de la réservation...
                      </>
                    ) : !selectedDate || !selectedSlot ? (
                      'Sélectionnez une date et un créneau'
                    ) : (
                      'Réserver maintenant'
                    )}
                  </Button>

                  <Separator />

                  {/* Waitlist Button */}
                  <JoinWaitlistButton
                    serviceId={serviceId!}
                    serviceName={service.name}
                    disabled={!user}
                  />

                  {/* Secondary Actions */}
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      variant="outline"
                      className="w-full"
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
                    <Button variant="outline" className="w-full" onClick={handleShare}>
                      <Share2 className="h-4 w-4 mr-2" />
                      Partager
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Recommendations Section */}
          <Separator className="my-12" />

          <ServiceRecommendations
            serviceId={serviceId!}
            category={service?.category}
            tags={service?.tags}
            limit={6}
            variant="grid"
            title="Services similaires"
          />

          <BookedTogetherRecommendations serviceId={serviceId!} limit={4} />
        </main>
      </div>
    </SidebarProvider>
  );
}
