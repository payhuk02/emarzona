/**
 * ✨ PAYHULA TEMPLATE SYSTEM V2 ✨
 * Professional Template System - Shopify/Figma Level
 * 
 * @version 2.0.0
 * @author Payhula Team
 * @date 2025-10-29
 */

import { Template as TemplateV1 } from './templates';

// ============================================================================
// BASE TYPES
// ============================================================================

export type ProductType = 'digital' | 'physical' | 'service' | 'course';

export type TemplateVersion = '1.0.0' | '2.0.0';

export type TemplateTier = 'free' | 'premium' | 'pro' | 'enterprise';

export type TemplateStatus = 'draft' | 'published' | 'archived' | 'deprecated';

export type DesignStyle = 
  | 'minimal'      // Clean, épuré
  | 'modern'       // Contemporain, tendance
  | 'professional' // Corporate, sérieux
  | 'creative'     // Artistique, original
  | 'luxury'       // Premium, élégant
  | 'playful'      // Fun, coloré
  | 'bold'         // Audacieux, impactant
  | 'elegant';     // Raffiné, sophistiqué

// ============================================================================
// TEMPLATE CATEGORIES (Extended)
// ============================================================================

export type DigitalCategory = 
  | 'ebook'
  | 'software'
  | 'saas'
  | 'app'
  | 'plugin'
  | 'theme'
  | 'template'
  | 'music'
  | 'audio'
  | 'video'
  | 'graphic'
  | 'photo'
  | 'font'
  | 'code'
  | 'document';

export type PhysicalCategory = 
  | 'fashion'
  | 'electronics'
  | 'cosmetics'
  | 'jewelry'
  | 'furniture'
  | 'food'
  | 'beverage'
  | 'books'
  | 'art'
  | 'sports'
  | 'toys'
  | 'home'
  | 'garden'
  | 'automotive'
  | 'pets';

export type ServiceCategory = 
  | 'consulting'
  | 'coaching'
  | 'therapy'
  | 'repair'
  | 'maintenance'
  | 'event'
  | 'wellness'
  | 'beauty'
  | 'training'
  | 'tutoring'
  | 'photography'
  | 'videography'
  | 'design'
  | 'development'
  | 'marketing';

export type CourseCategory = 
  | 'technical'
  | 'business'
  | 'creative'
  | 'language'
  | 'health'
  | 'lifestyle'
  | 'academic'
  | 'professional'
  | 'hobby'
  | 'certification'
  | 'bootcamp'
  | 'masterclass'
  | 'workshop';

export type TemplateCategory = 
  | DigitalCategory 
  | PhysicalCategory 
  | ServiceCategory 
  | CourseCategory;

// ============================================================================
// INTERNATIONALIZATION
// ============================================================================

export type SupportedLanguage = 
  | 'fr'    // Français
  | 'en'    // English
  | 'es'    // Español
  | 'de'    // Deutsch
  | 'it'    // Italiano
  | 'pt'    // Português
  | 'ar';   // العربية

export interface LocalizedContent {
  [key: string]: {
    [lang in SupportedLanguage]?: string;
  };
}

// ============================================================================
// DESIGN SYSTEM
// ============================================================================

export interface ColorPalette {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  surface: string;
  text: string;
  textSecondary: string;
  border: string;
  success: string;
  warning: string;
  error: string;
  info: string;
}

export interface Typography {
  fontFamily: {
    heading: string;
    body: string;
    mono?: string;
  };
  fontSize: {
    xs: string;
    sm: string;
    base: string;
    lg: string;
    xl: string;
    '2xl': string;
    '3xl': string;
    '4xl': string;
  };
  fontWeight: {
    light: number;
    normal: number;
    medium: number;
    semibold: number;
    bold: number;
  };
  lineHeight: {
    tight: number;
    normal: number;
    relaxed: number;
  };
}

export interface Spacing {
  xs: string;
  sm: string;
  md: string;
  lg: string;
  xl: string;
  '2xl': string;
  '3xl': string;
  '4xl': string;
}

export interface BorderRadius {
  none: string;
  sm: string;
  md: string;
  lg: string;
  xl: string;
  full: string;
}

export interface Shadows {
  sm: string;
  md: string;
  lg: string;
  xl: string;
  inner: string;
  none: string;
}

export interface Animation {
  name: string;
  duration: string;
  easing: string;
  delay?: string;
  iterationCount?: number | 'infinite';
}

export interface DesignTokens {
  colors: ColorPalette;
  typography: Typography;
  spacing: Spacing;
  borderRadius: BorderRadius;
  shadows: Shadows;
  animations?: Animation[];
}

// ============================================================================
// TEMPLATE ENGINE - Variables & Logic
// ============================================================================

export type VariableType = 
  | 'string'
  | 'number'
  | 'boolean'
  | 'date'
  | 'array'
  | 'object'
  | 'color'
  | 'image'
  | 'richtext';

export interface TemplateVariable {
  key: string;
  type: VariableType;
  label: string;
  description?: string;
  defaultValue?: any;
  required?: boolean;
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
    options?: string[];
  };
  category?: string;
}

export interface ConditionalBlock {
  condition: string; // e.g., "price > 1000"
  ifTrue: any;
  ifFalse?: any;
}

export interface LoopBlock {
  items: string; // Variable name
  template: any;
  limit?: number;
}

export interface TemplateLogic {
  variables?: TemplateVariable[];
  conditionals?: Record<string, ConditionalBlock>;
  loops?: Record<string, LoopBlock>;
  computed?: Record<string, string>; // Computed values
}

// ============================================================================
// ADVANCED METADATA
// ============================================================================

export interface TemplateAuthor {
  id: string;
  name: string;
  avatar?: string;
  bio?: string;
  website?: string;
  verified?: boolean;
}

export interface TemplateLicense {
  type: 'mit' | 'gpl' | 'commercial' | 'creative-commons' | 'proprietary';
  details?: string;
  url?: string;
}

export interface TemplateCompatibility {
  minVersion?: string;
  maxVersion?: string;
  requiredPlugins?: string[];
  conflictsWith?: string[];
}

export interface TemplateAnalytics {
  views: number;
  downloads: number;
  installs: number;
  rating: number;
  ratingsCount: number;
  favorites: number;
  conversionRate?: number;
  avgSessionDuration?: number;
}

export interface TemplateSEO {
  title: string;
  description: string;
  keywords: string[];
  ogImage?: string;
  canonicalUrl?: string;
  schema?: Record<string, any>; // JSON-LD structured data
}

// ============================================================================
// TEMPLATE METADATA V2
// ============================================================================

export interface TemplateMetadataV2 {
  // Basic Info
  id: string;
  slug: string;
  version: TemplateVersion;
  name: string;
  description: string;
  shortDescription?: string;
  
  // Classification
  productType: ProductType;
  category: TemplateCategory;
  tags: string[];
  industry?: string[];
  
  // Tier & Status
  tier: TemplateTier;
  status: TemplateStatus;
  price?: number;
  currency?: string;
  
  // Design
  designStyle: DesignStyle;
  colorScheme?: 'light' | 'dark' | 'auto';
  
  // Author & License
  author: TemplateAuthor;
  license: TemplateLicense;
  
  // Media
  thumbnail: string;
  thumbnailHd?: string;
  previewImages: string[];
  previewVideo?: string;
  demoUrl?: string;
  
  // Dates
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
  deprecatedAt?: string;
  
  // Analytics
  analytics: TemplateAnalytics;
  
  // Compatibility
  compatibility: TemplateCompatibility;
  
  // SEO
  seo: TemplateSEO;
  
  // Internationalization
  supportedLanguages: SupportedLanguage[];
  defaultLanguage: SupportedLanguage;
  
  // Features
  features: string[];
  highlights?: string[];
  
  // Changelog
  changelog?: {
    version: string;
    date: string;
    changes: string[];
  }[];
}

// ============================================================================
// TEMPLATE CONTENT V2
// ============================================================================

export interface TemplateContentV2 {
  // Design System
  designTokens: DesignTokens;
  
  // Template Logic
  logic?: TemplateLogic;
  
  // Localized Content
  content: {
    default: Record<string, any>;
    localized?: LocalizedContent;
  };
  
  // Sections & Blocks
  sections: TemplateSection[];
  
  // Product Type Specific
  digitalSettings?: DigitalProductSettings;
  physicalSettings?: PhysicalProductSettings;
  serviceSettings?: ServiceSettings;
  courseSettings?: CourseSettings;
  
  // Advanced Features
  customCSS?: string;
  customJS?: string;
  hooks?: TemplateHooks;
}

// ============================================================================
// TEMPLATE SECTIONS
// ============================================================================

export interface TemplateSection {
  id: string;
  type: string;
  name: string;
  enabled: boolean;
  order: number;
  settings?: Record<string, any>;
  blocks?: TemplateBlock[];
  responsive?: {
    mobile?: boolean;
    tablet?: boolean;
    desktop?: boolean;
  };
}

export interface TemplateBlock {
  id: string;
  type: string;
  content: any;
  style?: Record<string, any>;
  animation?: Animation;
  conditional?: string; // Condition for display
}

// ============================================================================
// PRODUCT TYPE SPECIFIC SETTINGS
// ============================================================================

export interface DigitalProductSettings {
  fileTypes: string[];
  licenseManagement: {
    enabled: boolean;
    type: 'single' | 'multi' | 'unlimited' | 'subscription';
    activationLimit?: number;
    expirationDays?: number;
  };
  downloadSettings: {
    maxDownloads?: number;
    tokenExpiration?: number;
    ipRestriction?: boolean;
  };
  versionControl: {
    enabled: boolean;
    autoUpdate?: boolean;
    notifyCustomers?: boolean;
  };
  security: {
    drmEnabled?: boolean;
    watermarkEnabled?: boolean;
    encryptionLevel?: 'none' | 'basic' | 'advanced';
  };
}

export interface PhysicalProductSettings {
  variants: {
    enabled: boolean;
    types: ('color' | 'size' | 'material' | 'style' | 'custom')[];
    maxCombinations?: number;
  };
  inventory: {
    trackQuantity: boolean;
    allowBackorders?: boolean;
    lowStockThreshold?: number;
    showStockLevel?: boolean;
  };
  shipping: {
    required: boolean;
    weight?: number;
    weightUnit?: 'kg' | 'g' | 'lb' | 'oz';
    dimensions?: {
      length: number;
      width: number;
      height: number;
      unit: 'cm' | 'm' | 'in' | 'ft';
    };
    freeShippingThreshold?: number;
    shippingCalculator?: boolean;
  };
  productDisplay: {
    imageZoom?: boolean;
    image360?: boolean;
    arPreview?: boolean;
    videoEnabled?: boolean;
    sizeGuide?: boolean;
  };
}

export interface ServiceSettings {
  booking: {
    type: 'appointment' | 'instant' | 'flexible';
    duration: number;
    durationUnit: 'minutes' | 'hours' | 'days';
    bufferTime?: number;
    maxAdvanceBooking?: number;
  };
  availability: {
    enabled: boolean;
    timezone?: string;
    schedule?: Record<string, any>;
  };
  capacity: {
    maxAttendees: number;
    minAttendees?: number;
    waitlistEnabled?: boolean;
  };
  location: {
    type: 'online' | 'physical' | 'both';
    address?: string;
    virtualLink?: string;
    mapEnabled?: boolean;
  };
  cancellation: {
    policy: string;
    deadline?: number; // hours before
    refundType?: 'full' | 'partial' | 'none';
    refundPercentage?: number;
  };
  packages: {
    enabled: boolean;
    tiers?: PackageTier[];
  };
}

export interface CourseSettings {
  curriculum: {
    sectionsCount: number;
    lessonsTotal: number;
    totalDuration: number;
    durationUnit: 'hours' | 'days' | 'weeks';
  };
  content: {
    videosCount?: number;
    documentsCount?: number;
    quizzesCount?: number;
    assignmentsCount?: number;
  };
  access: {
    type: 'lifetime' | 'limited' | 'subscription';
    duration?: number;
    durationUnit?: 'days' | 'months' | 'years';
    dripContent?: boolean;
    dripSchedule?: Record<string, any>;
  };
  certification: {
    enabled: boolean;
    requirements?: {
      minProgress?: number;
      minQuizScore?: number;
      completionRequired?: boolean;
    };
    certificateTemplate?: string;
  };
  instructor: {
    name: string;
    bio: string;
    avatar?: string;
    credentials?: string[];
  };
  learningPath: {
    level: 'beginner' | 'intermediate' | 'advanced' | 'all';
    prerequisites?: string[];
    learningObjectives: string[];
    targetAudience: string[];
  };
}

export interface PackageTier {
  id: string;
  name: string;
  description: string;
  price: number;
  features: string[];
  highlighted?: boolean;
}

// ============================================================================
// TEMPLATE HOOKS (Advanced)
// ============================================================================

export interface TemplateHooks {
  beforeRender?: string;
  afterRender?: string;
  onVariableChange?: Record<string, string>;
  onSubmit?: string;
  customValidation?: string;
}

// ============================================================================
// MAIN TEMPLATE V2 INTERFACE
// ============================================================================

export interface TemplateV2 {
  metadata: TemplateMetadataV2;
  content: TemplateContentV2;
  
  // Migration info (if migrated from v1)
  migrationInfo?: {
    fromVersion: string;
    migratedAt: string;
    warnings?: string[];
  };
}

// ============================================================================
// TEMPLATE COLLECTIONS
// ============================================================================

export interface TemplateCollection {
  id: string;
  name: string;
  description: string;
  slug: string;
  thumbnail?: string;
  templates: string[]; // Template IDs
  author: TemplateAuthor;
  createdAt: string;
  updatedAt: string;
  isPublic: boolean;
  tags: string[];
}

// ============================================================================
// USER CUSTOMIZATIONS
// ============================================================================

export interface UserTemplateCustomization {
  userId: string;
  templateId: string;
  customizations: {
    designTokens?: Partial<DesignTokens>;
    content?: Record<string, any>;
    sections?: Partial<TemplateSection>[];
    logic?: Partial<TemplateLogic>;
  };
  name?: string; // Custom name for this customization
  savedAt: string;
  isDefault?: boolean;
}

// ============================================================================
// IMPORT / EXPORT V2
// ============================================================================

export interface TemplateExportV2 {
  version: '2.0.0';
  exportedAt: string;
  exportedBy?: string;
  template: TemplateV2;
  dependencies?: {
    images?: string[];
    fonts?: string[];
    plugins?: string[];
  };
  checksums?: Record<string, string>;
}

export interface TemplateImportOptionsV2 {
  validateOnly?: boolean;
  skipDependencies?: boolean;
  overwriteExisting?: boolean;
  preserveIds?: boolean;
  importAsNew?: boolean;
}

export interface TemplateImportResultV2 {
  success: boolean;
  template?: TemplateV2;
  errors?: ImportError[];
  warnings?: ImportWarning[];
  imported?: {
    templateId: string;
    sections: number;
    variables: number;
    dependencies: number;
  };
  duration?: number; // ms
}

export interface ImportError {
  code: string;
  message: string;
  field?: string;
  severity: 'error' | 'critical';
}

export interface ImportWarning {
  code: string;
  message: string;
  suggestion?: string;
}

// ============================================================================
// TEMPLATE FILTERS & SEARCH V2
// ============================================================================

export interface TemplateFilterV2 {
  // Basic filters
  productTypes?: ProductType[];
  categories?: TemplateCategory[];
  tiers?: TemplateTier[];
  statuses?: TemplateStatus[];
  
  // Design filters
  designStyles?: DesignStyle[];
  colorSchemes?: ('light' | 'dark' | 'auto')[];
  
  // Search
  search?: string;
  tags?: string[];
  
  // Rating & popularity
  minRating?: number;
  minDownloads?: number;
  
  // Author
  authorId?: string;
  verified?: boolean;
  
  // Features
  requiredFeatures?: string[];
  
  // Language
  languages?: SupportedLanguage[];
  
  // Date filters
  createdAfter?: string;
  createdBefore?: string;
  updatedAfter?: string;
  
  // Price
  maxPrice?: number;
  freeOnly?: boolean;
}

export interface TemplateSortOptions {
  field: 
    | 'name'
    | 'createdAt'
    | 'updatedAt'
    | 'rating'
    | 'downloads'
    | 'price'
    | 'popularity';
  direction: 'asc' | 'desc';
}

export interface TemplateSearchResult {
  templates: TemplateV2[];
  total: number;
  page: number;
  pageSize: number;
  filters: TemplateFilterV2;
  sort: TemplateSortOptions;
  facets?: {
    categories: Record<string, number>;
    tiers: Record<string, number>;
    designStyles: Record<string, number>;
    tags: Record<string, number>;
  };
}

// ============================================================================
// TEMPLATE PREVIEW
// ============================================================================

export interface TemplatePreviewV2 {
  templateId: string;
  mode: 'desktop' | 'tablet' | 'mobile';
  data?: Record<string, any>; // Sample data for preview
  customizations?: Partial<TemplateContentV2>;
  viewport: {
    width: number;
    height: number;
  };
}

// ============================================================================
// A/B TESTING (Future)
// ============================================================================

export interface TemplateVariant {
  id: string;
  name: string;
  template: TemplateV2;
  trafficPercent: number;
  metrics?: {
    views: number;
    conversions: number;
    conversionRate: number;
    avgSessionDuration: number;
  };
}

export interface TemplateABTest {
  id: string;
  name: string;
  status: 'draft' | 'running' | 'paused' | 'completed';
  variants: TemplateVariant[];
  startDate?: string;
  endDate?: string;
  winner?: string; // Variant ID
}

// ============================================================================
// MIGRATION V1 → V2
// ============================================================================

export interface TemplateMigrationV1toV2 {
  v1Template: TemplateV1;
  options?: {
    preserveIds?: boolean;
    enrichMetadata?: boolean;
    generateDesignTokens?: boolean;
    inferLogic?: boolean;
  };
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type TemplateValidationResult = {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
};

export interface ValidationError {
  path: string;
  message: string;
  code: string;
}

export interface ValidationWarning {
  path: string;
  message: string;
  suggestion?: string;
}

