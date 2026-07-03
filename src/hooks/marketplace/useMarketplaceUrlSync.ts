import { useEffect, useRef, type Dispatch, type SetStateAction } from 'react';
import { useSearchParams, useNavigate, useParams, useLocation } from 'react-router-dom';
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

function filtersEqual(a: FilterState, b: Partial<FilterState>): boolean {
  for (const [key, value] of Object.entries(b)) {
    const k = key as keyof FilterState;
    const left = a[k];
    const right = value;
    if (Array.isArray(left) && Array.isArray(right)) {
      if (left.length !== right.length || left.some((item, index) => item !== right[index])) {
        return false;
      }
      continue;
    }
    if (left !== right) return false;
  }
  return true;
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
  const { categorySlug } = useParams<{ categorySlug?: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const mountedRef = useRef(false);
  const lastWrittenRef = useRef('');
  const lastPathRef = useRef(location.pathname);

  const applyFromUrl = (params: URLSearchParams, currentCategorySlug?: string) => {
    const { filters: urlFilters, search, page } = parseMarketplaceSearchParams(params);

    // Si on est sur une route /marketplace/category/:slug, on surcharge le filtre
    if (currentCategorySlug) {
      urlFilters.category = currentCategorySlug;
    } else if (!urlFilters.category) {
      urlFilters.category = 'all';
    }

    if (Object.keys(urlFilters).length > 0) {
      setFilters(prev => {
        if (filtersEqual(prev, urlFilters)) return prev;
        return { ...prev, ...urlFilters };
      });
    }
    if (search !== searchInput) {
      setSearchInput(search);
    }
    if (page !== pagination.currentPage) {
      goToPage(page);
    }
  };

  useEffect(() => {
    applyFromUrl(searchParams, categorySlug);
    lastWrittenRef.current = searchParams.toString();
    lastPathRef.current = location.pathname;
    mountedRef.current = true;
    // Hydratation initiale uniquement
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!mountedRef.current) return;
    const currentSearch = searchParams.toString();
    const currentPath = location.pathname;

    // Si ni la recherche ni le path n'ont changé, on ignore
    if (currentSearch === lastWrittenRef.current && currentPath === lastPathRef.current) return;

    applyFromUrl(searchParams, categorySlug);
    lastWrittenRef.current = currentSearch;
    lastPathRef.current = currentPath;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, location.pathname, categorySlug]);

  useEffect(() => {
    if (!mountedRef.current) return;

    // Retirer la catégorie des filtres passés à filtersToSearchParams pour ne pas l'avoir dans ?category=...
    // si on l'intègre dans l'URL.
    const filtersForQuery = { ...filters };
    let targetPath = '/marketplace';

    if (filters.category && filters.category !== 'all' && filters.category !== 'featured') {
      targetPath = `/marketplace/category/${filters.category}`;
      delete filtersForQuery.category;
    }

    const nextParams = filtersToSearchParams(
      { ...filtersForQuery, search: debouncedSearch },
      pagination.currentPage,
      debouncedSearch || searchInput
    );

    const nextStr = nextParams.toString();

    if (nextStr === lastWrittenRef.current && targetPath === lastPathRef.current) return;

    lastWrittenRef.current = nextStr;
    lastPathRef.current = targetPath;

    // Au lieu d'utiliser juste setSearchParams, on utilise navigate pour potentiellement changer de route
    navigate(
      {
        pathname: targetPath,
        search: nextStr ? `?${nextStr}` : '',
      },
      { replace: true }
    );
  }, [filters, debouncedSearch, pagination.currentPage, searchInput, navigate]);
}
