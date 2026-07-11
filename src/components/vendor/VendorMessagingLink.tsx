import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { getVendorMessagingPath, resolvePlatformNavTarget } from '@/lib/auth-routes';

interface VendorMessagingLinkProps {
  storeId: string;
  productId?: string | null;
  children: ReactNode;
  className?: string;
  onClick?: () => void;
  'aria-label'?: string;
}

export function VendorMessagingLink({
  storeId,
  productId,
  children,
  className,
  onClick,
  'aria-label': ariaLabel,
}: VendorMessagingLinkProps) {
  const { href, useSpaLink } = resolvePlatformNavTarget(getVendorMessagingPath(storeId, productId));

  if (useSpaLink) {
    return (
      <Link to={href} className={className} onClick={onClick} aria-label={ariaLabel}>
        {children}
      </Link>
    );
  }

  return (
    <a href={href} className={className} onClick={onClick} aria-label={ariaLabel}>
      {children}
    </a>
  );
}
