import { assertEquals } from 'https://deno.land/std@0.168.0/testing/asserts.ts';
import { isDuplicateAuthUserError } from '../auth-admin-utils.ts';

Deno.test('isDuplicateAuthUserError detects already registered messages', () => {
  assertEquals(isDuplicateAuthUserError({ message: 'User already registered' }), true);
  assertEquals(isDuplicateAuthUserError({ message: 'Email exists in the system' }), true);
  assertEquals(isDuplicateAuthUserError({ message: 'Invalid email format' }), false);
  assertEquals(isDuplicateAuthUserError(null), false);
});

Deno.test('isDuplicateAuthUserError is case insensitive', () => {
  assertEquals(isDuplicateAuthUserError({ message: 'ALREADY REGISTERED' }), true);
});
