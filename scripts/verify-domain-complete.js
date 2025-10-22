/**
 * Script de vérification complète des fonctionnalités Domaine
 * Payhula SaaS Platform
 */

import fs from 'fs';
import path from 'path';

console.log('🔍 VÉRIFICATION COMPLÈTE DES FONCTIONNALITÉS DOMAINE');
console.log('=' .repeat(60));

let score = 0;
let total = 0;

function checkFeature(description, condition, points = 1) {
  total += points;
  if (condition) {
    score += points;
    console.log(`✅ ${description}`);
  } else {
    console.log(`❌ ${description}`);
  }
}

// 1. Vérification du composant DomainSettings
console.log('\n📁 1. COMPOSANT DOMAINSETTINGS');
const domainSettingsPath = 'src/components/settings/DomainSettings.tsx';
const domainSettingsContent = fs.readFileSync(domainSettingsPath, 'utf8');

checkFeature('Fichier DomainSettings.tsx existe', fs.existsSync(domainSettingsPath));
checkFeature('Export du composant DomainSettings', domainSettingsContent.includes('export const DomainSettings'));
checkFeature('Import des hooks React', domainSettingsContent.includes('import { useState, useEffect }'));
checkFeature('Import useStores', domainSettingsContent.includes('import { useStores }'));
checkFeature('Import useToast', domainSettingsContent.includes('import { useToast }'));
checkFeature('Gestion du chargement', domainSettingsContent.includes('storesLoading'));
checkFeature('Gestion du cas sans boutique', domainSettingsContent.includes('!currentStore'));
checkFeature('Variables d\'état définies', domainSettingsContent.includes('useState<string>("")'));
checkFeature('Fonction handleConnectDomain', domainSettingsContent.includes('handleConnectDomain'));
checkFeature('Fonction handleVerifyDomain', domainSettingsContent.includes('handleVerifyDomain'));
checkFeature('Fonction handleCheckPropagation', domainSettingsContent.includes('handleCheckPropagation'));
checkFeature('Fonction handleToggleSSL', domainSettingsContent.includes('handleToggleSSL'));
checkFeature('Fonction copyToClipboard', domainSettingsContent.includes('copyToClipboard'));

// 2. Vérification du composant Settings
console.log('\n📁 2. COMPOSANT SETTINGS');
const settingsPath = 'src/pages/Settings.tsx';
const settingsContent = fs.readFileSync(settingsPath, 'utf8');

checkFeature('Fichier Settings.tsx existe', fs.existsSync(settingsPath));
checkFeature('Import DomainSettings', settingsContent.includes('import { DomainSettings }'));
checkFeature('Variable activeTab définie', settingsContent.includes('const [activeTab, setActiveTab]'));
checkFeature('Onglet domain dans mobile', settingsContent.includes('value="domain"'));
checkFeature('Onglet domain dans tablette', settingsContent.includes('value="domain"'));
checkFeature('Onglet domain dans desktop', settingsContent.includes('value="domain"'));
checkFeature('TabsContent domain', settingsContent.includes('<TabsContent value="domain"'));
checkFeature('Rendu DomainSettings', settingsContent.includes('<DomainSettings />'));

// 3. Vérification du hook useStores
console.log('\n📁 3. HOOK USESTORES');
const useStoresPath = 'src/hooks/useStores.ts';
const useStoresContent = fs.readFileSync(useStoresPath, 'utf8');

checkFeature('Fichier useStores.ts existe', fs.existsSync(useStoresPath));
checkFeature('Export useStores', useStoresContent.includes('export const useStores'));
checkFeature('Interface Store définie', useStoresContent.includes('export interface Store'));
checkFeature('Champs domaine dans Store', useStoresContent.includes('custom_domain'));
checkFeature('Champs SSL dans Store', useStoresContent.includes('ssl_enabled'));
checkFeature('Champs redirection dans Store', useStoresContent.includes('redirect_www'));
checkFeature('Fonction updateStore', useStoresContent.includes('updateStore'));
checkFeature('Gestion du loading', useStoresContent.includes('loading'));

// 4. Vérification des imports UI
console.log('\n📁 4. COMPOSANTS UI');
checkFeature('Import Card', domainSettingsContent.includes('import { Card'));
checkFeature('Import Button', domainSettingsContent.includes('import { Button'));
checkFeature('Import Input', domainSettingsContent.includes('import { Input'));
checkFeature('Import Alert', domainSettingsContent.includes('import { Alert'));
checkFeature('Import Badge', domainSettingsContent.includes('import { Badge'));
checkFeature('Import Tabs', domainSettingsContent.includes('import { Tabs'));
checkFeature('Import Progress', domainSettingsContent.includes('import { Progress'));

// 5. Vérification des icônes
console.log('\n📁 5. ICÔNES LUCIDE');
checkFeature('Import Globe', domainSettingsContent.includes('Globe'));
checkFeature('Import Check', domainSettingsContent.includes('Check'));
checkFeature('Import AlertCircle', domainSettingsContent.includes('AlertCircle'));
checkFeature('Import Loader2', domainSettingsContent.includes('Loader2'));
checkFeature('Import RefreshCw', domainSettingsContent.includes('RefreshCw'));
checkFeature('Import Copy', domainSettingsContent.includes('Copy'));

// 6. Vérification des fonctionnalités métier
console.log('\n📁 6. FONCTIONNALITÉS MÉTIER');
checkFeature('Validation de domaine', domainSettingsContent.includes('validateDomain'));
checkFeature('Génération token', domainSettingsContent.includes('generateVerificationToken'));
checkFeature('Instructions DNS', domainSettingsContent.includes('getDNSInstructions'));
checkFeature('Statut de propagation', domainSettingsContent.includes('propagationStatus'));
checkFeature('Configuration domaine', domainSettingsContent.includes('domainConfig'));
checkFeature('Gestion des erreurs', domainSettingsContent.includes('try {') && domainSettingsContent.includes('catch'));

// 7. Vérification de la responsivité
console.log('\n📁 7. RESPONSIVITÉ');
checkFeature('Classes responsive mobile', domainSettingsContent.includes('sm:'));
checkFeature('Classes responsive tablette', domainSettingsContent.includes('md:'));
checkFeature('Classes responsive desktop', domainSettingsContent.includes('lg:'));
checkFeature('Flex responsive', domainSettingsContent.includes('flex-col sm:flex-row'));
checkFeature('Grid responsive', domainSettingsContent.includes('grid-cols'));

// 8. Vérification de l'accessibilité
console.log('\n📁 8. ACCESSIBILITÉ');
checkFeature('Labels aria-label', domainSettingsContent.includes('aria-label'));
checkFeature('Descriptions aria-describedby', domainSettingsContent.includes('aria-describedby'));
checkFeature('Attributs aria-hidden', domainSettingsContent.includes('aria-hidden'));

// Calcul du score final
const percentage = Math.round((score / total) * 100);

console.log('\n' + '='.repeat(60));
console.log(`📊 SCORE FINAL: ${score}/${total} (${percentage}%)`);

if (percentage >= 95) {
  console.log('🎉 EXCELLENT! Toutes les fonctionnalités domaine sont opérationnelles');
} else if (percentage >= 85) {
  console.log('✅ TRÈS BIEN! Quelques améliorations mineures possibles');
} else if (percentage >= 70) {
  console.log('⚠️  CORRECT! Des améliorations sont nécessaires');
} else {
  console.log('❌ PROBLÈME! Des corrections importantes sont requises');
}

console.log('\n🚀 PRÊT POUR LA PRODUCTION:', percentage >= 90 ? 'OUI' : 'NON');
console.log('='.repeat(60));
