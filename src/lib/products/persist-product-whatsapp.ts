import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';
import { isValidWhatsAppDigits, normalizeWhatsAppDigits } from '@/lib/whatsapp/whatsapp-url';

export async function persistProductWhatsApp(
  productId: string,
  whatsappNumber?: string | null,
  whatsappEnabled?: boolean | null
): Promise<void> {
  const digits = whatsappNumber ? normalizeWhatsAppDigits(whatsappNumber) : '';
  const enabled = Boolean(whatsappEnabled && isValidWhatsAppDigits(digits));

  const { error } = await supabase
    .from('products')
    .update({
      whatsapp_number: enabled ? digits : null,
      whatsapp_enabled: enabled,
    })
    .eq('id', productId);

  if (error) {
    logger.warn('Impossible d’enregistrer le numéro WhatsApp du produit', {
      productId,
      error: error.message,
    });
  }
}
