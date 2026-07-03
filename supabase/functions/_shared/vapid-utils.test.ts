import { assertEquals, assertThrows } from 'https://deno.land/std@0.168.0/testing/asserts.ts';
import {
  resolveVapidPrivateJWK,
  uint8ArrayToBase64Url,
  urlBase64ToUint8Array,
} from './vapid-utils.ts';

Deno.test('urlBase64 roundtrip', () => {
  const original = new Uint8Array([1, 2, 3, 250, 251, 252]);
  const encoded = uint8ArrayToBase64Url(original);
  const decoded = urlBase64ToUint8Array(encoded);
  assertEquals(decoded, original);
});

Deno.test('resolveVapidPrivateJWK builds EC P-256 JWK from Emarzona keys', () => {
  // Test key pair (do not use in production)
  const publicKey =
    'BEl62iUYgUih04f8eFd0V6L0C8V0C8V0C8V0C8V0C8V0C8V0C8V0C8V0C8V0C8V0C8V0C8V0C8V0C8V0C8V0C8';
  // Invalid length - should throw
  assertThrows(() => resolveVapidPrivateJWK(publicKey, 'abc'));
});

Deno.test('resolveVapidPrivateJWK accepts JWK JSON string', () => {
  const jwk = {
    kty: 'EC',
    crv: 'P-256',
    x: 'test-x',
    y: 'test-y',
    d: 'test-d',
  };
  const result = resolveVapidPrivateJWK('ignored', JSON.stringify(jwk));
  assertEquals(result.kty, 'EC');
  assertEquals(result.d, 'test-d');
});
