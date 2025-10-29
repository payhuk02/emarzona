/**
 * ⚙️ PAYHULA TEMPLATE ENGINE V2
 * Advanced template processing with variables, conditions, and loops
 * 
 * @version 2.0.0
 * @author Payhula Team
 */

import {
  TemplateV2,
  TemplateVariable,
  ConditionalBlock,
  LoopBlock,
  TemplateValidationResult,
  ValidationError,
  ValidationWarning,
} from '@/types/templates-v2';

// ============================================================================
// TEMPLATE CONTEXT
// ============================================================================

export interface TemplateContext {
  variables: Record<string, any>;
  functions?: Record<string, Function>;
  helpers?: Record<string, any>;
}

// ============================================================================
// TEMPLATE ENGINE CLASS
// ============================================================================

export class TemplateEngine {
  private context: TemplateContext;
  private template: TemplateV2;

  constructor(template: TemplateV2, context: TemplateContext = { variables: {} }) {
    this.template = template;
    this.context = context;
  }

  /**
   * Render a template with the given context
   */
  render(): any {
    try {
      const rendered = this.processContent(this.template.content);
      return {
        success: true,
        content: rendered,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Process template content recursively
   */
  private processContent(content: any): any {
    if (typeof content === 'string') {
      return this.interpolateString(content);
    }

    if (Array.isArray(content)) {
      return content.map(item => this.processContent(item));
    }

    if (content && typeof content === 'object') {
      const processed: any = {};
      
      for (const [key, value] of Object.entries(content)) {
        // Handle special directives
        if (key === '__if__') {
          const condition = this.evaluateCondition((value as any).condition);
          processed[key] = condition 
            ? this.processContent((value as any).then)
            : this.processContent((value as any).else);
        } else if (key === '__for__') {
          const items = this.getVariable((value as any).items);
          if (Array.isArray(items)) {
            processed[key] = items.map((item, index) => {
              const itemContext = {
                ...this.context.variables,
                item,
                index,
              };
              const engine = new TemplateEngine(this.template, {
                ...this.context,
                variables: itemContext,
              });
              return engine.processContent((value as any).template);
            });
          }
        } else {
          processed[key] = this.processContent(value);
        }
      }
      
      return processed;
    }

    return content;
  }

  /**
   * Interpolate variables in a string
   * Supports: {{ variable }}, {{ variable.nested }}, {{ variable | filter }}
   */
  private interpolateString(str: string): string {
    return str.replace(/\{\{\s*([^}]+)\s*\}\}/g, (match, expression) => {
      try {
        // Handle filters: {{ value | filter }}
        const parts = expression.split('|').map((p: string) => p.trim());
        let value = this.evaluateExpression(parts[0]);
        
        // Apply filters
        for (let i = 1; i < parts.length; i++) {
          const filterName = parts[i];
          value = this.applyFilter(value, filterName);
        }
        
        return String(value);
      } catch (error) {
        console.warn(`Failed to interpolate ${match}:`, error);
        return match; // Return original if interpolation fails
      }
    });
  }

  /**
   * Evaluate a JavaScript expression safely
   */
  private evaluateExpression(expression: string): any {
    try {
      // Create a safe context
      const safeContext = {
        ...this.context.variables,
        ...this.context.helpers,
      };

      // Use Function constructor for safe evaluation
      const func = new Function(
        ...Object.keys(safeContext),
        `return ${expression};`
      );
      
      return func(...Object.values(safeContext));
    } catch (error) {
      console.warn(`Failed to evaluate expression "${expression}":`, error);
      return undefined;
    }
  }

  /**
   * Evaluate a condition
   */
  private evaluateCondition(condition: string): boolean {
    try {
      const result = this.evaluateExpression(condition);
      return Boolean(result);
    } catch (error) {
      console.warn(`Failed to evaluate condition "${condition}":`, error);
      return false;
    }
  }

  /**
   * Get a variable from context (supports dot notation)
   */
  private getVariable(path: string): any {
    const parts = path.split('.');
    let current = this.context.variables;
    
    for (const part of parts) {
      if (current && typeof current === 'object' && part in current) {
        current = current[part];
      } else {
        return undefined;
      }
    }
    
    return current;
  }

  /**
   * Apply a filter to a value
   */
  private applyFilter(value: any, filterName: string): any {
    const filters: Record<string, (val: any) => any> = {
      // String filters
      uppercase: (val) => String(val).toUpperCase(),
      lowercase: (val) => String(val).toLowerCase(),
      capitalize: (val) => String(val).charAt(0).toUpperCase() + String(val).slice(1),
      trim: (val) => String(val).trim(),
      
      // Number filters
      currency: (val) => new Intl.NumberFormat('fr-FR', {
        style: 'currency',
        currency: this.context.variables.currency || 'EUR',
      }).format(Number(val)),
      number: (val) => new Intl.NumberFormat('fr-FR').format(Number(val)),
      percent: (val) => `${Number(val)}%`,
      
      // Date filters
      date: (val) => new Date(val).toLocaleDateString('fr-FR'),
      datetime: (val) => new Date(val).toLocaleString('fr-FR'),
      time: (val) => new Date(val).toLocaleTimeString('fr-FR'),
      
      // Array filters
      join: (val) => Array.isArray(val) ? val.join(', ') : val,
      length: (val) => Array.isArray(val) ? val.length : 0,
      first: (val) => Array.isArray(val) ? val[0] : val,
      last: (val) => Array.isArray(val) ? val[val.length - 1] : val,
      
      // Object filters
      json: (val) => JSON.stringify(val, null, 2),
      keys: (val) => typeof val === 'object' ? Object.keys(val) : [],
      values: (val) => typeof val === 'object' ? Object.values(val) : [],
      
      // Utility filters
      default: (val) => val || '',
      empty: (val) => !val || (Array.isArray(val) && val.length === 0),
    };

    const filter = filters[filterName];
    return filter ? filter(value) : value;
  }

  /**
   * Update context variables
   */
  setVariables(variables: Record<string, any>): void {
    this.context.variables = {
      ...this.context.variables,
      ...variables,
    };
  }

  /**
   * Get current context
   */
  getContext(): TemplateContext {
    return this.context;
  }
}

// ============================================================================
// TEMPLATE VALIDATOR
// ============================================================================

export class TemplateValidator {
  /**
   * Validate a template v2
   */
  static validate(template: TemplateV2): TemplateValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    // Validate metadata
    if (!template.metadata) {
      errors.push({
        path: 'metadata',
        message: 'Template metadata is required',
        code: 'MISSING_METADATA',
      });
    } else {
      // Validate required metadata fields
      if (!template.metadata.id) {
        errors.push({
          path: 'metadata.id',
          message: 'Template ID is required',
          code: 'MISSING_ID',
        });
      }

      if (!template.metadata.name) {
        errors.push({
          path: 'metadata.name',
          message: 'Template name is required',
          code: 'MISSING_NAME',
        });
      }

      if (!template.metadata.productType) {
        errors.push({
          path: 'metadata.productType',
          message: 'Product type is required',
          code: 'MISSING_PRODUCT_TYPE',
        });
      }

      // Validate tier pricing
      if (template.metadata.tier === 'premium' && !template.metadata.price) {
        warnings.push({
          path: 'metadata.price',
          message: 'Premium template should have a price',
          suggestion: 'Add a price for premium templates',
        });
      }
    }

    // Validate content
    if (!template.content) {
      errors.push({
        path: 'content',
        message: 'Template content is required',
        code: 'MISSING_CONTENT',
      });
    } else {
      // Validate design tokens
      if (!template.content.designTokens) {
        warnings.push({
          path: 'content.designTokens',
          message: 'Design tokens are recommended',
          suggestion: 'Add design tokens for consistent styling',
        });
      }

      // Validate sections
      if (!template.content.sections || template.content.sections.length === 0) {
        warnings.push({
          path: 'content.sections',
          message: 'Template should have at least one section',
          suggestion: 'Add sections to structure your template',
        });
      }

      // Validate logic variables
      if (template.content.logic?.variables) {
        for (const variable of template.content.logic.variables) {
          if (!variable.key) {
            errors.push({
              path: `content.logic.variables`,
              message: 'Variable key is required',
              code: 'INVALID_VARIABLE',
            });
          }

          if (variable.required && variable.defaultValue === undefined) {
            warnings.push({
              path: `content.logic.variables.${variable.key}`,
              message: `Required variable "${variable.key}" should have a default value`,
              suggestion: 'Provide a default value for required variables',
            });
          }
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Validate template variables against context
   */
  static validateContext(
    template: TemplateV2,
    context: Record<string, any>
  ): TemplateValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    const variables = template.content.logic?.variables || [];

    for (const variable of variables) {
      const value = context[variable.key];

      // Check required variables
      if (variable.required && value === undefined) {
        errors.push({
          path: variable.key,
          message: `Required variable "${variable.key}" is missing`,
          code: 'MISSING_REQUIRED_VARIABLE',
        });
        continue;
      }

      // Skip validation if value is undefined and not required
      if (value === undefined) {
        continue;
      }

      // Type validation
      if (variable.type && typeof value !== variable.type) {
        errors.push({
          path: variable.key,
          message: `Variable "${variable.key}" should be of type ${variable.type}`,
          code: 'INVALID_TYPE',
        });
      }

      // Validation rules
      if (variable.validation) {
        const { min, max, pattern, options } = variable.validation;

        // Min/Max for numbers and strings
        if (typeof value === 'number') {
          if (min !== undefined && value < min) {
            errors.push({
              path: variable.key,
              message: `Value should be at least ${min}`,
              code: 'VALUE_TOO_SMALL',
            });
          }
          if (max !== undefined && value > max) {
            errors.push({
              path: variable.key,
              message: `Value should be at most ${max}`,
              code: 'VALUE_TOO_LARGE',
            });
          }
        }

        if (typeof value === 'string') {
          if (min !== undefined && value.length < min) {
            errors.push({
              path: variable.key,
              message: `Should be at least ${min} characters`,
              code: 'STRING_TOO_SHORT',
            });
          }
          if (max !== undefined && value.length > max) {
            errors.push({
              path: variable.key,
              message: `Should be at most ${max} characters`,
              code: 'STRING_TOO_LONG',
            });
          }

          // Pattern validation
          if (pattern) {
            const regex = new RegExp(pattern);
            if (!regex.test(value)) {
              errors.push({
                path: variable.key,
                message: `Value doesn't match required pattern`,
                code: 'PATTERN_MISMATCH',
              });
            }
          }
        }

        // Options validation
        if (options && !options.includes(value)) {
          errors.push({
            path: variable.key,
            message: `Value should be one of: ${options.join(', ')}`,
            code: 'INVALID_OPTION',
          });
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }
}

// ============================================================================
// TEMPLATE UTILITIES
// ============================================================================

export class TemplateUtils {
  /**
   * Extract all variables from a template string
   */
  static extractVariables(template: string): string[] {
    const regex = /\{\{\s*([^}|]+)(?:\|[^}]*)?\s*\}\}/g;
    const variables = new Set<string>();
    let match;

    while ((match = regex.exec(template)) !== null) {
      const variable = match[1].trim();
      // Only add root variable (before dot notation)
      const rootVar = variable.split('.')[0];
      variables.add(rootVar);
    }

    return Array.from(variables);
  }

  /**
   * Replace all variables in a string with default values
   */
  static fillDefaults(
    template: string,
    defaults: Record<string, any>
  ): string {
    return template.replace(/\{\{\s*([^}]+)\s*\}\}/g, (match, expression) => {
      const variable = expression.split('|')[0].trim();
      const rootVar = variable.split('.')[0];
      return defaults[rootVar] !== undefined 
        ? String(defaults[rootVar]) 
        : match;
    });
  }

  /**
   * Deep merge two objects
   */
  static deepMerge<T>(target: T, source: Partial<T>): T {
    const output = { ...target };
    
    if (this.isObject(target) && this.isObject(source)) {
      Object.keys(source).forEach(key => {
        const sourceValue = (source as any)[key];
        const targetValue = (output as any)[key];
        
        if (this.isObject(sourceValue)) {
          (output as any)[key] = targetValue
            ? this.deepMerge(targetValue, sourceValue)
            : sourceValue;
        } else {
          (output as any)[key] = sourceValue;
        }
      });
    }
    
    return output;
  }

  /**
   * Check if value is an object
   */
  private static isObject(item: any): boolean {
    return item && typeof item === 'object' && !Array.isArray(item);
  }

  /**
   * Generate a unique slug from a string
   */
  static generateSlug(str: string): string {
    return str
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remove accents
      .replace(/[^\w\s-]/g, '') // Remove special characters
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/-+/g, '-') // Replace multiple hyphens with single
      .replace(/^-|-$/g, ''); // Remove leading/trailing hyphens
  }

  /**
   * Generate a unique ID
   */
  static generateId(prefix: string = 'tpl'): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substr(2, 9);
    return `${prefix}-${timestamp}-${random}`;
  }

  /**
   * Calculate template compatibility score (0-100)
   */
  static calculateCompatibility(
    template: TemplateV2,
    userPreferences: any
  ): number {
    let score = 100;

    // Check product type match
    if (userPreferences.productType && 
        template.metadata.productType !== userPreferences.productType) {
      score -= 50;
    }

    // Check tier preference
    if (userPreferences.tier && 
        template.metadata.tier !== userPreferences.tier) {
      score -= 10;
    }

    // Check design style
    if (userPreferences.designStyle && 
        template.metadata.designStyle !== userPreferences.designStyle) {
      score -= 15;
    }

    // Check language support
    if (userPreferences.language && 
        !template.metadata.supportedLanguages.includes(userPreferences.language)) {
      score -= 20;
    }

    return Math.max(0, score);
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  TemplateEngine,
  TemplateValidator,
  TemplateUtils,
};

