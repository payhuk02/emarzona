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

/**
 * Exporte les litiges en CSV
 */
export const exportDisputesToCSV = (disputes: any[], filename?: string) => {
  if (disputes.length === 0) {
    throw new Error('Aucun litige à exporter');
  }

  // Labels pour les statuts
  const statusLabels: Record<string, string> = {
    open: 'Ouvert',
    investigating: 'En investigation',
    waiting_customer: 'Attente client',
    waiting_seller: 'Attente vendeur',
    resolved: 'Résolu',
    closed: 'Fermé',
  };

  const initiatorLabels: Record<string, string> = {
    customer: 'Client',
    seller: 'Vendeur',
    admin: 'Admin',
  };

  const priorityLabels: Record<string, string> = {
    low: 'Basse',
    normal: 'Normale',
    high: 'Élevée',
    urgent: 'Urgente',
  };

  // Préparer les données
  const data = disputes.map(dispute => ({
    'ID': dispute.id.substring(0, 8),
    'ID Commande': dispute.order_id ? dispute.order_id.substring(0, 13) : 'N/A',
    'Sujet': dispute.subject || '',
    'Description': (dispute.description || '').substring(0, 200), // Limiter à 200 chars
    'Statut': statusLabels[dispute.status] || dispute.status,
    'Priorité': priorityLabels[dispute.priority] || 'Normale',
    'Initiateur': initiatorLabels[dispute.initiator_type] || dispute.initiator_type,
    'Assigné': dispute.assigned_admin_id ? 'Oui' : 'Non',
    'Résolution': (dispute.resolution || '').substring(0, 200), // Limiter à 200 chars
    'Date création': format(new Date(dispute.created_at), 'dd/MM/yyyy HH:mm', { locale: fr }),
    'Date résolution': dispute.resolved_at ? format(new Date(dispute.resolved_at), 'dd/MM/yyyy HH:mm', { locale: fr }) : '',
  }));

  const headers = [
    'ID',
    'ID Commande',
    'Sujet',
    'Description',
    'Statut',
    'Priorité',
    'Initiateur',
    'Assigné',
    'Résolution',
    'Date création',
    'Date résolution',
  ];

  const csv = convertToCSV(data, headers);
  const finalFilename = filename || `litiges_${format(new Date(), 'yyyy-MM-dd_HHmm')}.csv`;
  
  downloadCSV(csv, finalFilename);
};

