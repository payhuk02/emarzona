import { assertEquals, assertFalse, assertTrue } from 'https://deno.land/std@0.224.0/assert/mod.ts';
import { isDuplicateAuthUserError } from '../auth-admin-utils.ts';

Deno.test('isDuplicateAuthUserError detects already registered messages', () => {
  assertTrue(isDuplicateAuthUserError({ message: 'User already registered' }));
  assertTrue(isDuplicateAuthUserError({ message: 'Email exists in the system' }));
  assertFalse(isDuplicateAuthUserError({ message: 'Invalid email format' }));
  assertFalse(isDuplicateAuthUserError(null));
});

Deno.test('isDuplicateAuthUserError is case insensitive', () => {
  assertTrue(isDuplicateAuthUserError({ message: 'ALREADY REGISTERED' }));
});
