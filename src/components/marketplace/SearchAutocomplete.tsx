/**
 * Composant : SearchAutocomplete
 * Barre de recherche avancée avec auto-complétion
 * Date : 31 Janvier 2025
 */

import React, { useState, useRef, useEffect } from 'react';
import { Search, X, Clock, TrendingUp, Tag, Package, Loader2, ArrowRight } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  useSearchSuggestions,
  usePopularSearches,
  useSearchHistory,
  useSaveSearchHistory,
} from '@/hooks/useProductSearch';
import { cn } from '@/lib/utils';
import { useDebounce } from '@/hooks/useDebounce';
import { Link } from 'react-router-dom';
import { useIsMobile } from '@/hooks/use-mobile';
import { useMobileKeyboard } from '@/hooks/use-mobile-keyboard';

interface SearchAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  onSearch?: (query: string) => void;
  placeholder?: string;
  className?: string;
  showSuggestions?: boolean;
  autoFocus?: boolean;
}

export const SearchAutocomplete: React.FC<SearchAutocompleteProps> = ({
  value,
  onChange,
  onSearch,
  placeholder = 'Rechercher des produits...',
  className = '',
  showSuggestions = true,
  autoFocus = false,
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const debouncedQuery = useDebounce(value, 300);
  const isMobile = useIsMobile();
  const { isKeyboardOpen, keyboardHeight } = useMobileKeyboard();

  // Hooks pour suggestions et historique
  const { data: suggestions, isLoading: suggestionsLoading } = useSearchSuggestions(
    debouncedQuery,
    8,
    showSuggestions && isFocused && debouncedQuery.length >= 2
  );

  const { data: popularSearches } = usePopularSearches(5, 30);
  const { data: searchHistory } = useSearchHistory(5);
  const saveSearchHistory = useSaveSearchHistory();

  // Gérer le clic en dehors pour fermer le dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Afficher le dropdown quand focused ou quand il y a des suggestions
  useEffect(() => {
    if (isFocused && ((suggestions && suggestions.length > 0) || !debouncedQuery)) {
      setShowDropdown(true);
    }
  }, [isFocused, suggestions, debouncedQuery]);

  const handleSearch = (query: string) => {
    if (query.trim()) {
      saveSearchHistory(query.trim(), 0);
      onSearch?.(query.trim());
      setShowDropdown(false);
      inputRef.current?.blur();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && value.trim()) {
      handleSearch(value);
    } else if (e.key === 'Escape') {
      setShowDropdown(false);
      inputRef.current?.blur();
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    onChange(suggestion);
    handleSearch(suggestion);
  };

  const clearSearch = () => {
    onChange('');
    inputRef.current?.focus();
  };

  const shouldShowDropdown = showDropdown && isFocused && showSuggestions;
  const showPopularSearches = !debouncedQuery && popularSearches && popularSearches.length > 0;
  const showHistory = !debouncedQuery && searchHistory && searchHistory.length > 0;

  return (
    <div className={cn('relative w-full', className)}>
      {/* Input de recherche */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground h-5 w-5" />
        <Input
          ref={inputRef}
          type="search"
          value={value}
          onChange={e => onChange(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => {
            // Délai réduit sur mobile pour une meilleure réactivité
            setTimeout(() => setIsFocused(false), isMobile ? 150 : 200);
          }}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className={cn('pl-12 pr-12 min-h-[44px]', isFocused && 'ring-2 ring-primary')}
          autoFocus={autoFocus}
        />
        {value && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-2 top-1/2 transform -translate-y-1/2 min-h-[44px] min-w-[44px] h-11 w-11"
            onClick={clearSearch}
            aria-label="Effacer la recherche"
          >
            <X className="h-4 w-4 sm:h-5 sm:w-5" />
          </Button>
        )}
      </div>

      {/* Dropdown suggestions */}
      {shouldShowDropdown && (
        <div
          ref={dropdownRef}
          className={cn(
            'absolute z-[1060] w-full mt-2 bg-popover border rounded-lg shadow-lg overflow-y-auto',
            // Hauteur adaptative sur mobile
            isMobile ? 'max-h-[min(24rem,calc(80vh-8rem))]' : 'max-h-96',
            // Scroll optimisé pour mobile
            isMobile && 'overscroll-contain touch-pan-y [-webkit-overflow-scrolling:touch]'
          )}
          style={{
            // Ajuster le positionnement si le clavier est ouvert
            ...(isMobile &&
              isKeyboardOpen &&
              keyboardHeight > 0 && {
                marginBottom: `${keyboardHeight}px`,
                maxHeight: `calc(80vh - ${keyboardHeight}px - 8rem)`,
              }),
          }}
        >
          {/* Suggestions de recherche */}
          {debouncedQuery.length >= 2 && (
            <div className="p-2">
              {suggestionsLoading ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                  <span className="ml-2 text-sm text-muted-foreground">Recherche...</span>
                </div>
              ) : suggestions && suggestions.length > 0 ? (
                <div className="space-y-1">
                  <div className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase">
                    Suggestions
                  </div>
                  {suggestions.map((suggestion, index) => (
                    <button
                      key={index}
                      onClick={() => handleSuggestionClick(suggestion.suggestion)}
                      className="w-full flex items-center gap-3 px-3 py-3 min-h-[44px] rounded-md hover:bg-muted active:bg-muted transition-colors text-left touch-manipulation"
                      onPointerDown={e => {
                        // Empêcher la propagation qui pourrait fermer le dropdown
                        e.stopPropagation();
                      }}
                    >
                      {suggestion.suggestion_type === 'product' && (
                        <Package className="h-4 w-4 text-muted-foreground" />
                      )}
                      {suggestion.suggestion_type === 'category' && (
                        <Tag className="h-4 w-4 text-muted-foreground" />
                      )}
                      {suggestion.suggestion_type === 'tag' && (
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                      )}
                      <span className="flex-1 font-medium">{suggestion.suggestion}</span>
                      <Badge variant="secondary" className="text-xs">
                        {suggestion.count}
                      </Badge>
                    </button>
                  ))}
                  <button
                    onClick={() => handleSearch(debouncedQuery)}
                    className="w-full flex items-center justify-center gap-2 px-3 py-3 min-h-[44px] mt-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                  >
                    <span>Rechercher "{debouncedQuery}"</span>
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                debouncedQuery.length >= 2 && (
                  <div className="px-3 py-4 text-center text-sm text-muted-foreground">
                    Aucune suggestion trouvée
                  </div>
                )
              )}
            </div>
          )}

          {/* Historique de recherche */}
          {showHistory && (
            <div className="border-t p-2">
              <div className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase">
                Recherches récentes
              </div>
              <div className="space-y-1">
                {searchHistory.map(item => (
                  <button
                    key={item.id}
                    onClick={() => handleSuggestionClick(item.query)}
                    className="w-full flex items-center gap-3 px-3 py-2.5 min-h-[44px] rounded-md hover:bg-muted active:bg-muted transition-colors text-left touch-manipulation"
                    onPointerDown={e => {
                      e.stopPropagation();
                    }}
                  >
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="flex-1">{item.query}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Recherches populaires */}
          {showPopularSearches && (
            <div className="border-t p-2">
              <div className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase">
                Recherches populaires
              </div>
              <div className="space-y-1">
                {popularSearches.map((item, index) => (
                  <button
                    key={index}
                    onClick={() => handleSuggestionClick(item.query)}
                    className="w-full flex items-center gap-3 px-3 py-2.5 min-h-[44px] rounded-md hover:bg-muted active:bg-muted transition-colors text-left touch-manipulation"
                    onPointerDown={e => {
                      e.stopPropagation();
                    }}
                  >
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    <span className="flex-1">{item.query}</span>
                    <Badge variant="secondary" className="text-xs">
                      {item.count}
                    </Badge>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
