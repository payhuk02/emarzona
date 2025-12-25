/**
 * Générateur de factures PDF
 * Utilise jspdf et jspdf-autotable pour créer des factures professionnelles
 */

import { logger } from './logger';

interface InvoiceItem {
  name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

interface InvoiceData {
  orderNumber: string;
  orderDate: string;
  customerName: string;
  customerEmail: string;
  storeName: string;
  storeAddress?: string;
  items: InvoiceItem[];
  subtotal: number;
  tax?: number;
  total: number;
  currency: string;
  paymentStatus: string;
  paymentMethod?: string;
}

/**
 * Génère une facture PDF pour une commande
 * @param data Données de la facture
 * @returns Promise<void>
 */
export async function generateInvoicePDF(data: InvoiceData): Promise<void> {
  try {
    // Import dynamique de jspdf pour éviter de charger au démarrage
    const [{ default: jsPDF }, { default: autoTable }] = await Promise.all([
      import('jspdf'),
      import('jspdf-autotable'),
    ]);

    const doc = new jsPDF();

    // Configuration des couleurs
    const primaryColor: [number, number, number] = [124, 58, 237]; // Purple
    const textColor: [number, number, number] = [55, 65, 81]; // Gray-700
    const lightGray: [number, number, number] = [243, 244, 246]; // Gray-100

    // En-tête
    doc.setFillColor(...primaryColor);
    doc.rect(0, 0, 220, 40, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.text('FACTURE', 20, 25);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`N° ${data.orderNumber}`, 20, 33);

    // Date
    doc.setTextColor(...textColor);
    doc.setFontSize(10);
    doc.text(`Date: ${new Date(data.orderDate).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    })}`, 150, 50);

    // Informations vendeur
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Vendeur', 20, 60);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text(data.storeName, 20, 68);
    if (data.storeAddress) {
      doc.text(data.storeAddress, 20, 75);
    }

    // Informations client
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Facturé à', 120, 60);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text(data.customerName, 120, 68);
    doc.text(data.customerEmail, 120, 75);

    // Tableau des articles
    const tableData = data.items.map(item => [
      item.name,
      item.quantity.toString(),
      `${item.unit_price.toLocaleString('fr-FR')} ${data.currency}`,
      `${item.total_price.toLocaleString('fr-FR')} ${data.currency}`,
    ]);

    autoTable(doc, {
      startY: 95,
      head: [['Article', 'Qté', 'Prix unitaire', 'Total']],
      body: tableData,
      theme: 'striped',
      headStyles: {
        fillColor: primaryColor,
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 10,
      },
      bodyStyles: {
        textColor: textColor,
        fontSize: 9,
      },
      alternateRowStyles: {
        fillColor: lightGray,
      },
      columnStyles: {
        0: { cellWidth: 80 },
        1: { cellWidth: 20, halign: 'center' },
        2: { cellWidth: 40, halign: 'right' },
        3: { cellWidth: 40, halign: 'right' },
      },
      margin: { left: 20, right: 20 },
    });

    // Position après le tableau
    const finalY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable?.finalY || 150;

    // Totaux
    const totalsY = finalY + 15;
    doc.setFillColor(...lightGray);
    doc.rect(120, totalsY - 5, 70, 35, 'F');

    doc.setTextColor(...textColor);
    doc.setFontSize(10);
    doc.text('Sous-total:', 125, totalsY + 5);
    doc.text(`${data.subtotal.toLocaleString('fr-FR')} ${data.currency}`, 180, totalsY + 5, { align: 'right' });

    if (data.tax) {
      doc.text('TVA:', 125, totalsY + 13);
      doc.text(`${data.tax.toLocaleString('fr-FR')} ${data.currency}`, 180, totalsY + 13, { align: 'right' });
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('Total:', 125, totalsY + 23);
    doc.setTextColor(...primaryColor);
    doc.text(`${data.total.toLocaleString('fr-FR')} ${data.currency}`, 180, totalsY + 23, { align: 'right' });

    // Statut de paiement
    doc.setTextColor(...textColor);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    const statusY = totalsY + 45;
    doc.text(`Statut de paiement: `, 20, statusY);
    
    const statusText = data.paymentStatus === 'completed' ? 'PAYÉ' : 
                       data.paymentStatus === 'pending' ? 'EN ATTENTE' : 
                       data.paymentStatus;
    const statusColor: [number, number, number] = data.paymentStatus === 'completed' ? [34, 197, 94] : [234, 179, 8];
    doc.setTextColor(...statusColor);
    doc.setFont('helvetica', 'bold');
    doc.text(statusText, 65, statusY);

    if (data.paymentMethod) {
      doc.setTextColor(...textColor);
      doc.setFont('helvetica', 'normal');
      doc.text(`Méthode de paiement: ${data.paymentMethod}`, 20, statusY + 8);
    }

    // Pied de page
    const pageHeight = doc.internal.pageSize.height;
    doc.setTextColor(150, 150, 150);
    doc.setFontSize(8);
    doc.text('Merci pour votre achat !', 105, pageHeight - 20, { align: 'center' });
    doc.text(`Facture générée le ${new Date().toLocaleDateString('fr-FR')}`, 105, pageHeight - 15, { align: 'center' });
    doc.text('Emarzona - Plateforme de ecommerce et marketing', 105, pageHeight - 10, { align: 'center' });

    // Télécharger le PDF
    doc.save(`facture-${data.orderNumber}.pdf`);

    logger.info('Facture PDF générée avec succès', { orderNumber: data.orderNumber });
  } catch (error) {
    logger.error('Erreur lors de la génération de la facture PDF', { error, orderNumber: data.orderNumber });
    throw new Error('Impossible de générer la facture. Veuillez réessayer.');
  }
}

