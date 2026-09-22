/**
 * SoftLink / SoftNavLink — Link RR + prefetch chunk au hover/focus.
 * Normalise les URLs absolues same-origin en chemins relatifs (évite hard nav).
 */

import { forwardRef, useCallback, type MouseEvent, type FocusEvent, type ReactNode } from 'react';
import { Link, NavLink, type LinkProps, type NavLinkProps, type To } from 'react-router-dom';
import { prefetchRouteChunk } from '@/lib/route-chunk-prefetch';
import { toSoftNavTarget, isAbsoluteHttpUrl } from '@/lib/navigation/soft-navigate';

/** Props RR à ne pas passer sur un <a> hard-nav cross-origin. */
const RR_ONLY_KEYS = new Set([
  'reloadDocument',
  'replace',
  'state',
  'preventScrollReset',
  'relative',
  'viewTransition',
  'caseSensitive',
  'end',
]);

function resolvePrefetchPath(to: To): string | null {
  if (typeof to === 'string') {
    const soft = toSoftNavTarget(to);
    if (isAbsoluteHttpUrl(soft)) return null;
    try {
      return soft.split('?')[0]?.split('#')[0] || soft;
    } catch {
      return soft;
    }
  }
  if (to && typeof to === 'object' && 'pathname' in to && to.pathname) {
    return to.pathname;
  }
  return null;
}

function resolveLinkTo(to: To): To {
  if (typeof to === 'string') {
    return toSoftNavTarget(to);
  }
  return to;
}

function stripRouterOnlyProps(props: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(props)) {
    if (RR_ONLY_KEYS.has(key)) continue;
    if (key === 'className' && typeof value === 'function') continue;
    out[key] = value;
  }
  return out;
}

function usePrefetchHandlers(
  to: To,
  onMouseEnter?: (e: MouseEvent<HTMLAnchorElement>) => void,
  onFocus?: (e: FocusEvent<HTMLAnchorElement>) => void
) {
  const prefetch = useCallback(() => {
    const path = resolvePrefetchPath(to);
    if (path) prefetchRouteChunk(path);
  }, [to]);

  const handleMouseEnter = useCallback(
    (e: MouseEvent<HTMLAnchorElement>) => {
      prefetch();
      onMouseEnter?.(e);
    },
    [prefetch, onMouseEnter]
  );

  const handleFocus = useCallback(
    (e: FocusEvent<HTMLAnchorElement>) => {
      prefetch();
      onFocus?.(e);
    },
    [prefetch, onFocus]
  );

  return { handleMouseEnter, handleFocus, resolvedTo: resolveLinkTo(to) };
}

export const SoftLink = forwardRef<HTMLAnchorElement, LinkProps>(function SoftLink(
  { to, onMouseEnter, onFocus, ...props },
  ref
) {
  const { handleMouseEnter, handleFocus, resolvedTo } = usePrefetchHandlers(
    to,
    onMouseEnter,
    onFocus
  );

  if (typeof resolvedTo === 'string' && isAbsoluteHttpUrl(resolvedTo)) {
    const anchorProps = stripRouterOnlyProps(props as Record<string, unknown>);
    return (
      <a
        ref={ref}
        href={resolvedTo}
        onMouseEnter={handleMouseEnter}
        onFocus={handleFocus}
        {...anchorProps}
      />
    );
  }

  return (
    <Link
      ref={ref}
      to={resolvedTo}
      onMouseEnter={handleMouseEnter}
      onFocus={handleFocus}
      {...props}
    />
  );
});

export const SoftNavLink = forwardRef<HTMLAnchorElement, NavLinkProps>(function SoftNavLink(
  { to, onMouseEnter, onFocus, ...props },
  ref
) {
  const { handleMouseEnter, handleFocus, resolvedTo } = usePrefetchHandlers(
    to,
    onMouseEnter,
    onFocus
  );

  if (typeof resolvedTo === 'string' && isAbsoluteHttpUrl(resolvedTo)) {
    const { className, children, ...rest } = props;
    const anchorProps = stripRouterOnlyProps(rest as Record<string, unknown>);
    return (
      <a
        ref={ref}
        href={resolvedTo}
        onMouseEnter={handleMouseEnter}
        onFocus={handleFocus}
        className={typeof className === 'string' ? className : undefined}
        {...anchorProps}
      >
        {children as ReactNode}
      </a>
    );
  }

  return (
    <NavLink
      ref={ref}
      to={resolvedTo}
      onMouseEnter={handleMouseEnter}
      onFocus={handleFocus}
      {...props}
    />
  );
});

SoftLink.displayName = 'SoftLink';
SoftNavLink.displayName = 'SoftNavLink';
