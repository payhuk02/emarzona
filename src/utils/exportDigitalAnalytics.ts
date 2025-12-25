/**
 * Export Digital Analytics to PDF/Excel
 * Date: 2025-01-27
 */

import { loadPDFModules } from '@/lib/pdf-loader';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export interface DigitalAnalyticsData {
  total_downloads: number;
  unique_downloaders: number;
  success_rate: number;
  total_revenue: number;
  total_bandwidth: number;
  trends?: Array<{ date: string; downloads: number; users: number }>;
  topFiles?: Array<{ filename: string; downloads: number; size: number }>;
  topUsers?: Array<{ user_id: string; downloads: number; last_download: string }>;
  licenseStats?: {
    total: number;
    active: number;
    expired: number;
    suspended: number;
  };
}

export interface ExportOptions {
  format: 'pdf' | 'excel' | 'csv';
  productName?: string;
  dateRange?: { from: Date; to: Date };
  includeCharts?: boolean;
}

/**
 * Export analytics to PDF
 */
export const exportAnalyticsToPDF = async (
  data: DigitalAnalyticsData,
  options: ExportOptions = { format: 'pdf' }
): Promise<void> => {
  // Charger jspdf et autotable de manière asynchrone
  const { jsPDF, autoTable } = await loadPDFModules();
  
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  
  // Header
  doc.setFontSize(20);
  doc.text('Rapport Analytics Produits Digitaux', pageWidth / 2, 20, { align: 'center' });
  
  if (options.productName) {
    doc.setFontSize(14);
    doc.text(`Produit: ${options.productName}`, pageWidth / 2, 30, { align: 'center' });
  }
  
  if (options.dateRange) {
    doc.setFontSize(10);
    doc.text(
      `Période: ${format(options.dateRange.from, 'dd/MM/yyyy', { locale: fr })} - ${format(options.dateRange.to, 'dd/MM/yyyy', { locale: fr })}`,
      pageWidth / 2,
      36,
      { align: 'center' }
    );
  }
  
  doc.setFontSize(10);
  doc.text(
    `Généré le: ${format(new Date(), 'dd/MM/yyyy à HH:mm', { locale: fr })}`,
    pageWidth / 2,
    42,
    { align: 'center' }
  );
  
  // Overview Stats
  let yPos = 55;
  doc.setFontSize(14);
  doc.text('Vue d\'ensemble', 14, yPos);
  yPos += 10;
  
  const statsData = [
    ['Métrique', 'Valeur'],
    ['Téléchargements totaux', data.total_downloads.toLocaleString()],
    ['Utilisateurs uniques', data.unique_downloaders.toLocaleString()],
    ['Taux de succès', `${data.success_rate.toFixed(1)}%`],
    ['Revenus totaux', `${data.total_revenue.toLocaleString()} XOF`],
    ['Bande passante', `${(data.total_bandwidth / 1024 / 1024).toFixed(2)} MB`],
  ];
  
  autoTable(doc, {
    startY: yPos,
    head: [statsData[0]],
    body: statsData.slice(1),
    theme: 'striped',
    headStyles: { fillColor: [59, 130, 246] },
    styles: { fontSize: 10 },
  });
  
  // jspdf-autotable ajoute lastAutoTable au document
  const docWithAutoTable = doc as typeof doc & { lastAutoTable?: { finalY: number } };
  yPos = (docWithAutoTable.lastAutoTable?.finalY ?? yPos) + 15;
  
  // License Stats
  if (data.licenseStats) {
    doc.setFontSize(14);
    doc.text('Statistiques Licences', 14, yPos);
    yPos += 10;
    
    const licenseData = [
      ['Statut', 'Nombre'],
      ['Total', data.licenseStats.total.toString()],
      ['Actives', data.licenseStats.active.toString()],
      ['Expirées', data.licenseStats.expired.toString()],
      ['Suspendues', data.licenseStats.suspended.toString()],
    ];
    
    autoTable(doc, {
      startY: yPos,
      head: [licenseData[0]],
      body: licenseData.slice(1),
      theme: 'striped',
      headStyles: { fillColor: [34, 197, 94] },
      styles: { fontSize: 10 },
    });
    
    yPos = (docWithAutoTable.lastAutoTable?.finalY ?? yPos) + 15;
  }
  
  // Top Files
  if (data.topFiles && data.topFiles.length > 0) {
    // Check if we need a new page
    if (yPos > pageHeight - 40) {
      doc.addPage();
      yPos = 20;
    }
    
    doc.setFontSize(14);
    doc.text('Fichiers les plus téléchargés', 14, yPos);
    yPos += 10;
    
    const filesData = [
      ['Fichier', 'Téléchargements', 'Taille (MB)'],
      ...data.topFiles.map((file) => [
        file.filename,
        file.downloads.toString(),
        (file.size / 1024 / 1024).toFixed(2),
      ]),
    ];
    
    autoTable(doc, {
      startY: yPos,
      head: [filesData[0]],
      body: filesData.slice(1),
      theme: 'striped',
      headStyles: { fillColor: [168, 85, 247] },
      styles: { fontSize: 9 },
    });
    
    yPos = (docWithAutoTable.lastAutoTable?.finalY ?? yPos) + 15;
  }
  
  // Trends (if available and requested)
  if (options.includeCharts && data.trends && data.trends.length > 0) {
    if (yPos > pageHeight - 40) {
      doc.addPage();
      yPos = 20;
    }
    
    doc.setFontSize(14);
    doc.text('Tendances (Derniers jours)', 14, yPos);
    yPos += 10;
    
    const trendsData = [
      ['Date', 'Téléchargements', 'Utilisateurs'],
      ...data.trends.slice(-10).map((trend) => [
        format(new Date(trend.date), 'dd/MM/yyyy', { locale: fr }),
        trend.downloads.toString(),
        trend.users.toString(),
      ]),
    ];
    
    autoTable(doc, {
      startY: yPos,
      head: [trendsData[0]],
      body: trendsData.slice(1),
      theme: 'striped',
      headStyles: { fillColor: [251, 146, 60] },
      styles: { fontSize: 9 },
    });
  }
  
  // Footer
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.text(
      `Page ${i} / ${totalPages}`,
      pageWidth / 2,
      pageHeight - 10,
      { align: 'center' }
    );
  }
  
  // Download
  const filename = `analytics_${options.productName?.replace(/\s+/g, '_') || 'digital'}_${format(new Date(), 'yyyy-MM-dd')}.pdf`;
  doc.save(filename);
};

/**
 * Export analytics to CSV
 */
export const exportAnalyticsToCSV = (
  data: DigitalAnalyticsData,
  options: ExportOptions = { format: 'csv' }
): void => {
  const rows: string[] = [];
  
  // Header
  rows.push('Rapport Analytics Produits Digitaux');
  if (options.productName) {
    rows.push(`Produit: ${options.productName}`);
  }
  if (options.dateRange) {
    rows.push(
      `Période: ${format(options.dateRange.from, 'dd/MM/yyyy', { locale: fr })} - ${format(options.dateRange.to, 'dd/MM/yyyy', { locale: fr })}`
    );
  }
  rows.push(`Généré le: ${format(new Date(), 'dd/MM/yyyy à HH:mm', { locale: fr })}`);
  rows.push('');
  
  // Overview
  rows.push('Vue d\'ensemble');
  rows.push('Métrique,Valeur');
  rows.push(`Téléchargements totaux,${data.total_downloads}`);
  rows.push(`Utilisateurs uniques,${data.unique_downloaders}`);
  rows.push(`Taux de succès,${data.success_rate.toFixed(1)}%`);
  rows.push(`Revenus totaux,${data.total_revenue}`);
  rows.push(`Bande passante (MB),${(data.total_bandwidth / 1024 / 1024).toFixed(2)}`);
  rows.push('');
  
  // License Stats
  if (data.licenseStats) {
    rows.push('Statistiques Licences');
    rows.push('Statut,Nombre');
    rows.push(`Total,${data.licenseStats.total}`);
    rows.push(`Actives,${data.licenseStats.active}`);
    rows.push(`Expirées,${data.licenseStats.expired}`);
    rows.push(`Suspendues,${data.licenseStats.suspended}`);
    rows.push('');
  }
  
  // Top Files
  if (data.topFiles && data.topFiles.length > 0) {
    rows.push('Fichiers les plus téléchargés');
    rows.push('Fichier,Téléchargements,Taille (MB)');
    data.topFiles.forEach((file) => {
      rows.push(`${file.filename},${file.downloads},${(file.size / 1024 / 1024).toFixed(2)}`);
    });
    rows.push('');
  }
  
  // Trends
  if (data.trends && data.trends.length > 0) {
    rows.push('Tendances');
    rows.push('Date,Téléchargements,Utilisateurs');
    data.trends.forEach((trend) => {
      rows.push(
        `${format(new Date(trend.date), 'dd/MM/yyyy', { locale: fr })},${trend.downloads},${trend.users}`
      );
    });
  }
  
  // Download
  const csvContent = rows.join('\n');
  const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', `analytics_${options.productName?.replace(/\s+/g, '_') || 'digital'}_${format(new Date(), 'yyyy-MM-dd')}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

/**
 * Export analytics to Excel (via CSV with Excel-friendly format)
 */
export const exportAnalyticsToExcel = (
  data: DigitalAnalyticsData,
  options: ExportOptions = { format: 'excel' }
): void => {
  // Excel can read CSV files, so we use CSV format with UTF-8 BOM
  exportAnalyticsToCSV(data, { ...options, format: 'csv' });
};

