import { describe, it, expect, beforeAll } from 'vitest';
import { generateKeyPairSync } from 'node:crypto';
import { JwtTokenSignerAdapter } from '@infra/auth/adapters/jwt-token-signer.adapter.js';

let privateKey: string;
let publicKey: string;

beforeAll(() => {
  const pair = generateKeyPairSync('rsa', {
    modulusLength: 2048,
    publicKeyEncoding: { type: 'spki', format: 'pem' },
    privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
  });
  privateKey = pair.privateKey;
  publicKey = pair.publicKey;
});

describe('JwtTokenSignerAdapter', () => {
  describe('sign + verify round-trip', () => {
    it('signs and verifies a token, preserving the payload', () => {
      const adapter = new JwtTokenSignerAdapter(privateKey, publicKey);
      const payload = { sub: 'user-123', email: 'alice@example.com' };

      const token = adapter.sign(payload, '1h');
      const decoded = adapter.verify(token);

      expect(decoded.sub).toBe(payload.sub);
      expect(decoded.email).toBe(payload.email);
    });
  });

  describe('verify failures', () => {
    it('throws when verifying with the wrong public key', () => {
      const otherPair = generateKeyPairSync('rsa', {
        modulusLength: 2048,
        publicKeyEncoding: { type: 'spki', format: 'pem' },
        privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
      });

      const signerA = new JwtTokenSignerAdapter(privateKey, publicKey);
      const verifierWithWrongKey = new JwtTokenSignerAdapter(
        otherPair.privateKey,
        otherPair.publicKey,
      );

      const token = signerA.sign({ sub: 'u-1', email: 'a@b.com' }, '1h');

      expect(() => verifierWithWrongKey.verify(token)).toThrow();
    });

    it('throws when the token has expired', async () => {
      const adapter = new JwtTokenSignerAdapter(privateKey, publicKey);
      // Use a negative expiresIn value to create an immediately expired token
      const token = adapter.sign({ sub: 'u-1', email: 'a@b.com' }, '-1s');

      expect(() => adapter.verify(token)).toThrow();
    });

    it('throws when the token has been tampered with', () => {
      const adapter = new JwtTokenSignerAdapter(privateKey, publicKey);
      const token = adapter.sign({ sub: 'u-1', email: 'a@b.com' }, '1h');

      // Tamper with the payload section (middle part)
      const parts = token.split('.');
      const tamperedPayload = Buffer.from(
        JSON.stringify({ sub: 'hacker', email: 'evil@bad.com' }),
      ).toString('base64url');
      const tamperedToken = `${parts[0]}.${tamperedPayload}.${parts[2]}`;

      expect(() => adapter.verify(tamperedToken)).toThrow();
    });
  });
});
