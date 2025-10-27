/**
 * Export Reviews to CSV
 * Date : 27 octobre 2025
 */

import type { Review } from '@/types/review';

export interface ExportReviewsOptions {
  filename?: string;
  includeReplies?: boolean;
  includeMedia?: boolean;
  dateFormat?: 'iso' | 'locale';
}

/**
 * Convert reviews array to CSV string
 */
export function reviewsToCSV(
  reviews: Review[],
  options: ExportReviewsOptions = {}
): string {
  if (!reviews || reviews.length === 0) {
    return 'No reviews to export';
  }

  const { dateFormat = 'iso', includeMedia = true } = options;

  // CSV Headers
  const headers = [
    'ID',
    'Date',
    'Product Type',
    'Rating Overall',
    'Title',
    'Content',
    'Reviewer Name',
    'Reviewer Email',
    'Verified Purchase',
    'Is Approved',
    'Helpful Votes',
    'Not Helpful Votes',
    'Reply Count',
    // Detailed ratings
    'Quality Rating',
    'Value Rating',
    'Service Rating',
    'Delivery Rating',
    'Course Content Rating',
    'Instructor Rating',
    // Status
    'Is Featured',
    'Is Flagged',
  ];

  if (includeMedia) {
    headers.push('Media Count', 'Media URLs');
  }

  // Build CSV rows
  const rows = reviews.map((review) => {
    const date =
      dateFormat === 'locale'
        ? new Date(review.created_at).toLocaleDateString()
        : review.created_at;

    const mediaUrls = review.review_media
      ?.map((m: any) => m.media_url)
      .join(' | ') || '';

    const row = [
      review.id,
      date,
      review.product_type || 'N/A',
      review.rating,
      escapeCsvValue(review.title || ''),
      escapeCsvValue(review.content || ''),
      escapeCsvValue(review.reviewer_name || 'Anonymous'),
      review.user?.email || 'N/A',
      review.is_verified_purchase ? 'Yes' : 'No',
      review.is_approved ? 'Yes' : 'No',
      review.helpful_count || 0,
      review.not_helpful_count || 0,
      review.replies_count || 0,
      // Detailed ratings
      review.quality_rating || 'N/A',
      review.value_rating || 'N/A',
      review.service_rating || 'N/A',
      review.delivery_rating || 'N/A',
      review.course_content_rating || 'N/A',
      review.instructor_rating || 'N/A',
      // Status
      review.is_featured ? 'Yes' : 'No',
      review.is_flagged ? 'Yes' : 'No',
    ];

    if (includeMedia) {
      row.push(
        String(review.review_media?.length || 0),
        escapeCsvValue(mediaUrls)
      );
    }

    return row;
  });

  // Combine headers and rows
  const csvContent = [headers, ...rows]
    .map((row) => row.join(','))
    .join('\n');

  return csvContent;
}

/**
 * Escape CSV values (handle commas, quotes, newlines)
 */
function escapeCsvValue(value: string): string {
  if (!value) return '';
  
  // Convert to string
  const stringValue = String(value);
  
  // If contains comma, quote, or newline, wrap in quotes and escape quotes
  if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }
  
  return stringValue;
}

/**
 * Download CSV file
 */
export function downloadCSV(csvContent: string, filename: string = 'reviews.csv'): void {
  // Add UTF-8 BOM for Excel compatibility
  const BOM = '\uFEFF';
  const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
  
  // Create download link
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  // Clean up
  URL.revokeObjectURL(url);
}

/**
 * Main export function
 */
export async function exportReviewsToCSV(
  reviews: Review[],
  options: ExportReviewsOptions = {}
): Promise<void> {
  try {
    const { filename = `reviews_export_${new Date().toISOString().split('T')[0]}.csv` } = options;
    
    if (!reviews || reviews.length === 0) {
      throw new Error('No reviews to export');
    }

    // Convert to CSV
    const csvContent = reviewsToCSV(reviews, options);
    
    // Download
    downloadCSV(csvContent, filename);
    
    console.log(`✅ Exported ${reviews.length} reviews to ${filename}`);
  } catch (error) {
    console.error('❌ Error exporting reviews:', error);
    throw error;
  }
}

/**
 * Export with filters
 */
export interface ExportFilters {
  productId?: string;
  minRating?: number;
  maxRating?: number;
  startDate?: string;
  endDate?: string;
  verifiedOnly?: boolean;
  approvedOnly?: boolean;
}

export function filterReviewsForExport(
  reviews: Review[],
  filters: ExportFilters
): Review[] {
  let filtered = [...reviews];

  if (filters.productId) {
    filtered = filtered.filter((r) => r.product_id === filters.productId);
  }

  if (filters.minRating !== undefined) {
    filtered = filtered.filter((r) => r.rating >= filters.minRating!);
  }

  if (filters.maxRating !== undefined) {
    filtered = filtered.filter((r) => r.rating <= filters.maxRating!);
  }

  if (filters.startDate) {
    filtered = filtered.filter((r) => r.created_at >= filters.startDate!);
  }

  if (filters.endDate) {
    filtered = filtered.filter((r) => r.created_at <= filters.endDate!);
  }

  if (filters.verifiedOnly) {
    filtered = filtered.filter((r) => r.is_verified_purchase);
  }

  if (filters.approvedOnly) {
    filtered = filtered.filter((r) => r.is_approved);
  }

  return filtered;
}

