/**
 * Export Digital Products to CSV/Excel/PDF
 * Date: 2025-01-27
 */

import { loadPDFModules } from '@/lib/pdf-loader';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export interface DigitalProductExportData {
  id: string;
  name: string;
  slug: string;
  description?: string;
  price: number;
  currency: string;
  digital_type: string;
  license_type: string;
  total_downloads: number;
  average_rating: number;
  total_reviews: number;
  status: string;
  created_at: string;
  version?: string;
}

/**
 * Export products to CSV
 */
export const exportDigitalProductsToCSV = (products: DigitalProductExportData[]): void => {
  const headers = [
    'ID',
    'Nom',
    'Slug',
    'Description',
    'Prix',
    'Devise',
    'Type',
    'Licence',
    'Téléchargements',
    'Note moyenne',
    "Nombre d'avis",
    'Statut',
    'Version',
    'Date de création',
  ];

  const csvRows: string[] = [headers.join(',')];

  for (const product of products) {
    const row = [
      product.id,
      `"${(product.name || '').replace(/"/g, '""')}"`,
      product.slug || '',
      `"${(product.description || '').replace(/"/g, '""')}"`,
      product.price || 0,
      product.currency || 'XOF',
      product.digital_type || 'other',
      product.license_type || 'single',
      product.total_downloads || 0,
      product.average_rating || 0,
      product.total_reviews || 0,
      product.status || 'Brouillon',
      product.version || '',
      product.created_at || '',
    ];
    csvRows.push(row.join(','));
  }

  const csvContent = csvRows.join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  link.setAttribute('href', url);
  link.setAttribute(
    'download',
    `produits_digitaux_${format(new Date(), 'yyyy-MM-dd', { locale: fr })}.csv`
  );
  link.style.visibility = 'hidden';

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

/**
 * Export products to Excel (XLSX)
 */
export const exportDigitalProductsToExcel = async (
  products: DigitalProductExportData[]
): Promise<void> => {
  try {
    // Charger dynamiquement la bibliothèque XLSX
    const XLSX = await import('xlsx');

    const worksheetData = [
      [
        'ID',
        'Nom',
        'Slug',
        'Description',
        'Prix',
        'Devise',
        'Type',
        'Licence',
        'Téléchargements',
        'Note moyenne',
        "Nombre d'avis",
        'Statut',
        'Version',
        'Date de création',
      ],
      ...products.map(product => [
        product.id,
        product.name || '',
        product.slug || '',
        product.description || '',
        product.price || 0,
        product.currency || 'XOF',
        product.digital_type || 'other',
        product.license_type || 'single',
        product.total_downloads || 0,
        product.average_rating || 0,
        product.total_reviews || 0,
        product.status || 'Brouillon',
        product.version || '',
        product.created_at || '',
      ]),
    ];

    const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);

    // Ajuster la largeur des colonnes
    worksheet['!cols'] = [
      { wch: 36 }, // ID
      { wch: 30 }, // Nom
      { wch: 30 }, // Slug
      { wch: 50 }, // Description
      { wch: 10 }, // Prix
      { wch: 8 }, // Devise
      { wch: 15 }, // Type
      { wch: 15 }, // Licence
      { wch: 15 }, // Téléchargements
      { wch: 12 }, // Note moyenne
      { wch: 12 }, // Nombre d'avis
      { wch: 12 }, // Statut
      { wch: 10 }, // Version
      { wch: 20 }, // Date de création
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Produits Digitaux');

    // Générer le fichier Excel
    XLSX.writeFile(
      workbook,
      `produits_digitaux_${format(new Date(), 'yyyy-MM-dd', { locale: fr })}.xlsx`
    );
  } catch (error) {
    console.error("Erreur lors de l'export Excel:", error);
    throw new Error("Impossible d'exporter en Excel. Veuillez installer la bibliothèque xlsx.");
  }
};

/**
 * Export products to PDF
 */
export const exportDigitalProductsToPDF = async (
  products: DigitalProductExportData[],
  options?: { storeName?: string }
): Promise<void> => {
  try {
    const { jsPDF, autoTable } = await loadPDFModules();

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    // Header
    doc.setFontSize(20);
    doc.text('Liste des Produits Digitaux', pageWidth / 2, 20, { align: 'center' });

    if (options?.storeName) {
      doc.setFontSize(14);
      doc.text(`Boutique: ${options.storeName}`, pageWidth / 2, 30, { align: 'center' });
    }

    doc.setFontSize(10);
    doc.text(
      `Généré le: ${format(new Date(), 'dd/MM/yyyy à HH:mm', { locale: fr })}`,
      pageWidth / 2,
      38,
      { align: 'center' }
    );

    doc.setFontSize(10);
    doc.text(`Total: ${products.length} produit(s)`, pageWidth / 2, 45, { align: 'center' });

    // Préparer les données pour le tableau
    const tableData = products.map(product => [
      product.name || 'Sans nom',
      `${product.price} ${product.currency}`,
      product.digital_type || 'other',
      product.license_type || 'single',
      (product.total_downloads || 0).toString(),
      (product.average_rating || 0).toFixed(1),
      product.status || 'Brouillon',
    ]);

    // Tableau principal
    autoTable(doc, {
      startY: 55,
      head: [['Nom', 'Prix', 'Type', 'Licence', 'Téléchargements', 'Note', 'Statut']],
      body: tableData,
      theme: 'striped',
      headStyles: { fillColor: [139, 92, 246] }, // Purple
      styles: { fontSize: 9 },
      margin: { top: 55 },
    });

    // Footer avec pagination
    const totalPages = doc.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.text(`Page ${i} / ${totalPages}`, pageWidth / 2, pageHeight - 10, { align: 'center' });
    }

    // Télécharger le PDF
    const filename = `produits_digitaux_${format(new Date(), 'yyyy-MM-dd', { locale: fr })}.pdf`;
    doc.save(filename);
  } catch (error) {
    console.error("Erreur lors de l'export PDF:", error);
    throw new Error("Impossible d'exporter en PDF");
  }
};
