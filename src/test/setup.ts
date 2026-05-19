/**
 * Setup pour les tests Vitest
 * Date : 27 octobre 2025
 */

import { expect, afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import * as matchers from '@testing-library/jest-dom/matchers';

// Extend Vitest's expect with jest-dom matchers
expect.extend(matchers);

// localStorage (jsdom / Node 22+ sans --localstorage-file)
const localStorageStore = new Map<string, string>();
const localStorageMock = {
  getItem: (key: string) => localStorageStore.get(key) ?? null,
  setItem: (key: string, value: string) => {
    localStorageStore.set(key, String(value));
  },
  removeItem: (key: string) => {
    localStorageStore.delete(key);
  },
  clear: () => {
    localStorageStore.clear();
  },
  get length() {
    return localStorageStore.size;
  },
  key: (index: number) => Array.from(localStorageStore.keys())[index] ?? null,
};

Object.defineProperty(globalThis, 'localStorage', {
  value: localStorageMock,
  writable: true,
  configurable: true,
});

// Cleanup after each test
afterEach(() => {
  cleanup();
});

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock IntersectionObserver (amélioré pour Radix UI)
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  observe() {}
  unobserve() {}
  disconnect() {}
} as unknown as typeof IntersectionObserver;

// Mock ResizeObserver (amélioré pour Radix UI)
global.ResizeObserver = class ResizeObserver {
  constructor() {}
  observe() {}
  unobserve() {}
  disconnect() {}
} as unknown as typeof ResizeObserver;

// Mock MutationObserver (nécessaire pour Radix UI)
global.MutationObserver = class MutationObserver {
  constructor() {}
  observe() {}
  disconnect() {}
  takeRecords() {
    return [];
  }
} as unknown as typeof MutationObserver;

// Mock hasPointerCapture pour Radix UI Select
if (typeof Element !== 'undefined') {
  Element.prototype.hasPointerCapture = vi.fn(() => false);
  Element.prototype.setPointerCapture = vi.fn();
  Element.prototype.releasePointerCapture = vi.fn();
}

// Mock scrollIntoView pour Radix UI Select
Element.prototype.scrollIntoView = vi.fn();

// Mock getBoundingClientRect pour Radix UI (positionnement)
Element.prototype.getBoundingClientRect = vi.fn(() => ({
  bottom: 0,
  height: 0,
  left: 0,
  right: 0,
  top: 0,
  width: 0,
  x: 0,
  y: 0,
  toJSON: vi.fn(),
}));

// Suppress console errors in tests
const originalError = console.error;
beforeAll(() => {
  console.error = (...args: unknown[]) => {
    if (
      typeof args[0] === 'string' &&
      args[0].includes('Not implemented: HTMLFormElement.prototype.requestSubmit')
    ) {
      return;
    }
    originalError.call(console, ...args);
  };
});

afterAll(() => {
  console.error = originalError;
});
