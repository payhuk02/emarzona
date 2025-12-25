/**
 * Script pour ajouter automatiquement les clés de traduction manquantes
 * Utilise les traductions FR comme référence et génère les traductions pour EN, ES, DE, PT
 */

import * as fs from 'fs';
import * as path from 'path';

const LOCALES_DIR = path.join(process.cwd(), 'src/i18n/locales');

interface TranslationData {
  [key: string]: any;
}

// Traductions pour les clés manquantes
const translations: Record<string, Record<string, string>> = {
  en: {
    'common.coverage': 'Coverage',
    'wizard.title': 'New Digital Product',
    'wizard.subtitle': 'Create a professional digital product in 6 steps',
    'wizard.back': 'Back to type selection',
    'wizard.backShort': 'Back',
    'wizard.step': 'Step',
    'wizard.of': 'of',
    'wizard.steps': 'Form steps',
    'wizard.autoSaving': 'Auto-saving...',
    'wizard.previous': 'Previous step',
    'wizard.prev': 'Prev.',
    'wizard.next': 'Next',
    'wizard.nextShort': 'Next',
    'wizard.saveDraft': 'Save as draft',
    'wizard.draft': 'Draft',
    'wizard.publish': 'Publish product',
    'wizard.publishShort': 'Publish',
    'wizard.publishing': 'Publishing...',
    'wizard.publishingShort': 'Pub...',
    'wizard.shortcuts.save': 'Draft',
    'wizard.shortcuts.next': 'Next',
    'wizard.shortcuts.prev': 'Previous',
    'wizard.seo.faq.description': 'Optimize your SEO and add answers to frequently asked questions',
    'wizard.errors.title': 'Error',
    'wizard.errors.requiredFields': 'Please fill in all required fields',
    'wizard.errors.noFiles': 'Please add a main link for your product',
  },
  es: {
    'common.coverage': 'Cobertura',
    'wizard.title': 'Nuevo Producto Digital',
    'wizard.subtitle': 'Crea un producto digital profesional en 6 pasos',
    'wizard.back': 'Volver a la selección de tipo',
    'wizard.backShort': 'Volver',
    'wizard.step': 'Paso',
    'wizard.of': 'de',
    'wizard.steps': 'Pasos del formulario',
    'wizard.autoSaving': 'Guardando automáticamente...',
    'wizard.previous': 'Paso anterior',
    'wizard.prev': 'Ant.',
    'wizard.next': 'Siguiente',
    'wizard.nextShort': 'Sig.',
    'wizard.saveDraft': 'Guardar como borrador',
    'wizard.draft': 'Borrador',
    'wizard.publish': 'Publicar producto',
    'wizard.publishShort': 'Publicar',
    'wizard.publishing': 'Publicando...',
    'wizard.publishingShort': 'Pub...',
    'wizard.shortcuts.save': 'Borrador',
    'wizard.shortcuts.next': 'Siguiente',
    'wizard.shortcuts.prev': 'Anterior',
    'wizard.seo.faq.description': 'Optimiza tu SEO y añade respuestas a preguntas frecuentes',
    'wizard.errors.title': 'Error',
    'wizard.errors.requiredFields': 'Por favor completa todos los campos obligatorios',
    'wizard.errors.noFiles': 'Por favor añade un enlace principal para tu producto',
  },
  de: {
    'common.coverage': 'Abdeckung',
    'wizard.title': 'Neues Digitales Produkt',
    'wizard.subtitle': 'Erstellen Sie ein professionelles digitales Produkt in 6 Schritten',
    'wizard.back': 'Zurück zur Typauswahl',
    'wizard.backShort': 'Zurück',
    'wizard.step': 'Schritt',
    'wizard.of': 'von',
    'wizard.steps': 'Formularschritte',
    'wizard.autoSaving': 'Automatisches Speichern...',
    'wizard.previous': 'Vorheriger Schritt',
    'wizard.prev': 'Zurück',
    'wizard.next': 'Weiter',
    'wizard.nextShort': 'Weiter',
    'wizard.saveDraft': 'Als Entwurf speichern',
    'wizard.draft': 'Entwurf',
    'wizard.publish': 'Produkt veröffentlichen',
    'wizard.publishShort': 'Veröffentlichen',
    'wizard.publishing': 'Veröffentlichen...',
    'wizard.publishingShort': 'Ver...',
    'wizard.shortcuts.save': 'Entwurf',
    'wizard.shortcuts.next': 'Weiter',
    'wizard.shortcuts.prev': 'Zurück',
    'wizard.seo.faq.description': 'Optimieren Sie Ihr SEO und fügen Sie Antworten auf häufig gestellte Fragen hinzu',
    'wizard.errors.title': 'Fehler',
    'wizard.errors.requiredFields': 'Bitte füllen Sie alle Pflichtfelder aus',
    'wizard.errors.noFiles': 'Bitte fügen Sie einen Hauptlink für Ihr Produkt hinzu',
  },
  pt: {
    'common.welcome': 'Bem-vindo',
    'common.coverage': 'Cobertura',
    'wizard.title': 'Novo Produto Digital',
    'wizard.subtitle': 'Crie um produto digital profissional em 6 etapas',
    'wizard.back': 'Voltar à seleção de tipo',
    'wizard.backShort': 'Voltar',
    'wizard.step': 'Etapa',
    'wizard.of': 'de',
    'wizard.steps': 'Etapas do formulário',
    'wizard.autoSaving': 'Salvando automaticamente...',
    'wizard.previous': 'Etapa anterior',
    'wizard.prev': 'Ant.',
    'wizard.next': 'Próximo',
    'wizard.nextShort': 'Próx.',
    'wizard.saveDraft': 'Salvar como rascunho',
    'wizard.draft': 'Rascunho',
    'wizard.publish': 'Publicar produto',
    'wizard.publishShort': 'Publicar',
    'wizard.publishing': 'Publicando...',
    'wizard.publishingShort': 'Pub...',
    'wizard.shortcuts.save': 'Rascunho',
    'wizard.shortcuts.next': 'Próximo',
    'wizard.shortcuts.prev': 'Anterior',
    'wizard.seo.faq.description': 'Otimize seu SEO e adicione respostas a perguntas frequentes',
    'wizard.errors.title': 'Erro',
    'wizard.errors.requiredFields': 'Por favor, preencha todos os campos obrigatórios',
    'wizard.errors.noFiles': 'Por favor, adicione um link principal para seu produto',
  },
};

function setNestedValue(obj: any, path: string, value: string) {
  const keys = path.split('.');
  let current = obj;
  
  for (let i = 0; i < keys.length - 1; i++) {
    const key = keys[i];
    if (!current[key] || typeof current[key] !== 'object') {
      current[key] = {};
    }
    current = current[key];
  }
  
  current[keys[keys.length - 1]] = value;
}

function addMissingKeys(lang: string, missingKeys: string[]) {
  const filePath = path.join(LOCALES_DIR, `${lang}.json`);
  
  if (!fs.existsSync(filePath)) {
    console.error(`❌ Fichier introuvable: ${filePath}`);
    return;
  }
  
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const data: TranslationData = JSON.parse(content);
    
    let added = 0;
    for (const key of missingKeys) {
      if (translations[lang] && translations[lang][key]) {
        setNestedValue(data, key, translations[lang][key]);
        added++;
      }
    }
    
    // Réécrire le fichier avec indentation
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n', 'utf-8');
    
    console.log(`✅ ${lang.toUpperCase()}: ${added} clé(s) ajoutée(s)`);
  } catch (error: any) {
    console.error(`❌ Erreur pour ${lang}:`, error.message);
  }
}

// Lire le rapport de vérification
const reportPath = path.join(process.cwd(), 'docs/analyses/I18N_KEYS_VERIFICATION_REPORT.json');
if (!fs.existsSync(reportPath)) {
  console.error('❌ Rapport de vérification introuvable. Exécutez d\'abord verify-i18n-keys.ts');
  process.exit(1);
}

const report = JSON.parse(fs.readFileSync(reportPath, 'utf-8'));

console.log('\n=== AJOUT DES CLÉS MANQUANTES ===\n');

// Ajouter les clés manquantes pour chaque langue
for (const langData of report.languages) {
  if (langData.code === 'fr') continue; // FR est la référence
  
  if (langData.missingKeys.length > 0) {
    console.log(`\n📝 Ajout de ${langData.missingKeys.length} clé(s) pour ${langData.code.toUpperCase()}...`);
    addMissingKeys(langData.code, langData.missingKeys);
  } else {
    console.log(`✅ ${langData.code.toUpperCase()}: Aucune clé manquante`);
  }
}

console.log('\n✅ Terminé !\n');

