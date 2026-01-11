import React, { useState } from 'react';
import { useAbandonedCartRecovery } from '@/hooks/useAbandonedCartRecovery';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { LazyImage } from '@/components/ui/lazy-image';
import { Mail, ShoppingCart, Clock, DollarSign, Users, Send } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';

interface AbandonedCartRecoveryProps {
  className?: string;
  showAdminControls?: boolean;
  autoProcessEmails?: boolean;
}

export const AbandonedCartRecovery: React.FC<AbandonedCartRecoveryProps> = ({
  className,
  showAdminControls = false,
  autoProcessEmails = false,
}) => {
  const { toast } = useToast();
  const {
    abandonedCarts,
    isLoading,
    sendRecoveryEmail,
    markAsRecovered,
    processRecoveryEmails,
  } = useAbandonedCartRecovery();

  const [processingBatch, setProcessingBatch] = useState(false);

  const handleSendRecoveryEmail = async (cartId: string) => {
    // This would typically require fetching user details and cart items
    // For now, we'll show a placeholder
    toast({
      title: 'Fonctionnalité en développement',
      description: 'L\'envoi d\'emails de récupération sera bientôt disponible.',
    });
  };

  const handleBatchProcess = async () => {
    setProcessingBatch(true);
    try {
      await processRecoveryEmails(1); // Process carts abandoned for 1+ hours
      toast({
        title: 'Traitement par lot terminé',
        description: 'Les emails de récupération ont été envoyés.',
      });
    } catch (error) {
      toast({
        title: 'Erreur',
        description: 'Erreur lors du traitement par lot.',
        variant: 'destructive',
      });
    } finally {
      setProcessingBatch(false);
    }
  };

  const getRecoveryStatus = (cart: any) => {
    if (cart.recovered_at) {
      return { label: 'Récupéré', variant: 'default' as const, color: 'text-green-600' };
    }
    if (cart.recovery_sent) {
      return { label: 'Email envoyé', variant: 'secondary' as const, color: 'text-blue-600' };
    }
    return { label: 'En attente', variant: 'outline' as const, color: 'text-orange-600' };
  };

  if (isLoading) {
    return (
      <Card className={cn("w-full", className)}>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-1/4"></div>
            <div className="space-y-3">
              <div className="h-20 bg-gray-200 rounded"></div>
              <div className="h-20 bg-gray-200 rounded"></div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={cn("space-y-6", className)}>
      {showAdminControls && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Gestion des Paniers Abandonnés
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    {abandonedCarts.length} panier{abandonedCarts.length !== 1 ? 's' : ''} abandonné{abandonedCarts.length !== 1 ? 's' : ''}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    {abandonedCarts.filter(cart => cart.recovery_sent).length} email{abandonedCarts.filter(cart => cart.recovery_sent).length !== 1 ? 's' : ''} envoyé{abandonedCarts.filter(cart => cart.recovery_sent).length !== 1 ? 's' : ''}
                  </span>
                </div>
              </div>
              <Button
                onClick={handleBatchProcess}
                disabled={processingBatch || abandonedCarts.length === 0}
                variant="outline"
              >
                <Send className="h-4 w-4 mr-2" />
                {processingBatch ? 'Traitement...' : 'Traiter le lot'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4">
        {abandonedCarts.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <ShoppingCart className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                {showAdminControls
                  ? 'Aucun panier abandonné à traiter.'
                  : 'Vous n\'avez pas de paniers abandonnés.'}
              </p>
            </CardContent>
          </Card>
        ) : (
          abandonedCarts.map((cart) => {
            const status = getRecoveryStatus(cart);
            return (
              <Card key={cart.id} className="overflow-hidden">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Badge variant={status.variant}>
                        {status.label}
                      </Badge>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        {formatDistanceToNow(new Date(cart.abandoned_at), {
                          addSuffix: true,
                          locale: fr
                        })}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-lg font-semibold">
                      <DollarSign className="h-4 w-4" />
                      {cart.total_amount.toLocaleString()} {cart.currency}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-4">
                    <div className="grid gap-3">
                      {cart.items.slice(0, 3).map((item, index) => (
                        <div key={item.id || index} className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-md overflow-hidden bg-gray-100 flex-shrink-0">
                            {item.product_image ? (
                              <LazyImage
                                src={item.product_image}
                                alt={item.product_name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                                <ShoppingCart className="h-6 w-6 text-gray-400" />
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm truncate">
                              {item.product_name}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              Qty: {item.quantity} × {item.price.toLocaleString()} {cart.currency}
                            </p>
                          </div>
                        </div>
                      ))}
                      {cart.items.length > 3 && (
                        <p className="text-sm text-muted-foreground text-center">
                          +{cart.items.length - 3} autres article{cart.items.length - 3 !== 1 ? 's' : ''}
                        </p>
                      )}
                    </div>

                    {showAdminControls && !cart.recovery_sent && !cart.recovered_at && (
                      <>
                        <Separator />
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => handleSendRecoveryEmail(cart.id)}
                            disabled={sendRecoveryEmail.isPending}
                          >
                            <Mail className="h-4 w-4 mr-2" />
                            Envoyer email de récupération
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => markAsRecovered.mutate(cart.id)}
                          >
                            Marquer comme récupéré
                          </Button>
                        </div>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
};