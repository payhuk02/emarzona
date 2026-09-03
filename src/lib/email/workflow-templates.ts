/**
 * Templates de workflows prêts à l'emploi
 * Date: 2 Février 2025
 */

import type { CreateWorkflowPayload, WorkflowAction } from './email-workflow-service';

export interface WorkflowTemplate {
  id: string;
  name: string;
  description: string;
  category:
    | 'welcome'
    | 'abandoned_cart'
    | 'post_purchase'
    | 're_engagement'
    | 'seasonal'
    | 'custom';
  icon: string;
  workflow: Omit<CreateWorkflowPayload, 'store_id'>;
}

export const WORKFLOW_TEMPLATES: WorkflowTemplate[] = [
  {
    id: 'welcome-series',
    name: 'Série de bienvenue',
    description: "Envoie une série d'emails de bienvenue aux nouveaux utilisateurs",
    category: 'welcome',
    icon: '👋',
    workflow: {
      name: 'Série de bienvenue',
      description: "Accueillez vos nouveaux utilisateurs avec une série d'emails personnalisés",
      trigger_type: 'event',
      trigger_config: {
        event_name: 'user.registered',
      },
      actions: [
        {
          type: 'send_email',
          config: {
            template_id: 'welcome-email-1',
            variables: {
              welcome_message: 'Bienvenue !',
            },
          },
          order: 1,
        },
        {
          type: 'wait',
          config: {
            duration: 1440, // 24 heures
          },
          order: 2,
        },
        {
          type: 'send_email',
          config: {
            template_id: 'welcome-email-2',
            variables: {
              welcome_message: 'Découvrez nos fonctionnalités',
            },
          },
          order: 3,
        },
        {
          type: 'add_tag',
          config: {
            tag: 'welcome_series_completed',
            category: 'behavior',
          },
          order: 4,
        },
      ],
      status: 'active',
    },
  },
  {
    id: 'abandoned-cart-recovery',
    name: 'Récupération de panier abandonné',
    description: 'Récupère les paniers abandonnés avec des emails de rappel',
    category: 'abandoned_cart',
    icon: '🛒',
    workflow: {
      name: 'Récupération de panier abandonné',
      description: 'Envoyez des rappels automatiques pour les paniers abandonnés',
      trigger_type: 'event',
      trigger_config: {
        event_name: 'cart.abandoned',
        filters: {
          min_items: 1,
        },
      },
      actions: [
        {
          type: 'wait',
          config: {
            duration: 60, // 1 heure
          },
          order: 1,
        },
        {
          type: 'send_email',
          config: {
            template_id: 'abandoned-cart-reminder-1',
            variables: {
              reminder_type: 'gentle',
            },
          },
          order: 2,
        },
        {
          type: 'wait',
          config: {
            duration: 1440, // 24 heures
          },
          order: 3,
        },
        {
          type: 'send_email',
          config: {
            template_id: 'abandoned-cart-reminder-2',
            variables: {
              reminder_type: 'urgent',
            },
          },
          order: 4,
        },
        {
          type: 'add_tag',
          config: {
            tag: 'abandoned_cart_contacted',
            category: 'behavior',
          },
          order: 5,
        },
      ],
      status: 'active',
    },
  },
  {
    id: 'post-purchase-follow-up',
    name: 'Suivi post-achat',
    description: 'Envoie des emails de suivi après un achat',
    category: 'post_purchase',
    icon: '📦',
    workflow: {
      name: 'Suivi post-achat',
      description: "Maintenez l'engagement après un achat avec des emails de suivi",
      trigger_type: 'event',
      trigger_config: {
        event_name: 'order.completed',
      },
      actions: [
        {
          type: 'send_email',
          config: {
            template_id: 'order-confirmation',
            variables: {},
          },
          order: 1,
        },
        {
          type: 'wait',
          config: {
            duration: 1440, // 24 heures
          },
          order: 2,
        },
        {
          type: 'send_email',
          config: {
            template_id: 'order-shipping-update',
            variables: {},
          },
          order: 3,
        },
        {
          type: 'wait',
          config: {
            duration: 4320, // 3 jours
          },
          order: 4,
        },
        {
          type: 'send_email',
          config: {
            template_id: 'order-review-request',
            variables: {},
          },
          order: 5,
        },
        {
          type: 'add_tag',
          config: {
            tag: 'post_purchase_follow_up',
            category: 'behavior',
          },
          order: 6,
        },
      ],
      status: 'active',
    },
  },
  {
    id: 're-engagement',
    name: 'Réengagement',
    description: 'Réengagez les utilisateurs inactifs',
    category: 're_engagement',
    icon: '🔄',
    workflow: {
      name: 'Réengagement utilisateurs inactifs',
      description: "Récupérez les utilisateurs qui n'ont pas été actifs récemment",
      trigger_type: 'condition',
      trigger_config: {
        condition: {
          field: 'user.last_activity',
          operator: 'older_than',
          value: 90, // jours
        },
      },
      actions: [
        {
          type: 'send_email',
          config: {
            template_id: 're-engagement-1',
            variables: {
              message: 'Nous vous avons manqué !',
            },
          },
          order: 1,
        },
        {
          type: 'wait',
          config: {
            duration: 2880, // 2 jours
          },
          order: 2,
        },
        {
          type: 'send_email',
          config: {
            template_id: 're-engagement-2',
            variables: {
              message: 'Offre spéciale pour vous',
            },
          },
          order: 3,
        },
        {
          type: 'add_tag',
          config: {
            tag: 're_engagement_contacted',
            category: 'behavior',
          },
          order: 4,
        },
      ],
      status: 'active',
    },
  },
  {
    id: 'vip-customer',
    name: 'Programme VIP',
    description: 'Créez un programme VIP pour vos meilleurs clients',
    category: 'custom',
    icon: '⭐',
    workflow: {
      name: 'Programme VIP',
      description: 'Identifiez et récompensez vos meilleurs clients',
      trigger_type: 'condition',
      trigger_config: {
        condition: {
          field: 'user.total_spent',
          operator: 'greater_than',
          value: 1000,
        },
      },
      actions: [
        {
          type: 'add_tag',
          config: {
            tag: 'vip',
            category: 'segment',
          },
          order: 1,
        },
        {
          type: 'send_email',
          config: {
            template_id: 'vip-welcome',
            variables: {
              vip_benefits: 'Accès exclusif, réductions spéciales, support prioritaire',
            },
          },
          order: 2,
        },
        {
          type: 'update_segment',
          config: {
            segment_id: 'vip-segment',
            action: 'add',
          },
          order: 3,
        },
      ],
      status: 'active',
    },
  },
];

export const getTemplateById = (id: string): WorkflowTemplate | undefined => {
  return WORKFLOW_TEMPLATES.find(template => template.id === id);
};

export const getTemplatesByCategory = (
  category: WorkflowTemplate['category']
): WorkflowTemplate[] => {
  return WORKFLOW_TEMPLATES.filter(template => template.category === category);
};
