import type { PageConfig } from './types';
import { publicPagesConfig } from './publicPagesConfig';
import { checkoutPagesConfig } from './checkoutPagesConfig';
import { customerPagesConfig } from './customerPagesConfig';
import { dashboardPagesConfig } from './dashboardPagesConfig';
import { productsPagesConfig } from './productsPagesConfig';

export const PAGES_CONFIG: PageConfig[] = [
  ...publicPagesConfig,
  ...checkoutPagesConfig,
  ...customerPagesConfig,
  ...dashboardPagesConfig,
  ...productsPagesConfig,
];
