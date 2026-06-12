import { describe, it, expect } from 'vitest';
import { buildCourseLearnUrl, resolveCourseLearnUrl } from '../course-learn-redirect';

describe('course-learn-redirect', () => {
  it('buildCourseLearnUrl', () => {
    expect(buildCourseLearnUrl('intro-react')).toBe('/learn/intro-react');
  });

  it('resolveCourseLearnUrl prefers slug', () => {
    expect(resolveCourseLearnUrl({ slug: 'abc', productId: 'p1' })).toBe('/learn/abc');
  });

  it('resolveCourseLearnUrl fallback product id', () => {
    expect(resolveCourseLearnUrl({ productId: 'p1' })).toBe('/courses/p1');
  });
});
