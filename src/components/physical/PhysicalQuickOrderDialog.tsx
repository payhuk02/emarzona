import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useCreatePhysicalOrder } from '@/hooks/orders/useCreatePhysicalOrder';
import { notifyPhysicalOrderPlaced } from '@/lib/notifications/physical-order-notification';
import { parsePhysicalCheckoutOptions } from '@/lib/physical/physical-checkout-display';
import type { PhysicalCheckoutMethod } from '@/constants/physical-checkout-options';
import { safeRedirect } from '@/lib/url-validator';
import { buildGuestOrderConfirmationPath } from '@/lib/physical/guest-order-confirmation';

export type PhysicalQuickOrderProduct = {
  productId: string;
  physicalProductId?: string;
  storeId: string;
  name: string;
  price: number;
  currency: string;
  quantity?: number;
  variantId?: string;
  payment_options?: unknown;
};

type PhysicalQuickOrderDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: PhysicalQuickOrderProduct;
};

export function PhysicalQuickOrderDialog({
  open,
  onOpenChange,
  product,
}: PhysicalQuickOrderDialogProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { mutateAsync: createOrder, isPending } = useCreatePhysicalOrder();

  const checkout = parsePhysicalCheckoutOptions(
    product.payment_options as Parameters<typeof parsePhysicalCheckoutOptions>[0]
  );
  const isCod = checkout.checkout_method === 'cash_on_delivery';

  const [fullName, setFullName] = useState(user?.user_metadata?.full_name ?? '');
  const [email, setEmail] = useState(user?.email ?? '');
  const [phone, setPhone] = useState('');
  const [street, setStreet] = useState('');
  const [city, setCity] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [country, setCountry] = useState('BF');

  const handleConfirm = async () => {
    if (!email.trim() || !fullName.trim() || !street.trim() || !city.trim()) {
      toast({
        title: 'Informations incomplètes',
        description: 'Renseignez au minimum nom, email et adresse de livraison.',
        variant: 'destructive',
      });
      return;
    }

    try {
      const result = await createOrder({
        productId: product.productId,
        physicalProductId: product.physicalProductId ?? '',
        storeId: product.storeId,
        customerEmail: email.trim(),
        customerName: fullName.trim(),
        customerPhone: phone.trim() || undefined,
        quantity: product.quantity ?? 1,
        variantId: product.variantId,
        checkoutMethod: checkout.checkout_method as PhysicalCheckoutMethod,
        guestCheckout: !user,
        shippingAddress: {
          street: street.trim(),
          city: city.trim(),
          postal_code: postalCode.trim() || '—',
          country: country.trim() || 'BF',
        },
      });

      await notifyPhysicalOrderPlaced({
        customerEmail: email.trim(),
        customerUserId: user?.id ?? null,
        productName: product.name,
        orderNumber: result.orderNumber ?? result.orderId.slice(0, 8),
        orderId: result.orderId,
        quantity: product.quantity ?? 1,
        totalAmount: product.price * (product.quantity ?? 1),
        currency: product.currency,
        checkoutMethod: checkout.checkout_method,
        customerName: fullName.trim(),
        customerPhone: phone.trim() || undefined,
        shippingSummary: `${street.trim()}, ${city.trim()}`,
      });

      onOpenChange(false);

      if (result.cashOnDelivery || !result.checkoutUrl) {
        toast({
          title: 'Commande confirmée',
          description: `Votre commande « ${product.name} » est enregistrée. Paiement à la livraison.`,
        });
        const orderNumber = result.orderNumber ?? result.orderId.slice(0, 8);
        if (user) {
          navigate('/account/orders', { replace: true });
        } else {
          navigate(
            buildGuestOrderConfirmationPath({
              orderId: result.orderId,
              orderNumber,
              productName: product.name,
              cashOnDelivery: true,
            }),
            { replace: true }
          );
        }
        return;
      }

      toast({
        title: 'Commande créée',
        description: 'Redirection vers le paiement sécurisé…',
      });
      safeRedirect(result.checkoutUrl, () => {
        navigate('/account/orders');
      });
    } catch (e: unknown) {
      toast({
        title: 'Erreur',
        description: e instanceof Error ? e.message : 'Impossible de confirmer la commande',
        variant: 'destructive',
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Confirmer la commande</DialogTitle>
          <DialogDescription>
            {product.name} —{' '}
            {isCod
              ? 'Paiement à la livraison. Aucun paiement en ligne requis.'
              : 'Paiement en ligne après confirmation.'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-2">
          <div className="space-y-1">
            <Label htmlFor="qo-name">Nom complet *</Label>
            <Input
              id="qo-name"
              value={fullName}
              onChange={e => setFullName(e.target.value)}
              autoComplete="name"
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="qo-email">Email *</Label>
            <Input
              id="qo-email"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              autoComplete="email"
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="qo-phone">Téléphone</Label>
            <Input
              id="qo-phone"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              autoComplete="tel"
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="qo-street">Adresse *</Label>
            <Input id="qo-street" value={street} onChange={e => setStreet(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label htmlFor="qo-city">Ville *</Label>
              <Input id="qo-city" value={city} onChange={e => setCity(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="qo-postal">Code postal</Label>
              <Input
                id="qo-postal"
                value={postalCode}
                onChange={e => setPostalCode(e.target.value)}
              />
            </div>
          </div>
          <div className="space-y-1">
            <Label htmlFor="qo-country">Pays</Label>
            <Input id="qo-country" value={country} onChange={e => setCountry(e.target.value)} />
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
            Annuler
          </Button>
          <Button onClick={handleConfirm} disabled={isPending}>
            {isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Traitement…
              </>
            ) : (
              'Confirmer la commande'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
