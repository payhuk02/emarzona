/**
 * Page Client - Mes Cartes Cadeaux
 * Permet aux clients de voir leurs cartes cadeaux reçues et leurs soldes
 */

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useCustomerGiftCards, useCustomerGiftCardTransactions } from '@/hooks/giftCards/useGiftCards';
import { useAuth } from '@/contexts/AuthContext';
import { Gift, Copy, Check, Loader2, Calendar, CreditCard, TrendingUp } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';
import { GiftCardStatus } from '@/types/giftCards';

const STATUS_COLORS: Record<GiftCardStatus, string> = {
  active: 'bg-green-500/10 text-green-600 border-green-500/20',
  used: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
  expired: 'bg-red-500/10 text-red-600 border-red-500/20',
  cancelled: 'bg-gray-500/10 text-gray-600 border-gray-500/20',
};

const STATUS_LABELS: Record<GiftCardStatus, string> = {
  active: 'Active',
  used: 'Utilisée',
  expired: 'Expirée',
  cancelled: 'Annulée',
};

export default function CustomerMyGiftCards() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const { data: giftCards = [], isLoading } = useCustomerGiftCards(user?.id);
  const { data: transactions = [] } = useCustomerGiftCardTransactions(user?.id);

  const handleCopyCode = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCode(code);
      toast({
        title: 'Code copié !',
        description: 'Le code de la carte cadeau a été copié dans le presse-papier',
      });
      setTimeout(() => setCopiedCode(null), 2000);
    } catch (error) {
      toast({
        title: 'Erreur',
        description: 'Impossible de copier le code',
        variant: 'destructive',
      });
    }
  };

  const activeCards = giftCards.filter(card => card.status === 'active' && (card.balance || 0) > 0);
  const totalBalance = activeCards.reduce((sum, card) => sum + (card.balance || 0), 0);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header avec statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Gift className="h-4 w-4" />
              Solde Total
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalBalance)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {activeCards.length} carte{activeCards.length > 1 ? 's' : ''} active{activeCards.length > 1 ? 's' : ''}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              Total Cartes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{giftCards.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Reçues au total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Transactions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{transactions.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Historique complet
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Cartes cadeaux actives */}
      {activeCards.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Mes Cartes Cadeaux Actives</CardTitle>
            <CardDescription>
              Vous pouvez utiliser ces cartes lors de vos prochains achats
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {activeCards.map((card) => (
                <Card key={card.id} className="border-2">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Gift className="h-5 w-5 text-primary" />
                        Carte Cadeau
                      </CardTitle>
                      <Badge className={STATUS_COLORS[card.status]}>
                        {STATUS_LABELS[card.status]}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <Label className="text-xs text-muted-foreground">Code</Label>
                      <div className="flex items-center gap-2 mt-1">
                        <code className="flex-1 px-2 py-1 bg-muted rounded text-sm font-mono">
                          {card.code}
                        </code>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleCopyCode(card.code)}
                          className="h-8 w-8 p-0"
                        >
                          {copiedCode === card.code ? (
                            <Check className="h-4 w-4 text-green-600" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>

                    <div>
                      <Label className="text-xs text-muted-foreground">Solde disponible</Label>
                      <div className="text-2xl font-bold mt-1">
                        {formatCurrency(card.balance || 0)}
                      </div>
                    </div>

                    {card.expires_at && (
                      <div>
                        <Label className="text-xs text-muted-foreground flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          Expire le
                        </Label>
                        <div className="text-sm mt-1">
                          {format(new Date(card.expires_at), 'PP', { locale: fr })}
                        </div>
                      </div>
                    )}

                    {card.recipient_name && (
                      <div className="text-xs text-muted-foreground">
                        De: {card.recipient_name}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="py-12 text-center">
            <Gift className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Aucune carte cadeau active</h3>
            <p className="text-muted-foreground">
              Vous n'avez pas de carte cadeau active pour le moment.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Toutes les cartes cadeaux */}
      {giftCards.length > activeCards.length && (
        <Card>
          <CardHeader>
            <CardTitle>Toutes mes Cartes Cadeaux</CardTitle>
            <CardDescription>
              Historique de toutes vos cartes cadeaux
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Montant initial</TableHead>
                  <TableHead>Solde</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Expiration</TableHead>
                  <TableHead>Reçue le</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {giftCards.map((card) => (
                  <TableRow key={card.id}>
                    <TableCell>
                      <code className="font-mono text-sm">{card.code}</code>
                    </TableCell>
                    <TableCell>{formatCurrency(card.initial_amount)}</TableCell>
                    <TableCell>
                      <span className={card.balance === 0 ? 'text-muted-foreground' : 'font-medium'}>
                        {formatCurrency(card.balance || 0)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge className={STATUS_COLORS[card.status]}>
                        {STATUS_LABELS[card.status]}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {card.expires_at ? (
                        <span className={new Date(card.expires_at) < new Date() ? 'text-red-600' : ''}>
                          {format(new Date(card.expires_at), 'PP', { locale: fr })}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">Jamais</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {format(new Date(card.created_at), 'PP', { locale: fr })}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Historique des transactions */}
      {transactions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Historique des Transactions</CardTitle>
            <CardDescription>
              Toutes les transactions liées à vos cartes cadeaux
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Montant</TableHead>
                  <TableHead>Code carte</TableHead>
                  <TableHead>Commande</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.map((transaction) => (
                  <TableRow key={transaction.id}>
                    <TableCell>
                      {format(new Date(transaction.created_at), 'PPp', { locale: fr })}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {transaction.transaction_type === 'redemption' ? 'Rédemption' : 'Recharge'}
                      </Badge>
                    </TableCell>
                    <TableCell className={transaction.transaction_type === 'redemption' ? 'text-red-600' : 'text-green-600'}>
                      {transaction.transaction_type === 'redemption' ? '-' : '+'}
                      {formatCurrency(Math.abs(transaction.amount))}
                    </TableCell>
                    <TableCell>
                      <code className="font-mono text-sm">{transaction.gift_card_code}</code>
                    </TableCell>
                    <TableCell>
                      {transaction.order_number ? (
                        <span className="text-sm">#{transaction.order_number}</span>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

