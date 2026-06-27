/**
 * Résolution admin d'un litige Emarzona Protect v2 (escrow + remboursement).
 */

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2, ShieldCheck } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useResolveEmarzonaProtectDispute } from '@/hooks/trust/useEmarzonaProtect';
import {
  PROTECT_RESOLUTION_OPTIONS,
  type ProtectResolution,
} from '@/lib/trust/emarzona-protect-policy';

interface ProtectDisputeResolvePanelProps {
  disputeId: string;
  onResolved?: () => void;
}

export function ProtectDisputeResolvePanel({
  disputeId,
  onResolved,
}: ProtectDisputeResolvePanelProps) {
  const { toast } = useToast();
  const resolve = useResolveEmarzonaProtectDispute();
  const [resolution, setResolution] = useState<ProtectResolution>('refund_full');
  const [refundAmount, setRefundAmount] = useState('');
  const [notes, setNotes] = useState('');

  const handleSubmit = async () => {
    try {
      await resolve.mutateAsync({
        disputeId,
        resolution,
        refundAmount: resolution === 'refund_partial' ? Number.parseFloat(refundAmount) : undefined,
        adminNotes: notes.trim() || undefined,
      });
      toast({
        title: 'Litige Protect résolu',
        description:
          resolution === 'release_seller'
            ? 'Fonds libérés au vendeur.'
            : 'Remboursement enregistré via apply_transaction_refund.',
      });
      onResolved?.();
    } catch (err) {
      toast({
        title: 'Échec résolution Protect',
        description: err instanceof Error ? err.message : 'Erreur inconnue',
        variant: 'destructive',
      });
    }
  };

  return (
    <Card className="border-emerald-500/30">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-emerald-600" />
          Résolution Emarzona Protect v2
        </CardTitle>
        <CardDescription>
          Escrow logique + remboursement atomique (`apply_transaction_refund`) ou libération
          vendeur.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>Décision</Label>
          <Select value={resolution} onValueChange={v => setResolution(v as ProtectResolution)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PROTECT_RESOLUTION_OPTIONS.map(opt => (
                <SelectItem key={opt.code} value={opt.code}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            {PROTECT_RESOLUTION_OPTIONS.find(o => o.code === resolution)?.description}
          </p>
        </div>

        {resolution === 'refund_partial' && (
          <div className="space-y-2">
            <Label htmlFor="protect-refund-amount">Montant remboursement (XOF)</Label>
            <Input
              id="protect-refund-amount"
              type="number"
              min={1}
              value={refundAmount}
              onChange={e => setRefundAmount(e.target.value)}
              required
            />
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="protect-notes">Notes admin (optionnel)</Label>
          <Textarea
            id="protect-notes"
            value={notes}
            onChange={e => setNotes(e.target.value)}
            rows={3}
            placeholder="Contexte de la décision trust…"
          />
        </div>

        <Button
          type="button"
          className="w-full"
          disabled={resolve.isPending || (resolution === 'refund_partial' && !refundAmount)}
          onClick={() => void handleSubmit()}
        >
          {resolve.isPending ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Traitement…
            </>
          ) : (
            'Appliquer la résolution Protect'
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
