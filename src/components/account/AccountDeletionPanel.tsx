/**
 * Epic 6.2 — Demande suppression compte (RGPD)
 */
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Trash2, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Link } from 'react-router-dom';

export function AccountDeletionPanel() {
  const { toast } = useToast();
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.rpc('request_account_deletion', {
        p_reason: reason.trim() || null,
      });
      if (error) throw error;
      setSubmitted(true);
      toast({
        title: 'Demande enregistrée',
        description: 'Notre équipe traitera votre demande sous 30 jours (RGPD).',
      });
    } catch (err) {
      toast({
        title: 'Erreur',
        description: err instanceof Error ? err.message : 'Impossible d’enregistrer la demande',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="border-destructive/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-destructive">
          <Trash2 className="h-5 w-5" aria-hidden />
          Suppression du compte
        </CardTitle>
        <CardDescription>
          Demande de suppression de vos données personnelles conformément au RGPD. Voir aussi notre{' '}
          <Link to="/legal/dpa" className="underline">
            accord de traitement des données (DPA)
          </Link>
          .
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {submitted ? (
          <Alert>
            <AlertDescription>
              Votre demande est en cours de traitement. Vous recevrez une confirmation par email.
            </AlertDescription>
          </Alert>
        ) : (
          <>
            <Textarea
              placeholder="Motif optionnel (facultatif)"
              value={reason}
              onChange={e => setReason(e.target.value)}
              rows={3}
            />
            <Button variant="destructive" onClick={handleSubmit} disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Demander la suppression
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}
