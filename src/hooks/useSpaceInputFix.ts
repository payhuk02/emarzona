/**
 * Hook pour corriger le problème d'espacement dans les champs de texte
 * Force l'insertion manuelle de l'espace quand la barre d'espace est pressée
 */
import { useRef } from 'react';

export const useSpaceInputFix = () => {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (e.key === ' ') {
      const target = e.target as HTMLInputElement | HTMLTextAreaElement;
      const currentValue = target.value;
      const selectionStart = target.selectionStart || 0;
      const selectionEnd = target.selectionEnd || 0;
      
      // Forcer l'insertion de l'espace manuellement
      const newValue = 
        currentValue.substring(0, selectionStart) + 
        ' ' + 
        currentValue.substring(selectionEnd);
      
      // Mettre à jour la valeur directement
      target.value = newValue;
      
      // Déplacer le curseur après l'espace inséré
      target.setSelectionRange(selectionStart + 1, selectionStart + 1);
      
      // Déclencher onChange manuellement pour React
      const changeEvent = new Event('input', { bubbles: true });
      target.dispatchEvent(changeEvent);
      
      // Empêcher le comportement par défaut pour éviter le double espace
      e.preventDefault();
    }
  };

  return { handleKeyDown };
};


