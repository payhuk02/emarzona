import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { XCircle, RotateCcw, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";

const CheckoutCancel = () => {
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [transaction, setTransaction] = useState<any>(null);

  const transactionId = searchParams.get("transaction_id");

  useEffect(() => {
    const updateTransaction = async () => {
      if (!transactionId) {
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from("transactions")
          .update({
            status: "cancelled",
          })
          .eq("id", transactionId)
          .select()
          .single();

        if (!error && data) {
          setTransaction(data);

          await supabase.from("transaction_logs").insert([{
            transaction_id: transactionId,
            event_type: "cancelled",
            status: "cancelled",
          }]);
        }
      } catch (err) {
        console.error("Error updating transaction:", err);
      } finally {
        setLoading(false);
      }
    };

    updateTransaction();
  }, [transactionId]);

  const handleRetry = () => {
    window.location.href = "/marketplace";
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-red/5 to-background px-4">
        <Loader2 className="h-12 w-12 text-primary animate-spin mb-4" />
        <p className="text-muted-foreground">Chargement...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center text-center bg-gradient-to-b from-red-50 to-white dark:from-red-950/20 dark:to-background px-4">
      <XCircle className="h-20 w-20 text-red-500 mb-6 animate-in zoom-in duration-300" />

      <h1 className="text-3xl font-bold text-foreground mb-2">
        Paiement annulé ❌
      </h1>

      {transaction && (
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
                <span className="text-red-600 font-medium">Annulé</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Transaction ID</span>
                <span className="font-mono text-xs">{transaction.id.slice(0, 8)}...</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <p className="text-muted-foreground max-w-md mb-8">
        Votre paiement n'a pas été finalisé. Aucun montant n'a été débité.
      </p>

      <div className="flex flex-col sm:flex-row gap-3">
        <Link to="/marketplace">
          <Button variant="outline" size="lg">
            Retour au marketplace
          </Button>
        </Link>
        <Button onClick={handleRetry} size="lg" className="gap-2">
          <RotateCcw className="h-4 w-4" />
          Réessayer le paiement
        </Button>
      </div>
    </div>
  );
};

export default CheckoutCancel;
