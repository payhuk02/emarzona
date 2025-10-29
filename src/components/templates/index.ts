/**
 * 📦 TEMPLATES COMPONENTS EXPORTS
 * Central export file for all template-related components
 */

// V1 Components (existing)
export { TemplateSelector } from './TemplateSelector';

// V2 UI Components (new)
export { TemplateMarketplace } from './TemplateMarketplace';
export { TemplatePreviewModal } from './TemplatePreviewModal';
export { TemplateExporterDialog } from './TemplateExporterDialog';
export { TemplateCustomizer } from './TemplateCustomizer';
export { TemplateImporter } from './TemplateImporter';

// Re-export types
export type { TemplateV2, TemplateMetadata, TemplateData, ProductType, TemplateTier, DesignStyle } from '@/types/templates-v2';

