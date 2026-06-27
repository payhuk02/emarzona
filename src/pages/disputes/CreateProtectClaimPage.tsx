/**
 * Création d'une réclamation Emarzona Protect v1
 * Route : /disputes/create?orderId=...
 */

import { useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { AppPageShell } from '@/components/layout/AppPageShell';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ShieldCheck, ArrowLeft, Loader2, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  useCreateEmarzonaProtectClaim,
  useEmarzonaProtectStatus,
} from '@/hooks/trust/useEmarzonaProtect';
import { EmarzonaProtectBadge } from '@/components/trust/EmarzonaProtectBadge';
import {
  PROTECT_REASON_OPTIONS,
  type ProtectReasonCode,
  ineligibleReasonLabel,
  protectStatusLabel,
} from '@/lib/trust/emarzona-protect-policy';

export default function CreateProtectClaimPage() {
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get('orderId') ?? searchParams.get('order_id') ?? '';
  const navigate = useNavigate();
  const { toast } = useToast();

  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [reasonCode, setReasonCode] = useState<ProtectReasonCode>('not_received');

  const { data: protectStatus, isLoading, error } = useEmarzonaProtectStatus(orderId || null);
  const createClaim = useCreateEmarzonaProtectClaim(orderId);

  const defaultSubject = useMemo(() => {
    const option = PROTECT_REASON_OPTIONS.find(o => o.code === reasonCode);
    return option ? `Protect — ${option.label}` : 'Réclamation Emarzona Protect';
  }, [reasonCode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderId) return;
    try {
      const result = await createClaim.mutateAsync({
        subject: subject.trim() || defaultSubject,
        description: description.trim(),
        reasonCode,
      });
      toast({
        title: 'Réclamation Protect enregistrée',
        description: 'Notre équipe trust examine votre dossier.',
      });
      navigate(`/disputes/${result.disputeId}`);
    } catch (err) {
      toast({
        title: 'Impossible d’ouvrir la réclamation',
        description: err instanceof Error ? err.message : 'Erreur inconnue',
        variant: 'destructive',
      });
    }
  };

  if (!orderId) {
    return (
      <AppPageShell>
        <div className="container mx-auto max-w-lg p-6">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Identifiant de commande manquant. Ouvrez la réclamation depuis{' '}
              <Link to="/account/orders" className="underline">
                Mes commandes
              </Link>
              .
            </AlertDescription>
          </Alert>
        </div>
      </AppPageShell>
    );
  }

  return (
    <AppPageShell>
      <div className="container mx-auto max-w-xl px-4 py-8 space-y-6">
        <Button variant="ghost" size="sm" asChild>
          <Link to="/account/orders">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour aux commandes
          </Link>
        </Button>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-emerald-600" />
              Réclamation Emarzona Protect
            </CardTitle>
            <CardDescription>Commande {orderId.slice(0, 8)}…</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {isLoading ? (
              <Skeleton className="h-24 w-full" />
            ) : error ? (
              <Alert variant="destructive">
                <AlertDescription>{error.message}</AlertDescription>
              </Alert>
            ) : protectStatus ? (
              <>
                <EmarzonaProtectBadge status={protectStatus} />
                {!protectStatus.canClaim && (
                  <Alert>
                    <AlertDescription>
                      Statut : {protectStatusLabel(protectStatus.status)}
                      {protectStatus.ineligibleReason
                        ? ` — ${ineligibleReasonLabel(protectStatus.ineligibleReason)}`
                        : null}
                      {protectStatus.disputeId && (
                        <>
                          {' '}
                          <Link
                            to={`/disputes/${protectStatus.disputeId}`}
                            className="underline font-medium"
                          >
                            Voir le litige
                          </Link>
                        </>
                      )}
                    </AlertDescription>
                  </Alert>
                )}
              </>
            ) : null}

            {protectStatus?.canClaim && (
              <form onSubmit={e => void handleSubmit(e)} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="reason">Motif</Label>
                  <Select
                    value={reasonCode}
                    onValueChange={v => setReasonCode(v as ProtectReasonCode)}
                  >
                    <SelectTrigger id="reason">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PROTECT_REASON_OPTIONS.map(opt => (
                        <SelectItem key={opt.code} value={opt.code}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="subject">Objet</Label>
                  <Input
                    id="subject"
                    value={subject}
                    onChange={e => setSubject(e.target.value)}
                    placeholder={defaultSubject}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description (min. 20 caractères)</Label>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    rows={5}
                    required
                    minLength={20}
                    placeholder="Décrivez le problème, les dates et ce que vous attendez comme résolution."
                  />
                </div>
                <Button type="submit" className="w-full" disabled={createClaim.isPending}>
                  {createClaim.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Envoi…
                    </>
                  ) : (
                    'Ouvrir la réclamation Protect'
                  )}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </AppPageShell>
  );
}
