import { CHATBOT_RESPONSES } from '../chatbotResponses';

describe('CHATBOT_RESPONSES', () => {
  it('should have defined messages for all expected keys', () => {
    expect(CHATBOT_RESPONSES).toBeDefined();

    // Exemple: Vérifier quelques messages clés
    expect(CHATBOT_RESPONSES.TECHNICAL_ERROR).toBeDefined();
    expect(typeof CHATBOT_RESPONSES.TECHNICAL_ERROR).toBe('string');
    expect(CHATBOT_RESPONSES.WELCOME_MESSAGE).toBeDefined();
    expect(typeof CHATBOT_RESPONSES.WELCOME_MESSAGE).toBe('string');
    expect(CHATBOT_RESPONSES.ORDER_NOT_LOGGED_IN).toBeDefined();
    expect(typeof CHATBOT_RESPONSES.ORDER_NOT_LOGGED_IN).toBe('string');
    expect(CHATBOT_RESPONSES.ORDER_LAST_STATUS('123456', 'livrée')).toBeDefined();

    // Vous pouvez ajouter d'autres vérifications pour les fonctions de message si nécessaire
    expect(CHATBOT_RESPONSES.ORDER_LAST_STATUS).toBeInstanceOf(Function);
    expect(CHATBOT_RESPONSES.PRODUCT_SEARCH_NOT_FOUND).toBeInstanceOf(Function);
  });

  it('should provide expected values for dynamic messages', () => {
    const orderId = 'XYZ789';
    const status = 'expédiée';
    expect(CHATBOT_RESPONSES.ORDER_LAST_STATUS(orderId, status)).toContain(orderId);
    expect(CHATBOT_RESPONSES.ORDER_LAST_STATUS(orderId, status)).toContain(status);

    const searchTerms = 't-shirt';
    expect(CHATBOT_RESPONSES.PRODUCT_SEARCH_NOT_FOUND(searchTerms)).toContain(searchTerms);

    const productName = 'Super Produit';
    expect(CHATBOT_RESPONSES.PRODUCT_SEARCH_VIEW_ACTION_LABEL(productName)).toContain(productName);
  });

  it('should have suggestions as arrays of strings', () => {
    expect(Array.isArray(CHATBOT_RESPONSES.WELCOME_SUGGESTIONS)).toBe(true);
    expect(CHATBOT_RESPONSES.WELCOME_SUGGESTIONS.length).toBeGreaterThan(0);
    expect(typeof CHATBOT_RESPONSES.WELCOME_SUGGESTIONS[0]).toBe('string');

    expect(Array.isArray(CHATBOT_RESPONSES.SHIPPING_SUGGESTIONS)).toBe(true);
    expect(CHATBOT_RESPONSES.SHIPPING_SUGGESTIONS.length).toBeGreaterThan(0);
    expect(typeof CHATBOT_RESPONSES.SHIPPING_SUGGESTIONS[0]).toBe('string');
  });
});
