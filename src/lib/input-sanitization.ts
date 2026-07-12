/**
 * Input Sanitization and Validation Utilities
 * Provides security-focused input validation and sanitization
 * 
 * Security Features:
 * - XSS prevention through HTML entity encoding
 * - SQL injection prevention
 * - Input length validation
 * - Character whitelist/blacklist validation
 * - URL validation and sanitization
 */

/**
 * Sanitizes a string to prevent XSS attacks
 * Converts dangerous characters to HTML entities
 */
export function sanitizeHtml(input: string): string {
  if (!input) return '';
  
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '/': '&#x2F;',
    '`': '&#x60;',
    '=': '&#x3D;',
  };
  
  const reg = /[&<>"'`=/]/g;
  return input.replace(reg, (match) => map[match]);
}

/**
 * Sanitizes a URL to prevent javascript: and other dangerous protocols
 */
export function sanitizeUrl(url: string): string {
  if (!url) return '';
  
  try {
    const parsed = new URL(url);
    
    // Only allow safe protocols
    const allowedProtocols = ['http:', 'https:', 'mailto:', 'tel:', 'sms:'];
    if (!allowedProtocols.includes(parsed.protocol)) {
      return '';
    }
    
    return parsed.href;
  } catch {
    // Invalid URL, return empty
    return '';
  }
}

/**
 * Validates and sanitizes a phone number
 * Keeps only digits, +, -, spaces, and parentheses
 */
export function sanitizePhoneNumber(phone: string): string {
  if (!phone) return '';
  
  // Remove all characters except digits, +, -, spaces, and parentheses
  return phone.replace(/[^\d+\-\s()]/g, '');
}

/**
 * Validates and sanitizes an email address
 * Basic sanitization, full validation should be done with Zod
 */
export function sanitizeEmail(email: string): string {
  if (!email) return '';
  
  // Remove whitespace and convert to lowercase
  return email.trim().toLowerCase();
}

/**
 * Sanitizes a slug (URL-friendly identifier)
 * Removes special characters, converts to lowercase, replaces spaces with hyphens
 */
export function sanitizeSlug(slug: string): string {
  if (!slug) return '';
  
  return slug
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single
    .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
}

/**
 * Validates input length against min and max
 */
export function validateLength(
  input: string,
  min: number,
  max: number
): { valid: boolean; error?: string } {
  const length = input.length;
  
  if (length < min) {
    return { valid: false, error: `Doit contenir au moins ${min} caractères` };
  }
  
  if (length > max) {
    return { valid: false, error: `Ne peut pas dépasser ${max} caractères` };
  }
  
  return { valid: true };
}

/**
 * Validates that input contains only allowed characters
 */
export function validateCharacters(
  input: string,
  allowedPattern: RegExp
): { valid: boolean; error?: string } {
  if (!allowedPattern.test(input)) {
    return { valid: false, error: 'Contient des caractères non autorisés' };
  }
  
  return { valid: true };
}

/**
 * Sanitizes social media URLs
 * Ensures URLs are from expected domains
 */
export function sanitizeSocialUrl(url: string, platform: string): string {
  if (!url) return '';
  
  const platformDomains: Record<string, string[]> = {
    facebook: ['facebook.com', 'fb.com'],
    instagram: ['instagram.com'],
    twitter: ['twitter.com', 'x.com'],
    linkedin: ['linkedin.com'],
    youtube: ['youtube.com', 'youtu.be'],
    tiktok: ['tiktok.com'],
    pinterest: ['pinterest.com'],
    snapchat: ['snapchat.com'],
    discord: ['discord.gg', 'discord.com'],
    twitch: ['twitch.tv'],
  };
  
  try {
    const parsed = new URL(url);
    const allowed = platformDomains[platform] || [];
    
    if (allowed.length > 0) {
      const hostname = parsed.hostname.toLowerCase();
      const isAllowed = allowed.some(domain => 
        hostname === domain || hostname.endsWith(`.${domain}`)
      );
      
      if (!isAllowed) {
        return '';
      }
    }
    
    return parsed.href;
  } catch {
    return '';
  }
}

/**
 * Sanitizes color hex codes
 * Ensures valid hex color format
 */
export function sanitizeColor(color: string): string {
  if (!color) return '';
  
  // Remove # if present
  const hex = color.replace('#', '');
  
  // Validate hex format (3 or 6 characters)
  if (!/^[0-9A-Fa-f]{3}$|^[0-9A-Fa-f]{6}$/.test(hex)) {
    return '';
  }
  
  // Return with # prefix
  return `#${hex}`;
}

/**
 * Sanitizes numeric input
 * Removes non-numeric characters except decimal point and minus
 */
export function sanitizeNumber(input: string): string {
  if (!input) return '';
  
  return input.replace(/[^\d.-]/g, '');
}

/**
 * Comprehensive input sanitization for form fields
 */
export function sanitizeFormField(
  value: string,
  fieldType: 'text' | 'email' | 'url' | 'tel' | 'number' | 'slug' | 'color' | 'html'
): string {
  if (!value) return '';
  
  switch (fieldType) {
    case 'email':
      return sanitizeEmail(value);
    case 'url':
      return sanitizeUrl(value);
    case 'tel':
      return sanitizePhoneNumber(value);
    case 'number':
      return sanitizeNumber(value);
    case 'slug':
      return sanitizeSlug(value);
    case 'color':
      return sanitizeColor(value);
    case 'html':
      return sanitizeHtml(value);
    case 'text':
    default:
      // Basic text sanitization - trim and normalize whitespace
      return value.trim().replace(/\s+/g, ' ');
  }
}

/**
 * Detects potential injection attacks
 */
export function detectInjection(input: string): boolean {
  if (!input) return false;
  
  const injectionPatterns = [
    /<script[^>]*>/i,
    /javascript:/i,
    /on\w+\s*=/i,
    /eval\s*\(/i,
    /document\./i,
    /window\./i,
    /alert\s*\(/i,
    /<iframe/i,
    /<object/i,
    /<embed/i,
    /expression\s*\(/i,
    /@import/i,
    /--/i, // SQL comment
    /\/\*/i, // SQL comment start
    /\*\//i, // SQL comment end
    /;/i, // SQL statement separator
    /'/i, // SQL quote
    /"/i, // SQL quote
  ];
  
  return injectionPatterns.some(pattern => pattern.test(input));
}

/**
 * Validates and sanitizes a complete form payload
 */
export function sanitizeFormPayload<T extends Record<string, unknown>>(
  payload: T,
  fieldTypes: Record<keyof T, 'text' | 'email' | 'url' | 'tel' | 'number' | 'slug' | 'color' | 'html'>
): T {
  const sanitized: Partial<T> = {};
  
  for (const [key, value] of Object.entries(payload)) {
    if (typeof value === 'string') {
      const fieldType = fieldTypes[key as keyof T] || 'text';
      sanitized[key as keyof T] = sanitizeFormField(value, fieldType) as T[keyof T];
    } else {
      sanitized[key as keyof T] = value;
    }
  }
  
  return sanitized as T;
}

/**
 * Truncates text to a maximum length with ellipsis
 */
export function truncateText(text: string, maxLength: number, ellipsis = '...'): string {
  if (!text || text.length <= maxLength) return text;
  
  return text.substring(0, maxLength - ellipsis.length) + ellipsis;
}

/**
 * Normalizes whitespace in text
 */
export function normalizeWhitespace(text: string): string {
  if (!text) return '';
  
  return text.trim().replace(/\s+/g, ' ');
}

/**
 * Removes HTML tags from string
 */
export function stripHtmlTags(html: string): string {
  if (!html) return '';
  
  return html.replace(/<[^>]*>/g, '');
}

/**
 * Escapes special regex characters
 */
export function escapeRegex(string: string): string {
  if (!string) return '';
  
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
