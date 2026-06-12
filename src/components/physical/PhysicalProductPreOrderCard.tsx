/**
 * Carte précommande acheteur sur fiche produit (Epic 3.2.5)
 */

import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Calendar, Clock, Loader2, Package } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import {
  useProductPreOrder,
  useRegisterProductPreOrder,
  type ProductPreOrderInfo,
} from '@/hooks/physical/useProductPreOrder';
import { cn } from '@/lib/utils';

interface PhysicalProductPreOrderCardProps {
  productId: string;
  variantId?: string | null;
  currency?: string;
  className?: string;
}

function PreOrderCardContent({
  preOrder,
  currency = 'XOF',
  onRegister,
  isRegistering,
  isAuthenticated,
  onSignIn,
}: {
  preOrder: ProductPreOrderInfo;
  currency?: string;
  onRegister: () => void;
  isRegistering: boolean;
  isAuthenticated: boolean;
  onSignIn: () => void;
}) {
  const spotsLabel =
    preOrder.spots_remaining != null
      ? `${preOrder.spots_remaining} place(s) restante(s)`
      : `${preOrder.current_pre_orders} précommande(s)`;

  return (
    <Card className="border-purple-200 bg-purple-50/50 dark:border-purple-900 dark:bg-purple-950/20">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <Package className="h-5 w-5 text-purple-600" />
            Précommande disponible
          </CardTitle>
          <Badge variant="secondary">{spotsLabel}</Badge>
        </div>
        <CardDescription>Réservez votre produit avant l&apos;arrivée en stock.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {preOrder.expected_availability_date && (
          <div className="flex items-center gap-2 text-sm">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span>
              Disponibilité estimée :{' '}
              <strong>
                {format(new Date(preOrder.expected_availability_date), 'PPP', { locale: fr })}
              </strong>
            </span>
          </div>
        )}

        {preOrder.deposit_required && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span>
              Acompte requis
              {preOrder.deposit_amount != null
                ? ` : ${Number(preOrder.deposit_amount).toLocaleString()} ${currency}`
                : preOrder.deposit_percentage != null
                  ? ` : ${preOrder.deposit_percentage}%`
                  : ''}
            </span>
          </div>
        )}

        {preOrder.is_full ? (
          <Button className="w-full" disabled>
            Précommandes complètes
          </Button>
        ) : isAuthenticated ? (
          <Button className="w-full" onClick={onRegister} disabled={isRegistering}>
            {isRegistering ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Inscription...
              </>
            ) : (
              'Précommander'
            )}
          </Button>
        ) : (
          <Button className="w-full" variant="outline" onClick={onSignIn}>
            Connectez-vous pour précommander
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

export function PhysicalProductPreOrderCard({
  productId,
  variantId,
  currency,
  className,
}: PhysicalProductPreOrderCardProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { data: preOrder, isLoading } = useProductPreOrder(productId, variantId);
  const registerPreOrder = useRegisterProductPreOrder();

  if (isLoading) {
    return <Skeleton className={cn('h-40 w-full', className)} />;
  }

  if (!preOrder) return null;

  const handleRegister = () => {
    registerPreOrder.mutate({ preOrderId: preOrder.id, quantity: 1 });
  };

  const handleSignIn = () => {
    navigate('/auth', { state: { returnTo: window.location.pathname } });
  };

  return (
    <div className={className}>
      <PreOrderCardContent
        preOrder={preOrder}
        currency={currency}
        onRegister={handleRegister}
        isRegistering={registerPreOrder.isPending}
        isAuthenticated={!!user}
        onSignIn={handleSignIn}
      />
    </div>
  );
}
