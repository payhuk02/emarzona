/**
 * i18n Service pour Notifications
 * Date: 2 Février 2025
 *
 * Système multilingue pour les notifications
 */

import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';
import type { NotificationType } from './unified-notifications';

export type SupportedLanguage = 'fr' | 'en';

export interface NotificationTranslation {
  title: string;
  message: string;
  actionLabel?: string;
}

export interface TranslationData {
  [key: string]: string | number | boolean | null | undefined;
}

/**
 * Service i18n pour notifications
 */
export class NotificationI18nService {
  private translations: Map<string, Map<SupportedLanguage, NotificationTranslation>> = new Map();
  private userLanguages: Map<string, SupportedLanguage> = new Map();

  /**
   * Obtenir la langue de l'utilisateur
   */
  async getUserLanguage(userId: string): Promise<SupportedLanguage> {
    // Vérifier le cache
    const cached = this.userLanguages.get(userId);
    if (cached) {
      return cached;
    }

    try {
      // Récupérer depuis le profil (si la colonne existe)
      // Sinon, utiliser la langue du navigateur ou 'fr' par défaut
      const language = 'fr'; // Par défaut

      // Optionnel: récupérer depuis les préférences utilisateur si disponible
      // const { data: prefs } = await supabase
      //   .from('user_preferences')
      //   .select('language')
      //   .eq('user_id', userId)
      //   .single();

      this.userLanguages.set(userId, language);
      return language;
    } catch (error) {
      logger.error('Error getting user language', { error, userId });
      return 'fr'; // Par défaut
    }
  }

  /**
   * Traduire une notification
   */
  async translateNotification(
    type: NotificationType,
    data: TranslationData,
    language?: SupportedLanguage
  ): Promise<NotificationTranslation> {
    const lang = language || 'fr';

    // Vérifier le cache
    const cacheKey = `${type}:${lang}`;
    const cached = this.translations.get(cacheKey);
    if (cached) {
      return this.replaceVariables(cached.get(lang)!, data);
    }

    // Récupérer depuis la base de données
    // Note: La table notification_translations peut ne pas exister dans les types Supabase
    // On utilise une approche avec try/catch pour gérer cela gracieusement
    try {
      // Essayer d'accéder à la table directement
      // Si elle n'existe pas, l'erreur sera capturée
      const { data: translation, error: translationError } = await supabase
        .from('notification_translations')
        .select('title, message, action_label')
        .eq('notification_type', type)
        .eq('language', lang)
        .maybeSingle();

      if (!translationError && translation) {
        const trans: NotificationTranslation = {
          title: translation.title || '',
          message: translation.message || '',
          actionLabel: translation.action_label || undefined,
        };

        // Mettre en cache
        const langMap = new Map<SupportedLanguage, NotificationTranslation>();
        langMap.set(lang, trans);
        this.translations.set(cacheKey, langMap);

        return this.replaceVariables(trans, data);
      }
    } catch (error) {
      // Si la table n'existe pas encore ou erreur, utiliser les traductions par défaut
      logger.warn('Translation not found, using default', { type, language, error });
    }

    // Fallback: utiliser les traductions par défaut
    return this.getDefaultTranslation(type, data, lang);
  }

  /**
   * Remplacer les variables dans une traduction
   */
  private replaceVariables(
    translation: NotificationTranslation,
    data: TranslationData
  ): NotificationTranslation {
    return {
      title: this.replaceVariablesInText(translation.title, data),
      message: this.replaceVariablesInText(translation.message, data),
      actionLabel: translation.actionLabel
        ? this.replaceVariablesInText(translation.actionLabel, data)
        : undefined,
    };
  }

  /**
   * Remplacer les variables dans un texte
   */
  private replaceVariablesInText(text: string, data: TranslationData): string {
    let result = text;

    for (const [key, value] of Object.entries(data)) {
      const regex = new RegExp(`\\{\\{${key}\\}\\}|\\{${key}\\}`, 'g');
      result = result.replace(regex, String(value ?? ''));
    }

    return result;
  }

  /**
   * Obtenir la traduction par défaut
   */
  private getDefaultTranslation(
    type: NotificationType,
    data: TranslationData,
    language: SupportedLanguage
  ): NotificationTranslation {
    const defaults: Record<
      SupportedLanguage,
      Record<NotificationType, { title: string; message: string }>
    > = {
      fr: {
        order_payment_received: {
          title: '✅ Paiement reçu',
          message: 'Votre paiement de {{amount}} {{currency}} a été confirmé.',
        },
        order_payment_failed: {
          title: '❌ Paiement échoué',
          message: 'Votre paiement de {{amount}} {{currency}} a échoué.',
        },
        // Ajouter plus de traductions par défaut
      } as Record<string, NotificationTranslation>,
      en: {
        order_payment_received: {
          title: '✅ Payment received',
          message: 'Your payment of {{amount}} {{currency}} has been confirmed.',
        },
        order_payment_failed: {
          title: '❌ Payment failed',
          message: 'Your payment of {{amount}} {{currency}} has failed.',
        },
        // Ajouter plus de traductions par défaut
      } as Record<string, NotificationTranslation>,
    };

    const defaultTrans = defaults[language]?.[type] ||
      defaults.fr[type] || {
        title: type,
        message: 'Notification',
      };

    return this.replaceVariables(defaultTrans, data);
  }

  /**
   * Invalider le cache
   */
  invalidateCache(userId?: string): void {
    if (userId) {
      this.userLanguages.delete(userId);
    } else {
      this.userLanguages.clear();
      this.translations.clear();
    }
  }
}

// Instance singleton
export const notificationI18nService = new NotificationI18nService();
