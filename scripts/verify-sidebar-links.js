/**
 * Script de vérification des liens du sidebar
 * Vérifie que tous les liens du sidebar correspondent à des routes existantes
 */

const sidebarLinks = [
  // Menu Principal
  "/dashboard",
  "/dashboard/store",
  "/marketplace",
  "/account",
  "/account/orders",
  "/account/downloads",
  "/account/digital",
  "/account/physical",
  "/account/courses",
  "/dashboard/courses/new",
  "/account/wishlist",
  "/account/invoices",
  "/account/returns",
  "/account/profile",
  "/dashboard/products",
  "/dashboard/my-courses",
  "/dashboard/digital-products",
  "/dashboard/my-downloads",
  "/dashboard/my-licenses",
  "/dashboard/digital-products/bundles/create",
  "/demo/templates-ui",
  "/dashboard/my-templates",
  "/dashboard/products/new",
  "/dashboard/orders",
  "/dashboard/advanced-orders",
  "/dashboard/bookings",
  "/dashboard/advanced-calendar",
  "/dashboard/recurring-bookings",
  "/dashboard/inventory",
  "/dashboard/shipping",
  "/dashboard/batch-shipping",
  "/dashboard/product-kits",
  "/dashboard/demand-forecasting",
  "/dashboard/cost-optimization",
  "/dashboard/suppliers",
  "/dashboard/warehouses",
  "/dashboard/physical-inventory",
  "/dashboard/physical-analytics",
  "/dashboard/physical-lots",
  "/dashboard/physical-serial-tracking",
  "/dashboard/physical-barcode-scanner",
  "/dashboard/physical-preorders",
  "/dashboard/physical-backorders",
  "/dashboard/physical-bundles",
  "/dashboard/multi-currency",
  "/dashboard/payments",
  "/dashboard/pay-balance",
  "/dashboard/payment-management",
  "/dashboard/customers",
  "/dashboard/promotions",
  "/dashboard/physical-promotions",
  "/dashboard/referrals",
  "/dashboard/affiliates",
  "/affiliate/courses",
  "/dashboard/analytics",
  "/dashboard/pixels",
  "/dashboard/seo",
  "/dashboard/webhooks",
  "/dashboard/digital-webhooks",
  "/dashboard/physical-webhooks",
  "/dashboard/loyalty",
  "/dashboard/gift-cards",
  "/dashboard/kyc",
  "/dashboard/settings",
  // Menu Admin
  "/admin",
  "/admin/users",
  "/admin/stores",
  "/admin/products",
  "/admin/courses",
  "/dashboard/digital-products",
  "/dashboard/products",
  "/dashboard/bookings",
  "/admin/reviews",
  "/dashboard/license-management",
  "/demo/templates-ui",
  "/admin/templates",
  "/admin/templates-premium",
  "/admin/sales",
  "/admin/orders",
  "/admin/inventory",
  "/admin/shipping",
  "/admin/returns",
  "/dashboard/advanced-calendar",
  "/dashboard/recurring-bookings",
  "/dashboard/product-kits",
  "/dashboard/demand-forecasting",
  "/dashboard/cost-optimization",
  "/dashboard/batch-shipping",
  "/dashboard/suppliers",
  "/dashboard/warehouses",
  "/admin/revenue",
  "/admin/payments",
  "/admin/taxes",
  "/admin/disputes",
  "/admin/webhooks",
  "/dashboard/digital-webhooks",
  "/dashboard/physical-webhooks",
  "/admin/loyalty",
  "/admin/gift-cards",
  "/admin/referrals",
  "/admin/affiliates",
  "/admin/analytics",
  "/admin/kyc",
  "/admin/security",
  "/admin/activity",
  "/admin/audit",
  "/admin/support",
  "/admin/notifications",
  "/admin/settings",
];

const routes = [
  "/",
  "/auth",
  "/marketplace",
  "/cart",
  "/checkout",
  "/account",
  "/account/orders",
  "/account/downloads",
  "/account/digital",
  "/account/physical",
  "/account/courses",
  "/account/profile",
  "/account/wishlist",
  "/account/invoices",
  "/account/returns",
  "/account/loyalty",
  "/account/gift-cards",
  "/stores/:slug",
  "/stores/:slug/products/:productSlug",
  "/i18n-test",
  "/legal/terms",
  "/legal/privacy",
  "/legal/cookies",
  "/legal/refund",
  "/payment/success",
  "/payment/cancel",
  "/dashboard",
  "/dashboard/store",
  "/dashboard/products",
  "/dashboard/orders",
  "/dashboard/advanced-orders",
  "/dashboard/advanced-orders-test",
  "/dashboard/customers",
  "/dashboard/promotions",
  "/dashboard/analytics",
  "/dashboard/payments",
  "/dashboard/settings",
  "/dashboard/kyc",
  "/dashboard/referrals",
  "/dashboard/pixels",
  "/dashboard/seo",
  "/dashboard/products/new",
  "/dashboard/products/:id/edit",
  "/dashboard/webhooks",
  "/dashboard/digital-webhooks",
  "/dashboard/physical-webhooks",
  "/dashboard/physical-inventory",
  "/dashboard/physical-promotions",
  "/dashboard/physical-analytics",
  "/dashboard/physical-lots",
  "/dashboard/physical-serial-tracking",
  "/dashboard/physical-barcode-scanner",
  "/dashboard/physical-preorders",
  "/dashboard/physical-backorders",
  "/dashboard/physical-bundles",
  "/dashboard/multi-currency",
  "/dashboard/loyalty",
  "/dashboard/gift-cards",
  "/dashboard/suppliers",
  "/dashboard/warehouses",
  "/dashboard/product-kits",
  "/dashboard/demand-forecasting",
  "/dashboard/cost-optimization",
  "/dashboard/batch-shipping",
  "/dashboard/affiliates",
  "/affiliate/dashboard",
  "/affiliate/courses",
  "/affiliate/courses/:slug",
  "/notifications",
  "/settings/notifications",
  "/dashboard/my-courses",
  "/dashboard/courses/new",
  "/courses/:slug",
  "/courses/:slug/analytics",
  "/dashboard/digital-products",
  "/digital/search",
  "/digital/compare",
  "/digital/:productId",
  "/wishlist/shared/:token",
  "/dashboard/my-downloads",
  "/dashboard/digital-products/bundles/create",
  "/bundles/:bundleId",
  "/dashboard/my-licenses",
  "/dashboard/licenses/manage/:id",
  "/dashboard/license-management",
  "/dashboard/digital/analytics/:productId",
  "/dashboard/services/recurring-bookings",
  "/dashboard/my-templates",
  "/orders/:orderId/messaging",
  "/payments/:orderId/manage",
  "/payments/:orderId/balance",
  "/disputes/:disputeId",
  "/shipping",
  "/inventory",
  "/dashboard/payment-management",
  "/dashboard/pay-balance",
  "/dashboard/shipping",
  "/dashboard/inventory",
  "/dashboard/bookings",
  "/dashboard/advanced-calendar",
  "/dashboard/recurring-bookings",
  "/physical/:productId",
  "/service/:serviceId",
  "/bookings/manage",
  "/demo/templates-ui",
  "/admin",
  "/admin/users",
  "/admin/stores",
  "/admin/products",
  "/admin/sales",
  "/admin/referrals",
  "/admin/activity",
  "/admin/settings",
  "/admin/notifications",
  "/admin/revenue",
  "/admin/kyc",
  "/admin/disputes",
  "/admin/affiliates",
  "/admin/reviews",
  "/admin/inventory",
  "/admin/support",
  "/admin/analytics",
  "/admin/payments",
  "/admin/shipping",
  "/admin/courses",
  "/admin/security",
  "/admin/audit",
  "/admin/taxes",
  "/admin/returns",
  "/admin/webhooks",
  "/admin/loyalty",
  "/admin/gift-cards",
  "/admin/suppliers",
  "/admin/warehouses",
  "/admin/product-kits",
  "/admin/demand-forecasting",
  "/admin/cost-optimization",
  "/admin/batch-shipping",
  "/admin/orders",
  "/admin/templates",
  "/admin/templates-premium",
];

// Fonction pour normaliser les routes (enlever les paramètres dynamiques)
function normalizeRoute(route) {
  return route.replace(/\/:[^/]+/g, '');
}

// Fonction pour vérifier si un lien correspond à une route
function matchesRoute(link, route) {
  const normalizedLink = normalizeRoute(link);
  const normalizedRoute = normalizeRoute(route);
  
  // Correspondance exacte
  if (normalizedLink === normalizedRoute) {
    return true;
  }
  
  // Correspondance avec paramètres dynamiques
  const linkParts = link.split('/');
  const routeParts = route.split('/');
  
  if (linkParts.length !== routeParts.length) {
    return false;
  }
  
  for (let i = 0; i < linkParts.length; i++) {
    if (routeParts[i].startsWith(':')) {
      continue; // Paramètre dynamique, on ignore
    }
    if (linkParts[i] !== routeParts[i]) {
      return false;
    }
  }
  
  return true;
}

// Vérifier tous les liens
const missingLinks = [];
const validLinks = [];

sidebarLinks.forEach(link => {
  const found = routes.some(route => matchesRoute(link, route));
  if (found) {
    validLinks.push(link);
  } else {
    missingLinks.push(link);
  }
});

// Afficher les résultats
console.log('=== RÉSULTATS DE LA VÉRIFICATION ===\n');
console.log(`Total de liens vérifiés: ${sidebarLinks.length}`);
console.log(`Liens valides: ${validLinks.length}`);
console.log(`Liens manquants: ${missingLinks.length}\n`);

if (missingLinks.length > 0) {
  console.log('=== LIENS MANQUANTS ===');
  missingLinks.forEach(link => {
    console.log(`❌ ${link}`);
  });
} else {
  console.log('✅ Tous les liens sont valides !');
}

