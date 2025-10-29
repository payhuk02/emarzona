/**
 * 📥 PAYHULA TEMPLATE IMPORTER V2
 * Import templates from various formats with validation
 * 
 * @version 2.0.0
 * @author Payhula Team
 */

import {
  TemplateV2,
  TemplateExportV2,
  TemplateImportOptionsV2,
  TemplateImportResultV2,
  ImportError,
  ImportWarning,
  Template as TemplateV1,
} from '@/types/templates-v2';
import { TemplateValidator, TemplateUtils } from './template-engine';

// ============================================================================
// TEMPLATE IMPORTER CLASS
// ============================================================================

export class TemplateImporter {
  private options: TemplateImportOptionsV2;

  constructor(options: TemplateImportOptionsV2 = {}) {
    this.options = {
      validateOnly: false,
      skipDependencies: false,
      overwriteExisting: false,
      preserveIds: true,
      importAsNew: false,
      ...options,
    };
  }

  /**
   * Import a template from JSON string
   */
  async importFromJSON(json: string): Promise<TemplateImportResultV2> {
    const startTime = performance.now();
    const errors: ImportError[] = [];
    const warnings: ImportWarning[] = [];

    try {
      // Parse JSON
      let data: any;
      try {
        data = JSON.parse(json);
      } catch (error) {
        return {
          success: false,
          errors: [{
            code: 'INVALID_JSON',
            message: 'Invalid JSON format',
            severity: 'critical',
          }],
          duration: performance.now() - startTime,
        };
      }

      // Detect format version
      const version = data.version || '1.0';
      
      let template: TemplateV2;
      
      if (version === '2.0.0') {
        // V2 format
        const exportData = data as TemplateExportV2;
        template = exportData.template;
        
        // Validate checksums if provided
        if (exportData.checksums && !this.options.skipDependencies) {
          const checksumWarnings = this.validateChecksums(exportData.checksums);
          warnings.push(...checksumWarnings);
        }
      } else if (version === '1.0') {
        // V1 format - migrate
        const v1Template = data.template as TemplateV1;
        const migrationResult = await this.migrateV1toV2(v1Template);
        
        if (!migrationResult.success) {
          return {
            success: false,
            errors: migrationResult.errors || [],
            warnings: migrationResult.warnings || [],
            duration: performance.now() - startTime,
          };
        }
        
        template = migrationResult.template!;
        warnings.push({
          code: 'MIGRATED_FROM_V1',
          message: 'Template was migrated from v1 to v2',
          suggestion: 'Review migrated template for any changes',
        });
      } else {
        return {
          success: false,
          errors: [{
            code: 'UNSUPPORTED_VERSION',
            message: `Unsupported template version: ${version}`,
            severity: 'critical',
          }],
          duration: performance.now() - startTime,
        };
      }

      // Generate new ID if requested
      if (this.options.importAsNew || !this.options.preserveIds) {
        template.metadata.id = TemplateUtils.generateId('imported');
        template.metadata.slug = TemplateUtils.generateSlug(
          `${template.metadata.name}-${Date.now()}`
        );
      }

      // Validate template
      const validation = TemplateValidator.validate(template);
      
      if (!validation.valid) {
        errors.push(...validation.errors.map(e => ({
          ...e,
          severity: 'error' as const,
        })));
      }
      
      warnings.push(...validation.warnings);

      // Return if validation-only mode
      if (this.options.validateOnly) {
        return {
          success: validation.valid,
          template: validation.valid ? template : undefined,
          errors,
          warnings,
          duration: performance.now() - startTime,
        };
      }

      // Check for existing template
      if (!this.options.overwriteExisting) {
        const exists = await this.checkTemplateExists(template.metadata.id);
        if (exists) {
          errors.push({
            code: 'TEMPLATE_EXISTS',
            message: `Template with ID ${template.metadata.id} already exists`,
            severity: 'error',
          });
          
          return {
            success: false,
            errors,
            warnings,
            duration: performance.now() - startTime,
          };
        }
      }

      // Import dependencies if needed
      if (!this.options.skipDependencies && data.dependencies) {
        const depWarnings = await this.importDependencies(data.dependencies);
        warnings.push(...depWarnings);
      }

      // Calculate import stats
      const imported = {
        templateId: template.metadata.id,
        sections: template.content.sections.length,
        variables: template.content.logic?.variables?.length || 0,
        dependencies: data.dependencies ? 
          Object.keys(data.dependencies).length : 0,
      };

      return {
        success: errors.length === 0,
        template,
        errors,
        warnings,
        imported,
        duration: performance.now() - startTime,
      };

    } catch (error) {
      return {
        success: false,
        errors: [{
          code: 'IMPORT_ERROR',
          message: error instanceof Error ? error.message : 'Unknown import error',
          severity: 'critical',
        }],
        duration: performance.now() - startTime,
      };
    }
  }

  /**
   * Import a template from a File object
   */
  async importFromFile(file: File): Promise<TemplateImportResultV2> {
    try {
      const text = await file.text();
      return this.importFromJSON(text);
    } catch (error) {
      return {
        success: false,
        errors: [{
          code: 'FILE_READ_ERROR',
          message: error instanceof Error ? error.message : 'Failed to read file',
          severity: 'critical',
        }],
      };
    }
  }

  /**
   * Import a template from a URL
   */
  async importFromURL(url: string): Promise<TemplateImportResultV2> {
    try {
      const response = await fetch(url);
      
      if (!response.ok) {
        return {
          success: false,
          errors: [{
            code: 'FETCH_ERROR',
            message: `Failed to fetch template: ${response.statusText}`,
            severity: 'critical',
          }],
        };
      }

      const json = await response.text();
      return this.importFromJSON(json);
    } catch (error) {
      return {
        success: false,
        errors: [{
          code: 'URL_IMPORT_ERROR',
          message: error instanceof Error ? error.message : 'Failed to import from URL',
          severity: 'critical',
        }],
      };
    }
  }

  /**
   * Batch import multiple templates
   */
  async importBatch(files: File[]): Promise<TemplateImportResultV2[]> {
    const results: TemplateImportResultV2[] = [];
    
    for (const file of files) {
      const result = await this.importFromFile(file);
      results.push(result);
    }
    
    return results;
  }

  /**
   * Migrate a v1 template to v2 format
   */
  private async migrateV1toV2(v1Template: TemplateV1): Promise<TemplateImportResultV2> {
    const errors: ImportError[] = [];
    const warnings: ImportWarning[] = [];

    try {
      // Create v2 template structure
      const v2Template: TemplateV2 = {
        metadata: {
          // Basic info from v1
          id: v1Template.metadata.id,
          slug: TemplateUtils.generateSlug(v1Template.metadata.name),
          version: '2.0.0',
          name: v1Template.metadata.name,
          description: v1Template.metadata.description,
          shortDescription: v1Template.metadata.description.substring(0, 150),
          
          // Classification
          productType: v1Template.metadata.productType,
          category: v1Template.metadata.category,
          tags: v1Template.metadata.tags,
          industry: [],
          
          // Tier & Status
          tier: v1Template.metadata.premium ? 'premium' : 'free',
          status: 'published',
          price: v1Template.metadata.price,
          currency: 'EUR',
          
          // Design (inferred)
          designStyle: 'professional',
          colorScheme: 'auto',
          
          // Author
          author: {
            id: 'payhula',
            name: v1Template.metadata.author,
            verified: true,
          },
          
          // License
          license: {
            type: 'commercial',
          },
          
          // Media
          thumbnail: v1Template.metadata.thumbnail,
          previewImages: v1Template.metadata.preview_images,
          
          // Dates
          createdAt: v1Template.metadata.createdAt,
          updatedAt: v1Template.metadata.updatedAt,
          publishedAt: v1Template.metadata.createdAt,
          
          // Analytics
          analytics: {
            views: 0,
            downloads: v1Template.metadata.downloads,
            installs: 0,
            rating: v1Template.metadata.rating,
            ratingsCount: 0,
            favorites: 0,
          },
          
          // Compatibility
          compatibility: {
            minVersion: '1.0.0',
          },
          
          // SEO
          seo: {
            title: v1Template.data.seo.meta_title_template || v1Template.metadata.name,
            description: v1Template.data.seo.meta_description_template || v1Template.metadata.description,
            keywords: v1Template.data.seo.meta_keywords || [],
          },
          
          // i18n
          supportedLanguages: ['fr'],
          defaultLanguage: 'fr',
          
          // Features
          features: v1Template.data.basicInfo.features || [],
        },
        
        content: {
          // Design tokens (default)
          designTokens: this.generateDefaultDesignTokens(),
          
          // Content
          content: {
            default: v1Template.data,
          },
          
          // Sections (minimal conversion)
          sections: [{
            id: 'main',
            type: 'content',
            name: 'Main Content',
            enabled: true,
            order: 0,
            settings: v1Template.data.basicInfo,
          }],
          
          // Product-specific settings
          digitalSettings: v1Template.data.digital ? {
            fileTypes: v1Template.data.digital.file_types || [],
            licenseManagement: {
              enabled: true,
              type: v1Template.data.digital.license_type || 'single',
            },
            downloadSettings: {
              maxDownloads: v1Template.data.digital.download_limit,
            },
            versionControl: {
              enabled: false,
            },
            security: {
              drmEnabled: v1Template.data.digital.drm_enabled,
            },
          } : undefined,
          
          physicalSettings: v1Template.data.physical ? {
            variants: {
              enabled: !!v1Template.data.physical.variants,
              types: ['color', 'size'],
            },
            inventory: {
              trackQuantity: v1Template.data.physical.inventory?.track_quantity || true,
              lowStockThreshold: v1Template.data.physical.inventory?.low_stock_threshold,
            },
            shipping: {
              required: v1Template.data.physical.shipping_required || true,
              weight: v1Template.data.physical.weight,
              dimensions: v1Template.data.physical.dimensions,
            },
            productDisplay: {},
          } : undefined,
          
          serviceSettings: v1Template.data.service ? {
            booking: {
              type: v1Template.data.service.booking_type || 'appointment',
              duration: v1Template.data.service.duration || 60,
              durationUnit: v1Template.data.service.duration_unit || 'minutes',
            },
            availability: {
              enabled: true,
            },
            capacity: {
              maxAttendees: v1Template.data.service.max_attendees || 1,
            },
            location: {
              type: v1Template.data.service.location_type || 'both',
            },
            cancellation: {
              policy: v1Template.data.service.cancellation_policy || 'Standard cancellation policy',
            },
            packages: {
              enabled: false,
            },
          } : undefined,
          
          courseSettings: v1Template.data.course ? {
            curriculum: {
              sectionsCount: v1Template.data.course.curriculum_structure?.sections_count || 5,
              lessonsTotal: 
                (v1Template.data.course.curriculum_structure?.sections_count || 5) * 
                (v1Template.data.course.curriculum_structure?.lessons_per_section || 3),
              totalDuration: v1Template.data.course.duration_hours || 10,
              durationUnit: 'hours',
            },
            content: {
              videosCount: v1Template.data.course.curriculum_structure?.total_videos,
              quizzesCount: v1Template.data.course.curriculum_structure?.total_quizzes,
            },
            access: {
              type: 'lifetime',
            },
            certification: {
              enabled: v1Template.data.course.certificate_enabled || false,
            },
            instructor: {
              name: 'Instructor Name',
              bio: 'Instructor biography',
            },
            learningPath: {
              level: v1Template.data.course.level || 'intermediate',
              prerequisites: v1Template.data.course.prerequisites || [],
              learningObjectives: v1Template.data.course.learning_objectives || [],
              targetAudience: v1Template.data.course.target_audience || [],
            },
          } : undefined,
        },
        
        migrationInfo: {
          fromVersion: '1.0',
          migratedAt: new Date().toISOString(),
          warnings: warnings.map(w => w.message),
        },
      };

      warnings.push({
        code: 'MIGRATION_SUCCESS',
        message: 'Template successfully migrated from v1 to v2',
        suggestion: 'Review the migrated template and update design tokens',
      });

      return {
        success: true,
        template: v2Template,
        errors,
        warnings,
      };

    } catch (error) {
      return {
        success: false,
        errors: [{
          code: 'MIGRATION_ERROR',
          message: error instanceof Error ? error.message : 'Migration failed',
          severity: 'critical',
        }],
        warnings,
      };
    }
  }

  /**
   * Generate default design tokens
   */
  private generateDefaultDesignTokens(): any {
    return {
      colors: {
        primary: '#3B82F6',
        secondary: '#8B5CF6',
        accent: '#F59E0B',
        background: '#FFFFFF',
        surface: '#F9FAFB',
        text: '#111827',
        textSecondary: '#6B7280',
        border: '#E5E7EB',
        success: '#10B981',
        warning: '#F59E0B',
        error: '#EF4444',
        info: '#3B82F6',
      },
      typography: {
        fontFamily: {
          heading: 'Inter, system-ui, sans-serif',
          body: 'Inter, system-ui, sans-serif',
        },
        fontSize: {
          xs: '0.75rem',
          sm: '0.875rem',
          base: '1rem',
          lg: '1.125rem',
          xl: '1.25rem',
          '2xl': '1.5rem',
          '3xl': '1.875rem',
          '4xl': '2.25rem',
        },
        fontWeight: {
          light: 300,
          normal: 400,
          medium: 500,
          semibold: 600,
          bold: 700,
        },
        lineHeight: {
          tight: 1.25,
          normal: 1.5,
          relaxed: 1.75,
        },
      },
      spacing: {
        xs: '0.25rem',
        sm: '0.5rem',
        md: '1rem',
        lg: '1.5rem',
        xl: '2rem',
        '2xl': '3rem',
        '3xl': '4rem',
        '4xl': '6rem',
      },
      borderRadius: {
        none: '0',
        sm: '0.125rem',
        md: '0.375rem',
        lg: '0.5rem',
        xl: '0.75rem',
        full: '9999px',
      },
      shadows: {
        sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
        md: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
        lg: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
        xl: '0 20px 25px -5px rgb(0 0 0 / 0.1)',
        inner: 'inset 0 2px 4px 0 rgb(0 0 0 / 0.05)',
        none: '0 0 #0000',
      },
    };
  }

  /**
   * Validate checksums
   */
  private validateChecksums(checksums: Record<string, string>): ImportWarning[] {
    const warnings: ImportWarning[] = [];
    
    // This would validate actual file checksums
    // For now, just return a warning
    warnings.push({
      code: 'CHECKSUMS_NOT_VALIDATED',
      message: 'Checksums were not validated',
      suggestion: 'Manually verify template integrity',
    });
    
    return warnings;
  }

  /**
   * Check if template exists
   */
  private async checkTemplateExists(id: string): Promise<boolean> {
    // This would check against actual storage
    // For now, return false
    return false;
  }

  /**
   * Import dependencies
   */
  private async importDependencies(dependencies: any): Promise<ImportWarning[]> {
    const warnings: ImportWarning[] = [];
    
    // Handle images
    if (dependencies.images) {
      warnings.push({
        code: 'IMAGES_NOT_IMPORTED',
        message: 'Template images were not imported automatically',
        suggestion: 'Manually upload required images',
      });
    }
    
    // Handle fonts
    if (dependencies.fonts) {
      warnings.push({
        code: 'FONTS_NOT_IMPORTED',
        message: 'Custom fonts were not imported automatically',
        suggestion: 'Ensure required fonts are available',
      });
    }
    
    // Handle plugins
    if (dependencies.plugins) {
      warnings.push({
        code: 'PLUGINS_REQUIRED',
        message: 'This template requires additional plugins',
        suggestion: `Install plugins: ${dependencies.plugins.join(', ')}`,
      });
    }
    
    return warnings;
  }
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Quick import function
 */
export async function importTemplate(
  source: string | File,
  options?: TemplateImportOptionsV2
): Promise<TemplateImportResultV2> {
  const importer = new TemplateImporter(options);
  
  if (typeof source === 'string') {
    // Try as URL first
    if (source.startsWith('http://') || source.startsWith('https://')) {
      return importer.importFromURL(source);
    }
    // Otherwise treat as JSON
    return importer.importFromJSON(source);
  } else {
    return importer.importFromFile(source);
  }
}

/**
 * Validate template without importing
 */
export async function validateTemplate(
  json: string
): Promise<TemplateImportResultV2> {
  const importer = new TemplateImporter({ validateOnly: true });
  return importer.importFromJSON(json);
}

export default TemplateImporter;

