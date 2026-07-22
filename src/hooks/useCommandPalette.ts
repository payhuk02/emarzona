/**
 * État Cmd+K — léger.
 * Le raccourci clavier est géré uniquement par SidebarNavCommandPalette (capture).
 * Ce hook sert aux surfaces qui ouvrent la palette via event / état local.
 */

import { useEffect, useState } from 'react';
import { OPEN_COMMAND_PALETTE_EVENT } from '@/lib/vendor-command-palette';

export function useCommandPalette() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const handleOpenEvent = () => setOpen(true);
    window.addEventListener(OPEN_COMMAND_PALETTE_EVENT, handleOpenEvent);
    return () => {
      window.removeEventListener(OPEN_COMMAND_PALETTE_EVENT, handleOpenEvent);
    };
  }, []);

  return { open, setOpen };
}
