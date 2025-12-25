/**
 * Script d'analyse du Sidebar et des Routes
 * Compare les liens du sidebar avec les routes disponibles dans App.tsx
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Lire AppSidebar.tsx
const appSidebarPath = path.join(__dirname, '../src/components/AppSidebar.tsx');
const appSidebarContent = fs.readFileSync(appSidebarPath, 'utf-8');

// Lire App.tsx
const appPath = path.join(__dirname, '../src/App.tsx');
const appContent = fs.readFileSync(appPath, 'utf-8');

// Extraire les URLs du sidebar
const sidebarUrls = [];
const sidebarSections = [];

// Extraire menuSections
const menuSectionsMatch = appSidebarContent.match(/const menuSections = \[([\s\S]*?)\];/);
if (menuSectionsMatch) {
  const sectionsContent = menuSectionsMatch[1];
  const sectionMatches = sectionsContent.matchAll(/label:\s*"([^"]+)",\s*items:\s*\[([\s\S]*?)\]/g);
  
  for (const sectionMatch of sectionMatches) {
    const sectionLabel = sectionMatch[1];
    const itemsContent = sectionMatch[2];
    const items = [];
    
    const itemMatches = itemsContent.matchAll(/title:\s*"([^"]+)",\s*url:\s*"([^"]+)"/g);
    for (const itemMatch of itemMatches) {
      const title = itemMatch[1];
      const url = itemMatch[2];
      items.push({ title, url });
      sidebarUrls.push(url);
    }
    
    sidebarSections.push({ label: sectionLabel, items });
  }
}

// Extraire adminMenuSections
const adminMenuSectionsMatch = appSidebarContent.match(/const adminMenuSections = \[([\s\S]*?)\];/);
if (adminMenuSectionsMatch) {
  const sectionsContent = adminMenuSectionsMatch[1];
  const sectionMatches = sectionsContent.matchAll(/label:\s*"([^"]+)",\s*items:\s*\[([\s\S]*?)\]/g);
  
  for (const sectionMatch of sectionMatches) {
    const sectionLabel = sectionMatch[1];
    const itemsContent = sectionMatch[2];
    const items = [];
    
    const itemMatches = itemsContent.matchAll(/title:\s*"([^"]+)",\s*url:\s*"([^"]+)"/g);
    for (const itemMatch of itemMatches) {
      const title = itemMatch[1];
      const url = itemMatch[2];
      items.push({ title, url });
      sidebarUrls.push(url);
    }
    
    sidebarSections.push({ label: `[ADMIN] ${sectionLabel}`, items });
  }
}

// Extraire les routes de App.tsx
const routes = [];
const routeMatches = appContent.matchAll(/<Route\s+path="([^"]+)"[^>]*>/g);
for (const routeMatch of routeMatches) {
  routes.push(routeMatch[1]);
}

// Normaliser les URLs (enlever les paramètres dynamiques pour comparaison)
const normalizeUrl = (url) => {
  return url
    .replace(/:\w+/g, '*') // Remplacer :id, :slug, etc. par *
    .replace(/\?.*$/, '') // Enlever les query params
    .replace(/\/$/, ''); // Enlever trailing slash
};

const normalizeRoute = (route) => {
  return route
    .replace(/:\w+/g, '*')
    .replace(/\?.*$/, '')
    .replace(/\/$/, '');
};

// Créer des sets normalisés pour comparaison
const normalizedSidebarUrls = new Set(sidebarUrls.map(normalizeUrl));
const normalizedRoutes = new Set(routes.map(normalizeRoute));

// Trouver les liens du sidebar qui n'ont pas de route correspondante
const missingRoutes = [];
for (const url of sidebarUrls) {
  const normalized = normalizeUrl(url);
  let found = false;
  
  for (const route of routes) {
    if (normalizeRoute(route) === normalized) {
      found = true;
      break;
    }
  }
  
  // Vérifier aussi les patterns avec wildcards
  if (!found) {
    const urlParts = normalized.split('/');
    for (const route of routes) {
      const routeParts = normalizeRoute(route).split('/');
      if (urlParts.length === routeParts.length) {
        let matches = true;
        for (let i = 0; i < urlParts.length; i++) {
          if (urlParts[i] !== routeParts[i] && routeParts[i] !== '*' && urlParts[i] !== '*') {
            matches = false;
            break;
          }
        }
        if (matches) {
          found = true;
          break;
        }
      }
    }
  }
  
  if (!found) {
    missingRoutes.push(url);
  }
}

// Trouver les routes qui n'ont pas de lien dans le sidebar
const orphanRoutes = [];
for (const route of routes) {
  const normalized = normalizeRoute(route);
  
  // Ignorer les routes publiques et spéciales
  if (
    route === '/' ||
    route === '/auth' ||
    route === '/marketplace' ||
    route === '/cart' ||
    route === '/checkout' ||
    route === '*' ||
    route.startsWith('/stores/') ||
    route.startsWith('/digital/') ||
    route.startsWith('/physical/') ||
    route.startsWith('/service/') ||
    route.startsWith('/artist/') ||
    route.startsWith('/courses/') ||
    route.startsWith('/bundles/') ||
    route.startsWith('/wishlist/') ||
    route.startsWith('/legal/') ||
    route.startsWith('/payment/') ||
    route.startsWith('/unsubscribe') ||
    route.startsWith('/aff/') ||
    route.startsWith('/i18n-test') ||
    route.includes('/products/') ||
    route.includes('/edit') ||
    route.includes('/new') ||
    route.includes('/analytics') ||
    route.includes('/messaging') ||
    route.includes('/manage') ||
    route.includes('/conversations') ||
    route.includes('/redirect')
  ) {
    continue;
  }
  
  let found = false;
  for (const url of sidebarUrls) {
    const urlNormalized = normalizeUrl(url);
    if (urlNormalized === normalized) {
      found = true;
      break;
    }
    
    // Vérifier les patterns
    const urlParts = urlNormalized.split('/');
    const routeParts = normalized.split('/');
    if (urlParts.length === routeParts.length) {
      let matches = true;
      for (let i = 0; i < urlParts.length; i++) {
        if (urlParts[i] !== routeParts[i] && routeParts[i] !== '*' && urlParts[i] !== '*') {
          matches = false;
          break;
        }
      }
      if (matches) {
        found = true;
        break;
      }
    }
  }
  
  if (!found && route.startsWith('/dashboard/') || route.startsWith('/admin/') || route.startsWith('/account/') || route.startsWith('/affiliate/')) {
    orphanRoutes.push(route);
  }
}

// Générer le rapport
const report = {
  summary: {
    totalSidebarLinks: sidebarUrls.length,
    totalRoutes: routes.length,
    missingRoutes: missingRoutes.length,
    orphanRoutes: orphanRoutes.length,
  },
  sections: sidebarSections,
  missingRoutes,
  orphanRoutes: orphanRoutes.slice(0, 50), // Limiter à 50 pour lisibilité
};

console.log(JSON.stringify(report, null, 2));

// Écrire le rapport dans un fichier
const reportPath = path.join(__dirname, '../docs/audits/SIDEBAR_ROUTES_ANALYSIS.json');
fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
console.log(`\n✅ Rapport généré: ${reportPath}`);

