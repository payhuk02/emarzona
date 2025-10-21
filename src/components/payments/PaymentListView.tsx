import { Payment } from "@/hooks/usePayments";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Edit, 
  Trash2, 
  Copy, 
  ExternalLink, 
  Eye, 
  CreditCard,
  Calendar,
  DollarSign,
  User,
  Receipt,
  MoreVertical,
  CheckCircle,
  XCircle,
  Clock,
  RotateCcw
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface PaymentListViewProps {
  payment: Payment;
  onEdit: () => void;
  onDelete: () => void;
  onView: () => void;
}

const PaymentListView = ({
  payment,
  onEdit,
  onDelete,
  onView,
}: PaymentListViewProps) => {
  const { toast } = useToast();

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      pending: "secondary",
      completed: "default",
      failed: "destructive",
      refunded: "outline",
    };

    const labels: Record<string, string> = {
      pending: "En attente",
      completed: "Complété",
      failed: "Échoué",
      refunded: "Remboursé",
    };

    const icons: Record<string, React.ReactNode> = {
      pending: <Clock className="h-3 w-3" />,
      completed: <CheckCircle className="h-3 w-3" />,
      failed: <XCircle className="h-3 w-3" />,
      refunded: <RotateCcw className="h-3 w-3" />,
    };

    return (
      <Badge variant={variants[status] || "default"} className="flex items-center gap-1">
        {icons[status]}
        {labels[status] || status}
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
          title: "ID copié",
          description: "L'ID de transaction a été copié dans le presse-papiers",
        });
      } catch (error) {
        toast({
          title: "Erreur",
          description: "Impossible de copier l'ID",
          variant: "destructive",
        });
      }
    }
  };

  return (
    <Card className="hover:shadow-md transition-shadow border-border/50">
      <CardContent className="p-4">
        <div className="flex items-center gap-4">
          {/* Icône de méthode de paiement */}
          <div className="flex-shrink-0">
            <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center">
              {getMethodIcon(payment.payment_method)}
            </div>
          </div>

          {/* Contenu principal */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold text-lg truncate hover:text-primary transition-colors">
                    {payment.transaction_id ? `#${payment.transaction_id.slice(-8)}` : 'Paiement'}
                  </h3>
                  {getStatusBadge(payment.status)}
                </div>
                
                <div className="flex items-center gap-4 text-sm text-muted-foreground mb-2">
                  <div className="flex items-center gap-1">
                    <User className="h-3 w-3" />
                    <span>{payment.customers?.name || 'Client anonyme'}</span>
                  </div>
                  
                  {payment.orders?.order_number && (
                    <div className="flex items-center gap-1">
                      <Receipt className="h-3 w-3" />
                      <span>{payment.orders.order_number}</span>
                    </div>
                  )}
                  
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    <span>{formatDate(payment.created_at)}</span>
                  </div>
                </div>

                <div className="flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-1">
                    <DollarSign className="h-4 w-4 text-green-600" />
                    <span className="font-semibold text-green-600">
                      {payment.amount.toLocaleString()} {payment.currency}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-1 text-muted-foreground">
                    {getMethodIcon(payment.payment_method)}
                    <span>{getMethodLabel(payment.payment_method)}</span>
                  </div>
                </div>

                {payment.notes && (
                  <p className="text-sm text-muted-foreground mt-2 line-clamp-1">
                    {payment.notes}
                  </p>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 ml-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onEdit}
                >
                  <Edit className="h-4 w-4 mr-1" />
                  Modifier
                </Button>
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuItem onClick={onView}>
                      <Eye className="h-4 w-4 mr-2" />
                      Voir les détails
                    </DropdownMenuItem>
                    {payment.transaction_id && (
                      <DropdownMenuItem onClick={handleCopyTransactionId}>
                        <Copy className="h-4 w-4 mr-2" />
                        Copier l'ID
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={onDelete} className="text-destructive">
                      <Trash2 className="h-4 w-4 mr-2" />
                      Supprimer
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default PaymentListView;
