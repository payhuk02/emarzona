/**
 * Webhook product.updated (fire-and-forget, même pattern que ProductForm / create wizards).
 */
import { logger } from '@/lib/logger';

export function triggerProductUpdatedWebhook(
  storeId: string,
  payload: {
    product_id: string;
    name?: string | null;
    product_type?: string | null;
    price?: number | null;
    currency?: string | null;
  }
): void {
  import('@/lib/webhooks/webhook-system')
    .then(({ triggerWebhook }) =>
      triggerWebhook(storeId, 'product.updated', {
        product_id: payload.product_id,
        name: payload.name,
        product_type: payload.product_type,
        price: payload.price,
        currency: payload.currency,
        updated_at: new Date().toISOString(),
      })
    )
    .catch(err => {
      logger.error('Error triggering product.updated webhook', {
        error: err,
        productId: payload.product_id,
      });
    });
}
