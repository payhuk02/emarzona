/**
 * Hook pour créer des commandes de services
 * Date: 28 octobre 2025
 * 
 * Workflow complet:
 * 1. Créer/récupérer customer
 * 2. Vérifier disponibilité créneau
 * 3. Créer booking (réservation)
 * 4. Créer order + order_item
 * 5. Initier paiement Moneroo
 * 6. Confirmer booking si paiement réussi (via webhook)
 */

import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { initiateMonerooPayment } from '@/lib/moneroo-payment';
import { useToast } from '@/hooks/use-toast';

/**
 * Options pour créer une commande service
 */
export interface CreateServiceOrderOptions {
  /** ID du service product */
  serviceProductId: string;
  
  /** ID du produit de base (pour price, etc.) */
  productId: string;
  
  /** ID du store */
  storeId: string;
  
  /** Email du client */
  customerEmail: string;
  
  /** Nom du client (optionnel) */
  customerName?: string;
  
  /** Téléphone du client (optionnel) */
  customerPhone?: string;
  
  /** Date et heure de réservation */
  bookingDateTime: string; // ISO 8601
  
  /** Durée en minutes (optionnel, sinon prend celle du service) */
  durationMinutes?: number;
  
  /** ID du staff member (optionnel) */
  staffId?: string;
  
  /** Nombre de participants */
  numberOfParticipants?: number;
  
  /** Notes de réservation */
  notes?: string;
}

/**
 * Résultat de la création de commande
 */
export interface CreateServiceOrderResult {
  /** ID de la commande créée */
  orderId: string;
  
  /** ID de l'order_item */
  orderItemId: string;
  
  /** ID de la réservation */
  bookingId: string;
  
  /** URL de checkout Moneroo */
  checkoutUrl: string;
  
  /** ID de transaction Moneroo */
  transactionId: string;
}

/**
 * Hook pour créer une commande de service
 * 
 * @example
 * ```typescript
 * const { mutateAsync: createServiceOrder, isPending } = useCreateServiceOrder();
 * 
 * const handleBook = async () => {
 *   const result = await createServiceOrder({
 *     serviceProductId: 'xxx',
 *     productId: 'yyy',
 *     storeId: 'zzz',
 *     customerEmail: 'user@example.com',
 *     bookingDateTime: '2025-11-01T10:00:00Z',
 *     numberOfParticipants: 2,
 *     notes: 'Consultation urgente',
 *   });
 *   
 *   // Rediriger vers Moneroo
 *   window.location.href = result.checkoutUrl;
 * };
 * ```
 */
export const useCreateServiceOrder = () => {
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (options: CreateServiceOrderOptions): Promise<CreateServiceOrderResult> => {
      const {
        serviceProductId,
        productId,
        storeId,
        customerEmail,
        customerName,
        customerPhone,
        bookingDateTime,
        durationMinutes,
        staffId,
        numberOfParticipants = 1,
        notes,
      } = options;

      // 1. Récupérer les détails du produit
      const { data: product, error: productError } = await supabase
        .from('products')
        .select('*')
        .eq('id', productId)
        .single();

      if (productError || !product) {
        throw new Error('Produit non trouvé');
      }

      // 2. Récupérer les détails du service
      const { data: serviceProduct, error: serviceError } = await supabase
        .from('service_products')
        .select('*')
        .eq('id', serviceProductId)
        .single();

      if (serviceError || !serviceProduct) {
        throw new Error('Service non trouvé');
      }

      // 3. Vérifier capacité max participants
      if (serviceProduct.max_participants && numberOfParticipants > serviceProduct.max_participants) {
        throw new Error(`Nombre maximum de participants: ${serviceProduct.max_participants}`);
      }

      // 4. Vérifier la disponibilité du staff si requis et spécifié
      if (staffId) {
        const { data: staff, error: staffError } = await supabase
          .from('service_staff_members')
          .select('*')
          .eq('id', staffId)
          .eq('service_id', productId)
          .eq('is_active', true)
          .single();

        if (staffError || !staff) {
          throw new Error('Personnel non disponible');
        }

        // TODO: Vérifier si le staff est déjà réservé pour ce créneau
        // Cela nécessiterait une fonction pour vérifier les conflits de réservation
      }

      // 5. Récupérer ou créer le customer
      let customerId: string;
      
      const { data: existingCustomer } = await supabase
        .from('customers')
        .select('id')
        .eq('store_id', storeId)
        .eq('email', customerEmail)
        .single();

      if (existingCustomer) {
        customerId = existingCustomer.id;
      } else {
        const { data: newCustomer, error: customerError } = await supabase
          .from('customers')
          .insert({
            store_id: storeId,
            email: customerEmail,
            name: customerName || customerEmail.split('@')[0],
            phone: customerPhone,
          })
          .select('id')
          .single();

        if (customerError || !newCustomer) {
          throw new Error('Erreur lors de la création du client');
        }

        customerId = newCustomer.id;
      }

      // 6. Créer le booking (réservation)
      const actualDuration = durationMinutes || serviceProduct.duration_minutes;
      const endDateTime = new Date(new Date(bookingDateTime).getTime() + actualDuration * 60000).toISOString();

      const { data: booking, error: bookingError } = await supabase
        .from('service_bookings')
        .insert({
          service_id: productId,
          customer_id: customerId,
          staff_id: staffId,
          start_time: bookingDateTime,
          end_time: endDateTime,
          duration_minutes: actualDuration,
          status: 'pending', // Sera confirmé après paiement
          number_of_participants: numberOfParticipants,
          customer_notes: notes,
        })
        .select('id')
        .single();

      if (bookingError || !booking) {
        throw new Error('Erreur lors de la création de la réservation');
      }

      // 7. Calculer le prix (peut dépendre du nombre de participants ou de la durée)
      let totalPrice = product.promotional_price || product.price;
      
      // Si pricing_type est 'per_participant', multiplier par le nombre de participants
      if (serviceProduct.pricing_type === 'per_participant') {
        totalPrice *= numberOfParticipants;
      }
      
      // Si pricing_type est 'per_hour', calculer selon la durée
      if (serviceProduct.pricing_type === 'per_hour') {
        const hours = actualDuration / 60;
        totalPrice *= hours;
      }

      // 8. Générer un numéro de commande
      const { data: orderNumberData } = await supabase.rpc('generate_order_number');
      const orderNumber = orderNumberData || `ORD-${Date.now()}`;

      // 9. Créer la commande
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          store_id: storeId,
          customer_id: customerId,
          order_number: orderNumber,
          total_amount: totalPrice,
          currency: product.currency,
          payment_status: 'pending',
          status: 'pending',
        })
        .select('id')
        .single();

      if (orderError || !order) {
        // Annuler le booking en cas d'erreur
        await supabase
          .from('service_bookings')
          .update({ status: 'cancelled' })
          .eq('id', booking.id);
          
        throw new Error('Erreur lors de la création de la commande');
      }

      // 10. Créer l'order_item avec les références spécialisées
      const { data: orderItem, error: orderItemError } = await supabase
        .from('order_items')
        .insert({
          order_id: order.id,
          product_id: productId,
          product_type: 'service',
          service_product_id: serviceProductId,
          booking_id: booking.id,
          product_name: product.name,
          quantity: 1,
          unit_price: totalPrice,
          total_price: totalPrice,
          item_metadata: {
            booking_date: bookingDateTime,
            duration_minutes: actualDuration,
            number_of_participants: numberOfParticipants,
            staff_id: staffId,
            notes,
          },
        })
        .select('id')
        .single();

      if (orderItemError || !orderItem) {
        // Annuler le booking
        await supabase
          .from('service_bookings')
          .update({ status: 'cancelled' })
          .eq('id', booking.id);
          
        throw new Error('Erreur lors de la création de l\'élément de commande');
      }

      // 11. Initier le paiement Moneroo
      const bookingDate = new Date(bookingDateTime).toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });

      const paymentResult = await initiateMonerooPayment({
        storeId,
        productId,
        orderId: order.id,
        customerId,
        amount: totalPrice,
        currency: product.currency,
        description: `Réservation: ${product.name} - ${bookingDate}`,
        customerEmail,
        customerName: customerName || customerEmail.split('@')[0],
        customerPhone,
        metadata: {
          product_type: 'service',
          service_product_id: serviceProductId,
          booking_id: booking.id,
          booking_date: bookingDateTime,
          duration_minutes: actualDuration,
          number_of_participants: numberOfParticipants,
          order_item_id: orderItem.id,
        },
      });

      if (!paymentResult.success || !paymentResult.checkout_url) {
        // Annuler le booking
        await supabase
          .from('service_bookings')
          .update({ status: 'cancelled' })
          .eq('id', booking.id);
          
        throw new Error('Erreur lors de l\'initialisation du paiement');
      }

      // 12. Retourner le résultat
      return {
        orderId: order.id,
        orderItemId: orderItem.id,
        bookingId: booking.id,
        checkoutUrl: paymentResult.checkout_url,
        transactionId: paymentResult.transaction_id,
      };
    },

    onSuccess: (data) => {
      toast({
        title: '✅ Réservation créée',
        description: 'Créneau réservé. Redirection vers le paiement...',
      });
    },

    onError: (error: Error) => {
      console.error('Service order creation error:', error);
      toast({
        title: '❌ Erreur',
        description: error.message || 'Impossible de créer la réservation',
        variant: 'destructive',
      });
    },
  });
};

/**
 * Hook pour vérifier la disponibilité d'un créneau
 */
export const useCheckTimeSlotAvailability = () => {
  return useMutation({
    mutationFn: async ({
      serviceProductId,
      startTime,
      durationMinutes,
      staffId,
    }: {
      serviceProductId: string;
      startTime: string;
      durationMinutes: number;
      staffId?: string;
    }): Promise<{ available: boolean; conflictingBookings: number }> => {
      const endTime = new Date(new Date(startTime).getTime() + durationMinutes * 60000).toISOString();

      // Chercher les bookings qui se chevauchent
      let query = supabase
        .from('service_bookings')
        .select('id, start_time, end_time')
        .eq('service_id', serviceProductId)
        .in('status', ['pending', 'confirmed', 'in_progress'])
        .or(`start_time.gte.${startTime},end_time.lte.${endTime}`);

      if (staffId) {
        query = query.eq('staff_id', staffId);
      }

      const { data, error } = await query;

      if (error) {
        throw error;
      }

      // Vérifier les conflits réels (chevauchement de temps)
      const conflicts = data?.filter(booking => {
        const bookingStart = new Date(booking.start_time).getTime();
        const bookingEnd = new Date(booking.end_time).getTime();
        const requestStart = new Date(startTime).getTime();
        const requestEnd = new Date(endTime).getTime();

        // Il y a conflit si les périodes se chevauchent
        return (requestStart < bookingEnd && requestEnd > bookingStart);
      }) || [];

      return {
        available: conflicts.length === 0,
        conflictingBookings: conflicts.length,
      };
    },
  });
};

