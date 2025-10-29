/**
 * 📤 PAYHULA TEMPLATE EXPORTER V2
 * Export templates in various formats
 * 
 * @version 2.0.0
 * @author Payhula Team
 */

import {
  TemplateV2,
  TemplateExportV2,
} from '@/types/templates-v2';

// ============================================================================
// EXPORT OPTIONS
// ============================================================================

export interface TemplateExportOptions {
  // Format options
  pretty?: boolean;
  indent?: number;
  
  // Content options
  includeMetadata?: boolean;
  includeAnalytics?: boolean;
  includeHistory?: boolean;
  
  // Dependencies
  includeDependencies?: boolean;
  embedImages?: boolean;
  
  // Compression
  compress?: boolean;
  
  // Security
  includeChecksums?: boolean;
  sign?: boolean;
  signatureKey?: string;
}

export interface ExportResult {
  success: boolean;
  data?: string | Blob;
  filename?: string;
  size?: number;
  error?: string;
}

// ============================================================================
// TEMPLATE EXPORTER CLASS
// ============================================================================

export class TemplateExporter {
  private options: TemplateExportOptions;

  constructor(options: TemplateExportOptions = {}) {
    this.options = {
      pretty: true,
      indent: 2,
      includeMetadata: true,
      includeAnalytics: false,
      includeHistory: false,
      includeDependencies: true,
      embedImages: false,
      compress: false,
      includeChecksums: true,
      sign: false,
      ...options,
    };
  }

  /**
   * Export template to JSON string
   */
  exportToJSON(template: TemplateV2): ExportResult {
    try {
      // Clean template (remove unwanted data)
      const cleanedTemplate = this.cleanTemplate(template);
      
      // Collect dependencies
      const dependencies = this.options.includeDependencies 
        ? this.collectDependencies(template)
        : undefined;
      
      // Generate checksums
      const checksums = this.options.includeChecksums
        ? this.generateChecksums(template)
        : undefined;
      
      // Create export object
      const exportData: TemplateExportV2 = {
        version: '2.0.0',
        exportedAt: new Date().toISOString(),
        exportedBy: 'Payhula Platform',
        template: cleanedTemplate,
        dependencies,
        checksums,
      };
      
      // Convert to JSON
      const json = JSON.stringify(
        exportData,
        null,
        this.options.pretty ? this.options.indent : 0
      );
      
      const size = new Blob([json]).size;
      const filename = this.generateFilename(template, 'json');
      
      return {
        success: true,
        data: json,
        filename,
        size,
      };
      
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Export failed',
      };
    }
  }

  /**
   * Export template as downloadable file
   */
  exportAsFile(template: TemplateV2): ExportResult {
    const jsonResult = this.exportToJSON(template);
    
    if (!jsonResult.success || !jsonResult.data) {
      return jsonResult;
    }
    
    try {
      const blob = new Blob([jsonResult.data], { type: 'application/json' });
      
      return {
        success: true,
        data: blob,
        filename: jsonResult.filename,
        size: blob.size,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'File creation failed',
      };
    }
  }

  /**
   * Export template with all assets as ZIP
   */
  async exportAsZip(template: TemplateV2): Promise<ExportResult> {
    // This would require a ZIP library (like JSZip)
    // For now, return JSON export
    return this.exportAsFile(template);
  }

  /**
   * Export multiple templates as a collection
   */
  exportCollection(
    templates: TemplateV2[],
    collectionName: string
  ): ExportResult {
    try {
      const collection = {
        name: collectionName,
        version: '2.0.0',
        exportedAt: new Date().toISOString(),
        templates: templates.map(t => this.cleanTemplate(t)),
        count: templates.length,
      };
      
      const json = JSON.stringify(
        collection,
        null,
        this.options.pretty ? this.options.indent : 0
      );
      
      const size = new Blob([json]).size;
      const filename = `${this.slugify(collectionName)}-collection-${Date.now()}.json`;
      
      return {
        success: true,
        data: json,
        filename,
        size,
      };
      
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Collection export failed',
      };
    }
  }

  /**
   * Export template as shareable URL (would require backend)
   */
  async exportAsURL(template: TemplateV2): Promise<ExportResult> {
    // This would upload to a backend and return a URL
    // For now, return base64 data URL
    const jsonResult = this.exportToJSON(template);
    
    if (!jsonResult.success || !jsonResult.data) {
      return jsonResult;
    }
    
    try {
      const base64 = btoa(jsonResult.data as string);
      const dataUrl = `data:application/json;base64,${base64}`;
      
      return {
        success: true,
        data: dataUrl,
        filename: jsonResult.filename,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'URL generation failed',
      };
    }
  }

  /**
   * Clean template (remove sensitive/unnecessary data)
   */
  private cleanTemplate(template: TemplateV2): TemplateV2 {
    const cleaned = { ...template };
    
    // Remove analytics if not included
    if (!this.options.includeAnalytics) {
      cleaned.metadata = {
        ...cleaned.metadata,
        analytics: {
          views: 0,
          downloads: 0,
          installs: 0,
          rating: cleaned.metadata.analytics.rating,
          ratingsCount: 0,
          favorites: 0,
        },
      };
    }
    
    // Remove changelog if not included
    if (!this.options.includeHistory) {
      delete cleaned.metadata.changelog;
    }
    
    // Remove migration info (not needed for export)
    delete cleaned.migrationInfo;
    
    return cleaned;
  }

  /**
   * Collect template dependencies
   */
  private collectDependencies(template: TemplateV2): any {
    const dependencies: any = {
      images: [],
      fonts: [],
      plugins: [],
    };
    
    // Collect images
    if (template.metadata.thumbnail) {
      dependencies.images.push(template.metadata.thumbnail);
    }
    dependencies.images.push(...template.metadata.previewImages);
    
    // Collect fonts from design tokens
    if (template.content.designTokens?.typography) {
      const { fontFamily } = template.content.designTokens.typography;
      if (fontFamily.heading) {
        dependencies.fonts.push(fontFamily.heading);
      }
      if (fontFamily.body) {
        dependencies.fonts.push(fontFamily.body);
      }
      if (fontFamily.mono) {
        dependencies.fonts.push(fontFamily.mono);
      }
    }
    
    // Collect plugins from compatibility
    if (template.metadata.compatibility.requiredPlugins) {
      dependencies.plugins = template.metadata.compatibility.requiredPlugins;
    }
    
    // Remove empty arrays
    Object.keys(dependencies).forEach(key => {
      if (dependencies[key].length === 0) {
        delete dependencies[key];
      }
    });
    
    return Object.keys(dependencies).length > 0 ? dependencies : undefined;
  }

  /**
   * Generate checksums for template integrity
   */
  private generateChecksums(template: TemplateV2): Record<string, string> {
    const checksums: Record<string, string> = {};
    
    // Generate checksum for template content
    const contentJson = JSON.stringify(template.content);
    checksums.content = this.simpleHash(contentJson);
    
    // Generate checksum for metadata
    const metadataJson = JSON.stringify(template.metadata);
    checksums.metadata = this.simpleHash(metadataJson);
    
    // Generate overall checksum
    const templateJson = JSON.stringify(template);
    checksums.template = this.simpleHash(templateJson);
    
    return checksums;
  }

  /**
   * Simple hash function (for checksums)
   */
  private simpleHash(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash).toString(36);
  }

  /**
   * Generate filename for export
   */
  private generateFilename(template: TemplateV2, extension: string): string {
    const slug = this.slugify(template.metadata.name);
    const version = template.metadata.version.replace(/\./g, '-');
    const timestamp = Date.now();
    return `${slug}-${version}-${timestamp}.${extension}`;
  }

  /**
   * Generate slug from string
   */
  private slugify(str: string): string {
    return str
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
  }
}

// ============================================================================
// DOWNLOAD HELPERS
// ============================================================================

/**
 * Download a template as a file
 */
export function downloadTemplate(template: TemplateV2, options?: TemplateExportOptions): void {
  const exporter = new TemplateExporter(options);
  const result = exporter.exportAsFile(template);
  
  if (!result.success || !(result.data instanceof Blob)) {
    console.error('Export failed:', result.error);
    return;
  }
  
  // Create download link
  const url = URL.createObjectURL(result.data);
  const link = document.createElement('a');
  link.href = url;
  link.download = result.filename || 'template.json';
  
  // Trigger download
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  // Cleanup
  URL.revokeObjectURL(url);
}

/**
 * Copy template JSON to clipboard
 */
export async function copyTemplateToClipboard(
  template: TemplateV2,
  options?: TemplateExportOptions
): Promise<boolean> {
  const exporter = new TemplateExporter(options);
  const result = exporter.exportToJSON(template);
  
  if (!result.success || typeof result.data !== 'string') {
    console.error('Export failed:', result.error);
    return false;
  }
  
  try {
    await navigator.clipboard.writeText(result.data);
    return true;
  } catch (error) {
    console.error('Clipboard copy failed:', error);
    return false;
  }
}

/**
 * Share template (via Web Share API if available)
 */
export async function shareTemplate(
  template: TemplateV2,
  options?: TemplateExportOptions
): Promise<boolean> {
  if (!navigator.share) {
    console.warn('Web Share API not supported');
    return false;
  }
  
  const exporter = new TemplateExporter(options);
  const result = exporter.exportAsFile(template);
  
  if (!result.success || !(result.data instanceof Blob)) {
    console.error('Export failed:', result.error);
    return false;
  }
  
  try {
    const file = new File([result.data], result.filename || 'template.json', {
      type: 'application/json',
    });
    
    await navigator.share({
      title: template.metadata.name,
      text: template.metadata.description,
      files: [file],
    });
    
    return true;
  } catch (error) {
    console.error('Share failed:', error);
    return false;
  }
}

// ============================================================================
// QUICK EXPORT FUNCTIONS
// ============================================================================

/**
 * Quick export to JSON
 */
export function exportToJSON(template: TemplateV2): string | null {
  const exporter = new TemplateExporter();
  const result = exporter.exportToJSON(template);
  return result.success ? (result.data as string) : null;
}

/**
 * Quick download
 */
export function quickDownload(template: TemplateV2): void {
  downloadTemplate(template, { pretty: true });
}

export default TemplateExporter;

