/**
 * Generates sidebar i18n locale files from navigation.menus.tsx titles.
 * Run: node scripts/generate-sidebar-i18n.mjs
 */
import fs from 'fs';

const source = fs.readFileSync('src/config/navigation.menus.tsx', 'utf8');

function urlToKey(url) {
  const path = url.split('?')[0];
  return (
    path
      .replace(/^\//, '')
      .replace(/\//g, '_')
      .replace(/[^a-zA-Z0-9_]/g, '_')
      .replace(/_+/g, '_')
      .replace(/^_|_$/g, '') || 'root'
  );
}

function labelToKey(label) {
  return label
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '');
}

const titleRe = /title:\s*['"]([^'"]+)['"][\s\S]*?url:\s*['"]([^'"]+)['"]/g;
const sectionRe = /label:\s*['"]([^'"]+)['"][\s\S]*?items:\s*\[/g;

const items = {};
let m;
while ((m = titleRe.exec(source))) {
  items[urlToKey(m[2])] = m[1];
}

const sections = {};
let lastIndex = 0;
while ((m = sectionRe.exec(source))) {
  sections[labelToKey(m[1])] = m[1];
  lastIndex = m.index;
}
void lastIndex;

const fr = { sidebar: { sections, items } };
const en = {
  sidebar: {
    sections: Object.fromEntries(
      Object.entries(sections).map(([k, v]) => [k, translateSectionEn(v)])
    ),
    items: Object.fromEntries(Object.entries(items).map(([k, v]) => [k, translateItemEn(v)])),
  },
};

function translateSectionEn(label) {
  const map = {
    principal: 'Main',
    mon_compte: 'My Account',
    produits_cours: 'Products & Courses',
    creer: 'Create',
    ventes_logistique: 'Sales & Logistics',
    finance_paiements: 'Finance & Payments',
    marketing_croissance: 'Marketing & Growth',
    analytics_seo: 'Analytics & SEO',
    recommandations_ia: 'AI Recommendations',
    systemes_integrations: 'Systems & Integrations',
    configuration: 'Settings',
    administration: 'Administration',
    catalogue: 'Catalog',
    commerce: 'Commerce',
    finance: 'Finance',
    croissance: 'Growth',
    analytics_monitoring: 'Analytics & Monitoring',
    securite_support: 'Security & Support',
  };
  return map[labelToKey(label)] ?? label;
}

function translateItemEn(title) {
  const exact = {
    'Tableau de bord': 'Dashboard',
    Boutique: 'Store',
    Marketplace: 'Marketplace',
    'Enchères Publiques': 'Public Auctions',
    'Portail Client': 'Customer Portal',
    'Mon Profil': 'My Profile',
    'Mes Commandes': 'My Orders',
    Produits: 'Products',
    Commandes: 'Orders',
    Clients: 'Customers',
    Paramètres: 'Settings',
    Marketing: 'Marketing',
    Statistiques: 'Analytics',
    KYC: 'KYC',
    Domaines: 'Domains',
    Notifications: 'Notifications',
    Inventaire: 'Inventory',
    Expéditions: 'Shipping',
    Paiements: 'Payments',
    Taxes: 'Taxes',
    Promotions: 'Promotions',
    Coupons: 'Coupons',
    'Créer un produit digital': 'Create digital product',
    'Créer un produit physique': 'Create physical product',
    'Créer un service': 'Create service',
    'Créer un cours': 'Create course',
    "Créer une œuvre d'artiste": 'Create artist artwork',
    'Choisir un type': 'Choose product type',
    'Mes licences achetées': 'My purchased licenses',
    'Gestion des Licences': 'License management',
    'Centre de notifications': 'Notification center',
    'Séries récurrentes (par client)': 'Recurring series (per customer)',
    'Abonnements récurrents (boutique)': 'Recurring subscriptions (store)',
    'Méthodes de paiement': 'Payment methods',
    'Connexions paiement': 'Payment connections',
  };
  return exact[title] ?? title;
}

fs.writeFileSync('src/i18n/locales/sidebar-fr.json', `${JSON.stringify(fr, null, 2)}\n`);
fs.writeFileSync('src/i18n/locales/sidebar-en.json', `${JSON.stringify(en, null, 2)}\n`);
console.log(
  `Generated sidebar locales: ${Object.keys(sections).length} sections, ${Object.keys(items).length} items`
);
