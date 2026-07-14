/**
 * État Cmd+K — léger, sans importer la config navigation (chunk CommandPalette différé).
 */

import { useEffect, useState } from 'react';
import { OPEN_COMMAND_PALETTE_EVENT } from '@/lib/vendor-command-palette';

export function useCommandPalette() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setOpen(prev => !prev);
      }
    };

    const handleOpenEvent = () => setOpen(true);

    document.addEventListener('keydown', handleKeyDown);
    window.addEventListener(OPEN_COMMAND_PALETTE_EVENT, handleOpenEvent);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener(OPEN_COMMAND_PALETTE_EVENT, handleOpenEvent);
    };
  }, []);

  return { open, setOpen };
}
