import { Link } from 'react-router-dom';
import type { ResolvedFooterLink } from '@/hooks/useFooterLinks';

interface FooterLinkItemProps {
  link: ResolvedFooterLink;
  className?: string;
}

export function FooterLinkItem({ link, className }: FooterLinkItemProps) {
  const cls =
    className ??
    'lp-footer-body font-normal text-xs text-white/90 transition-colors hover:text-white sm:text-sm';

  if (link.type === 'route') {
    return (
      <Link to={link.href} className={cls}>
        {link.label}
      </Link>
    );
  }

  if (link.type === 'anchor' && link.href.startsWith('#')) {
    return (
      <a href={link.href} className={cls}>
        {link.label}
      </a>
    );
  }

  return (
    <a
      href={link.href}
      className={cls}
      {...(link.type === 'external' ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
    >
      {link.label}
    </a>
  );
}
