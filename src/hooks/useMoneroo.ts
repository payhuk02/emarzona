import { useState } from "react";
import { monerooClient, MonerooPaymentData, MonerooCheckoutData } from "@/lib/moneroo-client";
import { useToast } from "@/hooks/use-toast";
import { safeRedirect } from "@/lib/url-validator";

export const useMoneroo = () => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const createPayment = async (paymentData: MonerooPaymentData) => {
    setLoading(true);
    try {
      const result = await monerooClient.createPayment(paymentData);
      toast({
        title: "Paiement créé",
        description: "Le paiement a été initialisé avec succès",
      });
      return result;
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message || "Impossible de créer le paiement",
        variant: "destructive",
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const createCheckout = async (checkoutData: MonerooCheckoutData) => {
    setLoading(true);
    try {
      const result = await monerooClient.createCheckout(checkoutData);
      
      // Rediriger vers l'URL de checkout Moneroo si disponible
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
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message || "Impossible de créer la session de paiement",
        variant: "destructive",
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const verifyPayment = async (paymentId: string) => {
    setLoading(true);
    try {
      const result = await monerooClient.verifyPayment(paymentId);
      return result;
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message || "Impossible de vérifier le paiement",
        variant: "destructive",
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const getPayment = async (paymentId: string) => {
    setLoading(true);
    try {
      const result = await monerooClient.getPayment(paymentId);
      return result;
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message || "Impossible de récupérer le paiement",
        variant: "destructive",
      });
      throw error;
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
