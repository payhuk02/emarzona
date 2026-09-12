import { useRef } from 'react';
import { Megaphone, Sparkles } from 'lucide-react';
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

export type SponsorAfterPublishDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  productId: string;
  productName?: string;
  /** Called when the seller skips sponsorship (Plus tard / fermeture). */
  onSkip?: () => void;
};

/**
 * Invite le vendeur à sponsoriser un produit juste après publication.
 * Tarifs : 500 FCFA / semaine · 1000 FCFA / mois.
 */
export function SponsorAfterPublishDialog({
  open,
  onOpenChange,
  productId,
  productName,
  onSkip,
}: SponsorAfterPublishDialogProps) {
  const navigate = useNavigate();
  const outcomeRef = useRef<'sponsor' | 'skip' | null>(null);

  const finishSkip = () => {
    if (outcomeRef.current) return;
    outcomeRef.current = 'skip';
    onOpenChange(false);
    onSkip?.();
  };

  const handleSponsor = () => {
    if (outcomeRef.current) return;
    outcomeRef.current = 'sponsor';
    onOpenChange(false);
    navigate(`/dashboard/sponsorships?productId=${encodeURIComponent(productId)}`, {
      replace: true,
    });
  };

  return (
    <Dialog
      open={open}
      onOpenChange={next => {
        if (next) {
          outcomeRef.current = null;
          onOpenChange(true);
          return;
        }
        if (outcomeRef.current === 'sponsor') {
          onOpenChange(false);
          return;
        }
        finishSkip();
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
            <Megaphone className="h-6 w-6 text-primary" />
          </div>
          <DialogTitle>Sponsoriser votre produit ?</DialogTitle>
          <DialogDescription className="space-y-2 text-left">
            <span className="block">
              {productName
                ? `« ${productName} » est en ligne. Boostez-le avec Boost Emarzona (Marketplace + Recommandations IA).`
                : 'Votre produit est en ligne. Boostez-le avec Boost Emarzona (Marketplace + Recommandations IA).'}
            </span>
            <span className="flex items-start gap-2 text-foreground">
              <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              <span>
                <strong>500 FCFA</strong> pour 7 jours · <strong>1000 FCFA</strong> pour 30 jours
              </span>
            </span>
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex-col gap-2 sm:flex-row sm:justify-end">
          <Button type="button" variant="outline" onClick={finishSkip}>
            Plus tard
          </Button>
          <Button type="button" onClick={handleSponsor}>
            Sponsoriser maintenant
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
