/**
 * Composant InvoicePDFGenerator - Génération PDF factures professionnelles
 * Date: 26 Janvier 2025
 * 
 * Utilise jsPDF + jspdf-autotable pour créer des factures PDF
 */

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { Invoice, InvoiceItem } from '@/types/invoice';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

/**
 * Génère un PDF professionnel pour une facture
 */
export async function generateInvoicePDF(invoice: Invoice): Promise<Blob> {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 20;
  let yPosition = margin;

  // ================================================================
  // EN-TÊTE (Header)
  // ================================================================
  
  // Logo Store (si disponible)
  if (invoice.store_info?.logo_url) {
    try {
      // Charger l'image depuis l'URL
      const img = await loadImage(invoice.store_info.logo_url);
      const logoWidth = 40;
      const logoHeight = (img.height * logoWidth) / img.width;
      doc.addImage(img, 'PNG', margin, yPosition, logoWidth, Math.min(logoHeight, 20));
      yPosition += Math.min(logoHeight, 20) + 5;
    } catch (error) {
      console.error('Error loading logo:', error);
    }
  }

  // Titre FACTURE
  doc.setFontSize(28);
  doc.setTextColor(60, 60, 60);
  doc.setFont('helvetica', 'bold');
  doc.text('FACTURE', pageWidth - margin - 30, 25);

  // Numéro de facture
  doc.setFontSize(12);
  doc.setTextColor(100, 100, 100);
  doc.setFont('helvetica', 'normal');
  doc.text(`N° ${invoice.invoice_number}`, pageWidth - margin - 30, 32);

  // Date
  doc.setFontSize(10);
  doc.text(`Date: ${format(new Date(invoice.invoice_date), 'dd/MM/yyyy', { locale: fr })}`, pageWidth - margin - 30, 38);
  
  if (invoice.due_date) {
    doc.text(`Échéance: ${format(new Date(invoice.due_date), 'dd/MM/yyyy', { locale: fr })}`, pageWidth - margin - 30, 44);
  }

  // Statut
  const statusColors: Record<string, [number, number, number]> = {
    paid: [34, 197, 94],
    sent: [59, 130, 246],
    overdue: [239, 68, 68],
    draft: [156, 163, 175],
    cancelled: [107, 114, 128],
  };
  const statusLabels: Record<string, string> = {
    paid: 'Payée',
    sent: 'Envoyée',
    overdue: 'Échue',
    draft: 'Brouillon',
    cancelled: 'Annulée',
  };
  
  doc.setFillColor(...(statusColors[invoice.status] || [156, 163, 175]));
  doc.roundedRect(pageWidth - margin - 30, yPosition - 5, 25, 8, 2, 2, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(9);
  doc.text(statusLabels[invoice.status] || invoice.status, pageWidth - margin - 18, yPosition);
  doc.setTextColor(0, 0, 0);

  yPosition = Math.max(yPosition, 50);

  // ================================================================
  // INFORMATIONS STORE
  // ================================================================
  
  yPosition += 10;
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Vendeur:', margin, yPosition);
  
  yPosition += 7;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  
  if (invoice.store_info) {
    doc.text(invoice.store_info.name || 'Boutique', margin, yPosition);
    yPosition += 5;
    
    if (invoice.store_info.address) {
      doc.text(invoice.store_info.address, margin, yPosition);
      yPosition += 5;
    }
    
    const cityInfo = [
      invoice.store_info.city,
      invoice.store_info.postal_code,
      invoice.store_info.country,
    ].filter(Boolean).join(', ');
    
    if (cityInfo) {
      doc.text(cityInfo, margin, yPosition);
      yPosition += 5;
    }
    
    if (invoice.store_info.tax_id) {
      doc.text(`TVA: ${invoice.store_info.tax_id}`, margin, yPosition);
      yPosition += 5;
    }
  }

  // ================================================================
  // INFORMATIONS CLIENT
  // ================================================================
  
  yPosition = 50;
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Client:', pageWidth - margin - 70, yPosition);
  
  yPosition += 7;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  
  if (invoice.billing_address) {
    if (invoice.billing_address.name) {
      doc.text(invoice.billing_address.name, pageWidth - margin - 70, yPosition);
      yPosition += 5;
    }
    
    if (invoice.billing_address.email) {
      doc.text(invoice.billing_address.email, pageWidth - margin - 70, yPosition);
      yPosition += 5;
    }
    
    if (invoice.billing_address.phone) {
      doc.text(invoice.billing_address.phone, pageWidth - margin - 70, yPosition);
      yPosition += 5;
    }
    
    if (invoice.billing_address.address) {
      doc.text(invoice.billing_address.address, pageWidth - margin - 70, yPosition);
      yPosition += 5;
    }
    
    const clientCityInfo = [
      invoice.billing_address.city,
      invoice.billing_address.postal_code,
      invoice.billing_address.country,
    ].filter(Boolean).join(', ');
    
    if (clientCityInfo) {
      doc.text(clientCityInfo, pageWidth - margin - 70, yPosition);
      yPosition += 5;
    }
    
    if (invoice.billing_address.tax_id) {
      doc.text(`TVA: ${invoice.billing_address.tax_id}`, pageWidth - margin - 70, yPosition);
    }
  }

  // ================================================================
  // TABLEAU DES ARTICLES
  // ================================================================
  
  yPosition = Math.max(yPosition, 90) + 15;
  
  const tableData = (invoice.invoice_items || []).map((item: InvoiceItem) => [
    item.product_name,
    item.quantity.toString(),
    formatCurrency(item.unit_price, invoice.currency),
    formatCurrency(item.discount_amount, invoice.currency),
    formatCurrency(item.total_price, invoice.currency),
  ]);

  autoTable(doc, {
    startY: yPosition,
    head: [['Description', 'Qté', 'Prix unit.', 'Remise', 'Total']],
    body: tableData,
    styles: {
      fontSize: 9,
      cellPadding: 3,
    },
    headStyles: {
      fillColor: [60, 60, 60],
      textColor: 255,
      fontStyle: 'bold',
    },
    columnStyles: {
      0: { cellWidth: 'auto' },
      1: { halign: 'center', cellWidth: 20 },
      2: { halign: 'right', cellWidth: 30 },
      3: { halign: 'right', cellWidth: 25 },
      4: { halign: 'right', cellWidth: 30 },
    },
    margin: { left: margin, right: margin },
  });

  const finalY = (doc as any).lastAutoTable.finalY || yPosition + 30;

  // ================================================================
  // RÉCAPITULATIF
  // ================================================================
  
  yPosition = finalY + 10;
  const recapX = pageWidth - margin - 60;
  
  // Sous-total
  doc.setFontSize(10);
  doc.text('Sous-total:', recapX, yPosition);
  doc.text(formatCurrency(invoice.subtotal, invoice.currency), pageWidth - margin, yPosition, { align: 'right' });
  yPosition += 7;

  // Remise
  if (invoice.discount_amount > 0) {
    doc.text('Remise:', recapX, yPosition);
    doc.text(`-${formatCurrency(invoice.discount_amount, invoice.currency)}`, pageWidth - margin, yPosition, { align: 'right' });
    yPosition += 7;
  }

  // Frais de livraison
  if (invoice.shipping_amount > 0) {
    doc.text('Frais de livraison:', recapX, yPosition);
    doc.text(formatCurrency(invoice.shipping_amount, invoice.currency), pageWidth - margin, yPosition, { align: 'right' });
    yPosition += 7;
  }

  // Taxes
  if (invoice.tax_amount > 0) {
    if (invoice.tax_breakdown && invoice.tax_breakdown.length > 0) {
      invoice.tax_breakdown.forEach((tax) => {
        doc.text(`${tax.name} (${tax.rate}%):`, recapX, yPosition);
        doc.text(formatCurrency(tax.amount, invoice.currency), pageWidth - margin, yPosition, { align: 'right' });
        yPosition += 7;
      });
    } else {
      doc.text('Taxes:', recapX, yPosition);
      doc.text(formatCurrency(invoice.tax_amount, invoice.currency), pageWidth - margin, yPosition, { align: 'right' });
      yPosition += 7;
    }
  }

  // Ligne séparatrice
  doc.setDrawColor(200, 200, 200);
  doc.line(recapX, yPosition, pageWidth - margin, yPosition);
  yPosition += 5;

  // TOTAL
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('TOTAL:', recapX, yPosition);
  doc.text(formatCurrency(invoice.total_amount, invoice.currency), pageWidth - margin, yPosition, { align: 'right' });

  // ================================================================
  // NOTES ET TERMES
  // ================================================================
  
  yPosition = finalY + 10;
  
  if (invoice.notes || invoice.terms || invoice.payment_terms) {
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 100, 100);
    
    if (invoice.notes) {
      doc.setFont('helvetica', 'bold');
      doc.text('Notes:', margin, yPosition);
      doc.setFont('helvetica', 'normal');
      const notesLines = doc.splitTextToSize(invoice.notes, pageWidth - 2 * margin - 60);
      doc.text(notesLines, margin, yPosition + 5);
      yPosition += 5 + (notesLines.length * 5);
    }
    
    if (invoice.payment_terms) {
      doc.setFont('helvetica', 'bold');
      doc.text('Conditions de paiement:', margin, yPosition);
      doc.setFont('helvetica', 'normal');
      const termsLines = doc.splitTextToSize(invoice.payment_terms, pageWidth - 2 * margin - 60);
      doc.text(termsLines, margin, yPosition + 5);
      yPosition += 5 + (termsLines.length * 5);
    }
    
    if (invoice.terms) {
      doc.setFont('helvetica', 'bold');
      doc.text('Conditions générales:', margin, yPosition);
      doc.setFont('helvetica', 'normal');
      const generalTermsLines = doc.splitTextToSize(invoice.terms, pageWidth - 2 * margin - 60);
      doc.text(generalTermsLines, margin, yPosition + 5);
    }
  }

  // ================================================================
  // PIED DE PAGE
  // ================================================================
  
  const pageHeight = doc.internal.pageSize.getHeight();
  doc.setFontSize(8);
  doc.setTextColor(150, 150, 150);
  doc.text(
    `Facture générée le ${format(new Date(), 'dd/MM/yyyy à HH:mm', { locale: fr })}`,
    pageWidth / 2,
    pageHeight - 10,
    { align: 'center' }
  );

  // Générer le blob
  return doc.output('blob');
}

/**
 * Charge une image depuis une URL
 */
function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}

/**
 * Formate un montant en devise
 */
function formatCurrency(amount: number, currency: string = 'XOF'): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: currency === 'XOF' ? 'XOF' : currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Télécharge le PDF de la facture
 */
export async function downloadInvoicePDF(invoice: Invoice): Promise<void> {
  const blob = await generateInvoicePDF(invoice);
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `facture_${invoice.invoice_number}.pdf`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

