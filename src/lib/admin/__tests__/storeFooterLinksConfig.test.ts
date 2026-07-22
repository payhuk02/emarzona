import { describe, expect, it } from 'vitest';
import {
  hasLegalPageContent,
  listConfiguredLegalFooterLinks,
} from '@/lib/admin/storeFooterLinksConfig';
import type { StoreLegalPages } from '@/hooks/useStores';

describe('storeFooterLinksConfig legal pages', () => {
  it('ignores empty or whitespace-only legal fields', () => {
    const pages: StoreLegalPages = {
      terms_of_service: '   ',
      privacy_policy: '',
      refund_policy: 'Politique de remboursement',
    };

    expect(hasLegalPageContent(pages, 'terms_of_service')).toBe(false);
    expect(hasLegalPageContent(pages, 'privacy_policy')).toBe(false);
    expect(hasLegalPageContent(pages, 'refund_policy')).toBe(true);

    const links = listConfiguredLegalFooterLinks(pages);
    expect(links.map(l => l.path)).toEqual(['refund']);
  });

  it('includes disclaimer when configured', () => {
    const links = listConfiguredLegalFooterLinks({
      disclaimer: 'Contenu avertissement',
    });
    expect(links.some(l => l.path === 'disclaimer')).toBe(true);
  });
});
