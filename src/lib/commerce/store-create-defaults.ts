import type { StoreCommerceType } from '@/constants/store-commerce-types';
import { applyThemeTemplate, getThemeTemplateById } from '@/lib/store-theme-templates';
import { getStoreVerticalProfile } from '@/lib/commerce/store-vertical-config';

const SERVICE_DEFAULTS = {
  timezone: 'Africa/Ouagadougou',
  opening_hours: {
    monday: { open: '09:00', close: '18:00', closed: false },
    tuesday: { open: '09:00', close: '18:00', closed: false },
    wednesday: { open: '09:00', close: '18:00', closed: false },
    thursday: { open: '09:00', close: '18:00', closed: false },
    friday: { open: '09:00', close: '18:00', closed: false },
    saturday: { open: '09:00', close: '14:00', closed: false },
    sunday: { open: '09:00', close: '18:00', closed: true },
    timezone: 'Africa/Ouagadougou',
    special_hours: [],
  },
};

/**
 * Defaults applied when creating a new store, based on commerce vertical.
 * Includes recommended theme template colors/layout.
 */
export function buildStoreCreateDefaults(commerceType: StoreCommerceType): Record<string, unknown> {
  const profile = getStoreVerticalProfile(commerceType);
  const template = getThemeTemplateById(profile.defaultThemeTemplateId);
  const themeDefaults = template ? applyThemeTemplate(template) : {};

  const base: Record<string, unknown> = {
    default_currency: 'XOF',
    timezone: 'Africa/Ouagadougou',
    ...themeDefaults,
  };

  switch (commerceType) {
    case 'digital':
    case 'course':
      return {
        ...base,
        product_grid_columns: 3,
        product_card_style: 'detailed',
        navigation_style: 'horizontal',
      };
    case 'service':
      return {
        ...base,
        ...SERVICE_DEFAULTS,
        product_grid_columns: 2,
        product_card_style: 'standard',
      };
    case 'artist':
      return {
        ...base,
        product_grid_columns: 2,
        product_card_style: 'detailed',
        header_style: 'extended',
      };
    case 'physical':
    default:
      return {
        ...base,
        product_grid_columns: 3,
        product_card_style: 'standard',
        free_shipping_threshold: null,
      };
  }
}
