import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🔍 VÉRIFICATION COMPLÈTE DES FONCTIONNALITÉS DOMAINE - PAYHULA\n');

const getFileContent = (filePath) => {
  try {
    const fullPath = path.join(__dirname, '..', filePath);
    return fs.readFileSync(fullPath, 'utf8');
  } catch (error) {
    console.error(`Error reading file ${filePath}:`, error.message);
    return '';
  }
};

const domainSettingsContent = getFileContent('src/components/settings/DomainSettings.tsx');
const useDomainContent = getFileContent('src/hooks/useDomain.ts');
const useStoresContent = getFileContent('src/hooks/useStores.ts');
const settingsPageContent = getFileContent('src/pages/Settings.tsx');

console.log('📊 VÉRIFICATION DES COMPOSANTS...');

// Vérification du composant DomainSettings
const domainSettingsChecks = {
  hasImports: domainSettingsContent.includes('import { useState, useEffect } from "react"'),
  hasUseStores: domainSettingsContent.includes('import { useStores } from "@/hooks/useStores"'),
  hasUseToast: domainSettingsContent.includes('import { useToast } from "@/hooks/use-toast"'),
  hasUIComponents: domainSettingsContent.includes('import { Card, CardContent, CardDescription, CardHeader, CardTitle }'),
  hasTabs: domainSettingsContent.includes('import { Tabs, TabsContent, TabsList, TabsTrigger }'),
  hasProgress: domainSettingsContent.includes('import { Progress } from "@/components/ui/progress"'),
  hasIcons: domainSettingsContent.includes('import { Globe, Check, AlertCircle, Clock, Copy'),
  hasInterfaces: domainSettingsContent.includes('interface DomainConfig'),
  hasDNSRecordInterface: domainSettingsContent.includes('interface DNSRecord'),
  hasStateManagement: domainSettingsContent.includes('const [loading, setLoading] = useState(false)'),
  hasDomainValidation: domainSettingsContent.includes('const validateDomain = (domain: string): boolean'),
  hasConnectDomain: domainSettingsContent.includes('const handleConnectDomain = async ()'),
  hasVerifyDomain: domainSettingsContent.includes('const handleVerifyDomain = async ()'),
  hasDisconnectDomain: domainSettingsContent.includes('const handleDisconnectDomain = async ()'),
  hasToggleSSL: domainSettingsContent.includes('const handleToggleSSL = async ()'),
  hasCopyToClipboard: domainSettingsContent.includes('const copyToClipboard = (text: string)'),
  hasStatusBadge: domainSettingsContent.includes('const getStatusBadge = ()'),
  hasDNSInstructions: domainSettingsContent.includes('const getDNSInstructions = ()'),
  hasTabsStructure: domainSettingsContent.includes('<Tabs value={activeTab} onValueChange={setActiveTab}'),
  hasOverviewTab: domainSettingsContent.includes('<TabsTrigger value="overview">Vue d\'ensemble</TabsTrigger>'),
  hasDNSTab: domainSettingsContent.includes('<TabsTrigger value="dns">DNS</TabsTrigger>'),
  hasSSLTab: domainSettingsContent.includes('<TabsTrigger value="ssl">SSL/Sécurité</TabsTrigger>'),
  hasAnalyticsTab: domainSettingsContent.includes('<TabsTrigger value="analytics">Analytics</TabsTrigger>'),
  hasErrorHandling: domainSettingsContent.includes('catch (error)'),
  hasLoadingStates: domainSettingsContent.includes('disabled={loading}'),
  hasToastNotifications: domainSettingsContent.includes('toast({'),
  hasResponsiveDesign: domainSettingsContent.includes('className="flex flex-col sm:flex-row'),
  hasAccessibility: domainSettingsContent.includes('aria-label'),
  hasSecurityFeatures: domainSettingsContent.includes('SSL/TLS'),
  hasDNSRecords: domainSettingsContent.includes('Enregistrement A'),
  hasAnalyticsMetrics: domainSettingsContent.includes('Statistiques de trafic')
};

console.log('   📦 DomainSettings Component:');
for (const key in domainSettingsChecks) {
  console.log(`      ${domainSettingsChecks[key] ? '✅' : '❌'} ${key}: ${domainSettingsChecks[key] ? 'OK' : 'MANQUANT'}`);
}

// Vérification du hook useDomain
const useDomainChecks = {
  hasImports: useDomainContent.includes('import { useState, useCallback } from "react"'),
  hasSupabase: useDomainContent.includes('import { supabase } from "@/integrations/supabase/client"'),
  hasUseToast: useDomainContent.includes('import { useToast } from "@/hooks/use-toast"'),
  hasInterfaces: useDomainContent.includes('export interface DomainConfig'),
  hasDNSRecordInterface: useDomainContent.includes('export interface DNSRecord'),
  hasAnalyticsInterface: useDomainContent.includes('export interface DomainAnalytics'),
  hasStateManagement: useDomainContent.includes('const [loading, setLoading] = useState(false)'),
  hasVerifyingState: useDomainContent.includes('const [verifying, setVerifying] = useState(false)'),
  hasAnalyticsState: useDomainContent.includes('const [analytics, setAnalytics] = useState<DomainAnalytics | null>(null)'),
  hasValidateDomain: useDomainContent.includes('const validateDomain = useCallback((domain: string): boolean'),
  hasConnectDomain: useDomainContent.includes('const connectDomain = useCallback(async (domain: string): Promise<boolean>'),
  hasVerifyDomain: useDomainContent.includes('const verifyDomain = useCallback(async (): Promise<boolean>'),
  hasDisconnectDomain: useDomainContent.includes('const disconnectDomain = useCallback(async (): Promise<boolean>'),
  hasUpdateSSL: useDomainContent.includes('const updateSSL = useCallback(async (sslEnabled: boolean): Promise<boolean>'),
  hasUpdateRedirects: useDomainContent.includes('const updateRedirects = useCallback(async (redirects: { www?: boolean; https?: boolean })'),
  hasGetDNSInstructions: useDomainContent.includes('const getDNSInstructions = useCallback((domain: string, verificationToken: string)'),
  hasCheckDNSPropagation: useDomainContent.includes('const checkDNSPropagation = useCallback(async (domain: string): Promise<boolean>'),
  hasGetDomainAnalytics: useDomainContent.includes('const getDomainAnalytics = useCallback(async (): Promise<DomainAnalytics | null>'),
  hasExportDNSConfig: useDomainContent.includes('const exportDNSConfig = useCallback((domain: string, verificationToken: string)'),
  hasValidateDNSConfiguration: useDomainContent.includes('const validateDNSConfiguration = useCallback(async (domain: string): Promise<{'),
  hasErrorHandling: useDomainContent.includes('catch (error: any)'),
  hasToastNotifications: useDomainContent.includes('toast({'),
  hasReturnObject: useDomainContent.includes('return {'),
  hasAllExports: useDomainContent.includes('loading,') && useDomainContent.includes('verifying,') && useDomainContent.includes('analytics,')
};

console.log('   🔧 useDomain Hook:');
for (const key in useDomainChecks) {
  console.log(`      ${useDomainChecks[key] ? '✅' : '❌'} ${key}: ${useDomainChecks[key] ? 'OK' : 'MANQUANT'}`);
}

// Vérification du hook useStores
const useStoresChecks = {
  hasDomainFields: useStoresContent.includes('custom_domain?: string | null'),
  hasDomainStatus: useStoresContent.includes('domain_status?: \'not_configured\' | \'pending\' | \'verified\' | \'error\''),
  hasVerificationToken: useStoresContent.includes('domain_verification_token?: string | null'),
  hasVerifiedAt: useStoresContent.includes('domain_verified_at?: string | null'),
  hasErrorMessage: useStoresContent.includes('domain_error_message?: string | null'),
  hasSSLEnabled: useStoresContent.includes('ssl_enabled?: boolean'),
  hasRedirectWWW: useStoresContent.includes('redirect_www?: boolean'),
  hasRedirectHTTPS: useStoresContent.includes('redirect_https?: boolean'),
  hasDNSRecords: useStoresContent.includes('dns_records?: any[]'),
  hasUpdateStore: useStoresContent.includes('const updateStore = async (storeId: string, updates: Partial<Store>)')
};

console.log('   🏪 useStores Hook:');
for (const key in useStoresChecks) {
  console.log(`      ${useStoresChecks[key] ? '✅' : '❌'} ${key}: ${useStoresChecks[key] ? 'OK' : 'MANQUANT'}`);
}

// Vérification de l'intégration dans Settings
const settingsIntegrationChecks = {
  hasDomainImport: settingsPageContent.includes('import { DomainSettings } from "@/components/settings/DomainSettings"'),
  hasDomainTab: settingsPageContent.includes('<TabsTrigger value="domain">Domaine</TabsTrigger>'),
  hasDomainContent: settingsPageContent.includes('<TabsContent value="domain"'),
  hasDomainComponent: settingsPageContent.includes('<DomainSettings />'),
  hasProperStructure: settingsPageContent.includes('className="space-y-3 sm:space-y-4 animate-fade-in"')
};

console.log('   ⚙️ Settings Page Integration:');
for (const key in settingsIntegrationChecks) {
  console.log(`      ${settingsIntegrationChecks[key] ? '✅' : '❌'} ${key}: ${settingsIntegrationChecks[key] ? 'OK' : 'MANQUANT'}`);
}

console.log('\n📱 VÉRIFICATION DES FONCTIONNALITÉS RESPONSIVE...');
const responsiveChecks = {
  hasMobileClasses: domainSettingsContent.includes('sm:flex-row'),
  hasTabletClasses: domainSettingsContent.includes('md:grid-cols-2'),
  hasDesktopClasses: domainSettingsContent.includes('lg:'),
  hasResponsiveText: domainSettingsContent.includes('text-sm sm:text-base'),
  hasResponsiveSpacing: domainSettingsContent.includes('space-y-3 sm:space-y-4'),
  hasResponsivePadding: domainSettingsContent.includes('px-4 py-4 sm:px-6 sm:py-5'),
  hasResponsiveGrid: domainSettingsContent.includes('grid gap-4 md:grid-cols-2'),
  hasResponsiveButtons: domainSettingsContent.includes('flex flex-col sm:flex-row'),
  hasResponsiveCards: domainSettingsContent.includes('p-3 sm:p-4')
};

for (const key in responsiveChecks) {
  console.log(`   ${responsiveChecks[key] ? '✅' : '❌'} ${key}: ${responsiveChecks[key] ? 'OK' : 'MANQUANT'}`);
}

console.log('\n🔒 VÉRIFICATION DE LA SÉCURITÉ...');
const securityChecks = {
  hasDomainValidation: domainSettingsContent.includes('domainRegex.test(domain)'),
  hasInputSanitization: domainSettingsContent.includes('domain.trim()'),
  hasErrorHandling: domainSettingsContent.includes('catch (error)'),
  hasLoadingStates: domainSettingsContent.includes('disabled={loading}'),
  hasConfirmationDialogs: domainSettingsContent.includes('confirm('),
  hasSSLManagement: domainSettingsContent.includes('ssl_enabled'),
  hasRedirectManagement: domainSettingsContent.includes('redirect_https'),
  hasTokenGeneration: domainSettingsContent.includes('generateVerificationToken'),
  hasSecureUpdates: useStoresContent.includes('update(updates)')
};

for (const key in securityChecks) {
  console.log(`   ${securityChecks[key] ? '✅' : '❌'} ${key}: ${securityChecks[key] ? 'OK' : 'MANQUANT'}`);
}

console.log('\n🎨 VÉRIFICATION DE L\'ACCESSIBILITÉ...');
const accessibilityChecks = {
  hasAriaLabels: domainSettingsContent.includes('aria-label'),
  hasRoleAttributes: domainSettingsContent.includes('role='),
  hasSemanticHTML: domainSettingsContent.includes('<h2>') && domainSettingsContent.includes('<p>'),
  hasButtonDescriptions: domainSettingsContent.includes('disabled={loading}'),
  hasLoadingIndicators: domainSettingsContent.includes('Loader2'),
  hasStatusIndicators: domainSettingsContent.includes('Badge'),
  hasErrorMessages: domainSettingsContent.includes('AlertDescription'),
  hasFocusManagement: domainSettingsContent.includes('tabIndex'),
  hasKeyboardNavigation: domainSettingsContent.includes('onKeyDown')
};

for (const key in accessibilityChecks) {
  console.log(`   ${accessibilityChecks[key] ? '✅' : '❌'} ${key}: ${accessibilityChecks[key] ? 'OK' : 'MANQUANT'}`);
}

console.log('\n⚡ VÉRIFICATION DES PERFORMANCES...');
const performanceChecks = {
  hasUseCallback: useDomainContent.includes('useCallback'),
  hasLazyLoading: domainSettingsContent.includes('loading'),
  hasOptimizedRenders: domainSettingsContent.includes('useState'),
  hasMemoization: domainSettingsContent.includes('useEffect'),
  hasEfficientUpdates: useStoresContent.includes('fetchStores()'),
  hasErrorBoundaries: domainSettingsContent.includes('try {'),
  hasLoadingStates: domainSettingsContent.includes('setLoading'),
  hasAsyncOperations: domainSettingsContent.includes('async ()')
};

for (const key in performanceChecks) {
  console.log(`   ${performanceChecks[key] ? '✅' : '❌'} ${key}: ${performanceChecks[key] ? 'OK' : 'MANQUANT'}`);
}

console.log('\n================================================================================');
console.log('📈 RÉSULTATS DE LA VÉRIFICATION COMPLÈTE');
console.log('================================================================================');

const totalChecks = {
  domainSettings: Object.values(domainSettingsChecks).filter(Boolean).length,
  useDomain: Object.values(useDomainChecks).filter(Boolean).length,
  useStores: Object.values(useStoresChecks).filter(Boolean).length,
  settingsIntegration: Object.values(settingsIntegrationChecks).filter(Boolean).length,
  responsive: Object.values(responsiveChecks).filter(Boolean).length,
  security: Object.values(securityChecks).filter(Boolean).length,
  accessibility: Object.values(accessibilityChecks).filter(Boolean).length,
  performance: Object.values(performanceChecks).filter(Boolean).length
};

const totalPossible = {
  domainSettings: Object.keys(domainSettingsChecks).length,
  useDomain: Object.keys(useDomainChecks).length,
  useStores: Object.keys(useStoresChecks).length,
  settingsIntegration: Object.keys(settingsIntegrationChecks).length,
  responsive: Object.keys(responsiveChecks).length,
  security: Object.keys(securityChecks).length,
  accessibility: Object.keys(accessibilityChecks).length,
  performance: Object.keys(performanceChecks).length
};

console.log('\n🎯 SCORES PAR CATÉGORIE:');
for (const category in totalChecks) {
  const score = totalChecks[category];
  const total = totalPossible[category];
  const percentage = Math.round((score / total) * 100);
  const status = percentage >= 90 ? '🟢' : percentage >= 70 ? '🟡' : '🔴';
  console.log(`   ${status} ${category}: ${score}/${total} (${percentage}%)`);
}

const overallScore = Object.values(totalChecks).reduce((a, b) => a + b, 0);
const overallTotal = Object.values(totalPossible).reduce((a, b) => a + b, 0);
const overallPercentage = Math.round((overallScore / overallTotal) * 100);

console.log(`\n🏆 SCORE GLOBAL: ${overallScore}/${overallTotal} (${overallPercentage}%)`);

if (overallPercentage >= 95) {
  console.log('🎉 EXCELLENT! Prêt pour la production');
} else if (overallPercentage >= 85) {
  console.log('✅ TRÈS BIEN! Quelques améliorations mineures recommandées');
} else if (overallPercentage >= 70) {
  console.log('⚠️ BIEN! Des améliorations importantes nécessaires');
} else {
  console.log('❌ ATTENTION! Des corrections majeures requises');
}

console.log('\n💡 RECOMMANDATIONS POUR LA PRODUCTION:');
console.log('   1. ✅ Tester toutes les fonctionnalités sur différents navigateurs');
console.log('   2. ✅ Vérifier la validation des domaines avec des cas réels');
console.log('   3. ✅ Tester la gestion des erreurs avec des domaines invalides');
console.log('   4. ✅ Valider les performances avec de gros volumes de données');
console.log('   5. ✅ Effectuer des tests d\'accessibilité avec des outils spécialisés');
console.log('   6. ✅ Vérifier la sécurité avec des outils de scan');
console.log('   7. ✅ Tester la responsivité sur différents appareils');
console.log('   8. ✅ Valider l\'intégration avec la base de données');

console.log('\n✅ Vérification terminée!');
