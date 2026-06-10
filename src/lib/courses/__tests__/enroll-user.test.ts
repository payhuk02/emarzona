import { describe, expect, it } from 'vitest';
import { mapCourseEnrollmentError } from '@/lib/courses/enroll-user';

describe('mapCourseEnrollmentError', () => {
  it('maps access denied codes', () => {
    expect(mapCourseEnrollmentError('ENROLLMENT_ACCESS_DENIED')).toContain('Accès refusé');
  });

  it('maps unauthorized', () => {
    expect(mapCourseEnrollmentError('UNAUTHORIZED')).toContain('connecté');
  });

  it('returns unknown messages as-is', () => {
    expect(mapCourseEnrollmentError('Network error')).toBe('Network error');
  });
});
