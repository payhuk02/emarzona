import { Link, useLocation } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';
import { ADMIN_NAV_SECTIONS } from '@/lib/admin/admin-nav';

function labelForPath(pathname: string): string {
  if (pathname === '/admin') return "Vue d'ensemble";
  for (const section of ADMIN_NAV_SECTIONS) {
    const item = section.items.find(i => i.path === pathname);
    if (item) return item.label;
  }
  if (pathname === '/admin/advanced-tools') return 'Outils avancés';
  if (pathname === '/admin/recommendation-insights') return 'Recommandations IA';
  if (pathname === '/admin/domains') return 'Domaines & DNS';
  if (pathname === '/admin/feature-flags') return 'Feature flags';
  return pathname.replace('/admin/', '').replace(/-/g, ' ');
}

export function AdminBreadcrumb() {
  const location = useLocation();
  const pathname = location.pathname.replace(/\/+$/, '') || '/admin';

  if (pathname === '/admin') {
    return null;
  }

  const currentLabel = labelForPath(pathname);

  return (
    <nav aria-label="Fil d'Ariane admin" className="mb-4 text-sm text-muted-foreground">
      <ol className="flex flex-wrap items-center gap-1">
        <li>
          <Link
            to="/admin"
            className="inline-flex items-center gap-1 hover:text-foreground transition-colors"
          >
            <Home className="h-3.5 w-3.5" aria-hidden />
            Admin
          </Link>
        </li>
        <li aria-hidden>
          <ChevronRight className="h-3.5 w-3.5" />
        </li>
        <li className="font-medium text-foreground capitalize">{currentLabel}</li>
      </ol>
    </nav>
  );
}
