/** Settings route that opens the store creation flow (wizard tab). */
export const STORE_CREATE_PATH = '/dashboard/settings?tab=store&action=create' as const;

/** Opens advanced 8-step wizard from settings. */
export const STORE_CREATE_ADVANCED_PATH =
  '/dashboard/settings?tab=store&action=create&mode=advanced' as const;
