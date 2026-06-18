import { describe, it, expect } from 'vitest';
import { mapRemainingDownloadsResult } from '@/lib/digital/remaining-downloads';

describe('mapRemainingDownloadsResult', () => {
  it('illimité quand download_limit = -1', () => {
    const result = mapRemainingDownloadsResult(-1, 5);
    expect(result.unlimited).toBe(true);
    expect(result.hasRemainingDownloads).toBe(true);
  });

  it('bloque à 0 téléchargement restant', () => {
    const result = mapRemainingDownloadsResult(3, 0);
    expect(result.unlimited).toBe(false);
    expect(result.remaining).toBe(0);
    expect(result.hasRemainingDownloads).toBe(false);
    expect(result.downloadCount).toBe(3);
  });

  it('calcule les téléchargements consommés', () => {
    const result = mapRemainingDownloadsResult(5, 2);
    expect(result.remaining).toBe(2);
    expect(result.downloadCount).toBe(3);
    expect(result.limit).toBe(5);
  });
});
