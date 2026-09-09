/**
 * PageTransition — fade d’entrée non bloquant (le contenu est rendu immédiatement).
 * Préférer le fade CSS `.page-enter` sur `#main-content` via AppPageShell.
 */

import { ReactNode, useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';

interface PageTransitionProps {
  children: ReactNode;
}

export const PageTransition = ({ children }: PageTransitionProps) => {
  const location = useLocation();
  const [enterKey, setEnterKey] = useState(0);

  useEffect(() => {
    setEnterKey(k => k + 1);
  }, [location.pathname]);

  return (
    <div key={enterKey} className="page-enter">
      {children}
    </div>
  );
};
