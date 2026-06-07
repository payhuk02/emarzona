import { describe, expect, it } from 'vitest';
import {
  CONTEXT_SIDEBAR_LAYOUT_TYPES,
  LAYOUT_CONTEXT_SIDEBAR_MAP,
  getContextSidebarConfigId,
} from '@/config/contextSidebar.registry';
import { CONTEXT_SIDEBAR_CONFIGS } from '@/config/navigation.context';

describe('context sidebar registry', () => {
  it('maps every layout type to a valid config id', () => {
    for (const layoutType of CONTEXT_SIDEBAR_LAYOUT_TYPES) {
      const configId = getContextSidebarConfigId(layoutType);
      expect(configId, layoutType).toBeTruthy();
      expect(CONTEXT_SIDEBAR_CONFIGS[configId!], layoutType).toBeDefined();
    }
  });

  it('covers all 20 context sidebar layout types', () => {
    expect(CONTEXT_SIDEBAR_LAYOUT_TYPES).toHaveLength(20);
    expect(Object.keys(LAYOUT_CONTEXT_SIDEBAR_MAP)).toHaveLength(20);
  });

  it('returns null for layouts without a context sidebar', () => {
    expect(getContextSidebarConfigId('default')).toBeNull();
    expect(getContextSidebarConfigId('minimal')).toBeNull();
  });
});
