/**
 * Code Suggestions Utilities
 * Date: 30 Janvier 2025
 * 
 * Utilitaires pour générer des suggestions de codes promo
 */

/**
 * Génère des suggestions de codes promo basées sur différents patterns
 */
export const generateCodeSuggestions = (count: number = 3): string[] => {
  const  suggestions: string[] = [];
  const year = new Date().getFullYear();
  const month = String(new Date().getMonth() + 1).padStart(2, '0');
  const day = String(new Date().getDate()).padStart(2, '0');
  
  // Pattern 1: PROMO + Année
  suggestions.push(`PROMO${year}`);
  
  // Pattern 2: SALE + Année
  suggestions.push(`SALE${year}`);
  
  // Pattern 3: DISCOUNT + Mois + Année
  suggestions.push(`DISCOUNT${month}${year}`);
  
  // Pattern 4: OFF + Jour + Mois
  if (suggestions.length < count) {
    suggestions.push(`OFF${day}${month}`);
  }
  
  // Pattern 5: Code aléatoire
  if (suggestions.length < count) {
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    suggestions.push(`CODE${random}`);
  }
  
  // Pattern 6: WEEKEND + Année
  if (suggestions.length < count) {
    suggestions.push(`WEEKEND${year}`);
  }
  
  return suggestions.slice(0, count);
};

/**
 * Génère un code promo unique basé sur un pattern
 */
export const generateUniqueCode = (pattern: string = 'PROMO'): string => {
  const year = new Date().getFullYear();
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `${pattern}${year}${random}`;
};







