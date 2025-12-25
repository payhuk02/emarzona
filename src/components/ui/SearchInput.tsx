/**
 * SearchInput Component
 * Date: 28 Janvier 2025
 * 
 * Composant d'input de recherche avec debouncing intégré et indicateur visuel
 * Améliore l'UX et réduit les appels API
 */

import { Input } from '@/components/ui/input';
import { Loader2, Search, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useDebouncedSearch } from '@/hooks/useDebouncedSearch';
import { cn } from '@/lib/utils';

interface SearchInputProps {
  /**
   * Valeur initiale
   */
  value?: string;
  /**
   * Callback appelé quand la recherche change (après debounce)
   */
  onSearchChange?: (value: string) => void;
  /**
   * Placeholder
   */
  placeholder?: string;
  /**
   * Délai de debounce en millisecondes
   */
  debounceMs?: number;
  /**
   * Minimum de caractères avant de déclencher la recherche
   */
  minLength?: number;
  /**
   * Afficher le bouton de réinitialisation
   */
  showClearButton?: boolean;
  /**
   * Afficher l'icône de recherche
   */
  showSearchIcon?: boolean;
  /**
   * Classe CSS personnalisée
   */
  className?: string;
  /**
   * ID pour l'accessibilité
   */
  id?: string;
  /**
   * Label pour l'accessibilité
   */
  'aria-label'?: string;
  /**
   * Désactiver l'input
   */
  disabled?: boolean;
}

export const SearchInput = ({
  value: controlledValue,
  onSearchChange,
  placeholder = 'Rechercher...',
  debounceMs = 500,
  minLength = 0,
  showClearButton = true,
  showSearchIcon = true,
  className,
  id,
  'aria-label': ariaLabel,
  disabled = false,
}: SearchInputProps) => {
  const {
    inputValue,
    debouncedValue,
    isSearching,
    setInputValue,
    reset,
    isValid,
  } = useDebouncedSearch({
    debounceMs,
    initialValue: controlledValue || '',
    onSearchChange,
    minLength,
  });

  // Synchroniser avec la valeur contrôlée si fournie
  const displayValue = controlledValue !== undefined ? controlledValue : inputValue;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    if (controlledValue === undefined) {
      setInputValue(newValue);
    } else {
      // Si contrôlé, appeler directement le callback
      onSearchChange?.(newValue);
    }
  };

  const handleClear = () => {
    if (controlledValue === undefined) {
      reset();
    } else {
      onSearchChange?.('');
    }
  };

  const hasValue = displayValue.length > 0;

  return (
    <div className={cn('relative', className)}>
      {showSearchIcon && (
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
      )}
      
      <Input
        id={id}
        type="search"
        value={displayValue}
        onChange={handleChange}
        placeholder={placeholder}
        disabled={disabled}
        aria-label={ariaLabel || placeholder}
        aria-busy={isSearching}
        className={cn(
          showSearchIcon && 'pl-10',
          (showClearButton && hasValue) && 'pr-20',
          isSearching && 'pr-20'
        )}
      />

      <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
        {isSearching && (
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        )}
        
        {showClearButton && hasValue && !isSearching && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={handleClear}
            aria-label="Effacer la recherche"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {!isValid && debouncedValue.length > 0 && minLength > 0 && (
        <p className="absolute -bottom-5 left-0 text-xs text-muted-foreground">
          Minimum {minLength} caractère{minLength > 1 ? 's' : ''} requis
        </p>
      )}
    </div>
  );
};

