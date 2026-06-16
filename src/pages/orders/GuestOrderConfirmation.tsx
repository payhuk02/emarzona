import { Link, useSearchParams } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, Package, ShoppingBag, ArrowRight } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

export default function GuestOrderConfirmation() {
  const [searchParams] = useSearchParams();
  const { user } = useAuth();

  const orderId = searchParams.get('orderId');
  const orderNumber = searchParams.get('orderNumber');
  const productName = searchParams.get('product');
  const isCod = searchParams.get('cod') === '1';

  const displayOrderNumber = orderNumber || orderId?.slice(0, 8) || '—';
  const displayProduct = productName || 'votre produit';

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 p-4">
      <Card className="max-w-lg w-full">
        <CardContent className="p-8 text-center space-y-6">
          <div className="flex justify-center">
            <div className="h-20 w-20 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
              <CheckCircle className="h-12 w-12 text-green-600" />
            </div>
          </div>

          <div className="space-y-2">
            <h1 className="text-2xl sm:text-3xl font-bold text-green-700 dark:text-green-400">
              Commande confirmée
            </h1>
            <p className="text-muted-foreground">
              Merci ! Votre commande pour <strong>{displayProduct}</strong> est bien enregistrée.
            </p>
          </div>

          <div className="rounded-lg border bg-muted/40 p-4 text-left space-y-3 text-sm">
            <div className="flex items-center gap-2 font-medium">
              <Package className="h-4 w-4 text-primary" />
              <span>N° de commande : {displayOrderNumber}</span>
            </div>
            {isCod && (
              <p className="text-muted-foreground">
                Mode de paiement : <strong>paiement à la livraison</strong>. Aucun prélèvement en
                ligne n&apos;a été effectué. Préparez le règlement à la réception de votre colis.
              </p>
            )}
            <p className="text-muted-foreground">
              Un récapitulatif vous sera envoyé par email si vous avez renseigné une adresse valide.
              Conservez votre numéro de commande pour toute question au vendeur.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button asChild variant="default">
              <Link to="/marketplace">
                <ShoppingBag className="h-4 w-4 mr-2" />
                Continuer mes achats
              </Link>
            </Button>
            {user ? (
              <Button asChild variant="outline">
                <Link to="/account/orders">
                  Mes commandes
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Link>
              </Button>
            ) : (
              <Button asChild variant="outline">
                <Link to="/register">
                  Créer un compte
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Link>
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
