import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useMoneroo } from "@/hooks/useMoneroo";
import { logger } from "@/lib/logger";

/**
 * Exemple de composant utilisant Moneroo pour initier un paiement
 * À intégrer où vous voulez accepter des paiements
 */
export const MonerooPaymentExample = () => {
  const { createCheckout, loading } = useMoneroo();
  const [amount, setAmount] = useState("10000");
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");

  const handlePayment = async () => {
    try {
      await createCheckout({
        amount: parseFloat(amount),
        currency: "XOF",
        description: "Achat de produit",
        customer_email: email,
        customer_name: name,
        return_url: `${window.location.origin}/payment/success`,
        cancel_url: `${window.location.origin}/payment/cancel`,
        metadata: {
          source: "web",
          product_id: "example-123",
        },
      });
    } catch (error) {
      logger.error("Erreur paiement", { error, amount, email });
    }
  };

  return (
    <Card className="max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Paiement Moneroo</CardTitle>
        <CardDescription>
          Exemple d'intégration du paiement Moneroo
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">Nom</Label>
          <Input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Votre nom"
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="votre@email.com"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="amount">Montant (XOF)</Label>
          <Input
            id="amount"
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="10000"
          />
        </div>

        <Button 
          onClick={handlePayment} 
          disabled={loading || !email || !name || !amount}
          className="w-full"
        >
          {loading ? "Traitement..." : "Payer maintenant"}
        </Button>
      </CardContent>
    </Card>
  );
};
