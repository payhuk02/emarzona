/**
 * Test Data Helpers
 * Centralized test data for consistent E2E testing
 */

export const TEST_USERS = {
  vendor: {
    email: 'test@payhula.com',
    password: 'TestPassword123!',
    name: 'Test Vendor',
  },
  customer: {
    email: 'customer@payhula.com',
    password: 'CustomerPass123!',
    name: 'Test Customer',
  },
  admin: {
    email: 'admin@payhula.com',
    password: 'AdminPass123!',
    name: 'Test Admin',
  },
};

export const TEST_PRODUCTS = {
  digital: {
    title: 'Test Digital Product E2E',
    description: 'This is a test digital product created via E2E tests',
    price: 29.99,
    category: 'ebooks',
    metaTitle: 'Test Digital Product SEO',
    metaDescription: 'SEO description for test product',
  },
  physical: {
    title: 'Test Physical Product E2E',
    description: 'This is a test physical product',
    price: 99.99,
    sku: 'TEST-SKU-',
    stock: 50,
    weight: 1.5,
    metaTitle: 'Test Physical Product SEO',
  },
  service: {
    title: 'Test Service E2E',
    description: 'Professional consulting service',
    price: 150.00,
    duration: 60,
    serviceType: 'consultation',
    metaTitle: 'Test Service SEO',
  },
  course: {
    title: 'Test Course E2E',
    description: 'Complete E2E testing course',
    price: 199.99,
    level: 'intermediate',
    metaTitle: 'Test Course SEO',
  },
};

export const TEST_PAYMENT = {
  card: {
    number: '4242424242424242',
    expiry: '12/25',
    cvc: '123',
  },
  cardDeclined: {
    number: '4000000000000002',
    expiry: '12/25',
    cvc: '123',
  },
};

export const TEST_SHIPPING = {
  valid: {
    address: '123 Test Street',
    city: 'Paris',
    postalCode: '75001',
    country: 'France',
  },
  invalid: {
    address: 'Invalid Address 123456',
    city: 'InvalidCity',
    postalCode: '00000',
    country: 'InvalidCountry',
  },
};

export const TEST_MESSAGES = {
  order: 'Hello, this is a test message from E2E test',
  dispute: 'This is a test response to the dispute',
};

/**
 * Generate unique test data
 */
export function generateTestSKU(): string {
  return `TEST-SKU-${Date.now()}`;
}

export function generateTestEmail(): string {
  return `test-${Date.now()}@payhula.com`;
}

export function generateTestTitle(type: string): string {
  return `Test ${type} ${Date.now()}`;
}

/**
 * Wait helpers
 */
export const WAIT_TIMES = {
  short: 2000,
  medium: 5000,
  long: 10000,
  veryLong: 30000,
};

/**
 * Selectors
 */
export const SELECTORS = {
  // Auth
  emailInput: 'input[type="email"]',
  passwordInput: 'input[type="password"]',
  submitButton: 'button[type="submit"]',
  
  // Navigation
  dashboardLink: 'text=/tableau de bord|dashboard/i',
  productsLink: 'text=/produits|products/i',
  ordersLink: 'text=/commandes|orders/i',
  
  // Products
  productCard: '[data-testid="product-card"], .product-card',
  createProductButton: 'text=/créer|create|ajouter/i',
  nextButton: 'button:has-text("Suivant"), button:has-text("Next")',
  publishButton: 'button:has-text("Publier"), button:has-text("Publish")',
  
  // Cart & Checkout
  buyButton: 'button:has-text("Acheter"), button:has-text("Buy")',
  addToCartButton: 'button:has-text("Ajouter au panier"), button:has-text("Add to cart")',
  checkoutButton: 'button:has-text("Passer commande"), button:has-text("Checkout")',
  
  // Orders
  orderItem: '[data-testid="order-item"]',
  messagingButton: 'button:has-text("Messagerie"), button:has-text("Messages")',
  paymentButton: 'button:has-text("Gérer Paiements"), button:has-text("Manage Payments")',
  
  // Messages
  successMessage: 'text=/succès|success|créé/i',
  errorMessage: 'text=/erreur|error|échec/i',
};

/**
 * Test helpers
 */
export async function createTestImage(): Promise<Buffer> {
  // 1x1 transparent PNG
  return Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
    'base64'
  );
}

export async function createTestPDF(): Promise<Buffer> {
  // Minimal PDF
  const pdfContent = `%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /Resources 4 0 R /MediaBox [0 0 612 792] /Contents 5 0 R >>
endobj
4 0 obj
<< /Font << /F1 << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> >> >>
endobj
5 0 obj
<< /Length 44 >>
stream
BT
/F1 12 Tf
100 700 Td
(Test PDF) Tj
ET
endstream
endobj
xref
0 6
0000000000 65535 f
0000000009 00000 n
0000000058 00000 n
0000000115 00000 n
0000000214 00000 n
0000000304 00000 n
trailer
<< /Size 6 /Root 1 0 R >>
startxref
398
%%EOF`;
  
  return Buffer.from(pdfContent);
}

