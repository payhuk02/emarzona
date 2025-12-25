/**
 * Utilitaires pour l'export des retraits
 * Date: 2025-02-03
 */

import { StoreWithdrawal } from '@/types/store-withdrawals';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

/**
 * Convertit les retraits en CSV
 */
export const convertWithdrawalsToCSV = (withdrawals: StoreWithdrawal[]): string => {
  if (!withdrawals || withdrawals.length === 0) {
    return '';
  }

  const headers = [
    'ID',
    'Date de création',
    'Boutique',
    'Montant',
    'Devise',
    'Méthode de paiement',
    'Statut',
    'Date d\'approbation',
    'Date de traitement',
    'Référence transaction',
    'Raison du rejet',
    'Notes',
  ];

  const rows = withdrawals.map((w) => [
    w.id,
    format(new Date(w.created_at), 'dd/MM/yyyy HH:mm', { locale: fr }),
    w.store?.name || 'N/A',
    w.amount.toString(),
    w.currency,
    w.payment_method === 'mobile_money' ? 'Mobile Money' : w.payment_method === 'bank_card' ? 'Carte bancaire' : 'Virement bancaire',
    w.status === 'pending' ? 'En attente' : w.status === 'processing' ? 'En cours' : w.status === 'completed' ? 'Complété' : w.status === 'failed' ? 'Échoué' : 'Annulé',
    w.approved_at ? format(new Date(w.approved_at), 'dd/MM/yyyy HH:mm', { locale: fr }) : '',
    w.processed_at ? format(new Date(w.processed_at), 'dd/MM/yyyy HH:mm', { locale: fr }) : '',
    w.transaction_reference || '',
    w.rejection_reason || '',
    w.notes || '',
  ]);

  const csvContent = [
    headers.join(','),
    ...rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')),
  ].join('\n');

  return csvContent;
};

/**
 * Télécharge un fichier CSV
 */
export const downloadWithdrawalsCSV = (withdrawals: StoreWithdrawal[], filename?: string) => {
  const csv = convertWithdrawalsToCSV(withdrawals);
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', filename || `retraits_${format(new Date(), 'yyyy-MM-dd')}.csv`);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  URL.revokeObjectURL(url);
};

/**
 * Convertit les retraits en JSON
 */
export const downloadWithdrawalsJSON = (withdrawals: StoreWithdrawal[], filename?: string) => {
  const json = JSON.stringify(withdrawals, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', filename || `retraits_${format(new Date(), 'yyyy-MM-dd')}.json`);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  URL.revokeObjectURL(url);
};

