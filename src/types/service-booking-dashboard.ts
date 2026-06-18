/** Type d'affichage réservation pour les dashboards vendeur (schéma service_bookings). */
export interface ServiceBookingListItem {
  id: string;
  status: string;
  scheduled_date?: string;
  scheduled_start_time?: string;
  scheduled_end_time?: string;
  customer_name?: string;
  service_name?: string;
  product_id?: string;
  total_amount?: number;
}

/** @deprecated Utiliser ServiceBookingListItem — ancien schéma bookings/service_id. */
export type Booking = ServiceBookingListItem;
