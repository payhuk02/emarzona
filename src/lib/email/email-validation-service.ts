/**
 * Service de validation et nettoyage d'emails
 * Date: 1er Février 2025
 */

import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';

// ============================================================
// TYPES
// ============================================================

export interface EmailValidationResult {
  valid: boolean;
  email: string;
  reason?: string;
  suggestions?: string[];
}

export interface UnsubscribeInfo {
  email: string;
  unsubscribe_type: 'all' | 'marketing' | 'newsletter' | 'transactional';
  unsubscribed_at: string;
}

// ============================================================
// SERVICE
// ============================================================

export class EmailValidationService {
  /**
   * Valider le format d'un email
   */
  static validateEmailFormat(email: string): EmailValidationResult {
    const trimmedEmail = email.trim().toLowerCase();
    
    // Regex basique pour validation email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    
    if (!emailRegex.test(trimmedEmail)) {
      return {
        valid: false,
        email: trimmedEmail,
        reason: 'Format email invalide',
      };
    }

    // Vérifier les domaines invalides courants
    const invalidDomains = ['example.com', 'test.com', 'invalid.com'];
    const domain = trimmedEmail.split('@')[1];
    
    if (invalidDomains.includes(domain)) {
      return {
        valid: false,
        email: trimmedEmail,
        reason: 'Domaine invalide',
      };
    }

    return {
      valid: true,
      email: trimmedEmail,
    };
  }

  /**
   * Vérifier si un email est désabonné
   */
  static async isUnsubscribed(
    email: string,
    unsubscribeType?: 'all' | 'marketing' | 'newsletter' | 'transactional'
  ): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('email_unsubscribes')
        .select('unsubscribe_type')
        .eq('email', email.toLowerCase().trim())
        .or(unsubscribeType ? `unsubscribe_type.eq.${unsubscribeType},unsubscribe_type.eq.all` : 'unsubscribe_type.eq.all');

      if (error) {
        logger.error('Error checking unsubscribe status', { error, email });
        // En cas d'erreur, on considère comme non désabonné pour ne pas bloquer
        return false;
      }

      return (data && data.length > 0) || false;
    } catch (error: any) {
      logger.error('EmailValidationService.isUnsubscribed error', { error, email });
      return false;
    }
  }

  /**
   * Vérifier si un email peut recevoir des emails marketing
   */
  static async canReceiveMarketing(email: string): Promise<boolean> {
    return !(await this.isUnsubscribed(email, 'marketing')) && 
           !(await this.isUnsubscribed(email, 'all'));
  }

  /**
   * Nettoyer une liste d'emails (retirer invalides et désabonnés)
   */
  static async cleanEmailList(
    emails: string[],
    unsubscribeType?: 'all' | 'marketing' | 'newsletter' | 'transactional'
  ): Promise<string[]> {
    const cleanedEmails: string[] = [];

    for (const email of emails) {
      // Valider le format
      const validation = this.validateEmailFormat(email);
      if (!validation.valid) {
        logger.warn('Invalid email format skipped', { email, reason: validation.reason });
        continue;
      }

      // Vérifier le désabonnement
      const unsubscribed = await this.isUnsubscribed(validation.email, unsubscribeType);
      if (unsubscribed) {
        logger.info('Unsubscribed email skipped', { email: validation.email });
        continue;
      }

      cleanedEmails.push(validation.email);
    }

    return cleanedEmails;
  }

  /**
   * Obtenir les informations de désabonnement d'un email
   */
  static async getUnsubscribeInfo(email: string): Promise<UnsubscribeInfo[]> {
    try {
      const { data, error } = await supabase
        .from('email_unsubscribes')
        .select('email, unsubscribe_type, unsubscribed_at')
        .eq('email', email.toLowerCase().trim())
        .order('unsubscribed_at', { ascending: false });

      if (error) {
        logger.error('Error fetching unsubscribe info', { error, email });
        throw error;
      }

      return (data || []) as UnsubscribeInfo[];
    } catch (error: any) {
      logger.error('EmailValidationService.getUnsubscribeInfo error', { error, email });
      throw error;
    }
  }

  /**
   * Supprimer les doublons d'une liste d'emails
   */
  static deduplicateEmails(emails: string[]): string[] {
    const seen = new Set<string>();
    const deduplicated: string[] = [];

    for (const email of emails) {
      const normalized = email.trim().toLowerCase();
      if (!seen.has(normalized)) {
        seen.add(normalized);
        deduplicated.push(normalized);
      }
    }

    return deduplicated;
  }
}

// Export instance singleton
export const emailValidationService = EmailValidationService;

