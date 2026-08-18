import type { SupabaseClient } from '@supabase/supabase-js';
import {
  buildCustomerWhatsAppLink,
  formatShippingAddress,
} from './physical-order-email-utils.ts';

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

  const shippingAddress = formatShippingAddress(order, item);

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
    currency: String(order.currency ?? 'XOF'),
    payment_status: order.payment_status ?? 'pending',
    shipping_address: shippingAddress || '—',
    dashboard_link: dashboardUrl,
    whatsapp_customer_link: whatsappCustomerLink ?? '',
    ...buildPhysicalPaymentEmailVariables(order),
  };
}

export function buildPhysicalPaymentEmailVariables(order: Record<string, unknown>): Record<string, string> {
  const currency = String(order.currency ?? 'XOF');
  const metadata =
    order.metadata && typeof order.metadata === 'object' && !Array.isArray(order.metadata)
      ? (order.metadata as Record<string, unknown>)
      : {};
  const checkoutMethod = String(metadata.checkout_method ?? '');
  const status = String(order.payment_status ?? '');
  const isGuarantee = checkoutMethod === 'guarantee' || status === 'deposit_paid';
  const amountPaid = isGuarantee
    ? Number(order.percentage_paid) || 0
    : status === 'cod_pending'
      ? 0
      : Number(order.total_amount) || 0;
  const remainingOnDelivery = isGuarantee
    ? Number(order.remaining_amount) || 0
    : status === 'cod_pending'
      ? Number(order.total_amount) || 0
      : 0;
  const notice = isGuarantee
    ? 'Vous avez payé la garantie en ligne. Le solde est dû à la livraison de votre produit.'
    : status === 'cod_pending'
      ? 'Aucun paiement en ligne. Vous réglez le montant total à la livraison.'
      : '';

  return {
    order_total: formatMoneyLabel(order.total_amount, currency),
    amount_paid: amountPaid > 0 ? formatMoneyLabel(amountPaid, currency) : '',
    remaining_on_delivery:
      remainingOnDelivery > 0 ? formatMoneyLabel(remainingOnDelivery, currency) : '',
    payment_status_label: formatPaymentStatusLabel(status),
    payment_breakdown_html: buildPaymentBreakdownHtml({
      orderTotal: formatMoneyLabel(order.total_amount, currency),
      amountPaid: amountPaid > 0 ? formatMoneyLabel(amountPaid, currency) : '',
      remainingOnDelivery:
        remainingOnDelivery > 0 ? formatMoneyLabel(remainingOnDelivery, currency) : '',
      notice,
    }),
  };
}

export function formatMoneyLabel(amount: unknown, currency = 'XOF'): string {
  const n = Number(amount);
  const safe = Number.isFinite(n) ? n : 0;
  return `${safe.toLocaleString('fr-FR')} ${currency}`;
}

export function formatPaymentStatusLabel(status: string): string {
  switch (status) {
    case 'paid':
    case 'completed':
      return 'Payée';
    case 'cod_pending':
      return 'Paiement à la livraison';
    case 'deposit_paid':
      return 'Garantie payée, solde à la livraison';
    case 'pending':
      return 'En attente';
    case 'failed':
      return 'Échouée';
    default:
      return status;
  }
}

export function buildPaymentBreakdownHtml(input: {
  orderTotal: string;
  amountPaid: string;
  remainingOnDelivery: string;
  notice: string;
}): string {
  const row = (label: string, value: string) =>
    `<tr><td style="color:#64748b;font-size:13px;padding:10px 14px;border-bottom:1px solid #eef2f7">${label}</td><td style="color:#0f172a;font-weight:600;text-align:right;padding:10px 14px;border-bottom:1px solid #eef2f7">${value}</td></tr>`;

  let html = row('Total commande', input.orderTotal);
  if (input.amountPaid) html += row('Montant payé en ligne', input.amountPaid);
  if (input.remainingOnDelivery) html += row('Reste à payer à la livraison', input.remainingOnDelivery);
  if (input.notice) {
    html += `<tr><td colspan="2" style="color:#047857;font-size:13px;padding:12px 14px">${input.notice}</td></tr>`;
  }
  return html;
}
