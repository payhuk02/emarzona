/**
 * @deprecated Prefer `.page-enter` on `#main-content` (AppPageShell) and
 * `useScrollRestoration` for scroll. This helper remounts children and scrolls
 * `window` (incorrect for shell `overflow-auto` mains).
 */

import React from 'react';

interface PageTransitionProps {
  children: React.ReactNode;
}

/** @deprecated */
export const PageTransition: React.FC<PageTransitionProps> = ({ children }) => {
  return <div className="page-enter">{children}</div>;
};
