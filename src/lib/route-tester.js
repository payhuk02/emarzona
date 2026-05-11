// Script de test pour vérifier le routing SPA
// Ce script teste que toutes les routes sont accessibles

// pour le debugging dans la console du navigateur

const routes = [
  // Routes publiques
  '/',
  '/auth',
  '/marketplace',
  '/stores/test-store',
  '/stores/test-store/products/test-product',
  '/payment/success',
  '/payment/cancel',
  
  // Routes utilisateur (protégées)
  '/dashboard',
  '/dashboard/store',
  '/dashboard/products',
  '/dashboard/orders',
  '/dashboard/customers',
  '/dashboard/promotions',
  '/dashboard/analytics',
  '/dashboard/payments',
  '/dashboard/settings',
  '/dashboard/kyc',
  '/dashboard/referrals',
  '/dashboard/pixels',
  '/dashboard/seo',
  '/dashboard/products/new',
  '/dashboard/products/123/edit',
  
  // Routes admin
  '/admin',
  '/admin/users',
  '/admin/stores',
  '/admin/products',
  '/admin/sales',
  '/admin/referrals',
  '/admin/activity',
  '/admin/settings',
  '/admin/notifications',
  '/admin/revenue',
  '/admin/kyc',
  
  // Route 404
  '/nonexistent-page'
];

function testRoute(route) {
  return new Promise((resolve) => {
    const link = document.createElement('a');
    link.href = route;
    link.style.display = 'none';
    document.body.appendChild(link);
    
    // Simuler un clic pour tester la navigation
    link.click();
    
    // Vérifier que l'URL a changé
    setTimeout(() => {
      const currentPath = window.location.pathname;
      const isCorrect = currentPath === route || 
                       (route === '/' && currentPath === '/') ||
                       (route.includes('/stores/') && currentPath.includes('/stores/')) ||
                       (route.includes('/admin') && currentPath.includes('/admin')) ||
                       (route.includes('/dashboard') && currentPath.includes('/dashboard'));
      
      document.body.removeChild(link);
      resolve({
        route,
        success: isCorrect,
        currentPath: window.location.pathname
      });
    }, 100);
  });
}

async function testAllRoutes() {
  
  const results = [];
  
  for (const route of routes) {
    const result = await testRoute(route);
    results.push(result);
    
    if (result.success) {
    } else {
    }
  }
  
  const successCount = results.filter(r => r.success).length;
  const totalCount = results.length;
  
  
  if (successCount === totalCount) {
  } else {
  }
  
  return results;
}

// Fonction pour tester le rafraîchissement
function testRefresh() {
  
  const currentPath = window.location.pathname;
  
  // Simuler un rafraîchissement
  window.location.reload();
  
  // Note: Cette fonction sera exécutée après le rechargement
}

// Export pour utilisation dans d'autres modules
export { testAllRoutes, testRefresh, routes };

// Exécuter les tests si ce script est chargé directement
if (typeof window !== 'undefined') {
  // Attendre que l'application soit chargée
  window.addEventListener('load', () => {
    setTimeout(() => {
    }, 1000);
  });
}
