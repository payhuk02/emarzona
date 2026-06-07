/** Match exact pathname (optional ?query on item url). Avoids parent/child highlight collisions. */
export const isNavItemActive = (itemUrl: string, pathname: string, search: string): boolean => {
  const [itemPath, itemQuery = ''] = itemUrl.split('?');
  if (pathname !== itemPath) return false;
  if (!itemQuery) return true;
  const normalizedSearch = search.startsWith('?') ? search.slice(1) : search;
  return normalizedSearch === itemQuery;
};

export const parseNavTo = (url: string): string | { pathname: string; search: string } => {
  const [pathname, query = ''] = url.split('?');
  return query ? { pathname, search: `?${query}` } : url;
};

export const getNavItemPath = (url: string) => url.split('?')[0];
