import { describe, expect, it } from 'vitest';
import {
  getCustomerDigitalFileLabel,
  isGenericAutoLinkName,
} from '@/lib/digital/customer-file-label';

describe('customer-file-label', () => {
  it('uses vendor-provided names', () => {
    expect(getCustomerDigitalFileLabel('Module vidéo HD', 0)).toBe('Module vidéo HD');
  });

  it('falls back to numbered access label', () => {
    expect(getCustomerDigitalFileLabel('', 2)).toBe('Accédez au produit 3');
    expect(getCustomerDigitalFileLabel('Lien Google Drive', 0)).toBe('Accédez au produit 1');
  });

  it('detects generic auto names', () => {
    expect(isGenericAutoLinkName('Lien Google Drive')).toBe(true);
    expect(isGenericAutoLinkName('Fichier 2')).toBe(true);
    expect(isGenericAutoLinkName('Mon bonus PDF')).toBe(false);
  });
});
