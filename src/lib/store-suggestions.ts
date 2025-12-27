/**
 * Système de suggestions automatiques pour les boutiques
 */

import { generateSlug } from './store-utils';

/**
 * Suggère des alternatives de slug si le slug initial n'est pas disponible
 */
export function suggestSlugAlternatives(baseSlug: string, maxSuggestions: number = 5): string[] {
  const  suggestions: string[] = [];
  const cleanSlug = generateSlug(baseSlug);

  // Suggestions basées sur des variations
  const variations = [
    `${cleanSlug}-shop`,
    `${cleanSlug}-store`,
    `${cleanSlug}-boutique`,
    `my-${cleanSlug}`,
    `the-${cleanSlug}`,
    `${cleanSlug}${Math.floor(Math.random() * 1000)}`,
    `${cleanSlug}-${new Date().getFullYear()}`,
  ];

  for (let  i= 0; i < Math.min(maxSuggestions, variations.length); i++) {
    suggestions.push(variations[i]);
  }

  return suggestions;
}

/**
 * Suggère un meta titre optimisé basé sur le nom et la description
 */
export function suggestMetaTitle(name: string, description?: string): string {
  const baseTitle = name.trim();
  const maxLength = 60;

  if (baseTitle.length <= maxLength) {
    return baseTitle;
  }

  // Tronquer intelligemment
  if (description) {
    const words = description.split(' ').slice(0, 5).join(' ');
    const suggested = `${baseTitle} - ${words}`.substring(0, maxLength);
    return suggested.substring(0, suggested.lastIndexOf(' '));
  }

  return baseTitle.substring(0, maxLength - 3) + '...';
}

/**
 * Suggère une meta description optimisée
 */
export function suggestMetaDescription(name: string, description?: string): string {
  const maxLength = 160;

  if (description && description.length <= maxLength) {
    return description;
  }

  const baseDescription = description || '';
  const suggested = `Découvrez ${name}. ${baseDescription}`.trim();

  if (suggested.length <= maxLength) {
    return suggested;
  }

  // Tronquer intelligemment à la dernière phrase complète
  const truncated = suggested.substring(0, maxLength - 3);
  const lastPeriod = truncated.lastIndexOf('.');
  const lastSpace = truncated.lastIndexOf(' ');

  if (lastPeriod > maxLength * 0.7) {
    return truncated.substring(0, lastPeriod + 1);
  }

  if (lastSpace > maxLength * 0.7) {
    return truncated.substring(0, lastSpace) + '...';
  }

  return truncated + '...';
}

/**
 * Suggère des couleurs basées sur une couleur de base
 */
export function suggestColorPalette(baseColor: string): {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  text: string;
} {
  // Couleurs par défaut professionnelles
  const palettes = {
    blue: {
      primary: '#3b82f6',
      secondary: '#8b5cf6',
      accent: '#f59e0b',
      background: '#ffffff',
      text: '#1f2937',
    },
    purple: {
      primary: '#8b5cf6',
      secondary: '#ec4899',
      accent: '#f59e0b',
      background: '#ffffff',
      text: '#1f2937',
    },
    green: {
      primary: '#10b981',
      secondary: '#3b82f6',
      accent: '#f59e0b',
      background: '#ffffff',
      text: '#1f2937',
    },
    orange: {
      primary: '#f59e0b',
      secondary: '#ef4444',
      accent: '#8b5cf6',
      background: '#ffffff',
      text: '#1f2937',
    },
  };

  // Détecter la couleur dominante (simple)
  const color = baseColor.toLowerCase();
  if (color.includes('blue') || color.includes('#3b82f6') || color.includes('#2563eb')) {
    return palettes.blue;
  }
  if (color.includes('purple') || color.includes('#8b5cf6') || color.includes('#7c3aed')) {
    return palettes.purple;
  }
  if (color.includes('green') || color.includes('#10b981') || color.includes('#059669')) {
    return palettes.green;
  }
  if (color.includes('orange') || color.includes('#f59e0b') || color.includes('#d97706')) {
    return palettes.orange;
  }

  return palettes.blue; // Par défaut
}

/**
 * Suggère un nom de domaine personnalisé basé sur le slug
 */
export function suggestCustomDomain(slug: string): string[] {
  const  suggestions: string[] = [];

  suggestions.push(`${slug}.com`);
  suggestions.push(`${slug}.shop`);
  suggestions.push(`${slug}.store`);
  suggestions.push(`www.${slug}.com`);

  // Ajouter des extensions par région
  if (slug.includes('africa') || slug.includes('afrique')) {
    suggestions.push(`${slug}.africa`);
  }

  return suggestions;
}

/**
 * Suggère des mots-clés SEO basés sur le nom et la description
 */
export function suggestKeywords(name: string, description?: string): string[] {
  const  keywords: Set<string> = new Set();

  // Extraire les mots importants du nom
  const nameWords = name
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(' ')
    .filter(word => word.length > 3);

  nameWords.forEach(word => keywords.add(word));

  // Extraire les mots importants de la description
  if (description) {
    const descWords = description
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(' ')
      .filter(word => word.length > 4)
      .slice(0, 10);

    descWords.forEach(word => keywords.add(word));
  }

  // Ajouter des mots-clés génériques
  keywords.add('boutique');
  keywords.add('en ligne');
  keywords.add('ecommerce');

  return Array.from(keywords).slice(0, 10);
}






