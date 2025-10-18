import { supabase } from "@/integrations/supabase/client";
import { monerooClient, MonerooCheckoutData } from "./moneroo-client";

export interface PaymentOptions {
  storeId: string;
  productId?: string;
  orderId?: string;
  customerId?: string;
  amount: number;
  currency?: string;
  description: string;
  customerEmail?: string;
  customerName?: string;
  customerPhone?: string;
  metadata?: Record<string, any>;
}

/**
 * Initie un paiement Moneroo complet avec tracking dans la base de données
 */
export const initiateMonerooPayment = async (options: PaymentOptions) => {
  const {
    storeId,
    productId,
    orderId,
    customerId,
    amount,
    currency = "XOF",
    description,
    customerEmail,
    customerName,
    customerPhone,
    metadata = {},
  } = options;

  try {
    // 1. Créer la transaction dans la base de données
    const { data: transaction, error: transactionError } = await supabase
      .from("transactions")
      .insert({
        store_id: storeId,
        product_id: productId,
        order_id: orderId,
        customer_id: customerId,
        amount,
        currency,
        status: "pending",
        customer_email: customerEmail,
        customer_name: customerName,
        customer_phone: customerPhone,
        metadata,
      })
      .select()
      .single();

    if (transactionError) {
      console.error("Error creating transaction:", transactionError);
      throw new Error("Impossible de créer la transaction");
    }

    console.log("Transaction created:", transaction.id);

    // 2. Log de création de transaction
    await supabase.from("transaction_logs").insert([{
      transaction_id: transaction.id,
      event_type: "created",
      status: "pending",
      request_data: JSON.parse(JSON.stringify(options)),
    }]);

    // 3. Initialiser le paiement Moneroo
    const checkoutData: MonerooCheckoutData = {
      amount,
      currency,
      description,
      customer_email: customerEmail,
      customer_name: customerName,
      return_url: `${window.location.origin}/checkout/success?transaction_id=${transaction.id}`,
      cancel_url: `${window.location.origin}/checkout/cancel?transaction_id=${transaction.id}`,
      metadata: {
        transaction_id: transaction.id,
        store_id: storeId,
        ...metadata,
      },
    };

    console.log("Initiating Moneroo checkout:", checkoutData);

    const monerooResponse = await monerooClient.createCheckout(checkoutData);

    console.log("Moneroo response:", monerooResponse);

    // 4. Mettre à jour la transaction avec les infos Moneroo
    const { error: updateError } = await supabase
      .from("transactions")
      .update({
        moneroo_transaction_id: monerooResponse.transaction_id || monerooResponse.id,
        moneroo_checkout_url: monerooResponse.checkout_url,
        moneroo_response: monerooResponse,
        status: "processing",
      })
      .eq("id", transaction.id);

    if (updateError) {
      console.error("Error updating transaction:", updateError);
    }

    // 5. Log du paiement initié
    await supabase.from("transaction_logs").insert([{
      transaction_id: transaction.id,
      event_type: "payment_initiated",
      status: "processing",
      response_data: monerooResponse,
    }]);

    // 6. Retourner les données pour redirection
    return {
      success: true,
      transaction_id: transaction.id,
      checkout_url: monerooResponse.checkout_url,
      moneroo_transaction_id: monerooResponse.transaction_id || monerooResponse.id,
    };
  } catch (error: any) {
    console.error("Payment initiation error:", error);
    throw error;
  }
};

/**
 * Vérifie le statut d'une transaction et met à jour la base de données
 */
export const verifyTransactionStatus = async (transactionId: string) => {
  try {
    // Récupérer la transaction
    const { data: transaction, error: fetchError } = await supabase
      .from("transactions")
      .select("*")
      .eq("id", transactionId)
      .single();

    if (fetchError || !transaction) {
      throw new Error("Transaction introuvable");
    }

    // Si la transaction a déjà un statut final, retourner directement
    if (["completed", "failed", "cancelled"].includes(transaction.status)) {
      return transaction;
    }

    // Vérifier auprès de Moneroo si on a un ID de transaction
    if (transaction.moneroo_transaction_id) {
      try {
        const monerooStatus = await monerooClient.verifyPayment(
          transaction.moneroo_transaction_id
        );

        // Mettre à jour selon le statut Moneroo
        const statusMap: Record<string, string> = {
          completed: "completed",
          success: "completed",
          failed: "failed",
          pending: "processing",
          cancelled: "cancelled",
        };

        const newStatus = statusMap[monerooStatus.status] || "processing";

        const updates: any = {
          status: newStatus,
          moneroo_payment_method: monerooStatus.payment_method,
          moneroo_response: monerooStatus,
        };

        if (newStatus === "completed") {
          updates.completed_at = new Date().toISOString();
        } else if (newStatus === "failed") {
          updates.failed_at = new Date().toISOString();
          updates.error_message = monerooStatus.error_message || "Paiement échoué";
        }

        await supabase
          .from("transactions")
          .update(updates)
          .eq("id", transactionId);

        // Log de vérification
        await supabase.from("transaction_logs").insert([{
          transaction_id: transactionId,
          event_type: "status_updated",
          status: newStatus,
          response_data: monerooStatus,
        }]);

        return { ...transaction, ...updates };
      } catch (verifyError) {
        console.error("Error verifying with Moneroo:", verifyError);
        // Retourner la transaction actuelle si la vérification échoue
        return transaction;
      }
    }

    return transaction;
  } catch (error: any) {
    console.error("Transaction verification error:", error);
    throw error;
  }
};
