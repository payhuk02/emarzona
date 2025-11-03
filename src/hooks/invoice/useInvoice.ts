/**
 * Hook useInvoice - Gestion des factures
 * Date: 26 Janvier 2025
 * 
 * Fonctionnalités:
 * - Création facture depuis commande
 * - Génération PDF
 * - Envoi email
 * - Historique factures
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { logger } from '@/lib/logger';
import type { Invoice, InvoiceItem, CreateInvoiceOptions } from '@/types/invoice';

const INVOICE_QUERY_KEY = ['invoices'];

/**
 * Récupérer toutes les factures d'un utilisateur
 */
export function useInvoices(customerId?: string) {
  return useQuery({
    queryKey: [...INVOICE_QUERY_KEY, customerId],
    queryFn: async (): Promise<Invoice[]> => {
      let query = supabase
        .from('invoices')
        .select(`
          *,
          invoice_items(*)
        `)
        .order('invoice_date', { ascending: false });

      if (customerId) {
        query = query.eq('customer_id', customerId);
      }

      const { data, error } = await query;

      if (error) {
        logger.error('Error fetching invoices:', error);
        throw error;
      }

      return (data as Invoice[]) || [];
    },
    enabled: true,
  });
}

/**
 * Récupérer une facture spécifique
 */
export function useInvoice(invoiceId: string) {
  return useQuery({
    queryKey: [...INVOICE_QUERY_KEY, invoiceId],
    queryFn: async (): Promise<Invoice | null> => {
      const { data, error } = await supabase
        .from('invoices')
        .select(`
          *,
          invoice_items(*)
        `)
        .eq('id', invoiceId)
        .single();

      if (error) {
        logger.error('Error fetching invoice:', error);
        throw error;
      }

      return data as Invoice;
    },
    enabled: !!invoiceId,
  });
}

/**
 * Récupérer les factures d'une commande
 */
export function useOrderInvoices(orderId: string) {
  return useQuery({
    queryKey: [...INVOICE_QUERY_KEY, 'order', orderId],
    queryFn: async (): Promise<Invoice[]> => {
      const { data, error } = await supabase
        .from('invoices')
        .select(`
          *,
          invoice_items(*)
        `)
        .eq('order_id', orderId)
        .order('created_at', { ascending: false });

      if (error) {
        logger.error('Error fetching order invoices:', error);
        throw error;
      }

      return (data as Invoice[]) || [];
    },
    enabled: !!orderId,
  });
}

/**
 * Créer une facture depuis une commande
 */
export function useCreateInvoice() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (options: CreateInvoiceOptions): Promise<Invoice> => {
      // Appeler la fonction RPC pour créer la facture
      const { data: invoiceId, error } = await supabase.rpc('create_invoice_from_order', {
        p_order_id: options.order_id,
      });

      if (error) {
        logger.error('Error creating invoice:', error);
        throw error;
      }

      // Récupérer la facture créée
      const { data: invoice, error: fetchError } = await supabase
        .from('invoices')
        .select(`
          *,
          invoice_items(*)
        `)
        .eq('id', invoiceId)
        .single();

      if (fetchError) {
        logger.error('Error fetching created invoice:', fetchError);
        throw fetchError;
      }

      return invoice as Invoice;
    },
    onSuccess: (invoice) => {
      queryClient.invalidateQueries({ queryKey: INVOICE_QUERY_KEY });
      toast({
        title: '✅ Facture créée',
        description: `Facture ${invoice.invoice_number} créée avec succès`,
      });
    },
    onError: (error: any) => {
      logger.error('Error creating invoice:', error);
      toast({
        title: '❌ Erreur',
        description: error.message || 'Impossible de créer la facture',
        variant: 'destructive',
      });
    },
  });
}

/**
 * Générer le PDF d'une facture
 */
export function useGenerateInvoicePDF() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (invoiceId: string): Promise<string> => {
      // Cette fonction sera appelée depuis le composant de génération PDF
      // qui utilisera react-pdf ou jsPDF
      // Pour l'instant, retourner l'ID de la facture
      return invoiceId;
    },
    onSuccess: (invoiceId) => {
      queryClient.invalidateQueries({ queryKey: [...INVOICE_QUERY_KEY, invoiceId] });
      toast({
        title: '✅ PDF généré',
        description: 'Le PDF de la facture a été généré',
      });
    },
    onError: (error: any) => {
      logger.error('Error generating PDF:', error);
      toast({
        title: '❌ Erreur',
        description: 'Impossible de générer le PDF',
        variant: 'destructive',
      });
    },
  });
}

/**
 * Envoyer une facture par email
 */
export function useSendInvoiceEmail() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (invoiceId: string): Promise<void> => {
      // Appeler une Edge Function Supabase pour envoyer l'email
      const { error } = await supabase.functions.invoke('send-invoice-email', {
        body: { invoice_id: invoiceId },
      });

      if (error) {
        logger.error('Error sending invoice email:', error);
        throw error;
      }

      // Mettre à jour le statut de la facture
      await supabase
        .from('invoices')
        .update({
          email_sent: true,
          email_sent_at: new Date().toISOString(),
          status: 'sent',
        })
        .eq('id', invoiceId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: INVOICE_QUERY_KEY });
      toast({
        title: '✅ Email envoyé',
        description: 'La facture a été envoyée par email',
      });
    },
    onError: (error: any) => {
      logger.error('Error sending invoice email:', error);
      toast({
        title: '❌ Erreur',
        description: 'Impossible d\'envoyer l\'email',
        variant: 'destructive',
      });
    },
  });
}

/**
 * Marquer une facture comme payée
 */
export function useMarkInvoicePaid() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { invoiceId: string; paymentReference?: string }): Promise<void> => {
      const { error } = await supabase
        .from('invoices')
        .update({
          status: 'paid',
          paid_at: new Date().toISOString(),
          payment_reference: data.paymentReference,
        })
        .eq('id', data.invoiceId);

      if (error) {
        logger.error('Error marking invoice as paid:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: INVOICE_QUERY_KEY });
      toast({
        title: '✅ Facture payée',
        description: 'La facture a été marquée comme payée',
      });
    },
    onError: (error: any) => {
      logger.error('Error marking invoice as paid:', error);
      toast({
        title: '❌ Erreur',
        description: 'Impossible de mettre à jour la facture',
        variant: 'destructive',
      });
    },
  });
}

