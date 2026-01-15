/**
 * Réponses et messages du chatbot IA
 * Centralise les textes pour une meilleure maintenabilité et internationalisation future.
 * Date: Janvier 2026
 */

export const CHATBOT_RESPONSES = {
  // Messages d'erreur
  TECHNICAL_ERROR: "Désolé, je rencontre un problème technique. Un conseiller va prendre le relais.",
  RETRY_OR_CONTACT_SUPPORT: "Désolé, je rencontre un problème technique. Veuillez réessayer ou contacter notre support.",
  ORDER_FETCH_ERROR: "Je rencontre un problème pour accéder à vos commandes. Puis-je vous aider autrement ?",
  PRODUCT_SEARCH_ERROR: "Je rencontre un problème avec la recherche. Essayez de naviguer directement dans notre marketplace.",
  RECOMMENDATION_ERROR: "Découvrez nos produits populaires dans notre marketplace !",

  // Messages d'accueil (gérés dans useAIChatbot.ts mais ici pour référence si besoin)
  WELCOME_MESSAGE: "👋 Bonjour ! Je suis votre assistant IA. Je peux vous aider avec vos commandes, recommandations de produits, informations de livraison, et bien plus encore. Que puis-je faire pour vous ?",
  WELCOME_SUGGESTIONS: [
    "Où en est ma commande ?",
    "Quels produits recommandez-vous ?",
    "Informations de livraison"
  ],

  // Réponses et actions spécifiques aux intentions
  ORDER_NOT_LOGGED_IN: "Pour voir vos commandes, vous devez être connecté. Souhaitez-vous vous connecter ?",
  ORDER_NOT_LOGGED_IN_ACTION_LABEL: 'Se connecter',
  ORDER_NOT_FOUND: "Je ne trouve pas de commandes à votre nom. Avez-vous déjà passé commande sur notre plateforme ?",
  ORDER_NOT_FOUND_ACTION_LABEL: 'Découvrir nos produits',
  ORDER_LAST_STATUS: (orderId: string, status: string) => `Votre dernière commande (${orderId}) est ${status}. Souhaitez-vous voir tous vos détails de commande ?`,
  ORDER_VIEW_ACTION_LABEL: 'Voir ma commande',
  ORDER_ALL_ACTION_LABEL: 'Voir toutes les commandes',

  SHIPPING_INFO: "Pour les informations de livraison, nous travaillons avec plusieurs transporteurs : Chronopost, Colissimo, UPS, FedEx et DHL. Les délais varient selon votre région.",
  SHIPPING_ACTION_LABEL: 'Voir les options de livraison',
  SHIPPING_SUGGESTIONS: [
    "Quels sont les délais pour [votre région] ?",
    "Puis-je changer l'adresse de livraison ?",
    "Comment suivre ma commande ?"
  ],

  RETURN_POLICY: "Notre politique de retour vous permet de retourner vos produits dans les 30 jours. Les frais de retour sont offerts pour les produits défectueux.",
  RETURN_POLICY_ACTION_LABEL: 'Voir la politique de retour',
  RETURN_INITIATE_ACTION_LABEL: 'Initier un retour',

  PRODUCT_SEARCH_NO_QUERY: "Que recherchez-vous exactement ? Je peux vous aider à trouver des produits digitaux, physiques, des cours ou des services.",
  PRODUCT_SEARCH_NO_QUERY_SUGGESTIONS: [
    "Un logiciel de design",
    "Des cours de programmation",
    "Des produits artisanaux"
  ],
  PRODUCT_SEARCH_NOT_FOUND: (searchTerms: string) => `Je n'ai pas trouvé de produits correspondant à "${searchTerms}". Essayez avec d'autres termes ou parcourez nos catégories.`,
  PRODUCT_SEARCH_ALL_CATEGORIES_ACTION_LABEL: 'Voir toutes les catégories',
  PRODUCT_SEARCH_FOUND: (productList: string) => `J'ai trouvé plusieurs produits correspondant à votre recherche : ${productList}. Voulez-vous que je vous montre plus de détails ?`,
  PRODUCT_SEARCH_VIEW_ACTION_LABEL: (productName: string) => `Voir ${productName}`,

  RECOMMENDATION_NO_PRODUCTS: "Découvrez nos produits phares ! Nous avons des articles digitaux, physiques, des cours et des services.",
  RECOMMENDATION_EXPLORE_ACTION_LABEL: 'Explorer le marketplace',
  RECOMMENDATION_FOUND: "Voici quelques-unes de nos meilleures recommendations :",
  RECOMMENDATION_VIEW_ACTION_LABEL: (productName: string) => `Voir ${productName}`,

  HELP_MESSAGE: "Je peux vous aider avec : vos commandes, la livraison, les retours, la recherche de produits, et des recommandations personnalisées. Que souhaitez-vous savoir ?",
  HELP_SUGGESTIONS: [
    "Où en est ma commande ?",
    "Comment retourner un produit ?",
    "Quels produits recommandez-vous ?"
  ],

  GENERAL_GREETING: "Bonjour ! Je suis ravi de vous aider. Comment puis-je vous assister aujourd'hui ?",
  GENERAL_GREETING_SUGGESTIONS: [
    "Je cherche un produit",
    "Aide avec ma commande",
    "Informations de livraison"
  ],
  GENERAL_THANK_YOU: "De rien ! N'hésitez pas si vous avez d'autres questions. Bonne journée ! 👋",
  GENERAL_FALLBACK: "Je comprends votre demande. Pouvez-vous me donner plus de détails pour que je puisse mieux vous aider ?",
  GENERAL_FALLBACK_SUGGESTIONS: [
    "Expliquez votre problème",
    "Contactez le support",
    "Retournez au menu principal"
  ],
};