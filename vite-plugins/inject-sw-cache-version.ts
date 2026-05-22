/**
 * Injecte un identifiant de build dans dist/sw.js pour invalider les caches PWA à chaque déploiement.
 */
import type { Plugin } from 'vite';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';

const PLACEHOLDER = '__EMARZONA_BUILD_ID__';

export function injectSwCacheVersion(buildId: string): Plugin {
  return {
    name: 'inject-sw-cache-version',
    apply: 'build',
    closeBundle() {
      const swPath = join(process.cwd(), 'dist', 'sw.js');
      if (!existsSync(swPath)) return;

      const safeId = buildId.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 40) || Date.now().toString(36);
      let content = readFileSync(swPath, 'utf-8');

      if (content.includes(PLACEHOLDER)) {
        content = content.replaceAll(PLACEHOLDER, safeId);
      } else {
        content = content.replace(
          /const CACHE_VERSION = ['"][^'"]*['"]/,
          `const CACHE_VERSION = '${safeId}'`
        );
      }

      writeFileSync(swPath, content);
    },
  };
}
