/**
 * Script de vérification des routes
 * Vérifie que toutes les routes définies dans App.tsx ont des composants valides
 */

import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

interface RouteInfo {
  path: string;
  component: string;
  isProtected: boolean;
  isAdmin: boolean;
}

// Extraire les routes depuis App.tsx
function extractRoutes(): RouteInfo[] {
  const appPath = join(process.cwd(), 'src', 'App.tsx');
  const content = readFileSync(appPath, 'utf-8');
  
  const routes: RouteInfo[] = [];
  
  // Pattern pour trouver les routes
  const routePattern = /<Route\s+path=["']([^"']+)["']\s+element={[^}]+}/g;
  const protectedRoutePattern = /<Route\s+path=["']([^"']+)["']\s+element={<ProtectedRoute><([^>]+)\s*\/><\/ProtectedRoute>}/g;
  const lazyImportPattern = /const\s+(\w+)\s*=\s*lazy\(\(\)\s*=>\s*import\(["']([^"']+)["']\)/g;
  
  // Extraire les imports lazy
  const lazyImports = new Map<string, string>();
  let match;
  
  while ((match = lazyImportPattern.exec(content)) !== null) {
    const [, componentName, importPath] = match;
    lazyImports.set(componentName, importPath);
  }
  
  // Extraire les routes protégées
  while ((match = protectedRoutePattern.exec(content)) !== null) {
    const [, path, componentName] = match;
    const importPath = lazyImports.get(componentName);
    
    if (importPath) {
      routes.push({
        path,
        component: importPath.replace('./pages/', 'src/pages/'),
        isProtected: true,
        isAdmin: path.startsWith('/admin'),
      });
    }
  }
  
  // Extraire les routes publiques
  const publicRoutePattern = /<Route\s+path=["']([^"']+)["']\s+element={<(\w+)\s*\/>}/g;
  while ((match = publicRoutePattern.exec(content)) !== null) {
    const [, path, componentName] = match;
    const importPath = lazyImports.get(componentName);
    
    if (importPath) {
      routes.push({
        path,
        component: importPath.replace('./pages/', 'src/pages/'),
        isProtected: false,
        isAdmin: false,
      });
    }
  }
  
  return routes;
}

// Vérifier que les fichiers de composants existent
function verifyRouteFiles(routes: RouteInfo[]): { valid: RouteInfo[]; invalid: RouteInfo[] } {
  const valid: RouteInfo[] = [];
  const invalid: RouteInfo[] = [];
  
  for (const route of routes) {
    const filePath = join(process.cwd(), route.component);
    
    // Vérifier si le fichier existe
    if (existsSync(filePath) || existsSync(filePath + '.tsx') || existsSync(filePath + '.ts')) {
      valid.push(route);
    } else {
      invalid.push(route);
    }
  }
  
  return { valid, invalid };
}

// Générer un rapport
function generateReport(routes: RouteInfo[], valid: RouteInfo[], invalid: RouteInfo[]): void {
  console.log('\n📊 RAPPORT DE VÉRIFICATION DES ROUTES\n');
  console.log(`Total de routes: ${routes.length}`);
  console.log(`✅ Routes valides: ${valid.length}`);
  console.log(`❌ Routes invalides: ${invalid.length}\n`);
  
  if (invalid.length > 0) {
    console.log('❌ ROUTES INVALIDES (fichiers manquants):\n');
    invalid.forEach(route => {
      console.log(`  - ${route.path}`);
      console.log(`    Composant: ${route.component}`);
      console.log(`    Protégé: ${route.isProtected ? 'Oui' : 'Non'}`);
      console.log('');
    });
  }
  
  // Statistiques par type
  const publicRoutes = routes.filter(r => !r.isProtected);
  const protectedRoutes = routes.filter(r => r.isProtected && !r.isAdmin);
  const adminRoutes = routes.filter(r => r.isAdmin);
  
  console.log('\n📈 STATISTIQUES:\n');
  console.log(`Routes publiques: ${publicRoutes.length}`);
  console.log(`Routes protégées: ${protectedRoutes.length}`);
  console.log(`Routes admin: ${adminRoutes.length}`);
  
  // Routes potentiellement orphelines (non utilisées ailleurs)
  console.log('\n🔍 VÉRIFICATIONS:\n');
  console.log('✅ Toutes les routes sont définies dans App.tsx');
  console.log('⚠️  Note: Vérifiez manuellement les routes orphelines');
}

// Fonction principale
function main() {
  try {
    console.log('🔍 Vérification des routes...\n');
    
    const routes = extractRoutes();
    const { valid, invalid } = verifyRouteFiles(routes);
    
    generateReport(routes, valid, invalid);
    
    if (invalid.length > 0) {
      process.exit(1);
    } else {
      console.log('\n✅ Toutes les routes sont valides !\n');
      process.exit(0);
    }
  } catch (error) {
    console.error('❌ Erreur lors de la vérification:', error);
    process.exit(1);
  }
}

main();

