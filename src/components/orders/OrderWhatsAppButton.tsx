import { useCallback, useState } from 'react';
import { Loader2, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useToast } from '@/hooks/use-toast';
import { useStore } from '@/hooks/useStore';
import { supabase } from '@/integrations/supabase/client';
import type { Order } from '@/hooks/useOrders';
import {
  buildOrderWhatsAppMessage,
  resolveOrderCustomerPhone,
  type OrderWhatsAppItem,
} from '@/lib/orders/order-whatsapp';
import { buildWhatsAppClickUrl } from '@/lib/whatsapp/whatsapp-url';
import { cn } from '@/lib/utils';

const ORDER_ITEM_FIELDS = 'product_name, quantity, unit_price, total_price';

type OrderWhatsAppButtonProps = {
  order: Order;
  className?: string;
  variant?: 'outline' | 'ghost' | 'default';
  size?: 'default' | 'sm' | 'icon' | 'lg';
  showLabel?: boolean;
};

export function OrderWhatsAppButton({
  order,
  className,
  variant = 'outline',
  size = 'icon',
  showLabel = false,
}: OrderWhatsAppButtonProps) {
  const { toast } = useToast();
  const { store } = useStore();
  const [loading, setLoading] = useState(false);
  const phone = resolveOrderCustomerPhone(order);

  const fetchOrderItems = useCallback(async (): Promise<OrderWhatsAppItem[]> => {
    if (order.order_items?.length) {
      return order.order_items;
    }

    const { data, error } = await supabase
      .from('order_items')
      .select(ORDER_ITEM_FIELDS)
      .eq('order_id', order.id);

    if (error) throw error;
    return (data || []) as OrderWhatsAppItem[];
  }, [order]);

  const handleClick = useCallback(async () => {
    if (!phone) {
      toast({
        title: 'Numéro indisponible',
        description: 'Aucun numéro de téléphone client n’est renseigné pour cette commande.',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      const items = await fetchOrderItems();
      const message = buildOrderWhatsAppMessage(order, items, {
        storeName: store?.name,
      });
      const href = buildWhatsAppClickUrl('https://wa.me', phone, message);

      if (!href) {
        toast({
          title: 'Numéro invalide',
          description: 'Le numéro de téléphone du client n’est pas valide pour WhatsApp.',
          variant: 'destructive',
        });
        return;
      }

      window.open(href, '_blank', 'noopener,noreferrer');
    } catch (error: unknown) {
      toast({
        title: 'Erreur',
        description:
          error instanceof Error ? error.message : 'Impossible de préparer le message WhatsApp.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [fetchOrderItems, order, phone, store?.name, toast]);

  const tooltipLabel = phone
    ? 'Relancer le client sur WhatsApp'
    : 'Numéro de téléphone non renseigné';

  return (
    <TooltipProvider delayDuration={300}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            type="button"
            variant={variant}
            size={size}
            onClick={handleClick}
            disabled={loading || !phone}
            aria-label={tooltipLabel}
            className={cn(
              'text-green-600 hover:text-green-700 hover:bg-green-50 dark:hover:bg-green-950/30',
              showLabel && 'min-h-[44px]',
              className
            )}
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            ) : (
              <MessageCircle className={cn('h-4 w-4', showLabel && 'mr-2')} aria-hidden />
            )}
            {showLabel && <span className="text-sm">WhatsApp</span>}
          </Button>
        </TooltipTrigger>
        <TooltipContent side="top">{tooltipLabel}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
