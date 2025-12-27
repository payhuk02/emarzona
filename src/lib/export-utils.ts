import { Order } from '@/hooks/useOrders';
import { AdvancedPayment } from '@/types/advanced-features';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

/**
 * Convertit un tableau d'objets en CSV
 */
export const convertToCSV = (data: Record<string, unknown>[], headers: string[]): string => {
  if (data.length === 0) return '';

  // En-têtes
  const csvHeaders = headers.join(',');

  // Lignes de données
  const csvRows = data.map(row => {
    return headers
      .map(header => {
        const value = row[header] ?? '';
        // Échapper les virgules et guillemets
        const stringValue = String(value).replace(/"/g, '""');
        return `"${stringValue}"`;
      })
      .join(',');
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
 * Exporte les commandes en CSV avec toutes les informations
 */
export const exportOrdersToCSV = (orders: Order[], filename?: string) => {
  if (orders.length === 0) {
    throw new Error('Aucune commande à exporter');
  }

  // Préparer les données avec toutes les informations
  const data = orders.map(order => {
    // Adresse client complète
    const customerAddress = [
      order.customers?.address,
      order.customers?.postal_code,
      order.customers?.city,
      order.customers?.country,
    ]
      .filter(Boolean)
      .join(', ');

    // Adresse de livraison complète
    const shippingAddressFull = order.shipping_address
      ? [order.shipping_address.address_line1, order.shipping_address.address_line2]
          .filter(Boolean)
          .join(', ')
      : '';

    const shippingAddressCity = order.shipping_address
      ? [
          order.shipping_address.postal_code,
          order.shipping_address.city,
          order.shipping_address.state,
          order.shipping_address.country,
        ]
          .filter(Boolean)
          .join(', ')
      : '';

    // Metadata en format JSON si présente
    const metadataStr = order.metadata ? JSON.stringify(order.metadata).replace(/"/g, '""') : '';

    // Type de paiement et détails
    const paymentTypeLabel =
      order.payment_type === 'full'
        ? 'Complet'
        : order.payment_type === 'percentage'
          ? 'Partiel'
          : order.payment_type === 'delivery_secured'
            ? 'Escrow'
            : '';

    return {
      'N° Commande': order.order_number,
      // Informations client
      Client: order.customers?.name || 'Non spécifié',
      'Email Client': order.customers?.email || '',
      'Téléphone Client': order.customers?.phone || '',
      'Adresse Client': customerAddress || '',
      'Ville Client': order.customers?.city || '',
      'Code Postal Client': order.customers?.postal_code || '',
      'Pays Client': order.customers?.country || '',
      // Adresse de livraison
      'Nom Livraison': order.shipping_address?.full_name || '',
      'Email Livraison': order.shipping_address?.email || '',
      'Téléphone Livraison': order.shipping_address?.phone || '',
      'Adresse Livraison': shippingAddressFull || '',
      'Ville Livraison': order.shipping_address?.city || '',
      'Code Postal Livraison': order.shipping_address?.postal_code || '',
      'Pays Livraison': order.shipping_address?.country || '',
      'État/Région Livraison': order.shipping_address?.state || '',
      // Informations commande
      Montant: order.total_amount.toLocaleString('fr-FR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }),
      Devise: order.currency,
      Statut: getStatusLabel(order.status),
      'Statut Paiement': getPaymentStatusLabel(order.payment_status),
      'Type Paiement': paymentTypeLabel,
      'Acompte Payé': order.percentage_paid
        ? order.percentage_paid.toLocaleString('fr-FR', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })
        : '',
      'Solde Restant': order.remaining_amount
        ? order.remaining_amount.toLocaleString('fr-FR', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })
        : '',
      'Mode de paiement': order.payment_method || '',
      'Date Création': format(new Date(order.created_at), 'dd/MM/yyyy HH:mm', { locale: fr }),
      'Date Mise à jour': format(new Date(order.updated_at), 'dd/MM/yyyy HH:mm', { locale: fr }),
      Notes: order.notes || '',
      Métadonnées: metadataStr,
    };
  });

  const headers = [
    'N° Commande',
    // Informations client
    'Client',
    'Email Client',
    'Téléphone Client',
    'Adresse Client',
    'Ville Client',
    'Code Postal Client',
    'Pays Client',
    // Adresse de livraison
    'Nom Livraison',
    'Email Livraison',
    'Téléphone Livraison',
    'Adresse Livraison',
    'Ville Livraison',
    'Code Postal Livraison',
    'Pays Livraison',
    'État/Région Livraison',
    // Informations commande
    'Montant',
    'Devise',
    'Statut',
    'Statut Paiement',
    'Type Paiement',
    'Acompte Payé',
    'Solde Restant',
    'Mode de paiement',
    'Date Création',
    'Date Mise à jour',
    'Notes',
    'Métadonnées',
  ];

  const csv = convertToCSV(data, headers);
  const finalFilename = filename || `commandes_${format(new Date(), 'yyyy-MM-dd_HHmm')}.csv`;

  downloadCSV(csv, finalFilename);
};

const getStatusLabel = (status: string): string => {
  const  labels: Record<string, string> = {
    pending: 'En attente',
    processing: 'En cours',
    completed: 'Terminée',
    cancelled: 'Annulée',
  };
  return labels[status] || status;
};

const getPaymentStatusLabel = (status: string): string => {
  const  labels: Record<string, string> = {
    pending: 'En attente',
    paid: 'Payée',
    failed: 'Échouée',
  };
  return labels[status] || status;
};

/**
 * Exporte les litiges en CSV
 */
export const exportDisputesToCSV = (disputes: Record<string, unknown>[], filename?: string) => {
  if (disputes.length === 0) {
    throw new Error('Aucun litige à exporter');
  }

  // Labels pour les statuts
  const  statusLabels: Record<string, string> = {
    open: 'Ouvert',
    investigating: 'En investigation',
    waiting_customer: 'Attente client',
    waiting_seller: 'Attente vendeur',
    resolved: 'Résolu',
    closed: 'Fermé',
  };

  const  initiatorLabels: Record<string, string> = {
    customer: 'Client',
    seller: 'Vendeur',
    admin: 'Admin',
  };

  const  priorityLabels: Record<string, string> = {
    low: 'Basse',
    normal: 'Normale',
    high: 'Élevée',
    urgent: 'Urgente',
  };

  // Préparer les données
  const data = disputes.map(dispute => ({
    ID: dispute.id.substring(0, 8),
    'ID Commande': dispute.order_id ? dispute.order_id.substring(0, 13) : 'N/A',
    Sujet: dispute.subject || '',
    Description: (dispute.description || '').substring(0, 200), // Limiter à 200 chars
    Statut: statusLabels[dispute.status] || dispute.status,
    Priorité: priorityLabels[dispute.priority] || 'Normale',
    Initiateur: initiatorLabels[dispute.initiator_type] || dispute.initiator_type,
    Assigné: dispute.assigned_admin_id ? 'Oui' : 'Non',
    Résolution: (dispute.resolution || '').substring(0, 200), // Limiter à 200 chars
    'Date création': format(new Date(dispute.created_at), 'dd/MM/yyyy HH:mm', { locale: fr }),
    'Date résolution': dispute.resolved_at
      ? format(new Date(dispute.resolved_at), 'dd/MM/yyyy HH:mm', { locale: fr })
      : '',
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

/**
 * Exporte les paiements avancés en CSV avec toutes les informations
 */
export const exportAdvancedPaymentsToCSV = (payments: AdvancedPayment[], filename?: string) => {
  if (payments.length === 0) {
    throw new Error('Aucun paiement à exporter');
  }

  // Labels pour les statuts
  const getStatusLabel = (status: string): string => {
    const  labels: Record<string, string> = {
      pending: 'En attente',
      completed: 'Complété',
      failed: 'Échoué',
      refunded: 'Remboursé',
      held: 'Retenu',
      released: 'Libéré',
      disputed: 'En litige',
    };
    return labels[status] || status;
  };

  const getPaymentTypeLabel = (type: string): string => {
    const  labels: Record<string, string> = {
      full: 'Complet',
      percentage: 'Partiel',
      delivery_secured: 'Escrow',
    };
    return labels[type] || type;
  };

  // Préparer les données
  const data = payments.map(payment => ({
    'ID Paiement': payment.id.substring(0, 8),
    'ID Transaction': payment.transaction_id || '',
    'N° Commande': payment.orders?.order_number || '',
    'ID Commande': payment.order_id || '',
    Client: payment.customers?.name || 'Non spécifié',
    'Email Client': payment.customers?.email || '',
    'ID Client': payment.customer_id || '',
    Montant: payment.amount.toLocaleString('fr-FR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }),
    Devise: payment.currency,
    'Type Paiement': getPaymentTypeLabel(payment.payment_type),
    Statut: getStatusLabel(payment.status),
    'Mode de Paiement': payment.payment_method || '',
    'Montant Pourcentage': payment.percentage_amount
      ? payment.percentage_amount.toLocaleString('fr-FR', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })
      : '',
    'Taux Pourcentage': payment.percentage_rate ? `${payment.percentage_rate}%` : '',
    'Montant Restant': payment.remaining_amount
      ? payment.remaining_amount.toLocaleString('fr-FR', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })
      : '',
    Retenu: payment.is_held ? 'Oui' : 'Non',
    "Retenu Jusqu'à": payment.held_until
      ? format(new Date(payment.held_until), 'dd/MM/yyyy HH:mm', { locale: fr })
      : '',
    'Conditions de Libération': payment.release_conditions
      ? JSON.stringify(payment.release_conditions).replace(/"/g, '""')
      : '',
    'Livraison Confirmée Le': payment.delivery_confirmed_at
      ? format(new Date(payment.delivery_confirmed_at), 'dd/MM/yyyy HH:mm', { locale: fr })
      : '',
    'Livraison Confirmée Par': payment.delivery_confirmed_by || '',
    'Litige Ouvert Le': payment.dispute_opened_at
      ? format(new Date(payment.dispute_opened_at), 'dd/MM/yyyy HH:mm', { locale: fr })
      : '',
    'Litige Résolu Le': payment.dispute_resolved_at
      ? format(new Date(payment.dispute_resolved_at), 'dd/MM/yyyy HH:mm', { locale: fr })
      : '',
    'Résolution Litige': payment.dispute_resolution || '',
    Notes: payment.notes || '',
    'Date Création': format(new Date(payment.created_at), 'dd/MM/yyyy HH:mm', { locale: fr }),
    'Date Mise à jour': format(new Date(payment.updated_at), 'dd/MM/yyyy HH:mm', { locale: fr }),
  }));

  const headers = [
    'ID Paiement',
    'ID Transaction',
    'N° Commande',
    'ID Commande',
    'Client',
    'Email Client',
    'ID Client',
    'Montant',
    'Devise',
    'Type Paiement',
    'Statut',
    'Mode de Paiement',
    'Montant Pourcentage',
    'Taux Pourcentage',
    'Montant Restant',
    'Retenu',
    "Retenu Jusqu'à",
    'Conditions de Libération',
    'Livraison Confirmée Le',
    'Livraison Confirmée Par',
    'Litige Ouvert Le',
    'Litige Résolu Le',
    'Résolution Litige',
    'Notes',
    'Date Création',
    'Date Mise à jour',
  ];

  const csv = convertToCSV(data, headers);
  const finalFilename =
    filename || `paiements_avances_${format(new Date(), 'yyyy-MM-dd_HHmm')}.csv`;

  downloadCSV(csv, finalFilename);
};






