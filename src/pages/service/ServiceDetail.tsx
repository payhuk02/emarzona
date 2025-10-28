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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
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
} from 'lucide-react';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { ServiceCalendar } from '@/components/service/ServiceCalendar';
import { TimeSlotPicker } from '@/components/service/TimeSlotPicker';
import { ProductReviewsSummary } from '@/components/reviews/ProductReviewsSummary';

export default function ServiceDetail() {
  const { serviceId } = useParams<{ serviceId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<any>(null);
  const [participants, setParticipants] = useState(1);

  // Fetch service data
  const { data: service, isLoading } = useQuery({
    queryKey: ['service', serviceId],
    queryFn: async () => {
      const { data: productData, error } = await supabase
        .from('products')
        .select('*')
        .eq('id', serviceId)
        .single();

      if (error) throw error;

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
        service: serviceData,
        staff: staff || [],
      };
    },
    enabled: !!serviceId,
  });

  const handleBooking = () => {
    if (!selectedDate || !selectedSlot) {
      toast({
        title: '⚠️ Sélection incomplète',
        description: 'Veuillez sélectionner une date et un créneau horaire',
        variant: 'destructive',
      });
      return;
    }

    // TODO: Implement booking logic
    toast({
      title: '✅ Réservation confirmée !',
      description: `${service?.name} le ${selectedDate.toLocaleDateString()}`,
    });
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
                      dangerouslySetInnerHTML={{ __html: service.description }}
                    />
                  </CardContent>
                </Card>
              )}

              {/* Staff */}
              {service?.staff && service.staff.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Notre équipe</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {service.staff.map((member: any) => (
                      <div key={member.id} className="flex items-start gap-4">
                        <Avatar className="h-12 w-12">
                          <AvatarImage src={member.photo_url} />
                          <AvatarFallback>
                            {member.name?.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <p className="font-semibold">{member.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {member.specialty}
                          </p>
                          {member.bio && (
                            <p className="text-sm mt-1">{member.bio}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
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
                </CardHeader>
                <CardContent className="space-y-6">
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
                    disabled={!selectedDate || !selectedSlot}
                  >
                    {!selectedDate || !selectedSlot
                      ? 'Sélectionnez une date et un créneau'
                      : 'Réserver maintenant'}
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

