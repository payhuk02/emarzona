import { afterEach, describe, expect, it } from 'vitest';
import {
  EXTERNAL_SCRIPT_INTEGRITY,
  resolveScriptIntegrity,
} from '@/lib/security/external-script-integrity';
import { loadExternalScript } from '@/lib/security/load-external-script';

describe('external script SRI', () => {
  afterEach(() => {
    document.head.innerHTML = '';
  });

  it('resolves integrity for registered static URLs', () => {
    expect(resolveScriptIntegrity('https://client.crisp.chat/l.js')).toBe(
      EXTERNAL_SCRIPT_INTEGRITY['https://client.crisp.chat/l.js']
    );
  });

  it('does not assign integrity for dynamic analytics URLs', () => {
    expect(
      resolveScriptIntegrity('https://www.googletagmanager.com/gtag/js?id=G-TEST')
    ).toBeUndefined();
  });

  it('injects script with integrity and crossOrigin when registered', () => {
    const script = loadExternalScript('https://client.crisp.chat/l.js', { id: 'crisp-test' });
    expect(script.integrity).toBe(EXTERNAL_SCRIPT_INTEGRITY['https://client.crisp.chat/l.js']);
    expect(script.crossOrigin).toBe('anonymous');
    expect(document.getElementById('crisp-test')).toBe(script);
  });

  it('reuses existing script element by id', () => {
    const first = loadExternalScript('https://client.crisp.chat/l.js', { id: 'crisp-dup' });
    const second = loadExternalScript('https://client.crisp.chat/l.js', { id: 'crisp-dup' });
    expect(second).toBe(first);
    expect(document.querySelectorAll('#crisp-dup')).toHaveLength(1);
  });
});
