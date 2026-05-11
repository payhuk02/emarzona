import React from 'react';
import type { Payment } from '@/hooks/usePayments';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Eye, Edit, Trash2, CreditCard, Calendar, DollarSign } from 'lucide-react';

interface PaymentListViewFixedProps {
  payment: Payment;
  onEdit: () => void;
  onDelete: () => void;
  onView: () => void;
}

export default function PaymentListViewFixed({
  payment,
  onEdit,
  onDelete,
  onView,
}: PaymentListViewFixedProps) {
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

    return (
      <Badge variant={variants[status] || 'default'} className="shrink-0">
        {labels[status] || status}
      </Badge>
    );
  };

  return (
    <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-muted-foreground" />
              <p className="font-medium truncate">
                {payment.transaction_id
                  ? `Transaction ${payment.transaction_id}`
                  : `Paiement ${payment.id}`}
              </p>
            </div>

            <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <DollarSign className="h-3.5 w-3.5" />
                {payment.amount.toLocaleString('fr-FR')} {payment.currency}
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" />
                {formatDate(payment.created_at)}
              </span>
            </div>

            <div className="mt-2 flex flex-wrap items-center gap-2">
              {getStatusBadge(payment.status)}
              {payment.customers?.name && (
                <Badge variant="outline" className="max-w-full truncate">
                  {payment.customers.name}
                </Badge>
              )}
              {payment.orders?.order_number && (
                <Badge variant="outline" className="max-w-full truncate">
                  Cmd {payment.orders.order_number}
                </Badge>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Button variant="outline" size="icon" onClick={onView} aria-label="Voir le paiement">
              <Eye className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={onEdit}
              aria-label="Modifier le paiement"
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={onDelete}
              aria-label="Supprimer le paiement"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
