/**
 * Service d'export des données d'affiliation en CSV
 * Date: 28 Janvier 2025
 */

import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { logger } from './logger';
import { formatCurrency } from './utils';
import type { 
  AffiliateCommission, 
  AffiliateLink, 
  AffiliateWithdrawal 
} from '@/types/affiliate';

/**
 * Échappe une valeur pour CSV
 */
const escapeCsvValue = (value: unknown): string => {
  if (value === null || value === undefined) {
    return '';
  }
  
  const stringValue = String(value);
  
  // Échapper les guillemets doubles
  const escapedValue = stringValue.replace(/"/g, '""');
  
  // Si la valeur contient des caractères spéciaux, l'entourer de guillemets
  if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
    return `"${escapedValue}"`;
  }
  
  return escapedValue;
};

/**
 * Télécharge un fichier CSV
 */
const downloadCSV = (csvContent: string, filename: string): void => {
  // Ajouter BOM UTF-8 pour compatibilité Excel
  const BOM = '\uFEFF';
  const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
  
  // Créer le lien de téléchargement
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  // Nettoyer l'URL
  URL.revokeObjectURL(url);
};

/**
 * Exporte les commissions d'affiliation en CSV
 */
export const exportCommissionsToCSV = (
  commissions: AffiliateCommission[],
  filename?: string
): void => {
  try {
    if (!commissions || commissions.length === 0) {
      throw new Error('Aucune commission à exporter');
    }

    const defaultFilename = `commissions_affiliation_${format(new Date(), 'yyyy-MM-dd', { locale: fr })}.csv`;
    const csvFilename = filename || defaultFilename;

    // En-têtes
    const headers = [
      'ID',
      'Date création',
      'Code affilié',
      'Nom affilié',
      'Produit',
      'Numéro commande',
      'Montant commande (XOF)',
      'Taux commission (%)',
      'Type commission',
      'Montant commission (XOF)',
      'Statut',
      'Date approbation',
      'Date paiement',
      'Référence paiement',
    ];

    // Lignes de données
    const rows = commissions.map(commission => [
      escapeCsvValue(commission.id),
      escapeCsvValue(format(new Date(commission.created_at), 'dd/MM/yyyy HH:mm', { locale: fr })),
      escapeCsvValue(commission.affiliate?.affiliate_code || ''),
      escapeCsvValue(commission.affiliate?.display_name || commission.affiliate?.email || ''),
      escapeCsvValue(commission.product?.name || ''),
      escapeCsvValue(commission.order?.order_number || ''),
      escapeCsvValue(commission.order_total.toLocaleString('fr-FR')),
      escapeCsvValue(commission.commission_rate.toFixed(2)),
      escapeCsvValue(commission.commission_type === 'percentage' ? 'Pourcentage' : 'Fixe'),
      escapeCsvValue(formatCurrency(commission.commission_amount)),
      escapeCsvValue(
        commission.status === 'pending' ? 'En attente' :
        commission.status === 'approved' ? 'Approuvée' :
        commission.status === 'paid' ? 'Payée' :
        commission.status === 'rejected' ? 'Rejetée' :
        'Annulée'
      ),
      escapeCsvValue(commission.approved_at ? format(new Date(commission.approved_at), 'dd/MM/yyyy HH:mm', { locale: fr }) : ''),
      escapeCsvValue(commission.paid_at ? format(new Date(commission.paid_at), 'dd/MM/yyyy HH:mm', { locale: fr }) : ''),
      escapeCsvValue(commission.payment_reference || ''),
    ]);

    // Construire le CSV
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    // Télécharger
    downloadCSV(csvContent, csvFilename);

    logger.info('Export CSV des commissions réussi', { count: commissions.length, filename: csvFilename });
  } catch (error) {
    logger.error('Erreur lors de l\'export CSV des commissions', { error });
    throw error;
  }
};

/**
 * Exporte les liens d'affiliation en CSV
 */
export const exportLinksToCSV = (
  links: AffiliateLink[],
  filename?: string
): void => {
  try {
    if (!links || links.length === 0) {
      throw new Error('Aucun lien à exporter');
    }

    const defaultFilename = `liens_affiliation_${format(new Date(), 'yyyy-MM-dd', { locale: fr })}.csv`;
    const csvFilename = filename || defaultFilename;

    // En-têtes
    const headers = [
      'ID',
      'Produit',
      'Store',
      'Code lien',
      'URL complète',
      'Statut',
      'Total clics',
      'Total ventes',
      'Total revenus (XOF)',
      'Total commission (XOF)',
      'Taux conversion (%)',
      'Date création',
      'Dernière utilisation',
    ];

    // Lignes de données
    const rows = links.map(link => {
      const conversionRate = link.total_clicks > 0
        ? ((link.total_sales / link.total_clicks) * 100).toFixed(2)
        : '0.00';

      return [
        escapeCsvValue(link.id),
        escapeCsvValue(link.product?.name || ''),
        escapeCsvValue(link.product?.store?.name || ''),
        escapeCsvValue(link.link_code),
        escapeCsvValue(link.full_url),
        escapeCsvValue(
          link.status === 'active' ? 'Actif' :
          link.status === 'paused' ? 'En pause' :
          'Supprimé'
        ),
        escapeCsvValue(link.total_clicks.toString()),
        escapeCsvValue(link.total_sales.toString()),
        escapeCsvValue(formatCurrency(link.total_revenue)),
        escapeCsvValue(formatCurrency(link.total_commission)),
        escapeCsvValue(conversionRate),
        escapeCsvValue(format(new Date(link.created_at), 'dd/MM/yyyy HH:mm', { locale: fr })),
        escapeCsvValue(link.last_used_at ? format(new Date(link.last_used_at), 'dd/MM/yyyy HH:mm', { locale: fr }) : ''),
      ];
    });

    // Construire le CSV
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    // Télécharger
    downloadCSV(csvContent, csvFilename);

    logger.info('Export CSV des liens réussi', { count: links.length, filename: csvFilename });
  } catch (error) {
    logger.error('Erreur lors de l\'export CSV des liens', { error });
    throw error;
  }
};

/**
 * Exporte les retraits d'affiliation en CSV
 */
export const exportWithdrawalsToCSV = (
  withdrawals: AffiliateWithdrawal[],
  filename?: string
): void => {
  try {
    if (!withdrawals || withdrawals.length === 0) {
      throw new Error('Aucun retrait à exporter');
    }

    const defaultFilename = `retraits_affiliation_${format(new Date(), 'yyyy-MM-dd', { locale: fr })}.csv`;
    const csvFilename = filename || defaultFilename;

    // En-têtes
    const headers = [
      'ID',
      'Date demande',
      'Code affilié',
      'Nom affilié',
      'Montant (XOF)',
      'Devise',
      'Méthode paiement',
      'Détails paiement',
      'Statut',
      'Date approbation',
      'Date traitement',
      'Référence transaction',
      'Raison rejet',
      'Date création',
    ];

    // Lignes de données
    const rows = withdrawals.map(withdrawal => {
      const paymentDetails = withdrawal.payment_details || {};
      const paymentDetailsStr = Object.entries(paymentDetails)
        .map(([key, value]) => `${key}: ${value}`)
        .join('; ');

      return [
        escapeCsvValue(withdrawal.id),
        escapeCsvValue(format(new Date(withdrawal.created_at), 'dd/MM/yyyy HH:mm', { locale: fr })),
        escapeCsvValue(withdrawal.affiliate?.affiliate_code || ''),
        escapeCsvValue(withdrawal.affiliate?.display_name || withdrawal.affiliate?.email || ''),
        escapeCsvValue(formatCurrency(withdrawal.amount)),
        escapeCsvValue(withdrawal.currency),
        escapeCsvValue(
          withdrawal.payment_method === 'mobile_money' ? 'Mobile Money' :
          withdrawal.payment_method === 'bank_transfer' ? 'Virement bancaire' :
          withdrawal.payment_method === 'paypal' ? 'PayPal' :
          'Stripe'
        ),
        escapeCsvValue(paymentDetailsStr),
        escapeCsvValue(
          withdrawal.status === 'pending' ? 'En attente' :
          withdrawal.status === 'processing' ? 'En traitement' :
          withdrawal.status === 'completed' ? 'Complété' :
          withdrawal.status === 'failed' ? 'Échoué' :
          'Annulé'
        ),
        escapeCsvValue(withdrawal.approved_at ? format(new Date(withdrawal.approved_at), 'dd/MM/yyyy HH:mm', { locale: fr }) : ''),
        escapeCsvValue(withdrawal.processed_at ? format(new Date(withdrawal.processed_at), 'dd/MM/yyyy HH:mm', { locale: fr }) : ''),
        escapeCsvValue(withdrawal.transaction_reference || ''),
        escapeCsvValue(withdrawal.rejection_reason || withdrawal.failure_reason || ''),
        escapeCsvValue(format(new Date(withdrawal.created_at), 'dd/MM/yyyy HH:mm', { locale: fr })),
      ];
    });

    // Construire le CSV
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    // Télécharger
    downloadCSV(csvContent, csvFilename);

    logger.info('Export CSV des retraits réussi', { count: withdrawals.length, filename: csvFilename });
  } catch (error) {
    logger.error('Erreur lors de l\'export CSV des retraits', { error });
    throw error;
  }
};

/**
 * Exporte un rapport complet d'affiliation
 */
export const exportFullAffiliateReport = (
  commissions: AffiliateCommission[],
  links: AffiliateLink[],
  withdrawals: AffiliateWithdrawal[],
  filename?: string
): void => {
  try {
    const defaultFilename = `rapport_affiliation_complet_${format(new Date(), 'yyyy-MM-dd', { locale: fr })}.csv`;
    const csvFilename = filename || defaultFilename;

    // Fonction helper pour générer le CSV sans télécharger
    const generateCommissionsCSV = (): string => {
      const headers = [
        'ID',
        'Date création',
        'Code affilié',
        'Nom affilié',
        'Produit',
        'Numéro commande',
        'Montant commande (XOF)',
        'Taux commission (%)',
        'Type commission',
        'Montant commission (XOF)',
        'Statut',
      ];
      const rows = commissions.map(comm => [
        escapeCsvValue(comm.id),
        escapeCsvValue(format(new Date(comm.created_at), 'dd/MM/yyyy HH:mm', { locale: fr })),
        escapeCsvValue(comm.affiliate?.affiliate_code || ''),
        escapeCsvValue(comm.affiliate?.display_name || comm.affiliate?.email || ''),
        escapeCsvValue(comm.product?.name || ''),
        escapeCsvValue(comm.order?.order_number || ''),
        escapeCsvValue(comm.order_total.toLocaleString('fr-FR')),
        escapeCsvValue(comm.commission_rate.toFixed(2)),
        escapeCsvValue(comm.commission_type === 'percentage' ? 'Pourcentage' : 'Fixe'),
        escapeCsvValue(formatCurrency(comm.commission_amount)),
        escapeCsvValue(comm.status === 'pending' ? 'En attente' : comm.status === 'approved' ? 'Approuvée' : 'Payée'),
      ]);
      return [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
    };

    const generateLinksCSV = (): string => {
      const headers = ['ID', 'Produit', 'Code lien', 'Total clics', 'Total ventes', 'Total commission (XOF)'];
      const rows = links.map(link => [
        escapeCsvValue(link.id),
        escapeCsvValue(link.product?.name || ''),
        escapeCsvValue(link.link_code),
        escapeCsvValue(link.total_clicks.toString()),
        escapeCsvValue(link.total_sales.toString()),
        escapeCsvValue(formatCurrency(link.total_commission)),
      ]);
      return [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
    };

    const generateWithdrawalsCSV = (): string => {
      const headers = ['ID', 'Date demande', 'Montant (XOF)', 'Statut'];
      const rows = withdrawals.map(w => [
        escapeCsvValue(w.id),
        escapeCsvValue(format(new Date(w.created_at), 'dd/MM/yyyy HH:mm', { locale: fr })),
        escapeCsvValue(formatCurrency(w.amount)),
        escapeCsvValue(w.status),
      ]);
      return [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
    };

    // Résumé en haut
    const summary = [
      ['RAPPORT COMPLET D\'AFFILIATION'],
      ['Date génération', format(new Date(), 'dd/MM/yyyy HH:mm', { locale: fr })],
      [''],
      ['RÉSUMÉ'],
      ['Total commissions', commissions.length.toString()],
      ['Total liens', links.length.toString()],
      ['Total retraits', withdrawals.length.toString()],
      [''],
      ['COMMISSIONS'],
      generateCommissionsCSV(),
      [''],
      ['LIENS D\'AFFILIATION'],
      generateLinksCSV(),
      [''],
      ['RETRAITS'],
      generateWithdrawalsCSV(),
    ];

    // Combiner tout
    const csvContent = summary.join('\n');

    // Télécharger
    downloadCSV(csvContent, csvFilename);

    logger.info('Export CSV du rapport complet réussi', { 
      commissions: commissions.length,
      links: links.length,
      withdrawals: withdrawals.length,
      filename: csvFilename 
    });
  } catch (error) {
    logger.error('Erreur lors de l\'export CSV du rapport complet', { error });
    throw error;
  }
};

