import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import type { Order } from '@/hooks/useOrders';

export interface OrderWhatsAppItem {
  product_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

const PAYMENT_STATUS_LABELS: Record<string, string> = {
  pending: 'En attente',
  paid: 'Payée',
  failed: 'Échouée',
  cod_pending: 'Paiement à la livraison',
  partially_refunded: 'Partiellement remboursée',
  completed: 'Terminé',
};

export function resolveOrderCustomerPhone(order: Order): string | null {
  const phone = order.customers?.phone?.trim() || order.shipping_address?.phone?.trim();
  return phone || null;
}

export function resolveOrderCustomerName(order: Order): string {
  return order.customers?.name?.trim() || order.shipping_address?.full_name?.trim() || 'Client';
}

function formatAmount(amount: number): string {
  return amount.toLocaleString('fr-FR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function buildOrderWhatsAppMessage(
  order: Order,
  items: OrderWhatsAppItem[],
  options?: { storeName?: string }
): string {
  const customerName = resolveOrderCustomerName(order);
  const orderDate = format(new Date(order.created_at), 'dd MMMM yyyy', { locale: fr });
  const paymentLabel = PAYMENT_STATUS_LABELS[order.payment_status] || order.payment_status;

  const lines: string[] = [
    `Bonjour ${customerName},`,
    '',
    `Nous vous contactons concernant votre commande *${order.order_number}* passée le ${orderDate}.`,
    '',
  ];

  if (items.length > 0) {
    lines.push('*Produit(s) commandé(s) :*');
    for (const item of items) {
      lines.push(
        `• ${item.product_name} (x${item.quantity}) — ${formatAmount(item.total_price)} ${order.currency}`
      );
    }
    lines.push('');
  }

  lines.push(`*Montant total :* ${formatAmount(order.total_amount)} ${order.currency}`);
  lines.push(`*Statut du paiement :* ${paymentLabel}`);

  if (order.payment_status === 'pending' || order.payment_status === 'failed') {
    lines.push('');
    lines.push(
      'Si vous rencontrez des difficultés pour finaliser votre paiement, nous sommes disponibles pour vous aider.'
    );
  }

  lines.push('');
  lines.push('Cordialement,');
  if (options?.storeName?.trim()) {
    lines.push(options.storeName.trim());
  }

  return lines.join('\n');
}
