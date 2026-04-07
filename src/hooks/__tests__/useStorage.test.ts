import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useStorage, useLocalStorage, useSessionStorage } from '../useStorage';

// Mock localStorage and sessionStorage
const localStorageMock = (() => {
  let  store: Record<string, string> = {};

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

const sessionStorageMock = (() => {
  let  store: Record<string, string> = {};

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

Object.defineProperty(window, 'sessionStorage', {
  value: sessionStorageMock,
});

describe('useStorage', () => {
  beforeEach(() => {
    localStorageMock.clear();
    sessionStorageMock.clear();
  });

  it('should return initial value when storage is empty', () => {
    const { result } = renderHook(() =>
      useStorage('test-key', 'initial-value')
    );

    expect(result.current[0]).toBe('initial-value');
  });

  it('should read existing value from localStorage', () => {
    localStorageMock.setItem('test-key', JSON.stringify('stored-value'));

    const { result } = renderHook(() =>
      useStorage('test-key', 'initial-value', { storageType: 'local' })
    );

    expect(result.current[0]).toBe('stored-value');
  });

  it('should read existing value from sessionStorage', () => {
    sessionStorageMock.setItem('test-key', JSON.stringify('stored-value'));

    const { result } = renderHook(() =>
      useStorage('test-key', 'initial-value', { storageType: 'session' })
    );

    expect(result.current[0]).toBe('stored-value');
  });

  it('should update value in localStorage', () => {
    const { result } = renderHook(() =>
      useStorage('test-key', 'initial', { storageType: 'local' })
    );

    act(() => {
      result.current[1]('updated');
    });

    expect(result.current[0]).toBe('updated');
    expect(localStorageMock.getItem('test-key')).toBe(JSON.stringify('updated'));
  });

  it('should update value in sessionStorage', () => {
    const { result } = renderHook(() =>
      useStorage('test-key', 'initial', { storageType: 'session' })
    );

    act(() => {
      result.current[1]('updated');
    });

    expect(result.current[0]).toBe('updated');
    expect(sessionStorageMock.getItem('test-key')).toBe(JSON.stringify('updated'));
  });

  it('should support functional updates', () => {
    const { result } = renderHook(() =>
      useStorage('test-key', 0, { storageType: 'local' })
    );

    act(() => {
      result.current[1]((prev) => prev + 1);
    });

    expect(result.current[0]).toBe(1);

    act(() => {
      result.current[1]((prev) => prev + 1);
    });

    expect(result.current[0]).toBe(2);
  });

  it('should remove value from storage', () => {
    localStorageMock.setItem('test-key', JSON.stringify('stored'));
    const { result } = renderHook(() =>
      useStorage('test-key', 'initial', { storageType: 'local' })
    );

    act(() => {
      result.current[2](); // removeValue
    });

    expect(result.current[0]).toBe('initial');
    expect(localStorageMock.getItem('test-key')).toBeNull();
  });

  it('should handle complex objects', () => {
    const initialValue = { name: 'Test', count: 42 };
    const updatedValue = { name: 'Updated', count: 100 };

    const { result } = renderHook(() =>
      useStorage('test-key', initialValue, { storageType: 'local' })
    );

    act(() => {
      result.current[1](updatedValue);
    });

    expect(result.current[0]).toEqual(updatedValue);
    expect(JSON.parse(localStorageMock.getItem('test-key')!)).toEqual(updatedValue);
  });

  it('should call onUpdate callback when value changes', () => {
    const onUpdate = vi.fn();
    const { result } = renderHook(() =>
      useStorage('test-key', 'initial', {
        storageType: 'local',
        onUpdate,
      })
    );

    act(() => {
      result.current[1]('updated');
    });

    expect(onUpdate).toHaveBeenCalledWith('updated');
  });

  it('should handle custom serializer', () => {
    const serializer = {
      read: (value: string) => value.split(',').map(Number),
      write: (value: number[]) => value.join(','),
    };

    const { result } = renderHook(() =>
      useStorage('test-key', [1, 2, 3], {
        storageType: 'local',
        serializer,
      })
    );

    act(() => {
      result.current[1]([4, 5, 6]);
    });

    expect(result.current[0]).toEqual([4, 5, 6]);
    expect(localStorageMock.getItem('test-key')).toBe('4,5,6');
  });

  it('should handle storage errors gracefully', () => {
    const getItemSpy = vi.spyOn(localStorageMock, 'getItem').mockImplementation(() => {
      throw new Error('Storage error');
    });

    const { result } = renderHook(() =>
      useStorage('test-key', 'fallback', { storageType: 'local' })
    );

    // Should fallback to initial value
    expect(result.current[0]).toBe('fallback');

    getItemSpy.mockRestore();
  });
});

describe('useLocalStorage', () => {
  beforeEach(() => {
    localStorageMock.clear();
  });

  it('should use localStorage by default', () => {
    const { result } = renderHook(() =>
      useLocalStorage('test-key', 'initial')
    );

    act(() => {
      result.current[1]('updated');
    });

    expect(localStorageMock.getItem('test-key')).toBe(JSON.stringify('updated'));
    expect(sessionStorageMock.getItem('test-key')).toBeNull();
  });
});

describe('useSessionStorage', () => {
  beforeEach(() => {
    sessionStorageMock.clear();
    localStorageMock.clear();
  });

  it('should use sessionStorage by default', () => {
    const { result } = renderHook(() =>
      useSessionStorage('test-key', 'initial')
    );

    act(() => {
      result.current[1]('updated');
    });

    expect(sessionStorageMock.getItem('test-key')).toBe(JSON.stringify('updated'));
    expect(localStorageMock.getItem('test-key')).toBeNull();
  });
});







