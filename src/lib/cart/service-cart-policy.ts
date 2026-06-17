/**
 * Politique panier pour les services : réservation obligatoire avant ajout.
 */

export function hasServiceBookingMetadata(metadata?: Record<string, unknown> | null): boolean {
  if (!metadata || typeof metadata !== 'object' || Array.isArray(metadata)) {
    return false;
  }
  return Boolean(
    metadata.booking_id ||
    metadata.service_booking_id ||
    metadata.scheduled_at ||
    metadata.booking_date
  );
}

export function assertCanAddServiceToCart(metadata?: Record<string, unknown> | null): void {
  if (!hasServiceBookingMetadata(metadata)) {
    throw new Error(
      'Les services doivent être réservés (créneau confirmé) avant d’être ajoutés au panier. Réservez depuis la fiche du service.'
    );
  }
}

export function buildServiceCartMetadata(params: {
  storeId: string;
  bookingId: string;
  serviceProductId: string;
  scheduledAt: string;
  staffId?: string;
  numberOfParticipants?: number;
}): Record<string, unknown> {
  return {
    store_id: params.storeId,
    booking_id: params.bookingId,
    service_product_id: params.serviceProductId,
    scheduled_at: params.scheduledAt,
    ...(params.staffId ? { staff_id: params.staffId } : {}),
    ...(params.numberOfParticipants != null
      ? { number_of_participants: params.numberOfParticipants }
      : {}),
  };
}

export function formatServiceCartSlotLabel(
  metadata?: Record<string, unknown> | null
): string | null {
  if (!metadata || typeof metadata !== 'object' || Array.isArray(metadata)) {
    return null;
  }
  const scheduled = metadata.scheduled_at ?? metadata.booking_date;
  if (typeof scheduled !== 'string') return null;
  const date = new Date(scheduled);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleString('fr-FR', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}
