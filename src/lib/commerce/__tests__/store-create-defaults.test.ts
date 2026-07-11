import { describe, expect, it } from 'vitest';
import { buildStoreCreateDefaults } from '@/lib/commerce/store-create-defaults';
import { getThemeTemplateById } from '@/lib/store-theme-templates';

describe('buildStoreCreateDefaults', () => {
  it('applies default theme colors for each vertical', () => {
    const digital = buildStoreCreateDefaults('digital');
    const darkMode = getThemeTemplateById('dark-mode');
    expect(digital.primary_color).toBe(darkMode?.colors.primary_color);

    const physical = buildStoreCreateDefaults('physical');
    const natureGreen = getThemeTemplateById('nature-green');
    expect(physical.primary_color).toBe(natureGreen?.colors.primary_color);
  });

  it('sets service-specific timezone and opening hours', () => {
    const service = buildStoreCreateDefaults('service');
    expect(service.timezone).toBe('Africa/Ouagadougou');
    expect(service.opening_hours).toBeDefined();
    expect((service.opening_hours as { monday: { open: string } }).monday.open).toBe('09:00');
  });

  it('omits opening hours for digital stores', () => {
    const digital = buildStoreCreateDefaults('digital');
    expect(digital.opening_hours).toBeUndefined();
  });

  it('uses detailed product cards for digital and course', () => {
    expect(buildStoreCreateDefaults('digital').product_card_style).toBe('detailed');
    expect(buildStoreCreateDefaults('course').product_card_style).toBe('detailed');
    expect(buildStoreCreateDefaults('physical').product_card_style).toBe('standard');
  });

  it('uses extended header for artist stores', () => {
    expect(buildStoreCreateDefaults('artist').header_style).toBe('extended');
    expect(buildStoreCreateDefaults('artist').product_grid_columns).toBe(2);
  });
});
