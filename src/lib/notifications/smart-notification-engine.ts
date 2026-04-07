/**
 * Moteur de notifications intelligentes pour Emarzona
 * Déclenche automatiquement des notifications personnalisées basées sur les comportements et prédictions
 */

import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';

export interface NotificationRule {
  id: string;
  name: string;
  description: string;
  trigger: NotificationTrigger;
  conditions: NotificationCondition[];
  template: NotificationTemplate;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  channels: NotificationChannel[];
  cooldown: number; // minutes entre deux notifications du même type
  enabled: boolean;
}

export interface NotificationTrigger {
  type: 'event' | 'schedule' | 'prediction' | 'behavior';
  eventType?: string; // pour les événements
  schedule?: string; // cron expression pour les programmés
  predictionType?: string; // pour les prédictions
  behaviorPattern?: string; // pour les comportements
}

export interface NotificationCondition {
  field: string;
  operator: 'equals' | 'not_equals' | 'greater_than' | 'less_than' | 'contains' | 'not_contains';
  value: any;
  logic?: 'AND' | 'OR'; // pour combiner avec la condition suivante
}

export interface NotificationTemplate {
  title: string;
  message: string;
  actionUrl?: string;
  actionText?: string;
  variables: Record<string, string>; // variables disponibles pour la personnalisation
}

export type NotificationChannel = 'email' | 'push' | 'in_app' | 'sms';

export interface NotificationContext {
  userId: string;
  eventData?: Record<string, any>;
  predictionData?: Record<string, any>;
  behaviorData?: Record<string, any>;
}

/**
 * Moteur de notifications intelligentes
 */
export class SmartNotificationEngine {
  private rules: NotificationRule[] = [];
  private readonly MAX_NOTIFICATIONS_PER_HOUR = 5;
  private readonly MAX_NOTIFICATIONS_PER_DAY = 20;

  constructor() {
    this.loadRules();
  }

  /**
   * Charge les règles de notification depuis la base de données
   */
  private async loadRules(): Promise<void> {
    try {
      const { data, error } = await supabase
        .from('notification_rules')
        .select('*')
        .eq('enabled', true);

      if (error) {
        logger.error('Error loading notification rules', { error });
        return;
      }

      this.rules = (data || []).map(rule => ({
        ...rule,
        trigger: JSON.parse(rule.trigger),
        conditions: JSON.parse(rule.conditions),
        template: JSON.parse(rule.template),
        channels: JSON.parse(rule.channels)
      })) as NotificationRule[];

      logger.info('Loaded notification rules', { count: this.rules.length });
    } catch (error) {
      logger.error('Exception loading notification rules', { error });
    }
  }

  /**
   * Traite un événement et déclenche les notifications appropriées
   */
  async processEvent(context: NotificationContext): Promise<void> {
    try {
      // Vérifier les limites de fréquence
      if (!(await this.checkRateLimits(context.userId))) {
        logger.warn('Rate limit exceeded for user notifications', { userId: context.userId });
        return;
      }

      // Trouver les règles applicables
      const applicableRules = this.rules.filter(rule =>
        this.evaluateTrigger(rule.trigger, context) &&
        this.evaluateConditions(rule.conditions, context)
      );

      if (applicableRules.length === 0) {
        return;
      }

      // Trier par priorité et traiter
      const sortedRules = applicableRules.sort((a, b) => {
        const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 };
        return priorityOrder[b.priority] - priorityOrder[a.priority];
      });

      // Traiter les règles (maximum 3 par événement pour éviter le spam)
      const rulesToProcess = sortedRules.slice(0, 3);

      for (const rule of rulesToProcess) {
        await this.sendNotification(rule, context);
      }

      logger.info('Processed smart notifications', {
        userId: context.userId,
        rulesTriggered: rulesToProcess.length
      });

    } catch (error) {
      logger.error('Error processing smart notification', { error, context });
    }
  }

  /**
   * Évalue si un trigger correspond au contexte
   */
  private evaluateTrigger(trigger: NotificationTrigger, context: NotificationContext): boolean {
    switch (trigger.type) {
      case 'event':
        return context.eventData?.type === trigger.eventType;

      case 'prediction':
        return context.predictionData?.type === trigger.predictionType;

      case 'behavior':
        return context.behaviorData?.pattern === trigger.behaviorPattern;

      case 'schedule':
        // Pour les notifications programmées, on vérifierait la planification
        // Ici on simplifie et on retourne true (à implémenter avec un scheduler)
        return true;

      default:
        return false;
    }
  }

  /**
   * Évalue si les conditions sont remplies
   */
  private evaluateConditions(conditions: NotificationCondition[], context: NotificationContext): boolean {
    if (conditions.length === 0) return true;

    let result = true;
    let logic = 'AND';

    for (const condition of conditions) {
      const conditionResult = this.evaluateCondition(condition, context);

      if (logic === 'AND') {
        result = result && conditionResult;
      } else {
        result = result || conditionResult;
      }

      logic = condition.logic || 'AND';
    }

    return result;
  }

  /**
   * Évalue une condition individuelle
   */
  private evaluateCondition(condition: NotificationCondition, context: NotificationContext): boolean {
    const value = this.getContextValue(condition.field, context);

    switch (condition.operator) {
      case 'equals':
        return value === condition.value;
      case 'not_equals':
        return value !== condition.value;
      case 'greater_than':
        return typeof value === 'number' && typeof condition.value === 'number' &&
               value > condition.value;
      case 'less_than':
        return typeof value === 'number' && typeof condition.value === 'number' &&
               value < condition.value;
      case 'contains':
        return typeof value === 'string' && typeof condition.value === 'string' &&
               value.includes(condition.value);
      case 'not_contains':
        return typeof value === 'string' && typeof condition.value === 'string' &&
               !value.includes(condition.value);
      default:
        return false;
    }
  }

  /**
   * Récupère une valeur du contexte
   */
  private getContextValue(field: string, context: NotificationContext): any {
    const [source, ...path] = field.split('.');

    let data: any;
    switch (source) {
      case 'event':
        data = context.eventData;
        break;
      case 'prediction':
        data = context.predictionData;
        break;
      case 'behavior':
        data = context.behaviorData;
        break;
      case 'user':
        // TODO: Récupérer les données utilisateur
        data = {};
        break;
      default:
        return null;
    }

    return path.reduce((obj, key) => obj?.[key], data);
  }

  /**
   * Envoie une notification via tous les canaux configurés
   */
  private async sendNotification(rule: NotificationRule, context: NotificationContext): Promise<void> {
    try {
      // Générer le contenu personnalisé
      const content = this.renderTemplate(rule.template, context);

      // Enregistrer la notification dans la base de données
      const { data: notification, error } = await supabase
        .from('notifications')
        .insert({
          user_id: context.userId,
          type: 'smart',
          title: content.title,
          message: content.message,
          priority: rule.priority,
          channels: rule.channels,
          metadata: {
            rule_id: rule.id,
            context
          }
        })
        .select()
        .single();

      if (error) {
        logger.error('Error saving notification', { error, ruleId: rule.id });
        return;
      }

      // Envoyer via chaque canal
      for (const channel of rule.channels) {
        await this.sendViaChannel(channel, notification, content);
      }

      // Enregistrer l'envoi
      await supabase
        .from('notification_deliveries')
        .insert({
          notification_id: notification.id,
          channel,
          status: 'sent',
          sent_at: new Date().toISOString()
        });

      logger.info('Smart notification sent', {
        notificationId: notification.id,
        ruleId: rule.id,
        channels: rule.channels
      });

    } catch (error) {
      logger.error('Error sending smart notification', { error, ruleId: rule.id });
    }
  }

  /**
   * Rend le template avec les variables du contexte
   */
  private renderTemplate(template: NotificationTemplate, context: NotificationContext): { title: string; message: string } {
    let title = template.title;
    let message = template.message;

    // Remplacer les variables
    Object.entries(template.variables).forEach(([key, path]) => {
      const value = this.getContextValue(path, context);
      const placeholder = `{{${key}}}`;

      title = title.replace(new RegExp(placeholder, 'g'), value || '');
      message = message.replace(new RegExp(placeholder, 'g'), value || '');
    });

    return { title, message };
  }

  /**
   * Envoie une notification via un canal spécifique
   */
  private async sendViaChannel(
    channel: NotificationChannel,
    notification: any,
    content: { title: string; message: string }
  ): Promise<void> {
    try {
      switch (channel) {
        case 'email':
          await this.sendEmail(notification, content);
          break;
        case 'push':
          await this.sendPush(notification, content);
          break;
        case 'in_app':
          await this.sendInApp(notification, content);
          break;
        case 'sms':
          await this.sendSMS(notification, content);
          break;
      }
    } catch (error) {
      logger.error(`Error sending notification via ${channel}`, { error, notificationId: notification.id });
    }
  }

  /**
   * Envoie une notification par email
   */
  private async sendEmail(notification: any, content: { title: string; message: string }): Promise<void> {
    // TODO: Implémenter l'envoi d'email
    logger.info('Email notification would be sent', { notificationId: notification.id, title: content.title });
  }

  /**
   * Envoie une notification push
   */
  private async sendPush(notification: any, content: { title: string; message: string }): Promise<void> {
    // TODO: Implémenter les notifications push
    logger.info('Push notification would be sent', { notificationId: notification.id, title: content.title });
  }

  /**
   * Envoie une notification in-app
   */
  private async sendInApp(notification: any, content: { title: string; message: string }): Promise<void> {
    // Pour les notifications in-app, on peut utiliser un système de websockets ou simplement marquer comme lue
    logger.info('In-app notification created', { notificationId: notification.id, title: content.title });
  }

  /**
   * Envoie une notification SMS
   */
  private async sendSMS(notification: any, content: { title: string; message: string }): Promise<void> {
    // TODO: Implémenter l'envoi SMS
    logger.info('SMS notification would be sent', { notificationId: notification.id, title: content.title });
  }

  /**
   * Vérifie les limites de fréquence pour éviter le spam
   */
  private async checkRateLimits(userId: string): Promise<boolean> {
    try {
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

      const { data: recentNotifications, error } = await supabase
        .from('notifications')
        .select('id, created_at')
        .eq('user_id', userId)
        .gte('created_at', oneDayAgo.toISOString());

      if (error) {
        logger.error('Error checking rate limits', { error, userId });
        return false;
      }

      const hourlyCount = recentNotifications?.filter(n =>
        new Date(n.created_at) > oneHourAgo
      ).length || 0;

      const dailyCount = recentNotifications?.length || 0;

      return hourlyCount < this.MAX_NOTIFICATIONS_PER_HOUR &&
             dailyCount < this.MAX_NOTIFICATIONS_PER_DAY;

    } catch (error) {
      logger.error('Exception checking rate limits', { error, userId });
      return false;
    }
  }

  /**
   * Recharge les règles (utile après modification)
   */
  async reloadRules(): Promise<void> {
    await this.loadRules();
  }

  /**
   * Obtient les règles actives
   */
  getActiveRules(): NotificationRule[] {
    return this.rules;
  }
}

// Instance globale
export const smartNotificationEngine = new SmartNotificationEngine();

// Règles de notification prédéfinies
export const DEFAULT_NOTIFICATION_RULES: Omit<NotificationRule, 'id'>[] = [
  // Règle pour les achats réussis
  {
    name: 'Achat réussi - Points de fidélité',
    description: 'Notifie l\'utilisateur des points gagnés après un achat',
    trigger: { type: 'event', eventType: 'purchase_completed' },
    conditions: [
      { field: 'event.loyaltyReward.points', operator: 'greater_than', value: 0 }
    ],
    template: {
      title: '🎉 Points de fidélité gagnés !',
      message: 'Merci pour votre achat ! Vous avez gagné {{points}} points de fidélité.',
      actionUrl: '/loyalty',
      actionText: 'Voir mes points',
      variables: {
        points: 'event.loyaltyReward.points'
      }
    },
    priority: 'medium',
    channels: ['in_app', 'email'],
    cooldown: 0,
    enabled: true
  },

  // Règle pour les reviews publiées
  {
    name: 'Review publiée - Récompense',
    description: 'Félicite l\'utilisateur pour son avis et mentionne les points gagnés',
    trigger: { type: 'event', eventType: 'review_published' },
    conditions: [],
    template: {
      title: '⭐ Merci pour votre avis !',
      message: 'Votre avis sur {{productName}} a été publié. Vous gagnez {{points}} points !',
      actionUrl: '/dashboard',
      actionText: 'Voir mes commandes',
      variables: {
        productName: 'event.productName',
        points: 'event.loyaltyReward.points'
      }
    },
    priority: 'low',
    channels: ['in_app'],
    cooldown: 60,
    enabled: true
  },

  // Règle pour les connexions quotidiennes
  {
    name: 'Connexion quotidienne - Streak',
    description: 'Encourage les connexions régulières avec des récompenses',
    trigger: { type: 'event', eventType: 'daily_login' },
    conditions: [
      { field: 'event.streakData.currentStreak', operator: 'greater_than', value: 1 }
    ],
    template: {
      title: '🔥 Série de connexion active !',
      message: 'Vous êtes connecté depuis {{streak}} jours consécutifs. Continuez pour gagner plus de points !',
      actionUrl: '/loyalty',
      actionText: 'Voir mes récompenses',
      variables: {
        streak: 'event.streakData.currentStreak'
      }
    },
    priority: 'low',
    channels: ['in_app'],
    cooldown: 1440, // Une fois par jour
    enabled: true
  },

  // Règle pour les paniers abandonnés
  {
    name: 'Panier abandonné - Rappel',
    description: 'Rappelle aux utilisateurs leurs paniers non finalisés',
    trigger: { type: 'schedule', schedule: 'daily_2pm' }, // Simulation
    conditions: [
      { field: 'behavior.lastCartUpdate', operator: 'less_than', value: Date.now() - 24 * 60 * 60 * 1000 },
      { field: 'behavior.cartItemsCount', operator: 'greater_than', value: 0 }
    ],
    template: {
      title: '🛒 Votre panier vous attend',
      message: 'Vous avez {{itemCount}} article(s) dans votre panier. Finalisez votre commande !',
      actionUrl: '/cart',
      actionText: 'Voir mon panier',
      variables: {
        itemCount: 'behavior.cartItemsCount'
      }
    },
    priority: 'medium',
    channels: ['email', 'in_app'],
    cooldown: 1440, // Une fois par jour
    enabled: true
  },

  // Règle pour les produits recommandés
  {
    name: 'Recommandation personnalisée',
    description: 'Suggère des produits basés sur l\'historique d\'achat',
    trigger: { type: 'prediction', predictionType: 'product_recommendation' },
    conditions: [
      { field: 'prediction.confidence', operator: 'greater_than', value: 0.7 }
    ],
    template: {
      title: '💡 Rien que pour vous',
      message: 'Basé sur vos achats précédents, nous pensons que {{productName}} vous plairait !',
      actionUrl: '/product/{{productSlug}}',
      actionText: 'Découvrir',
      variables: {
        productName: 'prediction.productName',
        productSlug: 'prediction.productSlug'
      }
    },
    priority: 'low',
    channels: ['in_app'],
    cooldown: 7200, // Toutes les 5 jours
    enabled: true
  }
];