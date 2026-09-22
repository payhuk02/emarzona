/**
 * Force Vite/Rollup content hashes to lowercase so Windows builds (case-insensitive FS)
 * cannot emit colliding casings that 404 on Linux/CDN (e.g. DgOUHq0B vs DgoUHq0B).
 */
import type { Plugin } from 'vite';

const HASHED_FILE =
  /^(?<dir>(?:.*\/)?)(?<name>[^/]+)-(?<hash>[A-Za-z0-9_-]{6,})(?<ext>\.[A-Za-z0-9]+)$/;

export function lowercaseHashedAssetNames(): Plugin {
  return {
    name: 'lowercase-hashed-asset-names',
    apply: 'build',
    enforce: 'post',
    generateBundle(_options, bundle) {
      const renameMap = new Map<string, string>();

      for (const fileName of Object.keys(bundle)) {
        const match = HASHED_FILE.exec(fileName);
        if (!match?.groups) continue;
        const { dir, name, hash, ext } = match.groups;
        const lowerHash = hash.toLowerCase();
        if (lowerHash === hash) continue;
        renameMap.set(fileName, `${dir}${name}-${lowerHash}${ext}`);
      }

      if (renameMap.size === 0) return;

      for (const [oldName, newName] of renameMap) {
        if (bundle[newName] && !renameMap.has(newName)) {
          this.error(
            `Case-colliding build assets: "${oldName}" and existing "${newName}" — rebuild required.`
          );
        }
        const entry = bundle[oldName];
        if (!entry) continue;
        entry.fileName = newName;
        delete bundle[oldName];
        bundle[newName] = entry;
      }

      for (const entry of Object.values(bundle)) {
        for (const [oldName, newName] of renameMap) {
          const oldBase = oldName.slice(oldName.lastIndexOf('/') + 1);
          const newBase = newName.slice(newName.lastIndexOf('/') + 1);
          if (oldBase === newBase) continue;

          if (entry.type === 'chunk' && typeof entry.code === 'string') {
            entry.code = entry.code.split(oldBase).join(newBase);
          }
          if (entry.type === 'asset' && typeof entry.source === 'string') {
            entry.source = entry.source.split(oldBase).join(newBase);
          }
        }
      }
    },
  };
}
