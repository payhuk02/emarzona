import { describe, expect, it } from 'vitest';
import {
  buildServiceAddonCartMetadata,
  isServiceAddonCartItem,
} from '@/lib/cart/service-cart-policy';
import {
  addonEffectivePrice,
  validateServiceAddonProductType,
  validateServiceAddonSelection,
  type ServiceProductAddonWithProduct,
} from '@/lib/service/service-product-addons';

function addonRow(
  productId: string,
  name: string,
  isRequired: boolean
): ServiceProductAddonWithProduct {
  return {
    id: `row-${productId}`,
    service_product_id: 'svc-1',
    addon_product_id: productId,
    store_id: 'store-1',
    quantity: 1,
    is_required: isRequired,
    display_order: 0,
    addon: {
      id: productId,
      name,
      slug: null,
      product_type: 'digital',
      price: 1000,
      promotional_price: null,
      currency: 'XOF',
      image_url: null,
      is_active: true,
    },
  };
}

describe('service-product-addons', () => {
  it('accepts digital and physical addon types', () => {
    expect(validateServiceAddonProductType('digital')).toBe(true);
    expect(validateServiceAddonProductType('physical')).toBe(true);
    expect(validateServiceAddonProductType('service')).toBe(false);
  });

  it('requires mandatory addons in selection', () => {
    const addons = [addonRow('p1', 'Kit', true), addonRow('p2', 'Option', false)];
    expect(validateServiceAddonSelection(addons, ['p1']).ok).toBe(true);
    expect(validateServiceAddonSelection(addons, ['p2']).ok).toBe(false);
  });

  it('computes effective addon price', () => {
    expect(addonEffectivePrice({ price: 5000, promotional_price: 4000 } as never)).toBe(4000);
    expect(addonEffectivePrice({ price: 5000, promotional_price: null } as never)).toBe(5000);
  });
});

describe('service-addon cart metadata', () => {
  it('builds linked booking metadata', () => {
    expect(
      buildServiceAddonCartMetadata({
        storeId: 'store-1',
        linkedBookingId: 'bk-1',
        linkedServiceProductId: 'svc-1',
        addonProductId: 'prod-addon',
        quantity: 2,
      })
    ).toMatchObject({
      store_id: 'store-1',
      linked_booking_id: 'bk-1',
      is_service_addon: true,
      addon_quantity: 2,
    });
  });

  it('detects service addon cart lines', () => {
    expect(isServiceAddonCartItem({ is_service_addon: true, linked_booking_id: 'bk-1' })).toBe(
      true
    );
    expect(isServiceAddonCartItem({ store_id: 'store-1' })).toBe(false);
  });
});
