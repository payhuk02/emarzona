/**
 * LOT 4 — unit tests for analytics event batch buffer (no network).
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createEventBatchBuffer } from '@/lib/analytics/event-batch-buffer';

describe('createEventBatchBuffer', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    localStorage.removeItem('emarzona_analytics_batch');
  });

  afterEach(() => {
    vi.useRealTimers();
    localStorage.removeItem('emarzona_analytics_batch');
  });

  it('flushes when batch size is reached', async () => {
    const flushFn = vi.fn(async () => undefined);
    const buf = createEventBatchBuffer<{ id: number }>(flushFn, {
      name: 'test',
      maxBatchSize: 3,
      flushIntervalMs: 60_000,
    });

    buf.enqueue({ id: 1 });
    buf.enqueue({ id: 2 });
    expect(flushFn).not.toHaveBeenCalled();

    buf.enqueue({ id: 3 });
    await vi.waitFor(() => expect(flushFn).toHaveBeenCalledTimes(1));
    expect(flushFn.mock.calls[0][0]).toEqual([{ id: 1 }, { id: 2 }, { id: 3 }]);
  });

  it('flushes on interval', async () => {
    const flushFn = vi.fn(async () => undefined);
    const buf = createEventBatchBuffer<{ id: number }>(flushFn, {
      name: 'test',
      maxBatchSize: 50,
      flushIntervalMs: 5_000,
    });

    buf.enqueue({ id: 1 });
    expect(flushFn).not.toHaveBeenCalled();

    await vi.advanceTimersByTimeAsync(5_000);
    await vi.waitFor(() => expect(flushFn).toHaveBeenCalledTimes(1));
    expect(flushFn.mock.calls[0][0]).toEqual([{ id: 1 }]);
  });

  it('flushes immediately when requested', async () => {
    const flushFn = vi.fn(async () => undefined);
    const buf = createEventBatchBuffer<{ id: number }>(flushFn, {
      name: 'test',
      maxBatchSize: 50,
      flushIntervalMs: 60_000,
    });

    buf.enqueue({ id: 9 }, { immediate: true });
    await vi.waitFor(() => expect(flushFn).toHaveBeenCalledTimes(1));
    expect(flushFn.mock.calls[0][0]).toEqual([{ id: 9 }]);
  });
});
