import { useState } from "react";
import { geniuspayClient, GeniusPayPaymentData, GeniusPayCheckoutData } from "@/lib/geniuspay-client";
import { useToast } from "@/hooks/use-toast";
import { safeRedirect } from "@/lib/url-validator";

export const useGeniusPay = () => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const createPayment = async (paymentData: GeniusPayPaymentData) => {
    setLoading(true);
    try {
      const result = await geniuspayClient.createPayment(paymentData);
      toast({
        title: "Paiement créé",
        description: "Le paiement a été initialisé avec succès",
      });
      return result;
    } catch ( _error: any) {
      toast({
        title: "Erreur",
        description: _error?.message || "Impossible de créer le paiement",
        variant: "destructive",
      });
      throw _error;
    } finally {
      setLoading(false);
    }
  };

  const createCheckout = async (checkoutData: GeniusPayCheckoutData) => {
    setLoading(true);
    try {
      const result = await geniuspayClient.createCheckout(checkoutData);
      
      // Rediriger vers l'URL de checkout GeniusPay si disponible
      if (result.checkout_url) {
        safeRedirect(result.checkout_url, () => {
          toast({
            title: "Erreur",
            description: "URL de paiement invalide. Veuillez réessayer.",
            variant: "destructive",
          });
        });
      }
      
      return result;
    } catch ( _error: any) {
      toast({
        title: "Erreur",
        description: _error?.message || "Impossible de créer la session de paiement",
        variant: "destructive",
      });
      throw _error;
    } finally {
      setLoading(false);
    }
  };

  const verifyPayment = async (paymentId: string) => {
    setLoading(true);
    try {
      const result = await geniuspayClient.verifyPayment(paymentId);
      return result;
    } catch ( _error: any) {
      toast({
        title: "Erreur",
        description: _error?.message || "Impossible de vérifier le paiement",
        variant: "destructive",
      });
      throw _error;
    } finally {
      setLoading(false);
    }
  };

  const getPayment = async (paymentId: string) => {
    setLoading(true);
    try {
      const result = await geniuspayClient.getPayment(paymentId);
      return result;
    } catch ( _error: any) {
      toast({
        title: "Erreur",
        description: _error?.message || "Impossible de récupérer le paiement",
        variant: "destructive",
      });
      throw _error;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    createPayment,
    createCheckout,
    verifyPayment,
    getPayment,
  };
};






