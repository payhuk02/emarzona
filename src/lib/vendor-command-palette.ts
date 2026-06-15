export const OPEN_COMMAND_PALETTE_EVENT = 'emarzona:open-command-palette';

export function dispatchOpenCommandPalette(): void {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(OPEN_COMMAND_PALETTE_EVENT));
  }
}
