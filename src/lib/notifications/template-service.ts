/**
 * Template Service pour Notifications
 * Date: 2 Février 2025
 *
 * Système centralisé de templates pour emails, SMS et push
 * avec support de variables et branding par store
 */

import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';
import type { NotificationType } from './unified-notifications';

export type TemplateChannel = 'email' | 'sms' | 'push';
export type TemplateLanguage = 'fr' | 'en';

export interface Template {
  id: string;
  name: string;
  slug: string;
  channel: TemplateChannel;
  language: TemplateLanguage;
  subject?: string; // Pour email
  title?: string; // Pour push
  body: string;
  html?: string; // Pour email
  variables: string[];
  store_id?: string; // null = template global
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface TemplateVariables {
  [key: string]: string | number | boolean | null | undefined;
}

/**
 * Service de templates
 */
export class NotificationTemplateService {
  private cache: Map<string, Template> = new Map();
  private cacheExpiry: Map<string, number> = new Map();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  /**
   * Récupérer un template
   */
  async getTemplate(
    slug: string,
    channel: TemplateChannel,
    language: TemplateLanguage = 'fr',
    storeId?: string
  ): Promise<Template | null> {
    const cacheKey = `${slug}:${channel}:${language}:${storeId || 'global'}`;
    const cached = this.cache.get(cacheKey);
    const expiry = this.cacheExpiry.get(cacheKey);

    // Vérifier le cache
    if (cached && expiry && Date.now() < expiry) {
      return cached;
    }

    try {
      // Chercher d'abord un template spécifique au store
      let query = supabase
        .from('notification_templates')
        .select('*')
        .eq('slug', slug)
        .eq('channel', channel)
        .eq('language', language)
        .eq('is_active', true);

      if (storeId) {
        query = query.or(`store_id.eq.${storeId},store_id.is.null`);
      } else {
        query = query.is('store_id', null);
      }

      const { data, error } = await query.order('store_id', { ascending: false }).limit(1);

      if (error) {
        logger.error('Error fetching template', { error, slug, channel, language });
        return null;
      }

      if (!data || data.length === 0) {
        logger.warn('Template not found', { slug, channel, language, storeId });
        return null;
      }

      const template = data[0] as Template;

      // Mettre en cache
      this.cache.set(cacheKey, template);
      this.cacheExpiry.set(cacheKey, Date.now() + this.CACHE_TTL);

      return template;
    } catch (error) {
      logger.error('Error in getTemplate', { error, slug, channel, language });
      return null;
    }
  }

  /**
   * Remplacer les variables dans un template
   */
  replaceVariables(
    template: Template,
    variables: TemplateVariables
  ): { subject?: string; title?: string; body: string; html?: string } {
    const result: { subject?: string; title?: string; body: string; html?: string } = {
      body: this.replaceVariablesInText(template.body, variables),
    };

    if (template.subject) {
      result.subject = this.replaceVariablesInText(template.subject, variables);
    }

    if (template.title) {
      result.title = this.replaceVariablesInText(template.title, variables);
    }

    if (template.html) {
      result.html = this.replaceVariablesInText(template.html, variables);
    }

    return result;
  }

  /**
   * Remplacer les variables dans un texte
   */
  private replaceVariablesInText(text: string, variables: TemplateVariables): string {
    let result = text;

    // Remplacer {{variable}} ou {variable}
    for (const [key, value] of Object.entries(variables)) {
      const regex = new RegExp(`\\{\\{${key}\\}\\}|\\{${key}\\}`, 'g');
      result = result.replace(regex, String(value ?? ''));
    }

    // Variables par défaut
    const defaultVars = {
      platform_name: 'Emarzona',
      current_year: new Date().getFullYear(),
      current_date: new Date().toLocaleDateString('fr-FR'),
    };

    for (const [key, value] of Object.entries(defaultVars)) {
      const regex = new RegExp(`\\{\\{${key}\\}\\}|\\{${key}\\}`, 'g');
      result = result.replace(regex, String(value));
    }

    return result;
  }

  /**
   * Rendre un template avec variables
   */
  async renderTemplate(
    slug: string,
    channel: TemplateChannel,
    variables: TemplateVariables,
    options?: {
      language?: TemplateLanguage;
      storeId?: string;
    }
  ): Promise<{ subject?: string; title?: string; body: string; html?: string } | null> {
    const template = await this.getTemplate(
      slug,
      channel,
      options?.language || 'fr',
      options?.storeId
    );

    if (!template) {
      return null;
    }

    return this.replaceVariables(template, variables);
  }

  /**
   * Créer ou mettre à jour un template
   */
  async upsertTemplate(
    template: Partial<Template> & { slug: string; channel: TemplateChannel }
  ): Promise<Template | null> {
    try {
      const { data, error } = await supabase
        .from('notification_templates')
        .upsert(
          {
            ...template,
            updated_at: new Date().toISOString(),
          },
          {
            onConflict: 'slug,channel,language,store_id',
          }
        )
        .select()
        .single();

      if (error) {
        logger.error('Error upserting template', { error, template });
        return null;
      }

      // Invalider le cache
      this.invalidateCache(template.slug, template.channel);

      return data as Template;
    } catch (error) {
      logger.error('Error in upsertTemplate', { error, template });
      return null;
    }
  }

  /**
   * Invalider le cache
   */
  invalidateCache(slug?: string, channel?: TemplateChannel): void {
    if (slug && channel) {
      // Invalider un template spécifique
      for (const key of this.cache.keys()) {
        if (key.startsWith(`${slug}:${channel}:`)) {
          this.cache.delete(key);
          this.cacheExpiry.delete(key);
        }
      }
    } else {
      // Invalider tout le cache
      this.cache.clear();
      this.cacheExpiry.clear();
    }
  }
}

// Instance singleton
export const notificationTemplateService = new NotificationTemplateService();
