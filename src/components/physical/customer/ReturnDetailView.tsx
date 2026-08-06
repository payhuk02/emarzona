/**
 * ReturnDetailView - Vue détaillée d'un retour avec timeline
 * Date: 2025-01-27
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useReturn } from '@/hooks/returns/useReturns';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { RotateCcw, CheckCircle2, Clock } from 'lucide-react';

interface ReturnDetailViewProps {
  returnId: string;
}

const STATUS_LABELS: Record<string, string> = {
  requested: 'En attente',
  approved: 'Approuvé',
  rejected: 'Rejeté',
  pending_pickup: 'Récupération',
  in_transit: 'En transit',
  received: 'Reçu',
  inspecting: 'En inspection',
  refunded: 'Remboursé',
  exchanged: 'Échangé',
  replaced: 'Remplacé',
  cancelled: 'Annulé',
};

export const ReturnDetailView = ({ returnId }: ReturnDetailViewProps) => {
  const { data: returnData, isLoading, error } = useReturn(returnId);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (error || !returnData) {
    return (
      <Alert variant="destructive">
        <AlertDescription>
          Erreur lors du chargement du retour. Veuillez réessayer.
        </AlertDescription>
      </Alert>
    );
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      requested: 'secondary',
      approved: 'default',
      rejected: 'destructive',
      pending_pickup: 'secondary',
      in_transit: 'default',
      received: 'default',
      inspecting: 'secondary',
      refunded: 'outline',
      exchanged: 'default',
      replaced: 'default',
      cancelled: 'destructive',
    };

    return <Badge variant={variants[status] || 'default'}>{STATUS_LABELS[status] || status}</Badge>;
  };

  const statusTimeline = [
    { key: 'requested', label: 'Demandé', date: returnData.requested_at },
    { key: 'approved', label: 'Approuvé', date: returnData.approved_at },
    { key: 'received', label: 'Reçu', date: returnData.received_at },
    { key: 'inspecting', label: 'En inspection', date: returnData.received_at },
    { key: 'refunded', label: 'Remboursé', date: returnData.refunded_at },
  ].filter(item => item.date);

  const productName = returnData.products?.name ?? 'Produit';

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RotateCcw className="h-5 w-5" />
            Détails du retour
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Numéro de retour</p>
              <p className="font-medium">{returnData.return_number}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Statut</p>
              <div className="mt-1">{getStatusBadge(returnData.status)}</div>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Produit</p>
              <p className="font-medium">{productName}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Quantité</p>
              <p className="font-medium">{returnData.quantity}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Raison</p>
              <Badge variant="outline" className="mt-1">
                {returnData.return_reason.replace(/_/g, ' ')}
              </Badge>
            </div>
            {returnData.refund_amount != null && (
              <div>
                <p className="text-sm text-muted-foreground">Montant remboursé</p>
                <p className="font-medium">
                  {returnData.refund_amount.toLocaleString('fr-FR', {
                    style: 'currency',
                    currency: 'XOF',
                  })}
                </p>
              </div>
            )}
          </div>

          {returnData.return_reason_details && (
            <div>
              <p className="text-sm text-muted-foreground mb-2">Détails de la raison</p>
              <p className="text-sm">{returnData.return_reason_details}</p>
            </div>
          )}

          {returnData.customer_notes && (
            <div>
              <p className="text-sm text-muted-foreground mb-2">Notes client</p>
              <p className="text-sm">{returnData.customer_notes}</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Historique du retour</CardTitle>
        </CardHeader>
        <CardContent>
          {statusTimeline.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Aucun événement enregistré pour le moment.
            </p>
          ) : (
            <div className="relative pl-8 border-l-2 border-muted">
              {statusTimeline.map((step, index) => {
                const isLast = index === statusTimeline.length - 1;
                const isCurrent = step.key === returnData.status;
                const currentIndex = statusTimeline.findIndex(s => s.key === returnData.status);
                const isCompleted = currentIndex > index;

                return (
                  <div key={step.key} className={`relative ${!isLast ? 'pb-8' : ''}`}>
                    <div className="absolute -left-[13px] top-0">
                      {isCompleted ? (
                        <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center">
                          <CheckCircle2 className="h-4 w-4 text-white" />
                        </div>
                      ) : isCurrent ? (
                        <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center">
                          <Clock className="h-4 w-4 text-white animate-pulse" />
                        </div>
                      ) : (
                        <div className="w-6 h-6 rounded-full bg-muted border-2 border-muted-foreground" />
                      )}
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{step.label}</span>
                        {isCurrent && (
                          <Badge variant="default" className="ml-2">
                            En cours
                          </Badge>
                        )}
                      </div>
                      {step.date && (
                        <p className="text-sm text-muted-foreground pl-6">
                          {format(new Date(step.date), 'dd MMMM yyyy à HH:mm', { locale: fr })}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {returnData.customer_photos && returnData.customer_photos.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Photos du retour</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {returnData.customer_photos.map((photo: string, index: number) => (
                <img
                  key={index}
                  src={photo}
                  alt={`Photo retour ${index + 1}`}
                  className="w-full h-32 object-cover rounded-lg"
                />
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
