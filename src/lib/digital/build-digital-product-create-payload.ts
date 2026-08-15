import type {
  DigitalProductDownloadableFile,
  DigitalProductFAQ,
  DigitalProductFormData,
} from '@/types/digital-product-form';
import { buildDigitalProductFilesPayload } from '@/lib/digital/build-digital-product-files-payload';
import { resolvePrimaryDigitalFile } from '@/lib/digital/resolve-primary-digital-file';
import type { DigitalProductFileRpcPayload } from '@/lib/digital/build-digital-product-files-payload';

function sanitizeStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === 'string' && item.trim().length > 0);
}

function sanitizeFaqs(value: unknown): Array<{ question: string; answer: string; order: number }> {
  if (!Array.isArray(value)) return [];
  return value
    .map((item, index) => {
      if (!item || typeof item !== 'object') return null;
      const faq = item as DigitalProductFAQ;
      const question = typeof faq.question === 'string' ? faq.question.trim() : '';
      const answer = typeof faq.answer === 'string' ? faq.answer.trim() : '';
      if (!question && !answer) return null;
      return {
        question,
        answer,
        order: typeof faq.order === 'number' ? faq.order : index,
      };
    })
    .filter((item): item is { question: string; answer: string; order: number } => item !== null);
}

function computeTotalSizeMb(files?: DigitalProductDownloadableFile[] | null): number {
  if (!files?.length) return 0;
  return files.reduce((sum, file) => sum + (file.size ?? 0) / (1024 * 1024), 0);
}

export type DigitalProductCreatePayloads = {
  product: Record<string, unknown>;
  digital: Record<string, unknown>;
  files: DigitalProductFileRpcPayload[];
};

export function buildDigitalProductCreatePayloads(input: {
  formData: DigitalProductFormData;
  slug: string;
  isDraft: boolean;
}): DigitalProductCreatePayloads {
  const { formData, slug, isDraft } = input;
  const mainFile = resolvePrimaryDigitalFile(formData.downloadable_files);
  const mainFileUrl = formData.main_file_url?.trim() || mainFile?.url?.trim() || '';
  const mainFileFormat =
    mainFile?.format ||
    (mainFile as { type?: string } | undefined)?.type?.split('/')[1] ||
    mainFile?.name?.split('.').pop() ||
    'unknown';
  const images = sanitizeStringArray(formData.images);
  const imageUrl = formData.image_url?.trim() || (images.length > 0 ? images[0] : '');

  const product: Record<string, unknown> = {
    name: formData.name.trim(),
    slug,
    description: formData.description ?? '',
    short_description: formData.short_description ?? '',
    category: formData.category || 'other',
    price: formData.pricing_model === 'free' ? 0 : formData.price,
    promotional_price: formData.promotional_price ?? null,
    currency: formData.currency || 'XOF',
    pricing_model: formData.pricing_model || 'one-time',
    image_url: imageUrl,
    images: images.length > 0 ? images : imageUrl ? [imageUrl] : [],
    licensing_type: formData.licensing_type || 'standard',
    license_terms: formData.license_terms?.trim() || null,
    is_active: !isDraft,
    is_draft: isDraft,
    meta_title: formData.seo?.meta_title?.trim() || formData.name.trim(),
    meta_description: formData.seo?.meta_description?.trim() || formData.short_description || '',
    og_image: formData.seo?.og_image?.trim() || null,
    faqs: sanitizeFaqs(formData.faqs),
    hide_purchase_count: formData.hide_purchase_count ?? false,
    hide_likes_count: formData.hide_likes_count ?? false,
    hide_recommendations_count: formData.hide_recommendations_count ?? false,
    hide_downloads_count: formData.hide_downloads_count ?? false,
    hide_reviews_count: formData.hide_reviews_count ?? false,
    hide_rating: formData.hide_rating ?? false,
  };

  const totalSizeMB = computeTotalSizeMb(formData.downloadable_files);
  const downloadLimit = typeof formData.download_limit === 'number' ? formData.download_limit : 5;
  const downloadExpiryDays =
    typeof formData.download_expiry_days === 'number' ? formData.download_expiry_days : 30;

  const digital: Record<string, unknown> = {
    digital_type: formData.digital_type || 'other',
    license_type: formData.license_type || 'single',
    license_duration_days: formData.license_duration_days ?? null,
    max_activations:
      formData.max_activations ??
      (formData.license_type === 'unlimited' ? -1 : formData.license_type === 'multi' ? 5 : 1),
    allow_license_transfer: formData.allow_license_transfer ?? false,
    auto_generate_keys: formData.auto_generate_keys !== false,
    main_file_url: mainFileUrl,
    main_file_size_mb: mainFile ? (mainFile.size ?? 0) / (1024 * 1024) : 0,
    main_file_format: mainFileFormat,
    main_file_version: formData.main_file_version || '1.0',
    total_files: formData.downloadable_files?.length || (mainFileUrl ? 1 : 0),
    total_size_mb: totalSizeMB,
    download_limit: downloadLimit,
    download_expiry_days: downloadExpiryDays,
    require_registration: formData.require_registration !== false,
    watermark_enabled: formData.watermark_enabled ?? false,
    watermark_text: formData.watermark_text ?? '',
    version: formData.version || '1.0',
  };

  const files = buildDigitalProductFilesPayload({
    main_file_url: mainFileUrl,
    main_file_version: formData.main_file_version,
    downloadable_files: formData.downloadable_files,
    mainFileMeta: mainFile
      ? {
          name: mainFile.name,
          size: mainFile.size,
          type: mainFile.format || (mainFile as { type?: string }).type,
        }
      : mainFileUrl
        ? { name: formData.name ? `${formData.name}-main` : undefined }
        : null,
  });

  return { product, digital, files };
}
