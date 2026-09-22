/**
 * Force Vite/Rollup content hashes to lowercase so Windows builds (case-insensitive FS)
 * cannot emit colliding casings that 404 on Linux/CDN (e.g. C4UQKZLn vs c4uqkzln).
 *
 * Uses closeBundle (filesystem) so Vite's late __vite__mapDeps injection is rewritten too.
 */
import type { Plugin } from 'vite';
import { existsSync, readdirSync, readFileSync, renameSync, statSync, writeFileSync } from 'fs';
import { join, relative } from 'path';

const HASHED_FILE =
  /^(?<dir>(?:.*\/)?)(?<name>[^/]+)-(?<hash>[A-Za-z0-9_-]{6,})(?<ext>\.[A-Za-z0-9]+)$/;

const TEXT_EXTS = new Set(['.js', '.css', '.html', '.json', '.map', '.svg']);

function walkFiles(dir: string, out: string[] = []): string[] {
  if (!existsSync(dir)) return out;
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const st = statSync(full);
    if (st.isDirectory()) walkFiles(full, out);
    else out.push(full);
  }
  return out;
}

function toPosix(p: string): string {
  return p.replace(/\\/g, '/');
}

export function lowercaseHashedAssetNames(): Plugin {
  return {
    name: 'lowercase-hashed-asset-names',
    apply: 'build',
    enforce: 'post',
    closeBundle() {
      const dist = join(process.cwd(), 'dist');
      if (!existsSync(dist)) return;

      const files = walkFiles(dist);
      const renameMap = new Map<string, string>(); // posix relative dist paths

      for (const abs of files) {
        const rel = toPosix(relative(dist, abs));
        const match = HASHED_FILE.exec(rel);
        if (!match?.groups) continue;
        const { dir, name, hash, ext } = match.groups;
        const lowerHash = hash.toLowerCase();
        if (lowerHash === hash) continue;
        const next = `${dir}${name}-${lowerHash}${ext}`;
        if (renameMap.has(rel) || [...renameMap.values()].includes(next)) {
          throw new Error(`Case-colliding build assets: "${rel}" -> "${next}"`);
        }
        renameMap.set(rel, next);
      }

      if (renameMap.size === 0) return;

      // 1) Rewrite file contents (refs) before renaming on disk
      for (const abs of files) {
        const ext = abs.slice(abs.lastIndexOf('.')).toLowerCase();
        if (!TEXT_EXTS.has(ext)) continue;
        let content = readFileSync(abs, 'utf8');
        let changed = false;
        for (const [from, to] of renameMap) {
          const fromBase = from.slice(from.lastIndexOf('/') + 1);
          const toBase = to.slice(to.lastIndexOf('/') + 1);
          if (content.includes(from)) {
            content = content.split(from).join(to);
            changed = true;
          }
          if (fromBase !== toBase && content.includes(fromBase)) {
            content = content.split(fromBase).join(toBase);
            changed = true;
          }
        }
        if (changed) writeFileSync(abs, content);
      }

      // 2) Rename files — on case-insensitive FS (Windows) use a temp hop
      for (const [from, to] of renameMap) {
        const fromAbs = join(dist, from);
        const toAbs = join(dist, to);
        if (!existsSync(fromAbs)) continue;

        const sameInode =
          fromAbs.replace(/\\/g, '/').toLowerCase() === toAbs.replace(/\\/g, '/').toLowerCase();

        if (!sameInode && existsSync(toAbs)) {
          throw new Error(`Cannot rename "${from}" -> "${to}": target exists`);
        }

        if (sameInode && from !== to) {
          const tmpAbs = `${fromAbs}.__lower_tmp__`;
          renameSync(fromAbs, tmpAbs);
          renameSync(tmpAbs, toAbs);
        } else if (from !== to) {
          renameSync(fromAbs, toAbs);
        }
      }
    },
  };
}
