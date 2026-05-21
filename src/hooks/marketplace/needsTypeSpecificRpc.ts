import { FilterState } from '@/types/marketplace';

/**
 * Filtres contextuels non couverts par get_marketplace_products_filtered —
 * nécessitent les RPC filter_*_products dédiées.
 */
export function needsTypeSpecificRpc(filters: FilterState): boolean {
  if (filters.productType === 'all') return false;

  switch (filters.productType) {
    case 'digital':
      return (
        !!(filters.digitalSubType && filters.digitalSubType !== 'all') || !!filters.instantDelivery
      );
    case 'physical':
      return (
        !!(filters.stockAvailability && filters.stockAvailability !== 'all') ||
        !!(filters.shippingType && filters.shippingType !== 'all')
      );
    case 'service':
      return (
        !!filters.serviceType ||
        !!(filters.locationType && filters.locationType !== 'all') ||
        !!filters.calendarAvailable
      );
    case 'course':
      return (
        !!(filters.difficulty && filters.difficulty !== 'all') ||
        !!(filters.accessType && filters.accessType !== 'all') ||
        !!(filters.courseDuration && filters.courseDuration !== 'all')
      );
    case 'artist':
      return (
        !!filters.artistType ||
        !!(filters.editionType && filters.editionType !== 'all') ||
        !!filters.certificateOfAuthenticity ||
        !!(filters.artworkAvailability && filters.artworkAvailability !== 'all')
      );
    default:
      return false;
  }
}
