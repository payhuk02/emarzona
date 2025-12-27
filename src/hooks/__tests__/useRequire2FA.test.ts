/**
 * Tests pour le hook useRequire2FA
 * Couvre la vérification et l'obligation du 2FA pour les admins
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { useRequire2FA } from '@/hooks/useRequire2FA';

// Mock Supabase
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: {
      mfa: {
        listFactors: vi.fn().mockResolvedValue({
          data: {
            factors: [],
          },
          error: null,
        }),
      },
    },
  },
}));

// Mock AuthContext
vi.mock('@/contexts/AuthContext', () => ({
  useAuth: vi.fn(() => ({
    user: {
      id: 'test-user-id',
      email: 'admin@example.com',
      created_at: new Date().toISOString(),
    },
    profile: {
      role: 'admin',
      created_at: new Date().toISOString(),
    },
  })),
}));

// Mock useToast
vi.mock('@/hooks/use-toast', () => ({
  useToast: vi.fn(() => ({
    toast: vi.fn(),
  })),
}));

// Mock logger
vi.mock('@/lib/logger', () => ({
  logger: {
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
  },
}));

// Mock useNavigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useLocation: () => ({ pathname: '/dashboard' }),
  };
});

describe('useRequire2FA', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should initialize with loading state', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <BrowserRouter>{children}</BrowserRouter>
    );

    const { result } = renderHook(() => useRequire2FA(), { wrapper });

    expect(result.current).toBeDefined();
    expect(result.current.isLoading).toBe(true);
  });

  it('should return 2FA status for admin users', async () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <BrowserRouter>{children}</BrowserRouter>
    );

    const { result } = renderHook(() => useRequire2FA(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current).toBeDefined();
    expect(typeof result.current.is2FAEnabled).toBe('boolean');
    expect(typeof result.current.requires2FA).toBe('boolean');
    expect(typeof result.current.daysRemaining).toBe('number');
  });

  it('should handle non-admin users', async () => {
    const { useAuth } = await import('@/contexts/AuthContext');
    vi.mocked(useAuth).mockReturnValueOnce({
      user: {
        id: 'test-user-id',
        email: 'user@example.com',
        created_at: new Date().toISOString(),
      },
      profile: {
        role: 'customer',
        created_at: new Date().toISOString(),
      },
    } as any);

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <BrowserRouter>{children}</BrowserRouter>
    );

    const { result } = renderHook(() => useRequire2FA(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.requires2FA).toBe(false);
  });

  it('should handle errors gracefully', async () => {
    const { supabase } = await import('@/integrations/supabase/client');
    vi.mocked(supabase.auth.mfa.listFactors).mockResolvedValueOnce({
      data: { factors: [] },
      error: { message: 'Test error' },
    } as any);

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <BrowserRouter>{children}</BrowserRouter>
    );

    const { result } = renderHook(() => useRequire2FA(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current).toBeDefined();
  });
});

 * Tests pour le hook useRequire2FA
 * Couvre la vérification et l'obligation du 2FA pour les admins
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { useRequire2FA } from '@/hooks/useRequire2FA';

// Mock Supabase
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: {
      mfa: {
        listFactors: vi.fn().mockResolvedValue({
          data: {
            factors: [],
          },
          error: null,
        }),
      },
    },
  },
}));

// Mock AuthContext
vi.mock('@/contexts/AuthContext', () => ({
  useAuth: vi.fn(() => ({
    user: {
      id: 'test-user-id',
      email: 'admin@example.com',
      created_at: new Date().toISOString(),
    },
    profile: {
      role: 'admin',
      created_at: new Date().toISOString(),
    },
  })),
}));

// Mock useToast
vi.mock('@/hooks/use-toast', () => ({
  useToast: vi.fn(() => ({
    toast: vi.fn(),
  })),
}));

// Mock logger
vi.mock('@/lib/logger', () => ({
  logger: {
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
  },
}));

// Mock useNavigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useLocation: () => ({ pathname: '/dashboard' }),
  };
});

describe('useRequire2FA', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should initialize with loading state', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <BrowserRouter>{children}</BrowserRouter>
    );

    const { result } = renderHook(() => useRequire2FA(), { wrapper });

    expect(result.current).toBeDefined();
    expect(result.current.isLoading).toBe(true);
  });

  it('should return 2FA status for admin users', async () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <BrowserRouter>{children}</BrowserRouter>
    );

    const { result } = renderHook(() => useRequire2FA(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current).toBeDefined();
    expect(typeof result.current.is2FAEnabled).toBe('boolean');
    expect(typeof result.current.requires2FA).toBe('boolean');
    expect(typeof result.current.daysRemaining).toBe('number');
  });

  it('should handle non-admin users', async () => {
    const { useAuth } = await import('@/contexts/AuthContext');
    vi.mocked(useAuth).mockReturnValueOnce({
      user: {
        id: 'test-user-id',
        email: 'user@example.com',
        created_at: new Date().toISOString(),
      },
      profile: {
        role: 'customer',
        created_at: new Date().toISOString(),
      },
    } as any);

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <BrowserRouter>{children}</BrowserRouter>
    );

    const { result } = renderHook(() => useRequire2FA(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.requires2FA).toBe(false);
  });

  it('should handle errors gracefully', async () => {
    const { supabase } = await import('@/integrations/supabase/client');
    vi.mocked(supabase.auth.mfa.listFactors).mockResolvedValueOnce({
      data: { factors: [] },
      error: { message: 'Test error' },
    } as any);

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <BrowserRouter>{children}</BrowserRouter>
    );

    const { result } = renderHook(() => useRequire2FA(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current).toBeDefined();
  });
});

 * Tests pour le hook useRequire2FA
 * Couvre la vérification et l'obligation du 2FA pour les admins
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { useRequire2FA } from '@/hooks/useRequire2FA';

// Mock Supabase
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: {
      mfa: {
        listFactors: vi.fn().mockResolvedValue({
          data: {
            factors: [],
          },
          error: null,
        }),
      },
    },
  },
}));

// Mock AuthContext
vi.mock('@/contexts/AuthContext', () => ({
  useAuth: vi.fn(() => ({
    user: {
      id: 'test-user-id',
      email: 'admin@example.com',
      created_at: new Date().toISOString(),
    },
    profile: {
      role: 'admin',
      created_at: new Date().toISOString(),
    },
  })),
}));

// Mock useToast
vi.mock('@/hooks/use-toast', () => ({
  useToast: vi.fn(() => ({
    toast: vi.fn(),
  })),
}));

// Mock logger
vi.mock('@/lib/logger', () => ({
  logger: {
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
  },
}));

// Mock useNavigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useLocation: () => ({ pathname: '/dashboard' }),
  };
});

describe('useRequire2FA', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should initialize with loading state', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <BrowserRouter>{children}</BrowserRouter>
    );

    const { result } = renderHook(() => useRequire2FA(), { wrapper });

    expect(result.current).toBeDefined();
    expect(result.current.isLoading).toBe(true);
  });

  it('should return 2FA status for admin users', async () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <BrowserRouter>{children}</BrowserRouter>
    );

    const { result } = renderHook(() => useRequire2FA(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current).toBeDefined();
    expect(typeof result.current.is2FAEnabled).toBe('boolean');
    expect(typeof result.current.requires2FA).toBe('boolean');
    expect(typeof result.current.daysRemaining).toBe('number');
  });

  it('should handle non-admin users', async () => {
    const { useAuth } = await import('@/contexts/AuthContext');
    vi.mocked(useAuth).mockReturnValueOnce({
      user: {
        id: 'test-user-id',
        email: 'user@example.com',
        created_at: new Date().toISOString(),
      },
      profile: {
        role: 'customer',
        created_at: new Date().toISOString(),
      },
    } as any);

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <BrowserRouter>{children}</BrowserRouter>
    );

    const { result } = renderHook(() => useRequire2FA(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.requires2FA).toBe(false);
  });

  it('should handle errors gracefully', async () => {
    const { supabase } = await import('@/integrations/supabase/client');
    vi.mocked(supabase.auth.mfa.listFactors).mockResolvedValueOnce({
      data: { factors: [] },
      error: { message: 'Test error' },
    } as any);

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <BrowserRouter>{children}</BrowserRouter>
    );

    const { result } = renderHook(() => useRequire2FA(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current).toBeDefined();
  });
});

 * Tests pour le hook useRequire2FA
 * Couvre la vérification et l'obligation du 2FA pour les admins
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { useRequire2FA } from '@/hooks/useRequire2FA';

// Mock Supabase
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: {
      mfa: {
        listFactors: vi.fn().mockResolvedValue({
          data: {
            factors: [],
          },
          error: null,
        }),
      },
    },
  },
}));

// Mock AuthContext
vi.mock('@/contexts/AuthContext', () => ({
  useAuth: vi.fn(() => ({
    user: {
      id: 'test-user-id',
      email: 'admin@example.com',
      created_at: new Date().toISOString(),
    },
    profile: {
      role: 'admin',
      created_at: new Date().toISOString(),
    },
  })),
}));

// Mock useToast
vi.mock('@/hooks/use-toast', () => ({
  useToast: vi.fn(() => ({
    toast: vi.fn(),
  })),
}));

// Mock logger
vi.mock('@/lib/logger', () => ({
  logger: {
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
  },
}));

// Mock useNavigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useLocation: () => ({ pathname: '/dashboard' }),
  };
});

describe('useRequire2FA', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should initialize with loading state', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <BrowserRouter>{children}</BrowserRouter>
    );

    const { result } = renderHook(() => useRequire2FA(), { wrapper });

    expect(result.current).toBeDefined();
    expect(result.current.isLoading).toBe(true);
  });

  it('should return 2FA status for admin users', async () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <BrowserRouter>{children}</BrowserRouter>
    );

    const { result } = renderHook(() => useRequire2FA(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current).toBeDefined();
    expect(typeof result.current.is2FAEnabled).toBe('boolean');
    expect(typeof result.current.requires2FA).toBe('boolean');
    expect(typeof result.current.daysRemaining).toBe('number');
  });

  it('should handle non-admin users', async () => {
    const { useAuth } = await import('@/contexts/AuthContext');
    vi.mocked(useAuth).mockReturnValueOnce({
      user: {
        id: 'test-user-id',
        email: 'user@example.com',
        created_at: new Date().toISOString(),
      },
      profile: {
        role: 'customer',
        created_at: new Date().toISOString(),
      },
    } as any);

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <BrowserRouter>{children}</BrowserRouter>
    );

    const { result } = renderHook(() => useRequire2FA(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.requires2FA).toBe(false);
  });

  it('should handle errors gracefully', async () => {
    const { supabase } = await import('@/integrations/supabase/client');
    vi.mocked(supabase.auth.mfa.listFactors).mockResolvedValueOnce({
      data: { factors: [] },
      error: { message: 'Test error' },
    } as any);

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <BrowserRouter>{children}</BrowserRouter>
    );

    const { result } = renderHook(() => useRequire2FA(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current).toBeDefined();
  });
});

 * Tests pour le hook useRequire2FA
 * Couvre la vérification et l'obligation du 2FA pour les admins
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { useRequire2FA } from '@/hooks/useRequire2FA';

// Mock Supabase
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: {
      mfa: {
        listFactors: vi.fn().mockResolvedValue({
          data: {
            factors: [],
          },
          error: null,
        }),
      },
    },
  },
}));

// Mock AuthContext
vi.mock('@/contexts/AuthContext', () => ({
  useAuth: vi.fn(() => ({
    user: {
      id: 'test-user-id',
      email: 'admin@example.com',
      created_at: new Date().toISOString(),
    },
    profile: {
      role: 'admin',
      created_at: new Date().toISOString(),
    },
  })),
}));

// Mock useToast
vi.mock('@/hooks/use-toast', () => ({
  useToast: vi.fn(() => ({
    toast: vi.fn(),
  })),
}));

// Mock logger
vi.mock('@/lib/logger', () => ({
  logger: {
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
  },
}));

// Mock useNavigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useLocation: () => ({ pathname: '/dashboard' }),
  };
});

describe('useRequire2FA', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should initialize with loading state', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <BrowserRouter>{children}</BrowserRouter>
    );

    const { result } = renderHook(() => useRequire2FA(), { wrapper });

    expect(result.current).toBeDefined();
    expect(result.current.isLoading).toBe(true);
  });

  it('should return 2FA status for admin users', async () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <BrowserRouter>{children}</BrowserRouter>
    );

    const { result } = renderHook(() => useRequire2FA(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current).toBeDefined();
    expect(typeof result.current.is2FAEnabled).toBe('boolean');
    expect(typeof result.current.requires2FA).toBe('boolean');
    expect(typeof result.current.daysRemaining).toBe('number');
  });

  it('should handle non-admin users', async () => {
    const { useAuth } = await import('@/contexts/AuthContext');
    vi.mocked(useAuth).mockReturnValueOnce({
      user: {
        id: 'test-user-id',
        email: 'user@example.com',
        created_at: new Date().toISOString(),
      },
      profile: {
        role: 'customer',
        created_at: new Date().toISOString(),
      },
    } as any);

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <BrowserRouter>{children}</BrowserRouter>
    );

    const { result } = renderHook(() => useRequire2FA(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.requires2FA).toBe(false);
  });

  it('should handle errors gracefully', async () => {
    const { supabase } = await import('@/integrations/supabase/client');
    vi.mocked(supabase.auth.mfa.listFactors).mockResolvedValueOnce({
      data: { factors: [] },
      error: { message: 'Test error' },
    } as any);

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <BrowserRouter>{children}</BrowserRouter>
    );

    const { result } = renderHook(() => useRequire2FA(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current).toBeDefined();
  });
});

 * Tests pour le hook useRequire2FA
 * Couvre la vérification et l'obligation du 2FA pour les admins
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { useRequire2FA } from '@/hooks/useRequire2FA';

// Mock Supabase
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: {
      mfa: {
        listFactors: vi.fn().mockResolvedValue({
          data: {
            factors: [],
          },
          error: null,
        }),
      },
    },
  },
}));

// Mock AuthContext
vi.mock('@/contexts/AuthContext', () => ({
  useAuth: vi.fn(() => ({
    user: {
      id: 'test-user-id',
      email: 'admin@example.com',
      created_at: new Date().toISOString(),
    },
    profile: {
      role: 'admin',
      created_at: new Date().toISOString(),
    },
  })),
}));

// Mock useToast
vi.mock('@/hooks/use-toast', () => ({
  useToast: vi.fn(() => ({
    toast: vi.fn(),
  })),
}));

// Mock logger
vi.mock('@/lib/logger', () => ({
  logger: {
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
  },
}));

// Mock useNavigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useLocation: () => ({ pathname: '/dashboard' }),
  };
});

describe('useRequire2FA', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should initialize with loading state', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <BrowserRouter>{children}</BrowserRouter>
    );

    const { result } = renderHook(() => useRequire2FA(), { wrapper });

    expect(result.current).toBeDefined();
    expect(result.current.isLoading).toBe(true);
  });

  it('should return 2FA status for admin users', async () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <BrowserRouter>{children}</BrowserRouter>
    );

    const { result } = renderHook(() => useRequire2FA(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current).toBeDefined();
    expect(typeof result.current.is2FAEnabled).toBe('boolean');
    expect(typeof result.current.requires2FA).toBe('boolean');
    expect(typeof result.current.daysRemaining).toBe('number');
  });

  it('should handle non-admin users', async () => {
    const { useAuth } = await import('@/contexts/AuthContext');
    vi.mocked(useAuth).mockReturnValueOnce({
      user: {
        id: 'test-user-id',
        email: 'user@example.com',
        created_at: new Date().toISOString(),
      },
      profile: {
        role: 'customer',
        created_at: new Date().toISOString(),
      },
    } as any);

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <BrowserRouter>{children}</BrowserRouter>
    );

    const { result } = renderHook(() => useRequire2FA(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.requires2FA).toBe(false);
  });

  it('should handle errors gracefully', async () => {
    const { supabase } = await import('@/integrations/supabase/client');
    vi.mocked(supabase.auth.mfa.listFactors).mockResolvedValueOnce({
      data: { factors: [] },
      error: { message: 'Test error' },
    } as any);

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <BrowserRouter>{children}</BrowserRouter>
    );

    const { result } = renderHook(() => useRequire2FA(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current).toBeDefined();
  });
});

 * Tests pour le hook useRequire2FA
 * Couvre la vérification et l'obligation du 2FA pour les admins
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { useRequire2FA } from '@/hooks/useRequire2FA';

// Mock Supabase
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: {
      mfa: {
        listFactors: vi.fn().mockResolvedValue({
          data: {
            factors: [],
          },
          error: null,
        }),
      },
    },
  },
}));

// Mock AuthContext
vi.mock('@/contexts/AuthContext', () => ({
  useAuth: vi.fn(() => ({
    user: {
      id: 'test-user-id',
      email: 'admin@example.com',
      created_at: new Date().toISOString(),
    },
    profile: {
      role: 'admin',
      created_at: new Date().toISOString(),
    },
  })),
}));

// Mock useToast
vi.mock('@/hooks/use-toast', () => ({
  useToast: vi.fn(() => ({
    toast: vi.fn(),
  })),
}));

// Mock logger
vi.mock('@/lib/logger', () => ({
  logger: {
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
  },
}));

// Mock useNavigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useLocation: () => ({ pathname: '/dashboard' }),
  };
});

describe('useRequire2FA', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should initialize with loading state', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <BrowserRouter>{children}</BrowserRouter>
    );

    const { result } = renderHook(() => useRequire2FA(), { wrapper });

    expect(result.current).toBeDefined();
    expect(result.current.isLoading).toBe(true);
  });

  it('should return 2FA status for admin users', async () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <BrowserRouter>{children}</BrowserRouter>
    );

    const { result } = renderHook(() => useRequire2FA(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current).toBeDefined();
    expect(typeof result.current.is2FAEnabled).toBe('boolean');
    expect(typeof result.current.requires2FA).toBe('boolean');
    expect(typeof result.current.daysRemaining).toBe('number');
  });

  it('should handle non-admin users', async () => {
    const { useAuth } = await import('@/contexts/AuthContext');
    vi.mocked(useAuth).mockReturnValueOnce({
      user: {
        id: 'test-user-id',
        email: 'user@example.com',
        created_at: new Date().toISOString(),
      },
      profile: {
        role: 'customer',
        created_at: new Date().toISOString(),
      },
    } as any);

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <BrowserRouter>{children}</BrowserRouter>
    );

    const { result } = renderHook(() => useRequire2FA(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.requires2FA).toBe(false);
  });

  it('should handle errors gracefully', async () => {
    const { supabase } = await import('@/integrations/supabase/client');
    vi.mocked(supabase.auth.mfa.listFactors).mockResolvedValueOnce({
      data: { factors: [] },
      error: { message: 'Test error' },
    } as any);

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <BrowserRouter>{children}</BrowserRouter>
    );

    const { result } = renderHook(() => useRequire2FA(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current).toBeDefined();
  });
});

 * Tests pour le hook useRequire2FA
 * Couvre la vérification et l'obligation du 2FA pour les admins
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { useRequire2FA } from '@/hooks/useRequire2FA';

// Mock Supabase
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: {
      mfa: {
        listFactors: vi.fn().mockResolvedValue({
          data: {
            factors: [],
          },
          error: null,
        }),
      },
    },
  },
}));

// Mock AuthContext
vi.mock('@/contexts/AuthContext', () => ({
  useAuth: vi.fn(() => ({
    user: {
      id: 'test-user-id',
      email: 'admin@example.com',
      created_at: new Date().toISOString(),
    },
    profile: {
      role: 'admin',
      created_at: new Date().toISOString(),
    },
  })),
}));

// Mock useToast
vi.mock('@/hooks/use-toast', () => ({
  useToast: vi.fn(() => ({
    toast: vi.fn(),
  })),
}));

// Mock logger
vi.mock('@/lib/logger', () => ({
  logger: {
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
  },
}));

// Mock useNavigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useLocation: () => ({ pathname: '/dashboard' }),
  };
});

describe('useRequire2FA', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should initialize with loading state', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <BrowserRouter>{children}</BrowserRouter>
    );

    const { result } = renderHook(() => useRequire2FA(), { wrapper });

    expect(result.current).toBeDefined();
    expect(result.current.isLoading).toBe(true);
  });

  it('should return 2FA status for admin users', async () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <BrowserRouter>{children}</BrowserRouter>
    );

    const { result } = renderHook(() => useRequire2FA(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current).toBeDefined();
    expect(typeof result.current.is2FAEnabled).toBe('boolean');
    expect(typeof result.current.requires2FA).toBe('boolean');
    expect(typeof result.current.daysRemaining).toBe('number');
  });

  it('should handle non-admin users', async () => {
    const { useAuth } = await import('@/contexts/AuthContext');
    vi.mocked(useAuth).mockReturnValueOnce({
      user: {
        id: 'test-user-id',
        email: 'user@example.com',
        created_at: new Date().toISOString(),
      },
      profile: {
        role: 'customer',
        created_at: new Date().toISOString(),
      },
    } as any);

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <BrowserRouter>{children}</BrowserRouter>
    );

    const { result } = renderHook(() => useRequire2FA(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.requires2FA).toBe(false);
  });

  it('should handle errors gracefully', async () => {
    const { supabase } = await import('@/integrations/supabase/client');
    vi.mocked(supabase.auth.mfa.listFactors).mockResolvedValueOnce({
      data: { factors: [] },
      error: { message: 'Test error' },
    } as any);

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <BrowserRouter>{children}</BrowserRouter>
    );

    const { result } = renderHook(() => useRequire2FA(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current).toBeDefined();
  });
});

 * Tests pour le hook useRequire2FA
 * Couvre la vérification et l'obligation du 2FA pour les admins
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { useRequire2FA } from '@/hooks/useRequire2FA';

// Mock Supabase
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: {
      mfa: {
        listFactors: vi.fn().mockResolvedValue({
          data: {
            factors: [],
          },
          error: null,
        }),
      },
    },
  },
}));

// Mock AuthContext
vi.mock('@/contexts/AuthContext', () => ({
  useAuth: vi.fn(() => ({
    user: {
      id: 'test-user-id',
      email: 'admin@example.com',
      created_at: new Date().toISOString(),
    },
    profile: {
      role: 'admin',
      created_at: new Date().toISOString(),
    },
  })),
}));

// Mock useToast
vi.mock('@/hooks/use-toast', () => ({
  useToast: vi.fn(() => ({
    toast: vi.fn(),
  })),
}));

// Mock logger
vi.mock('@/lib/logger', () => ({
  logger: {
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
  },
}));

// Mock useNavigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useLocation: () => ({ pathname: '/dashboard' }),
  };
});

describe('useRequire2FA', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should initialize with loading state', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <BrowserRouter>{children}</BrowserRouter>
    );

    const { result } = renderHook(() => useRequire2FA(), { wrapper });

    expect(result.current).toBeDefined();
    expect(result.current.isLoading).toBe(true);
  });

  it('should return 2FA status for admin users', async () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <BrowserRouter>{children}</BrowserRouter>
    );

    const { result } = renderHook(() => useRequire2FA(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current).toBeDefined();
    expect(typeof result.current.is2FAEnabled).toBe('boolean');
    expect(typeof result.current.requires2FA).toBe('boolean');
    expect(typeof result.current.daysRemaining).toBe('number');
  });

  it('should handle non-admin users', async () => {
    const { useAuth } = await import('@/contexts/AuthContext');
    vi.mocked(useAuth).mockReturnValueOnce({
      user: {
        id: 'test-user-id',
        email: 'user@example.com',
        created_at: new Date().toISOString(),
      },
      profile: {
        role: 'customer',
        created_at: new Date().toISOString(),
      },
    } as any);

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <BrowserRouter>{children}</BrowserRouter>
    );

    const { result } = renderHook(() => useRequire2FA(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.requires2FA).toBe(false);
  });

  it('should handle errors gracefully', async () => {
    const { supabase } = await import('@/integrations/supabase/client');
    vi.mocked(supabase.auth.mfa.listFactors).mockResolvedValueOnce({
      data: { factors: [] },
      error: { message: 'Test error' },
    } as any);

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <BrowserRouter>{children}</BrowserRouter>
    );

    const { result } = renderHook(() => useRequire2FA(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current).toBeDefined();
  });
});

 * Tests pour le hook useRequire2FA
 * Couvre la vérification et l'obligation du 2FA pour les admins
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { useRequire2FA } from '@/hooks/useRequire2FA';

// Mock Supabase
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: {
      mfa: {
        listFactors: vi.fn().mockResolvedValue({
          data: {
            factors: [],
          },
          error: null,
        }),
      },
    },
  },
}));

// Mock AuthContext
vi.mock('@/contexts/AuthContext', () => ({
  useAuth: vi.fn(() => ({
    user: {
      id: 'test-user-id',
      email: 'admin@example.com',
      created_at: new Date().toISOString(),
    },
    profile: {
      role: 'admin',
      created_at: new Date().toISOString(),
    },
  })),
}));

// Mock useToast
vi.mock('@/hooks/use-toast', () => ({
  useToast: vi.fn(() => ({
    toast: vi.fn(),
  })),
}));

// Mock logger
vi.mock('@/lib/logger', () => ({
  logger: {
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
  },
}));

// Mock useNavigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useLocation: () => ({ pathname: '/dashboard' }),
  };
});

describe('useRequire2FA', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should initialize with loading state', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <BrowserRouter>{children}</BrowserRouter>
    );

    const { result } = renderHook(() => useRequire2FA(), { wrapper });

    expect(result.current).toBeDefined();
    expect(result.current.isLoading).toBe(true);
  });

  it('should return 2FA status for admin users', async () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <BrowserRouter>{children}</BrowserRouter>
    );

    const { result } = renderHook(() => useRequire2FA(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current).toBeDefined();
    expect(typeof result.current.is2FAEnabled).toBe('boolean');
    expect(typeof result.current.requires2FA).toBe('boolean');
    expect(typeof result.current.daysRemaining).toBe('number');
  });

  it('should handle non-admin users', async () => {
    const { useAuth } = await import('@/contexts/AuthContext');
    vi.mocked(useAuth).mockReturnValueOnce({
      user: {
        id: 'test-user-id',
        email: 'user@example.com',
        created_at: new Date().toISOString(),
      },
      profile: {
        role: 'customer',
        created_at: new Date().toISOString(),
      },
    } as any);

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <BrowserRouter>{children}</BrowserRouter>
    );

    const { result } = renderHook(() => useRequire2FA(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.requires2FA).toBe(false);
  });

  it('should handle errors gracefully', async () => {
    const { supabase } = await import('@/integrations/supabase/client');
    vi.mocked(supabase.auth.mfa.listFactors).mockResolvedValueOnce({
      data: { factors: [] },
      error: { message: 'Test error' },
    } as any);

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <BrowserRouter>{children}</BrowserRouter>
    );

    const { result } = renderHook(() => useRequire2FA(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current).toBeDefined();
  });
});








