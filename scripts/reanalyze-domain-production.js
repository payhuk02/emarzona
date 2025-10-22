import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🔍 RE-ANALYSE MINUTIEUSE DES FONCTIONNALITÉS DOMAINE - PAYHULA\n');

const getFileContent = (filePath) => {
  try {
    const fullPath = path.join(__dirname, '..', filePath);
    return fs.readFileSync(fullPath, 'utf8');
  } catch (error) {
    console.error(`Error reading file ${filePath}:`, error.message);
    return '';
  }
};

// Lecture de tous les fichiers critiques
const domainSettingsContent = getFileContent('src/components/settings/DomainSettings.tsx');
const useDomainContent = getFileContent('src/hooks/useDomain.ts');
const useStoresContent = getFileContent('src/hooks/useStores.ts');
const settingsPageContent = getFileContent('src/pages/Settings.tsx');
const migrationContent = getFileContent('supabase/migrations/20250115_add_ssl_redirect_columns.sql');

console.log('📊 ANALYSE MINUTIEUSE DES COMPOSANTS...\n');

// 1. VÉRIFICATION DU COMPOSANT DOMAINSETTINGS
console.log('1️⃣ COMPOSANT DOMAINSETTINGS:');
const domainSettingsAnalysis = {
  // Imports et dépendances
  hasReactImports: domainSettingsContent.includes('import { useState, useEffect } from "react"'),
  hasUseStoresHook: domainSettingsContent.includes('import { useStores } from "@/hooks/useStores"'),
  hasUIComponents: domainSettingsContent.includes('import { Card, CardContent, CardDescription, CardHeader, CardTitle }'),
  hasTabsComponent: domainSettingsContent.includes('import { Tabs, TabsContent, TabsList, TabsTrigger }'),
  hasProgressComponent: domainSettingsContent.includes('import { Progress } from "@/components/ui/progress"'),
  hasToastHook: domainSettingsContent.includes('import { useToast } from "@/hooks/use-toast"'),
  hasAllIcons: domainSettingsContent.includes('Globe, Check, AlertCircle, Clock, Copy, ExternalLink, Shield, RefreshCw, Unplug, Settings, Info, Zap, Lock, Eye, EyeOff, Download, Upload, Trash2, Plus, Minus, ArrowRight, CheckCircle2, XCircle, Loader2'),
  
  // Interfaces et types
  hasDomainConfigInterface: domainSettingsContent.includes('interface DomainConfig'),
  hasDNSRecordInterface: domainSettingsContent.includes('interface DNSRecord'),
  hasProperTypes: domainSettingsContent.includes('custom_domain: string | null') && domainSettingsContent.includes('domain_status: \'not_configured\' | \'pending\' | \'verified\' | \'error\''),
  
  // Gestion d'état
  hasLoadingState: domainSettingsContent.includes('const [loading, setLoading] = useState(false)'),
  hasVerifyingState: domainSettingsContent.includes('const [verifying, setVerifying] = useState(false)'),
  hasDomainInputState: domainSettingsContent.includes('const [domainInput, setDomainInput] = useState("")'),
  hasActiveTabState: domainSettingsContent.includes('const [activeTab, setActiveTab] = useState("overview")'),
  hasDomainConfigState: domainSettingsContent.includes('const [domainConfig, setDomainConfig] = useState<DomainConfig>'),
  
  // Logique métier
  hasCurrentStoreLogic: domainSettingsContent.includes('const currentStore = stores.length > 0 ? stores[0] : null'),
  hasUseEffectSync: domainSettingsContent.includes('useEffect(() => {') && domainSettingsContent.includes('if (currentStore) {'),
  hasDomainValidation: domainSettingsContent.includes('const validateDomain = (domain: string): boolean'),
  hasDomainRegex: domainSettingsContent.includes('domainRegex.test(domain)'),
  hasTokenGeneration: domainSettingsContent.includes('const generateVerificationToken = ()'),
  
  // Fonctions principales
  hasConnectDomain: domainSettingsContent.includes('const handleConnectDomain = async ()'),
  hasVerifyDomain: domainSettingsContent.includes('const handleVerifyDomain = async ()'),
  hasDisconnectDomain: domainSettingsContent.includes('const handleDisconnectDomain = async ()'),
  hasToggleSSL: domainSettingsContent.includes('const handleToggleSSL = async ()'),
  hasCopyToClipboard: domainSettingsContent.includes('const copyToClipboard = (text: string)'),
  hasStatusBadge: domainSettingsContent.includes('const getStatusBadge = ()'),
  hasDNSInstructions: domainSettingsContent.includes('const getDNSInstructions = ()'),
  
  // Gestion d'erreurs
  hasErrorHandling: domainSettingsContent.includes('catch (error)'),
  hasToastNotifications: domainSettingsContent.includes('toast({'),
  hasLoadingStates: domainSettingsContent.includes('disabled={loading}'),
  hasConfirmationDialogs: domainSettingsContent.includes('confirm('),
  
  // Interface utilisateur
  hasTabsStructure: domainSettingsContent.includes('<Tabs value={activeTab} onValueChange={setActiveTab}'),
  hasOverviewTab: domainSettingsContent.includes('<TabsTrigger value="overview">Vue d\'ensemble</TabsTrigger>'),
  hasDNSTab: domainSettingsContent.includes('<TabsTrigger value="dns">DNS</TabsTrigger>'),
  hasSSLTab: domainSettingsContent.includes('<TabsTrigger value="ssl">SSL/Sécurité</TabsTrigger>'),
  hasAnalyticsTab: domainSettingsContent.includes('<TabsTrigger value="analytics">Analytics</TabsTrigger>'),
  
  // Responsive et accessibilité
  hasResponsiveClasses: domainSettingsContent.includes('sm:flex-row') && domainSettingsContent.includes('md:grid-cols-2'),
  hasAccessibilityAttrs: domainSettingsContent.includes('aria-label') && domainSettingsContent.includes('role='),
  hasSemanticHTML: domainSettingsContent.includes('<h2>') && domainSettingsContent.includes('<p>'),
  hasFormLabels: domainSettingsContent.includes('htmlFor=') && domainSettingsContent.includes('id='),
  
  // Fonctionnalités avancées
  hasSSLManagement: domainSettingsContent.includes('ssl_enabled'),
  hasRedirectManagement: domainSettingsContent.includes('redirect_https'),
  hasDNSRecords: domainSettingsContent.includes('Enregistrement A'),
  hasAnalyticsMetrics: domainSettingsContent.includes('Statistiques de trafic'),
  hasProgressBars: domainSettingsContent.includes('<Progress'),
  hasBadges: domainSettingsContent.includes('<Badge'),
  hasAlerts: domainSettingsContent.includes('<Alert')
};

let domainSettingsScore = 0;
let domainSettingsTotal = 0;
for (const key in domainSettingsAnalysis) {
  domainSettingsTotal++;
  if (domainSettingsAnalysis[key]) {
    domainSettingsScore++;
    console.log(`   ✅ ${key}: OK`);
  } else {
    console.log(`   ❌ ${key}: MANQUANT`);
  }
}

console.log(`\n   📊 Score DomainSettings: ${domainSettingsScore}/${domainSettingsTotal} (${Math.round((domainSettingsScore/domainSettingsTotal)*100)}%)\n`);

// 2. VÉRIFICATION DU HOOK USEDOMAIN
console.log('2️⃣ HOOK USEDOMAIN:');
const useDomainAnalysis = {
  // Imports et interfaces
  hasReactImports: useDomainContent.includes('import { useState, useCallback } from "react"'),
  hasSupabaseImport: useDomainContent.includes('import { supabase } from "@/integrations/supabase/client"'),
  hasToastImport: useDomainContent.includes('import { useToast } from "@/hooks/use-toast"'),
  hasDomainConfigInterface: useDomainContent.includes('export interface DomainConfig'),
  hasDNSRecordInterface: useDomainContent.includes('export interface DNSRecord'),
  hasAnalyticsInterface: useDomainContent.includes('export interface DomainAnalytics'),
  
  // Gestion d'état
  hasLoadingState: useDomainContent.includes('const [loading, setLoading] = useState(false)'),
  hasVerifyingState: useDomainContent.includes('const [verifying, setVerifying] = useState(false)'),
  hasAnalyticsState: useDomainContent.includes('const [analytics, setAnalytics] = useState<DomainAnalytics | null>(null)'),
  
  // Fonctions utilitaires
  hasValidateDomain: useDomainContent.includes('const validateDomain = useCallback((domain: string): boolean'),
  hasGenerateToken: useDomainContent.includes('const generateVerificationToken = useCallback(()'),
  
  // Fonctions principales
  hasConnectDomain: useDomainContent.includes('const connectDomain = useCallback(async (domain: string): Promise<boolean>'),
  hasVerifyDomain: useDomainContent.includes('const verifyDomain = useCallback(async (): Promise<boolean>'),
  hasDisconnectDomain: useDomainContent.includes('const disconnectDomain = useCallback(async (): Promise<boolean>'),
  hasUpdateSSL: useDomainContent.includes('const updateSSL = useCallback(async (sslEnabled: boolean): Promise<boolean>'),
  hasUpdateRedirects: useDomainContent.includes('const updateRedirects = useCallback(async (redirects: { www?: boolean; https?: boolean })'),
  
  // Fonctions avancées
  hasGetDNSInstructions: useDomainContent.includes('const getDNSInstructions = useCallback((domain: string, verificationToken: string)'),
  hasCheckDNSPropagation: useDomainContent.includes('const checkDNSPropagation = useCallback(async (domain: string): Promise<boolean>'),
  hasGetDomainAnalytics: useDomainContent.includes('const getDomainAnalytics = useCallback(async (): Promise<DomainAnalytics | null>'),
  hasExportDNSConfig: useDomainContent.includes('const exportDNSConfig = useCallback((domain: string, verificationToken: string)'),
  hasValidateDNSConfiguration: useDomainContent.includes('const validateDNSConfiguration = useCallback(async (domain: string): Promise<{'),
  
  // Gestion d'erreurs et sécurité
  hasErrorHandling: useDomainContent.includes('catch (error: any)'),
  hasToastNotifications: useDomainContent.includes('toast({'),
  hasInputValidation: useDomainContent.includes('if (!storeId)') && useDomainContent.includes('if (!validateDomain(domain))'),
  hasSupabaseOperations: useDomainContent.includes('supabase.from(\'stores\').update'),
  
  // Return object
  hasReturnObject: useDomainContent.includes('return {'),
  hasAllExports: useDomainContent.includes('loading,') && useDomainContent.includes('verifying,') && useDomainContent.includes('analytics,') && useDomainContent.includes('connectDomain,') && useDomainContent.includes('verifyDomain,') && useDomainContent.includes('disconnectDomain,')
};

let useDomainScore = 0;
let useDomainTotal = 0;
for (const key in useDomainAnalysis) {
  useDomainTotal++;
  if (useDomainAnalysis[key]) {
    useDomainScore++;
    console.log(`   ✅ ${key}: OK`);
  } else {
    console.log(`   ❌ ${key}: MANQUANT`);
  }
}

console.log(`\n   📊 Score useDomain: ${useDomainScore}/${useDomainTotal} (${Math.round((useDomainScore/useDomainTotal)*100)}%)\n`);

// 3. VÉRIFICATION DU HOOK USESTORES
console.log('3️⃣ HOOK USESTORES:');
const useStoresAnalysis = {
  // Interface Store étendue
  hasDomainFields: useStoresContent.includes('custom_domain?: string | null'),
  hasDomainStatus: useStoresContent.includes('domain_status?: \'not_configured\' | \'pending\' | \'verified\' | \'error\''),
  hasVerificationToken: useStoresContent.includes('domain_verification_token?: string | null'),
  hasVerifiedAt: useStoresContent.includes('domain_verified_at?: string | null'),
  hasErrorMessage: useStoresContent.includes('domain_error_message?: string | null'),
  hasSSLEnabled: useStoresContent.includes('ssl_enabled?: boolean'),
  hasRedirectWWW: useStoresContent.includes('redirect_www?: boolean'),
  hasRedirectHTTPS: useStoresContent.includes('redirect_https?: boolean'),
  hasDNSRecords: useStoresContent.includes('dns_records?: any[]'),
  
  // Fonctions CRUD
  hasUpdateStore: useStoresContent.includes('const updateStore = async (storeId: string, updates: Partial<Store>)'),
  hasCreateStore: useStoresContent.includes('const createStore = async (storeData: Partial<Store>)'),
  hasDeleteStore: useStoresContent.includes('const deleteStore = async (storeId: string)'),
  hasFetchStores: useStoresContent.includes('const fetchStores = async ()'),
  
  // Gestion d'erreurs
  hasErrorHandling: useStoresContent.includes('catch (err: any)'),
  hasToastNotifications: useStoresContent.includes('toast({'),
  hasLoadingStates: useStoresContent.includes('setLoading(true)'),
  
  // Return object
  hasReturnObject: useStoresContent.includes('return {'),
  hasAllExports: useStoresContent.includes('stores,') && useStoresContent.includes('loading,') && useStoresContent.includes('error,') && useStoresContent.includes('updateStore,')
};

let useStoresScore = 0;
let useStoresTotal = 0;
for (const key in useStoresAnalysis) {
  useStoresTotal++;
  if (useStoresAnalysis[key]) {
    useStoresScore++;
    console.log(`   ✅ ${key}: OK`);
  } else {
    console.log(`   ❌ ${key}: MANQUANT`);
  }
}

console.log(`\n   📊 Score useStores: ${useStoresScore}/${useStoresTotal} (${Math.round((useStoresScore/useStoresTotal)*100)}%)\n`);

// 4. VÉRIFICATION DE L'INTÉGRATION SETTINGS
console.log('4️⃣ INTÉGRATION SETTINGS:');
const settingsIntegrationAnalysis = {
  hasDomainImport: settingsPageContent.includes('import { DomainSettings } from "@/components/settings/DomainSettings"'),
  hasDomainTabTrigger: settingsPageContent.includes('<TabsTrigger value="domain"'),
  hasDomainTabContent: settingsPageContent.includes('<TabsContent value="domain"'),
  hasDomainComponent: settingsPageContent.includes('<DomainSettings />'),
  hasProperStructure: settingsPageContent.includes('className="space-y-3 sm:space-y-4 animate-fade-in"'),
  hasResponsiveClasses: settingsPageContent.includes('sm:space-y-4'),
  hasAnimationClasses: settingsPageContent.includes('animate-fade-in')
};

let settingsScore = 0;
let settingsTotal = 0;
for (const key in settingsIntegrationAnalysis) {
  settingsTotal++;
  if (settingsIntegrationAnalysis[key]) {
    settingsScore++;
    console.log(`   ✅ ${key}: OK`);
  } else {
    console.log(`   ❌ ${key}: MANQUANT`);
  }
}

console.log(`\n   📊 Score Settings Integration: ${settingsScore}/${settingsTotal} (${Math.round((settingsScore/settingsTotal)*100)}%)\n`);

// 5. VÉRIFICATION DE LA BASE DE DONNÉES
console.log('5️⃣ BASE DE DONNÉES:');
const databaseAnalysis = {
  hasSSLEnabledColumn: migrationContent.includes('ssl_enabled BOOLEAN DEFAULT false'),
  hasRedirectWWWColumn: migrationContent.includes('redirect_www BOOLEAN DEFAULT true'),
  hasRedirectHTTPSColumn: migrationContent.includes('redirect_https BOOLEAN DEFAULT true'),
  hasDNSRecordsColumn: migrationContent.includes('dns_records JSONB DEFAULT \'[]\'::jsonb'),
  hasSSLIndex: migrationContent.includes('CREATE INDEX IF NOT EXISTS idx_stores_ssl_enabled'),
  hasComments: migrationContent.includes('COMMENT ON COLUMN'),
  hasProperSyntax: migrationContent.includes('ALTER TABLE public.stores'),
  hasDefaultValues: migrationContent.includes('DEFAULT false') && migrationContent.includes('DEFAULT true')
};

let databaseScore = 0;
let databaseTotal = 0;
for (const key in databaseAnalysis) {
  databaseTotal++;
  if (databaseAnalysis[key]) {
    databaseScore++;
    console.log(`   ✅ ${key}: OK`);
  } else {
    console.log(`   ❌ ${key}: MANQUANT`);
  }
}

console.log(`\n   📊 Score Database: ${databaseScore}/${databaseTotal} (${Math.round((databaseScore/databaseTotal)*100)}%)\n`);

// 6. VÉRIFICATION DES CAS D'USAGE CRITIQUES
console.log('6️⃣ CAS D\'USAGE CRITIQUES:');
const criticalUseCasesAnalysis = {
  // Connexion de domaine
  hasDomainConnection: domainSettingsContent.includes('handleConnectDomain') && useDomainContent.includes('connectDomain'),
  hasDomainValidation: domainSettingsContent.includes('validateDomain') && useDomainContent.includes('validateDomain'),
  hasTokenGeneration: domainSettingsContent.includes('generateVerificationToken') && useDomainContent.includes('generateVerificationToken'),
  
  // Vérification DNS
  hasDNSVerification: domainSettingsContent.includes('handleVerifyDomain') && useDomainContent.includes('verifyDomain'),
  hasDNSInstructions: domainSettingsContent.includes('getDNSInstructions') && useDomainContent.includes('getDNSInstructions'),
  hasDNSCopy: domainSettingsContent.includes('copyToClipboard'),
  
  // Gestion SSL
  hasSSLToggle: domainSettingsContent.includes('handleToggleSSL') && useDomainContent.includes('updateSSL'),
  hasSSLStatus: domainSettingsContent.includes('ssl_enabled'),
  
  // Déconnexion
  hasDisconnection: domainSettingsContent.includes('handleDisconnectDomain') && useDomainContent.includes('disconnectDomain'),
  hasConfirmation: domainSettingsContent.includes('confirm('),
  
  // Analytics
  hasAnalytics: domainSettingsContent.includes('Analytics') && useDomainContent.includes('getDomainAnalytics'),
  hasMetrics: domainSettingsContent.includes('Statistiques de trafic'),
  
  // Gestion d'erreurs
  hasErrorHandling: domainSettingsContent.includes('catch (error)') && useDomainContent.includes('catch (error: any)'),
  hasToastNotifications: domainSettingsContent.includes('toast({') && useDomainContent.includes('toast({'),
  
  // États de chargement
  hasLoadingStates: domainSettingsContent.includes('loading') && useDomainContent.includes('loading'),
  hasVerifyingStates: domainSettingsContent.includes('verifying') && useDomainContent.includes('verifying')
};

let criticalScore = 0;
let criticalTotal = 0;
for (const key in criticalUseCasesAnalysis) {
  criticalTotal++;
  if (criticalUseCasesAnalysis[key]) {
    criticalScore++;
    console.log(`   ✅ ${key}: OK`);
  } else {
    console.log(`   ❌ ${key}: MANQUANT`);
  }
}

console.log(`\n   📊 Score Critical Use Cases: ${criticalScore}/${criticalTotal} (${Math.round((criticalScore/criticalTotal)*100)}%)\n`);

// 7. VÉRIFICATION DE LA SÉCURITÉ
console.log('7️⃣ SÉCURITÉ:');
const securityAnalysis = {
  hasInputValidation: domainSettingsContent.includes('validateDomain') && useDomainContent.includes('validateDomain'),
  hasInputSanitization: domainSettingsContent.includes('trim()'),
  hasErrorHandling: domainSettingsContent.includes('catch (error)') && useDomainContent.includes('catch (error: any)'),
  hasLoadingStates: domainSettingsContent.includes('disabled={loading}'),
  hasConfirmationDialogs: domainSettingsContent.includes('confirm('),
  hasTokenSecurity: domainSettingsContent.includes('generateVerificationToken') && useDomainContent.includes('generateVerificationToken'),
  hasSupabaseSecurity: useDomainContent.includes('supabase.from(\'stores\').update'),
  hasRLS: useStoresContent.includes('auth.uid() = user_id'),
  hasErrorMessages: domainSettingsContent.includes('variant: "destructive"'),
  hasSecureUpdates: useStoresContent.includes('update(updates)')
};

let securityScore = 0;
let securityTotal = 0;
for (const key in securityAnalysis) {
  securityTotal++;
  if (securityAnalysis[key]) {
    securityScore++;
    console.log(`   ✅ ${key}: OK`);
  } else {
    console.log(`   ❌ ${key}: MANQUANT`);
  }
}

console.log(`\n   📊 Score Security: ${securityScore}/${securityTotal} (${Math.round((securityScore/securityTotal)*100)}%)\n`);

// CALCUL DU SCORE GLOBAL
const totalScore = domainSettingsScore + useDomainScore + useStoresScore + settingsScore + databaseScore + criticalScore + securityScore;
const totalPossible = domainSettingsTotal + useDomainTotal + useStoresTotal + settingsTotal + databaseTotal + criticalTotal + securityTotal;
const globalPercentage = Math.round((totalScore / totalPossible) * 100);

console.log('================================================================================');
console.log('📈 RÉSULTATS DE LA RE-ANALYSE MINUTIEUSE');
console.log('================================================================================');

console.log('\n🎯 SCORES PAR CATÉGORIE:');
console.log(`   📦 DomainSettings: ${domainSettingsScore}/${domainSettingsTotal} (${Math.round((domainSettingsScore/domainSettingsTotal)*100)}%)`);
console.log(`   🔧 useDomain Hook: ${useDomainScore}/${useDomainTotal} (${Math.round((useDomainScore/useDomainTotal)*100)}%)`);
console.log(`   🏪 useStores Hook: ${useStoresScore}/${useStoresTotal} (${Math.round((useStoresScore/useStoresTotal)*100)}%)`);
console.log(`   ⚙️ Settings Integration: ${settingsScore}/${settingsTotal} (${Math.round((settingsScore/settingsTotal)*100)}%)`);
console.log(`   🗄️ Database: ${databaseScore}/${databaseTotal} (${Math.round((databaseScore/databaseTotal)*100)}%)`);
console.log(`   🎯 Critical Use Cases: ${criticalScore}/${criticalTotal} (${Math.round((criticalScore/criticalTotal)*100)}%)`);
console.log(`   🔒 Security: ${securityScore}/${securityTotal} (${Math.round((securityScore/securityTotal)*100)}%)`);

console.log(`\n🏆 SCORE GLOBAL: ${totalScore}/${totalPossible} (${globalPercentage}%)`);

if (globalPercentage >= 95) {
  console.log('🎉 EXCELLENT! Prêt pour la production');
} else if (globalPercentage >= 90) {
  console.log('✅ TRÈS BIEN! Prêt pour la production avec quelques améliorations mineures');
} else if (globalPercentage >= 85) {
  console.log('⚠️ BIEN! Quelques améliorations importantes nécessaires');
} else if (globalPercentage >= 75) {
  console.log('🔴 ATTENTION! Des corrections majeures requises');
} else {
  console.log('❌ CRITIQUE! Refonte nécessaire');
}

console.log('\n💡 RECOMMANDATIONS FINALES:');
console.log('   1. ✅ Tester toutes les fonctionnalités sur différents navigateurs');
console.log('   2. ✅ Vérifier la validation des domaines avec des cas réels');
console.log('   3. ✅ Tester la gestion des erreurs avec des domaines invalides');
console.log('   4. ✅ Valider les performances avec de gros volumes de données');
console.log('   5. ✅ Effectuer des tests d\'accessibilité avec des outils spécialisés');
console.log('   6. ✅ Vérifier la sécurité avec des outils de scan');
console.log('   7. ✅ Tester la responsivité sur différents appareils');
console.log('   8. ✅ Valider l\'intégration avec la base de données');
console.log('   9. ✅ Effectuer des tests de charge et de stress');
console.log('   10. ✅ Documenter les procédures de déploiement');

console.log('\n✅ Re-analyse minutieuse terminée!');
