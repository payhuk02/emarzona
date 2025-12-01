/**
 * Page publique de désabonnement email
 * Date: 1er Février 2025
 */

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Mail, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';

type UnsubscribeType = 'all' | 'marketing' | 'newsletter' | 'transactional';

export const UnsubscribePage = () => {
  const [email, setEmail] = useState('');
  const [unsubscribeType, setUnsubscribeType] = useState<UnsubscribeType>('marketing');
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      // Enregistrer le désabonnement
      const { error: insertError } = await supabase
        .from('email_unsubscribes')
        .upsert({
          email: email.toLowerCase().trim(),
          unsubscribe_type: unsubscribeType,
          reason: reason || null,
          unsubscribed_at: new Date().toISOString(),
        }, {
          onConflict: 'email,unsubscribe_type',
        });

      if (insertError) {
        logger.error('Error unsubscribing', { error: insertError });
        throw insertError;
      }

      setSuccess(true);
      setEmail('');
      setReason('');
    } catch (err: any) {
      logger.error('Failed to unsubscribe', { error: err });
      setError(err.message || 'Erreur lors du désabonnement');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <div className="flex items-center justify-center mb-4">
              <div className="p-3 rounded-full bg-green-100 dark:bg-green-900/20">
                <CheckCircle2 className="h-8 w-8 text-green-600" />
              </div>
            </div>
            <CardTitle className="text-center">Désabonnement confirmé</CardTitle>
            <CardDescription className="text-center">
              Vous avez été désabonné avec succès
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Alert>
              <AlertDescription>
                {unsubscribeType === 'all' ? (
                  <>Vous ne recevrez plus aucun email de notre part.</>
                ) : (
                  <>Vous ne recevrez plus d&apos;emails de type <strong>{unsubscribeType}</strong>.</>
                )}
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
      <Card className="max-w-md w-full">
        <CardHeader>
          <div className="flex items-center justify-center mb-4">
            <div className="p-3 rounded-full bg-muted">
              <Mail className="h-8 w-8" />
            </div>
          </div>
          <CardTitle className="text-center">Gérer vos préférences email</CardTitle>
          <CardDescription className="text-center">
            Vous pouvez vous désabonner de certains ou tous nos emails
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="email">Votre adresse email *</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="votre@email.com"
                required
              />
            </div>

            <div>
              <Label htmlFor="unsubscribe-type">Type de désabonnement *</Label>
              <Select
                value={unsubscribeType}
                onValueChange={(value: UnsubscribeType) => setUnsubscribeType(value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="marketing">Emails marketing uniquement</SelectItem>
                  <SelectItem value="newsletter">Newsletters uniquement</SelectItem>
                  <SelectItem value="transactional">Emails transactionnels (non recommandé)</SelectItem>
                  <SelectItem value="all">Tous les emails</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="reason">Raison (optionnel)</Label>
              <Textarea
                id="reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Pourquoi vous désabonnez-vous ?"
                rows={3}
              />
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Button type="submit" disabled={isSubmitting} className="w-full">
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Traitement...
                </>
              ) : (
                'Confirmer le désabonnement'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

