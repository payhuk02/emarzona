/**
 * Composant pour appliquer une carte cadeau dans le checkout
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useValidateGiftCard } from '@/hooks/giftCards/useGiftCards';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Gift, X, Loader2 } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

interface GiftCardInputProps {
  storeId: string;
  onApply: (giftCardId: string, balance: number, code?: string) => void;
  onRemove: () => void;
  appliedGiftCardId?: string | null;
  appliedGiftCardBalance?: number | null;
  appliedGiftCardCode?: string | null;
}

export default function GiftCardInput({
  storeId,
  onApply,
  onRemove,
  appliedGiftCardId,
  appliedGiftCardBalance,
  appliedGiftCardCode
}: GiftCardInputProps) {
  const { toast } = useToast();
  const [code, setCode] = useState('');
  const validateMutation = useValidateGiftCard();

  const handleApply = async () => {
    if (!code.trim()) {
      toast({
        title: 'Code requis',
        description: 'Veuillez entrer un code de carte cadeau',
        variant: 'destructive'
      });
      return;
    }

    try {
      const validation = await validateMutation.mutateAsync({
        storeId,
        code: code.trim()
      });

      if (!validation.is_valid) {
        toast({
          title: 'Carte cadeau invalide',
          description: validation.message,
          variant: 'destructive'
        });
        return;
      }

      if (!validation.gift_card_id || !validation.current_balance) {
        toast({
          title: 'Erreur',
          description: 'Données de carte cadeau incomplètes',
          variant: 'destructive'
        });
        return;
      }

      // Récupérer le code de la carte depuis la base de données
      const { data: giftCardData } = await supabase
        .from('gift_cards')
        .select('code')
        .eq('id', validation.gift_card_id)
        .single();

      onApply(validation.gift_card_id, validation.current_balance, giftCardData?.code || code.trim());
      setCode('');
      
      toast({
        title: 'Carte cadeau appliquée',
        description: `Solde disponible : ${formatCurrency(validation.current_balance)}`,
      });
    } catch (error: any) {
      toast({
        title: 'Erreur',
        description: error.message || 'Impossible de valider la carte cadeau',
        variant: 'destructive'
      });
    }
  };

  const handleRemove = () => {
    onRemove();
    toast({
      title: 'Carte cadeau retirée',
      description: 'La carte cadeau a été retirée de votre commande',
    });
  };

  if (appliedGiftCardId && appliedGiftCardBalance !== null && appliedGiftCardBalance !== undefined) {
    return (
      <div className="space-y-2">
        <Label>Carte cadeau appliquée</Label>
        <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
          <div className="flex items-center gap-2">
            <Gift className="h-4 w-4 text-green-600" />
            <div>
              <div className="font-medium text-sm">
                Code: <code className="font-mono">{appliedGiftCardCode || 'N/A'}</code>
              </div>
              <div className="text-xs text-muted-foreground">
                Solde disponible: {formatCurrency(appliedGiftCardBalance)}
              </div>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRemove}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <Label htmlFor="gift-card-code">Code de carte cadeau</Label>
      <div className="flex gap-2">
        <Input
          id="gift-card-code"
          type="text"
          placeholder="ABCD-EFGH-IJKL-MNOP"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              handleApply();
            }
          }}
          disabled={validateMutation.isPending}
          className="flex-1"
        />
        <Button
          type="button"
          onClick={handleApply}
          disabled={validateMutation.isPending || !code.trim()}
        >
          {validateMutation.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Gift className="h-4 w-4 mr-2" />
          )}
          Appliquer
        </Button>
      </div>
      {validateMutation.isError && (
        <Alert variant="destructive">
          <AlertDescription>
            {validateMutation.error?.message || 'Erreur lors de la validation'}
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}

