import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  CreditCard,
  Percent,
  Shield,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  DollarSign,
  Calendar,
  User,
  Store,
  Package,
  MoreVertical,
  Eye,
  Unlock,
  AlertTriangle
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAdvancedPayments } from "@/hooks/useAdvancedPayments";
import { AdvancedPayment, PaymentType, PaymentStatus } from "@/types/advanced-features";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";

interface AdvancedPaymentsComponentProps {
  storeId?: string;
  orderId?: string;
  customerId?: string;
  className?: string;
}

const AdvancedPaymentsComponent: React.FC<AdvancedPaymentsComponentProps> = ({
  storeId,
  orderId,
  customerId,
  className = ""
}) => {
  const {
    payments,
    loading,
    stats,
    createPayment,
    createPercentagePayment,
    createSecuredPayment,
    releasePayment,
    openDispute,
    updatePayment,
    deletePayment,
  } = useAdvancedPayments(storeId);

  if (!storeId) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <CreditCard className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Boutique non trouvée</h3>
            <p className="text-muted-foreground">
              Impossible de charger les paiements sans identifiant de boutique
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showDisputeDialog, setShowDisputeDialog] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<AdvancedPayment | null>(null);
  const [disputeReason, setDisputeReason] = useState("");
  const [disputeDescription, setDisputeDescription] = useState("");
  const { toast } = useToast();

  const getStatusBadge = (status: PaymentStatus) => {
    const variants: Record<PaymentStatus, "default" | "secondary" | "destructive" | "outline"> = {
      pending: "secondary",
      completed: "default",
      failed: "destructive",
      refunded: "outline",
      held: "secondary",
      released: "default",
      disputed: "destructive",
    };

    const labels: Record<PaymentStatus, string> = {
      pending: "En attente",
      completed: "Complété",
      failed: "Échoué",
      refunded: "Remboursé",
      held: "Retenu",
      released: "Libéré",
      disputed: "En litige",
    };

    const icons: Record<PaymentStatus, React.ReactNode> = {
      pending: <Clock className="h-3 w-3" />,
      completed: <CheckCircle className="h-3 w-3" />,
      failed: <XCircle className="h-3 w-3" />,
      refunded: <XCircle className="h-3 w-3" />,
      held: <Shield className="h-3 w-3" />,
      released: <Unlock className="h-3 w-3" />,
      disputed: <AlertTriangle className="h-3 w-3" />,
    };

    return (
      <Badge variant={variants[status] || "default"} className="flex items-center gap-1">
        {icons[status]}
        {labels[status] || status}
      </Badge>
    );
  };

  const getPaymentTypeBadge = (type: PaymentType) => {
    const variants: Record<PaymentType, "default" | "secondary" | "outline"> = {
      full: "default",
      percentage: "secondary",
      delivery_secured: "outline",
    };

    const labels: Record<PaymentType, string> = {
      full: "Paiement complet",
      percentage: "Paiement partiel",
      delivery_secured: "Paiement sécurisé",
    };

    const icons: Record<PaymentType, React.ReactNode> = {
      full: <CreditCard className="h-3 w-3" />,
      percentage: <Percent className="h-3 w-3" />,
      delivery_secured: <Shield className="h-3 w-3" />,
    };

    return (
      <Badge variant={variants[type] || "default"} className="flex items-center gap-1">
        {icons[type]}
        {labels[type] || type}
      </Badge>
    );
  };

  const getMethodLabel = (method: string) => {
    const labels: Record<string, string> = {
      cash: "Espèces",
      card: "Carte bancaire",
      mobile_money: "Mobile Money",
      bank_transfer: "Virement bancaire",
      check: "Chèque",
      other: "Autre",
    };
    return labels[method] || method;
  };

  const formatDate = (dateString: string) => {
    return formatDistanceToNow(new Date(dateString), { 
      addSuffix: true, 
      locale: fr 
    });
  };

  const handleReleasePayment = async (payment: AdvancedPayment) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast({
        title: "Erreur",
        description: "Utilisateur non authentifié",
        variant: "destructive",
      });
      return;
    }

    const result = await releasePayment(payment.id, user.id);
    if (result.success) {
      toast({
        title: "Succès",
        description: "Paiement libéré avec succès",
      });
    } else {
      toast({
        title: "Erreur",
        description: result.error || "Impossible de libérer le paiement",
        variant: "destructive",
      });
    }
  };

  const handleOpenDispute = async () => {
    if (!selectedPayment || !disputeReason || !disputeDescription) return;

    const result = await openDispute(selectedPayment.id, disputeReason, disputeDescription);
    if (result.success) {
      setShowDisputeDialog(false);
      setDisputeReason("");
      setDisputeDescription("");
      setSelectedPayment(null);
    }
  };

  const handleDeletePayment = async (payment: AdvancedPayment) => {
    const result = await deletePayment(payment.id);
    if (!result.success) {
      toast({
        title: "Erreur",
        description: result.error || "Impossible de supprimer le paiement",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
            <p className="mt-2 text-muted-foreground">Chargement des paiements...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={className}>
      {/* Statistiques */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Paiements totaux</CardTitle>
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total_payments}</div>
              <p className="text-xs text-muted-foreground">
                {stats.completed_payments} complétés
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Revenus totaux</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total_revenue.toLocaleString()} FCFA</div>
              <p className="text-xs text-muted-foreground">
                {stats.held_revenue.toLocaleString()} FCFA retenus
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Paiements retenus</CardTitle>
              <Shield className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.held_payments}</div>
              <p className="text-xs text-muted-foreground">
                En attente de libération
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Taux de réussite</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.success_rate.toFixed(1)}%</div>
              <p className="text-xs text-muted-foreground">
                Paiements réussis
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold">Paiements avancés</h2>
          <p className="text-muted-foreground">
            Gérez les paiements par pourcentage et les paiements sécurisés
          </p>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button>
              <CreditCard className="h-4 w-4 mr-2" />
              Nouveau paiement
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Créer un paiement avancé</DialogTitle>
              <DialogDescription>
                Choisissez le type de paiement et configurez les paramètres
              </DialogDescription>
            </DialogHeader>
            <PaymentForm
              storeId={storeId}
              orderId={orderId}
              customerId={customerId}
              onCreatePayment={(result) => {
                if (result.success) {
                  setShowCreateDialog(false);
                  toast({
                    title: "Succès",
                    description: "Paiement créé avec succès",
                  });
                } else {
                  toast({
                    title: "Erreur",
                    description: result.error || "Impossible de créer le paiement",
                    variant: "destructive",
                  });
                }
              }}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Liste des paiements */}
      <div className="space-y-4">
        {payments.length === 0 ? (
          <Card>
            <CardContent className="flex items-center justify-center py-12">
              <div className="text-center">
                <CreditCard className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Aucun paiement</h3>
                <p className="text-muted-foreground">
                  Créez votre premier paiement avancé pour commencer
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          payments.map((payment) => (
            <Card key={payment.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <h3 className="font-semibold text-lg">
                        {payment.transaction_id ? `#${payment.transaction_id.slice(-8)}` : 'Paiement'}
                      </h3>
                      {getStatusBadge(payment.status)}
                      {getPaymentTypeBadge(payment.payment_type)}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4 text-green-600" />
                        <span className="font-semibold text-green-600">
                          {payment.amount.toLocaleString()} {payment.currency}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CreditCard className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{getMethodLabel(payment.payment_method)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{formatDate(payment.created_at)}</span>
                      </div>
                    </div>

                    {/* Informations spécifiques au type de paiement */}
                    {payment.payment_type === 'percentage' && (
                      <div className="bg-blue-50 dark:bg-blue-950 p-3 rounded-lg mb-4">
                        <div className="flex items-center gap-2 mb-2">
                          <Percent className="h-4 w-4 text-blue-600" />
                          <span className="font-medium text-blue-900 dark:text-blue-100">
                            Paiement par pourcentage
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div>
                            <span className="text-muted-foreground">Pourcentage payé:</span>
                            <span className="font-medium ml-1">{payment.percentage_rate}%</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Montant restant:</span>
                            <span className="font-medium ml-1">
                              {payment.remaining_amount?.toLocaleString()} {payment.currency}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}

                    {payment.payment_type === 'delivery_secured' && (
                      <div className="bg-orange-50 dark:bg-orange-950 p-3 rounded-lg mb-4">
                        <div className="flex items-center gap-2 mb-2">
                          <Shield className="h-4 w-4 text-orange-600" />
                          <span className="font-medium text-orange-900 dark:text-orange-100">
                            Paiement sécurisé
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div>
                            <span className="text-muted-foreground">Statut:</span>
                            <span className="font-medium ml-1">
                              {payment.is_held ? 'Retenu' : 'Libéré'}
                            </span>
                          </div>
                          {payment.held_until && (
                            <div>
                              <span className="text-muted-foreground">Retenu jusqu'au:</span>
                              <span className="font-medium ml-1">
                                {new Date(payment.held_until).toLocaleDateString('fr-FR')}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Informations sur les clients et commandes */}
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      {payment.customers && (
                        <div className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          <span>{payment.customers.name}</span>
                        </div>
                      )}
                      {payment.orders && (
                        <div className="flex items-center gap-1">
                          <Package className="h-3 w-3" />
                          <span>Commande #{payment.orders.order_number}</span>
                        </div>
                      )}
                    </div>

                    {payment.notes && (
                      <div className="mt-3 p-2 bg-muted rounded text-sm">
                        <span className="font-medium">Notes:</span> {payment.notes}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {/* TODO: Voir les détails */}}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      Voir
                    </Button>
                    
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {payment.is_held && payment.status === 'held' && (
                          <DropdownMenuItem onClick={() => handleReleasePayment(payment)}>
                            <Unlock className="h-4 w-4 mr-2" />
                            Libérer le paiement
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem onClick={() => {
                          setSelectedPayment(payment);
                          setShowDisputeDialog(true);
                        }}>
                          <AlertTriangle className="h-4 w-4 mr-2" />
                          Ouvrir un litige
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          onClick={() => handleDeletePayment(payment)}
                          className="text-destructive"
                        >
                          <XCircle className="h-4 w-4 mr-2" />
                          Supprimer
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Dialog de litige */}
      <AlertDialog open={showDisputeDialog} onOpenChange={setShowDisputeDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Ouvrir un litige</AlertDialogTitle>
            <AlertDialogDescription>
              Vous êtes sur le point d'ouvrir un litige pour ce paiement. 
              Cette action sera visible par l'administrateur et peut affecter le statut du paiement.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="dispute-reason">Raison du litige</Label>
              <Select value={disputeReason} onValueChange={setDisputeReason}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionnez une raison" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="delivery_issue">Problème de livraison</SelectItem>
                  <SelectItem value="product_issue">Problème avec le produit</SelectItem>
                  <SelectItem value="payment_issue">Problème de paiement</SelectItem>
                  <SelectItem value="communication_issue">Problème de communication</SelectItem>
                  <SelectItem value="other">Autre</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="dispute-description">Description détaillée</Label>
              <Textarea
                id="dispute-description"
                value={disputeDescription}
                onChange={(e) => setDisputeDescription(e.target.value)}
                placeholder="Décrivez le problème en détail..."
                rows={4}
              />
            </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleOpenDispute}
              disabled={!disputeReason || !disputeDescription}
            >
              Ouvrir le litige
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

// Composant de formulaire de paiement
interface PaymentFormProps {
  storeId: string;
  orderId?: string;
  customerId?: string;
  onCreatePayment: (result: any) => void;
}

const PaymentForm: React.FC<PaymentFormProps> = ({
  storeId,
  orderId,
  customerId,
  onCreatePayment,
}) => {
  const [paymentType, setPaymentType] = useState<PaymentType>('full');
  const [formData, setFormData] = useState({
    amount: '',
    currency: 'XOF',
    payment_method: 'mobile_money',
    percentage_rate: 30,
    notes: '',
  });

  const { createPayment, createPercentagePayment, createSecuredPayment } = useAdvancedPayments(storeId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const amount = parseFloat(formData.amount);
    if (isNaN(amount) || amount <= 0) {
      onCreatePayment({ success: false, error: "Montant invalide" });
      return;
    }

    const options = {
      storeId,
      orderId,
      customerId,
      amount,
      currency: formData.currency,
      paymentMethod: formData.payment_method,
      notes: formData.notes,
    };

    let result;
    switch (paymentType) {
      case 'percentage':
        result = await createPercentagePayment({
          ...options,
          percentageRate: formData.percentage_rate,
          remainingAmount: amount * (1 - formData.percentage_rate / 100),
        });
        break;
      case 'delivery_secured':
        result = await createSecuredPayment({
          ...options,
          holdReason: 'delivery_confirmation',
          releaseConditions: {
            delivery_confirmed: true,
            customer_satisfied: true,
          },
          heldUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 jours
        });
        break;
      default:
        result = await createPayment(options);
    }

    onCreatePayment(result);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="payment-type">Type de paiement</Label>
        <Select value={paymentType} onValueChange={(value: PaymentType) => setPaymentType(value)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="full">Paiement complet</SelectItem>
            <SelectItem value="percentage">Paiement par pourcentage</SelectItem>
            <SelectItem value="delivery_secured">Paiement sécurisé (à la livraison)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="amount">Montant</Label>
          <Input
            id="amount"
            type="number"
            step="0.01"
            value={formData.amount}
            onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
            required
          />
        </div>
        <div>
          <Label htmlFor="currency">Devise</Label>
          <Select value={formData.currency} onValueChange={(value) => setFormData({ ...formData, currency: value })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="XOF">XOF</SelectItem>
              <SelectItem value="EUR">EUR</SelectItem>
              <SelectItem value="USD">USD</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <Label htmlFor="payment-method">Méthode de paiement</Label>
        <Select value={formData.payment_method} onValueChange={(value) => setFormData({ ...formData, payment_method: value })}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="mobile_money">Mobile Money</SelectItem>
            <SelectItem value="card">Carte bancaire</SelectItem>
            <SelectItem value="bank_transfer">Virement bancaire</SelectItem>
            <SelectItem value="cash">Espèces</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {paymentType === 'percentage' && (
        <div>
          <Label htmlFor="percentage-rate">Pourcentage à payer</Label>
          <Input
            id="percentage-rate"
            type="number"
            min="1"
            max="99"
            value={formData.percentage_rate}
            onChange={(e) => setFormData({ ...formData, percentage_rate: parseInt(e.target.value) })}
            required
          />
          <p className="text-sm text-muted-foreground mt-1">
            Le client paiera {formData.percentage_rate}% maintenant et le reste après validation
          </p>
        </div>
      )}

      {paymentType === 'delivery_secured' && (
        <div className="bg-orange-50 dark:bg-orange-950 p-3 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <Shield className="h-4 w-4 text-orange-600" />
            <span className="font-medium text-orange-900 dark:text-orange-100">
              Paiement sécurisé
            </span>
          </div>
          <p className="text-sm text-orange-800 dark:text-orange-200">
            Le montant sera retenu par la plateforme jusqu'à confirmation de livraison par le client.
            En cas de problème, la somme reste bloquée jusqu'à résolution.
          </p>
        </div>
      )}

      <div>
        <Label htmlFor="notes">Notes (optionnel)</Label>
        <Textarea
          id="notes"
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          rows={3}
        />
      </div>

      <div className="flex justify-end gap-2">
        <Button type="submit">
          Créer le paiement
        </Button>
      </div>
    </form>
  );
};

export default AdvancedPaymentsComponent;
