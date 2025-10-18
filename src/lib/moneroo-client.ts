import { supabase } from "@/integrations/supabase/client";

export interface MonerooPaymentData {
  amount: number;
  currency?: string;
  description?: string;
  customer?: {
    email?: string;
    name?: string;
    phone?: string;
  };
  metadata?: Record<string, any>;
  return_url?: string;
  cancel_url?: string;
}

export interface MonerooCheckoutData {
  amount: number;
  currency?: string;
  description?: string;
  customer_email?: string;
  customer_name?: string;
  return_url: string;
  cancel_url?: string;
  metadata?: Record<string, any>;
}

class MonerooClient {
  private async callFunction(action: string, data: Record<string, any>) {
    const { data: response, error } = await supabase.functions.invoke("moneroo", {
      body: { action, data },
    });

    if (error) {
      console.error(`[MonerooClient] Supabase function error:`, error);
      throw new Error(error.message || "Erreur de communication avec le serveur.");
    }

    if (!response?.success) {
      console.error(`[MonerooClient] Moneroo API error:`, response);
      throw new Error(response?.error || "Erreur lors de la requête Moneroo.");
    }

    return response.data;
  }

  /** 🔹 Créer un paiement direct */
  async createPayment(paymentData: MonerooPaymentData) {
    return this.callFunction("create_payment", paymentData);
  }

  /** 🔹 Récupérer les détails d’un paiement */
  async getPayment(paymentId: string) {
    return this.callFunction("get_payment", { paymentId });
  }

  /** 🔹 Initialiser une session de checkout Moneroo */
  async createCheckout(checkoutData: MonerooCheckoutData) {
    return this.callFunction("create_checkout", checkoutData);
  }

  /** 🔹 Vérifier le statut d’un paiement */
  async verifyPayment(paymentId: string) {
    return this.callFunction("verify_payment", { paymentId });
  }
}

export const monerooClient = new MonerooClient();
