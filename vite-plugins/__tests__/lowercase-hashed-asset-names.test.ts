import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdirSync, writeFileSync, readFileSync, rmSync, readdirSync } from 'fs';
import { join } from 'path';
import { lowercaseHashedAssetNames } from '../lowercase-hashed-asset-names';

const TMP = join(process.cwd(), 'tmp-lowercase-hash-test');

describe('lowercaseHashedAssetNames closeBundle', () => {
  beforeEach(() => {
    rmSync(TMP, { recursive: true, force: true });
  });

  afterEach(() => {
    rmSync(TMP, { recursive: true, force: true });
  });

  it('renames hashed assets and rewrites mapDeps-style references', () => {
    const fakeRoot = TMP;
    mkdirSync(join(fakeRoot, 'dist', 'js'), { recursive: true });
    mkdirSync(join(fakeRoot, 'dist', 'assets'), { recursive: true });

    writeFileSync(join(fakeRoot, 'dist', 'assets', 'product-banners-C4UQKZLn.css'), 'body{}');
    writeFileSync(
      join(fakeRoot, 'dist', 'js', 'index-AbCdEfGh.js'),
      'const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["assets/product-banners-C4UQKZLn.css"])))=>i.map(i=>d[i]);'
    );

    const realCwd = process.cwd();
    process.chdir(fakeRoot);
    try {
      const plugin = lowercaseHashedAssetNames();
      // @ts-expect-error rollup hook context unused
      plugin.closeBundle();

      const assets = readdirSync(join(fakeRoot, 'dist', 'assets'));
      const jsFiles = readdirSync(join(fakeRoot, 'dist', 'js'));

      expect(assets).toContain('product-banners-c4uqkzln.css');
      expect(assets.some(f => f.includes('C4UQKZLn'))).toBe(false);

      expect(jsFiles).toContain('index-abcdefgh.js');
      expect(jsFiles.some(f => f.includes('AbCdEfGh'))).toBe(false);

      const idx = readFileSync(join(fakeRoot, 'dist', 'js', 'index-abcdefgh.js'), 'utf8');
      expect(idx).toContain('assets/product-banners-c4uqkzln.css');
      expect(idx).not.toContain('C4UQKZLn');
    } finally {
      process.chdir(realCwd);
    }
  });
});
