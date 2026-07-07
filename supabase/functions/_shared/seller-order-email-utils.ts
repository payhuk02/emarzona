import type { SupabaseClient } from '@supabase/supabase-js';
import { buildCustomerWhatsAppLink } from './physical-order-email-utils.ts';

export async function buildSellerOrderEmailVariables(
  supabase: SupabaseClient,
  options: {
    order: Record<string, unknown>;
    item: Record<string, unknown>;
    storeName: string;
    siteUrl: string;
  }
): Promise<Record<string, unknown>> {
  const order = options.order;
  const item = options.item;
  const customerId = order.customer_id as string | null | undefined;

  let customerName = 'Client';
  let customerEmail = '';
  let customerPhone: string | null = null;

  if (customerId) {
    const { data: customer } = await supabase
      .from('customers')
      .select('email, full_name, name, phone')
      .eq('id', customerId)
      .maybeSingle();
    if (customer) {
      customerEmail = customer.email ?? '';
      customerName = customer.full_name ?? customer.name ?? customerName;
      customerPhone = customer.phone ?? null;
    }
  }

  if (!customerEmail && typeof order.customer_email === 'string') {
    customerEmail = order.customer_email;
  }

  const itemMeta = (item.item_metadata as Record<string, unknown> | null) ?? {};
  const shipping = itemMeta.shipping_address as Record<string, unknown> | undefined;
  const shippingParts = [
    shipping?.address,
    shipping?.city,
    shipping?.country,
  ].filter((p): p is string => typeof p === 'string' && p.trim().length > 0);

  const { data: config } = await supabase.rpc('get_public_whatsapp_config');
  const clickBase =
    (config as { click_url_base?: string } | null)?.click_url_base ?? 'https://wa.me';

  const orderNumber = String(order.order_number ?? order.id ?? '');
  const whatsappCustomerLink = buildCustomerWhatsAppLink(
    customerPhone,
    clickBase,
    `Bonjour ${customerName}, concernant votre commande ${orderNumber} chez ${options.storeName}.`
  );

  const dashboardUrl = `${options.siteUrl.replace(/\/$/, '')}/dashboard/orders?order=${order.id}`;

  return {
    seller_name: options.storeName,
    store_name: options.storeName,
    order_number: orderNumber,
    order_id: order.id,
    product_name: item.product_name ?? 'Produit',
    customer_name: customerName,
    customer_email: customerEmail,
    customer_phone: customerPhone ?? 'Non renseigné',
    total_amount: order.total_amount,
    currency: order.currency ?? 'XOF',
    payment_status: order.payment_status ?? 'pending',
    shipping_address: shippingParts.length > 0 ? shippingParts.join(', ') : '—',
    dashboard_link: dashboardUrl,
    whatsapp_customer_link: whatsappCustomerLink ?? '',
  };
}
