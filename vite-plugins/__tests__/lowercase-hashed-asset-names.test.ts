import { describe, it, expect } from 'vitest';
import { lowercaseHashedAssetNames } from '../lowercase-hashed-asset-names';

describe('lowercaseHashedAssetNames', () => {
  it('lowercases mixed-case content hashes and rewrites chunk imports', () => {
    const plugin = lowercaseHashedAssetNames();
    const generateBundle = plugin.generateBundle;
    expect(typeof generateBundle).toBe('function');

    const bundle: Record<
      string,
      | { type: 'chunk'; fileName: string; code: string }
      | { type: 'asset'; fileName: string; source: string }
    > = {
      'js/scroll-area-DgOUHq0B.js': {
        type: 'chunk',
        fileName: 'js/scroll-area-DgOUHq0B.js',
        code: 'export default 1',
      },
      'js/index-AbCdEfGh.js': {
        type: 'chunk',
        fileName: 'js/index-AbCdEfGh.js',
        code: 'import("./scroll-area-DgOUHq0B.js")',
      },
    };

    // @ts-expect-error minimal rollup context for unit test
    generateBundle.call(
      {
        error: (m: string) => {
          throw new Error(m);
        },
      },
      {},
      bundle
    );

    expect(bundle['js/scroll-area-DgOUHq0B.js']).toBeUndefined();
    expect(bundle['js/scroll-area-dgouhq0b.js']).toBeDefined();
    expect(bundle['js/index-abcdefgh.js']?.type).toBe('chunk');
    if (bundle['js/index-abcdefgh.js']?.type === 'chunk') {
      expect(bundle['js/index-abcdefgh.js'].code).toContain('scroll-area-dgouhq0b.js');
      expect(bundle['js/index-abcdefgh.js'].code).not.toContain('DgOUHq0B');
    }
  });
});
