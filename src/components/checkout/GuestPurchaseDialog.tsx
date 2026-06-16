import { useState } from 'react';
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

export type GuestCustomerInfo = {
  email: string;
  fullName: string;
  phone?: string;
};

type GuestPurchaseDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  productName: string;
  onConfirm: (info: GuestCustomerInfo) => Promise<void>;
  loading?: boolean;
};

/**
 * Collecte les coordonnées invité avant paiement / commande (sans forcer la création de compte).
 */
export function GuestPurchaseDialog({
  open,
  onOpenChange,
  productName,
  onConfirm,
  loading = false,
}: GuestPurchaseDialogProps) {
  const { user } = useAuth();
  const [email, setEmail] = useState(user?.email ?? '');
  const [fullName, setFullName] = useState(
    (user?.user_metadata?.full_name as string | undefined) ?? ''
  );
  const [phone, setPhone] = useState('');

  const handleSubmit = async () => {
    if (!email.trim()) return;
    await onConfirm({
      email: email.trim(),
      fullName: fullName.trim() || email.trim().split('@')[0],
      phone: phone.trim() || undefined,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Finaliser votre achat</DialogTitle>
          <DialogDescription>
            {productName} — complétez vos informations pour payer ou commander. Vous pourrez créer
            un compte plus tard pour suivre vos achats.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-2">
          <div className="space-y-1">
            <Label htmlFor="guest-email">Email *</Label>
            <Input
              id="guest-email"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              autoComplete="email"
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="guest-name">Nom</Label>
            <Input
              id="guest-name"
              value={fullName}
              onChange={e => setFullName(e.target.value)}
              autoComplete="name"
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="guest-phone">Téléphone</Label>
            <Input
              id="guest-phone"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              autoComplete="tel"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Annuler
          </Button>
          <Button onClick={handleSubmit} disabled={loading || !email.trim()}>
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Redirection…
              </>
            ) : (
              'Continuer vers le paiement'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
