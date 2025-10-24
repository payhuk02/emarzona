import { Order } from "@/hooks/useOrders";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

/**
 * Convertit un tableau d'objets en CSV
 */
export const convertToCSV = (data: any[], headers: string[]): string => {
  if (data.length === 0) return '';

  // En-têtes
  const csvHeaders = headers.join(',');

  // Lignes de données
  const csvRows = data.map(row => {
    return headers.map(header => {
      const value = row[header] ?? '';
      // Échapper les virgules et guillemets
      const stringValue = String(value).replace(/"/g, '""');
      return `"${stringValue}"`;
    }).join(',');
  });

  return [csvHeaders, ...csvRows].join('\n');
};

/**
 * Télécharge un fichier CSV
 */
export const downloadCSV = (csv: string, filename: string) => {
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

/**
 * Exporte les commandes en CSV
 */
export const exportOrdersToCSV = (orders: Order[], filename?: string) => {
  if (orders.length === 0) {
    throw new Error('Aucune commande à exporter');
  }

  // Préparer les données
  const data = orders.map(order => ({
    'N° Commande': order.order_number,
    'Client': order.customers?.name || 'Non spécifié',
    'Email': order.customers?.email || '',
    'Téléphone': order.customers?.phone || '',
    'Montant': order.total_amount.toLocaleString('fr-FR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }),
    'Devise': order.currency,
    'Statut': getStatusLabel(order.status),
    'Paiement': getPaymentStatusLabel(order.payment_status),
    'Mode de paiement': order.payment_method || '',
    'Date': format(new Date(order.created_at), 'dd/MM/yyyy HH:mm', { locale: fr }),
    'Notes': order.notes || '',
  }));

  const headers = [
    'N° Commande',
    'Client',
    'Email',
    'Téléphone',
    'Montant',
    'Devise',
    'Statut',
    'Paiement',
    'Mode de paiement',
    'Date',
    'Notes',
  ];

  const csv = convertToCSV(data, headers);
  const finalFilename = filename || `commandes_${format(new Date(), 'yyyy-MM-dd_HHmm')}.csv`;
  
  downloadCSV(csv, finalFilename);
};

const getStatusLabel = (status: string): string => {
  const labels: Record<string, string> = {
    pending: 'En attente',
    processing: 'En cours',
    completed: 'Terminée',
    cancelled: 'Annulée',
  };
  return labels[status] || status;
};

const getPaymentStatusLabel = (status: string): string => {
  const labels: Record<string, string> = {
    pending: 'En attente',
    paid: 'Payée',
    failed: 'Échouée',
  };
  return labels[status] || status;
};

