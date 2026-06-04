import { Link } from 'react-router-dom';
import type { ResolvedStoreFooterLink } from '@/lib/admin/storeFooterLinksConfig';

interface StoreFooterLinkItemProps {
  link: ResolvedStoreFooterLink;
  linkColor: string;
  linkHoverColor: string;
  className?: string;
}

export function StoreFooterLinkItem({
  link,
  linkColor,
  linkHoverColor,
  className,
}: StoreFooterLinkItemProps) {
  const cls =
    className ??
    'hover:opacity-80 transition-colors touch-manipulation block py-1 text-xs sm:text-sm';

  const styleProps = {
    style: { color: linkColor },
    onMouseEnter: (e: React.MouseEvent<HTMLElement>) => {
      e.currentTarget.style.color = linkHoverColor;
    },
    onMouseLeave: (e: React.MouseEvent<HTMLElement>) => {
      e.currentTarget.style.color = linkColor;
    },
  };

  if (link.type === 'route' && link.href.startsWith('/')) {
    return (
      <Link to={link.href} className={cls} {...styleProps}>
        {link.label}
      </Link>
    );
  }

  if (link.type === 'anchor' || link.href.startsWith('#')) {
    return (
      <a href={link.href} className={cls} {...styleProps}>
        {link.label}
      </a>
    );
  }

  return (
    <a
      href={link.href}
      className={cls}
      {...styleProps}
      {...(link.type === 'external' ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
    >
      {link.label}
    </a>
  );
}
