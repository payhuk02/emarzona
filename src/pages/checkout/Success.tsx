import { useEffect, useState, useCallback } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { CheckCircle, ArrowRight, Loader2, Shield, Star, Gift } from "lucide-react";
import { loadMonerooPayment } from "@/lib/moneroo-lazy";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { logger } from "@/lib/logger";
import { useAdvancedLoyalty } from "@/hooks/useAdvancedLoyalty";
import { useRecommendationTracking } from "@/hooks/useRecommendationTracking";
import type { Database } from "@/integrations/supabase/types";

const CheckoutSuccess = () => {
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [transaction, setTransaction] = useState<Database['public']['Tables']['transactions']['Row'] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [product, setProduct] = useState<Database['public']['Tables']['products']['Row'] | null>(null);
  const [loyaltyReward, setLoyaltyReward] = useState<{ points: number; tier?: string } | null>(null);

  const { triggerLoyaltyEvent } = useAdvancedLoyalty();
  const { trackRecommendationPurchase } = useRecommendationTracking();
  const transactionId = searchParams.get("transaction_id");

  const verifyTransaction = useCallback(async () => {
      if (!transactionId) {
        setError("ID de transaction manquant");
        setLoading(false);
        return;
      }

      try {
        // Charger le module Moneroo de manière asynchrone
        const { verifyTransactionStatus } = await loadMonerooPayment();
        const result = await verifyTransactionStatus(transactionId);
        setTransaction(result);

        if (result.status === "processing") {
          setTimeout(() => verifyTransaction(), 3000);
        }

        // Déclencher l'événement de fidélisation pour l'achat réussi
        if (result.status === "completed" && result.customer_id) {
          try {
            const reward = await triggerLoyaltyEvent('purchase', {
              orderId: result.id,
              amount: result.amount || 0,
              currency: result.currency || 'XAF',
              storeId: result.store_id,
              customerId: result.customer_id
            });
            setLoyaltyReward(reward);
              logger.info("Loyalty points awarded for purchase", { orderId: result.id, reward });
            } catch (loyaltyError) {
              logger.error("Failed to award loyalty points", { error: loyaltyError, orderId: result.id });
            }

            // Tracker l'achat pour les recommandations IA
            try {
              await trackRecommendationPurchase(result.product_id || '', 'purchase');
              logger.info("Purchase tracked for recommendations", { productId: result.product_id, orderId: result.id });
            } catch (trackingError) {
              logger.error("Failed to track recommendation purchase", { error: trackingError, orderId: result.id });
            }
        }

        // Charger le produit lié pour afficher les conditions de licence
        if (result?.product_id) {
          const { data: prod } = await supabase
            .from('products')
            .select('id,name,licensing_type,license_terms')
            .eq('id', result.product_id)
            .single();
          if (prod) setProduct(prod);
        }
      } catch (_err: unknown) {
        logger.error("Verification error", { error: _err });
        const errorObj = _err instanceof Error ? _err : new Error(String(_err));
        setError(errorObj.message || "Erreur lors de la vérification du paiement");
      } finally {
        setLoading(false);
      }
    };
  }, [triggerLoyaltyEvent]);

  useEffect(() => {
    if (transactionId) {
      verifyTransaction();
    }
  }, [transactionId, verifyTransaction]);
    if (transactionId) {
      verifyTransaction();
    }
  }, [transactionId, verifyTransaction]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-primary/5 to-background px-4">
        <Loader2 className="h-12 w-12 text-primary animate-spin mb-4" />
        <p className="text-muted-foreground">Vérification du paiement...</p>
      </div>
    );
  }

  if (error || !transaction) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-destructive/5 to-background px-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <p className="text-destructive font-medium mb-4">
              {error || "Transaction introuvable"}
            </p>
            <Link to="/marketplace">
              <Button>Retour au marketplace</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isCompleted = transaction.status === "completed";
  const isProcessing = transaction.status === "processing";

  return (
    <div className="min-h-screen flex flex-col items-center justify-center text-center bg-gradient-to-b from-green-50 to-white dark:from-green-950/20 dark:to-background px-4">
      {isCompleted ? (
        <CheckCircle className="h-20 w-20 text-green-500 mb-6 animate-in zoom-in duration-300" />
      ) : (
        <Loader2 className="h-20 w-20 text-yellow-500 mb-6 animate-spin" />
      )}

      <h1 className="text-3xl font-bold text-foreground mb-2">
        {isCompleted
          ? "Paiement réussi 🎉"
          : isProcessing
          ? "Paiement en cours ⏳"
          : "Statut du paiement"}
      </h1>

      <Card className="max-w-md w-full my-6">
        <CardContent className="pt-6">
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Montant</span>
              <span className="font-medium">
                {transaction.amount?.toLocaleString()} {transaction.currency}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Statut</span>
              <span
                className={`font-medium ${
                  isCompleted
                    ? "text-green-600"
                    : isProcessing
                    ? "text-yellow-600"
                    : "text-gray-600"
                }`}
              >
                {isCompleted
                  ? "Complété"
                  : isProcessing
                  ? "En cours"
                  : transaction.status}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Transaction ID</span>
              <span className="font-mono text-xs">{transaction.id.slice(0, 8)}...</span>
            </div>
            {transaction.customer_email && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Email</span>
                <span className="text-xs truncate max-w-[200px]">{transaction.customer_email}</span>
              </div>
            )}
            {/* Affichage des récompenses de fidélité */}
            {isCompleted && loyaltyReward && (
              <div className="border-t pt-3 mt-3">
                <div className="flex items-center justify-between bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-950/20 dark:to-yellow-950/20 p-3 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Star className="h-4 w-4 text-amber-500" />
                    <span className="text-sm font-medium text-amber-700 dark:text-amber-300">
                      Récompense Fidélité !
                    </span>
                  </div>
                  <span className="font-bold text-amber-600 dark:text-amber-400">
                    +{loyaltyReward.points} pts
                  </span>
                </div>
                {loyaltyReward.tier && (
                  <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                    <Gift className="h-3 w-3" />
                    <span>Nouveau niveau : <strong className="text-amber-600">{loyaltyReward.tier}</strong></span>
                  </div>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Note licence pour produits/cours numériques */}
      {product?.licensing_type && (
        <Card className="max-w-md w-full my-2">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <div className={`h-8 w-8 rounded-full flex items-center justify-center ${product.licensing_type === 'plr' ? 'bg-emerald-100' : product.licensing_type === 'copyrighted' ? 'bg-red-100' : 'bg-gray-100'}`}>
                <Shield className={`h-4 w-4 ${product.licensing_type === 'plr' ? 'text-emerald-700' : product.licensing_type === 'copyrighted' ? 'text-red-700' : 'text-gray-700'}`} />
              </div>
              <div className="text-left text-sm">
                <p className="font-semibold">
                  {product.licensing_type === 'plr' ? 'Licence PLR (droits de label privé)' : product.licensing_type === 'copyrighted' ? "Protégé par droit d'auteur" : 'Licence standard'}
                </p>
                {product.license_terms ? (
                  <p className="text-muted-foreground mt-1 whitespace-pre-wrap">{product.license_terms}</p>
                ) : (
                  <p className="text-muted-foreground mt-1">Veuillez respecter les conditions d'utilisation de ce contenu.</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <p className="text-muted-foreground max-w-md mb-8">
        {isCompleted
          ? "Merci pour votre achat ! Votre paiement a été confirmé avec succès."
          : isProcessing
          ? "Votre paiement est en cours de traitement. Veuillez patienter..."
          : "Votre transaction a été enregistrée."}
      </p>

      <div className="flex flex-col sm:flex-row gap-3">
        <Link to="/marketplace">
          <Button variant="outline" size="lg">
            Retour au marketplace
          </Button>
        </Link>
        {isCompleted && (
          <Link to="/dashboard">
            <Button size="lg" className="gap-2">
              Voir mes commandes
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        )}
      </div>
    </div>
  );
};

export default CheckoutSuccess;






