/**
 * Configuration Crisp Chat - Support Live Chat
 * Universel : Fonctionne pour TOUS les types de produits (digital, physical, service, course, artist)
 * Date : 27 octobre 2025
 */

import { logger } from './logger';

type CrispCommand = unknown[];

// Types pour Crisp
declare global {
  interface Window {
    $crisp: CrispCommand[];
    CRISP_WEBSITE_ID?: string;
  }
}

export type ProductType = 'digital' | 'physical' | 'service' | 'course' | 'artist';

export interface CrispUserData {
  email?: string;
  nickname?: string;
  phone?: string;
  avatar?: string;
}

export interface CrispSessionData {
  user_id?: string;
  user_role?: string;
  product_type?: ProductType;
  product_name?: string;
  product_id?: string;
  store_name?: string;
  plan?: string;
  locale?: string;
}

/**
 * Initialiser Crisp Chat
 */
export const initCrisp = (websiteId: string) => {
  if (typeof window === 'undefined') return;

  // Éviter double initialisation
  if (window.$crisp) {
    logger.warn('Crisp already initialized');
    return;
  }

  window.$crisp = [];
  window.CRISP_WEBSITE_ID = websiteId;

  // Charger le script Crisp
  const script = document.createElement('script');
  script.src = 'https://client.crisp.chat/l.js';
  script.async = true;
  document.head.appendChild(script);

  script.onload = () => {
    logger.info('Crisp Chat initialized successfully');
  };

  script.onerror = event => {
    logger.error('Error loading Crisp', { event });
  };
};

/**
 * Définir les données utilisateur
 */
export const setCrispUser = (userData: CrispUserData) => {
  if (!window.$crisp) return;

  if (userData.email) {
    window.$crisp.push(['set', 'user:email', [userData.email]]);
  }

  if (userData.nickname) {
    window.$crisp.push(['set', 'user:nickname', [userData.nickname]]);
  }

  if (userData.phone) {
    window.$crisp.push(['set', 'user:phone', [userData.phone]]);
  }

  if (userData.avatar) {
    window.$crisp.push(['set', 'user:avatar', [userData.avatar]]);
  }
};

/**
 * Définir les données de session (contexte métier)
 */
export const setCrispSessionData = (sessionData: CrispSessionData) => {
  if (!window.$crisp) return;

  // Ajouter chaque donnée comme custom data
  Object.entries(sessionData).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      window.$crisp.push(['set', 'session:data', [[key, value]]]);
    }
  });
};

/**
 * Définir un segment (pour ciblage marketing et support)
 */
export const setCrispSegment = (segment: string) => {
  if (!window.$crisp) return;
  window.$crisp.push(['set', 'session:segments', [[segment]]]);
};

/**
 * Ajouter un événement personnalisé
 */
export const pushCrispEvent = (eventName: string, data?: Record<string, unknown>) => {
  if (!window.$crisp) return;
  window.$crisp.push(['set', 'session:event', [[eventName, data || {}]]]);
};

/**
 * Ouvrir la chatbox
 */
export const openCrisp = () => {
  if (!window.$crisp) return;
  window.$crisp.push(['do', 'chat:open']);
};

/**
 * Fermer la chatbox
 */
export const closeCrisp = () => {
  if (!window.$crisp) return;
  window.$crisp.push(['do', 'chat:close']);
};

/**
 * Masquer la chatbox (pas de bulle)
 */
export const hideCrisp = () => {
  if (!window.$crisp) return;
  window.$crisp.push(['do', 'chat:hide']);
};

/**
 * Afficher la chatbox
 */
export const showCrisp = () => {
  if (!window.$crisp) return;
  window.$crisp.push(['do', 'chat:show']);
};

/**
 * Envoyer un message automatique
 */
export const sendCrispMessage = (message: string) => {
  if (!window.$crisp) return;
  window.$crisp.push(['do', 'message:send', ['text', message]]);
};

/**
 * Réinitialiser la session Crisp (lors du logout)
 */
export const resetCrisp = () => {
  if (!window.$crisp) return;
  window.$crisp.push(['do', 'session:reset']);
};

/**
 * Helper pour définir le contexte produit
 */
export const setCrispProductContext = (
  productType: ProductType,
  productName: string,
  productId: string,
  storeName?: string
) => {
  // Segment basé sur le type de produit
  const segmentMap: Record<ProductType, string> = {
    digital: 'digital-product-visitor',
    physical: 'physical-product-visitor',
    service: 'service-visitor',
    course: 'course-visitor',
    artist: 'artist-product-visitor',
  };

  setCrispSegment(segmentMap[productType]);

  // Données de session
  setCrispSessionData({
    product_type: productType,
    product_name: productName,
    product_id: productId,
    store_name: storeName,
  });

  // Événement personnalisé
  pushCrispEvent('viewed_product', {
    type: productType,
    name: productName,
    id: productId,
  });
};

/**
 * Helper pour le contexte checkout
 */
export const setCrispCheckoutContext = (
  productType: ProductType,
  amount: number,
  currency: string = 'XOF'
) => {
  setCrispSegment('checkout-visitor');

  pushCrispEvent('started_checkout', {
    product_type: productType,
    amount,
    currency,
  });
};

/**
 * Helper pour le contexte post-achat
 */
export const setCrispPostPurchaseContext = (
  productType: ProductType,
  orderId: string,
  amount: number
) => {
  setCrispSegment('customer');

  pushCrispEvent('completed_purchase', {
    product_type: productType,
    order_id: orderId,
    amount,
  });
};

/**
 * Messages automatiques par contexte
 */
export const triggerCrispAutoMessage = (
  context: 'product' | 'checkout' | 'support' | 'enrollment'
) => {
  const messages = {
    product: "👋 Besoin d'aide pour ce produit ? Je suis là pour répondre à vos questions !",
    checkout: "💳 Une question sur le paiement ? N'hésitez pas à me contacter !",
    support: "🆘 Comment puis-je vous aider aujourd'hui ?",
    enrollment: "🎓 Félicitations pour votre inscription ! Besoin d'aide pour démarrer ?",
  };

  // On n'envoie pas le message automatiquement, mais on peut l'afficher comme suggestion
  // Pour éviter de spammer l'utilisateur
  logger.debug('Crisp auto-message ready', { context, message: messages[context] });
};

/**
 * Configurer Crisp selon le rôle utilisateur
 */
export const configureCrispForRole = (role: 'seller' | 'buyer' | 'admin' | 'visitor') => {
  const roleSegments = {
    seller: 'seller',
    buyer: 'buyer',
    admin: 'admin',
    visitor: 'visitor',
  };

  setCrispSegment(roleSegments[role]);
  setCrispSessionData({ user_role: role });
};

/**
 * Helper pour détecter si l'utilisateur est inactif (abandonné)
 */
export const setupCrispInactivityTrigger = (delayMs: number = 30000) => {
  if (typeof window === 'undefined') return;

  let inactivityTimer: NodeJS.Timeout;

  const resetTimer = () => {
    clearTimeout(inactivityTimer);
    inactivityTimer = setTimeout(() => {
      pushCrispEvent('user_inactive', { duration_ms: delayMs });
    }, delayMs);
  };

  // Reset sur toute interaction
  ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'].forEach(event => {
    document.addEventListener(event, resetTimer, true);
  });

  resetTimer();
};
