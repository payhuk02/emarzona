import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { CheckCircle, ArrowRight, Loader2, Shield } from "lucide-react";
import { loadMonerooPayment } from "@/lib/moneroo-lazy";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { logger } from "@/lib/logger";
import { SEOMeta } from "@/components/seo/SEOMeta";

const CheckoutSuccess = () => {
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [transaction, setTransaction] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [product, setProduct] = useState<any>(null);

  const transactionId = searchParams.get("transaction_id");

  useEffect(() => {
    const verifyTransaction = async () => {
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

        // Charger le produit lié pour afficher les conditions de licence
        if (result?.product_id) {
          const { data: prod } = await supabase
            .from('products')
            .select('id,name,licensing_type,license_terms')
            .eq('id', result.product_id)
            .single();
          if (prod) setProduct(prod);
        }
      } catch (err: unknown) {
        logger.error("Verification error", { error: err });
        const errorObj = err instanceof Error ? err : new Error(String(err));
        setError(errorObj.message || "Erreur lors de la vérification du paiement");
      } finally {
        setLoading(false);
      }
    };

    verifyTransaction();
  }, [transactionId]);

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
