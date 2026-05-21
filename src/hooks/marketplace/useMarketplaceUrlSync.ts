import { useEffect, useRef, type Dispatch, type SetStateAction } from 'react';
import { useSearchParams } from 'react-router-dom';
import { FilterState, PaginationState } from '@/types/marketplace';
import { filtersToSearchParams, parseMarketplaceSearchParams } from '@/lib/marketplace-url-filters';

interface UseMarketplaceUrlSyncOptions {
  filters: FilterState;
  setFilters: Dispatch<SetStateAction<FilterState>>;
  searchInput: string;
  setSearchInput: (value: string) => void;
  pagination: PaginationState;
  goToPage: (page: number) => void;
  debouncedSearch: string;
}

/**
 * Synchronise filtres marketplace ↔ URL (partage, retour navigateur, SEO long-tail).
 */
export function useMarketplaceUrlSync({
  filters,
  setFilters,
  searchInput,
  setSearchInput,
  pagination,
  goToPage,
  debouncedSearch,
}: UseMarketplaceUrlSyncOptions) {
  const [searchParams, setSearchParams] = useSearchParams();
  const mountedRef = useRef(false);
  const lastWrittenRef = useRef('');

  const applyFromUrl = (params: URLSearchParams) => {
    const { filters: urlFilters, search, page } = parseMarketplaceSearchParams(params);
    if (Object.keys(urlFilters).length > 0) {
      setFilters(prev => ({ ...prev, ...urlFilters }));
    }
    setSearchInput(search);
    if (page !== pagination.currentPage) {
      goToPage(page);
    }
  };

  useEffect(() => {
    applyFromUrl(searchParams);
    lastWrittenRef.current = searchParams.toString();
    mountedRef.current = true;
    // Hydratation initiale uniquement
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!mountedRef.current) return;
    const current = searchParams.toString();
    if (current === lastWrittenRef.current) return;
    applyFromUrl(searchParams);
    lastWrittenRef.current = current;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  useEffect(() => {
    if (!mountedRef.current) return;

    const nextParams = filtersToSearchParams(
      { ...filters, search: debouncedSearch },
      pagination.currentPage,
      debouncedSearch || searchInput
    );
    const nextStr = nextParams.toString();
    if (nextStr === lastWrittenRef.current) return;

    lastWrittenRef.current = nextStr;
    setSearchParams(nextParams, { replace: true });
  }, [filters, debouncedSearch, pagination.currentPage, searchInput, setSearchParams]);
}
