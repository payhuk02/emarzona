/**
 * Utilitaire pour highlight les termes recherchés dans un texte
 * Date: 1 Février 2025
 * 
 * NOTE: Ce fichier a été renommé de .ts à .tsx pour supporter JSX
 */

import React from 'react';

/**
 * Highlight les termes recherchés dans un texte
 * 
 * @param text - Le texte à highlight
 * @param query - La requête de recherche
 * @returns Un tableau de fragments (string ou JSX.Element)
 * 
 * @example
 * highlightText("Bonjour le monde", "monde")
 * // Retourne: ["Bonjour le ", <mark>monde</mark>]
 */
export function highlightText(text: string, query: string): Array<string | React.ReactElement> {
  if (!query.trim() || !text) {
    return [text];
  }

  const  parts: Array<string | React.ReactElement> = [];
  const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
  let  lastIndex= 0;
  let  _match;
  let  keyCounter= 0;

  while ((match = regex.exec(text)) !== null) {
    // Ajouter le texte avant le match
    if (match.index > lastIndex) {
      parts.push(text.substring(lastIndex, match.index));
    }

    // Ajouter le texte highlighté
    parts.push(
      React.createElement(
        'mark',
        {
          key: `highlight-${keyCounter++}`,
          className: 'bg-yellow-200 dark:bg-yellow-900 px-1 rounded',
        },
        match[0]
      )
    );

    lastIndex = regex.lastIndex;
  }

  // Ajouter le texte restant
  if (lastIndex < text.length) {
    parts.push(text.substring(lastIndex));
  }

  return parts.length > 0 ? parts : [text];
}

/**
 * Highlight les termes recherchés dans un texte (version simple string)
 * 
 * @param text - Le texte à highlight
 * @param query - La requête de recherche
 * @returns Le texte avec les balises HTML <mark>
 */
export function highlightTextHTML(text: string, query: string): string {
  if (!query.trim() || !text) {
    return text;
  }

  const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`(${escapedQuery})`, 'gi');
  
  return text.replace(regex, '<mark class="bg-yellow-200 dark:bg-yellow-900 px-1 rounded">$1</mark>');
}







