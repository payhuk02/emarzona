import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { AdvancedLoyaltyEngine } from '../advanced-loyalty-engine';

// Mocks
vi.mock('@/lib/logger', () => ({
  logger: {
    error: vi.fn(),
    info: vi.fn(),
    warn: vi.fn()
  }
}));

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          eq: vi.fn(() => ({
            gte: vi.fn(() => ({
              lte: vi.fn(() => ({
                order: vi.fn(() => ({
                  data: [],
                  error: null
                }))
              }))
            }))
          }))
        }))
      })),
      insert: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn(() => ({
            data: null,
            error: null
          }))
        }))
      })),
      update: vi.fn(() => ({
        eq: vi.fn(() => ({
          data: null,
          error: null
        }))
      }))
    }))
  }
}));

describe('AdvancedLoyaltyEngine', () => {
  let engine: AdvancedLoyaltyEngine;

  beforeEach(() => {
    engine = new AdvancedLoyaltyEngine();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('calculatePoints', () => {
    it('should calculate points correctly for a purchase event', async () => {
      const mockSupabase = vi.mocked(require('@/integrations/supabase/client').supabase);
      mockSupabase.from.mockReturnValue({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            eq: vi.fn(() => ({
              gte: vi.fn(() => ({
                lte: vi.fn(() => ({
                  order: vi.fn(() => Promise.resolve({
                    data: [{
                      id: 'rule-1',
                      name: 'Purchase Rule',
                      event_type: 'purchase',
                      points: 100,
                      conditions: null,
                      is_active: true,
                      priority: 1,
                      multiplier: null,
                      store_id: null
                    }],
                    error: null
                  }))
                }))
              }))
            }))
          }))
        }))
      });

      const points = await engine.calculatePoints('user-1', 'purchase', { orderId: 'order-123', total: 50 });

      expect(points).toBe(100);
    });

    it('should apply multiplier when conditions are met', async () => {
      const mockSupabase = vi.mocked(require('@/integrations/supabase/client').supabase);
      mockSupabase.from.mockReturnValue({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            eq: vi.fn(() => ({
              gte: vi.fn(() => ({
                lte: vi.fn(() => ({
                  order: vi.fn(() => Promise.resolve({
                    data: [{
                      id: 'rule-1',
                      name: 'High Value Purchase',
                      event_type: 'purchase',
                      points: 100,
                      conditions: null,
                      is_active: true,
                      priority: 1,
                      multiplier: 2,
                      store_id: null
                    }],
                    error: null
                  }))
                }))
              }))
            }))
          }))
        }))
      });

      const points = await engine.calculatePoints('user-1', 'purchase', { orderId: 'order-123', total: 100 });

      expect(points).toBe(200); // 100 * 2
    });

    it('should return 0 when no rules match', async () => {
      const mockSupabase = vi.mocked(require('@/integrations/supabase/client').supabase);
      mockSupabase.from.mockReturnValue({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            eq: vi.fn(() => ({
              gte: vi.fn(() => ({
                lte: vi.fn(() => ({
                  order: vi.fn(() => Promise.resolve({
                    data: [],
                    error: null
                  }))
                }))
              }))
            }))
          }))
        }))
      });

      const points = await engine.calculatePoints('user-1', 'review', { productId: 'prod-1' });

      expect(points).toBe(0);
    });
  });

  describe('awardPoints', () => {
    it('should successfully award points to a user', async () => {
      const mockSupabase = vi.mocked(require('@/integrations/supabase/client').supabase);
      const mockInsert = vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({
            data: {
              id: 'transaction-1',
              user_id: 'user-1',
              points: 100,
              type: 'earned',
              reason: 'Test points',
              created_at: new Date().toISOString()
            },
            error: null
          }))
        }))
      }));

      mockSupabase.from.mockReturnValue({
        insert: mockInsert,
        update: vi.fn(() => ({
          eq: vi.fn(() => Promise.resolve({
            data: null,
            error: null
          }))
        }))
      });

      const result = await engine.awardPoints('user-1', 100, 'Test points');

      expect(result.points).toBe(100);
      expect(result.type).toBe('earned');
      expect(result.reason).toBe('Test points');
      expect(mockInsert).toHaveBeenCalled();
    });

    it('should reject negative points', async () => {
      await expect(engine.awardPoints('user-1', -50, 'Negative points')).rejects.toThrow('Points must be positive');
    });
  });

  describe('redeemPoints', () => {
    it('should successfully redeem points', async () => {
      const mockSupabase = vi.mocked(require('@/integrations/supabase/client').supabase);

      // Mock profile check
      mockSupabase.from
        .mockReturnValueOnce({
          select: vi.fn(() => ({
            eq: vi.fn(() => Promise.resolve({
              data: [{
                user_id: 'user-1',
                points: 100,
                type: 'earned',
                expires_at: null
              }],
              error: null
            }))
          }))
        })
        // Mock insert transaction
        .mockReturnValueOnce({
          insert: vi.fn(() => ({
            select: vi.fn(() => ({
              single: vi.fn(() => Promise.resolve({
                data: {
                  id: 'transaction-1',
                  user_id: 'user-1',
                  points: -50,
                  type: 'spent',
                  reason: 'Redemption',
                  created_at: new Date().toISOString()
                },
                error: null
              }))
            }))
          })),
          update: vi.fn(() => ({
            eq: vi.fn(() => Promise.resolve({
              data: null,
              error: null
            }))
          }))
        });

      const result = await engine.redeemPoints('user-1', 50, 'Test redemption');

      expect(result.points).toBe(-50); // Négatif pour les dépenses
      expect(result.type).toBe('spent');
    });

    it('should reject redemption when insufficient balance', async () => {
      const mockSupabase = vi.mocked(require('@/integrations/supabase/client').supabase);

      mockSupabase.from.mockReturnValue({
        select: vi.fn(() => ({
          eq: vi.fn(() => Promise.resolve({
            data: [], // Pas de points disponibles
            error: null
          }))
        }))
      });

      await expect(engine.redeemPoints('user-1', 50, 'Redemption')).rejects.toThrow('Insufficient points balance');
    });
  });

  describe('getUserProfile', () => {
    it('should return user profile with calculated stats', async () => {
      const mockSupabase = vi.mocked(require('@/integrations/supabase/client').supabase);

      // Mock profile data
      mockSupabase.from
        .mockReturnValueOnce({
          select: vi.fn(() => ({
            eq: vi.fn(() => Promise.resolve({
              data: {
                user_id: 'user-1',
                total_points: 500,
                available_points: 450,
                spent_points: 50,
                current_tier_id: 'tier-1',
                referral_code: 'REF123ABC',
                preferences: { notificationsEnabled: true }
              },
              error: null
            }))
          }))
        })
        // Mock tiers data
        .mockReturnValueOnce({
          select: vi.fn(() => ({
            order: vi.fn(() => Promise.resolve({
              data: [{
                id: 'tier-1',
                name: 'Gold',
                description: 'Gold tier',
                level: 2,
                min_points: 200,
                max_points: 1000,
                benefits: [],
                badge_color: '#FFD700',
                badge_icon: 'star'
              }],
              error: null
            }))
          }))
        });

      const profile = await engine.getUserProfile('user-1');

      expect(profile.userId).toBe('user-1');
      expect(profile.totalPoints).toBe(500);
      expect(profile.availablePoints).toBe(450);
      expect(profile.currentTier.name).toBe('Gold');
    });

    it('should create default profile for new users', async () => {
      const mockSupabase = vi.mocked(require('@/integrations/supabase/client').supabase);

      mockSupabase.from
        .mockReturnValueOnce({
          select: vi.fn(() => ({
            eq: vi.fn(() => Promise.resolve({
              data: null, // Profil inexistant
              error: { code: 'PGRST116' }
            }))
          }))
        })
        .mockReturnValueOnce({
          select: vi.fn(() => ({
            order: vi.fn(() => Promise.resolve({
              data: [{
                id: 'tier-default',
                name: 'Bronze',
                description: 'Default tier',
                level: 1,
                min_points: 0,
                benefits: [],
                badge_color: '#CD7F32',
                badge_icon: 'star'
              }],
              error: null
            }))
          }))
        })
        .mockReturnValueOnce({
          insert: vi.fn(() => Promise.resolve({
            data: null,
            error: null
          }))
        });

      const profile = await engine.getUserProfile('new-user');

      expect(profile.userId).toBe('new-user');
      expect(profile.totalPoints).toBe(0);
      expect(profile.currentTier.name).toBe('Bronze');
      expect(profile.referralStats.referralCode).toMatch(/^REF/);
    });
  });

  describe('processLoyaltyEvent', () => {
    it('should process loyalty event and award points', async () => {
      const mockSupabase = vi.mocked(require('@/integrations/supabase/client').supabase);

      // Mock rules
      mockSupabase.from
        .mockReturnValueOnce({
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              eq: vi.fn(() => ({
                gte: vi.fn(() => ({
                  lte: vi.fn(() => ({
                    order: vi.fn(() => Promise.resolve({
                      data: [{
                        id: 'rule-1',
                        event_type: 'purchase',
                        points: 50,
                        is_active: true,
                        priority: 1
                      }],
                      error: null
                    }))
                  }))
                }))
              }))
            }))
          }))
        })
        // Mock awardPoints
        .mockReturnValueOnce({
          insert: vi.fn(() => ({
            select: vi.fn(() => ({
              single: vi.fn(() => Promise.resolve({
                data: {
                  id: 'transaction-1',
                  points: 50,
                  type: 'earned'
                },
                error: null
              }))
            }))
          })),
          update: vi.fn(() => ({
            eq: vi.fn(() => Promise.resolve({
              data: null,
              error: null
            }))
          }))
        });

      const result = await engine.processLoyaltyEvent('user-1', 'purchase', { orderId: 'order-123' });

      expect(result.pointsAwarded).toBe(50);
      expect(result.newTotalPoints).toBeGreaterThanOrEqual(50);
    });
  });

  describe('Caching', () => {
    it('should cache rules to avoid repeated database calls', async () => {
      const mockSupabase = vi.mocked(require('@/integrations/supabase/client').supabase);
      const mockQuery = vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            eq: vi.fn(() => ({
              gte: vi.fn(() => ({
                lte: vi.fn(() => ({
                  order: vi.fn(() => Promise.resolve({
                    data: [{
                      id: 'rule-1',
                      event_type: 'purchase',
                      points: 25,
                      is_active: true,
                      priority: 1
                    }],
                    error: null
                  }))
                }))
              }))
            }))
          }))
        }))
      }));

      mockSupabase.from.mockImplementation(mockQuery);

      // Premier appel
      await engine.calculatePoints('user-1', 'purchase', {});
      expect(mockQuery).toHaveBeenCalledTimes(1);

      // Deuxième appel - devrait utiliser le cache
      await engine.calculatePoints('user-1', 'purchase', {});
      expect(mockQuery).toHaveBeenCalledTimes(1); // Pas d'appel supplémentaire
    });
  });

  describe('Error Handling', () => {
    it('should handle database errors gracefully', async () => {
      const mockSupabase = vi.mocked(require('@/integrations/supabase/client').supabase);
      mockSupabase.from.mockReturnValue({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            eq: vi.fn(() => ({
              gte: vi.fn(() => ({
                lte: vi.fn(() => ({
                  order: vi.fn(() => Promise.resolve({
                    data: null,
                    error: { message: 'Database connection failed' }
                  }))
                }))
              }))
            }))
          }))
        }))
      });

      await expect(engine.calculatePoints('user-1', 'purchase', {})).rejects.toThrow();
    });
  });
});