import React from 'react';
import { Payment } from '@/hooks/usePayments';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Edit,
  Trash2,
  Copy,
  ExternalLink,
  Eye,
  EyeOff,
  CreditCard,
  Calendar,
  DollarSign,
  User,
  Receipt,
  MoreVertical,
  CheckCircle,
  XCircle,
  Clock,
  RotateCcw,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select";
import { useState } from 'react';

interface PaymentCardDashboardProps {
  payment: Payment;
  onEdit: () => void;
  onDelete: () => void;
  onView: () => void;
}

const PaymentCardDashboardComponent = ({
  payment,
  onEdit,
  onDelete,
  onView,
}: PaymentCardDashboardProps) => {
  const { toast } = useToast();

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      pending: 'secondary',
      completed: 'default',
      failed: 'destructive',
      refunded: 'outline',
    };

    const labels: Record<string, string> = {
      pending: 'En attente',
      completed: 'Complété',
      failed: 'Échoué',
      refunded: 'Remboursé',
    };

    const icons: Record<string, React.ReactNode> = {
      pending: <Clock className="h-3 w-3" />,
      completed: <CheckCircle className="h-3 w-3" />,
      failed: <XCircle className="h-3 w-3" />,
      refunded: <RotateCcw className="h-3 w-3" />,
    };

    return (
      <Badge variant={variants[status] || 'default'} className="flex items-center gap-1">
        {icons[status]}
        {labels[status] || status}
      </Badge>
    );
  };

  const getMethodLabel = (method: string) => {
    const labels: Record<string, string> = {
      cash: 'Espèces',
      card: 'Carte bancaire',
      mobile_money: 'Mobile Money',
      bank_transfer: 'Virement bancaire',
      check: 'Chèque',
      other: 'Autre',
    };
    return labels[method] || method;
  };

  const getMethodIcon = (method: string) => {
    const icons: Record<string, React.ReactNode> = {
      cash: <DollarSign className="h-4 w-4" />,
      card: <CreditCard className="h-4 w-4" />,
      mobile_money: <CreditCard className="h-4 w-4" />,
      bank_transfer: <Receipt className="h-4 w-4" />,
      check: <Receipt className="h-4 w-4" />,
      other: <CreditCard className="h-4 w-4" />,
    };
    return icons[method] || <CreditCard className="h-4 w-4" />;
  };

  const handleCopyTransactionId = async () => {
    if (payment.transaction_id) {
      try {
        await navigator.clipboard.writeText(payment.transaction_id);
        toast({
          title: 'ID copié',
          description: "L'ID de transaction a été copié dans le presse-papiers",
        });
      } catch (error) {
        toast({
          title: 'Erreur',
          description: "Impossible de copier l'ID",
          variant: 'destructive',
        });
      }
    }
  };

  return (
    <Card className="group shadow-medium hover:shadow-lg transition-all duration-200 border-border/50 hover:border-primary/20">
      <CardHeader className="p-4 pb-2">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-lg leading-tight group-hover:text-primary transition-colors">
              {payment.transaction_id ? `#${payment.transaction_id.slice(-8)}` : 'Paiement'}
            </CardTitle>
            <CardDescription className="mt-1 text-sm">
              {payment.customers?.name || 'Client anonyme'}
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">{getStatusBadge(payment.status)}</div>
        </div>
      </CardHeader>

      <CardContent className="p-4 pt-0 space-y-3">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-green-600" />
              <span className="text-xl font-bold text-green-600">
                {payment.amount.toLocaleString()} {payment.currency}
              </span>
            </div>
            <div className="flex items-center gap-1 text-muted-foreground">
              {getMethodIcon(payment.payment_method)}
              <span className="text-sm">{getMethodLabel(payment.payment_method)}</span>
            </div>
          </div>

          {payment.orders?.order_number && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Receipt className="h-3 w-3" />
              <span>Commande: {payment.orders.order_number}</span>
            </div>
          )}

          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="h-3 w-3" />
            <span>{formatDate(payment.created_at)}</span>
          </div>

          {payment.notes && (
            <div className="text-sm text-muted-foreground">
              <p className="line-clamp-2">{payment.notes}</p>
            </div>
          )}
        </div>

        <div className="flex gap-2 pt-2">
          <Button variant="outline" size="sm" className="flex-1" onSelect={onEdit}>
            <Edit className="h-4 w-4 mr-1" />
            Modifier
          </Button>

          <StableDropdownMenu
            triggerProps={{
              variant: 'outline' as const,
              size: 'sm' as const,
              'aria-label': 'Actions pour la carte de paiement',
            }}
            triggerContent={<MoreVertical className="h-4 w-4" />}
          >
            <SelectItem value="edit" onSelect onSelect={onView}>
              <span className="flex items-center">
                <Eye className="h-4 w-4 mr-2" />
                Voir les détails
              </span>
            </SelectItem>
            {payment.transaction_id && (
              <SelectItem value="delete" onSelect onSelect={handleCopyTransactionId}>
                <span className="flex items-center">
                  <Copy className="h-4 w-4 mr-2" />
                  Copier l'ID
                </span>
              </SelectItem>
            )}
            <StableDropdownMenuSeparator />
            <SelectItem value="copy" onSelect onSelect={onDelete} className="text-destructive">
              <span className="flex items-center">
                <Trash2 className="h-4 w-4 mr-2" />
                Supprimer
              </span>
            </SelectItem>
          </Select>
        </div>
      </CardContent>
    </Card>
  );
};

// Optimisation avec React.memo pour éviter les re-renders inutiles
const PaymentCardDashboard = React.memo(PaymentCardDashboardComponent, (prevProps, nextProps) => {
  return (
    prevProps.payment.id === nextProps.payment.id &&
    prevProps.payment.status === nextProps.payment.status &&
    prevProps.payment.amount === nextProps.payment.amount &&
    prevProps.payment.created_at === nextProps.payment.created_at &&
    prevProps.onEdit === nextProps.onEdit &&
    prevProps.onDelete === nextProps.onDelete &&
    prevProps.onView === nextProps.onView
  );
});

PaymentCardDashboard.displayName = 'PaymentCardDashboard';

export default PaymentCardDashboard;
