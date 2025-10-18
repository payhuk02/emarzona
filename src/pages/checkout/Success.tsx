import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { CheckCircle, ArrowRight, Loader2 } from "lucide-react";
import { verifyTransactionStatus } from "@/lib/moneroo-payment";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const CheckoutSuccess = () => {
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [transaction, setTransaction] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const transactionId = searchParams.get("transaction_id");

  useEffect(() => {
    const verifyTransaction = async () => {
      if (!transactionId) {
        setError("ID de transaction manquant");
        setLoading(false);
        return;
      }

      try {
        const result = await verifyTransactionStatus(transactionId);
        setTransaction(result);

        if (result.status === "processing") {
          setTimeout(() => verifyTransaction(), 3000);
        }
      } catch (err: any) {
        console.error("Verification error:", err);
        setError(err.message || "Erreur lors de la vérification du paiement");
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
