import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, Download, ShoppingBag, ArrowRight } from 'lucide-react';
import { OneClickUpsell } from '@/components/upsell/OneClickUpsell';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';

const PaymentSuccess = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [showUpsell, setShowUpsell] = useState(false);
  const [purchasedProductId, setPurchasedProductId] = useState<string | null>(null);
  const [purchasedProductType, setPurchasedProductType] = useState<string>('digital');

  useEffect(() => {
    // Récupérer les infos de la commande depuis les paramètres URL
    const orderId = searchParams.get('order_id');
    
    if (orderId) {
      loadOrderInfo(orderId);
    }

    // Afficher l'upsell après 2 secondes
    const timer = setTimeout(() => {
      if (purchasedProductId) {
        setShowUpsell(true);
      }
    }, 2000);

    return () => clearTimeout(timer);
  }, [searchParams, purchasedProductId]);

  const loadOrderInfo = async (orderId: string) => {
    try {
      const { data: orderItems } = await supabase
        .from('order_items')
        .select('product_id, product_type')
        .eq('order_id', orderId)
        .limit(1)
        .single();

      if (orderItems) {
        setPurchasedProductId(orderItems.product_id);
        setPurchasedProductType(orderItems.product_type || 'digital');
      }
    } catch (error) {
      logger.error('Error loading order info', { error });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 p-4">
      <Card className="max-w-2xl w-full">
        <CardContent className="p-8 text-center space-y-6">
          <div className="flex justify-center">
            <div className="h-20 w-20 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
              <CheckCircle className="h-12 w-12 text-green-600" />
            </div>
          </div>

          <div>
            <h1 className="text-3xl font-bold text-green-600 mb-2">
              Paiement réussi ! 🎉
            </h1>
            <p className="text-lg text-muted-foreground">
              Merci pour votre achat ! Votre paiement a été confirmé.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              onClick={() => navigate('/account/downloads')}
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Mes Téléchargements
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate('/account/orders')}
              className="flex items-center gap-2"
            >
              <ShoppingBag className="h-4 w-4" />
              Mes Commandes
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate('/marketplace')}
              className="flex items-center gap-2"
            >
              Continuer les achats
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Upsell Popup */}
      {purchasedProductId && (
        <OneClickUpsell
          purchasedProductId={purchasedProductId}
          purchasedProductType={purchasedProductType}
          isOpen={showUpsell}
          onClose={() => setShowUpsell(false)}
        />
      )}
    </div>
  );
};

export default PaymentSuccess;
