/**
 * Service Detail Page
 * Date: 28 octobre 2025
 * 
 * Page de détail pour services avec calendrier de réservation
 */

import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { sanitizeHTML } from '@/lib/html-sanitizer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
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
} from 'lucide-react';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { ServiceCalendar } from '@/components/service/ServiceCalendar';
import { TimeSlotPicker } from '@/components/service/TimeSlotPicker';
import { ProductReviewsSummary } from '@/components/reviews/ProductReviewsSummary';
import { StaffCard } from '@/components/shared';
import { useCreateServiceOrder } from '@/hooks/orders/useCreateServiceOrder';
import { useAuth } from '@/contexts/AuthContext';
import { logger } from '@/lib/logger';

export default function ServiceDetail() {
  const { serviceId } = useParams<{ serviceId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const createServiceOrder = useCreateServiceOrder();
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<any>(null);
  const [participants, setParticipants] = useState(1);
  const [isBooking, setIsBooking] = useState(false);

      // Fetch service data with preview/paid relationships
      const { data: service, isLoading } = useQuery({
        queryKey: ['service', serviceId],
        queryFn: async () => {
          const { data: productData, error } = await supabase
            .from('products')
            .select('*')
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
          };
        },
        enabled: !!serviceId,
      });

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

    setIsBooking(true);

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
          description: 'La date et l\'heure sélectionnées sont dans le passé',
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
        window.location.href = result.checkoutUrl;
      } else {
        // Si pas de paiement requis (service gratuit)
        toast({
          title: '✅ Réservation confirmée !',
          description: `Votre réservation pour ${service.name} a été confirmée`,
        });
        // Rediriger vers la page de confirmation ou les réservations
        navigate('/dashboard/my-bookings');
      }
    } catch (error: any) {
      logger.error('Erreur lors de la réservation', error);
      toast({
        title: '❌ Erreur de réservation',
        description: error.message || 'Une erreur est survenue lors de la réservation',
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
            <Skeleton className="h-96 w-full" />
          </main>
        </div>
      </SidebarProvider>
    );
  }

  const maxParticipants = service?.service?.max_participants || 1;
  const minParticipants = service?.service?.min_participants || 1;
  const isGroup = service?.service?.booking_type === 'group';

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <main className="flex-1 p-8">
          {/* Back Button */}
          <Button
            variant="ghost"
            className="mb-6"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour
          </Button>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left & Center: Service Info */}
            <div className="lg:col-span-2 space-y-6">
              {/* Image */}
              {service?.image_url && (
                <div className="relative aspect-video rounded-lg overflow-hidden">
                  <img
                    src={service.image_url}
                    alt={service.name}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}

              {/* Title & Category */}
              <div>
                <Badge className="mb-2">{service?.category}</Badge>
                <h1 className="text-3xl font-bold mb-2">{service?.name}</h1>
                {service?.short_description && (
                  <p className="text-lg text-muted-foreground">
                    {service.short_description}
                  </p>
                )}
              </div>

              {/* Service Details */}
              <Card>
                <CardHeader>
                  <CardTitle>Détails du service</CardTitle>
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

              {/* Description */}
              {service?.description && (
                <Card>
                  <CardHeader>
                    <CardTitle>Description</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div
                      className="prose dark:prose-invert max-w-none"
                      dangerouslySetInnerHTML={{ __html: sanitizeHTML(service.description, 'productDescription') }}
                    />
                  </CardContent>
                </Card>
              )}

              {/* Staff */}
              {service?.staff && service.staff.length > 0 && (
                <div className="space-y-4">
                  <h2 className="text-2xl font-bold">Notre équipe</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {service.staff.map((member: any) => (
                      <StaffCard
                        key={member.id}
                        name={member.name}
                        role={member.specialty}
                        bio={member.bio}
                        avatar_url={member.photo_url}
                        variant="compact"
                        availability="available"
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Reviews */}
              <Separator />
              <ProductReviewsSummary productId={serviceId!} />
            </div>

            {/* Right: Booking */}
            <div className="space-y-4">
              <Card className="sticky top-4">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Réserver</span>
                    <span className="text-2xl font-bold">
                      {service?.price.toLocaleString()} {service?.currency}
                    </span>
                  </CardTitle>
                  {isGroup && (
                    <CardDescription>
                      Prix par personne
                    </CardDescription>
                  )}
                  
                  {/* Modèle de tarification */}
                  {service?.pricing_model && (
                    <div className="flex items-center gap-2 flex-wrap mt-3">
                      {service.pricing_model === 'subscription' && (
                        <Badge variant="outline" className="text-sm bg-blue-500/10 text-blue-700 border-blue-500/20">
                          <RefreshCw className="h-3 w-3 mr-1" />
                          Abonnement
                        </Badge>
                      )}
                      {service.pricing_model === 'one-time' && (
                        <Badge variant="outline" className="text-sm bg-purple-500/10 text-purple-700 border-purple-500/20">
                          <DollarSign className="h-3 w-3 mr-1" />
                          Paiement unique
                        </Badge>
                      )}
                      {service.pricing_model === 'free' && (
                        <Badge variant="outline" className="text-sm bg-green-500/10 text-green-700 border-green-500/20">
                          <Gift className="h-3 w-3 mr-1" />
                          Gratuit
                        </Badge>
                      )}
                      {service.pricing_model === 'pay-what-you-want' && (
                        <Badge variant="outline" className="text-sm bg-orange-500/10 text-orange-700 border-orange-500/20">
                          <DollarSign className="h-3 w-3 mr-1" />
                          Prix libre
                        </Badge>
                      )}
                      {/* Badge Preview Gratuit */}
                      {service.is_free_preview && (
                        <Badge variant="outline" className="text-sm bg-gradient-to-r from-purple-500/10 to-pink-500/10 text-purple-700 border-purple-500/20">
                          <Eye className="h-3 w-3 mr-1" />
                          Version Preview Gratuite
                        </Badge>
                      )}
                      {/* Badge si service payant a un preview */}
                      {service.free_product && !service.is_free_preview && (
                        <Badge variant="outline" className="text-sm bg-gradient-to-r from-green-500/10 to-emerald-500/10 text-green-700 border-green-500/20">
                          <Gift className="h-3 w-3 mr-1" />
                          Version Preview Disponible
                        </Badge>
                      )}
                    </div>
                  )}
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
                            onClick={() => navigate(`/services/${service.paid_product.slug || service.paid_product.id}`)}
                            className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
                            size="sm"
                          >
                            <Package className="h-4 w-4 mr-2" />
                            Accéder à la version complète ({service.paid_product.price.toLocaleString()} {service.paid_product.currency})
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
                            Réservez gratuitement un aperçu du service avant de commander la version complète.
                          </p>
                          <Button
                            onClick={() => navigate(`/services/${service.free_product.slug || service.free_product.id}`)}
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
                        >
                          -
                        </Button>
                        <span className="text-lg font-medium w-12 text-center">
                          {participants}
                        </span>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() =>
                            setParticipants(Math.min(maxParticipants, participants + 1))
                          }
                          disabled={participants >= maxParticipants}
                        >
                          +
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Calendar */}
                  <div>
                    <label className="text-sm font-medium mb-2 block">
                      Sélectionnez une date
                    </label>
                    <ServiceCalendar
                      serviceId={serviceId!}
                      onDateSelect={setSelectedDate}
                    />
                  </div>

                  {/* Time Slots */}
                  {selectedDate && (
                    <div>
                      <label className="text-sm font-medium mb-2 block">
                        Choisissez un créneau
                      </label>
                      <TimeSlotPicker
                        serviceId={serviceId!}
                        date={selectedDate}
                        onSlotSelect={setSelectedSlot}
                      />
                    </div>
                  )}

                  {/* Total Price */}
                  {isGroup && (
                    <div className="p-4 bg-muted rounded-lg">
                      <div className="flex justify-between items-center">
                        <span className="text-sm">Total</span>
                        <span className="text-xl font-bold">
                          {(service?.price * participants).toLocaleString()}{' '}
                          {service?.currency}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Book Button */}
                  <Button
                    onClick={handleBooking}
                    className="w-full"
                    size="lg"
                    disabled={!selectedDate || !selectedSlot || isBooking}
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

                  {/* Secondary Actions */}
                  <div className="grid grid-cols-2 gap-2">
                    <Button variant="outline" className="w-full">
                      <Heart className="h-4 w-4 mr-2" />
                      Favori
                    </Button>
                    <Button variant="outline" className="w-full">
                      <Share2 className="h-4 w-4 mr-2" />
                      Partager
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}

