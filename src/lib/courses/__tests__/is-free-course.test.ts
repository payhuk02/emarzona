import { describe, expect, it } from 'vitest';
import { isFreeCourse } from '@/lib/courses/is-free-course';

describe('isFreeCourse', () => {
  it('returns true for pricing_model free', () => {
    expect(isFreeCourse({ pricing_model: 'free', price: 100 })).toBe(true);
  });

  it('returns true for zero effective price', () => {
    expect(isFreeCourse({ pricing_model: 'one-time', price: 0 })).toBe(true);
    expect(isFreeCourse({ pricing_model: 'one-time', price: 5000, promotional_price: 0 })).toBe(
      true
    );
  });

  it('returns false for paid courses', () => {
    expect(isFreeCourse({ pricing_model: 'one-time', price: 9900 })).toBe(false);
  });
});
