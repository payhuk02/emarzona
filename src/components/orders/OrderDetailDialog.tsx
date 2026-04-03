import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import {
  Calendar,
  User,
  CreditCard,
  Package,
  MapPin,
  Phone,
  Mail,
  FileText,
  MessageSquare,
  Shield,
  AlertCircle,
  Percent,
} from 'lucide-react';
import { Order, OrderTransaction } from '@/hooks/useOrders';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useUnreadCount } from '@/hooks/useUnreadCount';
import { useToast } from '@/hooks/use-toast';
import { logger } from '@/lib/logger';

interface OrderDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  order: Order | null;
}

interface OrderItem {
  id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

const OrderDetailDialogComponent = ({ open, onOpenChange, order }: OrderDetailDialogProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [items, setItems] = useState<OrderItem[]>([]);
  const [transactions, setTransactions] = useState<OrderTransaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [transactionsLoading, setTransactionsLoading] = useState(false);

  // Hook pour compter les messages non lus
  const { data: unreadCount = 0 } = useUnreadCount(order?.id || '');

  useEffect(() => {
    const fetchOrderData = async () => {
      if (!order?.id) return;

      setLoading(true);
      setTransactionsLoading(true);

      try {
        // Fetch order items
        const { data: itemsData, error: itemsError } = await supabase
          .from('order_items')
          .select('*')
          .eq('order_id', order.id);

        if (itemsError) throw itemsError;
        setItems(itemsData || []);

        // Fetch transactions
        const { data: transactionsData, error: transactionsError } = await supabase
          .from('transactions')
          .select(
            'id, moneroo_transaction_id, amount, currency, status, moneroo_payment_method, created_at, completed_at'
          )
          .eq('order_id', order.id)
          .order('created_at', { ascending: false });

        if (transactionsError) {
          logger.warn('Erreur chargement transactions', {
            error: transactionsError,
            orderId: order.id,
          });
        } else {
          setTransactions(
            (transactionsData || []).map(t => ({
              id: t.id,
              moneroo_transaction_id: t.moneroo_transaction_id,
              amount: Number(t.amount || 0),
              currency: t.currency || 'XOF',
              status: t.status || 'pending',
              payment_method: t.moneroo_payment_method,
              created_at: t.created_at,
              completed_at: t.completed_at,
            }))
          );
        }
      } catch (error) {
        logger.error('Erreur chargement données commande', { error, orderId: order.id });
      } finally {
        setLoading(false);
        setTransactionsLoading(false);
      }
    };

    if (open && order) {
      fetchOrderData();
    } else {
      // Reset when dialog closes
      setItems([]);
      setTransactions([]);
    }
  }, [open, order]);

  if (!order) return null;

  const getStatusBadge = (status: string) => {
    const  variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      pending: 'secondary',
      processing: 'default',
      completed: 'outline',
      cancelled: 'destructive',
    };

    const  labels: Record<string, string> = {
      pending: 'En attente',
      processing: 'En cours',
      completed: 'Terminée',
      cancelled: 'Annulée',
    };

    return <Badge variant={variants[status] || 'default'}>{labels[status] || status}</Badge>;
  };

  const getPaymentBadge = (status: string) => {
    const  variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      pending: 'secondary',
      paid: 'outline',
      failed: 'destructive',
    };

    const  labels: Record<string, string> = {
      pending: 'En attente',
      paid: 'Payée',
      failed: 'Échouée',
    };

    return <Badge variant={variants[status] || 'default'}>{labels[status] || status}</Badge>;
  };

  const formatPrice = (price: number) => {
    return price.toLocaleString('fr-FR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] sm:max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Commande {order.order_number}
          </DialogTitle>
          <DialogDescription>Détails complets de la commande</DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Informations générales */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <h3 className="font-semibold flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Informations
              </h3>

              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Date:</span>
                  <span className="font-medium">
                    {format(new Date(order.created_at), "dd MMMM yyyy 'à' HH:mm", { locale: fr })}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <Package className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Statut:</span>
                  {getStatusBadge(order.status)}
                </div>

                <div className="flex items-center gap-2">
                  <CreditCard className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Paiement:</span>
                  {getPaymentBadge(order.payment_status)}
                </div>

                {order.payment_method && (
                  <div className="flex items-center gap-2">
                    <CreditCard className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Mode:</span>
                    <span className="font-medium capitalize">{order.payment_method}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Informations client */}
            <div className="space-y-3">
              <h3 className="font-semibold flex items-center gap-2">
                <User className="h-4 w-4" />
                Client
              </h3>

              {order.customers ? (
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">{order.customers.name}</span>
                  </div>

                  {order.customers.email && (
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">{order.customers.email}</span>
                    </div>
                  )}

                  {order.customers.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">{order.customers.phone}</span>
                    </div>
                  )}

                  {/* Adresse client complète */}
                  {(order.customers.address ||
                    order.customers.city ||
                    order.customers.postal_code ||
                    order.customers.country) && (
                    <div className="flex items-start gap-2 pt-1">
                      <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                      <div className="text-muted-foreground space-y-0.5">
                        {order.customers.address && <p>{order.customers.address}</p>}
                        {[
                          order.customers.postal_code,
                          order.customers.city,
                          order.customers.country,
                        ].filter(Boolean).length > 0 && (
                          <p>
                            {[
                              order.customers.postal_code,
                              order.customers.city,
                              order.customers.country,
                            ]
                              .filter(Boolean)
                              .join(', ')}
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Client non spécifié</p>
              )}
            </div>
          </div>

          {/* Adresse de livraison depuis checkout */}
          {order.shipping_address && (
            <>
              <Separator />
              <div className="space-y-3">
                <h3 className="font-semibold flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Adresse de livraison
                </h3>
                <div className="space-y-2 text-sm">
                  {order.shipping_address.full_name && (
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{order.shipping_address.full_name}</span>
                    </div>
                  )}

                  {order.shipping_address.email && (
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">{order.shipping_address.email}</span>
                    </div>
                  )}

                  {order.shipping_address.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">{order.shipping_address.phone}</span>
                    </div>
                  )}

                  {order.shipping_address.address_line1 && (
                    <div className="flex items-start gap-2 pt-1">
                      <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                      <div className="text-muted-foreground space-y-0.5">
                        <p>
                          {order.shipping_address.address_line1}
                          {order.shipping_address.address_line2 &&
                            `, ${order.shipping_address.address_line2}`}
                        </p>
                        {[
                          order.shipping_address.postal_code,
                          order.shipping_address.city,
                          order.shipping_address.state,
                          order.shipping_address.country,
                        ].filter(Boolean).length > 0 && (
                          <p>
                            {[
                              order.shipping_address.postal_code,
                              order.shipping_address.city,
                              order.shipping_address.state,
                              order.shipping_address.country,
                            ]
                              .filter(Boolean)
                              .join(', ')}
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

          <Separator />

          {/* Articles commandés */}
          <div className="space-y-3">
            <h3 className="font-semibold flex items-center gap-2">
              <Package className="h-4 w-4" />
              Articles
            </h3>

            {loading ? (
              <div className="text-sm text-muted-foreground">Chargement...</div>
            ) : items.length > 0 ? (
              <div className="space-y-2">
                {items.map(item => (
                  <div
                    key={item.id}
                    className="flex justify-between items-center p-3 bg-muted/50 rounded-lg"
                  >
                    <div className="flex-1">
                      <p className="font-medium">{item.product_name}</p>
                      <p className="text-sm text-muted-foreground">
                        {item.quantity} × {formatPrice(item.unit_price)} {order.currency}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">
                        {formatPrice(item.total_price)} {order.currency}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Aucun article</p>
            )}
          </div>

          <Separator />

          {/* Total */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-lg font-bold">
              <span>Total</span>
              <span>
                {formatPrice(order.total_amount)} {order.currency}
              </span>
            </div>
          </div>

          {/* Payment Type & Details */}
          <Separator />
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-muted-foreground">Type de Paiement :</span>
              {(!order.payment_type || order.payment_type === 'full') && (
                <Badge variant="secondary" className="gap-1">
                  <CreditCard className="h-3 w-3" />
                  Paiement Complet
                </Badge>
              )}

              {order.payment_type === 'percentage' && (
                <Badge variant="default" className="bg-blue-600 gap-1">
                  <Percent className="h-3 w-3" />
                  Paiement Partiel{' '}
                  {order.percentage_paid && order.total_amount
                    ? `(${Math.round((order.percentage_paid / order.total_amount) * 100)}%)`
                    : ''}
                </Badge>
              )}

              {order.payment_type === 'delivery_secured' && (
                <Badge variant="default" className="bg-yellow-600 gap-1">
                  <Shield className="h-3 w-3" />
                  Paiement Sécurisé (Escrow)
                </Badge>
              )}
            </div>

            {/* Détails paiement partiel */}
            {order.payment_type === 'percentage' && order.percentage_paid && (
              <div className="p-3 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Acompte payé :</span>
                  <span className="font-semibold text-blue-700 dark:text-blue-300">
                    {formatPrice(order.percentage_paid)} {order.currency}
                  </span>
                </div>
                {order.remaining_amount && order.remaining_amount > 0 && (
                  <>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Solde restant :</span>
                      <span className="font-semibold text-orange-600 dark:text-orange-400">
                        {formatPrice(order.remaining_amount)} {order.currency}
                      </span>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full mt-2 border-blue-500 text-blue-700 hover:bg-blue-50"
                    >
                      Payer le solde
                    </Button>
                  </>
                )}
              </div>
            )}

            {/* Détails paiement escrow */}
            {order.payment_type === 'delivery_secured' && (
              <div className="p-3 bg-yellow-50 dark:bg-yellow-950 rounded-lg border border-yellow-200 dark:border-yellow-800">
                <div className="flex items-start gap-2">
                  <Shield className="h-4 w-4 text-yellow-600 mt-0.5" />
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                      Fonds sécurisés en escrow
                    </p>
                    <p className="text-xs text-yellow-700 dark:text-yellow-300">
                      Les fonds seront libérés après confirmation de livraison ou automatiquement
                      après le délai de sécurité.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Notes */}
          {order.notes && (
            <>
              <Separator />
              <div className="space-y-2">
                <h3 className="font-semibold flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Notes
                </h3>
                <p className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">
                  {order.notes}
                </p>
              </div>
            </>
          )}

          {/* Metadata (informations supplémentaires) */}
          {order.metadata && Object.keys(order.metadata).length > 0 && (
            <>
              <Separator />
              <div className="space-y-2">
                <h3 className="font-semibold flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Informations supplémentaires
                </h3>
                <div className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">
                  <pre className="whitespace-pre-wrap text-xs">
                    {JSON.stringify(order.metadata, null, 2)}
                  </pre>
                </div>
              </div>
            </>
          )}

          {/* Transactions/Paiements */}
          <Separator />
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold flex items-center gap-2">
                <CreditCard className="h-4 w-4" />
                Paiements ({transactions.length})
              </h3>
              {transactions.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    navigate('/dashboard/payments-customers');
                    onOpenChange(false);
                  }}
                >
                  Voir tous les paiements
                </Button>
              )}
            </div>

            {transactionsLoading ? (
              <div className="text-sm text-muted-foreground">Chargement des paiements...</div>
            ) : transactions.length > 0 ? (
              <div className="space-y-2">
                {transactions.map(transaction => {
                  const getTransactionStatusBadge = (status: string) => {
                    const  variants: Record<
                      string,
                      'default' | 'secondary' | 'destructive' | 'outline'
                    > = {
                      completed: 'outline',
                      processing: 'default',
                      pending: 'secondary',
                      failed: 'destructive',
                      cancelled: 'destructive',
                    };

                    const  labels: Record<string, string> = {
                      completed: 'Complété',
                      processing: 'En traitement',
                      pending: 'En attente',
                      failed: 'Échoué',
                      cancelled: 'Annulé',
                    };

                    return (
                      <Badge variant={variants[status] || 'default'}>
                        {labels[status] || status}
                      </Badge>
                    );
                  };

                  return (
                    <div
                      key={transaction.id}
                      className="flex justify-between items-center p-3 bg-muted/50 rounded-lg hover:bg-muted transition-colors cursor-pointer"
                      onClick={() => {
                        navigate('/dashboard/payments-customers');
                        onOpenChange(false);
                      }}
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium text-sm">
                            {transaction.amount.toLocaleString('fr-FR')} {transaction.currency}
                          </span>
                          {getTransactionStatusBadge(transaction.status)}
                          {transaction.payment_method && (
                            <Badge variant="outline" className="text-xs">
                              {transaction.payment_method}
                            </Badge>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {transaction.moneroo_transaction_id && (
                            <span className="font-mono">
                              ID: {transaction.moneroo_transaction_id.substring(0, 12)}...
                            </span>
                          )}
                          {transaction.moneroo_transaction_id && transaction.completed_at && ' • '}
                          {transaction.completed_at && (
                            <span>
                              {format(new Date(transaction.completed_at), 'dd MMM yyyy HH:mm', {
                                locale: fr,
                              })}
                            </span>
                          )}
                          {!transaction.completed_at && (
                            <span>
                              {format(new Date(transaction.created_at), 'dd MMM yyyy HH:mm', {
                                locale: fr,
                              })}
                            </span>
                          )}
                        </div>
                      </div>
                      <CreditCard className="h-4 w-4 text-muted-foreground" />
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Aucun paiement associé à cette commande
              </p>
            )}
          </div>

          {/* Actions */}
          <div className="space-y-4 pt-4">
            {/* Primary Actions - Messagerie & Paiements */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Button
                variant="default"
                className="w-full relative"
                onClick={() => {
                  navigate(`/orders/${order.id}/messaging`);
                  onOpenChange(false);
                }}
              >
                <MessageSquare className="h-4 w-4 mr-2" />
                Messagerie
                {unreadCount > 0 && (
                  <Badge className="ml-2 bg-red-500 text-white hover:bg-red-600">
                    {unreadCount}
                  </Badge>
                )}
              </Button>

              {/* Show Payment Management button for physical/service products */}
              {'payment_type' in order && order.payment_type && order.payment_type !== 'full' && (
                <Button
                  variant="outline"
                  className="w-full border-blue-500 text-blue-700 hover:bg-blue-50"
                  onClick={() => {
                    navigate(`/payments/${order.id}/manage`);
                    onOpenChange(false);
                  }}
                >
                  <CreditCard className="h-4 w-4 mr-2" />
                  Gérer Paiements
                </Button>
              )}
            </div>

            {/* Secondary Actions - Dispute & Print */}
            <div className="flex items-center justify-between gap-2">
              <Button
                variant="outline"
                size="sm"
                className="border-red-500 text-red-700 hover:bg-red-50"
                onClick={async () => {
                  // Vérifier que l'utilisateur est connecté
                  const { data: { user } } = await supabase.auth.getUser();
                  if (!user) {
                    toast({
                      title: 'Connexion requise',
                      description: 'Veuillez vous connecter pour ouvrir un litige.',
                      variant: 'destructive',
                    });
                    navigate('/auth');
                    return;
                  }

                  // Vérifier que la commande peut avoir un litige
                  if (order.payment_status === 'pending' || order.status === 'cancelled') {
                    toast({
                      title: 'Action impossible',
                      description: 'Vous ne pouvez pas ouvrir un litige pour cette commande.',
                      variant: 'destructive',
                    });
                    return;
                  }

                  // Rediriger vers la page de création de litige avec les paramètres
                  navigate(`/disputes/create?order_id=${order.id}`);
                  onOpenChange(false);
                }}
              >
                <AlertCircle className="h-4 w-4 mr-2" />
                Ouvrir litige
              </Button>

              <div className="flex gap-2">
                <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)}>
                  Fermer
                </Button>
                <Button variant="outline" size="sm" onClick={() => window.print()}>
                  Imprimer
                </Button>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

OrderDetailDialogComponent.displayName = 'OrderDetailDialogComponent';

// Optimisation avec React.memo pour éviter les re-renders inutiles
export const OrderDetailDialog = React.memo(OrderDetailDialogComponent, (prevProps, nextProps) => {
  return (
    prevProps.open === nextProps.open &&
    prevProps.onOpenChange === nextProps.onOpenChange &&
    prevProps.order?.id === nextProps.order?.id &&
    prevProps.order?.status === nextProps.order?.status &&
    prevProps.order?.total === nextProps.order?.total
  );
});

OrderDetailDialog.displayName = 'OrderDetailDialog';

OrderDetailDialog.displayName = 'OrderDetailDialog';

OrderDetailDialog.displayName = 'OrderDetailDialog';

OrderDetailDialog.displayName = 'OrderDetailDialog';

OrderDetailDialog.displayName = 'OrderDetailDialog';

OrderDetailDialog.displayName = 'OrderDetailDialog';

OrderDetailDialog.displayName = 'OrderDetailDialog';

OrderDetailDialog.displayName = 'OrderDetailDialog';

OrderDetailDialog.displayName = 'OrderDetailDialog';

OrderDetailDialog.displayName = 'OrderDetailDialog';






